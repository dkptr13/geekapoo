import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from '../lib/firebase';

// ======================================================
// "ME GUSTA" DE HILOS Y COMENTARIOS
// ======================================================
//
// Cada persona tiene UN documento por contenido, con su uid como
// id:
//
//     threads/{threadId}/likes/{uid}
//     comments/{commentId}/likes/{uid}
//
// Ese id determinista es lo que hace imposible tener dos "me gusta"
// de la misma persona: o existe el documento o no existe. Las reglas
// comprueban además que el uid del path sea el de quien escribe, así
// que nadie puede dar de alta (ni borrar) el "me gusta" de otra
// persona.
//
// ── Quién escribe los contadores ─────────────────────────────
//
// El cliente NO toca `likedBy` ni `likesCount`. Al crear o borrar
// este documento, la Cloud Function `onThreadLikeChanged` /
// `onCommentLikeChanged` recalcula el agregado desde la subcolección
// y lo deja en el documento padre. `likedBy` sigue existiendo porque
// la interfaz ya lo leía para pintar el corazón, pero ahora es una
// caché escrita SOLO por el servidor.
//
// ── Por qué una transacción ──────────────────────────────────
//
// Leer y luego escribir fuera de una transacción permitiría que dos
// pestañas se pisaran: las dos verían "no existe" y las dos crearían
// el documento. Al ir en transacción, la segunda reintenta y ve el
// documento de la primera, así que el resultado siempre es uno de
// los dos estados válidos (puesto o quitado), nunca un duplicado.

export const LIKES = 'likes';

export type LikeTarget = 'thread' | 'comment';

function likeRef(target: LikeTarget, targetId: string, uid: string) {
  const collectionName = target === 'thread' ? 'threads' : 'comments';
  return doc(db, collectionName, targetId, LIKES, uid);
}

async function toggleLikeDoc(
  target: LikeTarget,
  targetId: string,
  uid: string,
): Promise<boolean> {
  if (!uid) throw new Error('Falta la persona que da "me gusta".');
  if (!targetId) throw new Error('Falta el contenido al que dar "me gusta".');

  const ref = likeRef(target, targetId, uid);
  let nowLiked = false;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    if (snap.exists()) {
      tx.delete(ref);
      nowLiked = false;
      return;
    }

    tx.set(ref, {
      userId: uid,
      createdAt: serverTimestamp(),
    });
    nowLiked = true;
  });

  return nowLiked;
}

/** Da o quita el "me gusta" de quien llama a un hilo. */
export function toggleThreadLike(threadId: string, uid: string): Promise<boolean> {
  return toggleLikeDoc('thread', threadId, uid);
}

/** Da o quita el "me gusta" de quien llama a un comentario. */
export function toggleCommentLike(commentId: string, uid: string): Promise<boolean> {
  return toggleLikeDoc('comment', commentId, uid);
}
