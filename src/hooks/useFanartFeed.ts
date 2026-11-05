import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import {
  fetchFanartPage,
  fetchFanartThreadsByIds,
  type FanartSort,
} from '../services/fanarts';
import type { Thread } from '../types';

interface UseFanartFeedInput {
  /** Solo se consulta cuando la pestaña Fanarts está visible. */
  enabled: boolean;
  sort: FanartSort;
  tag: string | null;
  /** Si es true, se muestran los ids guardados en vez de la consulta. */
  savedOnly?: boolean;
  savedIds?: string[];
  /** Cambia al publicar para recargar la primera página. */
  refreshToken?: number;
}

/**
 * Feed paginado de Fanarts.
 *
 * La primera página se pide al activar la pestaña o cambiar de
 * filtro. «Cargar más» usa el último documento como cursor. No se
 * mantiene ningún listener: cambiar de pestaña deja de leer.
 */
export function useFanartFeed({
  enabled,
  sort,
  tag,
  savedOnly = false,
  savedIds = [],
  refreshToken = 0,
}: UseFanartFeedInput) {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const peticionRef = useRef(0);

  const savedKey = savedIds.join('|');
  // Cuando no se está en «Guardados», cargar la lista de favoritos
  // no debe repetir la consulta de Fanarts. Solo entra en las
  // dependencias si la vista de guardados está activa.
  const savedDependency = savedOnly ? savedKey : '';

  useEffect(() => {
    const peticion = ++peticionRef.current;

    if (!enabled) {
      setLoading(false);
      return;
    }

    cursorRef.current = null;
    setItems([]);
    setHasMore(false);
    setError('');

    if (savedOnly && savedIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const cargar = savedOnly
      ? fetchFanartThreadsByIds(savedIds).then((lista) => {
          const ordenados = [...lista].sort((a, b) =>
            sort === 'popular'
              ? (b.likesCount ?? 0) - (a.likesCount ?? 0)
              : (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
          );
          return { items: ordenados, cursor: null, hasMore: false };
        })
      : fetchFanartPage({ sort, tag, cursor: null });

    void cargar
      .then((pagina) => {
        if (peticion !== peticionRef.current) return;
        cursorRef.current = pagina.cursor;
        setItems(pagina.items);
        setHasMore(pagina.hasMore);
      })
      .catch((e) => {
        if (peticion !== peticionRef.current) return;
        console.error('[Fanarts] No se pudo cargar el feed:', e);
        setError('No se pudieron cargar los fanarts.');
      })
      .finally(() => {
        if (peticion === peticionRef.current) setLoading(false);
      });
    // `savedDependency` representa el contenido, no la identidad del
    // array, y solo cambia en la vista de guardados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sort, tag, savedOnly, savedDependency, refreshToken]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (savedOnly || !enabled || loadingMore || !hasMore) return;
    const cursor = cursorRef.current;
    if (!cursor) return;

    setLoadingMore(true);
    try {
      const pagina = await fetchFanartPage({ sort, tag, cursor });
      cursorRef.current = pagina.cursor;
      setItems((prev) => {
        const porId = new Map(prev.map((hilo) => [hilo.id, hilo]));
        for (const hilo of pagina.items) porId.set(hilo.id, hilo);
        return [...porId.values()];
      });
      setHasMore(pagina.hasMore);
    } catch (e) {
      console.error('[Fanarts] No se pudo cargar la página siguiente:', e);
      setError('No se pudieron cargar más fanarts.');
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, hasMore, loadingMore, savedOnly, sort, tag]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  };
}
