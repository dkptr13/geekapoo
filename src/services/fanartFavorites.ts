import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

// ======================================================
// FANARTS GUARDADOS
// ======================================================
//
// Un documento por fanart guardado:
//
//   users/{uid}/favoriteFanarts/{threadId}
//
// El id es el del hilo, así que guardar dos veces no duplica y
// quitar es un borrado directo. No se guarda una copia del hilo:
// la tarjeta siempre lee el hilo real, con sus contadores al día.
//
// Solo se consulta al abrir «Guardados» o al cargar el estado de
// los botones. No hay un listener permanente sobre esta colección.

export const FAVORITE_FANARTS = 'favoriteFanarts';

/** Ids guardados, del más reciente al más antiguo. */
export async function getFavoriteFanartIds(
  uid: string,
): Promise<string[]> {
  const snap = await getDocs(
    query(
      collection(db, 'users', uid, FAVORITE_FANARTS),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => d.id);
}

export async function addFavoriteFanart(
  uid: string,
  threadId: string,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, FAVORITE_FANARTS, threadId),
    { threadId, createdAt: serverTimestamp() },
    { merge: true },
  );
}

export async function removeFavoriteFanart(
  uid: string,
  threadId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, FAVORITE_FANARTS, threadId));
}

export async function setFavoriteFanart(
  uid: string,
  threadId: string,
  guardado: boolean,
): Promise<void> {
  if (guardado) await addFavoriteFanart(uid, threadId);
  else await removeFavoriteFanart(uid, threadId);
}
