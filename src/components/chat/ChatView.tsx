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
  BarChart3,
  Camera,
  ArrowDown,
  Trash2,
  Ban,
  Reply,
  Pencil,
  Compass,
  Info,
  VolumeX,
  Lock,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Trophy,
  Pin,
} from 'lucide-react';

import { textoDeNuevos } from '../../utils/chatLectura';
import { puedeBorrarParaTodos } from '../../utils/chatBorrado';
import { MAX_CITA, citaVisible, fragmentoParaCita, textoParaCita } from '../../utils/chatCita';
import {
  editarMensajeChat,
  eliminarMensajeParaTodos,
  ensureGroupCode,
  ocultarMensajeParaMi,
} from '../../services/chats';
import { useAuth } from '../../context/AuthContext';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChatAparienciaPanel } from './ChatAparienciaPanel';
import {
  APARIENCIA_POR_DEFECTO,
  aparienciaAGuardar,
  resolverApariencia,
  sujetoConFondo,
  sujetarApariencia,
  type AparienciaChat,
  type FondoChat,
} from '../../data/chatApariencia';
import { deleteReplacedImage, uploadCommunityImage } from '../../services/imageUpload';
import { getChatPrefs } from '../../services/chatPrefs';
import { saveFondoChat, subscribeChatPrefs } from '../../services/chatPrefs';
import { subscribePresence } from '../../services/presence';
import { estadoPresencia, type PresenceInfo } from '../../utils/presence';
import { userPrivateRef } from '../../services/userPrivate';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { useChat } from '../../context/ChatContext';
import { useClubs } from '../../context/ClubsContext';
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
import { ClubDetail } from './ClubDetail';
import { ChatPrefsPanel } from './ChatPrefsPanel';
import { ClubRoleBadge } from './ClubRoleBadge';
import { puedeHacer } from '../../data/clubModeracion';
import { ChatFijadosPanel } from './ChatFijadosPanel';
import { MenuMensaje } from './MenuMensaje';
import { createPortal } from 'react-dom';
import {
  desfijarMensaje,
  fijarMensaje,
  subscribeFijados,
  type ChatFijado,
} from '../../services/chatFijados';
import { SancionDialog } from './ClubSancionDialog';
import { avisoDeSancion, estadoDe, fechaLegible, puedeSancionar } from '../../data/clubModeracion';
import {
  aplicarSancion,
  subscribeSancionPropia,
} from '../../services/clubModeracion';
import type { ClubSancion } from '../../types';
import { ClubDiscovery } from './ClubDiscovery';
import { ClubListItem } from './ClubListItem';
import { ClubChannelRail } from './ClubChannelRail';
import { ClubChannelModal } from './ClubChannelModal';
import { canalesVisibles, actualizarCanal } from '../../services/canales';
import { ChatPollCard } from './ChatPollCard';
import { ChatTierCard } from '../tierlists/ChatTierCard';
import { TierListEditor } from '../tierlists/TierListEditor';
import { TierListViewer } from '../tierlists/TierListViewer';
import {
  crearTierList,
  getTierList,
  guardarEdicionTierList,
  subscribeMisTierLists,
  type TierResult,
} from '../../services/tierlists';
import { borradorDesdeDoc } from '../../utils/tierlists';
import type { EditorDraft } from '../../utils/tierlists';
import type { TierList, TierListRef } from '../../types';
import { PollComposer, POLL_VACIO, draftANewPoll, type PollDraft } from '../community/PollComposer';
import { normalizarPoll } from '../../services/polls';
import { CLUB_CATEGORIES } from '../../types';
import type {
  ChatMessage,
  ChatRequest,
  ChatRoom,
  Club,
  ClubChannel,
  GifAttachment,
  LocationAttachment,
  Poll,
  User,
} from '../../types';

/**
 * Si el borrador de encuesta tiene algo escrito (pregunta u
 * opciones). Un panel abierto pero vacío se ignora al enviar;
 * a medio escribir bloquea con error en el propio panel.
 */
function borradorConContenido(borrador: PollDraft): boolean {
  return (
    borrador.question.trim().length > 0 ||
    borrador.options.some((o) => o.trim().length > 0)
  );
}

// ======================================================
// CHATS: TRES VISTAS EN UNA MISMA SECCIÓN
// ======================================================
//   privados  -> conversaciones de uno a uno
//   clubes    -> los clubes del usuario y sus chats grupales
//   descubrir -> galería para buscar comunidades y unirse
//
// No es una sección nueva de la web: sigue siendo «Chats»,
// con la lista a la izquierda y el chat a la derecha. Los
// clubes son documentos de `chats/` (type: 'club'), así que
// sus mensajes usan EXACTAMENTE el mismo sistema que los
// privados: mismas reglas, mismas suscripciones, mismo
// historial.
// ======================================================

type TabChats = 'privados' | 'clubes' | 'descubrir';

export const ChatView: React.FC = () => {
  const { currentUser, getUserByChatId, usersList, updateProfileData } = useAuth();
  const goToProfile = useGoToProfile();
  const {
    rooms,
    activeRoomId,
    setActiveRoomId,
    messages,
    hasMoreMessages,
    loadingOlderMessages,
    loadOlderMessages,
    sendMessage,
    createGroupChat,
    setGroupAvatar,
    activeRoom,
    loading: chatsLoading,
    error: chatsError,
    isReadByEveryone,
    parchearMensaje,
    chatOpen,
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

  // ── Presencia de los contactos directos ─────────────
  const [presencia, setPresencia] = useState<Record<string, PresenceInfo>>({});
  const [relojPresencia, setRelojPresencia] = useState(() => Date.now());

  const contactosDirectos = useMemo(() => {
    if (!currentUser) return [];
    const ids = new Set<string>();
    rooms.forEach((room) => {
      if (room.type !== 'direct') return;
      room.memberIds.forEach((uid) => {
        if (uid !== currentUser.uid) ids.add(uid);
      });
    });
    return [...ids].sort();
  }, [rooms, currentUser?.uid]);
  const contactosKey = contactosDirectos.join('|');

  useEffect(() => {
    if (!chatOpen || !currentUser || contactosDirectos.length === 0) {
      setPresencia({});
      return;
    }
    return subscribePresence(
      contactosDirectos,
      setPresencia,
      (e) => console.error('[Presencia] Error escuchando contactos:', e),
    );
    // `contactosKey` representa la lista sin depender de su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, currentUser?.uid, contactosKey]);

  // Recalcula los textos "hace X" aunque no llegue ningún documento.
  useEffect(() => {
    if (!chatOpen) return;
    const intervalo = window.setInterval(
      () => setRelojPresencia(Date.now()),
      30_000,
    );
    return () => window.clearInterval(intervalo);
  }, [chatOpen]);

  const estadoPresenciaDe = useCallback(
    (uid: string | undefined) => estadoPresencia(
      uid ? presencia[uid] : undefined,
      relojPresencia,
    ),
    [presencia, relojPresencia],
  );

  // En qué vista de la sección estamos. Empieza en 'privados'
  // para conservar el comportamiento de siempre: entrar en
  // «Chats» te deja en tus conversaciones.
  const [tabChats, setTabChats] = useState<TabChats>('privados');
  const [clubDetalle, setClubDetalle] = useState<string | null>(null);

  // ── Panel de preferencias por conversación ────────────
  // `prefsPanelFor` es el roomId whose chat se está personalizando
  // (o null = cerrado). Se abre desde el menú de opciones de
  // conversación (MoreVertical) y se guarda en
  // `chats/{chatId}/prefs/{uid}`.
  const [prefsPanelFor, setPrefsPanelFor] = useState<string | null>(null);

  // Apodos por conversación: { roomId: apodo }. Se cargan al entrar
  // y se actualizan al guardar. El nombre que se muestra en la
  // lista y en la cabecera es el apodo si existe, si no el real.
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  // ── Barra lateral plegable ────────────────────────
  //
  // Solo VISUAL: contraer no toca rooms, filtros, pestañas,
  // clubes, solicitudes ni suscripciones; los mismos elementos
  // siguen montados y solo cambian sus clases. La elección se
  // guarda en el navegador (sin Firestore) para mantenerla al
  // volver a entrar.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return globalThis.localStorage?.getItem('geekapoo:chats:sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        globalThis.localStorage?.setItem(
          'geekapoo:chats:sidebar',
          next ? 'collapsed' : 'open',
        );
      } catch {
        // Sin almacenamiento la preferencia no persiste. Nada más.
      }
      return next;
    });
  };
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // El campo crece con el texto hasta un tope: un mensaje largo
  // no debería obligar a escribir en una sola línea. Al vaciar
  // o cambiar de conversación vuelve a su altura.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [inputText, activeRoomId]);

  // Carga los apodos de las salas visibles. Se actualizan al
  // guardar desde el panel y al entrar en ChatView.
  useEffect(() => {
    if (!currentUser) return;
    const cargar = async () => {
      const entries = await Promise.all(
        rooms.map(async (r) => {
          const p = await getChatPrefs(currentUser.uid, r.id);
          return [r.id, p.nickname] as const;
        }),
      );
      const limpio: Record<string, string> = {};
      for (const [id, n] of entries) {
        if (n) limpio[id] = n;
      }
      setNicknames(limpio);
    };
    void cargar();
  }, [rooms, currentUser]);

  // Nombre visible de una sala: apodo si existe, si no el real.
  const nombreVisible = (sala: ChatRoom): string =>
    nicknames[sala.id] ??
    (sala.type === 'direct'
      ? (() => {
          const other = usersList.find(
            (u) => currentUser && sala.memberIds.includes(u.uid) && u.uid !== currentUser.uid,
          );
          return other?.displayName || other?.username || '';
        })()
      : sala.name);

  // ── Emojis y GIFs en el chat ─────────────────────────
  //
  // El campo de texto es un área que crece sola, así que para
  // insertar un emoji EN EL CURSOR (y no al final) hace falta el
  // `ref`: se lee `selectionStart`, se escribe el texto nuevo y
  // se vuelve a poner el cursor donde estaba. Sin eso, escribir
  // "hola" y elegir 😄 pondría el emoji detrás de la última letra.
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatGif, setChatGif] = useState<GifAttachment | null>(null);
  // Herramientas del compositor en móvil: en pantallas estrechas
  // los seis botones no caben junto al campo, así que van tras un
  // "+". En escritorio se ven todos como siempre.
  const [showHerramientas, setShowHerramientas] = useState(false);

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
   *
   * En un club NO se usa este botón: la portada y el icono se cambian
   * desde el panel de detalles del club, que es donde están el resto de
   * ajustes. Aquí solo quedaría un hueco roto.
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
  // Generar el código de un grupo antiguo que no lo tiene. Al
  // cambiar de conversación se limpia el error, como el resto
  // de avisos de la vista.

  // ── Mensajes fijados ──────────────────────────────
  //
  // `fijados` son los mensajes fijados de la conversación
  // ABIERTA. Se escuchan con un solo listener a la
  // subcolección `chats/{chatId}/fijados`, sin tocar el
  // historial: por eso el panel abre al instante.
  const [fijados, setFijados] = useState<ChatFijado[]>([]);
  const [fijadosCargando, setFijadosCargando] = useState(false);
  const [panelFijados, setPanelFijados] = useState(false);
  const [mensajeResaltado, setMensajeResaltado] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRoomId) {
      setFijados([]);
      return;
    }
    setFijadosCargando(true);
    return subscribeFijados(
      activeRoomId,
      (lista) => {
        setFijados(lista);
        setFijadosCargando(false);
      },
      () => setFijadosCargando(false),
    );
  }, [activeRoomId]);
  /**
   * Fija o quita un mensaje de los fijados de la conversación.
   *
   * El permiso lo vuelve a comprobar el SERVIDOR: aquí solo se
   * avisa. En un club, quien puede fijar es el dueño y los admins
   * con el permiso `adminFijaMensajes`; en un privado o un grupo,
   * cualquiera de la conversación.
   */
  /** ¿Este mensaje está fijado? */
  const estaFijado = (messageId: string) =>
    fijados.some((f) => f.messageId === messageId);

  /**
   * ¿Puede la persona que mira fijar mensajes en ESTE chat?
   *
   * En un club, es el dueño y los admins con el permiso
   * `adminFijaMensajes` (encendido de serie), más los
   * moderadores si el propietario les da `moderadorFijaMensajes`.
   * En un privado o un grupo, cualquiera de la conversación.
   *
   * Es la MISMA respuesta que dan las reglas: aquí solo decide
   * si se pinta el botón.
   */
  const puedeFijarEnEsta = () => {
    if (!esChatClub) return true;
    if (!clubDelChat || !currentUser) return false;
    return (
      puedeHacer(clubDelChat, currentUser.uid, 'adminFijaMensajes').ok ||
      puedeHacer(clubDelChat, currentUser.uid, 'moderadorFijaMensajes').ok
    );
  };
  const alternarFijado = async (msg: ChatMessage) => {
    if (!activeRoomId || !currentUser) return;
    const yaEsta = fijados.some((f) => f.messageId === msg.id);
    setFijadosCargando(true);
    const r = yaEsta
      ? await desfijarMensaje(activeRoomId, msg.id)
      : await fijarMensaje({
          chatId: activeRoomId,
          msg,
          uid: currentUser.uid,
          nombre: nombreDeUsuario(currentUser.uid),
        });
    setFijadosCargando(false);
    if (!r.ok) {
      setActionFeedback(r.error ?? 'No se pudo cambiar el mensaje fijado.');
      return;
    }
    setActionFeedback(yaEsta ? 'Mensaje quitado de los fijados.' : 'Mensaje fijado.');
  };

  /**
   * Salta al mensaje original de un fijado.
   *
   * La conversación carga por tramos. Si el fijado es antiguo, hay
   * que pulsar "Cargar mensajes anteriores" hasta que esté en el DOM;
   * no se finge que se ha borrado. Cuando aparece, se hace el scroll
   * dos veces porque las imágenes y adjuntos cambian la altura.
   */
  const irAMensaje = (messageId: string) => {
    setPanelFijados(false);
    setMensajeResaltado(messageId);
    const buscar = () => {
      const el = document.getElementById(`msg-${messageId}`);
      if (!el) return false;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    };
    if (!buscar()) {
      setActionFeedback('Ese mensaje es antiguo: carga los mensajes anteriores para llegar a él.');
      return;
    }
    // Second pass: images and attachments change the height.
    setTimeout(buscar, 350);
    setTimeout(() => setMensajeResaltado(null), 2600);
  };

  /** Nombre del usuario para las etiquetas. */
  const nombreDeUsuario = (uid: string) => {
    const u = usersList.find((x) => x.uid === uid);
    return u?.displayName || u?.username || 'Alguien';
  };
  // ── Apariencia del chat ─────────────────────────
  //
  // `borradorApariencia` a null = panel cerrado. Mientras está
  // abierto, la conversación pinta el borrador: vista previa
  // en vivo sin recargar. Guardar lo escribe en
  // `userPrivate/{uid}.chatApariencia` (solo la ve quien la pone) y
  // cancelar lo tira sin tocar nada.
  const [panelApariencia, setPanelApariencia] = useState(false);
  const [borradorApariencia, setBorradorApariencia] = useState<AparienciaChat | null>(null);
  const [guardandoApariencia, setGuardandoApariencia] = useState(false);
  const [errorApariencia, setErrorApariencia] = useState<string | null>(null);
  const [subiendoFondoChat, setSubiendoFondoChat] = useState(false);
  // Fondo guardado antes de subir otro: al guardar se borra el
  // anterior para no dejar huérfanos en Storage.
  const fondoPrevioRef = useRef<string | null>(null);

  // ── Fondo PROPIO de esta conversación ──────────────────
  //
  // Cada chat tiene su fondo. Se guarda en
  // `chats/{chatId}/prefs/{uid}` (un documento por chat y
  // persona) y NO en el perfil: en el perfil (`chatApariencia`)
  // solo había UN fondo para toda la cuenta, así que poner una
  // imagen en el club cambiaba también la de los privados.
  //
  //   undefined → este chat nunca tuvo fondo propio: se usa el
  //                general de antes (el `chatApariencia.fondo`).
  //   null      → este chat, sin fondo.
  //   un objeto → el fondo de este chat.
  const [fondoDelChat, setFondoDelChat] = useState<FondoChat | null | undefined>(undefined);

  useEffect(() => {
    if (!activeRoomId || !currentUser) {
      setFondoDelChat(undefined);
      return;
    }
    return subscribeChatPrefs(activeRoomId, currentUser.uid, (prefs) => {
      setFondoDelChat('fondo' in prefs ? prefs.fondo : undefined);
    });
  }, [activeRoomId, currentUser?.uid]);

  const aparienciaGuardada = useMemo(
    () => sujetoConFondo(sujetarApariencia(currentUser?.chatApariencia), fondoDelChat),
    [currentUser, fondoDelChat],
  );
  const sinMovimiento = (borradorApariencia ?? aparienciaGuardada).reducirMovimiento === true;

  // En un club, el panel edita la apariencia DEL CANAL (la que
  // ve todo el club), no la personal de quien abre: si no, al
  // guardar se pisaría con los valores de una sola cuenta.
  const abrirPanelApariencia = () => {
    const base = aparienciaCompartida ?? aparienciaGuardada;
    fondoPrevioRef.current = base.fondo?.url ?? null;
    setErrorApariencia(null);
    setBorradorApariencia({ ...base });
    setPanelApariencia(true);
  };

  const cerrarPanelApariencia = () => {
    setPanelApariencia(false);
    setBorradorApariencia(null);
    setErrorApariencia(null);
  };

  const restablecerApariencia = () => setBorradorApariencia({ ...APARIENCIA_POR_DEFECTO });

  const subirFondoChat = async (file: File) => {
    if (!currentUser) return;
    setSubiendoFondoChat(true);
    setErrorApariencia(null);
    try {
      const url = await uploadCommunityImage(file, currentUser.uid);
      setBorradorApariencia((b) => {
        const base = b ?? aparienciaGuardada;
        return { ...base, fondo: { ...(base.fondo ?? {}), preset: undefined, url } };
      });
    } catch (e: unknown) {
      setErrorApariencia(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendoFondoChat(false);
    }
  };

  const quitarFondoChat = () =>
    setBorradorApariencia((b) => {
      const base = b ?? aparienciaGuardada;
      if (!base.fondo?.url) return base;
      const { url: _quitada, ...resto } = base.fondo;
      void _quitada;
      return { ...base, fondo: Object.keys(resto).length > 0 ? resto : null };
    });

  const guardarApariencia = async () => {
    if (!currentUser || !borradorApariencia || guardandoApariencia) return;
    setGuardandoApariencia(true);
    setErrorApariencia(null);
    try {
      const limpio = aparienciaAGuardar(borradorApariencia);

      // ¿Estamos personalizando el club o tu propio chat?
      //
      // En un club (donde el panel solo lo abre el equipo) lo que
      // se guarda es la apariencia DEL CANAL, que ve todo el
      // club. En un privado o un grupo es tu apariencia, y su
      // FONDO es solo de esa conversación.
      //
      // Esto es lo que arregla que poner una imagen en el club
      // cambiara también el fondo de los privados: antes TODO se
      // guardaba en la apariencia personal (`userPrivate`), que es
      // un único documento para toda la cuenta.
      const esClub =
        esChatClub &&
        (soyDuenoDelClub || soyModDelClub) &&
        !!canalActivoId &&
        !!clubDelChat;

      if (esClub) {
        // ── Club: solo el canal ──────────────────────
        // El perfil NO se toca: si se escribiera, el fondo del
        // club se plantaría en los chats privados de todo el
        // mundo, que es justo lo que pasaba.
        const r = await actualizarCanal(clubDelChat!.id, canalActivoId!, {
          chatApariencia: limpio,
          chatFondo: limpio.fondo ?? null,
        });
        // Sin esto, un rechazo del servidor (reglas sin
        // desplegar) pasaría desapercibido y el club seguiría con
        // su fondo.
        if (!r.ok) {
          throw new Error(`el club no guardó la apariencia: ${r.error ?? 'error'}`);
        }
        // `updateDoc` puede resolver desde la caché local aunque
        // el servidor lo rechace: entonces el cambio se ve un rato
        // y al recargar desaparece. Se relee del servidor para
        // saber la verdad antes de cerrar el panel.
        try {
          const comp = await getDocFromServer(
            doc(db, 'clubs', clubDelChat!.id, 'channels', canalActivoId!),
          );
          const guardado = (comp.data() as { chatApariencia?: unknown } | undefined)
            ?.chatApariencia;
          if (!guardado) {
            throw new Error(
              'el servidor no guardó la apariencia del club (revisa las reglas de Firestore)',
            );
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.message.startsWith('el servidor no guardó')) throw e;
          throw new Error(
            `no se pudo verificar la apariencia del club: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      } else {
        // ── Chat propio: perfil + fondo de ESTE chat ───
        // El perfil guarda el resto (colores, forma, tipografía),
        // que es personal y vale para todos tus chats privados.
        // El FONDO no: va en `chats/{chatId}/prefs/{uid}`, que
        // es de esta conversación y solo de esta.
        const { fondo: _fueraDelPerfil, ...perfil } = limpio;
        try {
          await updateProfileData({ chatApariencia: perfil as AparienciaChat });
        } catch (e: unknown) {
          throw new Error(
            `escritura denegada: ${e instanceof Error ? e.message : String(e)}`,
          );
        }

        // El fondo, en su documento. `null` es «este chat, sin
        // fondo»: se guarda explícitamente para que no salga el
        // fondo general de antes.
        if (activeRoomId) {
          try {
            await saveFondoChat(currentUser.uid, activeRoomId, limpio.fondo ?? null);
          } catch (e: unknown) {
            throw new Error(
              `no se pudo guardar el fondo de esta conversación: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
          setFondoDelChat(limpio.fondo ?? null);
        }

        // `setDoc` resuelve en la caché local: si el servidor
        // rechaza la escritura (reglas sin desplegar), el cambio
        // se revierte en silencio y el panel se cerraría en falso.
        // Se comprueba contra el servidor antes de cerrar.
        let enServidor;
        try {
          const comp = await getDocFromServer(userPrivateRef(currentUser.uid));
          enServidor = sujetarApariencia(
            (comp.data() as { chatApariencia?: unknown } | undefined)?.chatApariencia,
          );
        } catch (e: unknown) {
          throw new Error(
            `verificación denegada: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
        // Basta con que lo enviado esté tal cual en el servidor:
        // al leer, `sujetar` expande valores por defecto que lo
        // enviado no trae, así que la igualdad total nunca cuadra.
        const coincide = (esperado: unknown, real: unknown): boolean => {
          if (esperado === null || typeof esperado !== 'object') return esperado === real;
          if (Array.isArray(esperado)) {
            return (
              Array.isArray(real) &&
              esperado.length === (real as unknown[]).length &&
              esperado.every((v, i) => coincide(v, (real as unknown[])[i]))
            );
          }
          if (real === null || typeof real !== 'object' || Array.isArray(real)) return false;
          const e = esperado as Record<string, unknown>;
          const r = real as Record<string, unknown>;
          return Object.keys(e).every((k) => k in r && coincide(e[k], r[k]));
        };
        if (!coincide(perfil, enServidor)) {
          throw new Error('el servidor no devolvió lo guardado');
        }
      }

      deleteReplacedImage(fondoPrevioRef.current ?? '', limpio.fondo?.url ?? '');
      setPanelApariencia(false);
      setBorradorApariencia(null);
    } catch (e: unknown) {
      console.error('[Chats] No se pudo guardar la apariencia:', e);
      setErrorApariencia(e instanceof Error ? e.message : 'No se pudo guardar la apariencia.');
    } finally {
      setGuardandoApariencia(false);
    }
  };
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  // El menú de la lista de conversaciones se cierra al pulsar
  // fuera, y también con la tecla Escape.
  useEffect(() => {
    if (!openMenuFor) return;
    const fuera = (e: MouseEvent) => {
      const nodo = e.target as HTMLElement | null;
      // Si el clic cayó dentro del propio menú, no se cierra:
      // si no, la acción del botón no se ejecutaría.
      if (nodo?.closest?.('[data-menu-conversacion]')) return;
      setOpenMenuFor(null);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuFor(null);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [openMenuFor]);
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
  // El botón del menú abierto: con su posición se coloca el
  // menú en la VENTANA (ver `posMenuMsg`), para que no se
  // recorte contra el chat ni se salga de la pantalla.
  const [menuMsgBoton, setMenuMsgBoton] = useState<HTMLElement | null>(null);
  const [posMenuMsg, setPosMenuMsg] = useState<{ left: number; top: number } | null>(null);

  // Coloca el menú al abrirlo y lo recoloca al cambiar el
  // tamaño de la ventana. El ancho es el mismo que el del
  // menu (w-48 = 12rem = 192px), para poder ajustarlo.
  const colocarMenuMsg = useCallback(() => {
    const boton = menuMsgBoton;
    if (!boton) return;
    const r = boton.getBoundingClientRect();
    const ANCHO = 192;
    const ALTO_MAX = 320;
    const MARGEN = 8;
    // A la derecha del botón, pero sin salirse de la ventana.
    let left = r.right - ANCHO;
    if (left < MARGEN) left = MARGEN;
    if (left + ANCHO > window.innerWidth - MARGEN) {
      left = window.innerWidth - ANCHO - MARGEN;
    }
    if (left < MARGEN) left = MARGEN;
    // Debajo del botón; si no cabe, encima.
    const alto = Math.min(ALTO_MAX, window.innerHeight - r.bottom - MARGEN * 2);
    const top = alto < 120 && r.top > ALTO_MAX ? r.top - ALTO_MAX : r.bottom + 6;
    setPosMenuMsg({ left, top: Math.max(MARGEN, top) });
  }, [menuMsgBoton]);

  // El menú se cierra al pulsar en cualquier otro sitio: en el
  // chat, en otro mensaje o fuera de la ventana.
  //
  // El menú vive en un portal, así que no se puede mirar si el
  // clic cayó dentro mirando el árbol del chat: se marca con
  // `data-menu-mensaje` y se busca en el documento.
  useEffect(() => {
    if (!menuMsgId) return;
    const fuera = (e: MouseEvent) => {
      const nodo = e.target as Node;
      // El botón que lo abrió.
      if (menuMsgBoton?.contains(nodo)) return;
      // El propio menú.
      const propio = document.querySelector('[data-menu-mensaje]');
      if (propio?.contains(nodo)) return;
      setMenuMsgId(null);
      setMenuMsgBoton(null);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuMsgId(null);
        setMenuMsgBoton(null);
      }
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [menuMsgId, menuMsgBoton]);

  useEffect(() => {
    if (!menuMsgId) return;
    colocarMenuMsg();
    const alCambiar = () => colocarMenuMsg();
    window.addEventListener('resize', alCambiar);
    window.addEventListener('scroll', alCambiar, true);
    return () => {
      window.removeEventListener('resize', alCambiar);
      window.removeEventListener('scroll', alCambiar, true);
    };
  }, [menuMsgId, colocarMenuMsg]);

  const [borrandoMsg, setBorrandoMsg] = useState<ChatMessage | null>(null);
  const [borrandoBusy, setBorrandoBusy] = useState(false);
  const [borrandoError, setBorrandoError] = useState<string | null>(null);

  // Citar y editar. Son excluyentes: responder cancela la edición y
  // editar cancela la respuesta, porque la caja es una sola.
  const [citaA, setCitaA] = useState<ChatMessage | null>(null);
  const [editando, setEditando] = useState<ChatMessage | null>(null);
  const [editandoBusy, setEditandoBusy] = useState(false);

  // Borrador de la encuesta que viaja con el próximo mensaje.
  // `null` = panel cerrado (sin encuesta). Se edita con el mismo
  // formulario que en los hilos (`PollComposer`) y al enviar se
  // normaliza con `normalizarPoll`, que es quien valida.
  const [encuestaBorrador, setEncuestaBorrador] = useState<PollDraft | null>(null);
  const [errorEncuesta, setErrorEncuesta] = useState<string | undefined>(undefined);

  // ── Tier lists en el chat ─────────────────────────────
  //
  // `tierAdjunta` viaja con el próximo mensaje (como la
  // encuesta). El selector ofrece crear una nueva o elegir
  // una propia; el visor y el editor son modales que no
  // desmontan la conversación.
  const [tierAdjunta, setTierAdjunta] = useState<TierListRef | null>(null);
  const [selectorTierAbierto, setSelectorTierAbierto] = useState(false);
  const [misTiers, setMisTiers] = useState<TierList[]>([]);
  const [editorTierChat, setEditorTierChat] = useState<{
    modo: 'nuevo' | 'editar';
    initial?: Partial<EditorDraft>;
    originId?: string;
    originTitle?: string;
    tierListId?: string;
    clubId?: string;
    clubName?: string;
  } | null>(null);
  const [visorTierId, setVisorTierId] = useState<string | null>(null);

  // Mis tier lists, solo mientras el selector está abierto:
  // fuera de él no hace falta ninguna suscripción.
  useEffect(() => {
    if (!selectorTierAbierto || !currentUser) {
      setMisTiers([]);
      return;
    }
    return subscribeMisTierLists(
      currentUser.uid,
      (tiers) => setMisTiers(tiers),
      () => setMisTiers([]),
    );
  }, [selectorTierAbierto, currentUser]);

  // Solo quien creó el grupo puede añadir o expulsar miembros.
  const isGroupOwner =
    !!activeRoom && activeRoom.type === 'group' && activeRoom.ownerId === currentUser?.uid;

  // ── Clubes ────────────────────────────────────────────
  //
  // El chat abierto es de un club cuando su `type` es 'club'.
  // A partir de ahí todo lo demás sale del contexto: la
  // ficha, los roles y los permisos.
  const esChatClub = activeRoom?.type === 'club';

  const misClubes = useClubs().misClubes;
  const {
    canalesPorClub,
    canalesLoading,
    asegurarGeneral,
    eliminarCanal,
    moverCanal,
    setClubActivo,
  } = useClubs();

  // Solicitudes de acceso pendientes de los clubes que modero.
  // Se leen del contexto de clubes, que ya las tiene.
  const solicitudesDeClubes = useClubs().solicitudesPendientes;
  const cargandoClubes = useClubs().loading;

  // La ficha del club cuyo chat está abierto, si lo está.
  //
  // Se busca por `slug` (todos los chats de canal lo llevan)
  // y no por `chatId`: con canales, un club tiene N chats y el
  // histórico es solo uno más.
  const clubDelChat = useMemo(() => {
    if (!esChatClub || !activeRoom) return null;
    if (activeRoom.slug) {
      const porSlug = misClubes.find((c) => c.slug === activeRoom.slug);
      if (porSlug) return porSlug;
    }
    return misClubes.find((c) => c.chatId === activeRoom.id) ?? null;
  }, [esChatClub, misClubes, activeRoom]);

  // El contexto escucha únicamente los canales del club que está
  // abierto, no los de todos los clubes del usuario.
  useEffect(() => {
    setClubActivo(clubDelChat);
    return () => setClubActivo(null);
  }, [clubDelChat?.id, setClubActivo]);

  // Los permisos de club no tienen nada que ver con el rol
  // global: un moderador de club no es moderador de la web.
  const soyDuenoDelClub = !!clubDelChat && clubDelChat.ownerId === currentUser?.uid;
  const soyModDelClub =
    !!clubDelChat &&
    (clubDelChat.members[currentUser?.uid ?? '']?.role === 'moderator' ||
      soyDuenoDelClub);

  // Si un miembro del club está silenciado, no puede enviar.
  const estoySilenciado = (() => {
    if (!clubDelChat || !currentUser) return false;
    const hasta = clubDelChat.members[currentUser.uid]?.mutedUntil;
    return !!hasta && Date.parse(hasta) > Date.now();
  })();

  // ── Sanción vigente en ESTE club ────────────────────
  //
  // Un solo documento (`clubs/{club}/sancion/{uid}`), el mismo
  // que leen las reglas, así que lo que se ve aquí y lo que
  // bloquea el envío en el servidor no pueden discrepar.
  //
  // Solo se escucha con el chat de club abierto. En privado no
  // se monta: no hay sanciones ahí.
  const [miSancion, setMiSancion] = useState<ClubSancion | null>(null);
  useEffect(() => {
    if (!esChatClub || !clubDelChat) {
      setMiSancion(null);
      return;
    }
    return subscribeSancionPropia(clubDelChat.id, currentUser?.uid ?? null, (s) => {
      // Una sanción caducada deja de avisar: se limpia sola, sin
      // que nadie la levante a mano.
      setMiSancion(s && estadoDe(s) === 'activa' ? s : null);
    });
  }, [esChatClub, clubDelChat?.id, currentUser?.uid]);

  /** Mi sanción vigente (silencio o baneo) en el club abierto. */
  const sancionVigente = esChatClub ? miSancion : null;
  const bloqueadoPorSancion = sancionVigente !== null;

  // ── Abrir el diálogo de sanción desde el menú del mensaje ──
  //
  // Se comprueba el permiso ANTES de abrir: si no se puede, se
  // avisa en vez de mostrar un diálogo que no iba a poder
  // confirmar.
  const [sancionPara, setSancionPara] = useState<{
    uid: string;
    nombre: string;
    tipo: 'silencio' | 'baneo';
  } | null>(null);
  const [sancionGuardando, setSancionGuardando] = useState(false);
  const [sancionError, setSancionError] = useState<string | null>(null);

  const abrirSancion = (uid: string, tipo: 'silencio' | 'baneo') => {
    setMenuMsgId(null);
    if (!clubDelChat || !currentUser) return;
    const nombre = usersList.find((u) => u.uid === uid);
    const per = puedeSancionar(
      clubDelChat,
      currentUser.uid,
      uid,
      tipo,
      tipo === 'baneo',
    );
    if (!per.ok) {
      setActionFeedback(per.motivo ?? 'No tienes permiso para esa sanción.');
      return;
    }
    setSancionError(null);
    setSancionPara({
      uid,
      nombre: nombre?.displayName || nombre?.username || 'Este miembro',
      tipo,
    });
  };

  // Si el usuario ya no es miembro del club, el chat no debe
  // seguir abierto. Sin esto, al ser expulsado con la pestaña
  // abierta la conversación se quedaba en pantalla aunque las
  // reglas ya denegaban cualquier lectura.
  useEffect(() => {
    if (!esChatClub) return;
    if (clubDelChat) return;

    // El chat de club existe pero no está entre «mis clubes»:
    // o me expulsaron, o salí, o no soy miembro. Se cierra.
    setActiveRoomId(null);
    setClubDetalle(null);
  }, [esChatClub, clubDelChat, setActiveRoomId]);

  // El detalle abierto tiene que seguir siendo un club al que
  // pertenezco: si dejo de ser miembro, se cierra.
  useEffect(() => {
    if (!clubDetalle) return;
    if (misClubes.some((c) => c.id === clubDetalle)) return;
    setClubDetalle(null);
  }, [clubDetalle, misClubes]);

  const clubActivoEnPanel = clubDetalle
    ? (misClubes.find((c) => c.id === clubDetalle) ?? null)
    : null;

  // ── Canales del club abierto ───────────────────────
  //
  // El canal activo es `general` por defecto. Los restringidos
  // (`mods`) solo los ve el equipo: `canalesVisibles` los quita
  // a los miembros normales (las reglas hacen lo propio en el
  // servidor).
  const [canalActivoId, setCanalActivoId] = useState<string>('general');
  // Cajón de canales en móvil (en escritorio es columna fija).
  const [canalesAbiertos, setCanalesAbiertos] = useState(false);
  // Modal de crear/editar canal: null = cerrado.
  const [modalCanal, setModalCanal] = useState<{ channel: ClubChannel | null } | null>(null);

  const canalesVisiblesLista = useMemo(
    () =>
      clubDelChat
        ? canalesVisibles(
            canalesPorClub[clubDelChat.id] ?? [],
            clubDelChat,
            currentUser?.uid ?? null,
          )
        : [],
    [clubDelChat, canalesPorClub, currentUser],
  );

  const canalActivo = useMemo(
    () =>
      canalesVisiblesLista.find((c) => c.id === canalActivoId) ??
      canalesVisiblesLista.find((c) => c.id === 'general') ??
      canalesVisiblesLista[0] ??
      null,
    [canalesVisiblesLista, canalActivoId],
  );

  // En un chat de club manda la apariencia del CANAL: la puso el
  // equipo desde «Apariencia» y la ven TODOS los miembros, no el
  // marco personal de cada uno. Si el canal no tiene, cada uno ve
  // la suya.
  const aparienciaCompartida =
    esChatClub && canalActivo?.chatApariencia ? canalActivo.chatApariencia : null;
  const aparienciaVista = useMemo(
    () =>
      resolverApariencia(
        borradorApariencia ?? aparienciaGuardada,
        aparienciaCompartida,
        fondoDelChat,
      ),
    [borradorApariencia, aparienciaGuardada, aparienciaCompartida, fondoDelChat],
  );

  const puedeGestionarCanales = !!clubDelChat && (soyDuenoDelClub || soyModDelClub);
  const clubConCanales = esChatClub && clubDelChat != null;

  // Migración del `general` en clubes anteriores a los
  // canales: reutiliza el chat histórico para no perder
  // mensajes. Es idempotente (si ya existe, no hace nada).
  useEffect(() => {
    if (!clubDelChat || canalesLoading) return;
    if ((canalesPorClub[clubDelChat.id] ?? []).length > 0) return;
    void asegurarGeneral(clubDelChat);
  }, [clubDelChat, canalesPorClub, canalesLoading, asegurarGeneral]);

  // Si el canal activo desaparece (borrado) o deja de ser
  // visible, se vuelve al `general` (o al primero).
  useEffect(() => {
    if (!clubDelChat) return;
    setCanalActivoId((prev) => {
      if (canalesVisiblesLista.some((c) => c.id === prev)) return prev;
      return 'general';
    });
  }, [clubDelChat, canalesVisiblesLista]);

  // El canal activo manda en la conversación: al elegir (o al
  // replegarse por borrado) se abre su chat.
  useEffect(() => {
    if (!clubDelChat || !canalActivo) return;
    if (activeRoomId !== canalActivo.chatId) setActiveRoomId(canalActivo.chatId);
  }, [clubDelChat, canalActivo, activeRoomId, setActiveRoomId]);

  /** Abrir un canal: selecciona y enseña sus mensajes. */
  const elegirCanal = useCallback(
    (canal: ClubChannel) => {
      setCanalActivoId(canal.id);
      setActiveRoomId(canal.chatId);
      setCanalesAbiertos(false);
    },
    [setActiveRoomId],
  );

  // Los clubes NO se muestran en la vista de privados: para
  // eso está la pestaña «Mis clubes». Si aparecieran en las
  // dos, el mismo chat estaría duplicado y la lista de
  // conversaciones perdería el sentido que tiene ahora.
  const chatsPrivados = useMemo(
    () => rooms.filter((r) => r.type !== 'club'),
    [rooms],
  );

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

    messagesEndRef.current?.scrollIntoView({
      behavior: sinMovimiento ? 'instant' : 'smooth',
      block: 'end',
    });
  }, [sinMovimiento]);

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
    setEncuestaBorrador(null);
    setErrorEncuesta(undefined);
    setCodeError(null);
    // La tier list adjunta también es por conversación: si no,
    // se enviaría al chat equivocado al cambiar rápido.
    setTierAdjunta(null);
    setSelectorTierAbierto(false);
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
    if (!activeRoomId) return [];
    const vista = messages[activeRoomId] ?? [];
    // `chatId` es obligatorio para poder consultar las reacciones con
    // las reglas: la escucha se filtra por chat y la regla comprueba
    // que quien lee sea miembro. Se usa el chat abierto y no el campo
    // del mensaje para que la consulta y la ruta del mensaje coincidan.
    return vista.slice(-60).map((m) => ({
      targetType: 'chat_message' as const,
      targetId: m.id,
      chatId: activeRoomId,
    }));
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
  /**
   * Guarda desde el editor de tier lists del chat (crear o editar).
   *
   * El club del chat abierto decide la visibilidad por defecto;
   * el editor la enseña y el autor puede cambiarla.
   */
  const guardarTierListChat = async (
    datos: EditorDraft & { originId?: string; originTitle?: string; clubId?: string },
  ): Promise<TierResult> => {
    if (!currentUser) return { ok: false, error: 'Debes iniciar sesión.' };
    if (editorTierChat?.modo === 'editar' && editorTierChat.tierListId) {
      return guardarEdicionTierList(editorTierChat.tierListId, datos);
    }
    return crearTierList(currentUser, {
      ...datos,
      originId: editorTierChat?.originId,
      originTitle: editorTierChat?.originTitle,
      clubId: editorTierChat?.clubId,
    });
  };

  const trasGuardarTierChat = async (tierListId: string) => {
    // Solo lo recién CREADO queda adjunto al mensaje siguiente.
    // Al editar (desde el visor) no se toca lo adjuntado: si no,
    // guardar cambios engancharía la tier list al próximo envío
    // sin haberlo pedido.
    if (editorTierChat?.modo !== 'nuevo') {
      setSelectorTierAbierto(false);
      return;
    }
    try {
      const tier = await getTierList(tierListId);
      if (tier) setTierAdjunta({ tierListId, title: tier.title });
    } catch (e) {
      console.error('[Chats] No se pudo leer la tier list creada:', e);
    }
    setSelectorTierAbierto(false);
  };

  const enviar = (ubicacion?: LocationAttachment) => {
    // Sanción vigente en este club: no se intenta ni intentar
    // dejar el texto a medias. Esto es solo la barrera de la
    // interfaz; la de verdad está en las reglas, que rechazan el
    // mensaje aunque se llame a esta función a mano.
    if (bloqueadoPorSancion) {
      setActionFeedback(
        sancionVigente?.tipo === 'baneo'
          ? 'No puedes escribir en este club mientras dure la sanción.'
          : 'Estás silenciado en este club.',
      );
      return;
    }
    const sitio = ubicacion ?? null;
    const gif = ubicacion ? null : chatGif;
    const foto = ubicacion ? null : chatImageUrl;

    // La encuesta del borrador, si lo hay. Un panel abierto pero
    // vacío no es una encuesta: se ignora y el texto se manda
    // solo. A medio escribir sí bloquea el envío, con el motivo
    // en el propio panel, para no mandar un texto huérfano
    // mientras la encuesta se queda a medias.
    let encuesta: Poll | null = null;
    if (!ubicacion && encuestaBorrador && borradorConContenido(encuestaBorrador)) {
      try {
        encuesta = normalizarPoll(draftANewPoll(encuestaBorrador));
      } catch (e) {
        setErrorEncuesta(e instanceof Error ? e.message : 'La encuesta no es válida.');
        return;
      }
    }

    // Texto, GIF, foto, ubicación, encuesta o tier list: un
    // mensaje sin texto es válido si lleva cualquiera de los
    // adjuntos, y uno sin nada no se envía.
    const tier = !ubicacion ? tierAdjunta : null;
    const hayAlgo =
      Boolean(inputText.trim()) ||
      Boolean(gif) ||
      Boolean(foto) ||
      Boolean(sitio) ||
      encuesta !== null ||
      tier !== null;

    if (!activeRoomId || !hayAlgo) return;

    // La cita viaja dentro del mensaje nuevo. Se construye aquí, al
    // enviar, con lo que el citado dice AHORA: si se construyera al
    // pulsar "Responder" y el citado se editara después, la cita
    // llevaría el texto viejo.
    const respuesta = citaA
      ? {
          messageId: citaA.id,
          // El nombre guardado en el MENSAJE, no el que se ve ahora:
          // la regla compara la cita con el documento real. Si la
          // persona cambió de nombre después, la cita conserva el
          // que tenía el mensaje citado.
          senderName: citaA.senderName ?? '',
          texto: textoParaCita(citaA),
        }
      : null;

    sendMessage(activeRoomId, inputText, gif ?? undefined, {
      ...(foto ? { imageUrl: foto } : {}),
      ...(sitio ? { location: sitio } : {}),
    }, respuesta, encuesta, tier);

    setInputText('');
    setCitaA(null);
    // La encuesta sí se manda con el mensaje: el borrador se vacía
    // para no repetirla en el siguiente.
    if (encuesta) {
      setEncuestaBorrador(null);
      setErrorEncuesta(undefined);
    }
    // Igual con la tier list adjunta: una vez enviada, fuera.
    if (tier) {
      setTierAdjunta(null);
      setSelectorTierAbierto(false);
    }

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
    confirmarEnvio();
  };

  /** Enviar con el botón o con Enter (sin Mayús). */
  const confirmarEnvio = () => {
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
  const filteredRooms = chatsPrivados.filter((r) => {
    if (filterType === 'direct') return r.type === 'direct';
    if (filterType === 'group') return r.type === 'group';
    return true;
  });

  // Sin los ocultados solo para mí: el documento sigue intacto
  // para los demás, aquí simplemente no se pintan.
  const activeMessages = (
    activeRoomId ? messages[activeRoomId] || [] : []
  ).filter((m) => !hiddenIds.has(m.id));

  const cargarAnteriores = async () => {
    if (!activeRoomId) return;
    const lista = listaRef.current;
    const altoAntes = lista?.scrollHeight ?? 0;
    const topAntes = lista?.scrollTop ?? 0;

    await loadOlderMessages(activeRoomId);

    // Al insertar arriba, el navegador conserva `scrollTop` y el
    // mensaje que se estaba leyendo saltaría. Se recoloca el mismo
    // punto visual.
    requestAnimationFrame(() => {
      if (!lista) return;
      lista.scrollTop = lista.scrollHeight - altoAntes + topAntes;
    });
  };

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
      ? nicknames[activeRoom.id] || activeOtherParty.displayName || activeOtherParty.username
      : activeRoom
        ? nicknames[activeRoom.id] || activeRoom.name
        : '';

  const estadoActivo = activeRoom?.type === 'direct'
    ? estadoPresenciaDe(activeOtherParty?.uid)
    : null;

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

  // ── Invitar a un miembro (solo el dueño del grupo) ───
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
        success: `Invitación enviada a ${target.displayName || target.username}. Debe aceptarla para entrar.`,
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
      poll: undefined,
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

  // Genera el código de invitación de un grupo antiguo que no
  // lo tiene. Al crearse, el listener refresca `activeRoom` y
  // la barra de "Generar código" se cambia sola por la normal
  // con el código y el botón de copiar.
  const handleGenerateCode = async () => {
    if (!activeRoom || !currentUser || generatingCode) return;
    setGeneratingCode(true);
    setCodeError(null);
    const result = await ensureGroupCode(activeRoom, currentUser);
    setGeneratingCode(false);
    if (!result.ok) setCodeError(result.error);
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
    <div className="-mx-4 -my-6 mx-auto flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-[1500px] flex-col gap-3 px-2 sm:mx-auto sm:my-0 sm:h-[calc(100dvh-7rem)] sm:min-h-[480px] sm:gap-3 sm:px-4">
      {/* Cabecera de la sección: identidad contenida, sin saturar.
          Degradado oscuro con un velo violeta/azul muy tenue;
          el color fuerte queda solo en el icono y el primario. */}
      <div className={`${activeRoomId && tabChats !== 'descubrir' ? 'hidden lg:flex' : 'flex'} flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#14121f] via-[#0e0e17] to-[#0b1322] p-3 sm:p-4 shadow-[0_12px_36px_-18px_rgba(0,0,0,0.8)]`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-600/25 to-sky-500/15 text-violet-300 shadow-inner">
            <MessageCircle size={19} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-bold tracking-tight text-white flex items-center gap-2">
              <span className="truncate">Mensajería Privada &amp; Clubes</span>
              <span className="flex-shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Cifrado
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400 break-words">
              Tu ID único para recibir mensajes: <strong className="text-violet-300/90 font-mono break-all">{currentUser.chatId}</strong>
              {misClubes.length > 0 && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => {
                      setTabChats('clubes');
                      setActiveRoomId(null);
                    }}
                    className="font-bold text-violet-300 hover:text-violet-200"
                  >
                    {misClubes.length} {misClubes.length === 1 ? 'club' : 'clubes'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Acciones principales: misma altura, mismo radio,
            mismo borde. El primario lleva el degradado; los
            secundarios, superficie tenue. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddContact(true)}
            aria-label="Nuevo contacto por ID"
            title="Nuevo contacto por ID"
            className="chat-boton chat-foco flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-zinc-200 hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-white transition-all shadow-sm"
          >
            <UserPlus size={14} className="text-violet-300/90" />
            <span className="hidden min-[420px]:inline">Nuevo Contacto por ID</span>
          </button>

          <button
            onClick={() => {
              setTabChats('descubrir');
              setActiveRoomId(null);
            }}
            aria-label="Descubrir clubes"
            title="Descubrir clubes"
            className="chat-boton chat-foco flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-zinc-200 hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-white transition-all shadow-sm"
          >
            <Compass size={14} className="text-violet-300/90" />
            <span className="hidden min-[420px]:inline">Descubrir clubes</span>
          </button>

          <button
            onClick={() => {
              // Se borra el aviso anterior: si hace un momento
              // falló "Unirse a grupo", al abrir este modal no tiene
              // que seguir saliendo el error de aquello.
              setActionFeedback(null);
              setShowCreateGroup(true);
            }}
            aria-label="Crear grupo"
            title="Crear grupo"
            className="chat-boton chat-foco flex h-9 items-center gap-1.5 rounded-xl border border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 text-xs font-bold text-white hover:brightness-110 transition-all shadow-md shadow-violet-950/40"
          >
            <Users size={14} />
            <span className="hidden min-[420px]:inline">Crear Grupo</span>
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

          A partir de lg hay dos pistas proporcionales (4/8, y
          3/9 en 2xl, como las doce columnas de antes) y cada
          panel cae en la suya por orden.

          Desde la barra plegable, esas pistas "fr" se animan:
          al contraer, la primera pasa a 0fr con transición y
          el chat ocupa todo el ancho. El "minmax(0, …)" es lo
          que deja que la pista llegue a cero sin que el
          contenido la sujete abierta. */}
      <div
        className={`chat-superficie grid min-h-0 flex-1 grid-cols-1 grid-rows-1 rounded-2xl border shadow-[0_24px_64px_-24px_rgba(0,0,0,0.85)] overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out ${
          sidebarCollapsed
            ? 'lg:grid-cols-[minmax(0,0fr)_minmax(0,8fr)] 2xl:grid-cols-[minmax(0,0fr)_minmax(0,9fr)]'
            : 'lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] 2xl:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]'
        }`}
      >
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
          } lg:flex min-h-0 min-w-0 border-r border-white/[0.06] flex-col chat-lateral relative overflow-hidden transition-opacity duration-300 ${
            sidebarCollapsed ? 'lg:pointer-events-none lg:opacity-0' : 'lg:opacity-100'
          }`}
        >
          {/* Botón para contraer la barra. Flota en el borde
              derecho del panel; solo en escritorio, porque en
              móvil la lista ya ocupa todo o la oculta el chat
              abierto (con su botón de volver). */}
          <button
            type="button"
            onClick={toggleSidebar}
            title="Contraer la lista"
            aria-label="Contraer la lista de conversaciones"
            tabIndex={sidebarCollapsed ? -1 : 0}
            className={`absolute right-2 top-1/2 z-30 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg backdrop-blur transition-all hover:border-violet-500/60 hover:text-violet-300 lg:flex ${
              sidebarCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <PanelLeftClose size={14} />
          </button>
          {/* Header & Filter Tabs */}
          <div className="p-3 border-b border-white/[0.06] space-y-2.5 bg-black/20">
            {/* Las tres vistas de la sección. Van aquí, y no en
                la barra de arriba, a propósito: los clubes son
                parte de «Chats», no una sección nueva de la web.
                La tabla de búsqueda de abajo se mantiene dentro
                de cada vista, no de forma global. */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/[0.06] text-[11px] font-semibold" role="tablist" aria-label="Vistas del chat">
              <button
                onClick={() => {
                  setTabChats('privados');
                  setActiveRoomId(null);
                }}
                role="tab"
                aria-selected={tabChats === 'privados'}
                className={`chat-boton flex-1 rounded-lg py-2 transition-all ${
                  tabChats === 'privados'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <MessageCircle size={12} />
                  <span>Privados</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setTabChats('clubes');
                  setActiveRoomId(null);
                }}
                role="tab"
                aria-selected={tabChats === 'clubes'}
                className={`chat-boton flex-1 rounded-lg py-2 transition-all ${
                  tabChats === 'clubes'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <Users size={12} />
                  <span>Mis clubes</span>
                </span>
              </button>
              <button
                onClick={() => {
                  // Como las otras pestañas: al entrar en la galería
                  // no hay chat abierto. Sin esto, si había una
                  // conversación seleccionada, la condición
                  // `tabChats === 'descubrir' && !activeRoomId` de la
                  // zona derecha fallaba y salía el vacío de
                  // "Selecciona o inicia un chat" hasta cambiar de
                  // pestaña y volver.
                  setTabChats('descubrir');
                  setActiveRoomId(null);
                }}
                role="tab"
                aria-selected={tabChats === 'descubrir'}
                className={`chat-boton flex-1 rounded-lg py-2 transition-all ${
                  tabChats === 'descubrir'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <Compass size={12} />
                  <span>Descubrir</span>
                </span>
              </button>
            </div>

            {/* Filtro rápido de conversaciones. Solo en la vista
                de privados: en las demás no hay nada que
                filtrar por tipo, y dejarlo ahí sería ofrecer
                algo que no hace nada. */}
            {tabChats === 'privados' && (
              <div className="flex rounded-xl bg-black/30 p-1 border border-white/[0.05] text-[11px] font-semibold">
                <button
                  onClick={() => setFilterType('all')}
                  aria-pressed={filterType === 'all'}
                  className={`chat-boton flex-1 rounded-lg py-1.5 transition-all ${
                    filterType === 'all'
                      ? 'bg-white/[0.09] text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('direct')}
                  aria-pressed={filterType === 'direct'}
                  className={`chat-boton flex-1 rounded-lg py-1.5 transition-all ${
                    filterType === 'direct'
                      ? 'bg-white/[0.09] text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  1 a 1
                </button>
                <button
                  onClick={() => setFilterType('group')}
                  aria-pressed={filterType === 'group'}
                  className={`chat-boton flex-1 rounded-lg py-1.5 transition-all ${
                    filterType === 'group'
                      ? 'bg-white/[0.09] text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  Grupos
                </button>
              </div>
            )}

            {tabChats === 'privados' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRequests((v) => !v)}
                  aria-pressed={showRequests}
                  className={`chat-boton flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-semibold transition-colors ${
                    showRequests
                      ? 'border-violet-400/30 bg-violet-500/[0.14] text-violet-200'
                      : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100 hover:border-white/[0.1]'
                  }`}
                >
                  <UserPlus size={13} />
                  <span>Solicitudes</span>
                  {incomingRequests.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-1 text-[9px] font-bold text-white shadow-sm">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowGroups(true)}
                  className="chat-boton flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-zinc-100 hover:border-white/[0.1]"
                >
                  <Hash size={13} />
                  <span>Unirse a grupo</span>
                </button>
              </div>
            )}

            {/* Solicitudes de acceso a mis clubes */}
            {tabChats === 'clubes' && solicitudesDeClubes.length > 0 && (
              <button
                onClick={() => setShowMembers(true)}
                className="chat-boton flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-violet-400/25 bg-violet-500/[0.1] px-2 text-[11px] font-semibold text-violet-200 transition-colors hover:bg-violet-500/[0.16]"
              >
                <Mail size={13} />
                <span>
                  {solicitudesDeClubes.length}{' '}
                  {solicitudesDeClubes.length === 1 ? 'solicitud' : 'solicitudes'} de acceso
                </span>
              </button>
            )}
          </div>

          {/* PANEL DE SOLICITUDES */}
          {showRequests && (
            <div className="max-h-[26rem] space-y-3 overflow-y-auto border-b border-white/[0.06] bg-black/30 p-3">
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
                                {req.type === 'invite'
                                  ? `Te invita a unirte a "${req.groupName}"`
                                  : req.type === 'group'
                                    ? `Quiere entrar en "${req.groupName}"`
                                    : 'Quiere chatear contigo'}
                              </p>
                            </div>
                          </div>

                          {wasBlocked && req.type === 'direct' && (
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
                            {req.type === 'invite'
                              ? `Invitación a "${req.groupName}"`
                              : req.type === 'group'
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

          {/* ── Lista de MIS CLUBES ────────────────────
              Solo en la pestaña «Mis clubes». Cada fila es un
              chat grupal del que ya eres miembro, y se distingue
              de un privado por el icono de personas: nunca se
              confunde una conversación con un chat de club. */}
          {tabChats === 'clubes' && (
            <div className="min-h-0 flex-1 overflow-y-auto space-y-1 p-2">
              {cargandoClubes && misClubes.length === 0 ? (
                <div className="flex items-center justify-center gap-2 p-6 text-xs text-zinc-500">
                  <Loader2 size={14} className="animate-spin text-violet-300/80" />
                  <span>Cargando tus clubes...</span>
                </div>
              ) : misClubes.length === 0 ? (
                <div className="space-y-3 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-2xl">
                    🧭
                  </div>
                  <p className="text-[13px] font-bold tracking-tight text-white">Todavía no estás en ningún club</p>
                  <p className="mx-auto max-w-[240px] text-[11px] leading-relaxed text-zinc-500">
                    Únete a una comunidad para chatear con gente que comparte tus aficiones.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTabChats('descubrir')}
                    className="chat-boton mx-auto flex h-9 items-center gap-1.5 rounded-xl border border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 text-[11px] font-bold text-white transition-colors hover:brightness-110 shadow-md shadow-violet-950/40"
                  >
                    <Compass size={13} />
                    <span>Descubrir clubes</span>
                  </button>
                </div>
              ) : (
                misClubes.map((club) => {
                  // Actividad del club en TODOS sus canales: la fila
                  // enseña lo último que se dijo en cualquiera de
                  // ellos, y marca sin leer si alguno lo está.
                  const chatsClub = rooms.filter(
                    (r) => r.id === club.chatId || r.slug === club.id,
                  );
                  const ultimo = chatsClub
                    .filter((r) => r.lastMessageAt)
                    .sort((a, b) =>
                      (b.lastMessageAt ?? '') > (a.lastMessageAt ?? '') ? 1 : -1,
                    )[0];

                  return (
                    <ClubListItem
                      key={club.id}
                      club={club}
                      activo={chatsClub.some((r) => r.id === activeRoomId)}
                      sinLeer={chatsClub.some((r) => unreadRoomIds.includes(r.id))}
                      ultimoMensaje={ultimo?.lastMessage}
                      ultimaFecha={ultimo?.lastMessageAt}
                      miRol={club.members[currentUser?.uid ?? ''] ?? null}
                      solicitudes={solicitudesDeClubes.filter((r) => r.clubId === club.id).length}
                      onAbrir={() => setActiveRoomId(club.chatId)}
                      onVerDetalle={() => {
                        setClubDetalle(club.id);
                        setActiveRoomId(club.chatId);
                      }}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* Rooms Scrollable List (conversaciones privadas) */}
          {tabChats === 'privados' && (
          <div className="chat-transicion min-h-0 flex-1 overflow-y-auto space-y-1 p-2">
            {filteredRooms.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 space-y-3">
                {chatsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={14} className="animate-spin text-violet-300/80" />
                    <span>Cargando conversaciones...</span>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
                      <MessageCircle size={20} />
                    </div>
                    <p className="font-medium">No tienes chats en esta categoría.</p>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="chat-boton rounded-xl border border-violet-400/25 bg-violet-500/[0.1] px-3 py-1.5 text-[11px] font-bold text-violet-200 hover:bg-violet-500/[0.18] transition-colors"
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
                const estadoContacto = isDirect
                  ? estadoPresenciaDe(otherParty?.uid)
                  : null;
                const displayName = nombreVisible(room);
                const otherPartyChatId = otherParty?.chatId;
                const roomAvatar = isDirect
                  ? otherParty!.avatarUrl || room.avatar
                  : room.avatar;

                // La fila NO es un <button> aunque lo parezca: dentro
                // lleva el botón de acciones y un botón dentro de
                // otro botón no funciona (y React lo avisa en
                // consola). Es un div con rol de botón y teclado.
                return (
                  <div
                    key={room.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir la conversación con ${displayName}`}
                    onClick={() => setActiveRoomId(room.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveRoomId(room.id);
                      }
                    }}
                    className={`chat-transicion group w-full flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-violet-400 ${
                      isActive
                        ? 'border-violet-400/25 bg-gradient-to-r from-violet-600/[0.18] to-indigo-600/[0.08] shadow-[0_8px_24px_-12px_rgba(124,58,237,0.5)]'
                        : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {roomAvatar ? (
                        <img
                          src={roomAvatar}
                          alt={displayName}
                          className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-sky-500/20 text-violet-200 text-sm font-bold ring-1 ring-white/10">
                          {displayName[0]}
                        </div>
                      )}
                      {room.type === 'group' ? (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] text-white">
                          <Users size={9} />
                        </span>
                      ) : (
                        <span
                          title={estadoContacto?.label}
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 ${
                            estadoContacto?.online ? 'bg-emerald-500' : 'bg-zinc-600'
                          }`}
                        />
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
                          className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"
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
                        className="chat-boton rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100 lg:focus-visible:opacity-100"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          // `max-h` + scroll propio: si la lista de
                          // acciones es más alta que el hueco, se
                          // desplaza en vez de salirse de la
                          // pantalla (en móvil, con el teclado
                          // abierto, el hueco es muy pequeño).
                          data-menu-conversacion
                          className="absolute right-0 top-7 z-20 max-h-[60vh] w-56 overflow-y-auto overscroll-contain rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
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

                          <button
                            onClick={() => {
                              setOpenMenuFor(null);
                              setPrefsPanelFor(room.id);
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                          >
                            <Palette size={13} className="text-violet-400" />
                            <span>
                              Personalizar conversación
                              <span className="block text-[10px] font-normal text-zinc-500">
                                Color, apodo, avisos y favorito
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
                  </div>
                );
              })
            )}
          </div>
          )}
        </div>

        {/* RIGHT: ACTIVE CHAT CONVERSATION (8 cols)

            Espejo del de arriba: en el móvil se esconde mientras
            no haya sala abierta, para que lo que se vea sea la
            lista y no un panel vacío diciendo "selecciona un
            chat". */}
        <div
          className={`${
            tabChats === 'descubrir' || activeRoomId ? 'flex' : 'hidden'
          } lg:flex relative min-h-0 min-w-0 flex-col bg-[#0b0b12]${sinMovimiento ? ' chat-sin-movimiento' : ''}`}
        >
          {/* Botón para volver a abrir la barra cuando está
              contraída. Flota en el borde izquierdo del chat;
              solo en escritorio, por el mismo motivo que el de
              contraer. Aparece con fundido (geo-aparece). */}
          {sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              title="Mostrar la lista"
              aria-label="Mostrar la lista de conversaciones"
              className="geo-aparece absolute left-2 top-1/2 z-30 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg backdrop-blur transition-all hover:border-violet-500/60 hover:text-violet-300 lg:flex"
            >
              <PanelLeftOpen size={14} />
            </button>
          )}
          {/* ── VISTA: DESCUBRIR CLUBES ─────────────────
              Ocupa toda la zona derecha. No hay chat abierto:
              lo que se ve es la galería, y elegir un club no
              abandona la sección: te lleva a «Mis clubes» con
              su chat ya abierto.
              Es un ternario encadenado con el chat y el vacío
              de abajo: si la galería y el vacío se pintaran a la
              vez (dos `h-full` en la misma columna), el vacío
              tapaba la galería. */}
          {tabChats === 'descubrir' && !activeRoomId ? (
            <ClubDiscovery />
          ) : null}

          {/* Cuando se está en la galería sin chat abierto, la
              zona derecha es la galería (arriba). Si hay chat
              abierto, manda la conversación. El estado vacío de
              abajo solo aparece si no hay ni una cosa ni la otra. */}
          {tabChats === 'descubrir' && !activeRoomId ? null : activeRoom ? (
            <div className={clubConCanales ? 'flex min-h-0 flex-1 flex-row' : 'contents'}>
              {clubConCanales && clubDelChat ? (
                <div className="hidden min-h-0 w-60 flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/70 lg:flex 2xl:w-64">
                  <ClubChannelRail
                    club={clubDelChat}
                    canales={canalesVisiblesLista}
                    canalActivoId={canalActivo?.id ?? null}
                    sinLeerIds={unreadRoomIds}
                    cargando={canalesLoading && canalesVisiblesLista.length === 0}
                    puedeGestionar={puedeGestionarCanales}
                    onElegir={elegirCanal}
                    onCrear={() => setModalCanal({ channel: null })}
                    onEditar={(ch) => setModalCanal({ channel: ch })}
                    onEliminar={(ch) => eliminarCanal(clubDelChat, ch)}
                    onMover={(ch, dir) => moverCanal(clubDelChat.id, ch.id, dir)}
                  />
                </div>
              ) : null}
              <div
                className={
                  clubConCanales ? 'flex min-h-0 min-w-0 flex-1 flex-col' : 'contents'
                }
              >
              {/* Chat Top Header */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#0e0e17]/95 px-3 py-2.5 sm:px-5 sm:py-3 backdrop-blur">
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

                  {/* Badge de chat grupal. Lo que distingue un club
                      de un privado de un vistazo: sin él, un chat de
                      treinta personas y una conversación de dos se
                      ven igual. */}
                  {esChatClub && (
                    <span
                      className="hidden flex-shrink-0 items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-600/20 px-2 py-1 text-[10px] font-bold text-violet-300 sm:flex"
                      title="Chat grupal de club"
                    >
                      <Users size={11} />
                      <span>Club</span>
                    </span>
                  )}

                  <div className="relative flex-shrink-0">
                    {activeRoomAvatar ? (
                      <img
                        src={activeRoomAvatar}
                        alt={activeRoomName}
                        className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-sky-500/25 text-white text-sm font-bold ring-1 ring-white/10">
                        {activeRoomName[0]}
                      </div>
                    )}

                    {/* El candito de "en línea". En un grupo no significa
                        nada: no es que haya una persona conectada, es
                        que el grupo existe. */}
                    {activeRoom.type === 'direct' && (
                      <span
                        title={estadoActivo?.label}
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 ${
                          estadoActivo?.online ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                      />
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
                    <h3 className="flex min-w-0 items-center gap-2 text-[13px] font-bold tracking-tight text-white">
                      {/* En un club se enseña el canal (`# teorias`)
                          y no el nombre interno del chat: el canal
                          se puede renombrar sin tocar mensajes. */}
                      <span className="truncate">
                        {esChatClub && canalActivo ? `# ${canalActivo.name}` : activeRoomName}
                      </span>
                      {(activeRoom.type === 'group' || esChatClub) && (
                        <span className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                          {esChatClub
                            ? (clubDelChat?.memberCount ?? activeRoom.memberIds.length)
                            : activeRoom.memberIds.length}
                          <span className="hidden sm:inline"> integrantes</span>
                        </span>
                      )}
                    </h3>

                    {/* En un club, la segunda linea es la categoría y
                        el rol del usuario, no "En línea": un chat
                        grupal no tiene una persona conectada. */}
                    {esChatClub ? (
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-violet-300/80">
                        <span>
                          {CLUB_CATEGORIES.find((c) => c.id === clubDelChat?.category)?.label ??
                            'Chat grupal'}
                        </span>
                        {soyDuenoDelClub && (
                          <span className="flex items-center gap-0.5 font-bold text-amber-300/90">
                            <Crown size={9} />
                            Propietario
                          </span>
                        )}
                        {!soyDuenoDelClub && soyModDelClub && (
                          <span className="flex items-center gap-0.5 font-bold text-violet-300/90">
                            <Shield size={9} />
                            Moderador
                          </span>
                        )}
                      </span>
                    ) : activeRoom.type === 'group' ? (
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-violet-300/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        Sala grupal activa
                      </span>
                    ) : (
                      <span
                        className={`mt-0.5 flex items-center gap-1.5 text-[11px] font-medium ${
                          estadoActivo?.online ? 'text-emerald-300/90' : 'text-zinc-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            estadoActivo?.online
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                              : 'bg-zinc-600'
                          }`}
                        />
                        {estadoActivo?.label ?? 'Desconectado'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón «Ver detalles»: abre el panel con la
                    descripción, las normas, los miembros y las
                    herramientas de moderación del club. */}
                {esChatClub && clubDelChat && (
                  <button
                    type="button"
                    onClick={() => setClubDetalle(clubDelChat.id)}
                    className="chat-boton flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-[11px] font-bold text-white transition-colors hover:brightness-110 shadow-md shadow-violet-950/40"
                  >
                    <Info size={13} className="flex-shrink-0" />
                    <span className="hidden sm:inline">Ver detalles</span>
                  </button>
                )}

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
                    className="chat-boton flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Users size={13} className="flex-shrink-0" />
                    <span className="hidden sm:inline">Miembros</span>
                  </button>
                )}

                {/* Personalizar el chat.

                    En un CLUB la apariencia es del club (la ve
                    todo el mundo), así que solo el equipo la
                    cambia: si un miembro normal la tocara, pondría
                    su gusto a los demás.

                    En un privado o un grupo no hay club detrás, así
                    que la apariencia es de cada persona y el botón
                    se queda para quien sea. De ahí el «no es club»
                    en la condición: sin él, el botón desaparecería
                    también de los privados, que es justo lo que no
                    se quiere. */}
                {(!esChatClub || soyDuenoDelClub || soyModDelClub) && (
                  <button
                    type="button"
                    onClick={abrirPanelApariencia}
                    aria-label="Personalizar el chat"
                    title="Personalizar el chat"
                    className="chat-boton flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Palette size={13} className="flex-shrink-0" />
                    <span className="hidden sm:inline">Apariencia</span>
                  </button>
                )}

                {/* Mensajes fijados: siempre visible (quien puede
                    fijarlos es el equipo, pero verlos es de
                    todos), y con el número de cuántos hay. */}
                <button
                  type="button"
                  onClick={() => setPanelFijados(true)}
                  aria-label="Mensajes fijados"
                  title="Mensajes fijados"
                  className="chat-boton relative flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-amber-400/30 hover:bg-white/[0.06] hover:text-white"
                >
                  <Pin size={13} className="flex-shrink-0" />
                  <span className="hidden sm:inline">Fijados</span>
                  {fijados.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white">
                      {fijados.length}
                    </span>
                  )}
                </button>
              </div>

              {/* En un club no se enseña el código de invitación:
                  la entrada se pide desde «Descubrir clubes» o la
                  gestiona un moderador, así que el código no
                  aporta nada aquí. */}

              {/* Selector de canal en móvil: en escritorio está la
                  columna lateral. Abre el cajón sin tapar la
                  conversación al cerrarlo. */}
              {clubConCanales && clubDelChat && (
                <button
                  type="button"
                  onClick={() => setCanalesAbiertos(true)}
                  className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/60 px-4 py-2 text-left lg:hidden"
                  aria-label="Abrir la lista de canales"
                >
                  {canalActivo?.visibility === 'mods' ? (
                    <Lock size={12} className="flex-shrink-0 text-amber-300/80" />
                  ) : (
                    <Hash size={12} className="flex-shrink-0 text-violet-400" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-zinc-200">
                    #{canalActivo?.name ?? 'general'}
                  </span>
                  {canalActivo?.description && (
                    <span className="hidden min-w-0 flex-1 truncate text-[10px] text-zinc-500 sm:inline">
                      {canalActivo.description}
                    </span>
                  )}
                  <span className="flex flex-shrink-0 items-center gap-1 text-[10px] font-semibold text-zinc-500">
                    {canalesVisiblesLista.length} canales
                    <ChevronDown size={12} />
                  </span>
                </button>
              )}

              {/* Aviso de sanción vigente. El texto sale de la sanción
                  real (motivo, fin, quién la puso), no de un
                  texto fijo: la persona tiene que saber por qué
                  está castigada y hasta cuándo. */}
              {esChatClub && sancionVigente && (
                <div
                  role="status"
                  className={`flex flex-wrap items-start gap-2 border-b px-4 py-2 ${
                    sancionVigente.tipo === 'baneo'
                      ? 'border-red-500/30 bg-red-500/10'
                      : 'border-orange-500/30 bg-orange-500/10'
                  }`}
                >
                  {sancionVigente.tipo === 'baneo' ? (
                    <Ban size={13} className="mt-0.5 flex-shrink-0 text-red-400" />
                  ) : (
                    <VolumeX size={13} className="mt-0.5 flex-shrink-0 text-orange-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[11px] leading-relaxed ${
                        sancionVigente.tipo === 'baneo' ? 'text-red-200' : 'text-orange-200'
                      }`}
                    >
                      {avisoDeSancion(sancionVigente)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      Aplicada por {sancionVigente.aplicadaPorNombre || 'el equipo del club'}.
                      {sancionVigente.fin && (
                        <> Termina el {fechaLegible(sancionVigente.fin)}.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso de miembro silenciado (reflejo antiguo en la
                  ficha, para silencios ya aplicados antes de este
                  sistema). */}
              {esChatClub && estoySilenciado && (
                <div className="flex items-center gap-2 border-b border-zinc-800 bg-orange-500/10 px-4 py-2">
                  <VolumeX size={13} className="flex-shrink-0 text-orange-400" />
                  <p className="text-[11px] text-orange-300">
                    Estás silenciado en este club: puedes leer, pero no enviar mensajes.
                  </p>
                </div>
              )}

              {/* Código del grupo: es lo que se comparte para que
                  otras personas puedan pedir entrar. */}
              {activeRoom.type === 'group' && activeRoom.code && (
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-black/25 px-4 py-2">
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
                    Compártelo solo con quien quieras invitar
                  </span>
                </div>
              )}

              {/* Grupo SIN código (grupos antiguos): el dueño puede
                  generarlo aquí. Sin esta barra, ese grupo no
                  enseñaba nada y no había forma de invitar con
                  código, porque las reglas tampoco dejaban añadir
                  el campo después. */}
              {activeRoom.type === 'group' && !activeRoom.code && isGroupOwner && (
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/60 px-4 py-2">
                  <Hash size={12} className="flex-shrink-0 text-zinc-500" />
                  <span className="text-[11px] text-zinc-500">
                    Este grupo aún no tiene código de invitación.
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                  >
                    {generatingCode ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <span>Generar código</span>
                    )}
                  </button>
                  {codeError && (
                    <span className="text-[10px] text-red-400">{codeError}</span>
                  )}
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

              {/* Messages Body. El fondo y la separación salen de
                  la apariencia del chat; por defecto, elegante y
                  tenue para que manden las burbujas. */}
              <div
                ref={listaRef}
                onScroll={alDesplazar}
                className="chat-hilo min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6 lg:px-10 flex flex-col"
                style={{ ...aparienciaVista.fondoLista, ...aparienciaVista.gapLista }}
              >
                {activeRoomId && activeMessages.length > 0 && hasMoreMessages[activeRoomId] && (
                  <button
                    type="button"
                    onClick={() => void cargarAnteriores()}
                    disabled={loadingOlderMessages[activeRoomId]}
                    className="mx-auto mb-3 flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-400/30 hover:text-violet-200 disabled:opacity-60"
                  >
                    {loadingOlderMessages[activeRoomId] && <Loader2 size={11} className="animate-spin" />}
                    {loadingOlderMessages[activeRoomId] ? 'Cargando...' : 'Cargar mensajes anteriores'}
                  </button>
                )}
                {activeMessages.length === 0 ? (
                  <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center text-center p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-600/20 to-sky-500/10 text-violet-300 shadow-inner">
                      <Sparkles size={22} />
                    </div>
                    <p className="mt-3 text-sm font-bold tracking-tight text-zinc-100">
                      ¡Comienza la conversación!
                    </p>
                    <p className="text-xs text-zinc-500 mt-1.5 max-w-xs leading-relaxed">
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
                            <div className="mx-auto flex w-full max-w-md items-center gap-3 py-1">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-400/30" />
                              <span className="shrink-0 rounded-full border border-violet-400/25 bg-[#151322]/95 px-3 py-1 text-[11px] font-bold text-violet-200 shadow-md backdrop-blur">
                                {textoDeNuevos(corteNuevos.total)}
                              </span>
                              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-400/30" />
                            </div>
                          )}

                          <div
                            className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isMe && (
                              <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-zinc-500">
                                <Ban size={13} />
                              </span>
                            )}

                            <div className="max-w-[78%] space-y-1 sm:max-w-[70%] 2xl:max-w-[45%]">
                              {!isMe && (
                                <span className="text-[11px] font-semibold text-violet-200/70 pl-1 block">
                                  {senderNameOf(msg)}
                                </span>
                              )}

                              <div
                                className={`chat-burbuja flex w-fit max-w-full items-center gap-2 rounded-2xl border border-white/[0.06] border-dashed bg-white/[0.03] px-3.5 py-2 text-[13px] leading-relaxed italic text-zinc-400 ${
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
                          <div className="mx-auto flex w-full max-w-md items-center gap-3 py-1">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-400/30" />
                            <span className="shrink-0 rounded-full border border-violet-400/25 bg-[#151322]/95 px-3 py-1 text-[11px] font-bold text-violet-200 shadow-md backdrop-blur">
                              {textoDeNuevos(corteNuevos.total)}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-400/30" />
                          </div>
                        )}

                        {/* El id permite saltar a un mensaje concreto (desde el panel de
                            fijados): `document.getElementById` lo encuentra sin
                            recorrer el árbol. Y el resaltado avisa de que ese es
                            el mensaje al que se saltó. */}
                        <div
                          id={`msg-${msg.id}`}
                          className={
                            'group flex gap-2 rounded-lg transition-shadow duration-500 ' +
                            (isMe ? 'flex-row-reverse' : 'flex-row') +
                            (mensajeResaltado === msg.id
                              ? ' ring-2 ring-violet-400/80 ring-offset-2 ring-offset-transparent'
                              : '')
                          }
                        >
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => goToProfile(msg.senderId)}
                            aria-label={`Ver el perfil de ${senderNameOf(msg)}`}
                            title="Ver su perfil"
                            className="chat-boton mt-0.5 flex-shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                          >
                            <img
                              src={senderAvatarOf(msg)}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                            />
                          </button>
                        )}

                        {/* El límite en porcentaje solo no
                            basta: al ensanchar la ventana, el
                            70% de 1400px es una burbuja de casi
                            un metro que deja de leerse como
                            mensaje de chat. La anchura sale de
                            la apariencia (por defecto, esta). */}
                        <div
                          className={`${aparienciaVista.ancho} space-y-1`}
                        >
                          {!isMe && (
                            // El cargo va junto al nombre, no dentro del
                            // texto: así un nombre largo no empuja el
                            // distintivo a la línea siguiente y en móvil
                            // la cabecera del mensaje no crece.
                            <span className="flex flex-wrap items-center gap-1.5 pl-1 text-[11px] font-semibold text-violet-200/70">
                              <span className="min-w-0 truncate">{senderNameOf(msg)}</span>
                              {/* Solo en chats de club: el cargo es
                                  distinto en cada club. */}
                              {esChatClub && (
                                <ClubRoleBadge club={clubDelChat} uid={msg.senderId} size="xs" />
                              )}
                              {/* El distintivo de mensaje fijado: se
                                  pinta en el propio mensaje, sin
                                  abrir nada. */}
                              {estaFijado(msg.id) && (
                                <span
                                  title="Este mensaje está fijado"
                                  className="inline-flex items-center gap-0.5 whitespace-nowrap rounded border border-amber-400/30 bg-amber-400/10 px-1 py-px text-[9px] font-bold leading-tight text-amber-200"
                                >
                                  <Pin size={9} aria-hidden="true" />
                                  Mensaje fijado
                                </span>
                              )}
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
                              className={`mb-1.5 w-fit max-w-full rounded-xl border border-white/[0.06] border-l-2 border-l-violet-400/60 bg-black/35 px-3 py-2 backdrop-blur-sm ${
                                isMe ? 'ml-auto' : ''
                              }`}
                            >
                              <p className="text-[10px] font-bold tracking-wide text-violet-200/90">
                                {msg.replyTo.senderName}
                              </p>
                              <p className="line-clamp-2 break-words text-[11px] leading-relaxed text-zinc-400">
                                {citaVisible(
                                  (msg.replyTo.texto ?? msg.replyTo.snippet ?? '').slice(
                                    0,
                                    MAX_CITA,
                                  ),
                                  citado?.deletedForEveryone,
                                )}
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
                            // escritorio. Colores, radio, letra y
                            // relleno salen de la apariencia del chat;
                            // por defecto, elegante y contenida.
                            className={`chat-burbuja w-fit max-w-full break-words ${aparienciaVista.letraClase} leading-relaxed ${aparienciaVista.relleno} ${
                              isMe ? 'ml-auto' : ''
                            }`}
                            style={{
                              ...(isMe
                                ? aparienciaVista.burbujaPropia
                                : aparienciaVista.burbujaRecibida),
                              ...aparienciaVista.radio,
                              ...(isMe
                                ? aparienciaVista.esquinaPropia
                                : aparienciaVista.esquinaRecibida),
                              ...aparienciaVista.letra,
                            }}
                          >
                            {/* El texto solo se pinta si hay texto: un
                                mensaje puede ser solo un GIF. */}
                            {msg.body && <p className="break-words text-[14px] leading-relaxed">{msg.body}</p>}
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

                          {/* Encuesta del mensaje. Se pinta fuera de la
                              burbuja, como el GIF o la foto: la tarjeta
                              trae su propio fondo y estiraría el
                              degradado de "mi mensaje". Cerrar la dejan
                              el autor y (en clubes) los moderadores. */}
                          {msg.poll && (
                            <ChatPollCard
                              chatId={msg.chatId}
                              messageId={msg.id}
                              poll={msg.poll}
                              puedeCerrar={
                                msg.senderId === currentUser.uid ||
                                (esChatClub && soyModDelClub)
                              }
                            />
                          )}

                          {/* Tier list del mensaje. Tarjeta compacta
                              fuera de la burbuja, como la encuesta:
                              la vista completa se abre en el visor. */}
                          {msg.tierList && (
                            <ChatTierCard
                              referencia={msg.tierList}
                              onAbrir={(id) => setVisorTierId(id)}
                            />
                          )}

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
                                // La ruta real del mensaje es la conversación
                                // abierta; `msg.chatId` puede faltar en datos
                                // antiguos y no debe decidir dónde se escribe.
                                activeRoomId ?? msg.chatId,
                              )
                            }
                          />

                          <div
                            className={`mt-1 flex items-center gap-1.5 text-[10px] tracking-wide text-zinc-500/90 font-mono ${
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
                              <span className="italic text-zinc-500/80" title="Mensaje editado">
                                · editado
                              </span>
                            )}
                            {isMe &&
                              (isReadByEveryone(msg.id, msg.createdAt) ? (
                                // Doble tick: el resto ya lo ha leído
                                <span
                                  className="flex items-center text-sky-300/90"
                                  title="Leído"
                                >
                                  <Check size={12} strokeWidth={2.5} />
                                  <Check size={12} strokeWidth={2.5} className="-ml-1.5" />
                                </span>
                              ) : (
                                // Un solo tick: enviado, pendiente de lectura
                                <span className="text-zinc-500/80" title="Enviado">
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
                                  if (menuMsgId === msg.id) {
                                    setMenuMsgId(null);
                                    setMenuMsgBoton(null);
                                    return;
                                  }
                                  setMenuMsgId(msg.id);
                                  // El botón se guarda para colocar el
                                  // menú respecto a la ventana.
                                  setMenuMsgBoton(e.currentTarget);
                                }}
                                aria-label={`Opciones del mensaje de ${senderNameOf(msg)}`}
                                title="Opciones"
                                // Diana de 28px con icono de 11: en el
                                // móvil el botón de antes (p-0.5) era
                                // casi imposible de acertar con el dedo.
                                className="chat-boton rounded-lg p-1.5 text-zinc-500/70 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-violet-400"
                              >
                                <MoreVertical size={12} />
                              </button>

                              {menuMsgId === msg.id &&
                                posMenuMsg &&
                                createPortal(
                                  <MenuMensaje
                                    posicion={posMenuMsg}
                                    esMio={isMe}
                                    puedeFijar={puedeFijarEnEsta()}
                                    fijado={estaFijado(msg.id)}
                                    onResponder={() => responderA(msg)}
                                    onEditar={() => empezarEdicion(msg)}
                                    onBorrar={() => pedirBorrar(msg)}
                                    onFijar={() => {
                                      setMenuMsgId(null);
                                      setMenuMsgBoton(null);
                                      void alternarFijado(msg);
                                    }}
                                    onSilenciar={
                                      esChatClub && soyModDelClub && !isMe
                                        ? () => {
                                            setMenuMsgId(null);
                                            setMenuMsgBoton(null);
                                            abrirSancion(msg.senderId, 'silencio');
                                          }
                                        : undefined
                                    }
                                    onBanear={
                                      esChatClub && soyModDelClub && !isMe
                                        ? () => {
                                            setMenuMsgId(null);
                                            setMenuMsgBoton(null);
                                            abrirSancion(msg.senderId, 'baneo');
                                          }
                                        : undefined
                                    }
                                  />,
                                  document.body,
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
                    className="max-h-[90dvh] w-full max-w-xs overflow-y-auto rounded-3xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
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
                <div className="border-t border-white/[0.06] bg-black/30 p-4 space-y-3">
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
                        placeholder="ID del usuario a invitar..."
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        onClick={handleAddMember}
                        disabled={busyAction || !addMemberInput.trim()}
                        className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                      >
                        {busyAction ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                        <span>Invitar</span>
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

              {/* Message Input Bottom Bar. Con `safe-area` para que
                  la barra del sistema no tape el campo en móviles
                  con gestos. */}
              <form
                onSubmit={handleSendMessage}
                className="relative border-t border-white/[0.06] bg-[#0c0c15]/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 backdrop-blur"
              >
                {/* Citando: a quién y qué, con salida. Al enviar, la
                    cita viaja dentro del mensaje nuevo. */}
                {citaA && !editando && (
                  <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-white/[0.06] border-l-2 border-l-violet-400/60 bg-black/30 px-3 py-2">
                    <Reply size={13} className="flex-shrink-0 text-violet-300/90" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-violet-200/90">
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
                      className="chat-boton rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
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
                  <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-amber-400/20 border-l-2 border-l-amber-400/70 bg-amber-500/[0.06] px-3 py-2">
                    <Pencil size={13} className="flex-shrink-0 text-amber-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-amber-200">
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
                      className="chat-boton rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Encuesta del próximo mensaje. Mismo formulario que
                    en los hilos: al enviar se normaliza y viaja
                    dentro del mensaje. Un mensaje puede ser SOLO la
                    encuesta, sin texto. */}
                {encuestaBorrador && !editando && (
                  <div className="relative mb-2">
                    <PollComposer
                      value={encuestaBorrador}
                      onChange={(v) => {
                        setEncuestaBorrador(v);
                        setErrorEncuesta(undefined);
                      }}
                      error={errorEncuesta}
                      ayudaVacio="Escribe la pregunta y deja al menos 2 opciones. Si la dejas sin escribir, el mensaje se envía igual y sin encuesta."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEncuestaBorrador(null);
                        setErrorEncuesta(undefined);
                      }}
                      aria-label="Descartar la encuesta"
                      className="absolute right-2 top-2 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Tier list del próximo mensaje. Adjunta una ya
                    creada o abre el editor para hacer una nueva. Un
                    mensaje puede ser SOLO la tier list. */}
                {tierAdjunta && !editando && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/[0.08] px-3 py-2">
                    <Trophy size={13} className="flex-shrink-0 text-violet-300" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">
                      {tierAdjunta.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTierAdjunta(null)}
                      aria-label="Quitar la tier list"
                      className="chat-boton rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Selector: crear una nueva o elegir una propia. */}
                {selectorTierAbierto && !editando && (
                  <div className="mb-2 space-y-2 rounded-2xl border border-white/[0.06] bg-black/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                        <Trophy size={13} className="text-violet-400" />
                        Compartir tier list
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectorTierAbierto(false)}
                        aria-label="Cerrar el selector"
                        className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) return;
                        const club =
                          activeRoom?.type === 'club' ? clubDelChat : null;
                        setSelectorTierAbierto(false);
                        setEditorTierChat({
                          modo: 'nuevo',
                          ...(club
                            ? { clubId: club.id, clubName: club.name }
                            : {}),
                        });
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-violet-500"
                    >
                      <Plus size={13} />
                      Crear una nueva
                    </button>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Mis tier lists
                    </p>
                    {misTiers.length === 0 ? (
                      <p className="text-[11px] text-zinc-600">
                        Aún no tienes ninguna. Crea la primera arriba.
                      </p>
                    ) : (
                      <ul className="max-h-44 space-y-1.5 overflow-y-auto">
                        {misTiers.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-1.5"
                          >
                            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-zinc-200">
                              {t.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTierAdjunta({ tierListId: t.id, title: t.title });
                                setSelectorTierAbierto(false);
                              }}
                              className="flex-shrink-0 rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-200 transition-colors hover:bg-violet-600 hover:text-white"
                            >
                              Adjuntar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                
        {/* Barra unificada: campo + herramientas + envío en un
            mismo contenedor. En móvil las herramientas van tras
            el "+" para que el campo y el envío respiren; en
            escritorio salen todas en fila. */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/30 p-2 transition-colors focus-within:border-violet-400/40 focus-within:ring-2 focus-within:ring-violet-500/10">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        confirmarEnvio();
                      }
                    }}
                    placeholder={
                      editando ? 'Editar mensaje...' : `Escribir a ${activeRoomName}...`
                    }
                    // 16px en móvil: por debajo, iOS acerca la vista
                    // al enfocar y hay que alejar a mano. En
                    // escritorio se queda como estaba.
                    className="order-1 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl bg-transparent px-3 py-2.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />

                  {/* Herramientas: fila completa tras el "+" en
                      móvil, en línea a partir de sm. */}
                  <div
                    className={`${showHerramientas ? 'flex' : 'hidden'} order-4 w-full flex-wrap items-center gap-1.5 sm:order-2 sm:flex sm:w-auto`}
                  >
                  {/* Emojis */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    aria-label="Insertar un emoji"
                    title="Emojis"
                    className={`chat-boton flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                      showEmojiPicker
                        ? 'border-violet-400/30 bg-violet-500/[0.14] text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-violet-200'
                    }`}
                  >
                    <Smile size={16} />
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
                    className={`chat-boton flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                      chatImageUrl
                        ? 'border-violet-400/30 bg-violet-500/[0.14] text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-violet-200'
                    } disabled:opacity-40`}
                  >
                    <ImagePlus size={16} />
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

                  {/* Encuesta: abre el borrador encima de la caja. En
                      edición no aplica: la encuesta viaja con el
                      mensaje nuevo, no se edita después. */}
                  <button
                    type="button"
                    onClick={() =>
                      setEncuestaBorrador((prev) =>
                        prev
                          ? null
                          : { ...POLL_VACIO, options: [...POLL_VACIO.options] },
                      )
                    }
                    disabled={!!editando}
                    aria-label="Añadir una encuesta al mensaje"
                    title="Añadir una encuesta"
                    className={`chat-boton flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                      encuestaBorrador
                        ? 'border-violet-400/30 bg-violet-500/[0.14] text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-violet-200'
                    } disabled:opacity-40`}
                  >
                    <BarChart3 size={16} />
                  </button>

                  {/* Tier list: abre el selector encima de la caja
                      (crear o elegir una propia). En edición no
                      aplica, igual que la encuesta. */}
                  <button
                    type="button"
                    onClick={() => setSelectorTierAbierto((v) => !v)}
                    disabled={!!editando}
                    aria-label="Adjuntar una tier list al mensaje"
                    title="Adjuntar una tier list"
                    className={`chat-boton flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                      tierAdjunta || selectorTierAbierto
                        ? 'border-violet-400/30 bg-violet-500/[0.14] text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-violet-200'
                    } disabled:opacity-40`}
                  >
                    <Trophy size={16} />
                  </button>
                  </div>

                  {/* El "+" agrupa las herramientas en móvil, donde
                      no caben junto al campo. En escritorio no sale:
                      ahí ya están todas a la vista. */}
                  <button
                    type="button"
                    onClick={() => setShowHerramientas((v) => !v)}
                    aria-expanded={showHerramientas}
                    aria-label={showHerramientas ? 'Ocultar herramientas' : 'Más herramientas'}
                    title="Más herramientas"
                    className={`chat-boton order-2 flex h-9 w-9 items-center justify-center rounded-xl border transition-all sm:hidden ${
                      showHerramientas
                        ? 'border-violet-400/30 bg-violet-500/[0.14] text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.03] text-zinc-400'
                    }`}
                  >
                    {showHerramientas ? <X size={16} /> : <Plus size={16} />}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      // Con una sanción vigente el envío no sale ni
                      // enabled: es la misma barrera que el aviso de
                      // arriba. Aun así, `enviar` vuelve a comprobarlo
                      // y las reglas lo rechazan en el servidor: esto
                      // es comodidad, no seguridad.
                      bloqueadoPorSancion ||
                      editandoBusy ||
                      (editando
                        ? !inputText.trim() &&
                          !(editando.imageUrl || editando.gif || editando.location)
                        : !inputText.trim() &&
                          !chatGif &&
                          !chatImageUrl &&
                          !(
                            encuestaBorrador &&
                            borradorConContenido(encuestaBorrador)
                          ) &&
                          !tierAdjunta)
                    }
                    aria-label={editando ? 'Guardar edición' : 'Enviar mensaje'}
                    title={editando ? 'Guardar edición' : 'Enviar mensaje'}
                    className="chat-boton order-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-violet-950/50"
                  >
                    {editando ? <Check size={16} /> : <Send size={15} />}
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
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
                <MessageCircle size={22} />
              </div>
              <h3 className="mt-3 text-[15px] font-bold tracking-tight text-white">
                {tabChats === 'clubes' ? 'Selecciona uno de tus clubes' : 'Selecciona o inicia un chat'}
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 max-w-sm leading-relaxed">
                {tabChats === 'clubes'
                  ? 'Elige un club de la lista para chatear con sus miembros, o descubre nuevas comunidades.'
                  : 'Puedes iniciar una charla privada añadiendo un usuario mediante su ID único o crear un nuevo grupo de debate.'}
              </p>

              {tabChats === 'clubes' && misClubes.length > 0 && (
                <ul className="mt-4 w-full max-w-xs space-y-1.5 text-left">
                  {misClubes.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setActiveRoomId(c.chatId)}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-left transition-colors hover:border-violet-500/40"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 text-sm">
                          {c.iconUrl ? (
                            <img src={c.iconUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            CLUB_CATEGORIES.find((cat) => cat.id === c.category)?.icon ?? '✨'
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-bold text-white">
                            {c.name}
                          </span>
                          <span className="block text-[10px] text-zinc-500">
                            {c.memberCount} {c.memberCount === 1 ? 'miembro' : 'miembros'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── PANEL DE DETALLE DEL CLUB ─────────────────
              Va DENTRO de la zona del chat y tapándolo: así, al
              cerrarlo, el chat sigue exactamente donde estaba y
              no se recarga el historial. */}
          {clubActivoEnPanel && (
            <ClubDetail club={clubActivoEnPanel} onClose={() => setClubDetalle(null)} />
          )}

          {/* ── PANEL DE PREFERENCIAS POR CONVERSACIÓN ────
              Se abre desde el menú de opciones de conversación
              (MoreVertical → "Personalizar conversación"). Es un
              modal fijo que guarda en `chats/{chatId}/prefs/{uid}`. */}
          {prefsPanelFor && currentUser && (
            <ChatPrefsPanel
              chatId={prefsPanelFor}
              uid={currentUser.uid}
              onClose={() => setPrefsPanelFor(null)}
              onGuardado={(cid, prefs) => {
                if (prefs.nickname) {
                  setNicknames((m) => ({ ...m, [cid]: prefs.nickname! }));
                } else {
                  setNicknames((m) => {
                    const next = { ...m };
                    delete next[cid];
                    return next;
                  });
                }
              }}
            />
          )}

          {/* Diálogo de sanción, abierto desde el menú de un mensaje.
              Montado solo mientras `sancionPara` apunta a
              alguien. */}
          {sancionPara && clubDelChat && currentUser && (
            <SancionDialog
              club={clubDelChat}
              actorUid={currentUser.uid}
              actorNombre={
                usersList.find((u) => u.uid === currentUser.uid)?.displayName ||
                usersList.find((u) => u.uid === currentUser.uid)?.username ||
                'Moderación'
              }
              objetivoUid={sancionPara.uid}
              objetivoNombre={sancionPara.nombre}
              onClose={() => setSancionPara(null)}
              guardando={sancionGuardando}
              error={sancionError}
              onAplicar={async ({ tipo, duracionMs, motivo }) => {
                if (!sancionPara) return { ok: false, error: 'No hay nadie seleccionado.' };
                setSancionGuardando(true);
                setSancionError(null);
                try {
                  const r = await aplicarSancion({
                    club: clubDelChat,
                    actorUid: currentUser.uid,
                    actorNombre:
                      usersList.find((u) => u.uid === currentUser.uid)?.displayName ||
                      usersList.find((u) => u.uid === currentUser.uid)?.username ||
                      'Moderación',
                    objetivoUid: sancionPara.uid,
                    objetivoNombre: sancionPara.nombre,
                    tipo,
                    duracionMs,
                    motivo,
                  });
                  if (!r.ok) {
                    setSancionError(r.error ?? 'No se pudo aplicar la sanción.');
                    return { ok: false, error: r.error };
                  }
                  setActionFeedback(
                    tipo === 'baneo'
                      ? `${sancionPara.nombre} ha sido baneado del club.`
                      : `${sancionPara.nombre} ha sido silenciado.`,
                  );
                  setSancionPara(null);
                  return { ok: true };
                } finally {
                  setSancionGuardando(false);
                }
              }}
            />
          )}

          {/* ── CAJÓN DE CANALES (móvil) ────────────────────
              La misma lista que la columna de escritorio, en
              superpuesto para no comerse la conversación. */}
          {clubConCanales && clubDelChat && canalesAbiertos && (
            <div className="absolute inset-0 z-40 lg:hidden">
              <button
                type="button"
                aria-label="Cerrar la lista de canales"
                onClick={() => setCanalesAbiertos(false)}
                className="absolute inset-0 cursor-default bg-black/60"
              />
              <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl">
                <ClubChannelRail
                  club={clubDelChat}
                  canales={canalesVisiblesLista}
                  canalActivoId={canalActivo?.id ?? null}
                  sinLeerIds={unreadRoomIds}
                  cargando={canalesLoading && canalesVisiblesLista.length === 0}
                  puedeGestionar={puedeGestionarCanales}
                  onElegir={elegirCanal}
                  onCrear={() => setModalCanal({ channel: null })}
                  onEditar={(ch) => setModalCanal({ channel: ch })}
                  onEliminar={(ch) => eliminarCanal(clubDelChat, ch)}
                  onMover={(ch, dir) => moverCanal(clubDelChat.id, ch.id, dir)}
                />
              </div>
            </div>
          )}

          {/* ── MODAL DE CREAR / EDITAR CANAL ─────────────── */}
          {modalCanal && clubDelChat && (
            <ClubChannelModal
              club={clubDelChat}
              channel={modalCanal.channel}
              slugsEnUso={canalesVisiblesLista.map((c) => c.id)}
              ordenSugerido={canalesVisiblesLista.length}
              onCreado={(id) => setCanalActivoId(id)}
              onClose={() => setModalCanal(null)}
            />
          )}

          {/* ── PANEL DE APARIENCIA DEL CHAT ──────────
              Pinta el borrador mientras está abierto: lo que se
              toca se ve en la conversación sin recargar. */}
          {panelApariencia && borradorApariencia && (
            <ChatAparienciaPanel
              borrador={borradorApariencia}
              onChange={setBorradorApariencia}
              onGuardar={guardarApariencia}
              onCancelar={cerrarPanelApariencia}
              onRestablecer={restablecerApariencia}
              guardando={guardandoApariencia}
              subiendoFondo={subiendoFondoChat}
              error={errorApariencia}
              onSubirFondo={subirFondoChat}
              onQuitarFondo={quitarFondoChat}
            />
          )}

          {/* ── PANEL DE MENSAJES FIJADOS ──────────────
              Va por encima de la conversación, como el de
              apariencia. Al saltar a un mensaje se cierra y
              el chat se desplaza hasta él. */}
          {panelFijados && (
            <div className="fixed inset-0 z-[95] flex justify-end bg-black/60 backdrop-blur-sm sm:bg-black/40">
              <div className="flex h-full w-full max-w-sm flex-col border-l border-white/[0.08] bg-[#0c0c14] shadow-2xl">
                <ChatFijadosPanel
                  fijados={fijados}
                  cargando={fijadosCargando}
                  onIrA={irAMensaje}
                  onClose={() => setPanelFijados(false)}
                  onQuitar={
                    puedeFijarEnEsta()
                      ? (f) => {
                          void desfijarMensaje(activeRoomId ?? '', f.messageId).then((r) => {
                            if (!r.ok) setActionFeedback(r.error ?? 'No se pudo quitar.');
                          });
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          )}

          {/* ── VISOR DE TIER LIST ──────────────────────────
              Modal por encima del chat: al cerrarlo, la
              conversación sigue donde estaba. */}
          {visorTierId && (
            <TierListViewer
              tierListId={visorTierId}
              onUsarPlantilla={(tier) => {
                setVisorTierId(null);
                const club =
                  activeRoom?.type === 'club' ? clubDelChat : null;
                setEditorTierChat({
                  modo: 'nuevo',
                  initial: {
                    ...borradorDesdeDoc(tier),
                    title: `Mi versión: ${tier.title}`.slice(0, 80),
                  },
                  originId: tier.id,
                  originTitle: tier.title,
                  ...(club ? { clubId: club.id, clubName: club.name } : {}),
                });
              }}
              onEditar={(tier) => {
                setVisorTierId(null);
                setEditorTierChat({
                  modo: 'editar',
                  tierListId: tier.id,
                  initial: borradorDesdeDoc(tier),
                });
              }}
              onClose={() => setVisorTierId(null)}
            />
          )}

          {/* ── EDITOR DE TIER LISTS ──────────────────────── */}
          {editorTierChat && (
            <TierListEditor
              modo={editorTierChat.modo}
              initial={editorTierChat.initial}
              originId={editorTierChat.originId}
              originTitle={editorTierChat.originTitle}
              clubId={editorTierChat.clubId}
              clubName={editorTierChat.clubName}
              onGuardar={guardarTierListChat}
              onGuardado={trasGuardarTierChat}
              onClose={() => setEditorTierChat(null)}
            />
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
          <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
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
            className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4"
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
          <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
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
                placeholder="GRP-1A2B-3C4D-5E6F"
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
                Es una invitación secreta: no se puede buscar ni listar, hace falta el código
                exacto. Se usa el código y no el nombre porque puede haber varios grupos con el
                mismo nombre.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
