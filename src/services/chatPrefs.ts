import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';
import type { ChatPrefs } from '../types';
import type { FondoChat } from '../data/chatApariencia';
import { sujetarPrefs } from '../data/chatPrefs';

// ======================================================
// PREFERENCIAS PERSONALES POR CONVERSACIÓN
// ======================================================
//
// `chats/{chatId}/prefs/{uid}` guarda el color, el apodo, los
// avisos y el favorito que el usuario ve SOLO en su pantalla.
// Nada de esto se comparte con el otro participante: cada uno
// ve la conversación con sus propias prefs, nunca con las del
// otro. El fondo compartido del canal vive en `canales.ts`
// (`chatFondo`), y la apariencia global en `chatApariencia.ts`.
//
// La lógica pura (constantes + `sujetarPrefs`) vive en
// `data/chatPrefs.ts` para ser testeable con tsx.
// ======================================================

export { CHAT_PREFS_COLORS, CHAT_PREFS_MUTE, CHAT_PREFS_NOTIFY, sujetarPrefs } from '../data/chatPrefs';

/** Lee las preferencias guardadas del usuario para un chat. */
export async function getChatPrefs(uid: string, chatId: string): Promise<ChatPrefs> {
  try {
    const snap = await getDoc(doc(db, 'chats', chatId, 'prefs', uid));
    return sujetarPrefs(snap.data());
  } catch {
    return {};
  }
}

/**
 * Escucha las preferencias del usuario para un chat.
 *
 * Es UN documento (`chats/{chatId}/prefs/{uid}`), no una
 * consulta: se lee solo el de la conversación abierta. Aquí es
 * donde vive el fondo propio de cada chat.
 *
 * Devuelve la función para dejar de escuchar (hay que llamarla
 * al desmontar, o las suscripciones se acumulan).
 */
export function subscribeChatPrefs(
  chatId: string,
  uid: string,
  onData: (prefs: ChatPrefs) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'chats', chatId, 'prefs', uid),
    (snap) => onData(sujetarPrefs(snap.data())),
    (e) => onError?.(e),
  );
}

/** Guarda (merge) las preferencias del usuario para un chat. */
export async function saveChatPrefs(
  uid: string,
  chatId: string,
  prefs: ChatPrefs,
): Promise<ChatPrefs> {
  const limpio = sujetarPrefs(prefs);
  await setDoc(doc(db, 'chats', chatId, 'prefs', uid), limpio, { merge: true });
  return limpio;
}

/**
 * Guarda SOLO el fondo de una conversación.
 *
 * Va aparte de `saveChatPrefs` a propósito: al cambiar el fondo
 * no se tocan el apodo, los avisos ni el favorito, y al revés.
 * Un `setDoc` con merge sobre el documento entero escribiría
 * también los campos que no cambian, y eso es justo lo que
 * hacía que cambiar el fondo de un club se llevase por delante
 * el apodo de otro sitio.
 */
export async function saveFondoChat(
  uid: string,
  chatId: string,
  fondo: FondoChat | null,
): Promise<void> {
  await setDoc(
    doc(db, 'chats', chatId, 'prefs', uid),
    { fondo: fondo ?? null },
    { merge: true },
  );
}
