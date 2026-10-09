import {
  collection,
  doc,
  deleteDoc,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { esUrlDeGifValida } from './gifs';
import { toggleLike } from './firestoreUtils';
import type { Comment, GifAttachment } from '../types';

// ======================================================
// COMENTARIOS POLIMÓRFICOS
// Un mismo comentario puede apuntar a un hilo, un anime,
// un episodio o un personaje mediante targetType + targetId.
// ======================================================

export const COMMENTS = 'comments';

const MAX_BODY = 5000;

/** Colecciones cuyo documento lleva contador de comentarios. */
const COUNTER_TARGETS: Partial<Record<Comment['targetType'], string>> = {
  thread: 'threads',
  anime: 'animes',
};

/**
 * Comprueba que el GIF venga de verdad de GIPHY o de Tenor.
 *
 * Es la MISMA comprobación que hace `firestore.rules`, aquí para
 * no fallar al publicar y allí para que no se pueda esquivar
 * desde la consola. Sin esto, el campo `gif` serviría para meter
 * cualquier URL (una de rastreo, una de contenido ilegal...)
 * disfrazada de GIF.
 */
function gifValido(gif: GifAttachment | undefined): boolean {
  if (!gif) return true;
  if (gif.provider !== 'giphy' && gif.provider !== 'tenor') return false;
  if (!gif.id || gif.id.length > 120) return false;
  return esUrlDeGifValida(gif.url) && esUrlDeGifValida(gif.previewUrl);
}

export interface NewCommentInput {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  targetType: Comment['targetType'];
  targetId: string;
  parentId: string | null;
  body: string;
  /** Imagen adjunta, opcional. */
  imageUrl?: string;
  /** GIF adjunto, opcional. Como máximo uno por comentario. */
  gif?: GifAttachment;
}

/**
 * Crea un comentario y sube el contador de comentarios del objetivo
 * en un único lote (writeBatch), de forma que no puedan quedar
 * desincronizados: o se escriben ambos, o ninguno.
 */
export async function createComment(input: NewCommentInput): Promise<string> {
  const body = input.body.trim();

  // Se puede publicar un comentario SOLO con un GIF y sin texto
  // (" responded with a GIF" es un meme tan viejo como los
  // foros), pero un comentario sin texto y sin GIF sí es vacío y
  // no vale.
  if (!body && !input.gif) throw new Error('El comentario no puede estar vacío.');
  if (body.length > MAX_BODY) {
    throw new Error(`El comentario no puede superar los ${MAX_BODY} caracteres.`);
  }
  if (!input.targetId) throw new Error('Falta indicar a qué elemento responde el comentario.');

  const gif = input.gif;

  // Un comentario es texto + UNA imagen o UN GIF. Si se mandan
  // las dos cosas, el GIF gana: una foto de 5 MB y un GIF
  // animado en el mismo comentario es de todo menos un foro.
  const imagen = gif ? undefined : input.imageUrl;

  if (gif && !gifValido(gif)) {
    throw new Error('Ese GIF no es válido.');
  }

  const ref = doc(collection(db, COMMENTS));

  const payload: Record<string, unknown> = {
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    targetType: input.targetType,
    targetId: input.targetId,
    parentId: input.parentId,
    body,
    likesCount: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  };

  // Solo se guarda si hay imagen, para no dejar el campo vacío.
  if (imagen) payload.imageUrl = imagen;
  if (gif) payload.gif = gif;

  const batch = writeBatch(db);
  batch.set(ref, payload);

  const counterCollection = COUNTER_TARGETS[input.targetType];
  if (counterCollection) {
    // `increment` suma en el servidor: no se pierde si dos personas
    // comentan a la vez (el código anterior leía y escribía el valor).
    batch.set(
      doc(db, counterCollection, input.targetId),
      { commentsCount: increment(1) },
      { merge: true },
    );
  }

  await batch.commit();

  return ref.id;
}

export async function toggleCommentLike(commentId: string, uid: string): Promise<boolean> {
  return toggleLike(doc(db, COMMENTS, commentId), uid, 'likesCount');
}

export async function updateCommentBody(commentId: string, body: string): Promise<void> {
  const clean = body.trim();
  if (!clean) throw new Error('El comentario no puede estar vacío.');
  if (clean.length > MAX_BODY) {
    throw new Error(`El comentario no puede superar los ${MAX_BODY} caracteres.`);
  }

  await updateDoc(doc(db, COMMENTS, commentId), {
    body: clean,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, COMMENTS, commentId));
  await batch.commit();
}
