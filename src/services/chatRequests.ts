import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { toIsoString } from './firestoreUtils';
import { CHATS } from './chats';
import type { ChatRequest, ChatRequestStatus, ChatRequestType, User } from '../types';

// ======================================================
// SOLICITUDES DE CONVERSACIÓN Y DE ENTRADA A GRUPOS
// ======================================================
// Antes, al escribir el ID de alguien, el chat se creaba al
// instante y ya se podía escribir. Ahora hay un paso previo:
// se manda una solicitud y la conversación solo existe cuando
// la otra persona la acepta.
//
// El chat NO se crea al solicitar, sino al aceptar. Es la clave
// de que "no se pueda acceder al contenido sin permiso": el
// documento de conversación sencillamente no existe, así que no
// hay nada que leer. Y como la lista de chats filtra por
// memberIds, una conversación pendiente jamás asoma por ahí.
// ======================================================

export const CHAT_REQUESTS = 'chatRequests';

type Speaker = Pick<User, 'uid' | 'displayName' | 'username' | 'avatarUrl'>;

const nameOf = (u: Speaker): string => u.displayName || u.username;

export interface RequestResult {
  ok: boolean;
  error?: string;
  /** Id de la conversación creada, si se acaba de aceptar. */
  chatId?: string;
}

// ────────────────────────────────────────────────────────
// LECTURA
// ────────────────────────────────────────────────────────

/**
 * Suscribe las solicitudes del usuario, tanto recibidas como
 * enviadas.
 *
 * Son DOS consultas, no una sin filtro, y no es por gusto:
 *
 *  - La regla de lectura es
 *      resource.data.fromId == auth.uid || resource.data.toId == auth.uid
 *    y Firestore solo acepta una consulta si puede DEMOSTRAR que
 *    la regla se cumple para todo lo que devuelve. Con un "||",
 *    una consulta sin filtro no puede demostrarlo y se rechaza
 *    entera con permission-denied.
 *    En cambio, con "where('toId','==',uid)" el analizador sabe
 *    que el segundo brazo de la regla siempre se cumple, y acepta.
 *
 *  - Además, sin filtro se estaban leyendo las solicitudes de
 *    TODOS los usuarios, no solo las propias.
 */
export function subscribeRequests(
  uid: string,
  onData: (incoming: ChatRequest[], outgoing: ChatRequest[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const toMap = (d: QueryDocumentSnapshot<DocumentData>): ChatRequest => {
    const data = d.data() as Omit<ChatRequest, 'id' | 'createdAt' | 'respondedAt'> & {
      createdAt?: unknown;
      respondedAt?: unknown;
    };
    return {
      ...data,
      id: d.id,
      createdAt: toIsoString(data.createdAt),
      respondedAt: data.respondedAt ? toIsoString(data.respondedAt) : undefined,
    };
  };

  const byNewest = (a: ChatRequest, b: ChatRequest) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt);

  let incoming: ChatRequest[] = [];
  let outgoing: ChatRequest[] = [];

  const publish = () => {
    onData([...incoming].sort(byNewest), [...outgoing].sort(byNewest));
  };

  const unsubIncoming = onSnapshot(
    query(collection(db, CHAT_REQUESTS), where('toId', '==', uid)),
    (snap) => {
      incoming = snap.docs
        .map(toMap)
        .filter((r) => r.status === 'pending');
      publish();
    },
    (e) => onError?.(e),
  );

  const unsubOutgoing = onSnapshot(
    query(collection(db, CHAT_REQUESTS), where('fromId', '==', uid)),
    (snap) => {
      outgoing = snap.docs
        .map(toMap)
        .filter((r) => r.status === 'pending');
      publish();
    },
    (e) => onError?.(e),
  );

  return () => {
    unsubIncoming();
    unsubOutgoing();
  };
}

// ────────────────────────────────────────────────────────
// ENVIAR
// ────────────────────────────────────────────────────────

function alreadyPending(
  existing: { id: string; fromId: string; toId: string; type: string; groupId?: string }[],
  fromId: string,
  toId: string,
  type: ChatRequestType,
  groupId?: string,
): boolean {
  return existing.some(
    (r) =>
      r.fromId === fromId &&
      r.toId === toId &&
      r.type === type &&
      (groupId === undefined || r.groupId === groupId),
  );
}

export async function requestDirectChat(
  from: Speaker,
  to: Speaker,
  existing: ChatRequest[],
): Promise<RequestResult> {
  if (from.uid === to.uid) {
    return { ok: false, error: 'No puedes escribirte a ti mismo.' };
  }

  if (alreadyPending(existing, from.uid, to.uid, 'direct')) {
    return { ok: false, error: `Ya le has enviado una solicitud a ${nameOf(to)}.` };
  }

  try {
    await setDoc(doc(collection(db, CHAT_REQUESTS)), {
      type: 'direct',
      fromId: from.uid,
      fromName: nameOf(from),
      fromAvatar: from.avatarUrl,
      toId: to.uid,
      toName: nameOf(to),
      toAvatar: to.avatarUrl,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo enviar la solicitud.') };
  }
}

export async function requestGroupJoin(
  from: Speaker,
  group: { id: string; name: string; ownerId: string },
  existing: ChatRequest[],
): Promise<RequestResult> {
  if (group.ownerId === from.uid) {
    return { ok: false, error: 'Ya eres el creador de ese grupo.' };
  }

  if (alreadyPending(existing, from.uid, group.ownerId, 'group', group.id)) {
    return { ok: false, error: `Ya has pedido entrar en "${group.name}".` };
  }

  try {
    await setDoc(doc(collection(db, CHAT_REQUESTS)), {
      type: 'group',
      fromId: from.uid,
      fromName: nameOf(from),
      fromAvatar: from.avatarUrl,
      toId: group.ownerId,
      groupId: group.id,
      groupName: group.name,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo enviar la solicitud.') };
  }
}

// ────────────────────────────────────────────────────────
// RESPONDER
// ────────────────────────────────────────────────────────

/**
 * Acepta o rechaza una solicitud.
 *
 * Al ACEPTAR una solicitud directa se crea la conversación en
 * ese momento, y siempre como un documento NUEVO. Si alguien
 * había borrado antes esa conversación, así el historial viejo
 * no reaparece: empieza de cero, que es justo lo que se pidió.
 */
export async function respondToRequest(
  request: ChatRequest,
  status: Extract<ChatRequestStatus, 'accepted' | 'rejected' | 'cancelled'>,
  currentUser: Speaker,
  otherUser?: Speaker,
): Promise<RequestResult> {
  if (request.status !== 'pending') {
    return { ok: false, error: 'Esa solicitud ya no está pendiente.' };
  }

  try {
    if (status === 'accepted' && request.type === 'direct' && otherUser) {
      const ref = doc(collection(db, CHATS));

      await setDoc(ref, {
        type: 'direct',
        name: nameOf(otherUser),
        avatar: otherUser.avatarUrl,
        ownerId: currentUser.uid,
        memberIds: [currentUser.uid, otherUser.uid],
        hiddenFor: [],
        lastMessage: 'Conversación iniciada',
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: currentUser.uid,
        readAt: { [currentUser.uid]: serverTimestamp() },
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, CHAT_REQUESTS, request.id), {
        status,
        respondedAt: serverTimestamp(),
        resultingChatId: ref.id,
      });

      return { ok: true, chatId: ref.id };
    }

    if (status === 'accepted' && request.type === 'group' && request.groupId) {
      // Quien acepta es el dueño: por eso puede tocar memberIds.
      // Al añadir a la persona se le quita de "hiddenFor" para que
      // el grupo le aparezca en su lista.
      const chatRef = doc(db, CHATS, request.groupId);

      await setDoc(
        chatRef,
        {
          memberIds: arrayUnion(request.fromId),
          hiddenFor: arrayRemove(request.fromId),
        },
        { merge: true },
      );

      await updateDoc(doc(db, CHAT_REQUESTS, request.id), {
        status,
        respondedAt: serverTimestamp(),
        resultingChatId: request.groupId,
      });

      return { ok: true, chatId: request.groupId };
    }

    await updateDoc(doc(db, CHAT_REQUESTS, request.id), {
      status,
      respondedAt: serverTimestamp(),
    });

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo responder a la solicitud.') };
  }
}

/** Retira la solicitud de la lista del usuario (queda el registro con su estado). */
export async function withdrawRequest(
  requestId: string,
  currentUserId: string,
): Promise<void> {
  await updateDoc(doc(db, CHAT_REQUESTS, requestId), {
    status: 'cancelled',
    respondedAt: serverTimestamp(),
    // updatedBy solo sirve como rastro; la regla ya comprueba
    // que quien responde es el emisor o el destinatario.
    respondedBy: currentUserId,
  });
}

/**
 * Convierte un error del SDK en algo que se pueda enseñar.
 *
 * ── POR QUÉ MIRA `code` Y NO `message` ─────────────────────────────
 *
 * El código de permiso NO está en el texto del error. El SDK de Firestore
 * pone `code: 'permission-denied'` y deja el texto en humano: "Missing or
 * insufficient permissions.".
 *
 * Buscando la cadena 'permission-denied' dentro de `message` no se
 * encuentra nunca, así que la función caía al `return e.message` y
 * enseñaba el texto crudo del emulador de Firestore. Eso es
 * literalmente lo que se veía en el diálogo de añadir contacto.
 *
 * Con `code` se distingen los tres casos que aquí importan:
 * `permission-denied` (no puedes), `unavailable` (prueba otra vez) y
 * `not-found` (el chat ya no está). El resto se enseña tal cual, que
 * para un error raro el texto del SDK es más útil que un invento.
 */
function messageOf(e: unknown, fallback: string): string {
  const code = (e as { code?: string } | null)?.code ?? '';

  if (code === 'permission-denied') {
    return 'No tienes permiso para esta acción.';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  }
  if (code === 'not-found') {
    return 'Ya no existe. Puede que se haya borrado.';
  }
  if (code === 'failed-precondition' || code === 'unauthenticated') {
    return 'No se ha podido completar la operación.';
  }

  if (e instanceof Error && e.message) return e.message;

  return fallback;
}
