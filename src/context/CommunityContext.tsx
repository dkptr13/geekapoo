import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

import { mapWithId, withId } from '../services/firestoreUtils';
import { createThread as createThreadService, deleteThread as deleteThreadService, toggleThreadLike as toggleThreadLikeService } from '../services/threads';
import { createComment, deleteComment as deleteCommentService, toggleCommentLike as toggleCommentLikeService } from '../services/comments';
import {
  reportContent as reportContentService,
  type MotivoReporte,
  type ReportableTarget,
} from '../services/reports';
import { toggleCatalogLike } from '../services/engagement';
import { setPollClosed, votePoll } from '../services/polls';
import {
  changeReactionType,
  removeReaction,
  setReaction,
} from '../services/reactions';

import { mergeCategories } from '../data/animeCategories';

import type { ImageDims } from '../utils/imagenes';
import {
  Anime,
  CategoryItem,
  Character,
  Comment,
  Episode,
  GifAttachment,
  MascotDialogue,
  NewPollInput,
  Poll,
  ReactionTargetType,
  ReactionType,
  Season,
  Thread,
  TierListRef,
  TriviaExtra,
} from '../types';

import { useAuth } from './AuthContext';

// ======================================================
// TIPOS
// ======================================================

export type CommentTarget = 'thread' | 'anime' | 'episode' | 'character';

export interface CommunityContextType {
  threads: Thread[];
  animes: Anime[];
  /** Temporadas de todos los animes. La wiki las agrupa por animeId. */
  seasons: Season[];
  episodes: Record<string, Episode[]>;
  characters: Record<string, Character[]>;
  comments: Comment[];
  categories: CategoryItem[];
  triviaExtras: TriviaExtra[];
  mascotDialogues: string[];

  loading: boolean;
  error: string | null;

  createThread: (
    title: string,
    body: string,
    categoryId: string,
    tags: string[],
    imageUrl?: string,
    /** Encuesta opcional. Se valida en `services/threads`. */
    poll?: NewPollInput,
    /** Dimensiones de la imagen, medidas al subir. */
    imageDims?: ImageDims | null,
    /** Tier list adjunta (solo referencia). */
    tierList?: TierListRef | null,
  ) => Promise<boolean>;

  deleteThread: (threadId: string) => Promise<boolean>;

  canEditThread: (thread: Thread) => boolean;

  toggleThreadLike: (threadId: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<void>;
  toggleAnimeLike: (animeId: string) => Promise<void>;
  toggleEpisodeLike: (episodeId: string) => Promise<void>;
  toggleCharacterLike: (characterId: string) => Promise<void>;
  toggleTriviaLike: (triviaId: string) => Promise<void>;

  /**
   * Borra un comentario.
   *
   * Lo pueden hacer quien lo escribió, el admin y el moderador: es
   * el mismo criterio que usan las reglas, y aquí solo se avisa de
   * que no se ha podido.
   *
   * Devuelve `false` si falló, para que la interfaz pueda
   * mantener el botón y enseñar el error en vez de desaparecer
   * como si hubiera salido bien.
   */
  deleteComment: (commentId: string) => Promise<boolean>;

  /**
   * Denuncia un comentario o un hilo.
   *
   * `'ya-reportado'` no es un error: es lo que se le dice a quien
   * denuncia dos veces el mismo sitio, porque las reglas no
   * dejan tener dos reportes del mismo contenido.
   */
  reportContent: (
    targetType: ReportableTarget,
    targetId: string,
    motivo: MotivoReporte,
    detalle?: string,
  ) => Promise<'guardado' | 'ya-reportado'>;

  /**
   * Registra el voto en la encuesta de un hilo.
   *
   * Quien ya votó puede volver a llamarla con otra opción si el
   * autor permitió cambiar de opinión; si no, el servicio avisa
   * con un error legible en vez de dejar que reviente la regla.
   */
  voteInPoll: (threadId: string, poll: Poll, optionId: string) => Promise<void>;

  /** Abre o cierra una encuesta (autor del hilo o equipo). */
  setPollClosed: (threadId: string, closed: boolean) => Promise<void>;

  /**
   * Pone, cambia o quita una reacción.
   *
   * Poner la misma que ya tiene la quita, y poner otra la
   * cambia: el documento de la reacción es el mismo siempre (su
   * id lo compone el objetivo y la persona), así que nunca puede
   * haber dos reacciones del mismo tipo.
   */
  toggleReaction: (
    targetType: ReactionTargetType,
    targetId: string,
    type: ReactionType,
    /** Reacción que tiene ahora, para saber si hay que quitar o cambiar. */
    actual?: ReactionType,
    /** Solo para `chat_message`: en qué chat está el mensaje. */
    chatId?: string,
  ) => Promise<void>;

  addComment: (
    targetType: CommentTarget,
    targetId: string,
    body: string,
    parentId?: string | null,
    imageUrl?: string,
    /** GIF adjunto. Como máximo uno, y sustituye a la imagen. */
    gif?: GifAttachment,
    /** Dimensiones de la imagen, medidas al subir. */
    imageDims?: ImageDims | null,
  ) => Promise<boolean>;

  getCommentsForTarget: (
    targetType: CommentTarget,
    targetId: string,
  ) => Comment[];
}

// ======================================================
// CONTEXTO
// ======================================================

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

/**
 * Rellena los campos que ahora escribe el servidor.
 *
 * Los hilos y comentarios nuevos ya no nacen con `likedBy`,
 * `likesCount` ni `commentsCount`: los pone la Cloud Function. Hasta
 * que el trigger corre (o si un documento antiguo viene sin ellos),
 * la interfaz tiene que seguir viendo 0 y una lista vacía en vez de
 * `undefined`, que rompería los contadores y los filtros del perfil.
 */
function normalizarHilo(thread: Thread): Thread {
  return {
    ...thread,
    likesCount: typeof thread.likesCount === 'number' ? thread.likesCount : 0,
    likedBy: Array.isArray(thread.likedBy) ? thread.likedBy : [],
    commentsCount: typeof thread.commentsCount === 'number' ? thread.commentsCount : 0,
  };
}

function normalizarComentario(comment: Comment): Comment {
  return {
    ...comment,
    likesCount: typeof comment.likesCount === 'number' ? comment.likesCount : 0,
    likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
  };
}

// ======================================================
// PROVIDER
// ======================================================

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, requireAuth } = useAuth();

  // ====================================================
  // ESTADO
  // ====================================================

  const [threads, setThreads] = useState<Thread[]>([]);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
  const [characters, setCharacters] = useState<Record<string, Character[]>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [triviaExtras, setTriviaExtras] = useState<TriviaExtra[]>([]);
  const [mascotDialogues, setMascotDialogues] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cuántos listeners siguen sin responder por primera vez.
  // Hay nueve listeners: animes, temporadas, hilos, comentarios,
  // personajes, episodios, categorías, trivia y diálogos de la
  // mascota.
  const pendingListeners = useRef(0);

  // ====================================================
  // LISTENERS EN TIEMPO REAL
  // ====================================================
  // Ya no hay siembra de datos ni copia de seguridad desde
  // mockData: Firestore es la única fuente de verdad. Si algo
  // falla, se muestra el error en vez de inventarse datos.
  // ====================================================

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Se arma la cuenta antes de registrar los listeners, para que
    // markReady() no ponga loading a false en la primera respuesta.
    pendingListeners.current = 9;

    // Marca un listener como respondido la primera vez
    const markReady = () => {
      pendingListeners.current = Math.max(0, pendingListeners.current - 1);
      if (pendingListeners.current === 0) setLoading(false);
    };

    const handleError = (label: string) => (e: Error) => {
      console.error(`[Community] Error en el listener de "${label}":`, e);
      setError(
        `No se pudo leer "${label}" de Firestore: ${e.message}. ` +
        `Si el error menciona un índice, ejecuta: firebase deploy --only firestore:indexes`,
      );
      markReady();
    };

    // ── Animes ──────────────────────────────────────────
    unsubs.push(
      onSnapshot(
        collection(db, 'animes'),
        (snap) => {
          setAnimes(mapWithId<Anime>(snap));
          markReady();
        },
        handleError('animes'),
      ),
    );

    // ── Temporadas ────────────────────────────────────
    // Van en su propia colección y no como subcolección de
    // animes para poder escucharlas todas de una vez: la wiki
    // pinta el selector de temporada de la serie que se está
    // viendo, y un get() por cada serie abierta retrasaría
    // todo lo demás.
    unsubs.push(
      onSnapshot(
        collection(db, 'seasons'),
        (snap) => {
          setSeasons(mapWithId<Season>(snap));
          markReady();
        },
        handleError('seasons'),
      ),
    );

    // ── Hilos (del más nuevo al más viejo) ─────────────
    unsubs.push(
      onSnapshot(
        query(collection(db, 'threads'), orderBy('createdAt', 'desc')),
        (snap) => {
          setThreads(mapWithId<Thread>(snap).map(normalizarHilo));
          markReady();
        },
        handleError('threads'),
      ),
    );

    // ── Comentarios ────────────────────────────────────
    unsubs.push(
      onSnapshot(
        query(collection(db, 'comments'), orderBy('createdAt', 'desc')),
        (snap) => {
          setComments(mapWithId<Comment>(snap).map(normalizarComentario));
          markReady();
        },
        handleError('comments'),
      ),
    );

    // ── Personajes, agrupados por anime ────────────────
    unsubs.push(
      onSnapshot(
        collection(db, 'characters'),
        (snap) => {
          const grouped: Record<string, Character[]> = {};
          snap.docs.forEach((d) => {
            const char = withId<Character>(d);
            if (!grouped[char.animeId]) grouped[char.animeId] = [];
            grouped[char.animeId].push(char);
          });
          setCharacters(grouped);
          markReady();
        },
        handleError('characters'),
      ),
    );

    // ── Episodios, agrupados por anime y ordenados ─────
    unsubs.push(
      onSnapshot(
        collection(db, 'episodes'),
        (snap) => {
          const grouped: Record<string, Episode[]> = {};
          snap.docs.forEach((d) => {
            const ep = withId<Episode>(d);
            if (!grouped[ep.animeId]) grouped[ep.animeId] = [];
            grouped[ep.animeId].push(ep);
          });
          Object.keys(grouped).forEach((animeId) => {
            grouped[animeId].sort((a, b) => a.number - b.number);
          });
          setEpisodes(grouped);
          markReady();
        },
        handleError('episodes'),
      ),
    );

    // ── Categorías ─────────────────────────────────────
    //
    // Se fusiona lo que hay en Firestore con la lista canónica de
    // código. Sin esto, las categorías nuevas solo existían para la
    // wiki: el desplegable de "Publicar Nuevo Hilo" y los botones de
    // la barra lateral leían solo Firestore y seguían mostrando
    // cinco.
    unsubs.push(
      onSnapshot(
        collection(db, 'categories'),
        (snap) => {
          setCategories(mergeCategories(mapWithId<CategoryItem>(snap)));
          markReady();
        },
        handleError('categories'),
      ),
    );

    // ── Extras y curiosidades ───────────────────────────
    unsubs.push(
      onSnapshot(
        collection(db, 'trivia_extras'),
        (snap) => {
          setTriviaExtras(mapWithId<TriviaExtra>(snap));
          markReady();
        },
        handleError('trivia_extras'),
      ),
    );

    // ── Diálogos de la mascota ─────────────────────────
    unsubs.push(
      onSnapshot(
        query(collection(db, 'mascot_dialogues'), orderBy('id', 'asc')),
        (snap) => {
          setMascotDialogues(
            snap.docs.map((d) => (d.data() as MascotDialogue).text).filter(Boolean),
          );
          markReady();
        },
        handleError('mascot_dialogues'),
      ),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  // ====================================================
  // CREAR HILO
  // ====================================================

  const createThread = useCallback(
    async (
      title: string,
      body: string,
      categoryId: string,
      tags: string[],
      imageUrl?: string,
      poll?: NewPollInput,
      imageDims?: ImageDims | null,
      tierList?: TierListRef | null,
    ): Promise<boolean> => {
      if (!currentUser) {
        requireAuth('crear un hilo en la comunidad');
        return false;
      }

      // El nombre de la categoría se busca en Firestore en vez de
      // usar el diccionario fijo que había antes en este archivo.
      const category = categories.find((c) => c.id === categoryId);

      try {
        await createThreadService({
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.username,
          authorAvatar: currentUser.avatarUrl,
          title,
          body,
          categoryId,
          categoryName: category?.name ?? 'General',
          tags,
          imageUrl,
          poll,
          imageDims,
          tierList,
        });
        return true;
      } catch (e) {
        console.error('[Community] Error creando hilo:', e);
        return false;
      }
    },
    [currentUser, categories, requireAuth],
  );

  // ====================================================
  // BORRAR HILO
  // ====================================================

  // Solo el autor del hilo, o alguien del equipo (admin o
  // moderador). La regla de seguridad comprueba lo mismo en el
  // servidor, así que esto es solo para decidir si se pinta el
  // botón.
  const canEditThread = useCallback(
    (thread: Thread): boolean => {
      if (!currentUser) return false;
      return (
        thread.authorId === currentUser.uid ||
        currentUser.role === 'admin' ||
        currentUser.role === 'moderator'
      );
    },
    [currentUser],
  );

  const deleteThread = useCallback(async (threadId: string): Promise<boolean> => {
    try {
      await deleteThreadService(threadId);
      return true;
    } catch (e) {
      console.error('[Community] Error borrando hilo:', e);
      return false;
    }
  }, []);

  // ====================================================
  // MODERACIÓN DE COMENTARIOS Y REPORTES
  // ====================================================

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      await deleteCommentService(commentId);
      return true;
    } catch (e) {
      console.error('[Community] Error borrando comentario:', e);
      return false;
    }
  }, []);

  const reportContent = useCallback(
    async (
      targetType: ReportableTarget,
      targetId: string,
      motivo: MotivoReporte,
      detalle?: string,
    ): Promise<'guardado' | 'ya-reportado'> => {
      if (!currentUser) {
        requireAuth('reportar este contenido');
        return 'ya-reportado';
      }

      return reportContentService(
        currentUser.uid,
        currentUser.displayName || currentUser.username,
        targetType,
        targetId,
        motivo,
        detalle,
      );
    },
    [currentUser, requireAuth],
  );

  // ====================================================
  // AÑADIR COMENTARIO
  // ====================================================

  const addComment = useCallback(
    async (
      targetType: CommentTarget,
      targetId: string,
      body: string,
      parentId: string | null = null,
      imageUrl?: string,
      gif?: GifAttachment,
      imageDims?: ImageDims | null,
    ): Promise<boolean> => {
      if (!currentUser) {
        requireAuth('publicar un comentario');
        return false;
      }

      try {
        await createComment({
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.username,
          authorAvatar: currentUser.avatarUrl,
          targetType,
          targetId,
          parentId,
          body,
          imageUrl,
          gif,
          imageDims,
        });
        return true;
      } catch (e) {
        console.error('[Community] Error añadiendo comentario:', e);
        return false;
      }
    },
    [currentUser, requireAuth],
  );

  // ====================================================
  // "ME GUSTA"
  // Todas pasan por el servicio. En hilos y comentarios el
  // servicio escribe un documento por persona y es la Cloud
  // Function quien actualiza `likedBy` y `likesCount`; en el
  // catálogo se sigue usando la transacción de siempre.
  // ====================================================

  const guardUser = useCallback((): string | null => {
    if (!currentUser) {
      requireAuth('dar Me gusta a este contenido');
      return null;
    }
    return currentUser.uid;
  }, [currentUser, requireAuth]);

  const runLike = useCallback(async (action: (uid: string) => Promise<boolean>) => {
    const uid = guardUser();
    if (!uid) return;
    try {
      await action(uid);
    } catch (e) {
      console.error('[Community] Error en "me gusta":', e);
    }
  }, [guardUser]);

  const toggleThreadLike = useCallback(
    (threadId: string) => runLike((uid) => toggleThreadLikeService(threadId, uid)),
    [runLike],
  );

  const toggleCommentLike = useCallback(
    (commentId: string) => runLike((uid) => toggleCommentLikeService(commentId, uid)),
    [runLike],
  );

  const toggleAnimeLike = useCallback(
    (animeId: string) => runLike((uid) => toggleCatalogLike('anime', animeId, uid)),
    [runLike],
  );

  const toggleEpisodeLike = useCallback(
    (episodeId: string) => runLike((uid) => toggleCatalogLike('episode', episodeId, uid)),
    [runLike],
  );

  const toggleCharacterLike = useCallback(
    (characterId: string) => runLike((uid) => toggleCatalogLike('character', characterId, uid)),
    [runLike],
  );

  const toggleTriviaLike = useCallback(
    (triviaId: string) => runLike((uid) => toggleCatalogLike('trivia', triviaId, uid)),
    [runLike],
  );

  // ====================================================
  // ENCUESTAS
  // ====================================================
  // Los votos NO se cuentan aquí: se escriben en
  // `threads/{id}/pollVotes/{uid}`, un documento privado por
  // persona. Los totales los agrega la Cloud Function en
  // `pollStats/{id}` y la tarjeta los lee de ahí.
  // El "un solo voto" lo garantizan las reglas (el id es el uid),
  // no este archivo.
  // ====================================================

  const voteInPoll = useCallback(
    async (threadId: string, poll: Poll, optionId: string) => {
      if (!currentUser) {
        requireAuth('votar en esta encuesta');
        return;
      }
      await votePoll(threadId, poll, optionId, currentUser.uid);
    },
    [currentUser, requireAuth],
  );

  const setPollClosedAction = useCallback(
    async (threadId: string, closed: boolean) => {
      await setPollClosed(threadId, closed);
    },
    [],
  );

  // ====================================================
  // REACCIONES
  // ====================================================
  // El "me gusta" de siempre sigue aparte (más arriba): estas
  // reacciones son un sistema paralelo, para no tocar los
  // "me gusta" que ya hay guardados.
  // ====================================================

  const toggleReaction = useCallback(
    async (
      targetType: ReactionTargetType,
      targetId: string,
      type: ReactionType,
      actual?: ReactionType,
      /** Solo para `chat_message`: en qué chat está el mensaje. */
      chatId?: string,
    ) => {
      if (!currentUser) {
        requireAuth('reaccionar a este contenido');
        return;
      }

      const uid = currentUser.uid;
      const nombre = currentUser.displayName || currentUser.username;

      // El id del documento sale del objetivo y de la persona, así
      // que poner otra reacción EDITA el documento que ya existe:
      // no puede haber dos a la vez por mucho que se intente.
      if (actual === undefined) {
        await setReaction(targetType, targetId, uid, type, nombre, chatId);
        return;
      }

      // Pulsar la que ya tenía la quita; pulsar otra la cambia.
      if (actual === type) {
        await removeReaction(targetType, targetId, uid);
        return;
      }

      await changeReactionType(targetType, targetId, uid, type);
    },
    [currentUser, requireAuth],
  );

  // ====================================================
  // OBTENER COMENTARIOS DE UN OBJETIVO
  // ====================================================

  const getCommentsForTarget = useCallback(
    (targetType: CommentTarget, targetId: string): Comment[] =>
      comments.filter((c) => c.targetType === targetType && c.targetId === targetId),
    [comments],
  );

  // ====================================================
  // PANTALLA DE CARGA
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm text-zinc-400">Cargando datos de la comunidad...</p>
        </div>
      </div>
    );
  }

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <CommunityContext.Provider
      value={{
        threads,
        animes,
        seasons,
        episodes,
        characters,
        comments,
        categories,
        triviaExtras,
        mascotDialogues,
        loading,
        error,
        createThread,
        deleteThread,
        canEditThread,
        deleteComment,
        reportContent,
        toggleThreadLike,
        toggleCommentLike,
        toggleAnimeLike,
        toggleEpisodeLike,
        toggleCharacterLike,
        toggleTriviaLike,
        voteInPoll,
        setPollClosed: setPollClosedAction,
        toggleReaction,
        addComment,
        getCommentsForTarget,
      }}
    >
      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-300">
          {error}
        </div>
      )}
      {children}
    </CommunityContext.Provider>
  );
};

// ======================================================
// HOOK
// ======================================================

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity debe usarse dentro de un CommunityProvider');
  }
  return context;
};
