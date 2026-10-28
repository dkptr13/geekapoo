/**
 * MIGRACIÓN: "me gusta" por usuario y contadores del servidor.
 *
 * A partir de este cambio, los "me gusta" de hilos y comentarios
 * viven en un documento por persona:
 *
 *   threads/{threadId}/likes/{uid}
 *   comments/{commentId}/likes/{uid}
 *
 * y `likedBy`, `likesCount` y `commentsCount` los mantiene la Cloud
 * Function. Los datos antiguos siguen en `likedBy` (y en los
 * contadores), así que este script:
 *
 *   1. Crea un documento de "me gusta" por cada uid de `likedBy`.
 *   2. Recalcula `likedBy`/`likesCount` desde esos documentos.
 *   3. Apunta en `engagement_ledger/{commentId}` qué comentarios ya
 *      se contaron, para que los triggers de alta/baja sean
 *      idempotentes.
 *   4. Recalcula `commentsCount` de hilos y animes desde los
 *      comentarios reales.
 *
 * Es idempotente: siempre parte del estado actual y no suma deltas.
 * Se puede ejecutar más de una vez sin duplicar "me gusta" ni
 * contar comentarios dos veces.
 *
 * ── Avisos y XP de los "me gusta" antiguos ─────────────────
 *
 * Crear los documentos de la subcolección dispara las Functions
 * nuevas, que pagan el XP del "me gusta" y crean su aviso. Si el
 * "me gusta" antiguo ya se había pagado, el libro de recompensas
 * (`rewardLedger`) y el id determinista del aviso hacen que no se
 * duplique nada. Si venía de antes de la gamificación y nunca se
 * pagó, la migración lo pone al día: es el único caso en el que
 * alguien puede recibir un aviso de un "me gusta" viejo.
 *
 * ── Orden recomendado ──────────────────────────────────────
 *
 *   1. Desplegar las Functions nuevas (quitan los triggers viejos
 *      de likes y añaden los de la subcolección).
 *   2. Ejecutar este script con `--escribir`.
 *   3. Desplegar la web nueva.
 *   4. Ejecutar este script OTRA VEZ con `--escribir`.
 *   5. Desplegar las reglas nuevas.
 *
 * La migración va ANTES de la web nueva a propósito. Si la web
 * nueva llega primero, alguien puede pulsar el corazón de un "me
 * gusta" antiguo: su documento todavía no existe en la
 * subcolección, el clic crea uno y el trigger recalcula `likedBy`
 * solo con ese documento. Los demás "me gusta" del hilo se
 * quedarían fuera de la caché y la migración ya no podría
 * recuperarlos. Migrando antes, todos los antiguos ya tienen su
 * documento cuando el primer cliente nuevo pulsa.
 *
 * La segunda pasada recoge los "me gusta" que hayan dado los
 * clientes que aún tengan la web vieja en caché entre los pasos 2
 * y 3. Es idempotente: repetirla no duplica nada.
 *
 * Si se ejecuta antes de desplegar las Functions, los triggers
 * antiguos verán los cambios de `likedBy` y podrían volver a pagar
 * XP. Por eso el paso 1 va primero. Y si se despliegan las reglas
 * antes de migrar, los clientes antiguos que sigan abiertos
 * recibirán un error al dar "me gusta"; no se pierde nada, pero es
 * mejor terminar la migración antes.
 *
 * Uso:
 *
 *   # Simulación (por defecto): no escribe nada.
 *   node scripts/migrar-me-gusta.mjs --project mi-proyecto
 *
 *   # Aplicar los cambios.
 *   node scripts/migrar-me-gusta.mjs --project mi-proyecto --escribir
 *
 * Credenciales:
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
const { FieldValue, FieldPath } = admin.firestore;
const CAMPO_ID = FieldPath.documentId();
const TAM_PAGINA = 200;
const TAM_LOTE = 450;

console.log(
  `[me-gusta] Proyecto: ${projectId} · modo: ${
    escribir ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }${enEmulador ? ' · emulador' : ''}`,
);
console.log(
  '[me-gusta] Se copian los likedBy existentes a la subcolección y se recalculan los contadores.',
);

/** Recorre una colección por páginas, sin cargarla entera de golpe. */
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

function uidsValidos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter((uid) => typeof uid === 'string' && uid.length > 0);
}

let likesLeidos = 0;
let likesCreados = 0;
let likesReparados = 0;
let padresActualizados = 0;
let ledgersCreados = 0;
let contadoresComentarios = 0;

/**
 * Copia `likedBy` a la subcolección y deja el padre recalculado.
 *
 * La escritura del padre va en transacción y vuelve a leer la
 * subcolección dentro de ella: si alguien da un "me gusta" mientras
 * la migración está corriendo, el disparador de la Function y esta
 * escritura no se pisan. El resultado siempre sale de los documentos
 * que hay en ese momento, no de la lista que se leyó al principio.
 */
async function migrarLikesDe(docSnap) {
  const data = docSnap.data() ?? {};
  const legacy = uidsValidos(data.likedBy);
  const likesSnap = await docSnap.ref.collection('likes').get();
  const existentes = new Set(likesSnap.docs.map((d) => d.id));

  likesLeidos += existentes.size;

  let batch = db.batch();
  let pendientes = 0;

  const commitSiToca = async () => {
    if (pendientes === 0) return;
    await batch.commit();
    batch = db.batch();
    pendientes = 0;
  };

  // Los documentos existentes son la fuente de verdad. Se corrige
  // `userId` si no coincide con el id del path, que es lo que leen
  // los triggers para pagar XP.
  for (const like of likesSnap.docs) {
    if (like.data()?.userId !== like.id) {
      likesReparados += 1;
      if (!escribir) continue;
      batch.set(like.ref, { userId: like.id }, { merge: true });
      pendientes += 1;
      if (pendientes >= TAM_LOTE) await commitSiToca();
    }
  }

  // Y se completa con lo que solo estaba en `likedBy`.
  for (const uid of legacy) {
    if (existentes.has(uid)) continue;

    existentes.add(uid);
    likesCreados += 1;
    if (!escribir) continue;

    batch.set(docSnap.ref.collection('likes').doc(uid), {
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    pendientes += 1;
    if (pendientes >= TAM_LOTE) await commitSiToca();
  }

  await commitSiToca();

  const likedBy = [...existentes].sort();
  const actual = uidsValidos(data.likedBy);
  const contador = typeof data.likesCount === 'number' ? data.likesCount : 0;
  const igual =
    actual.length === likedBy.length &&
    actual.every((uid, i) => uid === likedBy[i]) &&
    contador === likedBy.length;

  if (!igual) {
    if (escribir) {
      await db.runTransaction(async (tx) => {
        const [padre, actuales] = await Promise.all([
          tx.get(docSnap.ref),
          tx.get(docSnap.ref.collection('likes')),
        ]);

        const ahora = uidsValidos(padre.data()?.likedBy);
        const contadorAhora =
          typeof padre.data()?.likesCount === 'number'
            ? padre.data().likesCount
            : 0;
        const likedByAhora = idsDeLikes(actuales.docs.map((d) => d.id));
        const igualAhora =
          ahora.length === likedByAhora.length &&
          ahora.every((uid, i) => uid === likedByAhora[i]) &&
          contadorAhora === likedByAhora.length;

        if (!igualAhora) {
          tx.set(
            docSnap.ref,
            { likedBy: likedByAhora, likesCount: likedByAhora.length },
            { merge: true },
          );
        }
      });
    }
    padresActualizados += 1;
  }
}

/** Misma limpieza de ids que hace el servidor. */
function idsDeLikes(ids) {
  return [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))].sort();
}

// ── HILOS ───────────────────────────────────────────────────

console.log('\n[me-gusta] Hilos...');
await porPaginas(db.collection('threads'), TAM_PAGINA, async (docSnap) => {
  await migrarLikesDe(docSnap);
});

// ── COMENTARIOS ─────────────────────────────────────────────
//
// Además de los "me gusta", aquí se apunta qué comentarios ya se
// contaron y se cuentan por destino para recalcular commentsCount.

const comentariosPorDestino = new Map();

console.log('[me-gusta] Comentarios...');
await porPaginas(db.collection('comments'), TAM_PAGINA, async (docSnap) => {
  const data = docSnap.data() ?? {};

  await migrarLikesDe(docSnap);

  const targetType = typeof data.targetType === 'string' ? data.targetType : '';
  const targetId = typeof data.targetId === 'string' ? data.targetId : '';
  if (targetType && targetId) {
    const clave = `${targetType}\u0000${targetId}`;
    comentariosPorDestino.set(clave, (comentariosPorDestino.get(clave) ?? 0) + 1);
  }

  // Los comentarios que ya existían no tienen entrada en el libro.
  // Se marcan como "contados" sin tocar el contador: el recálculo
  // posterior pone el número real. Así un borrado futuro sí resta.
  const ledgerRef = db.doc(`engagement_ledger/${docSnap.id}`);
  const ledger = await ledgerRef.get();
  if (!ledger.exists) {
    if (escribir) {
      await ledgerRef.set({
        commentId: docSnap.id,
        targetType,
        targetId,
        action: 'created',
        at: FieldValue.serverTimestamp(),
      });
    }
    ledgersCreados += 1;
  }
});

// ── CONTADORES DE COMENTARIOS ───────────────────────────────

function contarEn(clave) {
  return comentariosPorDestino.get(clave) ?? 0;
}

async function recalcularComentariosDe(coleccion, targetType) {
  await porPaginas(db.collection(coleccion), TAM_PAGINA, async (docSnap) => {
    const data = docSnap.data() ?? {};
    const esperado = contarEn(`${targetType}\u0000${docSnap.id}`);
    const actual = typeof data.commentsCount === 'number' ? data.commentsCount : 0;

    if (actual === esperado) return;

    if (escribir) {
      // Si el contador cambió desde que se leyó la página, un
      // comentario nuevo o borrado acaba de moverlo: no se pisa.
      // Su propio trigger ya deja el número correcto.
      await db.runTransaction(async (tx) => {
        const padre = await tx.get(docSnap.ref);
        const ahora =
          typeof padre.data()?.commentsCount === 'number'
            ? padre.data().commentsCount
            : 0;

        if (ahora !== actual) return;
        tx.set(docSnap.ref, { commentsCount: esperado }, { merge: true });
      });
    }
    contadoresComentarios += 1;
  });
}

console.log('[me-gusta] Contadores de comentarios...');
await recalcularComentariosDe('threads', 'thread');
await recalcularComentariosDe('animes', 'anime');

console.log('\n[me-gusta] RESUMEN');
console.log(`  Documentos de "me gusta" leídos:       ${likesLeidos}`);
console.log(`  Documentos de "me gusta" creados:      ${likesCreados}`);
console.log(`  Documentos de "me gusta" reparados:    ${likesReparados}`);
console.log(`  Padres con likedBy/likesCount tocados: ${padresActualizados}`);
console.log(`  Entradas del libro de comentarios:     ${ledgersCreados}`);
console.log(`  Contadores de comentarios corregidos:  ${contadoresComentarios}`);
console.log(
  `  ${escribir ? 'Aplicado' : 'Se aplicaría'} en threads y comments.`,
);
if (!escribir) {
  console.log('  Vuelve a ejecutarlo con --escribir para aplicar los cambios.');
}
