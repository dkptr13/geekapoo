import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from '../services/firestoreUtils';
import { normalizarHilo } from '../utils/threads';
import type { Comment, Thread } from '../types';

// ======================================================
// HILOS DEL PERFIL
// ======================================================
//
// Antes el perfil llamaba a `ensureAllThreads()` y descargaba la
// colección `threads` completa para quedarse con los hilos del
// usuario y los que le gustaban. Con pocos hilos no se notaba, pero
// era una lectura que crecía sin límite.
//
// Ahora se piden solo esas dos listas. Los títulos de los hilos que
// aparecen en los comentarios se leen por id y se cachean aparte.

const TTL_HILOS_PERFIL = 2 * 60 * 1000;

function leerHilosDeAutor(uid: string, force = false): Promise<Thread[]> {
  return cachedRead<Thread[]>({
    key: `profile:threads:author:${uid}`,
    ttlMs: TTL_HILOS_PERFIL,
    scope: PUBLIC_CACHE,
    force,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        {
          name: 'profile:threads:author',
          collection: 'threads',
          origin: 'useProfileThreads',
        },
        (result) => result.size,
        () =>
          getDocs(
            query(
              collection(db, 'threads'),
              where('authorId', '==', uid),
              orderBy('createdAt', 'desc'),
            ),
          ),
      );
      return mapWithId<Thread>(snap).map(normalizarHilo);
    },
  });
}

function leerHilosGustados(uid: string, force = false): Promise<Thread[]> {
  return cachedRead<Thread[]>({
    key: `profile:threads:liked:${uid}`,
    ttlMs: TTL_HILOS_PERFIL,
    scope: PUBLIC_CACHE,
    force,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        {
          name: 'profile:threads:liked',
          collection: 'threads',
          origin: 'useProfileThreads',
        },
        (result) => result.size,
        () =>
          getDocs(
            query(
              collection(db, 'threads'),
              where('likedBy', 'array-contains', uid),
              orderBy('createdAt', 'desc'),
            ),
          ),
      );
      return mapWithId<Thread>(snap).map(normalizarHilo);
    },
  });
}

/** Título de un hilo concreto, para los comentarios que apuntan a él. */
function leerTituloHilo(threadId: string): Promise<string | null> {
  return cachedRead<string | null>({
    key: `profile:thread-title:${threadId}`,
    ttlMs: TTL_HILOS_PERFIL,
    scope: PUBLIC_CACHE,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        {
          name: 'profile:thread-title',
          collection: 'threads',
          origin: 'useProfileThreads',
        },
        () => 1,
        () => getDoc(doc(db, 'threads', threadId)),
      );

      if (!snap.exists()) return null;
      const titulo = snap.data().title;
      return typeof titulo === 'string' ? titulo : '';
    },
  });
}

export interface UseProfileThreads {
  hilosPropios: Thread[];
  hilosGustados: Thread[];
  /** id del hilo → título, para los comentarios de tipo `thread`. */
  titulosHilos: Record<string, string>;
}

export function useProfileThreads(
  uid: string | null,
  comments: Comment[],
  likedComments: Comment[],
): UseProfileThreads {
  const [hilosPropios, setHilosPropios] = useState<Thread[]>([]);
  const [hilosGustados, setHilosGustados] = useState<Thread[]>([]);
  const [titulosHilos, setTitulosHilos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!uid) {
      setHilosPropios([]);
      setHilosGustados([]);
      return;
    }

    let activo = true;
    const cargar = async (force = false) => {
      try {
        const [propios, gustados] = await Promise.all([
          leerHilosDeAutor(uid, force),
          leerHilosGustados(uid, force),
        ]);
        if (!activo) return;
        setHilosPropios(propios);
        setHilosGustados(gustados);
      } catch (e) {
        if (!activo) return;
        console.error('[Profile] No se pudieron leer los hilos del perfil:', e);
      }
    };

    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (
        key === 'community:threads' ||
        key?.startsWith('community:threads:') ||
        key?.startsWith('profile:threads:')
      ) {
        void cargar(true);
      }
    };

    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    void cargar();

    return () => {
      activo = false;
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
    };
  }, [uid]);

  useEffect(() => {
    const conocidos: Record<string, string> = {};
    for (const hilo of [...hilosPropios, ...hilosGustados]) {
      conocidos[hilo.id] = hilo.title;
    }

    const ids = new Set<string>();
    for (const comment of comments) {
      if (comment.targetType === 'thread') ids.add(comment.targetId);
    }
    for (const comment of likedComments) {
      if (comment.targetType === 'thread') ids.add(comment.targetId);
    }

    // Los hilos propios o gustados ya traen su título; solo se leen
    // los de terceros que aparecen en los comentarios.
    const faltan = [...ids].filter((id) => !conocidos[id]);

    if (faltan.length === 0) {
      setTitulosHilos(conocidos);
      return;
    }

    let activo = true;
    void Promise.all(
      faltan.map(async (id) => [id, await leerTituloHilo(id)] as const),
    )
      .then((pares) => {
        if (!activo) return;
        const titulos = { ...conocidos };
        for (const [id, titulo] of pares) {
          if (titulo) titulos[id] = titulo;
        }
        setTitulosHilos(titulos);
      })
      .catch((e) => {
        if (activo) {
          console.error('[Profile] No se pudieron leer los títulos de los hilos:', e);
        }
      });

    return () => {
      activo = false;
    };
  }, [comments, likedComments, hilosPropios, hilosGustados]);

  return { hilosPropios, hilosGustados, titulosHilos };
}
