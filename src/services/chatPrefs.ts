import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';
import type { ChatPrefs } from '../types';
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
