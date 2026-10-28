import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { esUrlDeGifValida } from './gifs';
import { dimsValidas, type ImageDims } from '../utils/imagenes';
import type { Comment, GifAttachment } from '../types';

// ======================================================
// COMENTARIOS POLIMÓRFICOS
// Un mismo comentario puede apuntar a un hilo, un anime,
// un episodio o un personaje mediante targetType + targetId.
// ======================================================

export const COMMENTS = 'comments';

const MAX_BODY = 5000;

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
 * Crea un comentario.
 *
 * El contador `commentsCount` del hilo o del anime NO se toca aquí:
 * lo mantiene la Cloud Function `onCommentCreated` a partir del
 * documento recién creado. Si lo escribiera el cliente, cualquiera
 * podría inflarlo desde la consola sin publicar nada.
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

  await setDoc(ref, payload);

  return ref.id;
}

export { toggleCommentLike } from './likes';

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
 * ── El contador del hilo lo baja la Cloud Function ──────────
 *
 * Antes se leía el hilo y se restaba uno en la misma transacción.
 * Ahora `commentsCount` es un campo que solo mantiene el servidor:
 * `onCommentDeleted` apunta en un registro qué comentarios llegaron
 * a contarse y resta una sola vez, aunque el trigger se repita.
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
 * Devuelve de qué contenido era, para que quien lo llama pueda
 * cerrar el formulario de respuesta si estaba abierto.
 */
export async function deleteComment(
  commentId: string,
): Promise<{ targetType?: string; targetId?: string }> {
  const ref = doc(db, COMMENTS, commentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};

  const data = snap.data() ?? {};
  const targetType = data.targetType as string | undefined;
  const targetId = data.targetId as string | undefined;

  await deleteDoc(ref);

  return { targetType, targetId };
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
