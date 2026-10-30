/**
 * MIGRACIÓN: reconciliar los chats de club con la membresía real.
 *
 * Durante la auditoría se vio que `chats/{chatId}.memberIds` podía
 * quedarse viejo: gente que ya había salido del club seguía en la
 * lista del chat (y, por tanto, podía seguir leyendo metadatos o
 * historial hasta que el trigger limpiaba). Las reglas nuevas ya
 * comprueban la pertenencia al club, pero los datos antiguos siguen
 * ahí.
 *
 * Este script:
 *
 *   1. Lee todos los clubes y sus canales.
 *   2. Calcula quién debería estar en cada chat:
 *        - canal `all` y chat histórico -> `clubs/{id}.memberIds`
 *        - canal `mods` -> propietario + moderadores que sigan siendo
 *          miembros (lo mismo que `equipoDeClub` en las reglas).
 *   3. Compara con `memberIds` real del chat y reporta extras/faltantes.
 *   4. Con `--escribir`, guarda una copia local de los cambios y
 *      actualiza solo `memberIds` (no toca mensajes, `hiddenFor` ni
 *      contadores).
 *   5. Revisa `createdAt` de usuarios y clubes en busca de fechas
 *      futuras (la medalla de veterano se podía manipular antes del
 *      P0). Solo las reporta: cambiar fechas o recalcular medallas es
 *      una decisión manual con `recalcularUsuario`.
 *
 * Uso:
 *
 *   # Simulación (por defecto): no escribe nada.
 *   node scripts/migrar-clubes.mjs --project geekapoo-7624d
 *
 *   # Aplicar. En producción exige confirmar el proyecto.
 *   node scripts/migrar-clubes.mjs --project geekapoo-7624d \
 *     --escribir --confirmar geekapoo-7624d
 *
 * Con `FIRESTORE_EMULATOR_HOST` usa el emulador y no pide credenciales.
 * Es idempotente: si no hay diferencias, no escribe.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);

let admin;
try {
  admin = require('../functions/node_modules/firebase-admin');
} catch {
  try {
    admin = require('firebase-admin');
  } catch {
    console.error(
      'No encuentro firebase-admin. Instala las dependencias de functions/ ' +
        'o ejecuta el script desde la raíz del repositorio.',
    );
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const escribir = args.includes('--escribir');
const projectIndex = args.indexOf('--project');
const projectId =
  projectIndex >= 0 ? args[projectIndex + 1] : process.env.GCLOUD_PROJECT;
const confirmarIndex = args.indexOf('--confirmar');
const confirmar = confirmarIndex >= 0 ? args[confirmarIndex + 1] : '';
const enEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!projectId) {
  console.error('Falta el proyecto. Pasa --project <id> o define GCLOUD_PROJECT.');
  process.exit(1);
}
if (enEmulador && !projectId.startsWith('demo-')) {
  console.error('Con emulador, usa un proyecto demo-*.');
  process.exit(1);
}
if (!enEmulador && escribir && confirmar !== projectId) {
  console.error(
    'Para escribir en producción hay que confirmar el proyecto: ' +
      `--escribir --confirmar ${projectId}`,
  );
  process.exit(1);
}

admin.initializeApp(
  enEmulador
    ? { projectId }
    : { projectId, credential: admin.credential.applicationDefault() },
);

const db = admin.firestore();
const AHORA = Date.now();
const MARGEN_FUTURO = 24 * 60 * 60 * 1000;

function unicos(valores) {
  return valores.filter((v, i, arr) => typeof v === 'string' && v && arr.indexOf(v) === i);
}

function aMillis(valor) {
  if (!valor) return null;
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    const ms = Date.parse(valor);
    return Number.isNaN(ms) ? null : ms;
  }
  if (valor instanceof Date) return valor.getTime();
  if (typeof valor.seconds === 'number') return valor.seconds * 1000;
  return null;
}

function iguales(a, b) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((v) => set.has(v));
}

async function paginas(coleccion, tam = 300) {
  let ultimo = null;
  const docs = [];
  for (;;) {
    let consulta = db.collection(coleccion).orderBy(admin.firestore.FieldPath.documentId());
    if (ultimo) consulta = consulta.startAfter(ultimo);
    const snap = await consulta.limit(tam).get();
    if (snap.empty) break;
    docs.push(...snap.docs);
    ultimo = snap.docs[snap.docs.length - 1].id;
    if (snap.size < tam) break;
  }
  return docs;
}

async function leerChats(ids) {
  const map = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const trozo = ids.slice(i, i + 200);
    const snaps = await db.getAll(...trozo.map((id) => db.doc(`chats/${id}`)));
    snaps.forEach((snap) => map.set(snap.id, snap));
  }
  return map;
}

console.log(
  `[clubes] Proyecto: ${projectId} · modo: ${
    escribir ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }${enEmulador ? ' · emulador' : ''}`,
);

const clubes = await paginas('clubs');
const cambios = [];
const conflictos = [];
const conflictivos = new Set();
const clubesInconsistentes = [];
const chatsInexistentes = [];
const chatsNoClub = [];
const fechasFuturas = [];

for (const clubDoc of clubes) {
  const club = clubDoc.data() ?? {};
  const clubId = clubDoc.id;

  // Sin memberIds no se puede saber quién debe estar en los chats.
  // Se reporta y NO se toca nada: vaciar la lista por un dato que
  // falta sería peor que dejarla como está.
  if (!Array.isArray(club.memberIds) || club.memberIds.length === 0) {
    clubesInconsistentes.push({
      clubId,
      memberIds: null,
      members: Object.keys(club.members ?? {}).length,
      memberCount: Number(club.memberCount),
    });
    continue;
  }

  const miembros = unicos(club.memberIds);
  const equipo = unicos([
    ...(typeof club.ownerId === 'string' ? [club.ownerId] : []),
    ...(Array.isArray(club.moderatorIds) ? club.moderatorIds : []),
  ]).filter((uid) => miembros.includes(uid));

  const clavesMiembros = Object.keys(club.members ?? {});
  if (
    !Array.isArray(club.memberIds) ||
    !iguales(miembros, clavesMiembros) ||
    Number(club.memberCount) !== miembros.length
  ) {
    clubesInconsistentes.push({
      clubId,
      memberIds: miembros.length,
      members: clavesMiembros.length,
      memberCount: Number(club.memberCount),
    });
  }

  const creado = aMillis(club.createdAt);
  if (creado && creado > AHORA + MARGEN_FUTURO) {
    fechasFuturas.push({ tipo: 'club', id: clubId, createdAt: new Date(creado).toISOString() });
  }

  const esperados = new Map();
  const añadir = (chatId, expectativa, origen) => {
    if (typeof chatId !== 'string' || !chatId) return;
    const previo = esperados.get(chatId);
    if (previo && !iguales(previo.lista, expectativa)) {
      conflictos.push({ clubId, chatId, origen, conflicto: previo.origen });
      conflictivos.add(chatId);
      return;
    }
    esperados.set(chatId, { lista: expectativa, origen });
  };

  añadir(club.chatId, miembros, 'histórico');
  const canales = await clubDoc.ref.collection('channels').get();
  for (const canal of canales.docs) {
    const datos = canal.data() ?? {};
    const expectativa = datos.visibility === 'mods' ? equipo : miembros;
    añadir(datos.chatId, expectativa, `canal:${canal.id}`);

    const creado = aMillis(datos.createdAt);
    if (creado && creado > AHORA + MARGEN_FUTURO) {
      fechasFuturas.push({
        tipo: 'canal',
        id: `${clubId}/${canal.id}`,
        createdAt: new Date(creado).toISOString(),
      });
    }
  }

  const chats = await leerChats([...esperados.keys()]);
  for (const [chatId, { lista, origen }] of esperados) {
    if (conflictivos.has(chatId)) continue;
    const snap = chats.get(chatId);
    if (!snap?.exists) {
      chatsInexistentes.push({ clubId, chatId, origen });
      continue;
    }
    const chat = snap.data() ?? {};
    if (chat.type !== 'club') {
      chatsNoClub.push({ clubId, chatId, origen, type: chat.type });
      continue;
    }

    const creado = aMillis(chat.createdAt);
    if (creado && creado > AHORA + MARGEN_FUTURO) {
      fechasFuturas.push({
        tipo: 'chat',
        id: chatId,
        createdAt: new Date(creado).toISOString(),
      });
    }

    const actual = unicos(Array.isArray(chat.memberIds) ? chat.memberIds : []);
    if (iguales(actual, lista)) continue;

    const extras = actual.filter((uid) => !lista.includes(uid));
    const faltan = lista.filter((uid) => !actual.includes(uid));
    cambios.push({
      clubId,
      chatId,
      origen,
      antes: actual,
      despues: lista,
      extras,
      faltan,
    });
  }
}

// Fechas futuras en perfiles: solo se reportan. La medalla de veterano
// se recalcula con la callable `recalcularUsuario`, no aquí.
let usuarios = 0;
for (const userDoc of await paginas('users')) {
  usuarios += 1;
  const creado = aMillis(userDoc.data()?.createdAt);
  if (creado && creado > AHORA + MARGEN_FUTURO) {
    fechasFuturas.push({
      tipo: 'usuario',
      id: userDoc.id,
      createdAt: new Date(creado).toISOString(),
    });
  }
}

console.log(`[clubes] Clubes revisados: ${clubes.length}`);
console.log(`[clubes] Usuarios revisados: ${usuarios}`);
console.log(`[clubes] Chats con membresía distinta: ${cambios.length}`);
console.log(`[clubes] Clubes con espejos inconsistentes: ${clubesInconsistentes.length}`);
console.log(`[clubes] Conflictos de visibilidad: ${conflictos.length}`);
console.log(`[clubes] Chats inexistentes: ${chatsInexistentes.length}`);
console.log(`[clubes] Chats enlazados que no son de club: ${chatsNoClub.length}`);
console.log(`[clubes] Fechas futuras: ${fechasFuturas.length}`);

if (cambios.length > 0) {
  console.log('\n[clubes] Primeros cambios:');
  cambios.slice(0, 10).forEach((c) => {
    console.log(
      `  ${c.clubId}/${c.chatId} (${c.origen}): ` +
        `salen ${c.extras.length}, entran ${c.faltan.length}`,
    );
  });
}

let aplicados = 0;
if (escribir && cambios.length > 0) {
  const sello = new Date().toISOString().replace(/[:.]/g, '-');
  const carpeta = path.join('docs', 'auditoria', 'backups');
  fs.mkdirSync(carpeta, { recursive: true });
  const rutaBackup = path.join(carpeta, `migracion-clubes-${sello}.json`);
  fs.writeFileSync(
    rutaBackup,
    `${JSON.stringify(
      {
        proyecto: projectId,
        fecha: new Date().toISOString(),
        cambios,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  console.log(`[clubes] Copia de seguridad: ${rutaBackup}`);

  for (let i = 0; i < cambios.length; i += 400) {
    const lote = db.batch();
    for (const cambio of cambios.slice(i, i + 400)) {
      lote.update(db.doc(`chats/${cambio.chatId}`), {
        memberIds: cambio.despues,
      });
    }
    await lote.commit();
    aplicados += Math.min(400, cambios.length - i);
  }

  // Verificación: releer y comparar exactamente.
  const verificacion = await leerChats(cambios.map((c) => c.chatId));
  const malos = cambios.filter((c) => {
    const snap = verificacion.get(c.chatId);
    const actual = unicos(Array.isArray(snap?.data()?.memberIds) ? snap.data().memberIds : []);
    return !iguales(actual, c.despues);
  });
  if (malos.length > 0) {
    console.error(`[clubes] ERROR: ${malos.length} chats no quedaron como se esperaba.`);
    malos.slice(0, 10).forEach((c) => console.error(`  ${c.chatId}`));
    process.exit(1);
  }
  console.log(`[clubes] Aplicados y verificados: ${aplicados} chats.`);
} else if (escribir) {
  console.log('[clubes] No hay nada que escribir.');
}

fs.writeFileSync(
  'docs/auditoria/resultados-migracion-clubes.json',
  `${JSON.stringify(
    {
      proyecto: projectId,
      fecha: new Date().toISOString(),
      modo: escribir ? 'escritura' : 'simulacion',
      clubes: clubes.length,
      usuarios,
      chatsConCambios: cambios.length,
      chatsAplicados: aplicados,
      clubesInconsistentes: clubesInconsistentes.length,
      conflictos: conflictos.length,
      chatsInexistentes: chatsInexistentes.length,
      chatsNoClub: chatsNoClub.length,
      fechasFuturas: fechasFuturas.length,
      detalle: {
        chats: cambios.map((c) => ({
          clubId: c.clubId,
          chatId: c.chatId,
          origen: c.origen,
          extras: c.extras.length,
          faltan: c.faltan.length,
        })),
        clubesInconsistentes,
        conflictos,
        chatsInexistentes,
        chatsNoClub,
        fechasFuturas: fechasFuturas.map((f) => ({
          tipo: f.tipo,
          id: f.tipo === 'usuario' ? undefined : f.id,
          createdAt: f.createdAt,
        })),
      },
    },
    null,
    2,
  )}\n`,
  'utf8',
);

if (!escribir && cambios.length > 0) {
  console.log('\n[clubes] Vuelve a ejecutarlo con --escribir para aplicar los cambios.');
}
if (fechasFuturas.some((f) => f.tipo === 'usuario')) {
  console.log(
    '[clubes] Hay usuarios con createdAt futuro: revísalos y, si procede, ' +
      'ejecuta la callable recalcularUsuario desde el panel.',
  );
}

process.exit(0);
