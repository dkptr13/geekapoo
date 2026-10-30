/**
 * AUDITORÍA DE CLUBES — ALTAS Y ESTADÍSTICAS
 *
 * Comprueba de extremo a extremo que:
 *
 *   1. Un alta pública pasa por `unirseClubPublico` y concede la
 *      medalla de club unido.
 *   2. El dueño y el propio usuario NO pueden dar de alta a nadie
 *      escribiendo la ficha del club desde el cliente.
 *   3. Una escritura directa en `memberIds` (Admin SDK/consola) NO
 *      concede la medalla: ya no la da `onClubMembersChanged`.
 *   4. El desbaneo pasa por `levantarSancionClub`, que devuelve a la
 *      persona con su rol y la mete otra vez en sus chats.
 *   5. Un dueño baneado no crea, edita ni borra canales; un miembro
 *      sancionado no escribe en el canal `general`.
 *
 * Salvaguardas: solo proyecto demo-* y emuladores. No toca producción.
 *
 * Ejecución:
 *   npx firebase emulators:exec --only firestore,auth,functions \
 *     --project demo-geekapoo-auditoria \
 *     "node scripts/auditoria-clubes.mjs"
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
  deleteDoc,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
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

async function esperarHasta(descripcion, fn, timeout = 20_000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeout) {
    if (await fn()) return true;
    await esperar(300);
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

function clubPublico(ownerUid, chatId, id) {
  return {
    slug: id,
    name: 'Club de auditoría',
    description: 'Club para probar altas y estadísticas.',
    rules: '',
    accessType: 'public',
    ownerId: ownerUid,
    moderatorIds: [],
    adminIds: [],
    memberIds: [ownerUid],
    members: {
      [ownerUid]: {
        uid: ownerUid,
        role: 'owner',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
    },
    memberCount: 1,
    chatId,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

async function sembrarClub({ id, ownerUid, chatId, conMods = false }) {
  await dbAdmin.doc(`clubs/${id}`).set(clubPublico(ownerUid, chatId, id));
  await dbAdmin.doc(`chats/${chatId}`).set({
    type: 'club',
    name: 'Club de auditoría',
    slug: id,
    ownerId: ownerUid,
    memberIds: [ownerUid],
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessageSenderId: ownerUid,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  if (conMods) {
    const modsChatId = `chat-mods-${id}`;
    await dbAdmin.doc(`chats/${modsChatId}`).set({
      type: 'club',
      name: `Mods ${id}`,
      slug: id,
      channelId: 'mods',
      ownerId: ownerUid,
      memberIds: [ownerUid],
      hiddenFor: [],
      lastMessage: '',
      lastMessageAt: '2026-01-01T00:00:00.000Z',
      lastMessageSenderId: ownerUid,
      readAt: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await dbAdmin.doc(`clubs/${id}/channels/mods`).set({
      id: 'mods',
      clubId: id,
      chatId: modsChatId,
      name: 'Mods',
      description: 'Canal del equipo.',
      type: 'text',
      visibility: 'mods',
      spoiler: false,
      order: 1,
      createdBy: ownerUid,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  }
}

async function medallaClubes(uid, clubId) {
  const snap = await dbAdmin.doc(`users/${uid}`).get();
  return snap.data()?.stats?.clubesUnidos?.[clubId] === true;
}

// ═══════════════════════════════════════════════════════════
// 1. ALTA PÚBLICA POR CALLABLE + MEDALLA
// ═══════════════════════════════════════════════════════════

async function verificarAltaPublica(owner, miembro) {
  const clubId = 'club-altas-auditoria';
  const chatId = 'chat-altas-auditoria';
  await sembrarClub({ id: clubId, ownerUid: owner.uid, chatId });

  const respuesta = await llamar('unirseClubPublico', miembro.token, { clubId });
  if (respuesta.status !== 200) {
    registrar(
      'Alta pública por callable',
      'ERROR',
      `HTTP ${respuesta.status} ${estadoError(respuesta)}: ${JSON.stringify(respuesta.body).slice(0, 200)}`,
    );
    return;
  }

  const club = (await dbAdmin.doc(`clubs/${clubId}`).get()).data() ?? {};
  const chat = (await dbAdmin.doc(`chats/${chatId}`).get()).data() ?? {};
  const dentro = Array.isArray(club.memberIds) && club.memberIds.includes(miembro.uid);
  const enChat = Array.isArray(chat.memberIds) && chat.memberIds.includes(miembro.uid);
  const medalla = await medallaClubes(miembro.uid, clubId);

  registrar(
    'Alta pública por callable',
    dentro && enChat && medalla ? 'OK' : 'ERROR',
    `miembro=${dentro}, chat=${enChat}, medalla=${medalla}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 2. SOLICITUD ACEPTADA POR CALLABLE + MEDALLA
// ═══════════════════════════════════════════════════════════

async function verificarSolicitudAceptada(owner, solicitante) {
  const clubId = 'club-solicitud-auditoria';
  const chatId = 'chat-solicitud-auditoria';
  await sembrarClub({ id: clubId, ownerUid: owner.uid, chatId });
  await dbAdmin.doc(`clubs/${clubId}`).update({ accessType: 'request' });

  const requestId = `${clubId}_${solicitante.uid}`;
  await dbAdmin.doc(`clubs/${clubId}/requests/${requestId}`).set({
    clubId,
    clubName: 'Club de auditoría',
    fromId: solicitante.uid,
    fromName: 'solicitante',
    fromAvatar: '',
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });

  const respuesta = await llamar('responderSolicitudClub', owner.token, {
    clubId,
    requestId,
    accion: 'aceptar',
  });
  if (respuesta.status !== 200) {
    registrar(
      'Solicitud aceptada por callable',
      'ERROR',
      `HTTP ${respuesta.status} ${estadoError(respuesta)}: ${JSON.stringify(respuesta.body).slice(0, 200)}`,
    );
    return;
  }

  const club = (await dbAdmin.doc(`clubs/${clubId}`).get()).data() ?? {};
  const chat = (await dbAdmin.doc(`chats/${chatId}`).get()).data() ?? {};
  const solicitud = (
    await dbAdmin.doc(`clubs/${clubId}/requests/${requestId}`).get()
  ).data() ?? {};
  const dentro = (club.memberIds ?? []).includes(solicitante.uid);
  const enChat = (chat.memberIds ?? []).includes(solicitante.uid);
  const aceptada = solicitud.status === 'accepted';
  const medalla = await medallaClubes(solicitante.uid, clubId);

  registrar(
    'Solicitud aceptada por callable',
    dentro && enChat && aceptada && medalla ? 'OK' : 'ERROR',
    `miembro=${dentro}, chat=${enChat}, solicitud=${solicitud.status}, medalla=${medalla}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 3. ALTAS DIRECTAS RECHAZADAS
// ═══════════════════════════════════════════════════════════

async function verificarAltasDirectas(owner, outsider) {
  const clubId = 'club-altas-auditoria';
  const clubRef = dbAdmin.doc(`clubs/${clubId}`);
  const club = (await clubRef.get()).data() ?? {};
  const miembros = {
    ...(club.members ?? {}),
    [outsider.uid]: {
      uid: outsider.uid,
      role: 'member',
      joinedAt: '2026-01-02T00:00:00.000Z',
    },
  };
  const memberIds = [...(club.memberIds ?? []), outsider.uid];

  // El dueño intenta añadir a alguien desde el cliente.
  const { db: dbDueno } = await clienteDe(owner, 'auditoria-altas-dueno');
  let duenoRechazado = false;
  try {
    await updateDoc(doc(dbDueno, 'clubs', clubId), {
      members: miembros,
      memberIds,
      memberCount: memberIds.length,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    duenoRechazado = String(e?.code ?? '').includes('permission-denied');
  }

  // El propio usuario intenta auto-unirse desde el cliente.
  const { db: dbOutsider } = await clienteDe(outsider, 'auditoria-altas-outsider');
  let autoUnionRechazada = false;
  try {
    await updateDoc(doc(dbOutsider, 'clubs', clubId), {
      members: miembros,
      memberIds,
      memberCount: memberIds.length,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    autoUnionRechazada = String(e?.code ?? '').includes('permission-denied');
  }

  const clubDespues = (await clubRef.get()).data() ?? {};
  const sigueFuera = !(clubDespues.memberIds ?? []).includes(outsider.uid);
  const sinMedalla = !(await medallaClubes(outsider.uid, clubId));

  registrar(
    'Altas directas rechazadas (dueño y auto-unión)',
    duenoRechazado && autoUnionRechazada && sigueFuera && sinMedalla ? 'OK' : 'ERROR',
    `dueño=${duenoRechazado}, auto-unión=${autoUnionRechazada}, sigue fuera=${sigueFuera}, medalla=${!sinMedalla}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 3. ESCRITURA DIRECTA EN memberIds NO DA MEDALLA
// ═══════════════════════════════════════════════════════════

async function verificarEstadisticaNoInflable(owner, fantasma) {
  const clubId = 'club-sombra-auditoria';
  await sembrarClub({
    id: clubId,
    ownerUid: owner.uid,
    chatId: 'chat-sombra-auditoria',
  });

  const club = (await dbAdmin.doc(`clubs/${clubId}`).get()).data() ?? {};
  const miembros = {
    ...(club.members ?? {}),
    [fantasma.uid]: {
      uid: fantasma.uid,
      role: 'member',
      joinedAt: '2026-01-02T00:00:00.000Z',
    },
  };
  const memberIds = [...(club.memberIds ?? []), fantasma.uid];

  // Simula una escritura de consola/Admin SDK: las reglas no se
  // aplican, así que el trigger SÍ ve el cambio. No debe pagar.
  await dbAdmin.doc(`clubs/${clubId}`).update({
    members: miembros,
    memberIds,
    memberCount: memberIds.length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await esperar(1500);
  const medalla = await medallaClubes(fantasma.uid, clubId);

  registrar(
    'Una escritura directa en memberIds no concede la medalla',
    medalla ? 'ERROR' : 'OK',
    `medalla=${medalla}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 4. DESBANEO POR CALLABLE
// ═══════════════════════════════════════════════════════════

async function verificarDesbaneo(owner, mod, outsider) {
  const clubId = 'club-sancion-auditoria';
  const chatId = 'chat-sancion-auditoria';
  await sembrarClub({ id: clubId, ownerUid: owner.uid, chatId, conMods: true });

  // El moderador está baneado: fuera del club y de sus chats.
  await dbAdmin.doc(`clubs/${clubId}/sancion/${mod.uid}`).set({
    clubId,
    tipo: 'baneo',
    objetivoUid: mod.uid,
    objetivoNombre: 'moderador baneado',
    motivo: 'Prueba de desbaneo',
    inicio: FieldValue.serverTimestamp(),
    expira: null,
    permanente: true,
    aplicadaPor: owner.uid,
    aplicadaPorNombre: 'dueño',
    aplicadaPorRango: 'owner',
    rolPrevio: 'moderator',
  });

  // Un ajeno no puede levantar la sanción.
  const ajeno = await llamar('levantarSancionClub', outsider.token, {
    clubId,
    objetivoUid: mod.uid,
  });
  const ajenoRechazado = ajeno.status >= 400;

  const respuesta = await llamar('levantarSancionClub', owner.token, {
    clubId,
    objetivoUid: mod.uid,
    motivoRetirada: 'Auditoría: desbaneo correcto',
  });
  if (respuesta.status !== 200) {
    registrar(
      'Desbaneo por callable',
      'ERROR',
      `HTTP ${respuesta.status} ${estadoError(respuesta)}: ${JSON.stringify(respuesta.body).slice(0, 200)}`,
    );
    return;
  }

  const club = (await dbAdmin.doc(`clubs/${clubId}`).get()).data() ?? {};
  const chat = (await dbAdmin.doc(`chats/${chatId}`).get()).data() ?? {};
  const modsChat = (await dbAdmin.doc(`chats/chat-mods-${clubId}`).get()).data() ?? {};
  const sancion = await dbAdmin.doc(`clubs/${clubId}/sancion/${mod.uid}`).get();
  const historial = await dbAdmin
    .collection(`clubs/${clubId}/sanciones`)
    .where('accion', '==', 'retirada')
    .get();
  const medalla = await medallaClubes(mod.uid, clubId);

  const volvio = (club.memberIds ?? []).includes(mod.uid);
  const rol = club.members?.[mod.uid]?.role;
  const enChat = (chat.memberIds ?? []).includes(mod.uid);
  const enMods = (modsChat.memberIds ?? []).includes(mod.uid);
  const sancionBorrada = !sancion.exists;
  const historialOk = !historial.empty;

  registrar(
    'Desbaneo por callable',
    ajenoRechazado &&
      volvio &&
      rol === 'moderator' &&
      enChat &&
      enMods &&
      sancionBorrada &&
      historialOk &&
      medalla
      ? 'OK'
      : 'ERROR',
    `ajeno rechazado=${ajenoRechazado}, vuelve=${volvio}, rol=${rol}, chat=${enChat}, mods=${enMods}, sanción borrada=${sancionBorrada}, historial=${historialOk}, medalla=${medalla}`,
  );
}

// ═══════════════════════════════════════════════════════════
// 5. CANALES CON DUEÑO BANEADO Y MIEMBRO SANCIONADO
// ═══════════════════════════════════════════════════════════

function permisoDenegado(error) {
  return String(error?.code ?? '').includes('permission-denied');
}

async function verificarCanalesBaneados(owner, miembro) {
  const clubId = 'club-canales-auditoria';
  const chatId = 'chat-canales-auditoria';
  const chatNuevoId = 'chat-canal-nuevo';
  await sembrarClub({ id: clubId, ownerUid: owner.uid, chatId });

  const miembros = {
    [owner.uid]: {
      uid: owner.uid,
      role: 'owner',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
    [miembro.uid]: {
      uid: miembro.uid,
      role: 'member',
      joinedAt: '2026-01-02T00:00:00.000Z',
    },
  };
  await dbAdmin.doc(`clubs/${clubId}`).update({
    memberIds: [owner.uid, miembro.uid],
    members: miembros,
    memberCount: 2,
  });
  await dbAdmin.doc(`chats/${chatId}`).update({
    memberIds: [owner.uid, miembro.uid],
    channelId: 'general',
  });
  await dbAdmin.doc(`clubs/${clubId}/channels/general`).set({
    id: 'general',
    clubId,
    chatId,
    name: 'General',
    description: 'Canal general del club.',
    type: 'text',
    visibility: 'all',
    spoiler: false,
    order: 0,
    createdBy: owner.uid,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  await dbAdmin.doc(`chats/${chatNuevoId}`).set({
    type: 'club',
    name: 'Nuevo',
    slug: clubId,
    channelId: 'nuevo',
    ownerId: owner.uid,
    memberIds: [owner.uid, miembro.uid],
    hiddenFor: [],
    lastMessage: '',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessageSenderId: owner.uid,
    readAt: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  // ── Dueño baneado globalmente ──────────────────────────
  await dbAdmin.doc(`users/${owner.uid}`).update({ isBanned: true });
  const { db: dbDueno } = await clienteDe(owner, 'auditoria-canales-dueno');

  const canalNuevo = {
    id: 'nuevo',
    clubId,
    chatId: chatNuevoId,
    name: 'Nuevo',
    description: '',
    type: 'text',
    visibility: 'all',
    spoiler: false,
    order: 1,
    createdBy: owner.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  let crearRechazado = false;
  let editarRechazado = false;
  let borrarRechazado = false;
  try {
    await setDoc(doc(dbDueno, 'clubs', clubId, 'channels', 'nuevo'), canalNuevo);
  } catch (e) {
    crearRechazado = permisoDenegado(e);
  }
  try {
    await updateDoc(doc(dbDueno, 'clubs', clubId, 'channels', 'general'), {
      name: 'Cambiado por un baneado',
    });
  } catch (e) {
    editarRechazado = permisoDenegado(e);
  }
  try {
    await deleteDoc(doc(dbDueno, 'clubs', clubId, 'channels', 'general'));
  } catch (e) {
    borrarRechazado = permisoDenegado(e);
  }

  await dbAdmin.doc(`users/${owner.uid}`).update({ isBanned: false });
  let duenoActivoPuede = false;
  try {
    await updateDoc(doc(dbDueno, 'clubs', clubId, 'channels', 'general'), {
      name: 'General',
    });
    duenoActivoPuede = true;
  } catch {
    duenoActivoPuede = false;
  }

  registrar(
    'Dueño baneado no gestiona canales',
    crearRechazado && editarRechazado && borrarRechazado && duenoActivoPuede
      ? 'OK'
      : 'ERROR',
    `crear=${crearRechazado}, editar=${editarRechazado}, borrar=${borrarRechazado}, al desbanear=${duenoActivoPuede}`,
  );

  // ── Miembro sancionado en el canal general ─────────────
  await dbAdmin.doc(`clubs/${clubId}/sancion/${miembro.uid}`).set({
    clubId,
    tipo: 'silencio',
    objetivoUid: miembro.uid,
    objetivoNombre: 'miembro sancionado',
    motivo: 'Prueba E2E de canal general',
    inicio: FieldValue.serverTimestamp(),
    expira: admin.firestore.Timestamp.fromMillis(Date.now() + 3_600_000),
    permanente: false,
    aplicadaPor: owner.uid,
    aplicadaPorNombre: 'dueño',
    aplicadaPorRango: 'owner',
  });

  const { db: dbMiembro } = await clienteDe(miembro, 'auditoria-canales-miembro');
  const mensaje = {
    chatId,
    senderId: miembro.uid,
    senderName: 'miembro',
    senderAvatar: '',
    body: 'Mensaje en el general',
    type: 'text',
    createdAt: serverTimestamp(),
  };

  let escribirRechazado = false;
  try {
    await addDoc(collection(dbMiembro, 'chats', chatId, 'messages'), mensaje);
  } catch (e) {
    escribirRechazado = permisoDenegado(e);
  }

  await dbAdmin.doc(`clubs/${clubId}/sancion/${miembro.uid}`).delete();
  let escribirPermitido = false;
  try {
    await addDoc(collection(dbMiembro, 'chats', chatId, 'messages'), {
      ...mensaje,
      body: 'Mensaje tras levantar el silencio',
    });
    escribirPermitido = true;
  } catch {
    escribirPermitido = false;
  }

  registrar(
    'Miembro sancionado no escribe en general',
    escribirRechazado && escribirPermitido ? 'OK' : 'ERROR',
    `sancionado=${escribirRechazado}, al levantar=${escribirPermitido}`,
  );
}

// ═══════════════════════════════════════════════════════════
// EJECUCIÓN
// ═══════════════════════════════════════════════════════════

async function main() {
  const sello = String(Date.now()).slice(-6);
  const owner = await signUp(`club-owner-${sello}@auditoria.test`);
  const miembro = await signUp(`club-miembro-${sello}@auditoria.test`);
  const outsider = await signUp(`club-outsider-${sello}@auditoria.test`);
  const fantasma = await signUp(`club-fantasma-${sello}@auditoria.test`);
  const mod = await signUp(`club-mod-${sello}@auditoria.test`);

  for (const cuenta of [owner, miembro, outsider, fantasma, mod]) {
    await sembrarUsuario(cuenta);
  }

  await dbAdmin.doc('gamification/config').set({ activo: true }, { merge: true });

  await verificarAltaPublica(owner, miembro);
  await verificarSolicitudAceptada(owner, miembro);
  await verificarAltasDirectas(owner, outsider);
  await verificarEstadisticaNoInflable(owner, fantasma);
  await verificarDesbaneo(owner, mod, outsider);
  await verificarCanalesBaneados(owner, miembro);

  const errores = resultados.filter((r) => r.estado !== 'OK').length;
  fs.writeFileSync(
    'docs/auditoria/resultados-clubes.json',
    `${JSON.stringify(
      {
        proyecto: PROJECT,
        fecha: new Date().toISOString(),
        resultados,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(
    `\nResumen: ${resultados.length - errores} comprobación(es) correcta(s), ${errores} error(es).`,
  );
  process.exit(errores > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
