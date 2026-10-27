import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { POLL_STATS, type PollVoteRow } from './polls';
import type { Poll, PollSummary } from '../types';

// ======================================================
// ENCUESTAS DE LOS CHATS
// ======================================================
//
// El mismo modelo que las encuestas de los hilos, pero
// colgando de un mensaje:
//
//   chats/{chatId}/messages/{messageId}.poll   configuración
//     (pregunta, opciones, caducidad, cierre, cambio de voto)
//
//   chats/{chatId}/messages/{messageId}/pollVotes/{uid}
//     el voto de cada persona { userId, optionId, createdAt }
//
//   chats/{chatId}/messages/{messageId}/pollStats/summary
//     el resumen que escribe la Cloud Function
//
// Los votos son privados: solo los lee quien votó. Antes la
// tarjeta contaba toda la subcolección en el cliente y cualquier
// miembro del chat podía saber quién había votado qué. Ahora los
// totales salen de `pollStats/summary`, que el cliente no puede
// escribir, y el único voto legible es el propio.
//
// Quién puede cerrar: el autor del mensaje y, en chats de
// club, los moderadores del club. La garantía está en las
// reglas (`firestore.rules`, rama de cierre de encuesta).
// ======================================================

export const CHAT_POLL_STATS_DOC = 'summary';

export type { PollVoteRow };

/** Referencia al documento de voto de una persona. */
export function chatVoteRef(chatId: string, messageId: string, uid: string) {
  return doc(db, 'chats', chatId, 'messages', messageId, 'pollVotes', uid);
}

/** Referencia al resumen agregado del servidor. */
export function chatPollSummaryRef(chatId: string, messageId: string) {
  return doc(
    db,
    'chats',
    chatId,
    'messages',
    messageId,
    POLL_STATS,
    CHAT_POLL_STATS_DOC,
  );
}

/**
 * Registra el voto de una persona en la encuesta de un mensaje.
 *
 * Igual que `votePoll` de los hilos: si ya había votado, solo
 * cambia de opción cuando el autor lo permitió. Las reglas lo
 * comprueban otra vez en el servidor.
 */
export async function voteChatPoll(
  chatId: string,
  messageId: string,
  poll: Poll,
  optionId: string,
  uid: string,
): Promise<void> {
  if (!(optionId in (poll.options ?? {}))) {
    throw new Error('Esa opción no existe en la encuesta.');
  }

  const ref = chatVoteRef(chatId, messageId, uid);
  const previo = await getDoc(ref);

  if (previo.exists()) {
    const yaElegida = previo.data()?.optionId as string | undefined;
    if (yaElegida === optionId) return;
    if (!poll.allowChangeVote) {
      throw new Error('En esta encuesta solo se puede votar una vez.');
    }
    await updateDoc(ref, { optionId, updatedAt: serverTimestamp() });
    return;
  }

  // `setDoc` sin `merge`: si ya existiera (dos pulsaciones a la
  // vez), la escritura se rechaza y vale el primer voto.
  await setDoc(ref, {
    userId: uid,
    optionId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Escucha SOLO el voto propio.
 *
 * Las reglas no dejan listar `pollVotes` ni siquiera a los
 * miembros del chat: solo el dueño del documento puede leerlo.
 */
export function listenMyChatPollVote(
  chatId: string,
  messageId: string,
  uid: string,
  alCambiar: (vote: PollVoteRow | null, error?: Error) => void,
): () => void {
  return onSnapshot(
    chatVoteRef(chatId, messageId, uid),
    (snap) => {
      if (!snap.exists()) {
        alCambiar(null);
        return;
      }
      const optionId = String(snap.data().optionId ?? '');
      alCambiar(
        optionId
          ? { id: snap.id, userId: uid, optionId }
          : null,
      );
    },
    (e) => {
      console.error('[Encuestas] Error escuchando tu voto del chat:', e);
      alCambiar(null, e);
    },
  );
}

/** Escucha el resumen agregado de la encuesta de un mensaje. */
export function listenChatPollSummary(
  chatId: string,
  messageId: string,
  alCambiar: (resumen: PollSummary | null, error?: Error) => void,
): () => void {
  return onSnapshot(
    chatPollSummaryRef(chatId, messageId),
    (snap) => {
      alCambiar(snap.exists() ? (snap.data() as PollSummary) : null);
    },
    (e) => {
      console.error('[Encuestas] Error escuchando el resumen del chat:', e);
      alCambiar(null, e);
    },
  );
}

/**
 * Cierra o reabre la encuesta de un mensaje.
 *
 * Solo el autor y (en clubes) los moderadores: las reglas lo
 * comprueban y rechazan cualquier otro cambio en el mensaje.
 */
export async function setChatPollClosed(
  chatId: string,
  messageId: string,
  closed: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    'poll.isClosed': closed,
  });
}
