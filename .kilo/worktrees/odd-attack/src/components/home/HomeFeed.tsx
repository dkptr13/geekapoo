import React, { useEffect, useMemo, useState } from 'react';
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
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthorBadge } from '../gamification/AuthorBadge';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { useCommunity } from '../../context/CommunityContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { reaccionesDe, useReacciones } from '../../hooks/useReacciones';
import { reactionKey } from '../../services/reactions';
import { normalizarPoll } from '../../services/polls';
import { AttachImage } from '../community/AttachImage';
import { PollCard } from '../community/PollCard';
import { ReactionBar } from '../community/ReactionBar';
import { CommentGif } from '../community/CommentGif';
import { GifPicker } from '../community/GifPicker';
import {
  POLL_VACIO,
  PollComposer,
  draftANewPoll,
  type PollDraft,
} from '../community/PollComposer';
import { Thread, GifAttachment, NewPollInput } from '../../types';

interface HomeFeedProps {
  onGoToAnime?: (slug: string) => void;
  selectedCategoryFilter?: string | null;
  onClearCategoryFilter?: () => void;
  /** Hilo (y opcionalmente comentario) al que hay que saltar. */
  focusTarget?: {
    threadId: string;
    commentId?: string;
    nonce: number;
  } | null;
  /** Se avisa en cuanto el salto se ha aplicado, para no repetirlo. */
  onFocusHandled?: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  selectedCategoryFilter,
  onClearCategoryFilter,
  focusTarget,
  onFocusHandled,
}) => {
  const { currentUser, requireAuth, openAuth } = useAuth();
  const {
    threads,
    createThread,
    toggleThreadLike,
    getCommentsForTarget,
    addComment,
    toggleCommentLike,
    categories,
    deleteThread,
    canEditThread,
    voteInPoll,
    setPollClosed,
    toggleReaction,
  } = useCommunity();
  const { settings } = useSiteContent();
  const goToProfile = useGoToProfile();

  // Create thread form state
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  // Imagen adjunta pendiente de publicar. Se sube al elegirla
  // y la URL se escribe al enviar.
  const [threadImageUrl, setThreadImageUrl] = useState('');
  const [commentImageUrl, setCommentImageUrl] = useState('');

  // Encuesta del formulario. Apagada por defecto: publicar un
  // hilo con encuesta es opcional.
  const [conEncuesta, setConEncuesta] = useState(false);
  const [borradorEncuesta, setBorradorEncuesta] = useState<PollDraft>(POLL_VACIO);
  const [errorEncuesta, setErrorEncuesta] = useState('');

  // Las categorías llegan de Firestore, o sea después del primer render.
  // Antes esto era useState(CATEGORIES[0].id) sobre una constante de
  // código; con datos asíncronos, CATEGORIES[0] habría sido undefined
  // y la app habría petado al montar.
  useEffect(() => {
    setCategory((prev) => prev || categories[0]?.id || '');
  }, [categories]);

  // Expanded comments for thread
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentGif, setCommentGif] = useState<GifAttachment | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyGif, setReplyGif] = useState<GifAttachment | null>(null);

  // Sorting
  const [feedSort, setFeedSort] = useState<'recent' | 'popular'>('recent');
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);
  const [highlightThreadId, setHighlightThreadId] = useState<string | null>(null);

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
  useEffect(() => {
    if (!focusTarget) return;

    const { threadId, commentId } = focusTarget;

    setExpandedThreadId(threadId);
    setReplyingToCommentId(null);
    setHighlightThreadId(threadId);
    if (commentId) setHighlightCommentId(commentId);

    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget?.nonce]);

  // Desplaza hasta la tarjeta del hilo. Va en un efecto aparte
  // porque el de arriba corre antes de que el hilo se haya
  // pintado, y entonces el elemento aún no existe en el DOM.
  useEffect(() => {
    if (!highlightThreadId) return;

    const timer = setTimeout(() => {
      document
        .getElementById(`thread-${highlightThreadId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);

    const clear = setTimeout(() => setHighlightThreadId(null), 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(clear);
    };
  }, [highlightThreadId, expandedThreadId]);

  // Cuando el hilo ya está abierto en pantalla, se desplaza
  // hasta el comentario. Efecto aparte por el mismo motivo que
  // el de arriba: primero se pinta, luego se busca el elemento.
  useEffect(() => {
    if (!highlightCommentId) return;

    const timer = setTimeout(() => {
      document
        .getElementById(`comment-${highlightCommentId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);

    const clear = setTimeout(() => setHighlightCommentId(null), 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clear);
    };
  }, [highlightCommentId, expandedThreadId]);

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

    const success = await createThread(title, body, category, tags, threadImageUrl, poll);

    if (success) {
      setTitle('');
      setBody('');
      setTagsInput('');
      setThreadImageUrl('');
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
    );
    if (ok) {
      setNewCommentText('');
      setCommentImageUrl('');
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
    navigator.clipboard.writeText(`https://geekapoo.com/hilo/${thread.id}`);
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

  // Filter & sort
  let filtered = [...threads];
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
      getCommentsForTarget('thread', expandedThreadId).forEach((c) =>
        objetivos.push({ targetType: 'comment', targetId: c.id }),
      );
    }

    return objetivos;
  }, [filtered, expandedThreadId, getCommentsForTarget]);

  const { de: reacciones, mias: misReacciones } = useReacciones(objetivosReaccion);

  return (
    <div className="space-y-6">
      {/* 1. VISIÓN DEL PROYECTO & HERO EXPLICATIVO */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-violet-950/30 p-6 sm:p-8 shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <Sparkles size={13} className="text-violet-400" />
            <span>La nueva comunidad Otaku & Geek</span>
          </div>

          <h1 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-white">
            {settings.welcomeTitle}{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {settings.welcomeHighlight}
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl whitespace-pre-line">
            {settings.welcomeText}
          </p>

          {/* Quick auth bar if not logged in */}
          {!currentUser ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-medium">
                ¿Aún no tienes cuenta?
              </span>
              <button
                onClick={() => openAuth('register')}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
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
              <span>ID de Chat: <code className="font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">{currentUser.chatId}</code></span>
            </div>
          )}
        </div>
      </section>

      {/* 2. FEED TOOLBAR & CATEGORY BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedSort('recent')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              feedSort === 'recent'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>Recientes</span>
          </button>
          <button
            onClick={() => setFeedSort('popular')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              feedSort === 'popular'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Más Populares</span>
          </button>
        </div>

        {selectedCategoryFilter && (
          <div className="flex items-center gap-2 rounded-xl bg-violet-950/40 border border-violet-500/30 px-3 py-1 text-xs text-violet-300">
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
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:opacity-95 transition-all"
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
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
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
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none leading-relaxed"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet-500/40 px-3 py-2 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/70 hover:bg-violet-500/10 hover:text-violet-300"
                >
                  <PlusCircle size={13} />
                  Añadir encuesta
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateThread(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
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
          const threadComments = getCommentsForTarget('thread', thread.id);

          return (
            <article
              key={thread.id}
              // Permite saltar hasta la tarjeta desde el perfil,
              // el buscador o la barra lateral.
              id={`thread-${thread.id}`}
              className={`rounded-3xl border transition-all ${
                highlightThreadId === thread.id
                  ? 'border-violet-400 ring-2 ring-violet-500/40 shadow-lg shadow-violet-900/40'
                  : thread.pinned
                    ? 'border-violet-500/40 bg-gradient-to-b from-violet-950/20 via-zinc-900/90 to-zinc-900 p-6 shadow-lg shadow-violet-950/20'
                    : 'border-zinc-800/90 bg-zinc-900/80 hover:border-zinc-700/80 p-6'
              }`}
            >
              {/* Header: Author + Pin + Category */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar y nombre van al perfil de quien escribió.
                      El avatar es el blanco más obvio: en una tarjeta
                      estrecha el nombre acaba en "…" y la foto se
                      lee siempre. */}
                  <button
                    type="button"
                    onClick={() => goToProfile(thread.authorId)}
                    aria-label={`Ver el perfil de ${thread.authorName}`}
                    title="Ver su perfil"
                    className="flex-shrink-0 rounded-2xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                  >
                    <img
                      src={thread.authorAvatar}
                      alt=""
                      className="h-10 w-10 rounded-2xl object-cover ring-2 ring-violet-500/20"
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      {/* Nombre con rol y título. El "flex-1 min-w-0" no
                          es de adorno: sin él, un título largo
                          empuja el "Fijado" fuera del hueco. */}
                      <div className="min-w-0 flex-1">
                        <AuthorBadge
                          authorId={thread.authorId}
                          nombre={thread.authorName}
                        />
                      </div>

                      {thread.pinned && (
                        <span className="flex flex-shrink-0 items-center gap-1 rounded-md bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
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

                <span className="rounded-full bg-zinc-800/80 border border-zinc-700/50 px-3 py-1 text-[11px] font-medium text-violet-300">
                  {thread.categoryName}
                </span>
              </div>

              {/* Title & Body */}
              <div className="mt-4">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white hover:text-violet-300 transition-colors">
                  {thread.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                  {thread.body}
                </p>

                {/* Imagen adjunta al hilo */}
                {thread.imageUrl && (
                  <img
                    src={thread.imageUrl}
                    alt="Imagen adjunta al hilo"
                    className="mt-3 max-h-96 w-full rounded-2xl border border-zinc-800 object-cover"
                    loading="lazy"
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
              <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Like Button */}
                  <button
                    onClick={() => toggleThreadLike(thread.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isLiked
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
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
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <MessageSquare size={15} />
                    <span className="font-mono">{threadComments.length}</span>
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
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                        >
                          {deleting ? 'Borrando...' : 'Sí, borrar'}
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteId(null)}
                          className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
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
                  </div>
              </div>

              {/* EXPANDED COMMENTS SECTION */}
              {isExpanded && (
                <div className="mt-5 border-t border-zinc-800/80 pt-5 space-y-4 animate-in fade-in duration-200">
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
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all shadow-md shadow-violet-600/30"
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
                      />
                      {!commentImageUrl && (
                        <GifPicker value={commentGif} onChange={setCommentGif} />
                      )}
                    </div>
                  </form>

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
                            id={`comment-${comment.id}`}
                            className={`rounded-2xl border p-4 space-y-2.5 transition-colors ${
                              highlightCommentId === comment.id
                                ? 'border-violet-500 bg-violet-950/40'
                                : 'border-zinc-800/80 bg-zinc-950/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => goToProfile(comment.authorId)}
                                  aria-label={`Ver el perfil de ${comment.authorName}`}
                                  title="Ver su perfil"
                                  className="flex-shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                                >
                                  <img
                                    src={comment.authorAvatar}
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                </button>
                                <div className="min-w-0 flex-1">
                                  <AuthorBadge
                                    authorId={comment.authorId}
                                    nombre={`@${comment.authorName}`}
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-500">
                                {new Date(comment.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-300 leading-relaxed pl-8">
                              {comment.body}
                            </p>

                            {/* GIF adjunto al comentario */}
                            {comment.gif && (
                              <CommentGif gif={comment.gif} className="pl-8" />
                            )}

                            {/* Imagen adjunta al comentario */}
                            {comment.imageUrl && (
                              <img
                                src={comment.imageUrl}
                                alt="Imagen adjunta al comentario"
                                className="mt-1 max-h-72 rounded-xl border border-zinc-800 object-cover pl-8"
                                loading="lazy"
                              />
                            )}

                            <div className="flex flex-wrap items-center gap-3 pl-8 pt-1 text-[11px]">
                              <button
                                onClick={() => toggleCommentLike(comment.id)}
                                className={`flex items-center gap-1 font-mono transition-colors ${
                                  commentLiked ? 'text-pink-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
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
                                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"
                                  >
                                    Enviar
                                  </button>
                                </div>
                                <GifPicker value={replyGif} onChange={setReplyGif} />
                              </form>
                            )}

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className="ml-8 mt-3 space-y-2 border-l-2 border-zinc-800 pl-3">
                                {replies.map((reply) => {
                                  const replyLiked = currentUser
                                    ? reply.likedBy?.includes(currentUser.uid)
                                    : false;
                                  return (
                                    <div
                                      key={reply.id}
                                      className="rounded-xl bg-zinc-900/60 p-3 space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
<div className="flex items-center gap-1.5">
                                           <CornerDownRight size={12} className="flex-shrink-0 text-violet-400" />
                                           <button
                                             type="button"
                                             onClick={() => goToProfile(reply.authorId)}
                                             aria-label={`Ver el perfil de ${reply.authorName}`}
                                             title="Ver su perfil"
                                             className="flex-shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-violet-400"
                                           >
                                             <img
                                               src={reply.authorAvatar}
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
                                               nombre={`@${reply.authorName}`}
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
                                         <CommentGif gif={reply.gif} className="pl-5" />
                                       )}
                                       <div className="flex flex-wrap items-center gap-3 pl-5 pt-1">
                                         <button
                                           onClick={() => toggleCommentLike(reply.id)}
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
      </div>
    </div>
  );
};
