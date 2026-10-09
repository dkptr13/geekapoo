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
import { toggleLike, type WithId } from './firestoreUtils';
import { normalizarPoll } from './polls';
import type { NewPollInput, Poll, Thread } from '../types';

// ======================================================
// HILOS DEL FORO
// ======================================================

export const THREADS = 'threads';

const LIMITS = {
  title: 200,
  body: 10000,
  tags: 6,
};

export interface NewThreadInput {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  body: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  /** Imagen adjunta, opcional. */
  imageUrl?: string;
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

  if (!title) throw new Error('El título no puede estar vacío.');
  if (!body) throw new Error('El mensaje no puede estar vacío.');
  if (title.length > LIMITS.title) {
    throw new Error(`El título no puede superar los ${LIMITS.title} caracteres.`);
  }
  if (body.length > LIMITS.body) {
    throw new Error(`El mensaje no puede superar los ${LIMITS.body} caracteres.`);
  }

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
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    tags: input.tags.length > 0 ? input.tags.slice(0, LIMITS.tags) : ['General', 'Debate'],
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    pinned: false,
    createdAt: serverTimestamp(),
  };

  // Solo se guarda el campo si hay imagen, para no dejar un
  // imageUrl vacío en los hilos sin foto.
  if (input.imageUrl) payload.imageUrl = input.imageUrl;

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

  if (input.categoryId) {
    batch.set(
      doc(db, 'categories', input.categoryId),
      { threadsCount: increment(1) },
      { merge: true },
    );
  }

  await batch.commit();

  return ref.id;
}

export async function toggleThreadLike(threadId: string, uid: string): Promise<boolean> {
  return toggleLike(doc(db, THREADS, threadId), uid, 'likesCount');
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
      const current = (catSnap.data()?.threadsCount as number) ?? 0;
      tx.set(catRef, { threadsCount: Math.max(0, current - 1) }, { merge: true });
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
