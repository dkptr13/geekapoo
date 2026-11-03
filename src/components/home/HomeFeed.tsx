import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Tag,
  PlusCircle,
  Sparkles,
  Send,
  Pin,
  CornerDownRight,
  TrendingUp,
  Clock,
  Check,
  Trash2,
  BarChart3,
  Trophy,
  X,
  Flag,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthorBadge } from '../gamification/AuthorBadge';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { useCommunity } from '../../context/CommunityContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { reaccionesDe, useReacciones } from '../../hooks/useReacciones';
import { useCommentsForTarget } from '../../hooks/useCommentsForTarget';
import { useStableScrollTarget } from '../../hooks/useStableScrollTarget';
import { reactionKey } from '../../services/reactions';
import { normalizarPoll } from '../../services/polls';
import { AttachImage } from '../community/AttachImage';
import { PollCard } from '../community/PollCard';
import { ReactionBar } from '../community/ReactionBar';
import { CommentGif } from '../community/CommentGif';
import { GifPicker } from '../community/GifPicker';
import { ReportDialog } from '../community/ReportDialog';
import { StableImage } from '../common/StableImage';
import { TierListCard } from '../tierlists/TierListCard';
import { TierListEditor } from '../tierlists/TierListEditor';
import { TierListViewer } from '../tierlists/TierListViewer';
import type { ImageDims } from '../../utils/imagenes';
import { borradorDesdeDoc } from '../../utils/tierlists';
import type { EditorDraft } from '../../utils/tierlists';
import {
  crearTierList,
  getTierList,
  guardarEdicionTierList,
  type TierResult,
} from '../../services/tierlists';
import { adjuntarTierList } from '../../services/threads';
import type { TierListRef } from '../../types';
import {
  POLL_VACIO,
  PollComposer,
  draftANewPoll,
  type PollDraft,
} from '../community/PollComposer';
import { Thread, GifAttachment, NewPollInput, Comment } from '../../types';

interface HomeFeedProps {
  onGoToAnime?: (slug: string) => void;
  selectedCategoryFilter?: string | null;
  onClearCategoryFilter?: () => void;
  /**
   * Hilo (y opcionalmente comentario) al que hay que saltar.
   *
   * `nonce` no es un detalle: si se pulsara dos veces el MISMO aviso,
   * hilo y comentario serían idénticos y ninguna dependencia habría
   * cambiado, así que el efecto no volvería a correr y el hilo no se
   * abriría. El contador obliga a que cada salto sea un cambio.
   */
  focusTarget?: {
    threadId: string;
    commentId?: string;
    nonce: number;
  } | null;
  /**
   * Borra el destino de la URL una vez llegado, para que no se
   * repita el salto al volver o remontar. Lo llama HomeFeed
   * cuando el desplazamiento se completa de verdad.
   */
  onLimpiarFoco?: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  selectedCategoryFilter,
  onClearCategoryFilter,
  focusTarget,
  onLimpiarFoco,
}) => {
  // `usersList` es el directorio de usuarios vivo, con un
  // `onSnapshot` encima. Se necesita para el avatar y el nombre de
  // quien escribió: están copiados en el hilo y en el comentario, pero
  // esa copia es de la foto que tenía el día que publicó. Ver los
  // ayudantes de abajo.
  const { currentUser, requireAuth, openAuth, isModerator, isAdmin, usersList } = useAuth();
  // Moderar = borrar y gestionar lo que hay en la cola. El rol
  // sale del documento del usuario, no de nada que se pueda
  // falsear desde el cliente, y las reglas lo comprueban otra
  // vez en el servidor.
  const puedeModerar = isModerator || isAdmin;
  const {
    threads,
    allThreads,
    hasMoreThreads,
    loadingMoreThreads,
    loadMoreThreads,
    ensureAllThreads,
    createThread,
    toggleThreadLike,
    addComment,
    toggleCommentLike,
    categories,
    deleteThread,
    canEditThread,
    voteInPoll,
    setPollClosed,
    toggleReaction,
    deleteComment,
    reportContent,
  } = useCommunity();
  const { settings } = useSiteContent();
  const goToProfile = useGoToProfile();

  // ══════════════════════════════════════════════════════════════════
  // QUIÉN ES EL AUTOR, LEÍDO AHORA Y NO EN EL MOMENTO DE PUBLICAR
  // ══════════════════════════════════════════════════════════════════
  //
  // ── EL FALLO QUE ARREGLA ESTO ───────────────────────────────────────
  //
  // Al publicar se copia el nombre y el avatar al documento del hilo o
  // del comentario:
  //
  //     authorName:   nameOf(currentUser),
  //     authorAvatar: currentUser.avatarUrl,
  //
  // Esa copia está para que el texto siga siendo legible aunque el
  // usuario se borre. El problema es que también es lo ÚNICO que se
  // pintaba, así que cambiarte la foto no cambiaba nada en lo que ya
  // habías publicado: los hilos y comentarios seguían con la foto
  // vieja, para siempre.
  //
  // ── POR QUÉ NO SE CAMBIA EL FORMA DEL DOCUMENTO ───────────────────
  //
  // Porque hay documentos ya escritos. Si se deja de copiar el avatar
  // al escribir, los hilos antiguos se quedan sin él y hay que
  // recorrerlos todos para arreglarlo. Con este enfoque da igual:
  //
  //   · lo nuevo tiene copia y copia buena;
  //   · lo viejo tiene copia, que puede estar caducada;
  //   · y en los dos casos se pinta la de ahora.
  //
  // ── POR QUÉ LA COPIA SIGUE SIENDO EL RESPALDO ────────────────────
  //
  // Para el visitante que no ha iniciado sesión, `usersList` está
  // vacía a propósito (no se descarga el directorio de usuarios sin
  // sesión). Y también para un hilo de alguien que ya no está en el
  // directorio, o cuya cuenta se borró: sin la copia, ahí no habría
  // nada que enseñar. Por eso el orden es "el de ahora, y si no hay,
  // el de entonces", nunca al revés.
  //
  // Es el mismo criterio que aplica el chat desde el principio, en
  // `ChatView` (`liveUserOf`): primero el documento del usuario y
  // después la copia del mensaje.
  const autorDe = useCallback(
    (uid: string) => usersList.find((u) => u.uid === uid),
    [usersList],
  );

  const avatarDe = (
    uid: string,
    respaldo: string,
  ): string => autorDe(uid)?.avatarUrl || respaldo;

  const nombreDe = (uid: string, respaldo: string): string => {
    const vivo = autorDe(uid);

    return vivo?.displayName || vivo?.username || respaldo;
  };

  // Create thread form state
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  // Imagen adjunta pendiente de publicar. Se sube al elegirla
  // y la URL se escribe al enviar. Las dimensiones se miden al
  // subir y se guardan con la imagen para reservar su sitio
  // antes de descargarla (ver `StableImage`).
  const [threadImageUrl, setThreadImageUrl] = useState('');
  const [threadImageDims, setThreadImageDims] = useState<ImageDims | null>(null);
  const [commentImageUrl, setCommentImageUrl] = useState('');
  const [commentImageDims, setCommentImageDims] = useState<ImageDims | null>(null);

  // Encuesta del formulario. Apagada por defecto: publicar un
  // hilo con encuesta es opcional.
  const [conEncuesta, setConEncuesta] = useState(false);
  const [borradorEncuesta, setBorradorEncuesta] = useState<PollDraft>(POLL_VACIO);
  const [errorEncuesta, setErrorEncuesta] = useState('');

  // Tier list adjunta al hilo que se está escribiendo.
  const [tierAdjunta, setTierAdjunta] = useState<TierListRef | null>(null);
  // Editor de tier lists: crear, plantilla, editar o adjuntar.
  const [editorTier, setEditorTier] = useState<{
    modo: 'nuevo' | 'editar';
    initial?: Partial<EditorDraft>;
    originId?: string;
    originTitle?: string;
    tierListId?: string;
    attachThreadId?: string;
    /** Si viene del composer: al guardar queda adjunta al hilo. */
    paraComposer?: boolean;
  } | null>(null);
  // Visor de tier list.
  const [visorTierId, setVisorTierId] = useState<string | null>(null);

  // Las categorías llegan de Firestore, o sea después del primer render.
  // Antes esto era useState(CATEGORIES[0].id) sobre una constante de
  // código; con datos asíncronos, CATEGORIES[0] habría sido undefined
  // y la app habría petado al montar.
  useEffect(() => {
    setCategory((prev) => prev || categories[0]?.id || '');
  }, [categories]);

  // Expanded comments for thread
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const {
    comments: comentariosHiloAbierto,
    loading: cargandoComentarios,
    loaded: comentariosCargados,
    loadingMore: cargandoComentariosAnteriores,
    hasMore: hayComentariosAnteriores,
    loadMore: cargarComentariosAnteriores,
    ensureComment: asegurarComentario,
    marcarLikeLocal: marcarLikeComentarioLocal,
  } = useCommentsForTarget(
    expandedThreadId ? 'thread' : null,
    expandedThreadId,
  );
  const [newCommentText, setNewCommentText] = useState('');
  const [commentGif, setCommentGif] = useState<GifAttachment | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState<GifAttachment | null>(null);

  // ── Moderación y denuncias ──────────────────────────
  //
  // Son dos estados y no uno, y esa es toda la diferencia entre
  // una confirmación legible y un botón que parece roto:
  //
  //   `confirmandoBorrar` → el comentario tiene pulsado 🗑 y está
  //                         esperando que le digan sí o no.
  //   `borrandoAhora`     → la escritura está en marcha. El
  //                         spinner sale solo aquí, para que no
  //                         parezca que el botón se ha quedado
  //                         cargando para siempre.
  const [confirmandoBorrar, setConfirmandoBorrar] = useState<string | null>(null);
  const [borrandoAhora, setBorrandoAhora] = useState<string | null>(null);
  const [reporteando, setReporteando] = useState<{
    tipo: 'thread' | 'comment';
    id: string;
  } | null>(null);
  const [avisoModeracion, setAvisoModeracion] = useState('');

  /**
   * Enseña un aviso unos segundos y lo retira.
   *
   * El temporizador se programa AQUÍ y no donde se pinta el
   * aviso, porque desde el render no hay forma de limpiarlo: se
   * crearía uno en cada repintado y el aviso nunca desaparecería
   * (o desaparecería de golpe, si mountsmany).
   */
  const avisoTimer = useRef<number | null>(null);

  const avisar = useCallback((texto: string, ms = 3500) => {
    if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
    setAvisoModeracion(texto);
    avisoTimer.current = window.setTimeout(() => {
      avisoTimer.current = null;
      setAvisoModeracion('');
    }, ms);
  }, []);

  useEffect(
    () => () => {
      if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
    },
    [],
  );

  // Sorting
  const [feedSort, setFeedSort] = useState<'recent' | 'popular'>('recent');

  // El feed normal usa la página reciente. Filtrar por categoría o
  // ordenar por popularidad necesita el histórico completo.
  useEffect(() => {
    if (selectedCategoryFilter || feedSort === 'popular') ensureAllThreads();
  }, [selectedCategoryFilter, feedSort, ensureAllThreads]);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);
  const [highlightThreadId, setHighlightThreadId] = useState<string | null>(null);
  // Se mantiene después de consumir la URL: la lista filtrada usa
  // `allThreads` y el hilo enfocado no debe desaparecer del DOM al
  // limpiar `?hilo=`, porque eso movería la página recién colocada.
  const [hiloEnfocado, setHiloEnfocado] = useState<string | null>(
    focusTarget?.threadId ?? null,
  );
  // Se mantiene para que las imágenes del destino sigan cargándose
  // con prioridad aunque el resaltado visual ya se haya apagado.
  const [comentarioEnfocadoPersistente, setComentarioEnfocadoPersistente] =
    useState<string | null>(focusTarget?.commentId ?? null);
  // El comentario del aviso puede haberse borrado. En ese caso se
  // coloca al menos el hilo, en vez de esperar a un elemento que ya
  // no va a existir.
  const [comentarioEnfocadoFallido, setComentarioEnfocadoFallido] = useState(false);

  // ── Ir a un hilo concreto ───────────────────────────
  //
  // Llega desde el perfil, el buscador o los hilos del día.
  //
  // No basta con desplegar sus comentarios: si el hilo ya
  // estaba desplegado, setExpandedThreadId con el mismo valor
  // no cambia nada y el clic parece no haber hecho nada. Por
  // eso además se marca la tarjeta para resaltarla.
  //
  // Se depende de "nonce" y no solo del id para que pulsar
  // dos veces sobre el mismo sitio lo vuelva a ejecutar: con
  // solo el id no cambiaría ninguna dependencia.
  const comentarioSolicitadoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusTarget) return;

    const { threadId, commentId } = focusTarget;

    setExpandedThreadId(threadId);
    setReplyingToCommentId(null);
    setHighlightThreadId(threadId);
    setHighlightCommentId(commentId ?? null);
    // El hilo se queda como fuente del feed aunque luego se borre
    // `?hilo=`: si no, al consumir la URL la lista volvería a la
    // página reciente y el hilo antiguo desaparecería del DOM.
    setHiloEnfocado(threadId);
    setComentarioEnfocadoPersistente(commentId ?? null);
    setComentarioEnfocadoFallido(false);
    comentarioSolicitadoRef.current = null;

    // El hilo del aviso puede ser más antiguo que la página
    // reciente del feed. Solo se pide el histórico si no está ya en
    // la página que tenemos cargada.
    if (!threads.some((t) => t.id === threadId)) ensureAllThreads();

    // Solo es cosmético: si tarda en cargar, el scroll se hace
    // igualmente; simplemente deja de estar resaltado.
    const t = window.setTimeout(() => {
      setHighlightThreadId(null);
      setHighlightCommentId(null);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [focusTarget?.nonce, ensureAllThreads]);

  // Si el comentario del aviso no está en la primera página (200),
  // se lee solo ese documento (y su padre si es una respuesta) en
  // vez de paginar todo el hilo. Es una lectura puntual, no un
  // listener nuevo.
  const comentarioEnfocado = focusTarget?.commentId ?? null;

  useEffect(() => {
    if (!comentarioEnfocado) return;
    if (!expandedThreadId || !comentariosCargados || cargandoComentarios) return;
    if (comentariosHiloAbierto.some((c) => c.id === comentarioEnfocado)) return;
    if (comentarioSolicitadoRef.current === comentarioEnfocado) return;

    comentarioSolicitadoRef.current = comentarioEnfocado;
    void asegurarComentario(comentarioEnfocado).then((encontrado) => {
      if (!encontrado) setComentarioEnfocadoFallido(true);
    });
  }, [
    comentarioEnfocado,
    expandedThreadId,
    comentariosCargados,
    cargandoComentarios,
    comentariosHiloAbierto,
    asegurarComentario,
  ]);

  const objetivoScroll = focusTarget
    ? focusTarget.commentId && !comentarioEnfocadoFallido
      ? `comment-${focusTarget.commentId}`
      : `thread-${focusTarget.threadId}`
    : null;

  useStableScrollTarget({
    targetId: objetivoScroll,
    token: focusTarget?.nonce ?? 0,
    onDone: onLimpiarFoco,
  });

  // ── Tier lists: guardar desde el editor ──────────
  //
  // Un solo camino para los tres casos: crear (composer o
  // plantilla) y editar. Al guardar para el composer o para
  // adjuntar a un hilo existente, la referencia queda puesta
  // sin recargar nada.
  const guardarTierList = async (
    datos: EditorDraft & { originId?: string; originTitle?: string; clubId?: string },
  ): Promise<TierResult> => {
    if (!currentUser) {
      requireAuth('crear una tier list');
      return { ok: false, error: 'Debes iniciar sesión.' };
    }
    if (editorTier?.modo === 'editar' && editorTier.tierListId) {
      return guardarEdicionTierList(editorTier.tierListId, datos);
    }
    return crearTierList(currentUser, {
      ...datos,
      clubId: undefined,
    });
  };

  const trasGuardarTier = async (tierListId: string) => {
    // Adjuntar a un hilo existente propio.
    if (editorTier?.attachThreadId) {
      try {
        const tier = await getTierList(tierListId);
        await adjuntarTierList(editorTier.attachThreadId, {
          tierListId,
          title: tier?.title ?? 'Tier list',
        });
      } catch (e) {
        console.error('[Hilos] No se pudo adjuntar la tier list:', e);
      }
      return;
    }
    // Solo si el editor se abrió desde el composer: plantilla y
    // edición no tocan el hilo que se esté escribiendo.
    if (!editorTier?.paraComposer) return;
    try {
      const tier = await getTierList(tierListId);
      if (tier) setTierAdjunta({ tierListId, title: tier.title });
    } catch (e) {
      console.error('[Hilos] No se pudo leer la tier list creada:', e);
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    // La encuesta solo se manda si el interruptor está activo Y
    // tiene pregunta: si el usuario lo encendió y luego lo dejó a
    // medias, el hilo se publica igual sin encuesta en vez de
    // romperse.
    let poll: NewPollInput | undefined;

    if (conEncuesta && borradorEncuesta.question.trim()) {
      poll = draftANewPoll(borradorEncuesta);

      // Se valida AQUÍ, antes de escribir, para poder enseñar el
      // motivo exacto ("la encuesta necesita al menos 2
      // opciones"). El servicio lo vuelve a validar al guardar:
      // esta es la comprobación amable, la otra es la que
      // impide que un cliente saltársela.
      try {
        normalizarPoll(poll);
        setErrorEncuesta('');
      } catch (e) {
        setErrorEncuesta(
          e instanceof Error ? e.message : 'Revisa la encuesta antes de publicar.',
        );
        return;
      }
    }

    const success = await createThread(title, body, category, tags, threadImageUrl, poll, threadImageDims, tierAdjunta);

    if (success) {
      setTitle('');
      setBody('');
      setTagsInput('');
      setThreadImageUrl('');
      setThreadImageDims(null);
      setTierAdjunta(null);
      setConEncuesta(false);
      setBorradorEncuesta(POLL_VACIO);
      setErrorEncuesta('');
      setShowCreateThread(false);
    } else {
      // Si el hilo no se publicó y la encuesta era válida, casi
      // siempre es que no hay sesión: el propio contexto ya ha
      // abierto el login, así que no hace falta insistir.
      setErrorEncuesta('');
    }
  };

  const alternarLikeComentario = (comment: Comment) => {
    if (!currentUser) {
      void toggleCommentLike(comment.id);
      return;
    }

    const uid = currentUser.uid;
    const estaba = comment.likedBy?.includes(uid) ?? false;
    marcarLikeComentarioLocal(comment.id, uid, !estaba);

    void toggleCommentLike(comment.id).then((ok) => {
      if (!ok) marcarLikeComentarioLocal(comment.id, uid, estaba);
    });
  };

  const handleCommentSubmit = async (threadId: string, e: React.FormEvent) => {
    e.preventDefault();
    // Un comentario puede no tener texto si lleva un GIF.
    if (!newCommentText.trim() && !commentGif) return;
    const ok = await addComment(
      'thread',
      threadId,
      newCommentText,
      null,
      commentImageUrl,
      commentGif ?? undefined,
      commentImageDims,
    );
    if (ok) {
      setNewCommentText('');
      setCommentImageUrl('');
      setCommentImageDims(null);
      setCommentGif(null);
    }
  };

  const handleReplySubmit = async (threadId: string, parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !replyGif) return;
    const ok = await addComment('thread', threadId, replyText, parentId, undefined, replyGif ?? undefined);
    if (ok) {
      setReplyText('');
      setReplyGif(null);
      setReplyingToCommentId(null);
    }
  };

  const handleShare = (thread: Thread) => {
    // El dominio se toma de la barra de direcciones para que el enlace
    // funcione igual en vercel.app y en el dominio propio, sin tener
    // que tocar código al mudarse.
    const base = `${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(`${base}?tab=inicio&hilo=${thread.id}`);
    setCopiedShareId(thread.id);
    setTimeout(() => setCopiedShareId(null), 2000);
  };

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteThread = async (thread: Thread) => {
    if (deleting) return;
    setDeleting(true);
    const ok = await deleteThread(thread.id);
    setDeleting(false);
    if (ok) {
      setConfirmingDeleteId(null);
      setExpandedThreadId((prev) => (prev === thread.id ? null : prev));
    }
  };

  /**
   * Borra un comentario.
   *
   * Son dos estados y no uno, que es lo que faltaba antes: el
   * botón se ponía a sí mismo en "¿Seguro?" con un spinner
   * girando, y no había forma de decir que sí ni de echarla
   * atrás. Con dos clics en el mismo icono cuesta adivinar que
   * el segundo es el que borra, y el spinner parecía una
   * operación eternamente en curso.
   *
   * Ahora el flujo es el mismo que el del hilo: 🗑 pide
   * confirmación, y salen "Sí, borrar" y "Cancelar". El spinner
   * aparece solo mientras la escritura está en marcha, y si
   * falla se avisa y el comentario sigue ahí.
   *
   * Si se estaba respondiendo justo a ese comentario, el
   * formulario se cierra: si no, se queda escribiendo en el
   * vacío.
   */
  const handleDeleteComment = async (commentId: string) => {
    if (borrandoAhora === commentId) return;

    setBorrandoAhora(commentId);
    const ok = await deleteComment(commentId);
    setBorrandoAhora(null);

    if (ok) {
      setConfirmandoBorrar(null);
      setReplyingToCommentId((prev) => (prev === commentId ? null : prev));
      avisar('Comentario borrado.');
    } else {
      avisar('No se pudo borrar el comentario.', 4000);
    }
  };

  // Filter & sort
  const usaHistoricoCompleto =
    Boolean(selectedCategoryFilter) || feedSort === 'popular';

  // En vez de cambiar todo el feed al histórico cuando llega un
  // aviso, se añade SOLO el hilo enfocado a la página reciente. Así
  // un hilo antiguo aparece sin renderizar cientos de tarjetas.
  const hiloDestacado = hiloEnfocado
    ? allThreads.find((t) => t.id === hiloEnfocado) ??
      threads.find((t) => t.id === hiloEnfocado) ??
      null
    : null;

  let fuenteHilos: Thread[];
  if (usaHistoricoCompleto && allThreads.length > 0) {
    fuenteHilos = allThreads;
  } else if (hiloDestacado && !threads.some((t) => t.id === hiloDestacado.id)) {
    fuenteHilos = [hiloDestacado, ...threads];
  } else {
    fuenteHilos = threads;
  }

  let filtered = [...fuenteHilos];
  if (selectedCategoryFilter) {
    filtered = filtered.filter((t) => t.categoryId === selectedCategoryFilter);
  }

  if (feedSort === 'popular') {
    filtered.sort((a, b) => b.likesCount - a.likesCount);
  } else {
    // Recent first, pinned stay on top
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // ======================================================
  // REACCIONES DE LO QUE SE ESTÁ VIENDO
  // ======================================================
  //
  // Los hilos, todos los que salen en el feed: la barrita de
  // reacciones se ve aunque el hilo esté plegado. Los
  // comentarios, solo los del hilo abierto, que es el único
  // que los pinta.
  //
  // Así no se abren escuchas de reacciones de comentarios que
  // nadie está viendo, que es como se cargaba la página antes.
  const objetivosReaccion = useMemo(() => {
    const objetivos: { targetType: 'thread' | 'comment'; targetId: string }[] = filtered.map(
      (t) => ({ targetType: 'thread' as const, targetId: t.id }),
    );

    if (expandedThreadId) {
      comentariosHiloAbierto.forEach((c) =>
        objetivos.push({ targetType: 'comment', targetId: c.id }),
      );
    }

    return objetivos;
  }, [filtered, expandedThreadId, comentariosHiloAbierto]);

  const { de: reacciones, mias: misReacciones } = useReacciones(objetivosReaccion);

  return (
    <div className="space-y-6">
      {/* 1. VISIÓN DEL PROYECTO & HERO EXPLICATIVO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#10101a] via-[#0c0c14] to-[#12102a] p-6 sm:p-8 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/12 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
            <Sparkles size={13} className="text-violet-300" />
            <span>La nueva comunidad Otaku & Geek</span>
          </div>

          <h1 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-white">
            {settings.welcomeTitle}{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              {settings.welcomeHighlight}
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl whitespace-pre-line break-words">
            {settings.welcomeText}
          </p>

          {/* Quick auth bar if not logged in */}
          {!currentUser ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.06]">
              <span className="text-xs text-zinc-400 font-medium">
                ¿Aún no tienes cuenta?
              </span>
              <button
                onClick={() => openAuth('register')}
                className="chat-boton rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 transition-all"
              >
                Crear cuenta gratis
              </button>
              <button
                onClick={() => openAuth('login')}
                className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-600 hover:text-white transition-all"
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
              <span>Sesión activa como <strong className="text-violet-300">@{currentUser.username}</strong></span>
              <span className="text-zinc-600">•</span>
              <span>ID de Chat: <code className="font-mono text-zinc-300 bg-white/[0.05] px-1.5 py-0.5 rounded">{currentUser.chatId}</code></span>
            </div>
          )}
        </div>
      </section>

      {/* 2. FEED TOOLBAR & CATEGORY BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedSort('recent')}
            className={`chat-boton flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              feedSort === 'recent'
                ? 'border border-violet-400/25 bg-violet-500/15 text-violet-200'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
          >
            <Clock size={14} />
            <span>Recientes</span>
          </button>
          <button
            onClick={() => setFeedSort('popular')}
            className={`chat-boton flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              feedSort === 'popular'
                ? 'border border-violet-400/25 bg-violet-500/15 text-violet-200'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
          >
            <TrendingUp size={14} />
            <span>Más Populares</span>
          </button>
        </div>

        {selectedCategoryFilter && (
          <div className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
            <span>Filtrado por categoría activa</span>
            <button
              onClick={onClearCategoryFilter}
              className="text-violet-400 hover:text-white font-bold ml-1"
            >
              ✕ Quitar
            </button>
          </div>
        )}

        <button
          onClick={() => {
            const ok = requireAuth('crear un hilo nuevo', () => setShowCreateThread(true));
            if (ok) setShowCreateThread(!showCreateThread);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 transition-all"
        >
          <PlusCircle size={16} />
          <span>Abrir Nuevo Hilo</span>
        </button>
      </div>

      {/* 3. FORMULARIO CREAR HILO */}
      {showCreateThread && (
        <form
          onSubmit={handleCreateThreadSubmit}
          className="rounded-3xl border border-violet-500/30 bg-zinc-900/95 p-5 sm:p-6 shadow-2xl animate-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              <span>Publicar Nuevo Hilo en Geekapoo</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateThread(false)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Título del Hilo o Debate
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué opináis del final de...? / Debate sobre animación en..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-base sm:text-xs text-white focus:border-violet-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Etiquetas Personalizadas (separadas por comas)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Kaguya, Manga, Spoilers, Debate2026"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Contenido / Argumentación
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Desarrolla tu punto de vista, teorías o curiosidades..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div>
              <span className="mb-1 block text-xs font-medium text-zinc-300">
                Imagen (opcional)
              </span>
              <AttachImage
                uid={currentUser?.uid}
                value={threadImageUrl}
                onChange={setThreadImageUrl}
                onDims={setThreadImageDims}
                size="md"
              />
            </div>

            {/* ── Encuesta (opcional) ─────────────────── */}
            <div>
              {conEncuesta ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                      <BarChart3 size={13} className="text-violet-400" />
                      Encuesta del hilo
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConEncuesta(false);
                        setErrorEncuesta('');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
                    >
                      <X size={11} />
                      Quitar encuesta
                    </button>
                  </div>

                  <PollComposer
                    value={borradorEncuesta}
                    onChange={setBorradorEncuesta}
                    error={errorEncuesta}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConEncuesta(true)}
                  className="chat-boton chat-boton inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet-400/25 px-3 py-2 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-200"
                >
                  <PlusCircle size={13} />
                  Añadir encuesta
                </button>
              )}
            </div>

            {/* ── Tier list (opcional) ──────────────── */}
            <div>
              {tierAdjunta ? (
                <div className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-950/30 px-3 py-2">
                  <Trophy size={13} className="flex-shrink-0 text-violet-400" />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">
                    {tierAdjunta.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTierAdjunta(null)}
                    className="flex-shrink-0 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      requireAuth('crear una tier list');
                      return;
                    }
                    setEditorTier({ modo: 'nuevo', paraComposer: true });
                  }}
                  className="chat-boton chat-boton inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet-400/25 px-3 py-2 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-200"
                >
                  <Trophy size={13} />
                  Crear tier list
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateThread(false)}
                className="chat-boton rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="chat-boton rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 transition-all"
              >
                Publicar Hilo
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4. LISTADO DE HILOS */}
      <div className="space-y-4">
        {filtered.map((thread) => {
          const isLiked = currentUser ? thread.likedBy?.includes(currentUser.uid) : false;
          const isExpanded = expandedThreadId === thread.id;
          const threadComments = isExpanded ? comentariosHiloAbierto : [];

          return (
            <article
              key={thread.id}
              // Permite saltar hasta la tarjeta desde el perfil,
              // el buscador o la barra lateral. El `scroll-mt`
              // deja aire bajo el navbar fijo para que el salto
              // no esconda el encabezado.
              id={`thread-${thread.id}`}
              className={`scroll-mt-20 rounded-3xl border transition-all ${
                highlightThreadId === thread.id
                  ? 'border-violet-400 ring-2 ring-violet-500/40 shadow-lg shadow-violet-900/40'
                  : thread.pinned
                    ? 'border-violet-400/20 bg-gradient-to-b from-violet-500/10 via-[#0c0c14] to-[#0c0c14] p-6 shadow-lg shadow-violet-950/20'
                    : 'border-white/[0.06] bg-[#0d0d15]/80 hover:border-white/[0.1] p-6'
              }`}
            >
              {/* Header: Author + Pin + Category.
                  En móvil la categoría puede pasar a la línea de
                  abajo. Sin `flex-wrap` y `min-w-0`, una categoría
                  larga se estrechaba hasta quedar en varias líneas
                  mientras el autor se pintaba por encima. */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Avatar y nombre van al perfil de quien escribió.
                      El avatar es el blanco más obvio: en una tarjeta
                      estrecha el nombre acaba en "…" y la foto se
                      lee siempre. */}
                  <button
                    type="button"
                    onClick={() => goToProfile(thread.authorId)}
                    aria-label={`Ver el perfil de ${nombreDe(thread.authorId, thread.authorName)}`}
                    title="Ver su perfil"
                    className="flex-shrink-0 rounded-2xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                  >
                    <img
                      src={avatarDe(thread.authorId, thread.authorAvatar)}
                      alt=""
                      className="h-10 w-10 rounded-2xl object-cover ring-2 ring-violet-400/25"
                    />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Nombre con rol y título. El "flex-1 min-w-0" no
                          es de adorno: sin él, un título largo
                          empuja el "Fijado" fuera del hueco. */}
                      <div className="min-w-0 flex-1">
                        <AuthorBadge
                          authorId={thread.authorId}
                          nombre={nombreDe(thread.authorId, thread.authorName)}
                        />
                      </div>

                      {thread.pinned && (
                        <span className="flex flex-shrink-0 items-center gap-1 rounded-md border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                          <Pin size={10} />
                          Fijado
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(thread.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <span className="ml-auto max-w-full break-words rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-right text-[11px] font-medium text-violet-300">
                  {thread.categoryName}
                </span>
              </div>

              {/* Title & Body */}
              <div className="mt-4">
                <h2 className="text-lg sm:text-lg font-black tracking-tight text-white hover:text-violet-300 transition-colors break-words">
                  {thread.title}
                </h2>
                {/* `break-words`: un enlace largo sin espacios
                    ensanchaba la tarjeta más que la pantalla y la
                    página se podía mover de lado, con el navbar
                    incluido. */}
                <p className="mt-2 text-[15px] sm:text-sm leading-relaxed text-zinc-300 whitespace-pre-line break-words">
                  {thread.body}
                </p>

                {/* Imagen adjunta al hilo.
                    Se enseña ENTERA y con su proporción, sea la que
                    sea (vertical, cuadrada, panorámica o recortada
                    por el usuario en el editor): `h-auto` calcula la
                    altura desde la proporción real, y sin `max-h` ni
                    contenedor con altura no hay nada que recorte.

                    Antes llevaba `w-full max-h-96 object-cover`: con
                    la altura capada a 24rem y `cover`, una vertical se
                    convertía en una franja horizontal mostrando solo
                    el centro. Por eso NO se vuelve a poner ni altura
                    fija, ni `max-h`, ni `cover` aquí.

                    Sin `w-full` a propósito: con `max-w-full` las
                    grandes llenan el ancho igualmente, y las pequeñas
                    se quedan a su tamaño en vez de estirarse borrosas
                    hasta el borde. */}
                {thread.imageUrl && (
                  <StableImage
                    src={thread.imageUrl}
                    alt="Imagen adjunta al hilo"
                    width={thread.imageWidth}
                    height={thread.imageHeight}
                    unknownRatio="16 / 9"
                    className="block h-auto max-w-full rounded-2xl border border-white/[0.06] object-contain"
                    wrapperClassName="mt-3 overflow-hidden rounded-2xl"
                    eager={hiloEnfocado === thread.id}
                  />
                )}

                {/* Encuesta, si el autor añadió una al publicar */}
                {thread.poll && (
                  <PollCard
                    threadId={thread.id}
                    poll={thread.poll}
                    onVotar={voteInPoll}
                    // Cerrar una encuesta es cosa del autor o del
                    // equipo. Aquí solo se decide si se pinta el
                    // botón: quien no puede, no lo ve (y si se
                    // fuerza desde la consola, lo para la regla).
                    puedeCerrar={canEditThread(thread)}
                    onCerrar={setPollClosed}
                  />
                )}

                {/* Tier list adjunta: se renderiza dentro del hilo. */}
                {thread.tierList && (
                  <TierListCard
                    referencia={thread.tierList}
                    onAbrir={(id) => setVisorTierId(id)}
                  />
                )}

                {/* Adjuntar tier list a un hilo propio sin ella. */}
                {!thread.tierList && canEditThread(thread) && thread.authorId === currentUser?.uid && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        requireAuth('adjuntar una tier list');
                        return;
                      }
                      setEditorTier({ modo: 'nuevo', attachThreadId: thread.id });
                    }}
                    className="chat-boton mt-3 chat-boton inline-flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:border-violet-400/40 hover:text-violet-200"
                  >
                    <Trophy size={12} />
                    Adjuntar tier list
                  </button>
                )}
              </div>

              {/* Tags */}
              {thread.tags && thread.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400"
                    >
                      <Tag size={10} className="text-violet-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Interactions Bar */}
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Like Button */}
                  <button
                    onClick={() => toggleThreadLike(thread.id, isLiked)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isLiked
                        ? 'border border-pink-400/25 bg-pink-500/15 text-pink-300'
                        : 'border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    <Heart
                      size={15}
                      className={isLiked ? 'fill-pink-500 text-pink-500' : ''}
                    />
                    <span className="font-mono">{thread.likesCount}</span>
                    <span className="hidden sm:inline">Me gusta</span>
                  </button>

                  {/* Comments Trigger */}
                  <button
                    onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isExpanded
                        ? 'border border-violet-400/25 bg-violet-500/15 text-violet-200'
                        : 'border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    <MessageSquare size={15} />
                    <span className="font-mono">
                      {isExpanded ? threadComments.length : thread.commentsCount}
                    </span>
                    <span className="hidden sm:inline">Comentarios</span>
                  </button>

                  {/* Reacciones. Van al lado del "Me gusta", que
                      sigue igual: son dos sistemas distintos y
                      ninguno replaces al otro. */}
                  <ReactionBar
                    targetType="thread"
                    targetId={thread.id}
                    datos={reaccionesDe(reacciones, 'thread', thread.id)}
                    mia={misReacciones[reactionKey('thread', thread.id)]}
                    onElegir={(tipo) =>
                      toggleReaction(
                        'thread',
                        thread.id,
                        tipo,
                        misReacciones[reactionKey('thread', thread.id)],
                      )
                    }
                  />
                </div>

                  <div className="flex items-center gap-4">
                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(thread)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-300 transition-colors"
                  title="Copiar enlace del hilo"
                >
                  {copiedShareId === thread.id ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400 text-xs">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span className="hidden sm:inline">Compartir</span>
                    </>
                  )}
                </button>

                {/* Delete Button: solo para el autor del hilo o un admin */}
                {canEditThread(thread) && (
                  <div className="flex items-center gap-2">
                    {confirmingDeleteId === thread.id ? (
                      <>
                        <span className="hidden sm:inline text-[11px] text-zinc-400">
                          ¿Seguro?
                        </span>
                        <button
                          onClick={() => handleDeleteThread(thread)}
                          disabled={deleting}
                          className="chat-boton rounded-xl bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                        >
                          {deleting ? 'Borrando...' : 'Sí, borrar'}
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteId(null)}
                          className="chat-boton rounded-xl bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteId(thread.id)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                        title="Eliminar hilo"
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Reportar el hilo. Va FUERA del bloque de
                    moderación a propósito: es la acción que puede
                    hacer cualquiera, y esconderla tras "solo si
                    eres del equipo" haría que la comunidad no
                    tuviera forma de denunciar nada. */}
                <button
                  onClick={() => setReporteando({ tipo: 'thread', id: thread.id })}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-amber-400"
                  title="Reportar hilo"
                  aria-label="Reportar hilo"
                >
                  <Flag size={14} />
                  <span className="hidden sm:inline">Reportar</span>
                </button>
              </div>
            </div>

              {/* EXPANDED COMMENTS SECTION */}
              {isExpanded && (
                <div className="mt-5 border-t border-white/[0.06] pt-5 space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Comentarios del hilo ({threadComments.length})
                  </h4>

                  {/* Add top-level comment input */}
                  <form
                    onSubmit={(e) => handleCommentSubmit(thread.id, e)}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={
                          currentUser
                            ? 'Escribe tu opinión respetuosa...'
                            : 'Inicia sesión para opinar...'
                        }
                        className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="chat-boton flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 transition-all"
                      >
                        <Send size={13} />
                        <span>Comentar</span>
                      </button>
                    </div>

                    {/* Imagen o GIF, nunca los dos. El GIF no se
                        sube a Storage: se guarda su ficha y el
                        archivo se sigue sirviendo desde el CDN del
                        proveedor. */}
                    <div className="flex flex-wrap items-center gap-3">
                      <AttachImage
                        uid={currentUser?.uid}
                        value={commentImageUrl}
                        onChange={setCommentImageUrl}
                        onDims={setCommentImageDims}
                      />
                      {!commentImageUrl && (
                        <GifPicker value={commentGif} onChange={setCommentGif} />
                      )}
                    </div>
                  </form>

                  {hayComentariosAnteriores && (
                    <button
                      type="button"
                      onClick={() => void cargarComentariosAnteriores()}
                      disabled={cargandoComentariosAnteriores}
                      className="mx-auto flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-400/30 hover:text-violet-200 disabled:opacity-60"
                    >
                      {cargandoComentariosAnteriores && (
                        <Loader2 size={11} className="animate-spin" />
                      )}
                      {cargandoComentariosAnteriores
                        ? 'Cargando...'
                        : 'Cargar comentarios anteriores'}
                    </button>
                  )}

                  {/* List of comments & replies */}
                  <div className="space-y-3 pt-2">
                    {threadComments
                      .filter((c) => !c.parentId)
                      .map((comment) => {
                        const commentLiked = currentUser
                          ? comment.likedBy?.includes(currentUser.uid)
                          : false;
                        const replies = threadComments.filter((r) => r.parentId === comment.id);

                        return (
                          <div
                            key={comment.id}
                            // Permite que el perfil salte hasta este
                            // comentario concreto con scrollIntoView.
                            // El `scroll-mt` lo deja visible bajo el
                            // navbar fijo.
                            id={`comment-${comment.id}`}
                            className={`scroll-mt-20 rounded-2xl border p-4 space-y-2.5 transition-colors ${
                              highlightCommentId === comment.id
                                ? 'border-violet-400 ring-2 ring-violet-400/30 bg-violet-500/10'
                                : 'border-white/[0.06] bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => goToProfile(comment.authorId)}
                                  aria-label={`Ver el perfil de ${nombreDe(comment.authorId, comment.authorName)}`}
                                  title="Ver su perfil"
                                  className="flex-shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                                >
                                  <img
                                    src={avatarDe(comment.authorId, comment.authorAvatar)}
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                </button>
                                <div className="min-w-0 flex-1">
                                  <AuthorBadge
                                    authorId={comment.authorId}
                                    nombre={`@${nombreDe(comment.authorId, comment.authorName)}`}
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-500">
                                {new Date(comment.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>

                            <p className="text-[15px] text-zinc-300 leading-relaxed pl-8 break-words">
                              {comment.body}
                            </p>

                            {/* GIF adjunto al comentario */}
                            {comment.gif && (
                              <CommentGif
                                gif={comment.gif}
                                className="pl-8"
                                eager={comentarioEnfocadoPersistente === comment.id}
                              />
                            )}

                            {/* Imagen adjunta al comentario.

                                  El `object-cover` de aquí no hacía
                                  NADA: sin un contenedor con
                                  proporción, la caja de la imagen
                                  es la propia imagen, y `cover` solo
                                  se nota cuando altura y anchura
                                  están fijadas. Una captura de
                                  pantalla o un cartel se perdían.

                                  Por eso aquí NO se recorta: la
                                  imagen se ve ENTERA, con su
                                  proporción, limitada por
                                  `max-h` para que no coma el
                                  comentario entero. Si hay que
                                  ampliar, se abre en otra pestaña
                                  pulsando, que es lo que hace el
                                  contenedor `<a>` de arriba.

                                  Y nada de `pl-8` como espaciado:
                                  eso empujaba 32 px de hueco
                                  DENTRO de la caja de la imagen y
                                  la imagen se salía de la tarjeta en
                                  móvil. El hueco va con `ml`, que no
                                  toca la caja. */}
                              {comment.imageUrl && (
                                <StableImage
                                  src={comment.imageUrl}
                                  alt="Imagen adjunta al comentario"
                                  width={comment.imageWidth}
                                  height={comment.imageHeight}
                                  unknownRatio="4 / 3"
                                  // 288 = el `max-h-72` de siempre: la
                                  // reserva se capa igual que la imagen
                                  // final para no reservar de más.
                                  maxHeight={288}
                                  className="block h-auto max-h-72 max-w-full rounded-xl border border-white/[0.06] object-contain"
                                  wrapperClassName="ml-8 mt-1 overflow-hidden rounded-xl"
                                  eager={comentarioEnfocadoPersistente === comment.id}
                                />
                              )}

                            <div className="flex flex-wrap items-center gap-3 pl-8 pt-1 text-[11px]">
                              <button
                                onClick={() => alternarLikeComentario(comment)}
                                className={`chat-boton flex items-center gap-1 font-mono transition-colors ${
                                  commentLiked ? 'text-pink-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                <Heart
                                  size={12}
                                  className={commentLiked ? 'fill-pink-500 text-pink-500' : ''}
                                />
                                <span>{comment.likesCount}</span>
                              </button>

                              <ReactionBar
                                targetType="comment"
                                targetId={comment.id}
                                datos={reaccionesDe(reacciones, 'comment', comment.id)}
                                mia={misReacciones[reactionKey('comment', comment.id)]}
                                onElegir={(tipo) =>
                                  toggleReaction(
                                    'comment',
                                    comment.id,
                                    tipo,
                                    misReacciones[reactionKey('comment', comment.id)],
                                  )
                                }
                              />

                              <button
                                onClick={() => {
                                  const ok = requireAuth('responder a este comentario');
                                  if (ok) {
                                    setReplyingToCommentId(
                                      replyingToCommentId === comment.id ? null : comment.id
                                    );
                                  }
                                }}
                                className="text-zinc-400 hover:text-violet-300 transition-colors font-semibold"
                              >
                                Responder
                              </button>

                              {/* Moderación y denuncia.
                                  El botón de borrar aparece si eres
                                  quien lo escribió (las reglas ya lo
                                  permitían antes, pero no había
                                  forma de hacerlo desde la web) o si
                                  eres del equipo. Para el resto está
                                  el de reportar, que no borra nada:
                                  solo deja constancia para el
                                  panel.

                                  La confirmación tiene sus propios
                                  botones y NO reutiliza el 🗑: si el
                                  mismo icono tuviera que confirmar,
                  no habría forma de decir que no. */}
                              {(puedeModerar || comment.authorId === currentUser?.uid) &&
                                (confirmandoBorrar === comment.id ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-zinc-300">
                                      ¿Seguro?
                                    </span>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      disabled={borrandoAhora === comment.id}
                                      className="chat-boton chat-boton rounded-xl bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                                    >
                                      {borrandoAhora === comment.id ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        'Sí, borrar'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setConfirmandoBorrar(null)}
                                      disabled={borrandoAhora === comment.id}
                                      className="chat-boton chat-boton rounded-xl bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-60"
                                    >
                                      Cancelar
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setConfirmandoBorrar(comment.id)}
                                    title="Borrar comentario"
                                    aria-label="Borrar comentario"
                                    className="flex items-center gap-1 font-semibold text-zinc-500 transition-colors hover:text-red-400"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                ))}

                              <button
                                onClick={() => setReporteando({ tipo: 'comment', id: comment.id })}
                                title="Reportar comentario"
                                aria-label="Reportar comentario"
                                className="flex items-center gap-1 font-semibold text-zinc-500 transition-colors hover:text-amber-400"
                              >
                                <Flag size={11} />
                              </button>
                            </div>

                            {/* Reply Input */}
                            {replyingToCommentId === comment.id && (
                              <form
                                onSubmit={(e) => handleReplySubmit(thread.id, comment.id, e)}
                                className="mt-2 space-y-2 pl-8 animate-in fade-in duration-150"
                              >
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Respondiendo a @${comment.authorName}...`}
                                    className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    className="chat-boton shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-950/40 hover:brightness-110"
                                  >
                                    Enviar
                                  </button>
                                </div>
                                <GifPicker value={replyGif} onChange={setReplyGif} />
                              </form>
                            )}

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className="ml-8 mt-3 space-y-2 border-l-2 border-white/[0.06] pl-3">
                                {replies.map((reply) => {
                                  const replyLiked = currentUser
                                    ? reply.likedBy?.includes(currentUser.uid)
                                    : false;
                                  return (
                                    <div
                                      key={reply.id}
                                      // Los avisos también llegan a
                                      // respuestas: mismo ancla que los
                                      // comentarios, con aire bajo el
                                      // navbar.
                                      id={`comment-${reply.id}`}
                                      className="scroll-mt-20 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
<div className="flex items-center gap-1.5">
                                           <CornerDownRight size={12} className="flex-shrink-0 text-violet-400" />
                                           <button
                                             type="button"
                                             onClick={() => goToProfile(reply.authorId)}
                                             aria-label={`Ver el perfil de ${nombreDe(reply.authorId, reply.authorName)}`}
                                             title="Ver su perfil"
                                             className="flex-shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                                           >
                                             <img
                                               src={avatarDe(reply.authorId, reply.authorAvatar)}
                                               alt=""
                                               className="h-5 w-5 rounded-full object-cover"
                                             />
                                           </button>
                                           {/* "compacta": las respuestas
                                               van dentro de una respuesta,
                                               y con el título entero la
                                               línea se desborda. */}
                                           <div className="min-w-0 flex-1">
                                             <AuthorBadge
                                               authorId={reply.authorId}
                                               nombre={`@${nombreDe(reply.authorId, reply.authorName)}`}
                                               tamano="sm"
                                             />
                                           </div>
                                         </div>
                                        <span className="text-[10px] text-zinc-500">
                                          {new Date(reply.createdAt).toLocaleDateString('es-ES')}
                                        </span>
                                      </div>
                                       <p className="text-xs text-zinc-300 pl-5">{reply.body}</p>
                                       {reply.gif && (
                                         <CommentGif
                                           gif={reply.gif}
                                           className="pl-5"
                                           eager={comentarioEnfocadoPersistente === reply.id}
                                         />
                                       )}
                                       {/* Las respuestas ya no suben
                                           imagen, pero las antiguas
                                           pueden traerla: se pinta
                                           igual que en comentarios. */}
                                       {reply.imageUrl && (
                                         <StableImage
                                           src={reply.imageUrl}
                                           alt="Imagen adjunta a la respuesta"
                                           width={reply.imageWidth}
                                           height={reply.imageHeight}
                                            unknownRatio="4 / 3"
                                           maxHeight={288}
                                           className="block h-auto max-h-72 max-w-full rounded-xl border border-white/[0.06] object-contain"
                                           wrapperClassName="ml-5 overflow-hidden rounded-xl"
                                           eager={comentarioEnfocadoPersistente === reply.id}
                                         />
                                       )}
                                       <div className="flex flex-wrap items-center gap-3 pl-5 pt-1">
                                         <button
                                           onClick={() => alternarLikeComentario(reply)}
                                           className={`flex items-center gap-1 text-[11px] font-mono ${
                                             replyLiked ? 'text-pink-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                                           }`}
                                         >
                                           <Heart
                                             size={11}
                                             className={replyLiked ? 'fill-pink-500 text-pink-500' : ''}
                                           />
                                           <span>{reply.likesCount}</span>
                                         </button>

                                          <ReactionBar
                                            compacta
                                            targetType="comment"
                                            targetId={reply.id}
                                            datos={reaccionesDe(reacciones, 'comment', reply.id)}
                                            mia={misReacciones[reactionKey('comment', reply.id)]}
                                            onElegir={(tipo) =>
                                              toggleReaction(
                                                'comment',
                                                reply.id,
                                                tipo,
                                                misReacciones[reactionKey('comment', reply.id)],
                                              )
                                            }
                                          />

                                          {/* Una respuesta es un
                                              comentario con
                                              `parentId`, así que se
                                              borra y se reporta
                                              exactamente igual. Sin
                                              esto, un moderador
                                              podría quitar el
                                              comentario ofensivo y
                                              dejarse la respuesta
                                              debajo. */}
                                          {(puedeModerar ||
                                            reply.authorId === currentUser?.uid) &&
                                            (confirmandoBorrar === reply.id ? (
                                              <span className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleDeleteComment(reply.id)}
                                                  disabled={borrandoAhora === reply.id}
                                                  className="chat-boton chat-boton rounded-xl bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                                                >
                                                  {borrandoAhora === reply.id ? (
                                                    <Loader2 size={10} className="animate-spin" />
                                                  ) : (
                                                    'Sí, borrar'
                                                  )}
                                                </button>
                                                <button
                                                  onClick={() => setConfirmandoBorrar(null)}
                                                  className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
                                                >
                                                  No
                                                </button>
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() => setConfirmandoBorrar(reply.id)}
                                                title="Borrar respuesta"
                                                aria-label="Borrar respuesta"
                                                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            ))}

                                          <button
                                            onClick={() => setReporteando({ tipo: 'comment', id: reply.id })}
                                            title="Reportar respuesta"
                                            aria-label="Reportar respuesta"
                                            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-amber-400"
                                          >
                                            <Flag size={11} />
                                          </button>
                                        </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {!usaHistoricoCompleto && hasMoreThreads && (
          <button
            type="button"
            onClick={() => void loadMoreThreads()}
            disabled={loadingMoreThreads}
            className="chat-boton flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 text-xs font-bold text-zinc-400 transition-colors hover:border-violet-400/40 hover:text-white disabled:opacity-60"
          >
            {loadingMoreThreads && <Loader2 size={13} className="animate-spin" />}
            {loadingMoreThreads ? 'Cargando...' : 'Cargar publicaciones anteriores'}
          </button>
        )}

        {/* Aviso de moderación. Va al pie de la lista y no junto
            al comentario: si saliera al lado del botón que se ha
            pulsado, en un hilo con veinte comentarios no se sabría
            cuál se ha borrado. */}
        {avisoModeracion && (
          <p className="geo-aparece fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-zinc-900/95 px-4 py-2.5 text-xs font-semibold text-violet-200 shadow-2xl backdrop-blur">
            {avisoModeracion}
          </p>
        )}

        {/* El diálogo de denuncia. Está aquí y no dentro de cada
            tarjeta porque es uno solo para toda la página: se
            abre con el contenido a denunciar y se cierra al
            enviar o cancelar. */}
        {reporteando && (
          <ReportDialog
            targetType={reporteando.tipo}
            targetId={reporteando.id}
            que={reporteando.tipo === 'thread' ? 'este hilo' : 'este comentario'}
            onCerrar={() => setReporteando(null)}
            onReportado={(estado) =>
              avisar(
                estado === 'ya-reportado'
                  ? 'Ya lo habías reportado. Gracias.'
                  : 'Reporte enviado. Gracias por avisar.',
              )
            }
          />
        )}

        {/* Visor de tier list (desde tarjetas de hilos). */}
        {visorTierId && (
          <TierListViewer
            tierListId={visorTierId}
            onUsarPlantilla={(tier) => {
              setVisorTierId(null);
              setEditorTier({
                modo: 'nuevo',
                initial: {
                  ...borradorDesdeDoc(tier),
                  title: `Mi versión: ${tier.title}`.slice(0, 80),
                },
                originId: tier.id,
                originTitle: tier.title,
              });
            }}
            onEditar={(tier) => {
              setVisorTierId(null);
              setEditorTier({
                modo: 'editar',
                tierListId: tier.id,
                initial: borradorDesdeDoc(tier),
              });
            }}
            onClose={() => setVisorTierId(null)}
          />
        )}

        {/* Editor de tier lists (crear, plantilla, editar, adjuntar). */}
        {editorTier && (
          <TierListEditor
            modo={editorTier.modo}
            initial={editorTier.initial}
            originId={editorTier.originId}
            originTitle={editorTier.originTitle}
            onGuardar={guardarTierList}
            onGuardado={trasGuardarTier}
            onClose={() => setEditorTier(null)}
          />
        )}
      </div>
    </div>
  );
};
