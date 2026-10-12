import {
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { esUrlDeGifValida } from './gifs';
import { toggleLike } from './firestoreUtils';
import { dimsValidas, type ImageDims } from '../utils/imagenes';
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
  /**
   * Dimensiones de la imagen, medidas al subir.
   *
   * Igual que en los hilos: reservan el sitio sin tocar el
   * archivo. Solo valen enteros sensatos.
   */
  imageDims?: ImageDims | null;
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
  // las dos cosas, el GIF gana: una foto de 10 MB y un GIF
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
  // Las dimensiones van con ella, validadas.
  if (imagen) {
    payload.imageUrl = imagen;
    const dims = input.imageDims;
    if (dims && dimsValidas(dims.width, dims.height)) {
      payload.imageWidth = Math.floor(dims.width);
      payload.imageHeight = Math.floor(dims.height);
    }
  }
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

/**
 * Borra un comentario.
 *
 * Lo pueden hacer tres, y las reglas lo comprueban: quien lo
 * escribió, el admin y el moderador.
 *
 * ── El contador del hilo baja ─────────────────────────────
 *
 * El número de comentarios de la tarjeta se guarda DENRO del
 * hilo, así que borrar un comentario sin tocarlo dejaba el
 * contador marcando más comentarios de los que hay. Por eso la
 * lectura y el borrado van en la misma transacción: con dos
 * escrituras sueltas, un fallo entre medias dejaba el número
 * desfasado para siempre (y no hay ninguna forma de
 * recalcularlo desde el cliente).
 *
 * ── Las respuestas NO se borran ────────────────────────────
 *
 * Una respuesta es un comentario con `parentId`, así que al
 * borrar el padre sus respuestas se quedan colgando de algo que
 * ya no está. No se borran en cascada a propósito: perder
 * veinte respuestas de veinte personas porque el padre bore
 * sería peor que dejar el hueco. Quien lo borro decide si lo
 * quiere así (puede borrar las respuestas una a una, que es lo
 * que hace el equipo desde el panel).
 *
 * Devuelve de qué hilo era, para que quien lo llama pueda
 * cerrar el formulario de respuesta si estaba abierto.
 */
export async function deleteComment(
  commentId: string,
): Promise<{ targetType?: string; targetId?: string }> {
  const ref = doc(db, COMMENTS, commentId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return {};

    const data = snap.data() ?? {};
    const targetType = data.targetType as string | undefined;
    const targetId = data.targetId as string | undefined;

    // ── Todas las LECTURAS antes de la primera escritura ──────
    //
    // Firestore exige que en una transacción no se lea después de
    // haber escrito nada ("Firestore transactions require all reads
    // to be executed before all writes"), y lo lanza el propio SDK
    // antes de tocar el servidor. Por eso el hilo se lee AQUÍ, con
    // el `tx.delete` todavía sin pasar: al revés, el borrado de
    // cualquier comentario en un hilo falla siempre con
    // "invalid-argument", y como el error no menciona los
    // permisos parece un fallo de la regla del moderador.
    //
    // Nada de esto es culpa de quien borra: le pasa igual al autor
    // que al admin, y por eso las reglas de seguridad ya lo
    // permitían sin problema.
    const threadRef =
      targetType === 'thread' && targetId ? doc(db, 'threads', targetId) : null;
    const threadSnap = threadRef ? await tx.get(threadRef) : null;

    // Y ahora sí, a escribir.
    tx.delete(ref);

    if (threadRef && threadSnap?.exists()) {
      const actual = Number(threadSnap.data()?.commentsCount) || 0;
      tx.update(threadRef, { commentsCount: Math.max(0, actual - 1) });
    }

    return { targetType, targetId };
  });
}

/**
 * Texto plano de un comentario, para pintarlo en un reporte.
 *
 * Devuelve también `targetType` y `targetId`: sin ellos, quien
 * recibe esto no sabe DÓNDE está el comentario y el "ver en su
 * sitio" del panel acaba intentando abrir un hilo con el id del
 * comentario, que no existe.
 */
export async function textoDeComment(
  commentId: string,
): Promise<{
  body: string;
  authorName: string;
  targetType?: string;
  targetId?: string;
} | null> {
  const snap = await getDoc(doc(db, COMMENTS, commentId));
  if (!snap.exists()) return null;

  const data = snap.data() ?? {};
  return {
    body: String(data.body ?? '').slice(0, 200),
    authorName: String(data.authorName ?? 'desconocido'),
    targetType: typeof data.targetType === 'string' ? data.targetType : undefined,
    targetId: typeof data.targetId === 'string' ? data.targetId : undefined,
  };
}
