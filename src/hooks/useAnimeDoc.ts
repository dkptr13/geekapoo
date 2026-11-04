import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { withId } from '../services/firestoreUtils';
import type { Anime } from '../types';

// ======================================================
// UNA SERIE CONCRETA
// ======================================================
//
// La Wiki ya no descarga los 195 animes para pintar el catálogo:
// usa `public/busqueda/animes.json`. Cuando se abre una ficha, solo
// se lee el documento de ESA serie para tener los campos completos
// (streaming heredado, likes reales, comentarios...).
//
// Es una lectura puntual, cacheada dos minutos. Si la URL trae un
// slug que no está en la lista ligera, se busca por `slug`.

const TTL_ANIME = 2 * 60 * 1000;

async function leerAnime(idOrSlug: string): Promise<Anime | null> {
  return cachedRead<Anime | null>({
    key: `anime-doc:${idOrSlug}`,
    ttlMs: TTL_ANIME,
    scope: PUBLIC_CACHE,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        { name: 'anime:doc', collection: 'animes', origin: 'useAnimeDoc' },
        () => 1,
        () => getDoc(doc(db, 'animes', idOrSlug)),
      );

      if (snap.exists()) {
        return withId<Anime>(snap as unknown as QueryDocumentSnapshot);
      }

      // Enlaces antiguos con slug, o una serie nueva que todavía no
      // está en el índice estático.
      const porSlug = await measureRead(
        { name: 'anime:slug', collection: 'animes', origin: 'useAnimeDoc' },
        (result) => result.size,
        () =>
          getDocs(
            query(
              collection(db, 'animes'),
              where('slug', '==', idOrSlug),
              limit(1),
            ),
          ),
      );

      if (porSlug.empty) return null;
      return withId<Anime>(porSlug.docs[0]);
    },
  });
}

export function useAnimeDoc(
  idOrSlug: string | null,
  enabled = true,
): Anime | null {
  // Se guarda también la clave pedida: al navegar de una serie a otra
  // no se puede devolver el documento de la anterior mientras llega
  // el nuevo. Sin esto, la ficha enseñaba durante un instante el
  // anime equivocado.
  const [datos, setDatos] = useState<{
    clave: string;
    anime: Anime | null;
  } | null>(null);
  const [refresco, setRefresco] = useState(0);

  // El panel invalida `anime-doc:` al editar una serie y la ficha lo
  // hace al confirmar un like. Sin este aviso, la copia abierta
  // seguiría enseñando el documento anterior hasta el TTL.
  useEffect(() => {
    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (typeof key === 'string' && key.startsWith('anime-doc:')) {
        setRefresco((n) => n + 1);
      }
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    return () =>
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
  }, []);

  useEffect(() => {
    if (!idOrSlug || !enabled) return;

    let activo = true;
    void leerAnime(idOrSlug)
      .then((anime) => {
        if (activo) setDatos({ clave: idOrSlug, anime });
      })
      .catch((e: Error) => {
        console.warn('[Wiki] No se pudo leer la ficha del anime:', e);
      });

    return () => {
      activo = false;
    };
  }, [idOrSlug, enabled, refresco]);

  if (!idOrSlug || !enabled || datos?.clave !== idOrSlug) return null;
  return datos.anime;
}
