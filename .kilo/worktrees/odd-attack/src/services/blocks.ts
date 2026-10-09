import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

// ======================================================
// LISTA DE BLOQUEADOS
// ======================================================
// "Eliminar usuario" NO borra a nadie del sistema: solo deja
// de aparecer en tu lista, desaparece el chat con esa persona
// y no puedes volver a escribirle.
//
// Si lo bloqueado te manda una solicitud de conversación,
// la sigues viendo: tú decides. Si la aceptas, se desbloquea
// y vuelve a poder hablar con normalidad. Así sigue siendo
// cierto que "si quiere volver a hablar, lo puede volver a
// solicitar" sin convertirlo en algo irreversible.
//
// Se guarda como subcolección de QUIEN bloquea
// (users/{yo}/blocked/{ellos}). Si se guardara en el
// documento del bloqueado, cualquier usuario con sesión
// podría ver a quién tiene bloqueado cada persona.
// ======================================================

const blockedRef = (uid: string) => collection(db, 'users', uid, 'blocked');

/** Suscribe la lista de personas que el usuario tiene bloqueadas. */
export function subscribeBlocked(
  uid: string,
  onData: (blockedIds: string[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    blockedRef(uid),
    (snap) => onData(snap.docs.map((d) => d.id)),
    (e) => onError?.(e),
  );
}

/** Bloquea a una persona y le quita de paso el chat que hubiera. */
export async function blockUser(uid: string, blockedId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'blocked', blockedId), {
    uid: blockedId,
    blockedAt: serverTimestamp(),
  });
}

/** Desbloquea a una persona. */
export async function unblockUser(uid: string, blockedId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'blocked', blockedId));
}

export async function fetchBlocked(uid: string): Promise<string[]> {
  const snap = await getDocs(blockedRef(uid));
  return snap.docs.map((d) => d.id);
}
