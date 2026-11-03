import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from '../services/firestoreUtils';

// ======================================================
// PÁGINA DEL CATÁLOGO GLOBAL
// ======================================================
//
// Episodios y personajes pueden ser miles. La navegación normal
// carga una página y la amplía bajo demanda; la búsqueda o los
// filtros siguen usando la consulta por anime para no dar resultados
// incompletos.
//
// Cada página pasa por `cachedRead` (5 min, persistido), no solo por
// un TTL de estado local. Así cambiar de pestaña y volver, o
// recargar dentro del TTL, no vuelve a leer los mismos 60 documentos.
// La página siguiente se cachea por el id del último documento.

export const CATALOG_PAGE_SIZE = 60;
const CATALOG_PAGE_TTL = 5 * 60 * 1000;

export interface CatalogPage<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

interface PageCache<T> {
  items: T[];
  hasMore: boolean;
  /** Último documento de la página, para `startAfter`. */
  lastId: string;
  /** Valor del campo de orden, si la consulta ordena por uno. */
  lastValue?: string;
}

interface Cursor {
  id: string;
  value?: string;
}

function pageKey(coleccion: string, orderByField?: string): string {
  return `catalog:page:${coleccion}:${orderByField ?? '__name__'}`;
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
  const [refresco, setRefresco] = useState(0);
  const cursorRef = useRef<Cursor | null>(null);
  const cargadoEn = useRef(0);

  const leerPagina = useCallback(
    (despues?: Cursor): Promise<PageCache<T>> => {
      // `startAfter` necesita que el número de valores no supere el
      // de `orderBy()`. Firestore añade el id como criterio implícito,
      // pero para poder pasar el id hay que declararlo.
      const partes: QueryConstraint[] = orderByField
        ? [orderBy(orderByField, 'asc'), orderBy('__name__', 'asc')]
        : [orderBy('__name__', 'asc')];

      if (despues) {
        // Con `orderBy(field)`, Firestore añade el id del documento
        // como último criterio. Para la consulta sin orden explícito
        // el único criterio es el id.
        partes.push(
          orderByField
            ? startAfter(despues.value ?? '', despues.id)
            : startAfter(despues.id),
        );
      }
      partes.push(limit(CATALOG_PAGE_SIZE + 1));

      const clave = despues
        ? `${pageKey(coleccion, orderByField)}:after:${despues.id}`
        : `${pageKey(coleccion, orderByField)}:first`;

      return cachedRead<PageCache<T>>({
        key: clave,
        ttlMs: CATALOG_PAGE_TTL,
        scope: PUBLIC_CACHE,
        persist: true,
        read: async () => {
          const snap = await measureRead(
            {
              name: despues ? `${coleccion}:pagina:anterior` : `${coleccion}:pagina`,
              collection: coleccion,
              origin: 'useCatalogPage',
            },
            (result) => result.size,
            () => getDocs(query(collection(db, coleccion), ...partes)),
          );

          const docs = snap.docs.slice(0, CATALOG_PAGE_SIZE);
          const filas = mapWithId<T>(snap).slice(0, docs.length);
          const ultimo = filas[filas.length - 1] as
            | (T & Record<string, unknown>)
            | undefined;

          return {
            items: filas,
            hasMore: snap.size > CATALOG_PAGE_SIZE,
            lastId: docs[docs.length - 1]?.id ?? '',
            lastValue: orderByField
              ? String(ultimo?.[orderByField] ?? '')
              : undefined,
          };
        },
      });
    },
    [coleccion, orderByField],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (items.length > 0 && Date.now() - cargadoEn.current < CATALOG_PAGE_TTL) return;

    let activo = true;
    setLoading(true);

    void leerPagina()
      .then((pagina) => {
        if (!activo) return;
        setItems(pagina.items);
        cursorRef.current = pagina.lastId
          ? { id: pagina.lastId, value: pagina.lastValue }
          : null;
        setHasMore(pagina.hasMore);
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
  }, [enabled, items.length, leerPagina, coleccion, refresco]);

  // Si el panel edita esta colección, la página abierta se vuelve a
  // pedir. La caché ya se ha invalidado desde `catalogAdmin`; esto
  // solo evita que la vista montada siga enseñando la copia vieja
  // hasta que el usuario cambie de pestaña.
  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key !== `catalog:page:${coleccion}`) return;
      setItems([]);
      cursorRef.current = null;
      cargadoEn.current = 0;
      setHasMore(false);
      setRefresco((n) => n + 1);
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () => window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, [coleccion]);

  const loadMore = useCallback(async (): Promise<void> => {
    const cursor = cursorRef.current;
    if (!enabled || !cursor || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const pagina = await leerPagina(cursor);
      const nuevos = pagina.items;
      const ultimo = nuevos[nuevos.length - 1];
      cursorRef.current = pagina.lastId
        ? { id: pagina.lastId, value: pagina.lastValue }
        : ultimo
          ? { id: (ultimo as { id?: string }).id ?? '', value: pagina.lastValue }
          : null;
      setItems((prev) => {
        const vistos = new Set(prev.map((item) => (item as { id?: string }).id));
        return [...prev, ...nuevos.filter((item) => !vistos.has((item as { id?: string }).id))];
      });
      setHasMore(pagina.hasMore);
      cargadoEn.current = Date.now();
    } catch (e) {
      console.error(`[Wiki] No se pudo cargar más de ${coleccion}:`, e);
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, hasMore, loadingMore, leerPagina, coleccion]);

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

    void cachedRead<number>({
      key: `catalog:count:${coleccion}`,
      ttlMs: CATALOG_PAGE_TTL,
      scope: PUBLIC_CACHE,
      persist: true,
      read: () =>
        measureRead(
          { name: `${coleccion}:count`, collection: coleccion, origin: 'useCatalogPage' },
          () => 1,
          () => getCountFromServer(collection(db, coleccion)),
        ).then((snap) => snap.data().count),
    })
      .then((total) => {
        if (activo) setTotal(total);
      })
      .catch((e: Error) => {
        console.warn(`[Wiki] No se pudo contar ${coleccion}:`, e);
      });

    return () => {
      activo = false;
    };
  }, [coleccion, enabled, total]);

  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === `catalog:count:${coleccion}`) setTotal(null);
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () => window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, [coleccion]);

  return total;
}
