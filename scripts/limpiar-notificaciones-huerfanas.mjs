// Busca avisos que apuntan a comentarios que ya no existen.
//
//   node scripts/limpiar-notificaciones-huerfanas.mjs            (simulación)
//   node scripts/limpiar-notificaciones-huerfanas.mjs --escribir (borra)
//
// Las notificaciones nuevas se limpian solas desde `onCommentDeleted`.
// Este script es para las que ya existían antes de desplegar esa
// función. Solo mira avisos de tipo comentario que tengan `commentId`;
// los avisos antiguos sin ese campo no se tocan para no borrar cosas
// válidas por error.

import { tokenDeAcceso } from './token-firebase.mjs';

const PROYECTO = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;
const ESCRIBIR = process.argv.includes('--escribir');

const TIPOS_DE_COMENTARIO = new Set([
  'comment_thread',
  'comment_reply',
  'mention',
  'comment_like',
  'comment_reaction',
]);

const token = await tokenDeAcceso();

const cabeceras = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const consulta = {
  structuredQuery: {
    from: [{ collectionId: 'notifications', allDescendants: true }],
    select: {
      fields: [
        { fieldPath: 'type' },
        { fieldPath: 'commentId' },
        { fieldPath: 'recipientId' },
      ],
    },
    limit: 10000,
  },
};

async function runQuery(body) {
  const respuesta = await fetch(`${BASE}:runQuery`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify(body),
  });
  if (!respuesta.ok) {
    throw new Error(`${respuesta.status} en runQuery: ${(await respuesta.text()).slice(0, 400)}`);
  }
  return respuesta.json();
}

function texto(fields, campo) {
  return fields?.[campo]?.stringValue ?? '';
}

async function existeComentario(commentId, cache) {
  if (cache.has(commentId)) return cache.get(commentId);

  const respuesta = await fetch(
    `${BASE}/comments/${encodeURIComponent(commentId)}`,
    { headers: cabeceras },
  );

  if (respuesta.status === 404) {
    cache.set(commentId, false);
    return false;
  }
  if (!respuesta.ok) {
    throw new Error(
      `${respuesta.status} leyendo comments/${commentId}: ${(await respuesta.text()).slice(0, 200)}`,
    );
  }

  cache.set(commentId, true);
  return true;
}

async function borrarDocumento(name) {
  const url = `https://firestore.googleapis.com/v1/${name}`;
  const respuesta = await fetch(url, { method: 'DELETE', headers: cabeceras });
  if (!respuesta.ok && respuesta.status !== 404) {
    throw new Error(`${respuesta.status} borrando ${name}`);
  }
}

const resultados = await runQuery(consulta);
const documentos = resultados.filter((fila) => fila.document).map((fila) => fila.document);
const cache = new Map();

let comentarios = 0;
let sinCommentId = 0;
let huerfanos = 0;

for (const documento of documentos) {
  const fields = documento.fields ?? {};
  const tipo = texto(fields, 'type');
  if (!TIPOS_DE_COMENTARIO.has(tipo)) continue;

  comentarios += 1;
  const commentId = texto(fields, 'commentId');
  if (!commentId) {
    sinCommentId += 1;
    continue;
  }

  if (await existeComentario(commentId, cache)) continue;

  huerfanos += 1;
  const ruta = documento.name.split('/documents/')[1] ?? documento.name;
  console.log(`${ruta} — ${tipo} — comentario ${commentId}`);

  if (ESCRIBIR) await borrarDocumento(documento.name);
}

console.log(
  `\n${documentos.length} avisos. ${comentarios} de comentario; ` +
    `${huerfanos} huérfanos; ${sinCommentId} antiguos sin commentId (no se tocan).`,
);
if (!ESCRIBIR && huerfanos > 0) {
  console.log('Simulación. Vuelve a ejecutarlo con --escribir para borrarlos.');
}
