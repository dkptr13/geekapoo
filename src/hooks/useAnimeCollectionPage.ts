import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from '../services/firestoreUtils';
import { SEASON_TODAS } from '../utils/seasonData';

// ======================================================
// PÁGINA DE UNA COLECCIÓN DE LA FICHA
// ======================================================
//
// La ficha ya no descarga todos los episodios y personajes de una
// serie. Pide una página de 60 y amplía con «Cargar más».
//
// Episodios:
//   - se filtran por `animeId` y, si hay temporada abierta, por
//     `seasonId`;
//   - se ordenan por `number`, que es el orden que espera el lector.
//
// Personajes:
//   - se paginan por `animeId` y orden de documento;
//   - el filtro por temporada se aplica en local, porque un personaje
//     puede ser compartido (`seasonIds` vacío) o estar en varias.
//
// Cada página pasa por `cachedRead` (30 min, IndexedDB). Las claves
// empiezan por `community:episodes` / `community:characters`, así que
// la invalidación del panel las borra.

export const ANIME_PAGE_SIZE = 60;
const ANIME_PAGE_TTL = 30 * 60 * 1000;
const ANIME_COUNT_TTL = 5 * 60 * 1000;

export interface AnimeCollectionPage<T> {
  items: T[];
  loading: boolean;
  /** La primera página ya ha respondido (o ha fallado). */
  loaded: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
}

interface PageCache<T> {
  items: T[];
  hasMore: boolean;
  lastId: string;
  /** Valor del campo de orden, si la consulta ordena por número. */
  lastValue?: number;
}

interface Cursor {
  id: string;
  value?: number;
}

interface AnimeCollectionPageOptions {
  /** Temporada abierta. `null`/`'all'` = sin filtro. */
  seasonId?: string | null;
  /** Ordenar por `number` (episodios). */
  orderByNumber?: boolean;
  /**
   * Temporada para personajes. Filtra por `seasonKeys`, que incluye
   * `'*'` para los compartidos.
   */
  characterSeasonId?: string | null;
}

function pageKey(
  coleccion: string,
  animeId: string,
  seasonId: string | null,
  orderByNumber: boolean,
  characterSeasonId: string | null,
): string {
  return `community:${coleccion}:ficha:${animeId}:${
    seasonId ?? characterSeasonId ?? 'all'
  }:${orderByNumber ? 'num' : 'id'}`;
}

export function useAnimeCollectionPage<T extends { id: string }>(
  coleccion: 'episodes' | 'characters',
  animeId: string | null,
  enabled: boolean,
  options: AnimeCollectionPageOptions = {},
): AnimeCollectionPage<T> {
  const seasonId = options.seasonId ?? null;
  const orderByNumber = options.orderByNumber === true;
  const characterSeasonId =
    options.characterSeasonId && options.characterSeasonId !== 'all'
      ? options.characterSeasonId
      : null;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresco, setRefresco] = useState(0);

  const peticionRef = useRef(0);
  const cursorRef = useRef<Cursor | null>(null);
  const activoRef = useRef(true);
  const cargadoParaRef = useRef<string | null>(null);
  const clave = `${coleccion}:${animeId ?? ''}:${
    seasonId ?? characterSeasonId ?? 'all'
  }:${orderByNumber ? 'num' : 'id'}`;

  const leerPagina = useCallback(
    (despues?: Cursor): Promise<PageCache<T>> => {
      if (!animeId) return Promise.resolve({ items: [], hasMore: false, lastId: '' });

      const partes: QueryConstraint[] = [where('animeId', '==', animeId)];
      if (seasonId) partes.push(where('seasonId', '==', seasonId));
      if (characterSeasonId) {
        partes.push(
          where('seasonKeys', 'array-contains-any', [characterSeasonId, SEASON_TODAS]),
        );
      }
      if (orderByNumber) {
        partes.push(orderBy('number', 'asc'));
      } else {
        partes.push(orderBy('__name__', 'asc'));
      }
      if (despues) {
        partes.push(
          orderByNumber
            ? startAfter(despues.value ?? 0)
            : startAfter(despues.id),
        );
      }
      partes.push(limit(ANIME_PAGE_SIZE + 1));

      const clave = despues
        ? `${pageKey(
            coleccion,
            animeId,
            seasonId,
            orderByNumber,
            characterSeasonId,
          )}:after:${despues.id}`
        : `${pageKey(
            coleccion,
            animeId,
            seasonId,
            orderByNumber,
            characterSeasonId,
          )}:first`;

      return cachedRead<PageCache<T>>({
        key: clave,
        ttlMs: ANIME_PAGE_TTL,
        scope: PUBLIC_CACHE,
        persist: true,
        read: async () => {
          const snap = await measureRead(
            {
              name: `${coleccion}:ficha`,
              collection: coleccion,
              origin: 'useAnimeCollectionPage',
            },
            (result) => result.size,
            () => getDocs(query(collection(db, coleccion), ...partes)),
          );

          const docs = snap.docs.slice(0, ANIME_PAGE_SIZE);
          const filas = mapWithId<T>(snap).slice(0, docs.length);
          const ultimo = filas[filas.length - 1] as
            | (T & { number?: number })
            | undefined;

          return {
            items: filas,
            hasMore: snap.size > ANIME_PAGE_SIZE,
            lastId: docs[docs.length - 1]?.id ?? '',
            lastValue: orderByNumber ? Number(ultimo?.number ?? 0) : undefined,
          };
        },
      });
    },
    [animeId, characterSeasonId, coleccion, orderByNumber, seasonId],
  );

  useEffect(() => {
    activoRef.current = true;

    if (!animeId) {
      peticionRef.current += 1;
      cargadoParaRef.current = null;
      cursorRef.current = null;
      setItems([]);
      setLoading(false);
      setLoaded(false);
      setLoadingMore(false);
      setHasMore(false);
      setError(null);
      return;
    }

    if (!enabled) {
      setLoading(false);
      // Cambiar de pestaña no borra la página ya cargada de esa
      // misma serie/temporada. Sí se borra si el destino cambió.
      if (cargadoParaRef.current === clave) return;

      peticionRef.current += 1;
      cursorRef.current = null;
      setItems([]);
      setLoaded(false);
      setLoadingMore(false);
      setHasMore(false);
      setError(null);
      return;
    }

    const peticion = ++peticionRef.current;
    cursorRef.current = null;
    setItems([]);
    setLoading(true);
    setLoaded(false);
    setLoadingMore(false);
    setHasMore(false);
    setError(null);

    void leerPagina()
      .then((pagina) => {
        if (!activoRef.current || peticion !== peticionRef.current) return;
        cursorRef.current = pagina.lastId
          ? { id: pagina.lastId, value: pagina.lastValue }
          : null;
        cargadoParaRef.current = clave;
        setItems(pagina.items);
        setHasMore(pagina.hasMore);
        setLoaded(true);
      })
      .catch((e: Error) => {
        if (!activoRef.current || peticion !== peticionRef.current) return;
        console.error(`[Wiki] No se pudo cargar la página de ${coleccion}:`, e);
        setError('No se pudieron cargar los datos. Inténtalo de nuevo.');
        setLoaded(true);
      })
      .finally(() => {
        if (activoRef.current && peticion === peticionRef.current) setLoading(false);
      });

    return () => {
      activoRef.current = false;
    };
  }, [
    animeId,
    clave,
    coleccion,
    enabled,
    leerPagina,
    seasonId,
    orderByNumber,
    characterSeasonId,
    refresco,
  ]);

  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === `community:${coleccion}`) setRefresco((n) => n + 1);
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () => window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, [coleccion]);

  const loadMore = useCallback(async (): Promise<void> => {
    const cursor = cursorRef.current;
    if (!enabled || !animeId || !cursor || !hasMore || loadingMore || loading) return;

    const peticion = peticionRef.current;
    setLoadingMore(true);
    try {
      const pagina = await leerPagina(cursor);
      if (!activoRef.current || peticion !== peticionRef.current) return;

      cursorRef.current = pagina.lastId
        ? { id: pagina.lastId, value: pagina.lastValue }
        : null;

      setItems((prev) => {
        const vistos = new Set(prev.map((item) => item.id));
        return [...prev, ...pagina.items.filter((item) => !vistos.has(item.id))];
      });
      setHasMore(pagina.hasMore);
    } catch (e) {
      console.error(`[Wiki] No se pudo cargar más de ${coleccion}:`, e);
      if (peticion === peticionRef.current) setHasMore(false);
    } finally {
      if (activoRef.current && peticion === peticionRef.current) setLoadingMore(false);
    }
  }, [animeId, coleccion, enabled, hasMore, leerPagina, loading, loadingMore]);

  return { items, loading, loaded, loadingMore, hasMore, error, loadMore };
}

/**
 * Recuento exacto de una colección de la ficha, sin descargarla.
 *
 * Para episodios se filtra por anime y temporada; para personajes,
 * por anime. La agregación es mucho más barata que traer cientos de
 * documentos solo para pintar el número de la pestaña.
 */
export function useAnimeCollectionCount(
  coleccion: 'episodes' | 'characters',
  animeId: string | null,
  seasonId?: string | null,
  enabled = true,
  characterSeasonId?: string | null,
): number | null {
  const [total, setTotal] = useState<number | null>(null);
  const temporada = seasonId && seasonId !== 'all' ? seasonId : null;
  const temporadaPersonaje =
    characterSeasonId && characterSeasonId !== 'all' ? characterSeasonId : null;

  useEffect(() => {
    if (!animeId || !enabled) {
      setTotal(null);
      return;
    }

    let activo = true;
    const clave = `community:${coleccion}:count:${animeId}:${
      temporada ?? temporadaPersonaje ?? 'all'
    }`;
    const partes: QueryConstraint[] = [where('animeId', '==', animeId)];
    if (temporada) partes.push(where('seasonId', '==', temporada));
    if (temporadaPersonaje) {
      partes.push(
        where('seasonKeys', 'array-contains-any', [temporadaPersonaje, SEASON_TODAS]),
      );
    }

    void cachedRead<number>({
      key: clave,
      ttlMs: ANIME_COUNT_TTL,
      scope: PUBLIC_CACHE,
      persist: true,
      read: () =>
        measureRead(
          {
            name: `${coleccion}:ficha:count`,
            collection: coleccion,
            origin: 'useAnimeCollectionPage',
          },
          () => 1,
          () => getCountFromServer(query(collection(db, coleccion), ...partes)),
        ).then((snap) => snap.data().count),
    })
      .then((n) => {
        if (activo) setTotal(n);
      })
      .catch((e: Error) => {
        if (activo) console.warn(`[Wiki] No se pudo contar ${coleccion}:`, e);
      });

    return () => {
      activo = false;
    };
  }, [animeId, coleccion, enabled, temporada, temporadaPersonaje]);

  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === `community:${coleccion}`) setTotal(null);
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () => window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, [coleccion]);

  return total;
}
