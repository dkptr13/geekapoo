import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { TOPE_VOTOS_ESCUCHA, type PollVoteRow } from './polls';
import type { Poll } from '../types';

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
// Sin contadores en la configuración y sin resumen del
// servidor: los votos se cuentan en el cliente (ver
// `calcularPoll` en `services/polls.ts`), igual que en la
// tarjeta de los hilos. Solo puede votar quien es miembro del
// chat, que es lo que comprueban las reglas en cada voto.
//
// Quién puede cerrar: el autor del mensaje y, en chats de
// club, los moderadores del club. La garantía está en las
// reglas (`firestore.rules`, rama de cierre de encuesta).
// ======================================================

export { TOPE_VOTOS_ESCUCHA };
export type { PollVoteRow };

/** Referencia al documento de voto de una persona. */
export function chatVoteRef(chatId: string, messageId: string, uid: string) {
  return doc(db, 'chats', chatId, 'messages', messageId, 'pollVotes', uid);
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
 * Escucha los votos de la encuesta de un mensaje.
 *
 * Sin filtros ni órdenes: la subcolección entera son los votos
 * y así no hace falta ningún índice compuesto.
 */
export function listenChatPollVotes(
  chatId: string,
  messageId: string,
  alCambiar: (votes: PollVoteRow[], error?: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, 'chats', chatId, 'messages', messageId, 'pollVotes'),
      limit(TOPE_VOTOS_ESCUCHA),
    ),
    (snap) => {
      const votes: PollVoteRow[] = snap.docs.map((d) => ({
        id: d.id,
        userId: String(d.data().userId ?? d.id),
        optionId: String(d.data().optionId ?? ''),
      }));
      alCambiar(votes.filter((v) => v.optionId !== ''));
    },
    (e) => {
      console.error('[Encuestas] Error escuchando los votos del chat:', e);
      alCambiar([], e);
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
