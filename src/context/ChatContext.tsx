import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  clearConversationFor,
  createGroupChat as createGroupChatService,
  findGroupByCode,
  hideChat,
  inviteGroupMember,
  leaveGroup,
  markChatRead,
  messageOf,
  purgeLegacyLocalChats,
  removeGroupMember,
  sendChatMessage as sendChatMessageService,
  setGroupAvatar as setGroupAvatarService,
  subscribeChats,
  subscribeMessages,
  subscribeOcultos,
  syncGroupMemberCount,
  transferGroupOwnership,
} from '../services/chats';

import {
  requestDirectChat,
  requestGroupJoin,
  respondToRequest,
  subscribeRequests,
  withdrawRequest,
} from '../services/chatRequests';

import { blockUser, subscribeBlocked, unblockUser } from '../services/blocks';

import { acceptsChatRequests } from '../services/accountSettings';

import {
  ChatMessage,
  ChatReplyTo,
  ChatRequest,
  ChatRoom,
  GifAttachment,
  LocationAttachment,
  Poll,
  TierListRef,
  User,
} from '../types';
import { SIN_NUEVOS, corteDeNuevos, type CorteNuevos } from '../utils/chatLectura';
import { useAuth } from './AuthContext';
// ======================================================
// CHATS SOBRE FIRESTORE, CON SOLICITUDES
// ======================================================
// Nada de chats instantáneos. Para hablar con alguien nuevo hay
// que mandar una solicitud, y el documento de conversación solo
// se crea cuando la aceptan. Lo mismo con los grupos: se crea
// con una sola persona (quien lo funda) y el resto entra por
// solicitud.
//
// Consecuencia práctica: el contenido de una conversación o un
// grupo no existe hasta que hay permiso. No hace falta una
// comprobación extra en la interfaz, porque si no estás en
// memberIds las reglas ni siquiera te dejan leerlo.
// ======================================================

type ChatResult = { ok: boolean; roomId?: string; chatId?: string; error?: string };

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  messages: Record<string, ChatMessage[]>;
  activeRoom: ChatRoom | null;
  loading: boolean;
  error: string | null;

  /**
   * Envía un mensaje.
   *
   * `gif` es opcional y sustituye al texto: un mensaje puede no
   * tener texto si lleva un GIF, pero no puede no tener ninguna de
   * las dos cosas (eso lo comprueba el servicio).
   *
   * Lo mismo con `adjunto`, que además lleva la foto y la ubicación.
   * Los dos pueden ir a la vez con texto: quien mande "aquí" con la
   * ubicación adjunta no pierde el texto.
   */
  sendMessage: (
    roomId: string,
    text: string,
    gif?: GifAttachment,
    adjunto?: { imageUrl?: string; location?: LocationAttachment },
    respuesta?: ChatReplyTo | null,
    encuesta?: Poll | null,
    tier?: TierListRef | null,
  ) => void;

  // ── Solicitudes ────────────────────────────────────
  incomingRequests: ChatRequest[];
  outgoingRequests: ChatRequest[];
  sendChatRequest: (target: User) => Promise<ChatResult>;
  respondToChatRequest: (request: ChatRequest, accept: boolean) => Promise<ChatResult>;
  cancelChatRequest: (request: ChatRequest) => Promise<ChatResult>;

  // ── Bloqueos ──────────────────────────────────────
  blockedIds: string[];
  isBlocked: (userId: string) => boolean;
  blockPerson: (userId: string, room?: ChatRoom) => Promise<ChatResult>;

  // ── Grupos ────────────────────────────────────────
  /** Crea un grupo con una sola persona: su creador. */
  createGroupChat: (name: string) => Promise<ChatResult>;
  /**
   * Cambia la foto del grupo.
   *
   * Solo el dueño puede, y eso no lo decide esta función: lo decide la
   * regla de seguridad de Firestore, que ya limita el campo `avatar` a
   * los dueños. Aquí solo se sube el fichero y se escribe el campo, y
   * si la regla lo rechaza el error vuelve al usuario con el texto de la
   * regla.
   */
  setGroupAvatar: (room: ChatRoom, file: File) => Promise<ChatResult>;
  /** Busca un grupo por su código y pide entrar. */
  joinGroupByCode: (code: string) => Promise<ChatResult>;

  // ── Gestión de la conversación ─────────────────────
  removeConversation: (room: ChatRoom) => Promise<ChatResult>;
  /** Deja la conversación en blanco, solo para quien la vacía:
   *  los mensajes siguen ahí para los demás. */
  clearConversation: (room: ChatRoom) => Promise<ChatResult>;
  addMember: (room: ChatRoom, target: User) => Promise<ChatResult>;
  removeMember: (room: ChatRoom, memberId: string) => Promise<ChatResult>;

  isReadByEveryone: (messageId: string, createdAt: string) => boolean;

  /**
   * Parchea un mensaje en la lista local sin tocar el servidor.
   *
   * Es lo que hace que editar (y borrar) se VEAN al instante: la
   * callable tarda (arranque en frío incluido) y esperar su vuelta
   * con la caja congelada es la "tardanza" que se nota. El servidor
   * sigue mandando: cuando su escritura llega por el listener,
   * pisa el parche con la verdad. Y si falla, quien llama revierte
   * con otro parche.
   */
  parchearMensaje: (
    roomId: string,
    messageId: string,
    parche: Partial<ChatMessage>,
  ) => void;
  setChatOpen: (open: boolean) => void;
  unreadRoomIds: string[];
  hasUnread: boolean;

  /**
   * Dónde va la barra de "mensajes nuevos" en la conversación abierta.
   *
   * `{ indice: -1, total: 0 }` significa que no hay barra: no hay
   * mensajes nuevos, o la conversación todavía no ha cargado.
   */
  corteNuevos: CorteNuevos;

  /**
   * Ids de mensajes que este usuario ocultó solo para sí mismo.
   *
   * Vienen de `users/{uid}/hiddenMessages` y se filtran al pintar:
   * el mensaje sigue intacto para los demás.
   */
  hiddenIds: Set<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, getUserByChatId, usersList } = useAuth();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [chatsError, setChatsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ChatRequest[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  // Mensajes ocultos solo para este usuario ("eliminar solo para
  // mí"). Es un conjunto de ids que se filtra al pintar; el
  // documento del mensaje no se toca.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!currentUser) {
      setHiddenIds(new Set());
      return;
    }

    return subscribeOcultos(currentUser.uid, setHiddenIds, (e: unknown) =>
      console.error('[Chats] No se pudieron leer los mensajes ocultos:', e),
    );
  }, [currentUser]);

  const [chatOpen, setChatOpen] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'visible',
  );

  const error = [chatsError, messagesError, sendError].filter(Boolean).join(' · ') || null;

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Limpieza de los chats antiguos del navegador (versión localStorage).
  useEffect(() => {
    const removed = purgeLegacyLocalChats();
    if (removed > 0) {
      console.info(
        `[Chats] Se eliminaron ${removed} claves de localStorage del sistema anterior.`,
      );
    }
  }, []);

  const clearAll = useCallback(() => {
    setRooms([]);
    setMessages({});
    setActiveRoomId(null);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setBlockedIds([]);
    setLoading(false);
    setChatsError(null);
    setMessagesError(null);
    setSendError(null);
  }, []);

  // ── Conversaciones del usuario ───────────────────────
  useEffect(() => {
    if (!currentUser) {
      clearAll();
      return;
    }

    setLoading(true);
    setChatsError(null);

    const unsub = subscribeChats(
      currentUser.uid,
      (data) => {
        setRooms(data);
        setLoading(false);
        setChatsError(null);
      },
      (e) => {
        console.error('[Chats] Error al leer conversaciones:', e);
        setChatsError(
          `No se pudo leer la lista de conversaciones: ${messageOf(e, 'error desconocido')}`,
        );
        setLoading(false);
      },
    );

    return unsub;
  }, [currentUser, clearAll]);

  // ── Solicitudes (recibidas y enviadas) ───────────────
  useEffect(() => {
    if (!currentUser) return;

    return subscribeRequests(
      currentUser.uid,
      (incoming, outgoing) => {
        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
      },
      (e) => {
        console.error('[Chats] Error al leer las solicitudes:', e);
        setChatsError(
          `No se pudieron leer las solicitudes: ${messageOf(e, 'error desconocido')}`,
        );
      },
    );
  }, [currentUser]);

  // ── Lista de bloqueados ─────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    return subscribeBlocked(
      currentUser.uid,
      (ids) => setBlockedIds(ids),
      (e) => console.error('[Chats] Error al leer los bloqueados:', e),
    );
  }, [currentUser]);

  // Ya no hay un directorio público de grupos: se entra con el
  // CÓDIGO que comparte quien lo creó, porque los nombres se
  // repiten. No hace falta ningún listener; el grupo se busca
  // bajo demanda al escribir el código.

  // Selecciona la primera conversación cuando aún no hay ninguna activa.
  //
  // Se prefieren las privadas: con la sección de clubes dentro de
  // «Chats», el primer documento de la lista puede ser un club, y
  // entonces entrar en la pestaña «Privados» te dejaría con un chat
  // grupal abierto. Es un detalle, pero de los que despistan.
  useEffect(() => {
    if (rooms.length === 0) return;
    setActiveRoomId((prev) => {
      if (prev && rooms.some((r) => r.id === prev)) return prev;
      const privadas = rooms.filter((r) => r.type !== 'club');
      return (privadas[0] ?? rooms[0]).id;
    });
  }, [rooms]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  /**
   * Dónde poner la barra de "mensajes nuevos" en cada conversación.
   *
   * ── POR QUÉ ESTÁ EN UN MAPA Y NO SE CALCULA AL RENDERIZAR ───────
   *
   * Porque al abrir la conversación se marca como leída de
   * inmediato, y la marca pasa a ser la hora del servidor. Si la
   * barra se calculara en el render con la marca actual, en cuanto
   * se marcara todos los mensajes serían "anteriores a la marca" y la
   * barra desaparecería. Se calcularía contra sí misma.
   *
   * Así que se congela una vez, al abrir, y no vuelve a cambiar
   * hasta que se vuelva a abrir la conversación.
   *
   * Es un `Map` en estado, y no un `ref`, porque la barra se pinta
   * durante el render y tiene que provocar un repintado cuando se
   * calcula.
   */
  const [cortePorChat, setCortePorChat] = useState<Record<string, CorteNuevos>>({});

  // Marca de "vaciar conversación" del usuario actual. Se declara
  // aquí, ANTES del efecto de mensajes, porque hace falta para
  // saber qué mensajes se le enseñan.
  const myClearedAt = activeRoom?.clearedAt?.[currentUser?.uid ?? ''];

  // ── Mensajes del chat abierto ────────────────────────
  useEffect(() => {
    if (!activeRoomId || !currentUser) return;

    let cancelled = false;
    let unsub: (() => void) | null = null;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;

      unsub = subscribeMessages(
        activeRoomId,
        myClearedAt,
        (data) => {
          if (cancelled) return;
          attempts = 0;
          setMessagesError(null);
          setMessages((prev) => ({ ...prev, [activeRoomId]: data }));
        },
        (e) => {
          if (cancelled) return;
          attempts += 1;

          if (attempts <= 3) {
            console.warn(
              `[Chats] Fallo al leer mensajes (intento ${attempts}/3). Reintentando...`,
              e,
            );
            setTimeout(attach, 1500 * attempts);
            return;
          }

          console.error('[Chats] Error al leer mensajes:', e);
          setMessagesError(
            `No se pudieron leer los mensajes: ${messageOf(e, 'error desconocido')}`,
          );
        },
      );
    };

    attach();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
    // myClearedAt entra en las dependencias porque es lo que
    // decide qué mensajes se ven. Sin ella, al pulsar "Vaciar
    // conversación" el listener NO se re-suscribía y se quedaba
    // con el valor antiguo: la marca se guardaba en Firestore
    // pero no ocultaba nada en pantalla.
    //
    // Se pone la marca y no el array "rooms" entero a propósito:
    // rooms cambia con cada mensaje enviado (lastMessageAt), y
    // depender de él resuscribiría el listener constantemente.
  }, [activeRoomId, currentUser, myClearedAt]);

  // ── Conversaciones con mensajes sin leer ─────────────
  const unreadRoomIds = useMemo(() => {
    if (!currentUser) return [];

    return rooms
      .filter((room) => {
        const lastAt = Date.parse(room.lastMessageAt ?? '');
        if (Number.isNaN(lastAt)) return false;
        if (room.id === activeRoomId && chatOpen) return false;

        const mine = room.readAt?.[currentUser.uid];
        const mineAt = mine ? Date.parse(mine) : NaN;
        if (Number.isNaN(mineAt)) return true;

        if (lastAt <= mineAt) return false;
        return room.lastMessageSenderId !== currentUser.uid;
      })
      .map((room) => room.id);
  }, [rooms, currentUser, activeRoomId, chatOpen]);

  // ── La barra se recalcula al cambiar de conversación ──
  //
  // Sin esto, salir de un chat y volver a entrar enseñaría la barra
  // vieja: `cortePorChat` seguiría guardando la frontera de la
  // primera apertura, aunque ya esté todo leído.
  //
  // Va ANTES del efecto que marca como leído para que, en el mismo
  // cambio de conversación, primero se borre y después se calcule
  // la frontera nueva con la marca de lectura actual.
  useEffect(() => {
    setCortePorChat({});
  }, [activeRoomId]);

  // ── Marcar como leídos los mensajes que llegan ───────
  //
  // La frontera de la barra de "mensajes nuevos" se guarda ANTES de
  // marcar, y esto no es un detalle de orden: al marcar, la marca de
  // lectura pasa a ser la hora del servidor, y la barra se calcularía
  // contra sí misma. Es decir, la barra desaparecería en el mismo
  // instante en que debería aparecer, y nunca se vería.
  //
  // Por eso `marcarComoLeidos` fija primero `cortePorChat`, que ya
  // no vuelve a cambiar aunque la marca de lectura avance.
  useEffect(() => {
    if (!activeRoomId || !currentUser) return;
    if (!chatOpen || !tabVisible) return;

    const list = messages[activeRoomId];
    if (!list || list.length === 0) return;

    const newest = list[list.length - 1];
    const newestAt = Date.parse(newest.createdAt);
    if (Number.isNaN(newestAt)) return;

    const room = rooms.find((r) => r.id === activeRoomId);
    const mine = room?.readAt?.[currentUser.uid];

    // La conversación abierta se marca leída SIEMPRE que se mire,
    // incluso si el scroll está arriba leyendo historia vieja. Es lo
    // que hace el resto de la mensajería: abrir es leer. Si no, el
    // punto se quedaría puesto mientras estás dentro, que es peor:
    // el aviso seguiría ahí con la conversación abierta delante.
    if (mine && Date.parse(mine) >= newestAt) return;

    // La frontera se congela solo la primera vez que se abre la
    // conversación. Si ya estaba guardada, el usuario ya vio la barra
    // y no tiene sentido volver a ponerla entre los mismos mensajes.
    setCortePorChat((prev) => {
      if (prev[activeRoomId]) return prev;

      return {
        ...prev,
        [activeRoomId]: corteDeNuevos(list, mine, currentUser.uid),
      };
    });

    markChatRead(activeRoomId, currentUser.uid).catch((e: unknown) =>
      console.error('[Chats] No se pudo actualizar el recibo de lectura:', e),
    );
  }, [activeRoomId, currentUser, messages, rooms, chatOpen, tabVisible]);

  // ── ¿Lo ha leído todo el mundo? ───────────────────────
  const isReadByEveryone = useCallback(
    (_messageId: string, createdAt: string): boolean => {
      if (!activeRoom || !currentUser) return false;

      const others = activeRoom.memberIds.filter((id) => id !== currentUser.uid);
      if (others.length === 0) return false;

      const sentAt = Date.parse(createdAt);
      if (Number.isNaN(sentAt)) return false;

      const MARGIN_MS = 2000;

      return others.every((uid) => {
        const readAt = activeRoom.readAt?.[uid];
        if (!readAt) return false;
        const parsed = Date.parse(readAt);
        return !Number.isNaN(parsed) && parsed + MARGIN_MS >= sentAt;
      });
    },
    [activeRoom, currentUser],
  );

  // ── Parche local de un mensaje (optimista) ────────────
  const parchearMensaje = useCallback(
    (roomId: string, messageId: string, parche: Partial<ChatMessage>) => {
      setMessages((prev) => {
        const lista = prev[roomId];
        if (!lista) return prev;

        return {
          ...prev,
          [roomId]: lista.map((m) => (m.id === messageId ? { ...m, ...parche } : m)),
        };
      });
    },
    [],
  );

  // ── Enviar mensaje ───────────────────────────────────
  const sendMessage = useCallback(
    (
      roomId: string,
      text: string,
      gif?: GifAttachment,
      adjunto?: { imageUrl?: string; location?: LocationAttachment },
      respuesta?: ChatReplyTo | null,
      encuesta?: Poll | null,
      tier?: TierListRef | null,
    ) => {
      // Sin sesión no se envía nada, y sin texto ni adjunto tampoco:
      // un mensaje vacío no es un mensaje. La encuesta y la tier
      // list cuentan como contenido, igual que el GIF o la foto.
      const vacio =
        !text.trim() &&
        !gif &&
        !adjunto?.imageUrl &&
        !adjunto?.location &&
        !encuesta &&
        !tier;

      if (!currentUser || vacio) return;

      sendChatMessageService(roomId, currentUser, text, gif, adjunto, respuesta, encuesta, tier)
        .then(() => setSendError(null))
        .catch((e: unknown) => {
          console.error('[Chats] Error al enviar mensaje:', e);
          setSendError(`No se pudo enviar el mensaje: ${messageOf(e, 'error desconocido')}`);
        });
    },
    [currentUser],
  );

  // ── Solicitudes ──────────────────────────────────────

  /**
   * Pide hablar con una persona. NO crea la conversación:
   * espera a que la otra acepte.
   *
   * Antes de mandar nada se comprueba la privacidad de la otra
   * persona. Es solo un aviso para no dejar al usuario con un
   * error de permisos del servidor: lo que manda es la regla de
   * seguridad, que rechaza la solicitud aunque se intente
   * saltarse esta comprobación.
   */
  const sendChatRequest = useCallback(
    async (target: User): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión para chatear.' };

      if (blockedIds.includes(target.uid)) {
        return {
          ok: false,
          error: `Has bloqueado a ${target.displayName || target.username}.`,
        };
      }

      if (!acceptsChatRequests(target)) {
        return {
          ok: false,
          error: `${target.displayName || target.username} no admite solicitudes de conversación.`,
        };
      }

      const all = [...incomingRequests, ...outgoingRequests];
      const result = await requestDirectChat(currentUser, target, all);

      return result.ok
        ? { ok: true }
        : { ok: false, error: result.error };
    },
    [currentUser, blockedIds, incomingRequests, outgoingRequests],
  );

  /**
   * Acepta o rechaza una solicitud.
   *
   * La escritura final la hace la Cloud Function
   * `responderSolicitudChat`: aquí solo se comprueba lo que se
   * puede comprobar en cliente para dar un error amable (por
   * ejemplo, que quien acepta una entrada es el dueño). El
   * servidor vuelve a comprobarlo todo contra el documento real.
   *
   * Al aceptar una solicitud DIRECTA se crea la conversación y el
   * bloqueado se levanta: aceptar a alguien que te había bloqueado
   * es precisamente cómo se vuelve a hablar con ella.
   */
  const respondToChatRequest = useCallback(
    async (request: ChatRequest, accept: boolean): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      // Un miembro del grupo, no el dueño, no puede aceptar una
      // entrada. Las invitaciones las acepta el invitado, así que
      // no pasan por esta comprobación.
      if (request.type === 'group' && request.groupId) {
        const group = rooms.find((r) => r.id === request.groupId);
        if (group && group.ownerId !== currentUser.uid) {
          return { ok: false, error: 'Solo quien creó el grupo puede aceptarla.' };
        }
      }

      const result = await respondToRequest(
        request,
        accept ? 'accepted' : 'rejected',
      );

      if (!result.ok) return { ok: false, error: result.error };

      if (accept) {
        if (
          request.type === 'direct' &&
          blockedIds.includes(request.fromId)
        ) {
          // Levantar el bloqueo: volver a hablar con alguien
          // empieza por volver a aceptarlo.
          await unblockUser(currentUser.uid, request.fromId).catch(() => undefined);
        }

        if (result.chatId) setActiveRoomId(result.chatId);
      }

      return { ok: true, roomId: result.chatId, chatId: result.chatId };
    },
    [currentUser, rooms, blockedIds],
  );

  const cancelChatRequest = useCallback(
    async (request: ChatRequest): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };
      try {
        await withdrawRequest(request.id, currentUser.uid);
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: messageOf(e, 'No se pudo cancelar la solicitud.') };
      }
    },
    [currentUser],
  );

  // ── Bloqueos ─────────────────────────────────────────

  const isBlocked = useCallback(
    (userId: string) => blockedIds.includes(userId),
    [blockedIds],
  );

  /**
   * "Eliminar usuario": desaparece de tu barra lateral, se
   * oculta el chat que tuvierais y no puedes volver a escribirle.
   *
   * NO se borra a la persona del sistema. Sigue existiendo y
   * puede mandarte una solicitud; si la aceptas, queda
   * desbloqueada y habláis con normalidad.
   */
  const blockPerson = useCallback(
    async (userId: string, room?: ChatRoom): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };
      if (userId === currentUser.uid) {
        return { ok: false, error: 'No puedes eliminarte a ti mismo.' };
      }

      try {
        await blockUser(currentUser.uid, userId);
        if (room) await hideChat(room.id, currentUser.uid);
        if (room?.id === activeRoomId) setActiveRoomId(null);
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: messageOf(e, 'No se pudo eliminar al usuario.') };
      }
    },
    [currentUser, activeRoomId],
  );

  // ── Grupos ────────────────────────────────────────

  /** Crea un grupo con una sola persona: su creador. */
  const createGroupChat = useCallback(
    async (name: string): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      const result = await createGroupChatService(currentUser, name);
      if (!result.ok) return result;

      setActiveRoomId(result.chatId);
      return { ok: true, roomId: result.chatId };
    },
    [currentUser],
  );

  /**
   * Cambia la foto del grupo.
   *
   * El `error` que vuelve no es inventado: es el de Firestore. Si
   * quien llama no es el dueño, la regla de seguridad rechaza el
   * `update` y el error dice "missing or insufficient permissions",
   * que en la interfaz se traduce a un texto que explica qué ha
   * pasado.
   *
   * El avatar del grupo se actualiza en Firestore, así que la imagen
   * nueva sale sola en las dos listas (la de conversaciones y la
   * cabecera) sin necesidad de forzar nada: ambas escuchan la
   * colección.
   */
  const setGroupAvatar = useCallback(
    async (room: ChatRoom, file: File): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      if (room.type !== 'group') {
        return { ok: false, error: 'Solo los grupos tienen foto.' };
      }

      try {
        await setGroupAvatarService(room.id, file, room.avatar);

        return { ok: true };
      } catch (e) {
        console.error('[Chats] Error al cambiar la foto del grupo:', e);
        return { ok: false, error: messageOf(e, 'error desconocido') };
      }
    },
    [currentUser],
  );

  /**
   * Busca un grupo por su código y manda la solicitud de
   * entrada. El código es lo que se comparte; el nombre puede
   * estar repetido entre varios grupos.
   */
  const joinGroupByCode = useCallback(
    async (code: string): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      const clean = code.trim();
      if (!clean) return { ok: false, error: 'Escribe el código del grupo.' };

      const group = await findGroupByCode(clean);
      if (!group) {
        return { ok: false, error: `No existe ningún grupo con el código "${clean}".` };
      }

      if (group.ownerId === currentUser.uid) {
        return { ok: false, error: 'Ya creaste tú ese grupo.' };
      }

      // Si ya se es miembro, no hace falta pedir nada.
      const asMember = rooms.some((r) => r.id === group.id);
      if (asMember) {
        return { ok: false, error: 'Ya perteneces a ese grupo.' };
      }

      if (blockedIds.includes(group.ownerId)) {
        return { ok: false, error: 'Has bloqueado a quien administra ese grupo.' };
      }

      const all = [...incomingRequests, ...outgoingRequests];
      const result = await requestGroupJoin(currentUser, group, all);

      return result.ok
        ? { ok: true }
        : { ok: false, error: result.error };
    },
    [currentUser, rooms, blockedIds, incomingRequests, outgoingRequests],
  );

  // ── Vaciar la conversación (solo para quien lo pulsa) ─
  const clearConversation = useCallback(
    async (room: ChatRoom): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };
      try {
        await clearConversationFor(room.id, currentUser.uid);
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: messageOf(e, 'No se pudo vaciar la conversación.') };
      }
    },
    [currentUser],
  );

  // ── Quitar la conversación de tu lista ─────────────
  const removeConversation = useCallback(
    async (room: ChatRoom): Promise<ChatResult> => {
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      try {
        if (room.type === 'direct') {
          await hideChat(room.id, currentUser.uid);
        } else {
          if (room.ownerId === currentUser.uid) {
            const heir = room.memberIds.find((id) => id !== currentUser.uid);
            if (heir) {
              await transferGroupOwnership(room.id, heir);
            } else {
              await hideChat(room.id, currentUser.uid);
              if (room.code) await syncGroupMemberCount(room.code, 0);
              return { ok: true };
            }
          }
          await leaveGroup(room.id, currentUser.uid);
          // El contador del índice lo mantiene el trigger
          // `onChatMembersChanged`; el dueño anterior ya no puede
          // escribir en él después de traspasar el grupo.
        }
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: messageOf(e, 'No se pudo completar la operación.') };
      }
    },
    [currentUser],
  );

  const requireGroupOwner = useCallback(
    (room: ChatRoom): string | null => {
      if (!currentUser) return 'Debes iniciar sesión.';
      if (room.type !== 'group') return 'Esta acción solo existe en grupos.';
      if (room.ownerId !== currentUser.uid) {
        return 'Solo quien creó el grupo puede gestionar sus miembros.';
      }
      return null;
    },
    [currentUser],
  );

  const addMember = useCallback(
    async (room: ChatRoom, target: User): Promise<ChatResult> => {
      const problem = requireGroupOwner(room);
      if (problem) return { ok: false, error: problem };
      if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };

      if (room.memberIds.includes(target.uid)) {
        return {
          ok: false,
          error: `${target.displayName || target.username} ya está en el grupo.`,
        };
      }
      if (blockedIds.includes(target.uid)) {
        return {
          ok: false,
          error: `Has bloqueado a ${target.displayName || target.username}.`,
        };
      }

      const yaInvitado = outgoingRequests.some(
        (r) =>
          r.type === 'invite' &&
          r.groupId === room.id &&
          r.toId === target.uid,
      );
      if (yaInvitado) {
        return {
          ok: false,
          error: `Ya has invitado a ${target.displayName || target.username}.`,
        };
      }

      try {
        await inviteGroupMember(room.id, currentUser, target, outgoingRequests);
        return { ok: true };
      } catch (e: unknown) {
        return {
          ok: false,
          error: messageOf(e, 'No se pudo enviar la invitación.'),
        };
      }
    },
    [requireGroupOwner, blockedIds, currentUser, outgoingRequests],
  );

  const removeMember = useCallback(
    async (room: ChatRoom, memberId: string): Promise<ChatResult> => {
      const problem = requireGroupOwner(room);
      if (problem) return { ok: false, error: problem };

      if (memberId === room.ownerId) {
        return { ok: false, error: 'No puedes expulsar a quien creó el grupo.' };
      }

      try {
        await removeGroupMember(room.id, memberId);
        if (room.code) await syncGroupMemberCount(room.code, room.memberIds.length - 1);
        return { ok: true };
      } catch (e: unknown) {
        return { ok: false, error: messageOf(e, 'No se pudo expulsar al miembro.') };
      }
    },
    [requireGroupOwner],
  );

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoomId,
        setActiveRoomId,
        messages,
        activeRoom,
        loading,
        error,
        sendMessage,
        incomingRequests,
        outgoingRequests,
        sendChatRequest,
        respondToChatRequest,
        cancelChatRequest,
        blockedIds,
        isBlocked,
        blockPerson,
        createGroupChat,
  setGroupAvatar,
        joinGroupByCode,
        removeConversation,
        clearConversation,
        addMember,
        removeMember,
        isReadByEveryone,
        parchearMensaje,
        setChatOpen,
        unreadRoomIds,
        hasUnread: unreadRoomIds.length > 0,
        corteNuevos: activeRoomId
          ? (cortePorChat[activeRoomId] ?? SIN_NUEVOS)
          : SIN_NUEVOS,
        hiddenIds,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
