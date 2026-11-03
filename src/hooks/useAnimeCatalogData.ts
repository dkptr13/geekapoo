import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from '../services/firestoreUtils';

// ======================================================
// FILAS DEL CATÁLOGO DE LAS SERIES FILTRADAS
// ======================================================
//
// Cuando hay filtros, no hace falta descargar todos los episodios o
// personajes del proyecto: basta con los de las series que pasan
// esos filtros. Se consulta en bloques de 30 `animeId`, el máximo de
// un `in` de Firestore.
//
// ── LO QUE CAMBIÓ EN LA SEGUNDA FASE ───────────────────────
//
//   - Cada bloque pasa por `cachedRead` (30 min, persistido en
//     IndexedDB). Cambiar de filtro y volver al anterior ya no
//     vuelve a leer los mismos documentos, y dos componentes que
//     piden el mismo bloque comparten la misma petición.
//   - Los bloques se cargan de uno en uno. El primero pinta la
//     pestaña; los siguientes se piden con "Cargar más". Antes se
//     lanzaban todos a la vez: con 195 series eran ~2.000 lecturas
//     para enseñar la primera pantalla.
//   - La clave empieza por `community:episodes` /
//     `community:characters`, así que la invalidación del panel
//     (`invalidateCache('community:episodes')`) borra también estos
//     bloques. No hay una segunda caché que se quede vieja.

// 10 series por bloque. Firestore permite hasta 30 en un `in`,
// pero con 30 el primer bloque devolvía ~600 episodios y la pestaña
// seguía leyendo de más antes de que el usuario pidiera "Ver más".
// Con 10 la primera pantalla cuesta ~200 y el resto se pide a mano.
const CHUNK = 10;
const TTL_FILTRADOS = 30 * 60 * 1000;

export interface AnimeCatalogData<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  /** Pide el siguiente bloque de 30 series. */
  loadMore: () => Promise<void>;
}

/** Une dos listas sin repetir ids, conservando el orden de llegada. */
function unir<T extends { id: string }>(base: T[], extra: T[]): T[] {
  if (extra.length === 0) return base;
  const vistos = new Set(base.map((item) => item.id));
  const nuevos = extra.filter((item) => !vistos.has(item.id));
  return nuevos.length > 0 ? [...base, ...nuevos] : base;
}

export function useAnimeCatalogData<T extends { id: string }>(
  coleccion: string,
  animeIds: string[],
  enabled: boolean,
): AnimeCatalogData<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refresco, setRefresco] = useState(0);
  const peticionRef = useRef(0);
  const bloquesRef = useRef<string[][]>([]);
  const siguienteRef = useRef(0);
  const activoRef = useRef(true);

  // Una firma estable evita relanzar las consultas cuando el array
  // se reconstruye con los mismos ids.
  const firma = animeIds.slice().sort().join('|');

  const leerBloque = useCallback(
    (grupo: string[]): Promise<T[]> => {
      const ids = grupo.slice().sort();
      return cachedRead<T[]>({
        key: `community:${coleccion}:filtrados:${ids.join(',')}`,
        ttlMs: TTL_FILTRADOS,
        scope: PUBLIC_CACHE,
        persist: true,
        read: async () => {
          const snap = await measureRead(
            {
              name: `${coleccion}:filtrados`,
              collection: coleccion,
              origin: 'useAnimeCatalogData',
            },
            (result) => result.size,
            () =>
              getDocs(
                query(
                  collection(db, coleccion),
                  where('animeId', 'in', grupo),
                ),
              ),
          );
          return mapWithId<T>(snap);
        },
      });
    },
    [coleccion],
  );

  useEffect(() => {
    activoRef.current = true;

    if (!enabled) {
      peticionRef.current += 1;
      bloquesRef.current = [];
      siguienteRef.current = 0;
      setItems([]);
      setLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      return;
    }

    const ids = firma ? firma.split('|') : [];
    if (ids.length === 0) {
      peticionRef.current += 1;
      bloquesRef.current = [];
      siguienteRef.current = 0;
      setItems([]);
      setLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      return;
    }

    const peticion = ++peticionRef.current;
    const bloques: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      bloques.push(ids.slice(i, i + CHUNK));
    }

    bloquesRef.current = bloques;
    siguienteRef.current = 0;
    setItems([]);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);

    void leerBloque(bloques[0])
      .then((lista) => {
        if (!activoRef.current || peticion !== peticionRef.current) return;
        siguienteRef.current = 1;
        setItems(unir([], lista));
        setHasMore(bloques.length > 1);
      })
      .catch((e: Error) => {
        if (!activoRef.current || peticion !== peticionRef.current) return;
        console.error(`[Wiki] No se pudieron filtrar ${coleccion}:`, e);
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (activoRef.current && peticion === peticionRef.current) setLoading(false);
      });

    return () => {
      activoRef.current = false;
    };
  }, [coleccion, enabled, firma, leerBloque, refresco]);

  // El panel invalida `community:episodes` o `community:characters`
  // al editar. Si esta vista filtrada está montada, se vuelve a pedir
  // el primer bloque en vez de esperar al TTL de 30 minutos.
  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === `community:${coleccion}`) setRefresco((n) => n + 1);
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () => window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, [coleccion]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!enabled || loading || loadingMore) return;

    const bloques = bloquesRef.current;
    const indice = siguienteRef.current;
    if (indice >= bloques.length) {
      setHasMore(false);
      return;
    }

    const peticion = peticionRef.current;
    setLoadingMore(true);
    try {
      const lista = await leerBloque(bloques[indice]);
      if (!activoRef.current || peticion !== peticionRef.current) return;
      siguienteRef.current = indice + 1;
      setItems((prev) => unir(prev, lista));
      setHasMore(indice + 1 < bloques.length);
    } catch (e) {
      console.error(`[Wiki] No se pudo cargar más de ${coleccion}:`, e);
      if (peticion === peticionRef.current) setHasMore(false);
    } finally {
      if (activoRef.current && peticion === peticionRef.current) setLoadingMore(false);
    }
  }, [coleccion, enabled, leerBloque, loading, loadingMore]);

  return { items, loading, loadingMore, hasMore, loadMore };
}
