import {
  collection,
  deleteDoc,
  doc,
  getAggregateFromServer,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  sum,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, invalidateCache, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from './firestoreUtils';
import { esGifValido } from './gifs';
import { dimsValidas, type ImageDims } from '../utils/imagenes';
import type { Comment, GifAttachment } from '../types';

// ======================================================
// COMENTARIOS POLIMÓRFICOS
// Un mismo comentario puede apuntar a un hilo, un anime,
// un episodio o un personaje mediante targetType + targetId.
// ======================================================

export const COMMENTS = 'comments';

const MAX_BODY = 5000;
const TTL_PERFIL_COMENTARIOS = 2 * 60 * 1000;
// El perfil también usa páginas de 50. Las reacciones totales se
// piden con una agregación aparte para que la estadística no se
// quede corta al reducir los comentarios cargados.
export const PROFILE_COMMENTS_PAGE_SIZE = 50;
const MAX_COMENTARIOS_PERFIL = PROFILE_COMMENTS_PAGE_SIZE;
const MAX_COMENTARIOS_GUSTADOS = 200;

/** Comentarios escritos por una persona, para su perfil. */
export function getCommentsByAuthor(
  authorId: string,
  force = false,
): Promise<Comment[]> {
  return cachedRead({
    key: `comments:author:${authorId}`,
    scope: PUBLIC_CACHE,
    ttlMs: TTL_PERFIL_COMENTARIOS,
    force,
    read: async () => {
      const meta = { name: 'comments:author', collection: COMMENTS, origin: 'ProfileView' };
      const ordenada = query(
        collection(db, COMMENTS),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc'),
        limit(MAX_COMENTARIOS_PERFIL + 1),
      );
      try {
        const snap = await measureRead(meta, (result) => result.size, () => getDocs(ordenada));
        return mapWithId<Comment>(snap);
      } catch (e) {
        if ((e as { code?: string }).code !== 'failed-precondition') throw e;
        const snap = await measureRead(
          meta,
          (result) => result.size,
          () => getDocs(query(
            collection(db, COMMENTS),
            where('authorId', '==', authorId),
            limit(MAX_COMENTARIOS_PERFIL + 1),
          )),
        );
        return mapWithId<Comment>(snap).sort(
          (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
        );
      }
    },
  });
}

/** Recuento exacto de comentarios escritos por una persona. */
export async function countCommentsByAuthor(authorId: string): Promise<number> {
  if (!authorId) return 0;
  const snap = await measureRead(
    { name: 'comments:author:count', collection: COMMENTS, origin: 'ProfileView' },
    () => 1,
    () => getCountFromServer(query(
      collection(db, COMMENTS),
      where('authorId', '==', authorId),
    )),
  );
  return snap.data().count;
}

/**
 * Suma de reacciones recibidas en TODOS los comentarios de una persona.
 *
 * Se usa una agregación para que el perfil pueda cargar solo 50
 * comentarios sin que la estadística de reacciones se quede corta.
 * Los comentarios antiguos sin `reactionsTotal` aportan 0, igual que
 * hacía el cálculo anterior cuando tampoco tenían `reactionCounts`.
 */
export function sumCommentReactionsByAuthor(authorId: string): Promise<number> {
  if (!authorId) return Promise.resolve(0);

  return cachedRead<number>({
    key: `comments:author:reactions:${authorId}`,
    scope: PUBLIC_CACHE,
    ttlMs: TTL_PERFIL_COMENTARIOS,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        {
          name: 'comments:author:reactions',
          collection: COMMENTS,
          origin: 'ProfileView',
        },
        () => 1,
        () =>
          getAggregateFromServer(
            query(collection(db, COMMENTS), where('authorId', '==', authorId)),
            { total: sum('reactionsTotal') },
          ),
      );
      return snap.data().total ?? 0;
    },
  });
}

/** Página anterior de comentarios de un perfil. */
export async function getMoreCommentsByAuthor(
  authorId: string,
  beforeIso: string,
): Promise<{ comments: Comment[]; hasMore: boolean }> {
  const ms = Date.parse(beforeIso);
  if (!authorId || Number.isNaN(ms)) return { comments: [], hasMore: false };

  const snap = await measureRead(
    { name: 'comments:author:anterior', collection: COMMENTS, origin: 'ProfileView' },
    (result) => result.size,
    () => getDocs(query(
      collection(db, COMMENTS),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
      startAfter(Timestamp.fromMillis(ms)),
      limit(MAX_COMENTARIOS_PERFIL + 1),
    )),
  );

  const all = mapWithId<Comment>(snap);
  return {
    comments: all.slice(0, MAX_COMENTARIOS_PERFIL),
    hasMore: all.length > MAX_COMENTARIOS_PERFIL,
  };
}

/** Comentarios a los que una persona dio "me gusta", para su perfil. */
export function getCommentsLikedBy(
  uid: string,
  force = false,
): Promise<Comment[]> {
  return cachedRead({
    key: `comments:liked:${uid}`,
    scope: PUBLIC_CACHE,
    ttlMs: TTL_PERFIL_COMENTARIOS,
    force,
    read: async () => {
      const meta = { name: 'comments:liked', collection: COMMENTS, origin: 'ProfileView' };
      const ordenada = query(
        collection(db, COMMENTS),
        where('likedBy', 'array-contains', uid),
        orderBy('createdAt', 'desc'),
        limit(MAX_COMENTARIOS_GUSTADOS),
      );
      try {
        const snap = await measureRead(meta, (result) => result.size, () => getDocs(ordenada));
        return mapWithId<Comment>(snap);
      } catch (e) {
        if ((e as { code?: string }).code !== 'failed-precondition') throw e;
        const snap = await measureRead(
          meta,
          (result) => result.size,
          () => getDocs(query(
            collection(db, COMMENTS),
            where('likedBy', 'array-contains', uid),
            limit(MAX_COMENTARIOS_GUSTADOS),
          )),
        );
        return mapWithId<Comment>(snap).sort(
          (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
        );
      }
    },
  });
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

  if (gif && !esGifValido(gif)) {
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
  invalidateCache(`comments:author:${input.authorId}`, PUBLIC_CACHE);

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
  // La edición no trae el autor sin otra lectura. Es una acción poco
  // frecuente: se invalida el índice del perfil y se recarga cuando
  // haga falta.
  invalidateCache('comments:author:', PUBLIC_CACHE);
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
  invalidateCache('comments:author:', PUBLIC_CACHE);
  invalidateCache('comments:liked:', PUBLIC_CACHE);

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
