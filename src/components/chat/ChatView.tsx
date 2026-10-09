import React, { Fragment, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageCircle,
  Users,
  UserPlus,
  AlertCircle,
  Loader2,
  Send,
  Search,
  Plus,
  Sparkles,
  Check,
  Shield,
  Copy,
  Hash,
  X,
  LogOut,
  Crown,
  UserMinus,
  MoreVertical,
  Eraser,
  UserX,
  Mail,
  CheckCheck,
  Clock3,
  ArrowLeft,
  Smile,
  ImagePlus,
  Camera,
  ArrowDown,
  Trash2,
  Ban,
  Reply,
  Pencil,
} from 'lucide-react';

import { textoDeNuevos } from '../../utils/chatLectura';
import { puedeBorrarParaTodos } from '../../utils/chatBorrado';
import { citaVisible, fragmentoParaCita } from '../../utils/chatCita';
import {
  editarMensajeChat,
  eliminarMensajeParaTodos,
  ocultarMensajeParaMi,
} from '../../services/chats';
import { useAuth } from '../../context/AuthContext';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { useChat } from '../../context/ChatContext';
import { useCommunity } from '../../context/CommunityContext';
import { reaccionesDe, useReacciones } from '../../hooks/useReacciones';
import { reactionKey } from '../../services/reactions';
import { EmojiPicker } from '../community/EmojiPicker';
import { GifPicker } from '../community/GifPicker';
import { LocationMenu, LocationCard, LocationNotice } from './LocationInChat';
import { LocationPicker } from './LocationPicker';
import { uploadChatImage } from '../../services/imageUpload';
import { CommentGif } from '../community/CommentGif';
import { ReactionBar } from '../community/ReactionBar';
import type {
  ChatMessage,
  ChatRequest,
  ChatRoom,
  GifAttachment,
  LocationAttachment,
  User,
} from '../../types';

export const ChatView: React.FC = () => {
  const { currentUser, getUserByChatId, usersList } = useAuth();
  const goToProfile = useGoToProfile();
  const {
    rooms,
    activeRoomId,
    setActiveRoomId,
    messages,
    sendMessage,
    createGroupChat,
    setGroupAvatar,
    activeRoom,
    loading: chatsLoading,
    error: chatsError,
    isReadByEveryone,
    parchearMensaje,
    setChatOpen,
    unreadRoomIds,
    corteNuevos,
    hiddenIds,
    removeConversation,
    clearConversation,
    addMember,
    removeMember,
    sendChatRequest,
    joinGroupByCode,
    respondToChatRequest,
    cancelChatRequest,
    incomingRequests,
    outgoingRequests,
    blockedIds,
    isBlocked,
    blockPerson,
  } = useChat();

  const [filterType, setFilterType] = useState<'direct' | 'group' | 'all'>('all');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Emojis y GIFs en el chat ─────────────────────────
  //
  // El campo de texto es controlado, así que para insertar un
  // emoji EN EL CURSOR (y no al final) hace falta el `ref`: se
  // lee `selectionStart`, se escribe el texto nuevo y se vuelve a
  // poner el cursor donde estaba. Sin eso, escribir "hola" y
  // elegir 😄 pondría el emoji detrás de la última letra.
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatGif, setChatGif] = useState<GifAttachment | null>(null);

  // Los adjuntos del mensaje que se está escribiendo. Se guardan como
  // estado y no se mandan al pulsar el botón: primero se elige, luego
  // se ve que está puesto, y se manda con el mensaje.
  //
  // Solo puede haber una foto. Dos fotos en un mensaje no aporta nada y
  // multiplica el trabajo de pintar los mensajes antiguos, así que se
  // elige una y ya.
  //
  // La ubicación NO está aquí, y no por descuido: se elige y se manda
  // desde su propio mapa, sin pasar por la caja. Ver `enviar`.
  const [chatImageUrl, setChatImageUrl] = useState<string | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // ── El selector de mapa ────────────────────────────────
  //
  // No se monta nunca con el chat abierto: solo existe mientras el
  // modal está en pantalla. Eso no es solo limpieza, es lo que hace que
  // Leaflet no se descargue hasta que alguien elige una ubicación a
  // mano, porque el mapa se crea al montar el componente.
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  // El punto con el que se abre el mapa. Viene de "usar mi ubicación"
  // y va null cuando se entra a elegir a mano, para que el mapa se
  // abra en el centro por defecto sin marcador puesto.
  const [puntoInicial, setPuntoInicial] = useState<LocationAttachment | null>(null);

  // El archivo escondido que dispara el selector del navegador. Es un
  // <input type="file"> de verdad, no una llamada a un servicio: así el
  // diálogo de archivos es el del sistema, con su vista previa y sus
  // carpetas, que es lo que espera la gente.
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Se vacía el valor para que elegir el MISMO archivo dos veces
    // seguidas vuelva a disparar el onChange. Si no, la segunda vez no
    // cambia nada y parece que el botón no funciona.
    e.target.value = '';

    if (!file) return;

    if (!activeRoomId) return;

    try {
      const url = await uploadChatImage(file, activeRoomId, 'messages');
      setChatImageUrl(url);
    } catch (err) {
      console.error('[Chats] Error al subir la foto:', err);
      setGeoNotice(err instanceof Error ? err.message : 'No se ha podido subir la foto.');
    }
  };

  /**
   * Abrir el mapa, con un punto ya elegido o en blanco.
   *
   * Los dos caminos de compartir ubicación acaban aquí. Cuando el
   * navegador ha dado la posición, esa posición no se manda: se abre
   * el mapa con ella ya puesta para que quien la ha compartido la vea
   * antes de mandarla y pueda corregirla. Nadie manda un lugar sin
   * haberlo visto, y un GPS con 500 m de error en un portal concreto
   * no sirve de mucho.
   *
   * @param {LocationAttachment | null} [punto] el punto con el que abrir
   */
  const abrirMapa = (punto: LocationAttachment | null = null) => {
    setPuntoInicial(punto);
    setSelectorAbierto(true);
    setGeoNotice(null);
  };

  /** La posición del navegador ha llegado: se enseña antes de mandarla. */
  const handleLocated = (ubicacion: LocationAttachment) => {
    abrirMapa(ubicacion);
  };

  // El <input type="file"> escondido de la foto del grupo. Separate
  // del de los mensajes: son dos cosas distintas y si compartieran el
  // mismo, elegir una foto para el grupo borraría la del mensaje o al
  // revés.
  const groupPhotoInputRef = useRef<HTMLInputElement>(null);

  /**
   * Solo el dueño puede cambiar la foto del grupo.
   *
   * Se comprueba aquí y no en las reglas para que el botón no aparezca
   * a quien no puede usarlo, pero la garantía la dan las reglas: si
   * alguien manipula el DOM desde la consola y pulsa el botón, la
   * escritura la rechaza Firestore igual.
   */
  const puedeCambiarFoto = Boolean(
    activeRoom?.type === 'group' && activeRoom.ownerId && currentUser?.uid === activeRoom.ownerId,
  );

  const handlePickGroupPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = '';

    if (!file || !activeRoom) return;

    const resultado = await setGroupAvatar(activeRoom, file);

    // `error` es `string | undefined` porque `ChatResult` lo declara
    // opcional para el caso de éxito. Cuando `ok` es falso siempre
    // viene, pero TypeScript no lo sabe.
    if (!resultado.ok && resultado.error) setGeoNotice(resultado.error);
  };

  const insertarEmoji = (emoji: string) => {
    const input = inputRef.current;
    const inicio = input?.selectionStart ?? inputText.length;
    const fin = input?.selectionEnd ?? inicio;

    const siguiente = inputText.slice(0, inicio) + emoji + inputText.slice(fin);
    setInputText(siguiente);

    // El cursor vuelve detrás del emoji, y el picker se cierra:
    // elegir cinco emojis seguidos es encadenar clics, y para
    // eso está el picker.
    window.requestAnimationFrame(() => {
      const nuevo = inicio + emoji.length;
      input?.focus();
      input?.setSelectionRange(nuevo, nuevo);
    });
    setShowEmojiPicker(false);
  };

  // New Contact by ID modal / state
  const [showAddContact, setShowAddContact] = useState(false);
  const [targetIdInput, setTargetIdInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ error?: string; success?: string; user?: any } | null>(null);

  // Gestión de la conversación abierta
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [copiedGroupCode, setCopiedGroupCode] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  // Usuario a punto de ser eliminado. No se borra al pulsar el
  // menú: primero sale una confirmación, porque el error de
  // pulsarlo sin querer era fácil de cometer.
  const [pendingBlock, setPendingBlock] = useState<{
    userId: string;
    name: string;
    chatId: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [addMemberInput, setAddMemberInput] = useState('');
  const [memberFeedback, setMemberFeedback] = useState<{ error?: string; success?: string } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Borrado de mensajes: qué menú está abierto y qué mensaje está
  // pendiente de confirmar. El borrado no se ejecuta hasta pulsar
  // una opción del modal.
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [borrandoMsg, setBorrandoMsg] = useState<ChatMessage | null>(null);
  const [borrandoBusy, setBorrandoBusy] = useState(false);
  const [borrandoError, setBorrandoError] = useState<string | null>(null);

  // Citar y editar. Son excluyentes: responder cancela la edición y
  // editar cancela la respuesta, porque la caja es una sola.
  const [citaA, setCitaA] = useState<ChatMessage | null>(null);
  const [editando, setEditando] = useState<ChatMessage | null>(null);
  const [editandoBusy, setEditandoBusy] = useState(false);

  // Solo quien creó el grupo puede añadir o expulsar miembros.
  const isGroupOwner =
    !!activeRoom && activeRoom.type === 'group' && activeRoom.ownerId === currentUser?.uid;

  // Create Group modal / state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');

  // Avisa al contexto de que la conversación se está viendo de
  // verdad. Mientras este componente esté montado, los mensajes
  // que lleguen se marcan como leídos; al salir de la sección
  // dejan de marcarse, así que el doble tick no aparece solo por
  // tener la web abierta en segundo plano.
  useEffect(() => {
    setChatOpen(true);
    return () => setChatOpen(false);
  }, [setChatOpen]);

  // ═══════════════════════════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════════════════════════
  //
  // Antes este efecto bajaba al último mensaje SIEMPRE que cambiase
  // la lista, con `behavior: 'smooth'`. Eso es lo que hace que la
  // barra de "mensajes nuevos" no sirva de nada: abres una
  // conversación con cinco mensajes nuevos, la barra se pinta
  // encima de ellos y el scroll te lleva directamente al final,
  // donde no se ve.
  //
  // Ahora solo baja al final cuando el usuario NO está leyendo
  // historia vieja. Si ha subido a mirar algo anterior, se queda
  // donde está y la barra le dice cuántos mensajes se ha perdido,
  // que es justo para lo que sirve.
  //
  // El salto al final también es instantáneo y no suave: al abrir
  // una conversación, un scroll suave de varios cientos de píxeles
  // tarda tanto que la barra aparece y se va sola.
  const [lejosDelFinal, setLejosDelFinal] = useState(false);

  const listaRef = useRef<HTMLDivElement>(null);

  /**
   * Si el usuario está leyendo hacia arriba.
   *
   * ── POR QUÉ NO BASTA CON COMPARAR `scrollTop` ────────────────────
   *
   * Porque la altura del contenido cambia con cada mensaje que llega
   * y con la barra de nuevos, así que el "final" no es un número
   * fijo. Se mide contra la posición real del final: cuánto queda
   * por debajo.
   *
   * El margen es de 120 px a propósito. Con menos, tocar el scroll
   * teniendo el cursor sobre el último mensaje lo contaría como
   * "estoy arriba" y dejaría de pegar los mensajes nuevos, que es
   * justo cuando más molestaría.
   */
  const MARGEN_ABAJO = 120;

  const alDesplazar = useCallback(() => {
    const el = listaRef.current;
    if (!el) return;

    const queda = el.scrollHeight - el.scrollTop - el.clientHeight;

    // `> MARGEN_ABAJO` y no `>=`: en el final exacto, con la barra de
    // desplazamiento contra el borde, queda un píxel o dos de más y
    // se leía como "arriba" sin serlo.
    setLejosDelFinal(queda > MARGEN_ABAJO);
  }, []);

  /**
   * Vuelve abajo dejando que los mensajes nuevos se peguen otra vez.
   *
   * Es el botón que aparece cuando se está leyendo historia y llegan
   * mensajes nuevos: en lugar de saltar solo, baja al final y reactiva
   * el pegado automático.
   */
  const irAlFinal = useCallback(() => {
    setLejosDelFinal(false);

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    if (lejosDelFinal) return;

    messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, [messages, activeRoomId, lejosDelFinal]);

  // Al cambiar de conversación se vuelve abajo. Si no, abrir la
  // tercera con la segunda a medias dejaría el scroll donde estaba,
  // en un sitio que no significa nada en la nueva.
  //
  // Y se sueltan la cita y la edición: apuntaban a mensajes de la
  // otra conversación y la caja es la misma para todas.
  useEffect(() => {
    setLejosDelFinal(false);
    setCitaA(null);
    setEditando(null);
    setInputText('');
  }, [activeRoomId]);

  // Abrir la conversación que pide la URL (`?tab=chats&chat=...`).
  //
  // Es lo que escriben los avisos de la campana al pulsar "te ha
  // enviado un mensaje": sin esto, el aviso abría la lista y la
  // conversación activa seguía siendo la primera, no la del mensaje.
  //
  // El parámetro SE CONSUME (se borra de la URL al usarlo). Si se
  // quedara puesto, este efecto lo reimpondría en cada cambio de
  // conversación y no habría forma de cambiar de chat: cada clic en
  // otro chat volvería al del aviso, que es justo lo que pasaba.
  //
  // Va DESPUÉS del efecto que elige la primera conversación por
  // defecto (en `ChatContext`): ese solo toca si no hay ninguna
  // activa, así que si la URL pide una que existe, esta la impone.
  // Y si la URL pide una que ya no existe (chat borrado), no se
  // toca nada: mejor la lista que un panel vacío.
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const pedido = params.get('chat');
    if (!pedido) return;
    // Sin la lista cargada no se decide nada: ni abrir (podría no
    // haber llegado aún) ni borrar el parámetro (se perdería el
    // destino antes de verlo).
    if (chatsLoading) return;

    const quitarParametro = () => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('chat');
          return next;
        },
        { replace: true },
      );
    };

    if (!rooms.some((r) => r.id === pedido)) {
      quitarParametro();
      return;
    }

    if (activeRoomId !== pedido) setActiveRoomId(pedido);
    quitarParametro();
  }, [params, rooms, activeRoomId, chatsLoading, setActiveRoomId, setParams]);

  // ── Reacciones de los mensajes de esta conversación ────
  //
  // Solo se escuchan los mensajes que se están viendo (los de la
  // conversación abierta), no todos los chats: con los chats
  // acumulados en `messages`, escuchar todo sería pagar por
  // reacciones que nadie ve.
  const { toggleReaction } = useCommunity();

  const objetivosMensajes = useMemo(() => {
    const vista = activeRoomId ? (messages[activeRoomId] ?? []) : [];
    return vista.slice(-60).map((m) => ({ targetType: 'chat_message' as const, targetId: m.id }));
  }, [messages, activeRoomId]);

  const { de: reaccionesMensaje, mias: misReaccionesMensaje } =
    useReacciones(objetivosMensajes);

  if (!currentUser) {
    return null;
  }

  /**
   * Manda lo que hay en la caja de escribir.
   *
   * ── POR QUÉ RECIBE LA UBICACIÓN POR PARÁMETRO ─────────────────────
   *
   * Porque el mapa confirma con su propio botón y ese momento no pasa
   * por el de enviar. Cuando se pulsa "Compartir ubicación", el punto no
   * está en ningún estado —se pondría, y luego habría que mandarlo, con
   * lo que el modal cerraría antes de tiempo o la ubicación iría dos
   * veces—. Pasándolo por aquí, el mapa, el botón y el envío son la
   * misma acción, que es lo que se espera de un botón que dice
   * "Compartir".
   *
   * ── LO QUE SE QUEDA EN LA CAJA ───────────────────────────────────
   *
   * El texto va con la ubicación, que es lo natural: si se ha escrito
   * "aquí nos vemos" mientras se elegía el sitio, eso también se
   * manda. Una foto o un GIF que estuvieran puestos se quedan en la
   * caja: mandarlos de rebote con un mensaje de ubicación es tan
   * raro que no hay forma de avisar, y al menos así no se pierden.
   *
   * ── POR QUÉ NO HAY UNA UBICACIÓN A LA ESPERA ──────────────────────
   *
   * Antes, elegir una ubicación la dejaba preparada en la caja para
   * mandarla con el botón de enviar, como una foto. Con el mapa delante,
   * que es donde se elige y se revisa, esa segunda confirmación no
   * aporta nada: se elige el sitio, se ve en el mapa y se manda. Por
   * eso no existe ya ese estado, y el botón de enviar no lo menciona.
   *
   * @param {LocationAttachment} [ubicacion] el punto a mandar
   */
  const enviar = (ubicacion?: LocationAttachment) => {
    const sitio = ubicacion ?? null;
    const gif = ubicacion ? null : chatGif;
    const foto = ubicacion ? null : chatImageUrl;

    // Texto, GIF, foto o ubicación: un mensaje sin texto es válido si
    // lleva cualquiera de los tres adjuntos, y uno sin nada no se
    // envía.
    const hayAlgo = Boolean(inputText.trim()) || Boolean(gif) || Boolean(foto) || Boolean(sitio);

    if (!activeRoomId || !hayAlgo) return;

    // La cita viaja dentro del mensaje nuevo. Se construye aquí, al
    // enviar, con lo que el citado dice AHORA: si se construyera al
    // pulsar "Responder" y el citado se editara después, la cita
    // llevaría el texto viejo.
    const respuesta = citaA
      ? {
          messageId: citaA.id,
          senderName: senderNameOf(citaA),
          snippet: fragmentoParaCita(citaA),
        }
      : null;

    sendMessage(activeRoomId, inputText, gif ?? undefined, {
      ...(foto ? { imageUrl: foto } : {}),
      ...(sitio ? { location: sitio } : {}),
    }, respuesta);

    setInputText('');
    setCitaA(null);

    // Lo que no se ha mandado no se borra: si la ubicación se ha
    // enviado aparte, la foto y el GIF siguen ahí para el siguiente
    // mensaje.
    if (!ubicacion) {
      setChatGif(null);
      setChatImageUrl(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    // En modo edición, enviar GUARDA lo editado en vez de mandar un
    // mensaje nuevo. Son dos caminos con el mismo botón.
    if (editando) {
      void guardarEdicion();
      return;
    }

    enviar();
  };

  /** El mapa ha confirmado el punto: se manda el mensaje con él. */
  const handleConfirmarUbicacion = (ubicacion: LocationAttachment) => {
    setSelectorAbierto(false);
    setPuntoInicial(null);
    enviar(ubicacion);
  };

  const handleSearchContact = () => {
    setAddFeedback(null);
    if (!targetIdInput.trim()) {
      setAddFeedback({ error: 'Por favor, escribe un ID de usuario válido.' });
      return;
    }
    const found = getUserByChatId(targetIdInput.trim());
    if (!found) {
      setAddFeedback({ error: `No se ha encontrado ningún usuario con el ID "${targetIdInput.trim()}".` });
      return;
    }
    if (found.uid === currentUser.uid) {
      setAddFeedback({ error: 'No puedes añadirte a ti mismo como contacto.' });
      return;
    }
    setAddFeedback({ success: `¡Usuario encontrado! @${found.username}`, user: found });
  };

  // Ahora el flujo no es instantáneo: al añadir un contacto se
  // manda una SOLICITUD y la conversación solo se crea cuando la
  // otra persona la acepta.
  const [creatingChat, setCreatingChat] = useState(false);

  const handleRequestChat = async (user: User) => {
    if (creatingChat) return;
    setCreatingChat(true);
    setAddFeedback(null);
    try {
      const result = await sendChatRequest(user);
      if (result.ok) {
        setAddFeedback({
          success:
            `Solicitud enviada a ${user.displayName || user.username}. ` +
            `La conversación empezará cuando la acepte.`,
        });
        setTargetIdInput('');
      } else {
        setAddFeedback({ error: result.error });
      }
    } finally {
      setCreatingChat(false);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim() || creatingChat) return;

    setCreatingChat(true);
    try {
      // El grupo se crea con una sola persona. El resto entra
      // mandando una solicitud que tú aceptas.
      const result = await createGroupChat(groupNameInput);
      if (result.ok) {
        setShowCreateGroup(false);
        setGroupNameInput('');
      } else {
        // El error se pinta DENTRO del modal, como el de "Unirse a
        // grupo" y el de "Nuevo contacto". Antes salía con un
        // alert(), que en un móvil interrumpe y encima parece un
        // fallo de la web y no del formulario: el usuario veía un
        // aviso del navegador en mitad de la pantalla y, si la
        // creación fallaba por las reglas de seguridad, se quedaba
        // sin ninguna pista de qué hacer. Con un "catch" también:
        // sin él, una excepción dejaba el modal abierto y sin decir
        // nada, que es lo que hace que "no se pueda crear un grupo".
        setActionFeedback(result.error ?? 'No se pudo crear el grupo.');
      }
    } catch (e: unknown) {
      setActionFeedback(
        e instanceof Error
          ? e.message
          : 'No se pudo crear el grupo. Inténtalo de nuevo.',
      );
    } finally {
      setCreatingChat(false);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    if (filterType === 'direct') return r.type === 'direct';
    if (filterType === 'group') return r.type === 'group';
    return true;
  });

  // Sin los ocultados solo para mí: el documento sigue intacto
  // para los demás, aquí simplemente no se pintan.
  const activeMessages = (
    activeRoomId ? messages[activeRoomId] || [] : []
  ).filter((m) => !hiddenIds.has(m.id));

  // Nombre e interlocutor del chat abierto, calculados igual que en
  // la lista: a partir de la lista de miembros, no del nombre
  // congelado en el documento.
  const activeOtherParty = activeRoom
    ? usersList.find(
        (u) => currentUser && activeRoom.memberIds.includes(u.uid) && u.uid !== currentUser.uid,
      )
    : undefined;

  const activeRoomName =
    activeRoom && activeRoom.type === 'direct' && activeOtherParty
      ? activeOtherParty.displayName || activeOtherParty.username
      : activeRoom?.name || '';

  const activeRoomAvatar =
    activeRoom && activeRoom.type === 'direct' && activeOtherParty
      ? activeOtherParty.avatarUrl || activeRoom.avatar
      : activeRoom?.avatar;

  // Nombre y avatar de quien escribió un mensaje, tomados del perfil
  // actual. El mensaje guarda una copia de los dos en el momento de
  // enviarse, así que si la persona cambia su foto, los mensajes
  // antiguos seguían mostrando la anterior.
  const liveUserOf = (uid: string) => usersList.find((u) => u.uid === uid);

  const senderNameOf = (msg: ChatMessage): string => {
    const live = liveUserOf(msg.senderId);
    return live?.displayName || live?.username || msg.senderName;
  };

  const senderAvatarOf = (msg: ChatMessage): string =>
    liveUserOf(msg.senderId)?.avatarUrl || msg.senderAvatar;

  // ── Eliminar chat / salir del grupo ───────────────────
  const handleRemoveConversation = async () => {
    if (!activeRoom || busyAction) return;

    setBusyAction(true);
    const result = await removeConversation(activeRoom);
    setBusyAction(false);
    setConfirmingLeave(false);

    if (result.ok) {
      // La conversación desaparece de la lista por el listener,
      // pero el id seleccionado se queda colgando: se suelta
      // para que elija otra.
      setActiveRoomId(null);
    } else {
      setMemberFeedback({ error: result.error });
    }
  };

  // ── Añadir miembro (solo el dueño del grupo) ─────────
  const handleAddMember = async () => {
    if (!activeRoom || !addMemberInput.trim() || busyAction) return;

    setBusyAction(true);
    setMemberFeedback(null);

    const target = getUserByChatId(addMemberInput.trim());
    if (!target) {
      setMemberFeedback({
        error: `No se encontró ningún usuario con el ID "${addMemberInput.trim()}".`,
      });
      setBusyAction(false);
      return;
    }

    const result = await addMember(activeRoom, target);
    setBusyAction(false);

    if (result.ok) {
      setAddMemberInput('');
      setMemberFeedback({
        success: `${target.displayName || target.username} se unió al grupo.`,
      });
    } else {
      setMemberFeedback({ error: result.error });
    }
  };

  // ── Expulsar miembro (solo el dueño del grupo) ───────
  const handleRemoveMember = async (memberId: string) => {
    if (!activeRoom || busyAction) return;

    setBusyAction(true);
    setMemberFeedback(null);

    const result = await removeMember(activeRoom, memberId);
    setBusyAction(false);

    setMemberFeedback(
      result.ok ? { success: 'Miembro expulsado del grupo.' } : { error: result.error },
    );
  };

  const memberProfiles = activeRoom
    ? activeRoom.memberIds
        .map((uid) => liveUserOf(uid))
        .filter((u): u is NonNullable<typeof u> => !!u)
    : [];

  // Mensaje de error de una acción, o null si ha ido bien.
  const reportActionError = (result: { error?: string }) => {
    if (result.error) setActionFeedback(result.error);
  };

  // ── Borrar mensajes (estilo WhatsApp) ──────────
  //
  // Nada se ejecuta hasta confirmar en el modal. Si la operación
  // falla, el modal NO se cierra: pintar que se borró sería mentira
  // y el mensaje seguiría ahí al recargar.

  const pedirBorrar = (msg: ChatMessage) => {
    setMenuMsgId(null);
    setBorrandoError(null);
    setBorrandoMsg(msg);
  };

  const borrarSoloParaMi = async () => {
    if (!borrandoMsg || !activeRoomId || !currentUser || borrandoBusy) return;

    setBorrandoBusy(true);
    setBorrandoError(null);

    try {
      await ocultarMensajeParaMi(currentUser.uid, activeRoomId, borrandoMsg.id);
      setBorrandoMsg(null);
    } catch (e: unknown) {
      setBorrandoError(
        e instanceof Error ? e.message : 'No se pudo ocultar el mensaje.',
      );
    } finally {
      setBorrandoBusy(false);
    }
  };

  const borrarParaTodos = async () => {
    if (!borrandoMsg || !activeRoomId || !currentUser || borrandoBusy) return;

    const objetivo = borrandoMsg;
    const room = activeRoomId;

    // Optimista, como la edición: se esconde al instante y el
    // servidor confirma detrás. Si dice que no (plazo cumplido
    // entre abrir el modal y pulsar), el mensaje VUELVE y sale el
    // motivo en vez de quedarse borrado en falso.
    parchearMensaje(room, objetivo.id, {
      body: '',
      imageUrl: undefined,
      gif: undefined,
      location: undefined,
      replyTo: undefined,
      deletedForEveryone: true,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.uid,
    });
    setBorrandoMsg(null);
    setBorrandoBusy(true);

    try {
      await eliminarMensajeParaTodos(room, objetivo.id);
    } catch (e: unknown) {
      parchearMensaje(room, objetivo.id, { ...objetivo });
      setActionFeedback(
        e instanceof Error ? e.message : 'No se pudo eliminar el mensaje.',
      );
    } finally {
      setBorrandoBusy(false);
    }
  };

  // ── Citar y editar ──────────
  //
  // La cita viaja DENTRO del mensaje nuevo (`replyTo`); la edición
  // cambia el texto del existente vía callable (`editarMensajeChat`,
  // que comprueba autoría en el servidor). En los dos casos la
  // creación original no se toca.

  const responderA = (msg: ChatMessage) => {
    setMenuMsgId(null);
    setEditando(null);
    setCitaA(msg);
    inputRef.current?.focus();
  };

  const empezarEdicion = (msg: ChatMessage) => {
    setMenuMsgId(null);
    setCitaA(null);
    // Los adjuntos pendientes no pintan nada aquí: la edición solo
    // cambia el texto y lo que hubiera en la caja se colaría en el
    // siguiente mensaje nuevo.
    setChatGif(null);
    setChatImageUrl(null);
    setEditando(msg);
    setInputText(msg.body);
    inputRef.current?.focus();
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setInputText('');
  };

  const guardarEdicion = async () => {
    if (!editando || !activeRoomId || !currentUser || editandoBusy) return;

    const objetivo = editando;
    const room = activeRoomId;
    const texto = inputText;
    const previo = { body: objetivo.body, editedAt: objetivo.editedAt };

    // Optimista: se pinta al instante con la fecha de aquí. Cuando
    // la escritura del servidor llegue por el listener, la pisa con
    // la de verdad. Si falla, se revierte y sale el motivo.
    parchearMensaje(room, objetivo.id, {
      body: texto,
      editedAt: new Date().toISOString(),
    });
    setEditando(null);
    setInputText('');
    setEditandoBusy(true);

    try {
      await editarMensajeChat(room, objetivo.id, texto);
    } catch (e: unknown) {
      parchearMensaje(room, objetivo.id, previo);
      setActionFeedback(
        e instanceof Error ? e.message : 'No se pudo editar el mensaje.',
      );
    } finally {
      setEditandoBusy(false);
    }
  };

  // ── Menú de acciones sobre una conversación ──────────

  const otherMemberOf = (room: ChatRoom) =>
    usersList.find(
      (u) => currentUser && room.memberIds.includes(u.uid) && u.uid !== currentUser.uid,
    );

  /**
   * "Vaciar conversación": la deja en blanco, como si estuviera
   * a cero, pero SOLO para quien lo ejecuta.
   *
   * Los mensajes no se borran de Firestore: la otra persona
   * conserva los suyos intactos. Lo que se guarda es una marca
   * personal con la fecha, y el listado de mensajes te oculta
   * todo lo anterior a ella. Los mensajes que lleguen después sí
   * se ven con normalidad.
   */
  const handleClearChat = async (room: ChatRoom) => {
    setOpenMenuFor(null);
    if (busyAction) return;

    setBusyAction(true);
    setActionFeedback(null);
    const result = await clearConversation(room);
    setBusyAction(false);

    reportActionError(result);
  };

  /**
   * "Eliminar usuario": desaparece de tu barra lateral, se
   * oculta el chat y no puedes volver a escribirle.
   *
   * No se borra del sistema: puede mandarte una solicitud y,
   * si la aceptas, queda desbloqueada.
   *
   * Pulsar la opción del menú NO borra nada: solo deja preparada
   * la confirmación. Es un paso aparte a propósito, porque antes
   * de un solo clic se perdía la conversación entera.
   */
  const handleAskBlockPerson = (room: ChatRoom) => {
    setOpenMenuFor(null);
    if (busyAction) return;

    const other = otherMemberOf(room);
    if (!other) return;

    setPendingBlock({
      userId: other.uid,
      name: other.displayName || other.username,
      chatId: other.chatId,
    });
  };

  const handleCancelBlock = () => {
    setPendingBlock(null);
    setActionFeedback(null);
  };

  const handleConfirmBlock = async () => {
    if (!pendingBlock || busyAction) return;

    const room = rooms.find((r) => r.type === 'direct' && r.memberIds.includes(pendingBlock.userId));
    const target = pendingBlock;

    setBusyAction(true);
    const result = await blockPerson(target.userId, room);
    setBusyAction(false);

    if (result.ok) {
      setPendingBlock(null);
      if (room && room.id === activeRoomId) setActiveRoomId(null);
    } else {
      setPendingBlock(null);
    }

    reportActionError(result);
  };

  // ── Solicitudes ──────────────────────────────────────

  const handleRespond = async (request: ChatRequest, accept: boolean) => {
    if (busyAction) return;
    setBusyAction(true);
    setActionFeedback(null);
    const result = await respondToChatRequest(request, accept);
    setBusyAction(false);
    reportActionError(result);
  };

  const handleCancelRequest = async (request: ChatRequest) => {
    if (busyAction) return;
    setBusyAction(true);
    const result = await cancelChatRequest(request);
    setBusyAction(false);
    reportActionError(result);
  };

  const handleJoinGroupByCode = async () => {
    if (busyAction || !groupCodeInput.trim()) return;
    setBusyAction(true);
    setActionFeedback(null);
    const result = await joinGroupByCode(groupCodeInput);
    setBusyAction(false);
    if (result.ok) {
      setShowGroups(false);
      setGroupCodeInput('');
    } else {
      reportActionError(result);
    }
  };

  return (
    // ======================================================
    // ALTURA FIJA PARA QUE LA VENTANA NO SE MUEVA
    // ======================================================
    // Este contenedor y el grid de abajo se reparten la misma
    // caja: la cabecera toma lo que necesite y el grid se queda
    // con el resto ("flex-1 min-h-0").
    //
    // Antes el grid llevaba su propia altura calculada
    // ("100dvh - algo") y por eso la página se desplazaba: el
    // cálculo no podía saber cuánto ocupa la cabecera de
    // encima, así que entre navbar, "main" y cabecera el alto
    // total pasaba de la ventana. Y con la ventana desplazada,
    // el scrollIntoView del último mensaje la empujaba sola.
    //
    // Con la cabecera dentro de la caja, da igual lo alta que
    // sea: el total siempre es el mismo y la ventana se queda
    // quieta. El "7rem" son el navbar (4rem) y el padding
    // vertical del <main> (3rem).
    //
    // En móvil se rompe ese marco: con `-mx-4 -my-6` se anula el
    // padding del <main> y la altura pasa a ser la ventana menos
    // el navbar (4rem). El chat aprovecha así prácticamente toda
    // la pantalla. El `min-h-0` es a propósito: el mínimo de
    // 480px obligaba a la página a desplazarse en móviles
    // pequeños, justo lo que se quiere evitar.
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4rem)] min-h-0 flex-col gap-2 px-2 sm:mx-0 sm:my-0 sm:h-[calc(100dvh-7rem)] sm:min-h-[480px] sm:gap-4 sm:px-0">
      {/* Top Banner Info.
          En móvil se esconde cuando hay conversación abierta: entre
          este cartel, la cabecera y el compositor no quedaba
          historial (un mensaje visible). La lista lo sigue
          enseñando, y en escritorio sale siempre. */}
      <div className={`${activeRoomId ? 'hidden lg:flex' : 'flex'} flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 sm:p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Mensajería Privada & Grupal</span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Cifrado
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Tu ID único para recibir mensajes: <strong className="text-violet-300 font-mono">{currentUser.chatId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-violet-500 hover:text-white transition-all shadow-sm"
          >
            <UserPlus size={14} className="text-violet-400" />
            <span>Nuevo Contacto por ID</span>
          </button>

          <button
            onClick={() => {
              // Se borra el aviso anterior: si hace un momento
              // falló "Unirse a grupo", al abrir este modal no tiene
              // que seguir saliendo el error de aquello.
              setActionFeedback(null);
              setShowCreateGroup(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 transition-all shadow-md shadow-violet-600/20"
          >
            <Users size={14} />
            <span>Crear Grupo</span>
          </button>
        </div>
      </div>

      {/* ERROR DE FIRESTORE */}
      {chatsError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-red-300">
              No se pudieron cargar los chats
            </p>
            <p className="mt-0.5 break-words text-[11px] text-red-300/80">
              {chatsError}
              {' '}Si el mensaje menciona permisos, es probable que las reglas de seguridad estén
              sin desplegar: ejecuta <code>firebase deploy --only firestore:rules</code>.
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Interface Grid

          "grid-rows-1" es LA pieza que faltaba, y no es
          opcional: el grid tiene UNA fila, y por defecto esa fila
          es "auto", o sea que crece hasta lo que le metan
          dentro. Da igual que el contenedor tenga altura fija:
          la fila se sale de ella, las columnas se estiran hasta
          la fila y el "overflow-y-auto" de la lista vuelve a no
          tener altura limitada.

          "grid-rows-1" es repeat(1, minmax(0, 1fr)): la fila
          ocupa justo la caja del contenedor y el "minmax(0, …)"
          impide que el contenido la empuje. Con eso el
          "min-h-0 flex-1" de dentro sí recorta y la lista
          scrollea por dentro.

          "grid-cols-1" es la otra mitad del arreglo, y sin ella
          esto en el móvil era un desastre. Sin columnas
          declaradas, los dos paneles NO bajan a una fila nueva:
          el reparto automático los coloca uno al lado del otro
          en la MISMA fila, creyendo que es una rejilla de
          columnas. La lista de salas se quedaba entonces sin
          ancho (le tocaba el de una columna automática), pero sus
          hijos seguían pintándose: "Solicitudes" y "Unirse a
          grupo" aparecían encima de los mensajes, medio
          cortados, y en mitad de camino. Con "grid-cols-1" hay
          una sola columna y, como en el móvil solo se enseña un
          panel a la vez (ver los dos "hidden" de abajo), el que
          se ve cae en la fila 1 y la toma entera.

          A partir de lg vuelve a ser "grid-cols-12" y los dos
          paneles se reparten las doce columnas, como siempre. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 lg:grid-cols-12 rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
        {/* LEFT: ROOMS LIST.
            En pantallas anchas baja a 3 columnas: con 4 de 12
            sobre un contenedor de 1900px serían 630px para una
            lista de conversaciones, que es desproporcionado.

            En el móvil es O la lista O el chat, nunca los dos:
            meter los dos uno encima del otro en una pantalla de
            390px dejaría los dos paneles con medio dedo de alto,
            y es el esquema que usan WhatsApp y Telegram. "lg:flex"
            va siempre para que a partir de lg la lista vuelva a
            estar siempre presente aunque haya una sala abierta,
            porque en una pantalla ancha se ven las dos cosas a
            la vez. */}
        <div
          className={`${
            activeRoomId ? 'hidden' : 'flex'
          } lg:flex lg:col-span-4 2xl:col-span-3 min-h-0 border-r border-zinc-800 flex-col bg-zinc-950/70`}
        >
          {/* Header & Filter Tabs */}
          <div className="p-3.5 border-b border-zinc-800 space-y-3">
            <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 rounded-lg py-1.5 transition-all ${
                  filterType === 'all'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('direct')}
                className={`flex-1 rounded-lg py-1.5 transition-all ${
                  filterType === 'direct'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1 a 1
              </button>
              <button
                onClick={() => setFilterType('group')}
                className={`flex-1 rounded-lg py-1.5 transition-all ${
                  filterType === 'group'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Grupos
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRequests((v) => !v)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors ${
                  showRequests
                    ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus size={13} />
                <span>Solicitudes</span>
                {incomingRequests.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                    {incomingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowGroups(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:text-white"
              >
                <Hash size={13} />
                <span>Unirse a grupo</span>
              </button>
            </div>
          </div>

          {/* PANEL DE SOLICITUDES */}
          {showRequests && (
            <div className="max-h-[26rem] space-y-3 overflow-y-auto border-b border-zinc-800 bg-zinc-950 p-3.5">
              {actionFeedback && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                  {actionFeedback}
                </p>
              )}

              {/* Recibidas */}
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <Mail size={12} />
                  <span>Recibidas ({incomingRequests.length})</span>
                </h4>

                {incomingRequests.length === 0 ? (
                  <p className="px-1 text-[11px] text-zinc-600">
                    No tienes solicitudes pendientes.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {incomingRequests.map((req) => {
                      const wasBlocked = isBlocked(req.fromId);

                      return (
                        <li
                          key={req.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={req.fromAvatar}
                              alt={req.fromName}
                              className="h-9 w-9 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-white">
                                {req.fromName}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {req.type === 'group'
                                  ? `Quiere entrar en "${req.groupName}"`
                                  : 'Quiere chatear contigo'}
                              </p>
                            </div>
                          </div>

                          {wasBlocked && (
                            <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-300">
                              Tenías a esta persona bloqueada. Si aceptas, vuelve a poder hablar
                              con ella.
                            </p>
                          )}

                          <div className="mt-2.5 flex gap-2">
                            <button
                              onClick={() => handleRespond(req, true)}
                              disabled={busyAction}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                            >
                              <CheckCheck size={12} />
                              <span>Aceptar</span>
                            </button>
                            <button
                              onClick={() => handleRespond(req, false)}
                              disabled={busyAction}
                              className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Enviadas */}
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <Clock3 size={12} />
                  <span>Enviadas ({outgoingRequests.length})</span>
                </h4>

                {outgoingRequests.length === 0 ? (
                  <p className="px-1 text-[11px] text-zinc-600">
                    No has enviado ninguna solicitud.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {outgoingRequests.map((req) => (
                      <li
                        key={req.id}
                        className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                      >
                        <img
                          src={req.fromAvatar}
                          alt={req.fromName}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-zinc-200">
                            {req.type === 'group'
                              ? `Entrada a "${req.groupName}"`
                              : `Chat con ${req.toName ?? req.toId.slice(0, 6)}`}
                          </p>
                          <p className="text-[10px] text-amber-400">Esperando respuesta</p>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(req)}
                          disabled={busyAction}
                          className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {blockedIds.length > 0 && (
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <UserX size={12} />
                    <span>Usuarios eliminados ({blockedIds.length})</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {blockedIds.map((id) => {
                      const u = usersList.find((x) => x.uid === id);
                      if (!u) return null;

                      return (
                        <li
                          key={id}
                          className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                        >
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            className="h-7 w-7 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold text-zinc-300">
                              {u.displayName || u.username}
                            </p>
                            <p className="truncate text-[10px] font-mono text-zinc-500">
                              {u.chatId}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-[10px] text-zinc-500">
                            Eliminado
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Rooms Scrollable List */}
          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-zinc-850">
            {filteredRooms.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 space-y-2">
                {chatsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Cargando conversaciones...</span>
                  </div>
                ) : (
                  <>
                    <p>No tienes chats en esta categoría.</p>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
                    >
                      Añadir el primero
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = room.id === activeRoomId;
                const isUnread = unreadRoomIds.includes(room.id);
                const menuOpen = openMenuFor === room.id;

                // En un chat directo, el interlocutor se busca SIEMPRE
                // a partir de la lista de miembros, nunca con los datos
                // guardados en el documento del chat.
                //
                // Esos datos se congelan al crear el chat con el nombre
                // y la foto del otro vistos desde quien lo creó, así que
                // para el receptor eran SU PROPIO nombre y SU PROPIA
                // foto. Además, si alguien cambia su avatar después, el
                // chat antiguo ya no se actualizaba nunca. Por eso la
                // cabecera y esta lista tienen que usar EXACTAMENTE lo
                // mismo, o salen dos fotos distintas para la misma
                // persona en la misma pantalla.
                const otherParty = usersList.find(
                  (u) => currentUser && room.memberIds.includes(u.uid) && u.uid !== currentUser.uid,
                );
                const isDirect = room.type === 'direct' && !!otherParty;
                const displayName = isDirect
                  ? otherParty!.displayName || otherParty!.username
                  : room.name;
                const otherPartyChatId = otherParty?.chatId;
                const roomAvatar = isDirect
                  ? otherParty!.avatarUrl || room.avatar
                  : room.avatar;

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors ${
                      isActive
                        ? 'bg-violet-950/40 border-l-4 border-violet-500'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="relative">
                      {roomAvatar ? (
                        <img
                          src={roomAvatar}
                          alt={displayName}
                          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-zinc-700"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800 text-violet-300 font-bold">
                          {displayName[0]}
                        </div>
                      )}
                      {room.type === 'group' ? (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] text-white">
                          <Users size={9} />
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {room.lastMessageAt
                            ? new Date(room.lastMessageAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 text-xs truncate ${
                          isUnread ? 'font-bold text-white' : 'text-zinc-400'
                        }`}
                      >
                        {room.lastMessage || 'Conversación vacía'}
                      </p>

                      {/* En los chats privados, el ID del otro.
                          Sin esto, dos cuentas con el mismo nombre
                          de display son indistinguibles y parece
                          que estás hablando contigo mismo. */}
                      {room.type === 'direct' && otherPartyChatId && (
                        <p className="mt-0.5 text-[10px] font-mono text-violet-400/80 truncate">
                          {otherPartyChatId}
                        </p>
                      )}
                    </div>

                    {/* Punto de sin leer + menú de acciones */}
                    <div className="relative ml-1 flex flex-shrink-0 items-center gap-1.5">
                      {isUnread && (
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-pink-500"
                          title="Mensajes sin leer"
                        />
                      )}

                      <button
                        type="button"
                        aria-label={`Acciones de ${displayName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuFor(menuOpen ? null : room.id);
                        }}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-7 z-20 w-56 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
                        >
                          <button
                            onClick={() => handleClearChat(room)}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                          >
                            <Eraser size={13} className="text-zinc-400" />
                            <span>
                              Vaciar conversación
                              <span className="block text-[10px] font-normal text-zinc-500">
                                Los mensajes se borran solo para ti
                              </span>
                            </span>
                          </button>

                          {room.type === 'direct' && otherParty && (
                            <button
                              onClick={() => handleAskBlockPerson(room)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                            >
                              <UserX size={13} className="text-red-400" />
                              <span>
                                Eliminar usuario
                                <span className="block text-[10px] font-normal text-zinc-500">
                                  Deja de aparecer en tu lista
                                </span>
                              </span>
                            </button>
                          )}

                          {room.type === 'group' && (
                            <button
                              onClick={() => {
                                setOpenMenuFor(null);
                                setActiveRoomId(room.id);
                                setConfirmingLeave(true);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                            >
                              <LogOut size={13} className="text-amber-400" />
                              <span>Salir del grupo</span>
                            </button>
                          )}

                          {room.type === 'group' && isGroupOwner && (
                            <button
                              onClick={() => {
                                setOpenMenuFor(null);
                                setActiveRoomId(room.id);
                                setShowMembers(true);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                            >
                              <Users size={13} className="text-violet-400" />
                              <span>Gestionar miembros</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: ACTIVE CHAT CONVERSATION (8 cols)

            Espejo del de arriba: en el móvil se esconde mientras
            no haya sala abierta, para que lo que se vea sea la
            lista y no un panel vacío diciendo "selecciona un
            chat". */}
        <div
          className={`${
            activeRoomId ? 'flex' : 'hidden'
          } lg:flex lg:col-span-8 2xl:col-span-9 relative min-h-0 flex-col bg-zinc-900/90`}
        >
          {activeRoom ? (
            <>
              {/* Chat Top Header */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800 p-3 sm:p-4 bg-zinc-900">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {/* Volver a la lista. Solo en móvil, donde la
                      lista no está al lado: sin esto, al abrir un
                      chat no había forma de cambiar de
                      conversación ni de volver a "Solicitudes" o
                      "Unirse a grupo". */}
                  <button
                    type="button"
                    onClick={() => setActiveRoomId(null)}
                    aria-label="Volver a las conversaciones"
                    title="Volver a las conversaciones"
                    className="-ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white lg:hidden"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="relative flex-shrink-0">
                    {activeRoomAvatar ? (
                      <img
                        src={activeRoomAvatar}
                        alt={activeRoomName}
                        className="h-10 w-10 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white font-bold">
                        {activeRoomName[0]}
                      </div>
                    )}

                    {/* El candito de "en línea". En un grupo no significa
                        nada: no es que haya una persona conectada, es
                        que el grupo existe. */}
                    {activeRoom.type !== 'group' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                    )}

                    {/* Cambiar la foto del grupo. Solo el dueño, que es
                        quien puede hacerlo según las reglas de
                        seguridad; el botón se esconde a los demás para
                        que no descubran que no funciona. */}
                    {puedeCambiarFoto && (
                      <>
                        <button
                          type="button"
                          onClick={() => groupPhotoInputRef.current?.click()}
                          aria-label="Cambiar la foto del grupo"
                          title="Cambiar la foto del grupo"
                          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-900 bg-violet-600 text-white transition-colors hover:bg-violet-500"
                        >
                          <Camera size={10} />
                        </button>

                        <input
                          ref={groupPhotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePickGroupPhoto}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                  <div className="min-w-0">
                    {/* El nombre se recorta antes que el contador.

                        Es lo unico que hay que decidir cuando no
                        caben: "prueba" es el nombre de la sala y "1
                        integrantes" es un dato. Si los dos necesitan
                        espacio, se va el nombre.

                        Por eso el h3 lleva "min-w-0" y el span del
                        nombre "truncate": sin eso el bloque entero
                        mantiene su ancho natural, se sale del hueco y
                        el boton de "Miembros" se le monta encima,
                        que es lo que pasaba en movil. */}
                    <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
                      <span className="truncate">{activeRoomName}</span>
                      {activeRoom.type === 'group' && (
                        <span className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-normal text-zinc-400">
                          {activeRoom.memberIds.length}
                          <span className="hidden sm:inline"> integrantes</span>
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] font-medium text-emerald-400">
                      {activeRoom.type === 'group' ? 'Sala grupal activa' : 'En línea'}
                    </span>
                  </div>
                </div>

                {activeRoom.type === 'group' && (
                  /* "shrink-0" para que el boton no se encoja nunca, y
                     el texto a partir de sm. En movil se queda solo
                     con el icono: el numero de integrantes ya esta en
                     la cabecera, asi que el texto sobra y lo que
                     hace falta es que el nombre de la sala no se
                     corte. */
                  <button
                    type="button"
                    onClick={() => setShowMembers(true)}
                    aria-label="Ver los miembros del grupo"
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-2 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white sm:px-3 sm:py-1.5"
                  >
                    <Users size={13} className="flex-shrink-0" />
                    <span className="hidden sm:inline">Miembros</span>
                  </button>
                )}
              </div>

              {/* Código del grupo: es lo que se comparte para que
                  otras personas puedan pedir entrar. */}
              {activeRoom.type === 'group' && activeRoom.code && (
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/60 px-4 py-2">
                  <Hash size={12} className="flex-shrink-0 text-violet-400" />
                  <span className="text-[11px] text-zinc-500">Código del grupo:</span>
                  <code className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-300">
                    {activeRoom.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeRoom.code!);
                      setCopiedGroupCode(true);
                      setTimeout(() => setCopiedGroupCode(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-white"
                  >
                    {copiedGroupCode ? (
                      <>
                        <Check size={11} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-zinc-600">
                    Compártelo para que otras personas puedan pedir entrar
                  </span>
                </div>
              )}

              {/* CONFIRMACIÓN DE ELIMINAR USUARIO */}
              {pendingBlock && (
                <div className="flex flex-wrap items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-3">
                  <AlertCircle size={15} className="flex-shrink-0 text-red-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-red-300">
                      ¿Seguro que quieres eliminar a {pendingBlock.name}?
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-red-300/80">
                      Dejará de aparecer en tu lista y no podrás escribirle. Su cuenta no se
                      borra del sistema: te puede mandar una solicitud de nuevo.
                    </p>
                  </div>
                  <button
                    onClick={handleCancelBlock}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmBlock}
                    disabled={busyAction}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {busyAction ? 'Eliminando...' : 'Sí, eliminar usuario'}
                  </button>
                </div>
              )}

              {/* Confirmación de salida del grupo */}
              {confirmingLeave && (
                <div className="flex flex-wrap items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2.5">
                  <span className="text-[11px] text-red-300">
                    ¿Seguro que quieres salir del grupo? Perderás el acceso a sus mensajes.
                  </span>
                  <button
                    onClick={handleRemoveConversation}
                    disabled={busyAction}
                    className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    {busyAction ? 'Un momento...' : 'Sí, salir del grupo'}
                  </button>
                  <button
                    onClick={() => setConfirmingLeave(false)}
                    className="rounded-lg bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Messages Body */}
              <div
                ref={listaRef}
                onScroll={alDesplazar}
                className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 space-y-4"
              >
                {activeMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-8 text-zinc-500">
                    <Sparkles size={24} className="text-violet-400 mb-2" />
                    <p className="text-sm font-semibold text-zinc-300">
                      ¡Comienza la conversación!
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      Envía un saludo o comparte tus teorías sobre tus series y animes preferidos.
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg, posicion) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const eliminado = !!msg.deletedForEveryone;

                    // El citado, si sigue en la lista: sirve para no
                    // enseñar por la cita lo que el borrado quitó.
                    const citado =
                      msg.replyTo && activeRoomId
                        ? (messages[activeRoomId] ?? []).find(
                            (m: ChatMessage) => m.id === msg.replyTo!.messageId,
                          )
                        : undefined;

                    // Borrado para todos: burbuja discreta sin
                    // contenido, sin reacciones, sin ticks y sin menú.
                    // Lo que pone depende de quién mira: el autor ve
                    // que lo eliminó él, los demás que se eliminó.
                    if (eliminado) {
                      return (
                        <Fragment key={msg.id}>
                          {posicion === corteNuevos.indice && corteNuevos.total > 0 && (
                            <div className="flex items-center gap-3 py-1">
                              <div className="h-px flex-1 bg-violet-500/40" />
                              <span className="shrink-0 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-300">
                                {textoDeNuevos(corteNuevos.total)}
                              </span>
                              <div className="h-px flex-1 bg-violet-500/40" />
                            </div>
                          )}

                          <div
                            className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isMe && (
                              <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                                <Ban size={13} />
                              </span>
                            )}

                            <div className="max-w-[78%] space-y-1 sm:max-w-[70%] 2xl:max-w-[45%]">
                              {!isMe && (
                                <span className="text-[11px] font-bold text-violet-300 pl-1 block">
                                  {senderNameOf(msg)}
                                </span>
                              )}

                              <div
                                className={`flex w-fit max-w-full items-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-[15px] sm:text-sm italic text-zinc-500 ${
                                  isMe ? 'ml-auto' : ''
                                }`}
                              >
                                <Ban size={13} className="flex-shrink-0" />
                                <span>
                                  {isMe
                                    ? 'Eliminaste este mensaje'
                                    : 'Este mensaje fue eliminado'}
                                </span>
                              </div>

                              <div
                                className={`flex items-center gap-1 text-[10px] text-zinc-500 font-mono ${
                                  isMe ? 'justify-end pr-1' : 'pl-1'
                                }`}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      );
                    }

                    return (
                      <Fragment key={msg.id}>
                        {/* LA BARRA DE "MENSAJES NUEVOS"

                            Va justo ANTES del primer mensaje nuevo, no
                            encima de la lista: lo de debajo de la
                            barra es lo nuevo, que es lo que se pidió.

                            `key` con el id del mensaje para que la barra
                            no se monte y desmonte al recalcularse el
                            corte: si fuera una posición, al llegar un
                            mensaje nuevo se recolocaría sola y parpadearía.
                        */}
                        {posicion === corteNuevos.indice && corteNuevos.total > 0 && (
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-px flex-1 bg-violet-500/40" />
                            <span className="shrink-0 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-300">
                              {textoDeNuevos(corteNuevos.total)}
                            </span>
                            <div className="h-px flex-1 bg-violet-500/40" />
                          </div>
                        )}

                        <div
                          className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => goToProfile(msg.senderId)}
                            aria-label={`Ver el perfil de ${senderNameOf(msg)}`}
                            title="Ver su perfil"
                            className="mt-1 flex-shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                          >
                            <img
                              src={senderAvatarOf(msg)}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover shrink-0"
                            />
                          </button>
                        )}

                        {/* El límite en porcentaje solo no
                            basta: al ensanchar la ventana, el
                            70% de 1400px es una burbuja de casi
                            un metro que deja de leerse como
                            mensaje de chat. */}
                        <div
                          className={`max-w-[78%] space-y-1 sm:max-w-[70%] 2xl:max-w-[45%]`}
                        >
                          {!isMe && (
                            <span className="text-[11px] font-bold text-violet-300 pl-1 block">
                              {senderNameOf(msg)}
                            </span>
                          )}

                          {/* Cita: a qué mensaje responde este. Si el
                              citado sigue en la lista y está borrado
                              para todos, se enseña el marcador en vez
                              del fragmento guardado, para no filtrar
                              por la cita lo que el borrado quitó. Si
                              ya no está (antiguo), se enseña lo
                              guardado tal cual. */}
                          {msg.replyTo && (
                            <div
                              className={`mb-1 w-fit max-w-full rounded-lg border-l-2 border-violet-500/70 bg-zinc-900/70 px-2.5 py-1.5 ${
                                isMe ? 'ml-auto' : ''
                              }`}
                            >
                              <p className="text-[10px] font-bold text-violet-300">
                                {msg.replyTo.senderName}
                              </p>
                              <p className="line-clamp-2 text-[11px] text-zinc-400">
                                {citaVisible(msg.replyTo.snippet, citado?.deletedForEveryone)}
                              </p>
                            </div>
                          )}

                          <div
                            // `w-fit`: la burbuja abraza al texto. Sin
                            // esto, al ser bloque, llena el ancho del
                            // contenedor, que lo marca la fila más
                            // ancha (hora + ticks + menú): un "lol"
                            // editado desde un párrafo se quedaba con
                            // el ancho del párrafo. El `ml-auto` es
                            // para los propios: estrecha pegada a la
                            // derecha, como antes llenando.
                            // El texto base es 15px en móvil (se lee
                            // sin zoom) y se queda como estaba en
                            // escritorio.
                            className={`w-fit max-w-full rounded-2xl px-4 py-2.5 text-[15px] sm:text-sm leading-relaxed shadow-md ${
                              isMe
                                ? 'ml-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-tr-none'
                                : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-750'
                            }`}
                          >
                            {/* El texto solo se pinta si hay texto: un
                                mensaje puede ser solo un GIF. */}
                            {msg.body && <p>{msg.body}</p>}
                          </div>

                          {/* GIF del mensaje. Se pinta FUERA de la
                              burbuja para que la imagen no se estire
                              ni estire el degradado de "mi mensaje". */}
                          {msg.gif && <CommentGif gif={msg.gif} />}

                          {/* Foto adjunta. Se comprueba el campo y no
                              `msg.type` porque los mensajes con foto y
                              con texto a la vez llevan type 'image' y el
                              texto sigue siendo texto; y los antiguos,
                              de antes de que existiera este campo, no
                              lo tienen. */}
                          {msg.imageUrl && (
                            <a
                              href={msg.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 block overflow-hidden rounded-xl border border-zinc-700 transition-opacity hover:opacity-90"
                            >
                              {/* `object-contain` y sin `w-full` forzado: con `w-full object-cover`
                                en una caja sin proporción, `cover` no hacía nada
                                y una captura de pantalla o un cartel se perdían
                                enteros. Ahora se ve la foto COMPLETA, limitada por
                                `max-h`, y el `<a>` de arriba la abre a tamaño
                                real para cuando haga falta verla bien. */}
                              <img
                                src={msg.imageUrl}
                                alt={msg.senderName ? `Foto de ${msg.senderName}` : 'Foto adjunta'}
                                loading="lazy"
                                className="block h-auto max-h-72 max-w-full object-contain"
                              />
                            </a>
                          )}

                          {/* Ubicación compartida. */}
                          {msg.location && <LocationCard ubicacion={msg.location} />}

                          {/* Reacciones del mensaje */}
                          <ReactionBar
                            compacta
                            targetType="chat_message"
                            targetId={msg.id}
                            datos={reaccionesDe(reaccionesMensaje, 'chat_message', msg.id)}
                            mia={misReaccionesMensaje[reactionKey('chat_message', msg.id)]}
                            onElegir={(tipo) =>
                              toggleReaction(
                                'chat_message',
                                msg.id,
                                tipo,
                                misReaccionesMensaje[reactionKey('chat_message', msg.id)],
                                msg.chatId,
                              )
                            }
                          />

                          <div
                            className={`flex items-center gap-1 text-[10px] text-zinc-500 font-mono ${
                              isMe ? 'justify-end pr-1' : 'pl-1'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {/* Editado: solo si el servidor puso fecha.
                                Sin esto, un texto cambiado no se
                                distinguiría del original. */}
                            {msg.editedAt && (
                              <span className="italic" title="Mensaje editado">
                                · editado
                              </span>
                            )}
                            {isMe &&
                              (isReadByEveryone(msg.id, msg.createdAt) ? (
                                // Doble tick: el resto ya lo ha leído
                                <span
                                  className="flex items-center text-sky-300"
                                  title="Leído"
                                >
                                  <Check size={12} strokeWidth={3} />
                                  <Check size={12} strokeWidth={3} className="-ml-1.5" />
                                </span>
                              ) : (
                                // Un solo tick: enviado, pendiente de lectura
                                <span className="text-zinc-500" title="Enviado">
                                  <Check size={11} />
                                </span>
                              ))}

                            {/* Menú del mensaje: responder, editar (solo
                                propio) y eliminar. Va aquí, junto a la
                                hora, y no sobre la burbuja: así funciona
                                igual con dedo que con ratón, sin
                                depender de `hover`, y no tapa el
                                contenido en pantallas estrechas. */}
                            <span className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuMsgId(menuMsgId === msg.id ? null : msg.id);
                                }}
                                aria-label={`Opciones del mensaje de ${senderNameOf(msg)}`}
                                title="Opciones"
                                // Diana de 28px con icono de 11: en el
                                // móvil el botón de antes (p-0.5) era
                                // casi imposible de acertar con el dedo.
                                className="rounded p-2 text-zinc-600 transition-colors hover:bg-zinc-700/60 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-violet-400"
                              >
                                <MoreVertical size={11} />
                              </button>

                              {menuMsgId === msg.id && (
                                <span className={`absolute bottom-5 z-20 block w-48 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-2xl ${isMe ? 'right-0' : 'left-0'}`}>
                                  <button
                                    type="button"
                                    onClick={() => responderA(msg)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                                  >
                                    <Reply size={13} className="text-violet-400" />
                                    <span>
                                      Responder
                                      <span className="block text-[10px] font-normal text-zinc-500">
                                        Citar este mensaje
                                      </span>
                                    </span>
                                  </button>

                                  {isMe && (
                                    <button
                                      type="button"
                                      onClick={() => empezarEdicion(msg)}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                                    >
                                      <Pencil size={13} className="text-zinc-400" />
                                      <span>
                                        Editar
                                        <span className="block text-[10px] font-normal text-zinc-500">
                                          Cambiar el texto
                                        </span>
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => pedirBorrar(msg)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                                  >
                                    <Trash2 size={13} className="text-red-400" />
                                    <span>
                                      Eliminar mensaje
                                      <span className="block text-[10px] font-normal text-zinc-500">
                                        Para ti o para todos
                                      </span>
                                    </span>
                                  </button>
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        </div>
                      </Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* CONFIRMAR BORRADO DE MENSAJE
                  Casos:
                    A. Soy el autor y no pasaron 2 h → para todos + solo para mí.
                    B. Soy el autor y pasaron 2 h o más → solo "solo para mí".
                       La opción de todos NO se pinta (no basta con
                       desactivarla).
                    C. No soy el autor → solo "solo para mí".
                  Nada se ejecuta hasta pulsar: abrir el modal no borra. */}
              {borrandoMsg && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  onClick={() => {
                    if (!borrandoBusy) setBorrandoMsg(null);
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Eliminar mensaje"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xs rounded-3xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
                  >
                    <h3 className="text-center text-sm font-black text-white">
                      Eliminar mensaje
                    </h3>
                    <p className="mt-1 text-center text-[11px] text-zinc-400">
                      ¿Cómo quieres eliminarlo?
                    </p>

                    <div className="mt-4 space-y-2">
                      {currentUser &&
                        puedeBorrarParaTodos(borrandoMsg, currentUser.uid) && (
                          <button
                            type="button"
                            onClick={() => void borrarParaTodos()}
                            disabled={borrandoBusy}
                            className="flex w-full items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-left transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 size={15} className="flex-shrink-0 text-red-400" />
                            <span>
                              <span className="block text-xs font-bold text-white">
                                {borrandoBusy ? 'Eliminando...' : 'Eliminar para todos'}
                              </span>
                              <span className="block text-[10px] font-normal text-zinc-400">
                                Desaparece para todos los participantes
                              </span>
                            </span>
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => void borrarSoloParaMi()}
                        disabled={borrandoBusy}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-left transition-colors hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Eraser size={15} className="flex-shrink-0 text-zinc-400" />
                        <span>
                          <span className="block text-xs font-bold text-white">
                            {borrandoBusy ? 'Eliminando...' : 'Eliminar solo para mí'}
                          </span>
                          <span className="block text-[10px] font-normal text-zinc-400">
                            Los demás lo siguen viendo
                          </span>
                        </span>
                      </button>
                    </div>

                    {borrandoError && (
                      <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                        {borrandoError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setBorrandoMsg(null)}
                      disabled={borrandoBusy}
                      className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* BAJAR A LOS NUEVOS

                  Solo aparece si el usuario está leyendo historia.
                  No es adorno: sin él, si has subido a mirar un
                  mensaje viejo y te contesta alguien, no hay forma de
                  bajar sin arrastrar la barra de scroll a ciegas, y
                  el mensaje nuevo se queda escondido abajo del todo.

                  Va fuera de la caja con scroll, y pegado al borde
                  inferior, para que quede por encima del campo de
                  escribir en lugar de taparlo.
              */}
              {lejosDelFinal && (
                <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center">
                  <button
                    type="button"
                    onClick={irAlFinal}
                    className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-zinc-900/95 px-3.5 py-1.5 text-[11px] font-bold text-violet-300 shadow-lg backdrop-blur transition-colors hover:border-violet-400/70 hover:text-violet-200"
                  >
                    <ArrowDown size={13} strokeWidth={2.5} />
                    {corteNuevos.total > 0
                      ? `Bajar a los ${corteNuevos.total} nuevos`
                      : 'Bajar al final'}
                  </button>
                </div>
              )}

              {/* PANEL DE MIEMBROS (solo grupos) */}
              {showMembers && activeRoom?.type === 'group' && (
                <div className="border-t border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                      <Users size={13} />
                      <span>Miembros del grupo ({activeRoom.memberIds.length})</span>
                    </h4>
                    <button
                      onClick={() => setShowMembers(false)}
                      className="text-zinc-500 hover:text-white"
                      aria-label="Cerrar panel de miembros"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {!isGroupOwner && (
                    <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] text-zinc-500">
                      Solo quien creó el grupo puede añadir o expulsar miembros.
                    </p>
                  )}

                  <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                    {memberProfiles.map((u) => {
                      const isOwner = u.uid === activeRoom.ownerId;
                      const isMe = u.uid === currentUser?.uid;

                      return (
                        <li
                          key={u.uid}
                          className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                        >
                          {/* Avatar y nombre al perfil de la
                              persona. La fila entera NO es un
                              botón porque a su derecha hay botones
                              de verdad (echar, silenciar, promoted) y
                              un botón dentro de otro botón no
                              funciona. */}
                          <button
                            type="button"
                            onClick={() => goToProfile(u.uid)}
                            aria-label={`Ver el perfil de ${u.displayName || u.username}`}
                            title="Ver su perfil"
                            className="flex-shrink-0 rounded-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                          >
                            <img
                              src={u.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-white">
                              <button
                                type="button"
                                onClick={() => goToProfile(u.uid)}
                                title="Ver su perfil"
                                className="truncate text-left transition-colors hover:text-violet-300"
                              >
                                {u.displayName || u.username}
                              </button>
                              {isOwner && (
                                <Crown size={12} className="flex-shrink-0 text-amber-400" />
                              )}
                              {isMe && (
                                <span className="text-[9px] font-bold text-violet-300">
                                  TÚ
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[10px] font-mono text-zinc-500">
                              {u.chatId}
                            </p>
                          </div>

                          {isOwner ? (
                            <span className="text-[10px] font-semibold text-amber-400">
                              Admin
                            </span>
                          ) : isGroupOwner ? (
                            <button
                              onClick={() => handleRemoveMember(u.uid)}
                              disabled={busyAction}
                              className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <UserMinus size={11} />
                              <span>Expulsar</span>
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  {isGroupOwner && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={addMemberInput}
                        onChange={(e) => setAddMemberInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMember();
                          }
                        }}
                        placeholder="ID del usuario a añadir..."
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        onClick={handleAddMember}
                        disabled={busyAction || !addMemberInput.trim()}
                        className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                      >
                        {busyAction ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                        <span>Añadir</span>
                      </button>
                    </div>
                  )}

                  {memberFeedback?.success && (
                    <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">
                      {memberFeedback.success}
                    </p>
                  )}
                  {memberFeedback?.error && (
                    <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                      {memberFeedback.error}
                    </p>
                  )}
                </div>
              )}

              {/* Message Input Bottom Bar */}
              <form
                onSubmit={handleSendMessage}
                className="relative border-t border-zinc-800 bg-zinc-950 p-3"
              >
                {/* Citando: a quién y qué, con salida. Al enviar, la
                    cita viaja dentro del mensaje nuevo. */}
                {citaA && !editando && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-violet-500 bg-zinc-900 px-3 py-2">
                    <Reply size={13} className="flex-shrink-0 text-violet-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-violet-300">
                        {senderNameOf(citaA)}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {fragmentoParaCita(citaA)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCitaA(null)}
                      aria-label="Dejar de citar"
                      className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Editando: lo que se escriba sustituye al texto del
                    mensaje, no manda uno nuevo. Los adjuntos no
                    aplican aquí: la foto o el GIF que tuviera se
                    quedan como están. */}
                {editando && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-amber-500 bg-zinc-900 px-3 py-2">
                    <Pencil size={13} className="flex-shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-amber-300">
                        Editando mensaje
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {editando.body || '(sin texto)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      aria-label="Cancelar edición"
                      className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                
        {/* Con "flex-wrap" los dos botones pasan a una columna en
            pantallas estrechas. Sin esto, a 390px se quedaban sin
            ancho y "Crear Grupo" se partía en dos líneas, con la
            caja descolocada respecto a la de al lado. */}
        <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      editando ? 'Editar mensaje...' : `Escribir a ${activeRoomName}...`
                    }
                    // 16px en móvil: por debajo, iOS acerca la vista
                    // al enfocar y hay que alejar a mano. En
                    // escritorio se queda como estaba.
                    className="flex-1 min-w-[8rem] rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                  />

                  {/* Emojis */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    aria-label="Insertar un emoji"
                    title="Emojis"
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                      showEmojiPicker
                        ? 'border-violet-500/60 bg-violet-600/20 text-violet-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-violet-500/50 hover:text-violet-300'
                    }`}
                  >
                    <Smile size={17} />
                  </button>

                  {/* Adjuntar una foto del ordenador. En edición no
                      aplica: solo cambia el texto y la foto que hubiera
                      se queda como está. */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!!editando}
                    aria-label="Adjuntar una foto"
                    title="Adjuntar una foto"
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                      chatImageUrl
                        ? 'border-violet-500/60 bg-violet-600/20 text-violet-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-violet-500/50 hover:text-violet-300'
                    } disabled:opacity-40`}
                  >
                    <ImagePlus size={17} />
                  </button>

                  {/* Compartir ubicación: abre el menú con las dos
                      formas de elegirla. El permiso del navegador solo
                      se pide si se elige "usar mi ubicación actual".
                      En edición no aplica, igual que la foto. */}
                  <div className={editando ? 'pointer-events-none opacity-40' : ''}>
                    <LocationMenu
                      onLocated={handleLocated}
                      onAbrirMapa={() => abrirMapa()}
                      onError={setGeoNotice}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      editandoBusy ||
                      (editando
                        ? !inputText.trim() &&
                          !(editando.imageUrl || editando.gif || editando.location)
                        : !inputText.trim() && !chatGif && !chatImageUrl)
                    }
                    aria-label={editando ? 'Guardar edición' : 'Enviar mensaje'}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-violet-600/30"
                  >
                    {editando ? <Check size={16} /> : <Send size={16} />}
                  </button>
                </div>

                {/* El <input type="file"> de verdad: es el que abre el
                    diálogo de archivos del sistema. Va escondido con
                    `hidden`, no con `display: none`, porque un input
                    con `display: none` no siempre se puede pulsar desde
                    otro elemento en todos los navegadores. */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePickImage}
                  className="hidden"
                />

                {geoNotice && (
                  <LocationNotice
                    mensaje={geoNotice}
                    onClose={() => setGeoNotice(null)}
                    // El mapa no necesita permiso, así que siempre es
                    // una salida. Sin esto, quien no tiene sensor en el
                    // portátil se queda sin poder compartir sitio.
                    accion={{ texto: 'Elegir en el mapa', onClick: () => abrirMapa() }}
                  />
                )}

                {/* La foto elegida, antes de mandarla. Se ve aquí para
                    poder quitarla sin tener que vaciar el texto.
                    La ubicación no aparece aquí porque no pasa por la
                    caja: se ve y se manda desde su propio mapa.
                    En edición no sale: solo cambia el texto. */}
                {chatImageUrl && !editando && (
                  <div className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Adjunto
                      </span>
                      <button
                        type="button"
                        onClick={() => setChatImageUrl(null)}
                        className="text-[10px] font-medium text-zinc-400 hover:text-zinc-200"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <img
                        src={chatImageUrl}
                        alt="Foto adjunta"
                        className="h-16 w-24 rounded-lg object-cover"
                      />
                      <span className="text-[11px] text-zinc-400">Foto del ordenador</span>
                    </div>
                  </div>
                )}

                {/* ── GIFs y emojis, bajo el campo ────────
                    El GIF es un adjunto del mensaje (igual que en
                    los comentarios) y el emoji se inserta en el
                    texto, en el cursor. En edición no sale: el
                    emoji sí sigue disponible arriba. */}
                {!editando && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <GifPicker value={chatGif} onChange={setChatGif} />
                  {chatGif && (
                    <span className="text-[10px] text-zinc-500">
                      El GIF se enviará con el mensaje.
                    </span>
                  )}
                </div>
                )}

                {/* ── Ventana de emojis ──────────────────
                    Va fija y por encima de todo, como la del
                    selector de reacciones: el chat tiene scroll
                    propio y una ventana `absolute` se recortaba
                    contra él. */}
                {showEmojiPicker && (
                  <>
                    {/* Capa transparente para cerrar al pulsar
                        fuera. No oscurece: solo recoge el clic. */}
                    <button
                      type="button"
                      aria-label="Cerrar el selector de emojis"
                      onClick={() => setShowEmojiPicker(false)}
                      className="fixed inset-0 z-[80] cursor-default"
                    />
                    <div className="geo-pop-in fixed bottom-24 left-3 right-3 z-[85] rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-3 shadow-2xl shadow-violet-950/60 backdrop-blur sm:left-6 sm:right-auto sm:w-[340px]">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-violet-300">
                          Emojis
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                          aria-label="Cerrar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <EmojiPicker onElegir={(e) => insertarEmoji(e.emoji)} alto="h-60" />
                    </div>
                  </>
                )}
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
              <MessageCircle size={36} className="text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-white">Selecciona o inicia un chat</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                Puedes iniciar una charla privada añadiendo un usuario mediante su ID único o crear un nuevo grupo de debate.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ELEGIR LA UBICACIÓN EN EL MAPA */}
      {selectorAbierto && (
        <LocationPicker
          inicial={puntoInicial}
          onConfirmar={handleConfirmarUbicacion}
          onCancelar={() => {
            setSelectorAbierto(false);
            setPuntoInicial(null);
          }}
        />
      )}

      {/* MODAL: NUEVO CONTACTO POR ID */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => {
                setShowAddContact(false);
                setAddFeedback(null);
                setTargetIdInput('');
              }}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Añadir Nuevo Contacto</h3>
                <p className="text-xs text-zinc-400">Introduce el ID único del usuario</p>
              </div>
            </div>

            {/* Input form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  ID de Usuario o Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetIdInput}
                    onChange={(e) => setTargetIdInput(e.target.value)}
                    placeholder="Ej: GK-4190-NETRUN o GK-9912-ELVEN"
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSearchContact}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* Feedback / Found User Card */}
              {addFeedback?.error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{addFeedback.error}</span>
                </div>
              )}

              {addFeedback?.user && (
                <div className="rounded-2xl border border-violet-500/40 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={addFeedback.user.avatarUrl}
                      alt={addFeedback.user.username}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-violet-500/40"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {addFeedback.user.displayName || addFeedback.user.username}
                      </h4>
                      <span className="text-xs text-zinc-400 block font-mono">
                        {addFeedback.user.chatId}
                      </span>
                    </div>
                  </div>

                  {addFeedback.user.bio && (
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      "{addFeedback.user.bio}"
                    </p>
                  )}

                  <button
                    onClick={() => handleRequestChat(addFeedback.user as User)}
                    disabled={creatingChat || isBlocked(addFeedback.user.uid)}
                    className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all disabled:opacity-50"
                  >
                    {creatingChat
                      ? 'Enviando...'
                      : isBlocked(addFeedback.user.uid)
                        ? 'Has bloqueado a este usuario'
                        : 'Solicitar conversación privada'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR GRUPO */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateGroupSubmit}
            className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4"
          >
            <button
              type="button"
              onClick={() => setShowCreateGroup(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Crear Nuevo Grupo</h3>
                <p className="text-xs text-zinc-400">Reúne a otakus y geeks en una misma sala</p>
              </div>
            </div>

            {/* Fallo al crear. Se pinta aquí, dentro del formulario,
                y no con un alert del navegador: así se lee qué ha
                pasado sin perder el texto que ya se había escrito
                en el nombre del grupo. */}
            {actionFeedback && (
              <p className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-red-400">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <span className="break-words">{actionFeedback}</span>
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombre de la Sala / Grupo
              </label>
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                placeholder="Ej: Fans de Shingeki, Club de Anime Clásico..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3.5 py-2.5">
              <Shield size={13} className="mt-0.5 flex-shrink-0 text-violet-300" />
              <p className="text-[11px] leading-relaxed text-violet-200/90">
                El grupo se crea contigo dentro y serás su administrador. El resto de gente
                tendrá que <strong>pedir entrar</strong> y tú aceptarás o rechazarás cada
                solicitud. Nadie ve el contenido del grupo sin tu permiso.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingChat}
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50"
              >
                {creatingChat ? 'Creando...' : 'Crear Grupo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: UNIRSE A UN GRUPO */}
      {showGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowGroups(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Hash size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Unirse a un grupo</h3>
                <p className="text-xs text-zinc-400">
                  Escribe el código que te hayan pasado
                </p>
              </div>
            </div>

            {actionFeedback && (
              <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                {actionFeedback}
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinGroupByCode();
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={groupCodeInput}
                onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                placeholder="GRP-A1B2-C3D4"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={busyAction || !groupCodeInput.trim()}
                className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {busyAction ? 'Enviando solicitud...' : 'Pedir entrar al grupo'}
              </button>
            </form>

            <p className="mt-3 flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-500">
              <Hash size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                El código se lo enseña quien creó el grupo, en la cabecera de la conversación.
                Se usa el código y no el nombre porque puede haber varios grupos con el mismo
                nombre.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
