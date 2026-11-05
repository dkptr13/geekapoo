import {
  collection,
  doc,
  deleteDoc,
  increment,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import {
  FANART_CATEGORY_ID,
  FANART_CATEGORY_NAME,
  FANART_MAX_IMAGES,
  etiquetasDeFanart,
} from '../data/fanarts';
import type { WithId } from './firestoreUtils';
import { normalizarPoll } from './polls';
import { dimsValidas, type ImageDims } from '../utils/imagenes';
import type {
  FanartDraft,
  FanartImage,
  NewPollInput,
  Poll,
  Thread,
  TierListRef,
} from '../types';

// ======================================================
// HILOS DEL FORO
// ======================================================

export const THREADS = 'threads';

const LIMITS = {
  title: 200,
  body: 10000,
  tags: 6,
};

/**
 * Valida y normaliza las imágenes de un fanart antes de escribir.
 *
 * La regla de Firestore vuelve a comprobar la forma; aquí se da un
 * error legible y se descartan dimensiones corruptas sin impedir la
 * publicación. Las URLs tienen que ser https y las rutas de Storage
 * las valida el propio Storage al subir.
 */
function imagenesValidasFanart(images: FanartImage[]): FanartImage[] {
  if (!Array.isArray(images) || images.length < 1) {
    throw new Error('Añade al menos una imagen para publicar el fanart.');
  }
  if (images.length > FANART_MAX_IMAGES) {
    throw new Error(`Puedes subir como máximo ${FANART_MAX_IMAGES} imágenes.`);
  }

  return images.map((imagen) => {
    const url = typeof imagen.url === 'string' ? imagen.url.trim() : '';
    if (!/^https:\/\//i.test(url) || url.length > 1000) {
      throw new Error('Una de las imágenes no tiene una URL válida.');
    }

    if (dimsValidas(imagen.width, imagen.height)) {
      return {
        url,
        width: Math.floor(imagen.width as number),
        height: Math.floor(imagen.height as number),
      };
    }

    return { url };
  });
}

export interface NewThreadInput {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  body: string;
  categoryId: string;
  categoryName: string;
  /**
   * Si la categoría tiene documento en Firestore.
   *
   * Las categorías fijas de código (por ejemplo, "Debates") no lo
   * tienen. En ese caso NO se intenta crear el documento solo para
   * sumar el contador: las reglas solo dejan crear categorías al
   * equipo y el lote entero fallaría, impidiendo publicar el hilo.
   */
  categoryInFirestore?: boolean;
  tags: string[];
  /** Imagen adjunta, opcional. */
  imageUrl?: string;
  /**
   * Dimensiones de la imagen, medidas al subir.
   *
   * Se guardan para reservar su sitio antes de descargarla.
   * Solo valen enteros sensatos; lo demás se ignora y la
   * imagen se sirve igual, sin reserva.
   */
  imageDims?: ImageDims | null;
  /** Tier list adjunta (solo referencia: vive en su documento). */
  tierList?: TierListRef | null;
  /**
   * Si viene, la publicación es un Fanart: se fuerza la categoría
   * fija, se guardan las imágenes y los datos artísticos, y el
   * cuerpo puede quedar vacío.
   */
  fanart?: FanartDraft;
  /**
   * Encuesta opcional.
   *
   * Se VALIDA y se normaliza aquí, no en el componente: el
   * servicio es el que sabe qué se puede guardar, y las reglas de
   * Firestore vuelven a comprobarlo en el servidor. Si viene mal
   * construida, salta un error legible en vez de escribir una
   * encuesta a medias.
   */
  poll?: NewPollInput;
}

/**
 * Crea un hilo y devuelve su id.
 *
 * El id se genera ANTES de escribir (doc(collection(...)) en vez de
 * addDoc(...)) y se devuelve explícitamente. Con addDoc el id solo
 * existe en la respuesta del servidor, así que el documento almacenado
 * se quedaba sin campo `id` y luego los "me gusta" no encontraban el
 * hilo. Ese era el bug de CommunityContext.tsx:163.
 */
export async function createThread(input: NewThreadInput): Promise<string> {
  const title = input.title.trim();
  const body = input.body.trim();
  const esFanart = Boolean(input.fanart);

  if (!title) throw new Error('El título no puede estar vacío.');
  if (!body && !esFanart) throw new Error('El mensaje no puede estar vacío.');
  if (title.length > LIMITS.title) {
    throw new Error(`El título no puede superar los ${LIMITS.title} caracteres.`);
  }
  if (body.length > LIMITS.body) {
    throw new Error(`El mensaje no puede superar los ${LIMITS.body} caracteres.`);
  }

  const imagenesFanart = esFanart ? imagenesValidasFanart(input.fanart!.images) : [];
  const categoryId = esFanart ? FANART_CATEGORY_ID : input.categoryId;
  const categoryName = esFanart ? FANART_CATEGORY_NAME : input.categoryName;
  const tags = esFanart
    ? etiquetasDeFanart(
        input.tags.length > 0 ? input.tags : ['Fanart'],
        input.fanart!.medium,
        input.fanart!.original,
      )
    : input.tags.length > 0
      ? input.tags.slice(0, LIMITS.tags)
      : ['General', 'Debate'];

  const ref = doc(collection(db, THREADS));

  // El hilo y el contador de su categoría se escriben en el mismo
  // lote: o suben los dos, o no cambia ninguno. Con dos escrituras
  // sueltas el contador se desincroniza en cuanto algo falla entre
  // medias.
  const batch = writeBatch(db);

  const payload: Record<string, unknown> = {
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    title,
    body,
    categoryId,
    categoryName,
    tags,
    pinned: false,
    createdAt: serverTimestamp(),
  };

  if (esFanart) {
    const fanart = input.fanart!;
    const primera = imagenesFanart[0];

    payload.kind = 'fanart';
    payload.fanart = {
      original: fanart.original,
      medium: fanart.medium,
      ...(fanart.source?.trim()
        ? { source: fanart.source.trim().slice(0, 120) }
        : {}),
    };
    payload.images = imagenesFanart;
    payload.imageUrl = primera.url;
    if (primera.width && primera.height) {
      payload.imageWidth = primera.width;
      payload.imageHeight = primera.height;
    }

    // La consulta de «más populares» ordena por `likesCount`. Si el
    // campo no existiera hasta el primer me gusta, la publicación
    // no saldría en esa pestaña. El servidor seguirá siendo quien
    // mueva los contadores.
    payload.likesCount = 0;
    payload.likedBy = [];
    payload.commentsCount = 0;
  }

  // Solo se guarda el campo si hay imagen, para no dejar un
  // imageUrl vacío en los hilos sin foto. Las dimensiones van
  // con ella, validadas: reservan el sitio sin tocar el archivo.
  if (!esFanart && input.imageUrl) {
    payload.imageUrl = input.imageUrl;
    const dims = input.imageDims;
    if (dims && dimsValidas(dims.width, dims.height)) {
      payload.imageWidth = Math.floor(dims.width);
      payload.imageHeight = Math.floor(dims.height);
    }
  }

  // La tier list viaja como referencia (id + título): el
  // contenido vive en su documento y se lee al pintar.
  if (input.tierList) {
    payload.tierList = {
      tierListId: input.tierList.tierListId,
      title: input.tierList.title.slice(0, 160),
    };
  }

  // La encuesta se escribe DENTRO del hilo, en el mismo lote. Si
  // fuera un documento aparte, un fallo entre medias dejaría un
  // hilo con una encuesta a la que no apunta nadie (o al revés,
  // una encuesta sin hilo). Solo si viene con pregunta: un
  // formulario a medio rellenar no crea una encuesta fantasma.
  let poll: Poll | null = null;
  if (input.poll?.question.trim()) {
    poll = normalizarPoll(input.poll);
    payload.poll = poll;
  }

  batch.set(ref, payload);

  if (!esFanart && categoryId && input.categoryInFirestore !== false) {
    batch.set(
      doc(db, 'categories', categoryId),
      { threadsCount: increment(1) },
      { merge: true },
    );
  }

  await batch.commit();

  return ref.id;
}

export { toggleThreadLike } from './likes';

/**
 * Adjunta (o cambia) la tier list de un hilo propio ya publicado.
 *
 * Solo la referencia: las reglas solo dejan tocar `tierList`
 * al autor, y el contenido sigue en su documento.
 */
export async function adjuntarTierList(
  threadId: string,
  ref: TierListRef | null,
): Promise<void> {
  await updateDoc(doc(db, THREADS, threadId), {
    tierList: ref
      ? { tierListId: ref.tierListId, title: ref.title.slice(0, 160) }
      : null,
  });
}

export interface EditThreadInput {
  title: string;
  body: string;
  tags: string[];
}

export async function updateThread(
  threadId: string,
  input: EditThreadInput,
): Promise<void> {
  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) throw new Error('El título no puede estar vacío.');
  if (!body) throw new Error('El mensaje no puede estar vacío.');

  await updateDoc(doc(db, THREADS, threadId), {
    title,
    body,
    tags: input.tags.slice(0, LIMITS.tags),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteThread(threadId: string): Promise<void> {
  const ref = doc(db, THREADS, threadId);

  // El hilo y el contador de su categoría se ajustan en la misma
  // transacción, para que el número de la categoría nunca se
  // quede desfasado respecto a los hilos reales.
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const categoryId = snap.data()?.categoryId as string | undefined;

    if (categoryId) {
      const catRef = doc(db, 'categories', categoryId);
      const catSnap = await tx.get(catRef);
      // Las categorías fijas de código no tienen documento. No se
      // crea uno vacío solo para restar el contador: la transacción
      // fallaría y el hilo no se podría borrar.
      if (catSnap.exists()) {
        const current = (catSnap.data()?.threadsCount as number) ?? 0;
        tx.set(catRef, { threadsCount: Math.max(0, current - 1) }, { merge: true });
      }
    }

    tx.delete(ref);
  });
}

export async function setThreadPinned(threadId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, THREADS, threadId), { pinned });
}

export function buildThreadQuery(categoryId?: string | null) {
  const constraints = categoryId
    ? [where('categoryId', '==', categoryId), orderBy('createdAt', 'desc')]
    : [orderBy('createdAt', 'desc')];

  return query(collection(db, THREADS), ...constraints);
}

export type ThreadWithId = WithId<Thread>;
