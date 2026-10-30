/**
 * AUDITORÍA DE RESIDUALES — VERIFICACIÓN E2E CONTRA EMULADORES
 *
 * Comprueba los tres cierres que no se pueden validar solo con las
 * reglas:
 *
 *   1. CUPO DE COMENTARIOS RECOMPENSADOS
 *      · 10 comentarios en la misma ventana de 10 minutos cobran XP
 *        y suman a `stats.commentsCreated`;
 *      · el comentario 11 se publica y cuenta en el objetivo, pero
 *        no paga;
 *      · un autor con el cupo diario agotado tampoco cobra.
 *
 *   2. TRASPASO DE UN GRUPO
 *      · al cambiar `ownerId`, el trigger borra las solicitudes
 *        pendientes que apuntaban al dueño anterior;
 *      · respeta las solicitudes históricas y las de otros emisores;
 *      · repara el índice `groupCodes` si el cliente lo dejó viejo.
 *
 *   3. ACEPTAR CON BLOQUEOS
 *      · si el emisor bloqueó al receptor, aceptar se rechaza;
 *      · si el receptor bloqueó al emisor, aceptar funciona y quita
 *        el bloqueo (es la forma explícita de desbloquear).
 *
 *   4. BLOQUEO EN UN CHAT DIRECTO YA EXISTENTE
 *      · antes del bloqueo se puede escribir;
 *      · con el bloqueo, ni el bloqueado ni el bloqueador escriben;
 *      · al desbloquear vuelve a funcionar;
 *      · un grupo con la misma pareja sigue funcionando.
 *
 * Salvaguardas: solo proyecto demo-* y emuladores. No despliega nada
 * ni toca producción.
 *
 * Ejecución:
 *   npx firebase emulators:exec --only firestore,auth,functions \
 *     --project demo-geekapoo-auditoria \
 *     "node scripts/auditoria-residuales.mjs"
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT =
  process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FUNCTIONS_EMULATOR = 'http://127.0.0.1:5001';
const REGION = 'us-central1';
const TIMEOUT_MS = 120_000;

if (!PROJECT.startsWith('demo-')) {
  throw new Error(
    `Abortado: el proyecto "${PROJECT}" no es de demo. Estas pruebas solo corren contra emuladores.`,
  );
}
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    'Abortado: falta FIRESTORE_EMULATOR_HOST. Ejecuta esto con firebase emulators:exec.',
  );
}

const requireFromFunctions = createRequire(
  path.join(process.cwd(), 'functions', 'package.json'),
);
const admin = requireFromFunctions('firebase-admin');
admin.initializeApp({ projectId: PROJECT });
const dbAdmin = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const resultados = [];

function registrar(caso, estado, detalle) {
  resultados.push({ caso, estado, detalle });
  const icono = estado === 'OK' ? 'ok' : '??';
  console.log(`[${icono}] ${caso}: ${estado} — ${detalle}`);
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function esperarHasta(descripcion, fn, timeout = 45_000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeout) {
    if (await fn()) return true;
    await esperar(400);
  }
  registrar(descripcion, 'ERROR', `no se cumplió en ${timeout / 1000} s`);
  return false;
}

async function signUp(email) {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Auditoria123!',
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = await res.json();
  if (!json.idToken || !json.localId) {
    throw new Error(`No se pudo crear ${email}: ${JSON.stringify(json)}`);
  }
  return { uid: json.localId, token: json.idToken, email };
}

async function sembrarUsuario(cuenta, extra = {}) {
  await dbAdmin.doc(`users/${cuenta.uid}`).set(
    {
      uid: cuenta.uid,
      username: cuenta.email.split('@')[0],
      displayName: cuenta.email.split('@')[0],
      avatarUrl: '',
      chatId: `GK-${cuenta.uid.slice(0, 8)}`,
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      isBanned: false,
      ...extra,
    },
    { merge: true },
  );
}

async function llamar(nombre, token, data = {}) {
  const res = await fetch(
    `${FUNCTIONS_EMULATOR}/${PROJECT}/${REGION}/${nombre}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const texto = await res.text();
  let cuerpo;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    cuerpo = { crudo: texto.slice(0, 500) };
  }
  return { status: res.status, body: cuerpo };
}

function estadoError(respuesta) {
  return respuesta.body?.error?.status || respuesta.body?.error?.code || 'SIN_ESTADO';
}

function mensajeError(respuesta) {
  return respuesta.body?.error?.message || JSON.stringify(respuesta.body).slice(0, 300);
}

/** Cliente de Firestore autenticado como una cuenta ya creada por REST. */
async function clienteDe(cuenta, nombreApp) {
  const app = initializeApp(
    {
      apiKey: 'demo-key',
      projectId: PROJECT,
      authDomain: `${PROJECT}.firebaseapp.com`,
    },
    nombreApp,
  );

  const auth = getAuth(app);
  connectAuthEmulator(auth, AUTH_EMULATOR, { disableWarnings: true });
  await signInWithEmailAndPassword(auth, cuenta.email, 'Auditoria123!');

  const db = getFirestore(app);
  const [host, puerto] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(puerto));

  return { db, auth };
}

const OBJETIVO_COMENTARIOS = 'auditoria-cupo-comentarios';

async function crearComentario(db, uid, nombre, n) {
  return addDoc(collection(db, 'comments'), {
    authorId: uid,
    authorName: nombre,
    authorAvatar: '',
    targetType: 'anime',
    targetId: OBJETIVO_COMENTARIOS,
    parentId: null,
    body: `Comentario de auditoría ${n}`,
    createdAt: serverTimestamp(),
  });
}

function diaUtc() {
  return new Date().toISOString().slice(0, 10);
}

function tramoActual() {
  return Math.floor(Date.now() / (10 * 60 * 1000));
}

// ═══════════════════════════════════════════════════════════
// 1. CUPO DE COMENTARIOS
// ═══════════════════════════════════════════════════════════

async function verificarCupoComentarios() {
  const autor = await signUp(`cupo-${Date.now()}@auditoria.test`);
  await sembrarUsuario(autor);
  const { db } = await clienteDe(autor, 'auditoria-cupo-1');

  await dbAdmin.doc(`animes/${OBJETIVO_COMENTARIOS}`).set(
    {
      title: 'Objetivo de auditoría',
      commentsCount: 0,
    },
    { merge: true },
  );
  await dbAdmin
    .doc('gamification/config')
    .set({ activo: true }, { merge: true });

  const ids = [];
  for (let n = 1; n <= 11; n += 1) {
    const ref = await crearComentario(db, autor.uid, 'cupo', n);
    ids.push(ref.id);
  }

  await esperarHasta(
    'cupo de comentarios: los 11 se publican y cuentan',
    async () => {
      const anime = await dbAdmin.doc(`animes/${OBJETIVO_COMENTARIOS}`).get();
      return Number(anime.data()?.commentsCount ?? 0) === 11;
    },
  );

  await esperarHasta(
    'cupo de comentarios: se pagan exactamente 10 recompensas',
    async () => {
      const user = await dbAdmin.doc(`users/${autor.uid}`).get();
      return Number(user.data()?.stats?.commentsCreated ?? 0) === 10;
    },
  );

  // Margen por si el trigger del comentario 11 llega tarde.
  await esperar(2000);

  const user = (await dbAdmin.doc(`users/${autor.uid}`).get()).data() ?? {};
  const anime = (await dbAdmin.doc(`animes/${OBJETIVO_COMENTARIOS}`).get()).data() ?? {};
  const xp = Number(user.xp ?? 0);
  const comentarios = Number(user.stats?.commentsCreated ?? 0);
  const contadorPublico = Number(anime.commentsCount ?? 0);

  const correcto = xp === 50 && comentarios === 10 && contadorPublico === 11;
  registrar(
    'Cupo: 10 comentarios pagan, el 11 no',
    correcto ? 'OK' : 'ERROR',
    `xp=${xp} (esperado 50), stats.commentsCreated=${comentarios} (esperado 10), ` +
      `commentsCount=${contadorPublico} (esperado 11), comentarios=${ids.length}`,
  );

  // ── Cupo diario agotado ─────────────────────────────────
  const autorDia = await signUp(`cupo-dia-${Date.now()}@auditoria.test`);
  await sembrarUsuario(autorDia);
  const { db: dbDia } = await clienteDe(autorDia, 'auditoria-cupo-2');

  await dbAdmin.doc(`commentQuotas/${autorDia.uid}`).set({
    tramo: tramoActual(),
    dia: diaUtc(),
    cuentaTramo: 0,
    cuentaDia: 50,
  });

  await crearComentario(dbDia, autorDia.uid, 'cupo-dia', 12);

  await esperarHasta(
    'cupo diario: el comentario se publica y cuenta',
    async () => {
      const snap = await dbAdmin.doc(`animes/${OBJETIVO_COMENTARIOS}`).get();
      return Number(snap.data()?.commentsCount ?? 0) === 12;
    },
  );

  await esperar(2000);

  const userDia = (await dbAdmin.doc(`users/${autorDia.uid}`).get()).data() ?? {};
  const xpDia = Number(userDia.xp ?? 0);
  const comentariosDia = Number(userDia.stats?.commentsCreated ?? 0);

  registrar(
    'Cupo diario agotado: publica pero no cobra',
    xpDia === 0 && comentariosDia === 0 ? 'OK' : 'ERROR',
    `xp=${xpDia} (esperado 0), stats.commentsCreated=${comentariosDia} (esperado 0)`,
  );
}

// ═══════════════════════════════════════════════════════════
// 2. TRASPASO DE GRUPO
// ═══════════════════════════════════════════════════════════

const GRUPO = 'auditoria-grupo';
const CODIGO = 'GRP-AUD1-2B3C-4D5E';

async function verificarTraspasoGrupo() {
  const viejo = await signUp(`dueno-viejo-${Date.now()}@auditoria.test`);
  const nuevo = await signUp(`dueno-nuevo-${Date.now()}@auditoria.test`);
  const solicitante = await signUp(`solicitante-${Date.now()}@auditoria.test`);
  const invitado = await signUp(`invitado-${Date.now()}@auditoria.test`);
  const tercero = await signUp(`tercero-${Date.now()}@auditoria.test`);

  for (const cuenta of [viejo, nuevo, solicitante, invitado, tercero]) {
    await sembrarUsuario(cuenta);
  }

  await dbAdmin.doc(`chats/${GRUPO}`).set({
    type: 'group',
    name: 'Grupo de auditoría',
    avatar: '',
    ownerId: viejo.uid,
    memberIds: [viejo.uid, nuevo.uid],
    hiddenFor: [],
    code: CODIGO,
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await dbAdmin.doc(`groupCodes/${CODIGO}`).set({
    code: CODIGO,
    groupId: GRUPO,
    name: 'Grupo de auditoría',
    ownerId: viejo.uid,
    ownerName: viejo.email.split('@')[0],
    memberCount: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  const solicitudEntrada = dbAdmin.doc(
    `chatRequests/group_${GRUPO}_${solicitante.uid}`,
  );
  const invitacionVieja = dbAdmin.doc(
    `chatRequests/invite_${GRUPO}_${viejo.uid}_${invitado.uid}`,
  );
  const historica = dbAdmin.doc(`chatRequests/group_${GRUPO}_historica`);
  const deTercero = dbAdmin.doc(
    `chatRequests/invite_${GRUPO}_${tercero.uid}_${invitado.uid}`,
  );
  // Solicitud de grupo ya dirigida al dueño NUEVO: el trigger no
  // debe confundirla con una obsoleta del dueño anterior.
  const paraElNuevo = dbAdmin.doc(
    `chatRequests/group_${GRUPO}_${invitado.uid}`,
  );

  await solicitudEntrada.set({
    type: 'group',
    fromId: solicitante.uid,
    fromName: solicitante.email.split('@')[0],
    fromAvatar: '',
    toId: viejo.uid,
    groupId: GRUPO,
    groupName: 'Grupo de auditoría',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await invitacionVieja.set({
    type: 'invite',
    fromId: viejo.uid,
    fromName: viejo.email.split('@')[0],
    fromAvatar: '',
    toId: invitado.uid,
    toName: invitado.email.split('@')[0],
    toAvatar: '',
    groupId: GRUPO,
    groupName: 'Grupo de auditoría',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await historica.set({
    type: 'group',
    fromId: solicitante.uid,
    fromName: solicitante.email.split('@')[0],
    fromAvatar: '',
    toId: viejo.uid,
    groupId: GRUPO,
    groupName: 'Grupo de auditoría',
    status: 'accepted',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await deTercero.set({
    type: 'invite',
    fromId: tercero.uid,
    fromName: tercero.email.split('@')[0],
    fromAvatar: '',
    toId: invitado.uid,
    toName: invitado.email.split('@')[0],
    toAvatar: '',
    groupId: GRUPO,
    groupName: 'Grupo de auditoría',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  await paraElNuevo.set({
    type: 'group',
    fromId: invitado.uid,
    fromName: invitado.email.split('@')[0],
    fromAvatar: '',
    toId: nuevo.uid,
    groupId: GRUPO,
    groupName: 'Grupo de auditoria',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  // El traspaso en sí: cambia el dueño y deja el índice SIN tocar a
  // propósito, que es el caso que el trigger tiene que reparar.
  await dbAdmin.doc(`chats/${GRUPO}`).update({ ownerId: nuevo.uid });

  await esperarHasta(
    'traspaso: se borran las solicitudes del dueño anterior',
    async () => {
      const [entrada, invitacion] = await Promise.all([
        solicitudEntrada.get(),
        invitacionVieja.get(),
      ]);
      return !entrada.exists && !invitacion.exists;
    },
  );

  await esperarHasta(
    'traspaso: se repara el índice del código',
    async () => {
      const indice = await dbAdmin.doc(`groupCodes/${CODIGO}`).get();
      const datos = indice.data() ?? {};
      return (
        datos.ownerId === nuevo.uid &&
        datos.ownerName === nuevo.email.split('@')[0]
      );
    },
  );

  const [
    historiaSnap,
    terceroSnap,
    paraNuevoSnap,
    indiceSnap,
    chatSnap,
  ] = await Promise.all([
    historica.get(),
    deTercero.get(),
    paraElNuevo.get(),
    dbAdmin.doc(`groupCodes/${CODIGO}`).get(),
    dbAdmin.doc(`chats/${GRUPO}`).get(),
  ]);

  const conservaHistoricas
    = historiaSnap.exists && terceroSnap.exists && paraNuevoSnap.exists;
  const indice = indiceSnap.data() ?? {};
  const chat = chatSnap.data() ?? {};

  registrar(
    'Traspaso: el trigger limpia y repara',
    conservaHistoricas &&
      indice.ownerId === nuevo.uid &&
      indice.ownerName === nuevo.email.split('@')[0] &&
      chat.ownerId === nuevo.uid
      ? 'OK'
      : 'ERROR',
    `solicitudes obsoletas borradas; histórica=${historiaSnap.exists}, ` +
      `de tercero=${terceroSnap.exists}, al nuevo=${paraNuevoSnap.exists}, ` +
      `índice.ownerId=${indice.ownerId}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 3. ACEPTAR CON BLOQUEOS
// ═══════════════════════════════════════════════════════════

async function verificarAceptacionConBloqueos() {
  const alice = await signUp(`alice-bloqueo-${Date.now()}@auditoria.test`);
  const bob = await signUp(`bob-bloqueo-${Date.now()}@auditoria.test`);
  const carla = await signUp(`carla-bloqueo-${Date.now()}@auditoria.test`);
  const dave = await signUp(`dave-bloqueo-${Date.now()}@auditoria.test`);

  for (const cuenta of [alice, bob, carla, dave]) {
    await sembrarUsuario(cuenta);
  }

  // ── Caso A: el EMISOR (Bob) bloqueó a la receptora (Alice) ──
  const solicitudA = `direct_${bob.uid}_${alice.uid}`;
  await dbAdmin.doc(`chatRequests/${solicitudA}`).set({
    type: 'direct',
    fromId: bob.uid,
    fromName: bob.email.split('@')[0],
    fromAvatar: '',
    toId: alice.uid,
    toName: alice.email.split('@')[0],
    toAvatar: '',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  await dbAdmin.doc(`users/${bob.uid}/blocked/${alice.uid}`).set({
    blockedAt: FieldValue.serverTimestamp(),
  });

  const rechazo = await llamar('responderSolicitudChat', alice.token, {
    requestId: solicitudA,
    accion: 'aceptar',
  });

  const [solicitudASnap, bloqueoBob] = await Promise.all([
    dbAdmin.doc(`chatRequests/${solicitudA}`).get(),
    dbAdmin.doc(`users/${bob.uid}/blocked/${alice.uid}`).get(),
  ]);

  const noCreoChat = !solicitudASnap.data()?.resultingChatId;
  const siguePendiente = solicitudASnap.data()?.status === 'pending';

  registrar(
    'Bloqueo del emisor: aceptar se rechaza',
    estadoError(rechazo) === 'FAILED_PRECONDITION' &&
      siguePendiente &&
      noCreoChat &&
      bloqueoBob.exists
      ? 'OK'
      : 'ERROR',
    `${rechazo.status} (${estadoError(rechazo)}); solicitud=${solicitudASnap.data()?.status}, ` +
      `chat=${solicitudASnap.data()?.resultingChatId ?? 'ninguno'}, ` +
      `bloqueo=${bloqueoBob.exists}`,
  );

  // ── Caso B: la RECEPTORA (Carla) bloqueó al emisor (Dave) ──
  const solicitudB = `direct_${dave.uid}_${carla.uid}`;
  await dbAdmin.doc(`chatRequests/${solicitudB}`).set({
    type: 'direct',
    fromId: dave.uid,
    fromName: dave.email.split('@')[0],
    fromAvatar: '',
    toId: carla.uid,
    toName: carla.email.split('@')[0],
    toAvatar: '',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  await dbAdmin.doc(`users/${carla.uid}/blocked/${dave.uid}`).set({
    blockedAt: FieldValue.serverTimestamp(),
  });

  const aceptacion = await llamar('responderSolicitudChat', carla.token, {
    requestId: solicitudB,
    accion: 'aceptar',
  });

  const chatId = aceptacion.body?.result?.chatId;
  const [solicitudBSnap, bloqueoCarla, chatSnap] = await Promise.all([
    dbAdmin.doc(`chatRequests/${solicitudB}`).get(),
    dbAdmin.doc(`users/${carla.uid}/blocked/${dave.uid}`).get(),
    chatId ? dbAdmin.doc(`chats/${chatId}`).get() : Promise.resolve(null),
  ]);

  const miembros = chatSnap?.data()?.memberIds ?? [];
  const correcto =
    aceptacion.status === 200 &&
    typeof chatId === 'string' &&
    solicitudBSnap.data()?.status === 'accepted' &&
    solicitudBSnap.data()?.resultingChatId === chatId &&
    !bloqueoCarla.exists &&
    miembros.includes(carla.uid) &&
    miembros.includes(dave.uid);

  registrar(
    'Bloqueo de la receptora: aceptar desbloquea y crea el chat',
    correcto ? 'OK' : 'ERROR',
    `${aceptacion.status}; chatId=${chatId ?? 'ninguno'}, ` +
      `solicitud=${solicitudBSnap.data()?.status}, bloqueo=${bloqueoCarla.exists}, ` +
      `miembros=${miembros.length}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 4. BLOQUEO EN UN CHAT DIRECTO YA EXISTENTE
// ═══════════════════════════════════════════════════════════

async function verificarBloqueoEnChatDirecto() {
  const alice = await signUp(`bloqueo-chat-a-${Date.now()}@auditoria.test`);
  const bob = await signUp(`bloqueo-chat-b-${Date.now()}@auditoria.test`);
  await sembrarUsuario(alice);
  await sembrarUsuario(bob);

  const { db: dbAlice } = await clienteDe(alice, 'auditoria-bloqueo-chat-a');
  const { db: dbBob } = await clienteDe(bob, 'auditoria-bloqueo-chat-b');

  const chatId = 'chat-bloqueo-directo';
  const camposChat = {
    name: 'Chat de auditoría',
    avatar: '',
    ownerId: alice.uid,
    memberIds: [alice.uid, bob.uid],
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessageSenderId: alice.uid,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  await dbAdmin.doc(`chats/${chatId}`).set({ ...camposChat, type: 'direct' });

  const enviar = (db, uid, idChat = chatId) =>
    addDoc(collection(db, 'chats', idChat, 'messages'), {
      chatId: idChat,
      senderId: uid,
      senderName: 'auditoría',
      senderAvatar: '',
      body: 'Mensaje de prueba',
      type: 'text',
      createdAt: serverTimestamp(),
    });

  // Antes del bloqueo, Bob puede escribir.
  await enviar(dbBob, bob.uid);

  await dbAdmin.doc(`users/${alice.uid}/blocked/${bob.uid}`).set({
    blockedAt: FieldValue.serverTimestamp(),
  });

  let bobRechazado = false;
  try {
    await enviar(dbBob, bob.uid);
  } catch (e) {
    bobRechazado = String(e?.code ?? '').includes('permission-denied');
  }

  let aliceRechazado = false;
  try {
    await enviar(dbAlice, alice.uid);
  } catch (e) {
    aliceRechazado = String(e?.code ?? '').includes('permission-denied');
  }

  await dbAdmin.doc(`users/${alice.uid}/blocked/${bob.uid}`).delete();
  let bobPermitido = false;
  try {
    await enviar(dbBob, bob.uid);
    bobPermitido = true;
  } catch {
    bobPermitido = false;
  }

  // Un grupo con la misma pareja no debe quedar silenciado.
  const grupoId = 'chat-bloqueo-grupo';
  await dbAdmin.doc(`chats/${grupoId}`).set({
    ...camposChat,
    type: 'group',
    name: 'Grupo de auditoría',
  });
  await dbAdmin.doc(`users/${alice.uid}/blocked/${bob.uid}`).set({
    blockedAt: FieldValue.serverTimestamp(),
  });
  let grupoPermitido = false;
  try {
    await enviar(dbBob, bob.uid, grupoId);
    grupoPermitido = true;
  } catch {
    grupoPermitido = false;
  }

  registrar(
    'Bloqueo en chat directo existente',
    bobRechazado && aliceRechazado && bobPermitido && grupoPermitido
      ? 'OK'
      : 'ERROR',
    `bloqueado=${bobRechazado}, bloqueador=${aliceRechazado}, ` +
      `al desbloquear=${bobPermitido}, grupo=${grupoPermitido}`,
  );
}

async function main() {
  console.log(`Proyecto de emulador: ${PROJECT}`);
  console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  await verificarCupoComentarios();
  await verificarTraspasoGrupo();
  await verificarAceptacionConBloqueos();
  await verificarBloqueoEnChatDirecto();

  const salida = {
    proyecto: PROJECT,
    fecha: new Date().toISOString(),
    resultados,
  };
  const destino = path.join(
    process.cwd(),
    'docs',
    'auditoria',
    'resultados-residuales.json',
  );
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(salida, null, 2), 'utf8');

  const errores = resultados.filter((r) => r.estado === 'ERROR');
  console.log(`\nResultados escritos en ${destino}`);
  console.log(
    `Resumen: ${resultados.length - errores.length} comprobación(es) correcta(s), ` +
      `${errores.length} error(es).`,
  );

  // Los clientes de Firestore/Auth y el Admin SDK dejan conexiones
  // abiertas; sin un cierre explícito `emulators:exec` se queda
  // esperando indefinidamente aunque el guion ya haya terminado.
  process.exit(errores.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
