/**
 * MIGRACIÓN / REPARACIÓN: resúmenes agregados de encuestas.
 *
 * Las tarjetas de encuesta ya NO cuentan los votos en el cliente:
 * los votos son privados y solo se puede leer el propio. Los
 * resultados salen de:
 *
 *   pollStats/{threadId}
 *   chats/{chatId}/messages/{messageId}/pollStats/summary
 *
 * Los triggers nuevos mantienen esos documentos a partir de este
 * despliegue, pero las encuestas que ya existían no tienen resumen
 * (sobre todo las de chat). Este script los recalcula desde los
 * documentos de voto con el Admin SDK.
 *
 * Es idempotente: cuenta el estado actual, no suma deltas. Se puede
 * ejecutar más de una vez sin descontar votos.
 *
 * Uso:
 *
 *   # Simulación (por defecto): no escribe nada.
 *   node scripts/migrar-resumenes-encuestas.mjs --project mi-proyecto
 *
 *   # Aplicar los cambios.
 *   node scripts/migrar-resumenes-encuestas.mjs --project mi-proyecto --escribir
 *
 * Necesita credenciales del Admin SDK:
 *   - En producción, `GOOGLE_APPLICATION_CREDENTIALS` o una cuenta con
 *     `gcloud auth application-default login`.
 *   - Con `FIRESTORE_EMULATOR_HOST` usa el emulador y no pide
 *     credenciales.
 *
 * Este script no se ejecuta solo ni se despliega.
 */
import { createRequire } from 'node:module';
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

if (!projectId) {
  console.error('Falta el proyecto. Pasa --project <id> o define GCLOUD_PROJECT.');
  process.exit(1);
}

const enEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp(
  enEmulador
    ? { projectId }
    : { projectId, credential: admin.credential.applicationDefault() },
);

const db = admin.firestore();
const { FieldValue } = admin.firestore;
const CAMPO_ID = admin.firestore.FieldPath.documentId();
const TAM_PAGINA = 200;

console.log(
  `[encuestas] Proyecto: ${projectId} · modo: ${
    escribir ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }${enEmulador ? ' · emulador' : ''}`,
);
console.log('[encuestas] Se recalculan resúmenes desde los votos existentes.');

async function porPaginas(consulta, tam, callback) {
  let ultimo = null;
  for (;;) {
    let pagina = consulta.orderBy(CAMPO_ID).limit(tam);
    if (ultimo) pagina = pagina.startAfter(ultimo);

    const snap = await pagina.get();
    for (const d of snap.docs) await callback(d);

    if (snap.size < tam) break;
    ultimo = snap.docs[snap.docs.length - 1];
  }
}

/** Cuenta los votos de una subcolección. Devuelve opciones y total. */
async function contarVotos(refVotos) {
  const votos = await refVotos.get();
  const options = {};

  votos.docs.forEach((voto) => {
    const optionId = voto.data()?.optionId;
    if (typeof optionId !== 'string' || !optionId) return;
    options[optionId] = (options[optionId] ?? 0) + 1;
  });

  const totalVotes = Object.values(options).reduce((total, n) => total + n, 0);
  return { options, totalVotes };
}

let hilos = 0;
let mensajes = 0;
let resumenes = 0;

await porPaginas(db.collection('threads'), TAM_PAGINA, async (thread) => {
  const poll = thread.data()?.poll;
  if (!poll || typeof poll !== 'object') return;

  hilos += 1;
  const { options, totalVotes } = await contarVotos(
    thread.ref.collection('pollVotes'),
  );
  const statsRef = db.doc(`pollStats/${thread.id}`);

  if (totalVotes === 0) {
    if (escribir) await statsRef.delete().catch(() => undefined);
  } else {
    resumenes += 1;
    if (escribir) {
      await statsRef.set({
        threadId: thread.id,
        options,
        totalVotes,
        actualizadoAt: FieldValue.serverTimestamp(),
      });
    }
  }

  if (hilos <= 10) {
    console.log(`  · hilo ${thread.id}: ${totalVotes} votos`);
  }
});

await porPaginas(db.collection('chats'), TAM_PAGINA, async (chat) => {
  const mensajesSnap = await chat.ref.collection('messages').get();

  for (const mensaje of mensajesSnap.docs) {
    const poll = mensaje.data()?.poll;
    if (!poll || typeof poll !== 'object') continue;

    mensajes += 1;
    const { options, totalVotes } = await contarVotos(
      mensaje.ref.collection('pollVotes'),
    );
    const statsRef = mensaje.ref.collection('pollStats').doc('summary');

    if (totalVotes === 0) {
      if (escribir) await statsRef.delete().catch(() => undefined);
    } else {
      resumenes += 1;
      if (escribir) {
        await statsRef.set({
          chatId: chat.id,
          messageId: mensaje.id,
          options,
          totalVotes,
          actualizadoAt: FieldValue.serverTimestamp(),
        });
      }
    }

    if (mensajes <= 10) {
      console.log(
        `  · chat ${chat.id}/${mensaje.id}: ${totalVotes} votos`,
      );
    }
  }
});

console.log('\n[encuestas] RESUMEN');
console.log(`  Encuestas de hilo:           ${hilos}`);
console.log(`  Encuestas de chat:           ${mensajes}`);
console.log(`  Resúmenes escritos:          ${resumenes}`);
console.log(
  `  ${escribir ? 'Aplicado' : 'Se aplicaría'} en pollStats y mensajes.`,
);
if (!escribir) {
  console.log('  Vuelve a ejecutarlo con --escribir para aplicar los cambios.');
}
