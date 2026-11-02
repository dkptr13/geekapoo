import { useEffect, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
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

const CHUNK = 30;

export interface AnimeCatalogData<T> {
  items: T[];
  loading: boolean;
}

export function useAnimeCatalogData<T extends { id: string }>(
  coleccion: string,
  animeIds: string[],
  enabled: boolean,
): AnimeCatalogData<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const peticionRef = useRef(0);

  // Una firma estable evita relanzar las consultas cuando el array
  // se reconstruye con los mismos ids.
  const firma = animeIds.slice().sort().join('|');

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const ids = firma ? firma.split('|') : [];
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const peticion = ++peticionRef.current;
    let activo = true;
    setLoading(true);

    const trozos: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      trozos.push(ids.slice(i, i + CHUNK));
    }

    void Promise.all(
      trozos.map((grupo) => measureRead(
        { name: `${coleccion}:filtrados`, collection: coleccion, origin: 'useAnimeCatalogData' },
        (result) => result.size,
        () => getDocs(query(
          collection(db, coleccion),
          where('animeId', 'in', grupo),
        )),
      )),
    )
      .then((snaps) => {
        if (!activo || peticion !== peticionRef.current) return;
        const porId = new Map<string, T>();
        snaps.forEach((snap) => {
          mapWithId<T>(snap).forEach((item) => porId.set(item.id, item));
        });
        setItems([...porId.values()]);
      })
      .catch((e: Error) => {
        if (!activo || peticion !== peticionRef.current) return;
        console.error(`[Wiki] No se pudieron filtrar ${coleccion}:`, e);
        setItems([]);
      })
      .finally(() => {
        if (activo && peticion === peticionRef.current) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [coleccion, enabled, firma]);

  return { items, loading };
}
