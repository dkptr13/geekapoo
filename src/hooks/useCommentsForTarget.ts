import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { recordListenerSnapshot, trackListener } from '../lib/firestoreDiagnostics';
import { mapWithId } from '../services/firestoreUtils';
import { ponerLikeLocal } from '../utils/likes';
import type { Comment } from '../types';

// ======================================================
// COMENTARIOS DE UN OBJETIVO ABIERTO
// ======================================================
//
// Antes se descargaba la colección `comments` entera para todos los
// visitantes. Ahora solo se abre un listener cuando el usuario
// despliega los comentarios de un hilo, episodio o personaje. Se
// mantiene en tiempo real porque una respuesta debe aparecer al
// instante, pero el alcance es un único target y una página acotada.

export const COMMENTS_PAGE_SIZE = 200;

export interface UseCommentsForTarget {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  /** Cambia el corazón y el contador locales sin esperar al servidor. */
  marcarLikeLocal: (commentId: string, uid: string, liked: boolean) => void;
}

export function useCommentsForTarget(
  targetType: Comment['targetType'] | null,
  targetId: string | null,
): UseCommentsForTarget {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetType || !targetId) {
      setComments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let activo = true;
    setLoading(true);
    setComments([]);
    setError(null);

    const meta = {
      name: 'comments:objetivo',
      collection: 'comments',
      origin: 'useCommentsForTarget',
    };
    let detener: (() => void) | null = null;

    const iniciar = (ordenada: boolean) => {
      const base = [
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
      ];
      const consulta = ordenada
        ? query(
            collection(db, 'comments'),
            ...base,
            orderBy('createdAt', 'desc'),
            limit(COMMENTS_PAGE_SIZE),
          )
        // Antes de desplegar el índice nuevo, esta consulta usa el
        // índice existente de targetType + targetId y ordena en el
        // cliente. La app sigue funcionando durante la actualización.
        : query(
            collection(db, 'comments'),
            ...base,
            limit(COMMENTS_PAGE_SIZE),
          );

      detener = trackListener(meta, onSnapshot(
        consulta,
        (snap) => {
          recordListenerSnapshot(meta, snap.size, snap.docChanges().length);
          if (!activo) return;
          const filas = mapWithId<Comment>(snap);
          filas.sort(
            (a, b) =>
              (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
          );
          setComments(filas);
          setLoading(false);
          setError(null);
        },
        (e: Error & { code?: string }) => {
          if (!activo) return;
          if (ordenada && e.code === 'failed-precondition') {
            detener?.();
            iniciar(false);
            return;
          }
          console.error('[Comments] No se pudieron leer los comentarios:', e);
          setError('No se pudieron cargar los comentarios.');
          setLoading(false);
        },
      ));
    };

    iniciar(true);

    return () => {
      activo = false;
      detener?.();
    };
    // La firma incluye solo el objetivo, no la lista que llega en
    // cada render.
  }, [targetType, targetId]);

  const marcarLikeLocal = useCallback(
    (commentId: string, uid: string, liked: boolean) => {
      setComments((prev) => prev.map((c) => (
        c.id === commentId ? ponerLikeLocal(c, uid, liked) : c
      )));
    },
    [],
  );

  return { comments, loading, error, marcarLikeLocal };
}
