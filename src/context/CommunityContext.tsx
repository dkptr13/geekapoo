import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import {
  measureRead,
  recordListenerSnapshot,
  trackListener,
} from '../lib/firestoreDiagnostics';

import { mapWithId } from '../services/firestoreUtils';
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
import { ponerLikeLocal } from '../utils/likes';

import type { ImageDims } from '../utils/imagenes';
import {
  Anime,
  CategoryItem,
  Character,
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
  /** Página reciente del feed, ampliable con `loadMoreThreads`. */
  threads: Thread[];
  /** Copia completa, para perfil, búsqueda y administración. */
  allThreads: Thread[];
  hasMoreThreads: boolean;
  loadingMoreThreads: boolean;
  loadMoreThreads: () => Promise<void>;
  ensureAllThreads: () => void;
  animes: Anime[];
  /** Temporadas de todos los animes. La wiki las agrupa por animeId. */
  seasons: Season[];
  episodes: Record<string, Episode[]>;
  characters: Record<string, Character[]>;
  categories: CategoryItem[];
  triviaExtras: TriviaExtra[];
  mascotDialogues: string[];

  /** Carga temporadas, episodios y personajes la primera vez que se
   *  necesitan (perfil, editor de tier lists...). */
  ensureCatalogData: () => void;
  /** Carga el catálogo completo de series (la portada solo trae unas pocas). */
  ensureAnimeList: () => void;
  /** Carga solo los episodios, personajes y temporadas de una serie. */
  ensureAnimeData: (animeId: string) => void;
  /** `true` cuando ya están cargados todos los episodios y personajes. */
  catalogComplete: boolean;

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
  /** `false` si Firestore rechazó la escritura. */
  toggleCommentLike: (commentId: string) => Promise<boolean>;
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

const TTL_ANIMES = 5 * 60 * 1000;
const TTL_CATALOGO = 30 * 60 * 1000;
const TTL_CONFIGURACION = 60 * 60 * 1000;
const TTL_HILOS = 2 * 60 * 1000;
const THREAD_PAGE_SIZE = 50;

/** Lectura pública compartida; no abre un listener por cada visita. */
function leerColeccionCached<T>(
  coleccion: string,
  key: string,
  ttlMs: number,
  ordenada = false,
  force = false,
): Promise<T[]> {
  return cachedRead({
    key,
    ttlMs,
    scope: PUBLIC_CACHE,
    force,
    persist: true,
    read: async () => {
      const referencia = ordenada
        ? query(collection(db, coleccion), orderBy('id', 'asc'))
        : collection(db, coleccion);
      const snap = await measureRead(
        { name: 'getDocs', collection: coleccion, origin: 'CommunityContext' },
        (result) => result.size,
        () => getDocs(referencia),
      );
      return mapWithId<T>(snap);
    },
  });
}

/** Unas pocas series para la portada; nunca todo el catálogo. */
function leerAnimesDestacados(force = false): Promise<Anime[]> {
  return cachedRead({
    key: 'community:animes:featured',
    ttlMs: TTL_ANIMES,
    scope: PUBLIC_CACHE,
    force,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        { name: 'animes:destacados', collection: 'animes', origin: 'CommunityContext' },
        (result) => result.size,
        () => getDocs(query(collection(db, 'animes'), limit(6))),
      );
      return mapWithId<Anime>(snap);
    },
  });
}

/** Lectura de una sola serie, compartida por todas sus visitas. */
function leerColeccionDeAnime<T>(
  coleccion: string,
  key: string,
  animeId: string,
  force = false,
): Promise<T[]> {
  return cachedRead({
    key,
    ttlMs: TTL_CATALOGO,
    scope: PUBLIC_CACHE,
    force,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        { name: 'getDocs:anime', collection: coleccion, origin: 'CommunityContext' },
        (result) => result.size,
        () => getDocs(query(collection(db, coleccion), where('animeId', '==', animeId))),
      );
      return mapWithId<T>(snap);
    },
  });
}

function unirHilos(...listas: Thread[][]): Thread[] {
  const porId = new Map<string, Thread>();
  listas.forEach((lista) => lista.forEach((hilo) => porId.set(hilo.id, hilo)));
  return [...porId.values()].sort(
    (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  );
}

/**
 * Todos los hilos, solo para las vistas que necesitan el histórico:
 * perfil, búsqueda global, pestaña de hilos y panel de administración.
 */
function leerTodosLosHilos(force = false): Promise<Thread[]> {
  return cachedRead({
    key: 'community:threads:all',
    scope: PUBLIC_CACHE,
    ttlMs: TTL_HILOS,
    force,
    read: async () => {
      const snap = await measureRead(
        { name: 'threads:all', collection: 'threads', origin: 'CommunityContext' },
        (result) => result.size,
        () => getDocs(query(collection(db, 'threads'), orderBy('createdAt', 'desc'))),
      );
      return mapWithId<Thread>(snap).map(normalizarHilo);
    },
  });
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
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [loadingMoreThreads, setLoadingMoreThreads] = useState(false);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
  const [characters, setCharacters] = useState<Record<string, Character[]>>({});
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [triviaExtras, setTriviaExtras] = useState<TriviaExtra[]>([]);
  const [mascotDialogues, setMascotDialogues] = useState<string[]>([]);
  const [catalogComplete, setCatalogComplete] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Un like por contenido puede estar esperando a Firestore. El
  // corazón cambia en local enseguida; el bloqueo solo evita que un
  // doble toque lance dos transacciones contrarias a la vez.
  const likesPendientes = useRef(new Set<string>());
  const cargarCatalogoRef = useRef<() => void>(() => undefined);
  const cargarAnimeRef = useRef<(animeId: string) => void>(() => undefined);
  const cargarListaAnimesRef = useRef<() => void>(() => undefined);
  const cargarTodosHilosRef = useRef<(force?: boolean) => void>(() => undefined);
  const threadCursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hayHilosAnterioresRef = useRef(false);
  const pinnedThreadsRef = useRef<Thread[]>([]);

  // Cuántas fuentes siguen sin responder por primera vez. Solo el
  // feed de hilos conserva listener; el catálogo usa caché pública y
  // los comentarios se cargan al abrir su objetivo.
  const pendingListeners = useRef(0);

  // ====================================================
  // CARGA DE COMUNIDAD Y CATÁLOGO
  // ====================================================
  // Las colecciones de la wiki no necesitan avisar cada cambio a
  // todos los visitantes. Se leen una vez por TTL y se comparten las
  // peticiones simultáneas. El feed de hilos sí sigue en vivo; los
  // comentarios se escuchan solo mientras su objetivo está abierto.
  // ====================================================

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const recargas = new Map<string, (force?: boolean) => void>();
    let vivo = true;

    pendingListeners.current = 5;

    const markReady = () => {
      if (!vivo) return;
      pendingListeners.current = Math.max(0, pendingListeners.current - 1);
      if (pendingListeners.current === 0) setLoading(false);
    };

    const mostrarError = (label: string, e: Error) => {
      console.error(`[Community] Error leyendo "${label}":`, e);
      if (!vivo) return;
      setError(
        `No se pudo leer "${label}" de Firestore: ${e.message}. ` +
        `Si el error menciona un índice, ejecuta: firebase deploy --only firestore:indexes`,
      );
    };

    const handleError = (label: string) => (e: Error) => {
      mostrarError(label, e);
      markReady();
    };

    const registrarCarga = <T,>(
      label: string,
      key: string,
      ttlMs: number,
      apply: (data: T[]) => void,
      ordenada = false,
    ) => {
      let inicial = true;
      const cargar = (force = false) => (
        leerColeccionCached<T>(label, key, ttlMs, ordenada, force)
          .then((data) => {
            if (vivo) apply(data);
            if (inicial) {
              inicial = false;
              markReady();
            }
          })
          .catch((e: Error) => {
            mostrarError(label, e);
            if (inicial) {
              inicial = false;
              markReady();
            }
          })
      );
      recargas.set(key, cargar);
      void cargar();
      return cargar;
    };

    // Lo mínimo para pintar Inicio: unas pocas series para la barra
    // lateral, no todo el catálogo.
    let animesCompletos = false;
    let animesCompletosPedido = false;
    let destacadosInicial = true;
    const cargarDestacados = (force = false) => {
      void leerAnimesDestacados(force)
        .then((lista) => {
          if (vivo && !animesCompletos) setAnimes(lista);
          if (destacadosInicial) {
            destacadosInicial = false;
            markReady();
          }
        })
        .catch((e: Error) => {
          mostrarError('animes destacados', e);
          if (destacadosInicial) {
            destacadosInicial = false;
            markReady();
          }
        });
    };
    recargas.set('community:animes:featured', cargarDestacados);
    cargarDestacados();

    const cargarAnimesCompletos = () => {
      if (animesCompletosPedido) return;
      animesCompletosPedido = true;
      animesCompletos = true;
      registrarCarga<Anime>('animes', 'community:animes', TTL_ANIMES, setAnimes);
    };
    cargarListaAnimesRef.current = cargarAnimesCompletos;

    registrarCarga<CategoryItem>('categories', 'community:categories', TTL_CONFIGURACION, (lista) => {
      setCategories(mergeCategories(lista));
    });
    registrarCarga<TriviaExtra>('trivia_extras', 'community:trivia-extras', TTL_CONFIGURACION, setTriviaExtras);
    registrarCarga<MascotDialogue>(
      'mascot_dialogues',
      'community:mascot-dialogues',
      TTL_CONFIGURACION,
      (lista) => setMascotDialogues(lista.map((d) => d.text).filter(Boolean)),
      true,
    );

    // Episodios y personajes son miles de documentos y no se pintan
    // en Inicio. Se piden la primera vez que una vista los necesita.
    let catalogoPedido = false;
    const cargarCatalogo = () => {
      if (catalogoPedido) return;
      catalogoPedido = true;
      cargarAnimesCompletos();

      const temporadas = registrarCarga<Season>(
        'seasons',
        'community:seasons',
        TTL_CATALOGO,
        setSeasons,
      );
      const personajes = registrarCarga<Character>(
        'characters',
        'community:characters',
        TTL_CATALOGO,
        (lista) => {
          const grouped: Record<string, Character[]> = {};
          lista.forEach((char) => {
            if (!grouped[char.animeId]) grouped[char.animeId] = [];
            grouped[char.animeId].push(char);
          });
          setCharacters(grouped);
        },
      );
      const episodios = registrarCarga<Episode>(
        'episodes',
        'community:episodes',
        TTL_CATALOGO,
        (lista) => {
          const grouped: Record<string, Episode[]> = {};
          lista.forEach((ep) => {
            if (!grouped[ep.animeId]) grouped[ep.animeId] = [];
            grouped[ep.animeId].push(ep);
          });
          Object.keys(grouped).forEach((animeId) => {
            grouped[animeId].sort((a, b) => a.number - b.number);
          });
          setEpisodes(grouped);
        },
      );
      void Promise.all([temporadas(), personajes(), episodios()]).then(() => {
        if (vivo) setCatalogComplete(true);
      });
    };
    cargarCatalogoRef.current = cargarCatalogo;

    const animesPedidos = new Set<string>();
    const cargarAnime = (animeId: string) => {
      if (!animeId || catalogoPedido || animesPedidos.has(animeId)) return;
      animesPedidos.add(animeId);

      const seasonKey = `community:seasons:${animeId}`;
      const characterKey = `community:characters:${animeId}`;
      const episodeKey = `community:episodes:${animeId}`;

      const cargarTemporadas = (force = false) => {
        void leerColeccionDeAnime<Season>('seasons', seasonKey, animeId, force)
          .then((lista) => {
            if (!vivo) return;
            setSeasons((prev) => [
              ...prev.filter((s) => s.animeId !== animeId),
              ...lista,
            ]);
          })
          .catch((e: Error) => mostrarError('temporadas', e));
      };
      const cargarPersonajes = (force = false) => {
        void leerColeccionDeAnime<Character>('characters', characterKey, animeId, force)
          .then((lista) => {
            if (!vivo) return;
            setCharacters((prev) => ({ ...prev, [animeId]: lista }));
          })
          .catch((e: Error) => mostrarError('personajes', e));
      };
      const cargarEpisodios = (force = false) => {
        void leerColeccionDeAnime<Episode>('episodes', episodeKey, animeId, force)
          .then((lista) => {
            if (!vivo) return;
            setEpisodes((prev) => ({
              ...prev,
              [animeId]: [...lista].sort((a, b) => a.number - b.number),
            }));
          })
          .catch((e: Error) => mostrarError('episodios', e));
      };

      recargas.set(seasonKey, cargarTemporadas);
      recargas.set(characterKey, cargarPersonajes);
      recargas.set(episodeKey, cargarEpisodios);
      cargarTemporadas();
      cargarPersonajes();
      cargarEpisodios();
    };
    cargarAnimeRef.current = cargarAnime;

    // Las escrituras del panel invalidan solo su colección. Si este
    // provider está montado, recarga esa fuente sin tocar las demás.
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (!key) return;
      if (key === 'community:threads') cargarTodosHilosRef.current(true);
      recargas.get(key)?.(true);
      recargas.forEach((cargar, registrada) => {
        if (registrada.startsWith(`${key}:`)) cargar(true);
      });
    };
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);

    const cargarTodosHilos = (force = false) => {
      void leerTodosLosHilos(force)
        .then((lista) => {
          if (vivo) setAllThreads(lista);
        })
        .catch((e: Error) => mostrarError('hilos', e));
    };
    cargarTodosHilosRef.current = cargarTodosHilos;

    const metaThreads = { name: 'threads:recientes', collection: 'threads', origin: 'CommunityContext' };
    const pararThreads = onSnapshot(
      query(
        collection(db, 'threads'),
        orderBy('createdAt', 'desc'),
        limit(THREAD_PAGE_SIZE + 1),
      ),
      (snap) => {
        recordListenerSnapshot(metaThreads, snap.size, snap.docChanges().length);
        if (!vivo) return;

        const docs = snap.docs.slice(0, THREAD_PAGE_SIZE);
        const filas = mapWithId<Thread>(snap)
          .slice(0, docs.length)
          .map(normalizarHilo);
        const conFijados = unirHilos(filas, pinnedThreadsRef.current);

        setThreads((prev) => {
          if (!hayHilosAnterioresRef.current) return conFijados;
          const ids = new Set(conFijados.map((t) => t.id));
          return unirHilos(conFijados, prev.filter((t) => !ids.has(t.id)));
        });

        if (!hayHilosAnterioresRef.current) {
          threadCursorRef.current = docs[docs.length - 1] ?? null;
          setHasMoreThreads(snap.size > THREAD_PAGE_SIZE);
        }
        markReady();
      },
      handleError('threads'),
    );
    unsubs.push(trackListener(metaThreads, pararThreads));

    // Los fijados antiguos no tienen por qué entrar en la página
    // reciente. Se piden aparte una vez; son pocos y así no
    // desaparecen al paginar el feed.
    void measureRead(
      { name: 'threads:fijados', collection: 'threads', origin: 'CommunityContext' },
      (result) => result.size,
      () => getDocs(query(
        collection(db, 'threads'),
        where('pinned', '==', true),
        limit(20),
      )),
    ).then((snap) => {
      if (!vivo) return;
      const fijados = mapWithId<Thread>(snap).map(normalizarHilo);
      pinnedThreadsRef.current = fijados;
      setThreads((prev) => unirHilos(fijados, prev));
    }).catch((e: Error) => {
      console.warn('[Community] No se pudieron leer los hilos fijados:', e);
    });

    return () => {
      vivo = false;
      cargarCatalogoRef.current = () => undefined;
      cargarAnimeRef.current = () => undefined;
      cargarListaAnimesRef.current = () => undefined;
      cargarTodosHilosRef.current = () => undefined;
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
      unsubs.forEach((u) => u());
    };
  }, []);

  const ensureCatalogData = useCallback(() => {
    cargarCatalogoRef.current();
  }, []);

  const ensureAnimeList = useCallback(() => {
    cargarListaAnimesRef.current();
  }, []);

  const ensureAnimeData = useCallback((animeId: string) => {
    cargarAnimeRef.current(animeId);
  }, []);

  const ensureAllThreads = useCallback(() => {
    cargarTodosHilosRef.current();
  }, []);

  const loadMoreThreads = useCallback(async (): Promise<void> => {
    const cursor = threadCursorRef.current;
    if (!cursor || !hasMoreThreads || loadingMoreThreads) return;

    setLoadingMoreThreads(true);
    try {
      const snap = await measureRead(
        { name: 'threads:anteriores', collection: 'threads', origin: 'CommunityContext' },
        (result) => result.size,
        () => getDocs(query(
          collection(db, 'threads'),
          orderBy('createdAt', 'desc'),
          startAfter(cursor),
          limit(THREAD_PAGE_SIZE + 1),
        )),
      );

      const docs = snap.docs.slice(0, THREAD_PAGE_SIZE);
      const filas = mapWithId<Thread>(snap).slice(0, docs.length).map(normalizarHilo);

      hayHilosAnterioresRef.current = true;
      threadCursorRef.current = docs[docs.length - 1] ?? cursor;
      setThreads((prev) => {
        const porId = new Map(prev.map((t) => [t.id, t]));
        filas.forEach((t) => porId.set(t.id, t));
        return [...porId.values()].sort(
          (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
        );
      });
      setHasMoreThreads(snap.size > THREAD_PAGE_SIZE);
    } catch (e) {
      console.error('[Community] No se pudieron cargar hilos anteriores:', e);
      setError('No se pudieron cargar publicaciones anteriores.');
    } finally {
      setLoadingMoreThreads(false);
    }
  }, [hasMoreThreads, loadingMoreThreads]);

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
  //
  // Esperar a todo ese camino hacía que el corazón tardara en
  // responder. En hilos y comentarios se refleja primero el cambio
  // en la copia local; la transacción lo confirma después y, si
  // falla, se revierte. El servidor sigue siendo la fuente de
  // verdad: esto no escribe los contadores en Firestore.
  // ====================================================

  const guardUser = useCallback((): string | null => {
    if (!currentUser) {
      requireAuth('dar Me gusta a este contenido');
      return null;
    }
    return currentUser.uid;
  }, [currentUser, requireAuth]);

  const actualizarLikeLocal = useCallback((
    id: string,
    uid: string,
    liked: boolean,
  ) => {
    setThreads((prev) => prev.map((thread) => (
      thread.id === id ? ponerLikeLocal(thread, uid, liked) : thread
    )));
  }, []);

  const runThreadLike = useCallback(async (
    id: string,
    action: (uid: string) => Promise<boolean>,
  ) => {
    const uid = guardUser();
    if (!uid) return;

    const clave = `thread:${id}`;
    if (likesPendientes.current.has(clave)) return;

    const actual = threads.find((thread) => thread.id === id);
    const likedAntes = actual?.likedBy?.includes(uid) ?? false;

    likesPendientes.current.add(clave);
    actualizarLikeLocal(id, uid, !likedAntes);

    try {
      const likedConfirmado = await action(uid);
      // Si otra pestaña cambió el documento a la vez, manda el
      // resultado real de la transacción, no lo que supuso el clic.
      actualizarLikeLocal(id, uid, likedConfirmado);
    } catch (e) {
      actualizarLikeLocal(id, uid, likedAntes);
      console.error('[Community] Error en "me gusta":', e);
    } finally {
      likesPendientes.current.delete(clave);
    }
  }, [actualizarLikeLocal, guardUser, threads]);

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
    (threadId: string) => runThreadLike(
      threadId,
      (uid) => toggleThreadLikeService(threadId, uid),
    ),
    [runThreadLike],
  );

  const toggleCommentLike = useCallback(
    async (commentId: string): Promise<boolean> => {
      const uid = guardUser();
      if (!uid) return false;
      try {
        await toggleCommentLikeService(commentId, uid);
        return true;
      } catch (e) {
        console.error('[Community] Error en "me gusta":', e);
        return false;
      }
    },
    [guardUser],
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
        allThreads,
        hasMoreThreads,
        loadingMoreThreads,
        loadMoreThreads,
        ensureAllThreads,
        animes,
        seasons,
        episodes,
        characters,
        categories,
        triviaExtras,
        mascotDialogues,
        ensureCatalogData,
        ensureAnimeList,
        ensureAnimeData,
        catalogComplete,
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
