import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from '../services/firestoreUtils';

// ======================================================
// PÁGINA DEL CATÁLOGO GLOBAL
// ======================================================
//
// Episodios y personajes pueden ser miles. La navegación normal
// carga una página y la amplía bajo demanda; la búsqueda o los
// filtros siguen usando la carga completa para no dar resultados
// incompletos.

export const CATALOG_PAGE_SIZE = 60;
const CATALOG_PAGE_TTL = 2 * 60 * 1000;

export interface CatalogPage<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useCatalogPage<T>(
  coleccion: string,
  enabled: boolean,
  orderByField?: string,
): CatalogPage<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const cargadoEn = useRef(0);

  const consulta = useCallback((despues?: QueryDocumentSnapshot<DocumentData>) => {
    const partes = orderByField ? [orderBy(orderByField, 'asc')] : [];
    return query(
      collection(db, coleccion),
      ...partes,
      ...(despues ? [startAfter(despues)] : []),
      limit(CATALOG_PAGE_SIZE + 1),
    );
  }, [coleccion, orderByField]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (items.length > 0 && Date.now() - cargadoEn.current < CATALOG_PAGE_TTL) return;

    let activo = true;
    setLoading(true);

    void measureRead(
      { name: `${coleccion}:pagina`, collection: coleccion, origin: 'useCatalogPage' },
      (result) => result.size,
      () => getDocs(consulta()),
    )
      .then((snap) => {
        if (!activo) return;
        const docs = snap.docs.slice(0, CATALOG_PAGE_SIZE);
        setItems(mapWithId<T>(snap).slice(0, docs.length));
        cursorRef.current = docs[docs.length - 1] ?? null;
        setHasMore(snap.size > CATALOG_PAGE_SIZE);
        cargadoEn.current = Date.now();
      })
      .catch((e: Error) => {
        if (!activo) return;
        console.error(`[Wiki] No se pudo cargar la página de ${coleccion}:`, e);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [enabled, items.length, consulta, coleccion]);

  const loadMore = useCallback(async (): Promise<void> => {
    const cursor = cursorRef.current;
    if (!enabled || !cursor || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const snap = await measureRead(
        {
          name: `${coleccion}:pagina:anterior`,
          collection: coleccion,
          origin: 'useCatalogPage',
        },
        (result) => result.size,
        () => getDocs(consulta(cursor)),
      );

      const docs = snap.docs.slice(0, CATALOG_PAGE_SIZE);
      const nuevos = mapWithId<T>(snap).slice(0, docs.length);
      cursorRef.current = docs[docs.length - 1] ?? cursor;
      setItems((prev) => {
        const vistos = new Set(prev.map((item) => (item as { id?: string }).id));
        return [...prev, ...nuevos.filter((item) => !vistos.has((item as { id?: string }).id))];
      });
      setHasMore(snap.size > CATALOG_PAGE_SIZE);
      cargadoEn.current = Date.now();
    } catch (e) {
      console.error(`[Wiki] No se pudo cargar más de ${coleccion}:`, e);
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, hasMore, loadingMore, consulta, coleccion]);

  return { items, loading, loadingMore, hasMore, loadMore };
}

/**
 * Recuento exacto sin descargar los documentos. Firestore factura
 * las agregaciones aparte y suelen ser mucho más baratas que traer
 * miles de fichas solo para enseñar un número en la pestaña.
 */
export function useCollectionCount(coleccion: string, enabled = true): number | null {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || total !== null) return;
    let activo = true;

    void measureRead(
      { name: `${coleccion}:count`, collection: coleccion, origin: 'useCatalogPage' },
      () => 1,
      () => getCountFromServer(collection(db, coleccion)),
    )
      .then((snap) => {
        if (activo) setTotal(snap.data().count);
      })
      .catch((e: Error) => {
        console.warn(`[Wiki] No se pudo contar ${coleccion}:`, e);
      });

    return () => {
      activo = false;
    };
  }, [coleccion, enabled, total]);

  return total;
}
