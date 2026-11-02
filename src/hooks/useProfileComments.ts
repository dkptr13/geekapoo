import { useEffect, useState } from 'react';

import { getCommentsByAuthor, getCommentsLikedBy } from '../services/comments';
import type { Comment } from '../types';

// ======================================================
// COMENTARIOS DEL PERFIL
// ======================================================
//
// Se piden solo los del autor (y los que le gustaron), acotados y con
// caché corta. Antes el perfil leía la colección global `comments`
// que mantenía un listener abierto para todo el mundo.

export interface UseProfileComments {
  comments: Comment[];
  likedComments: Comment[];
  loading: boolean;
}

export function useProfileComments(uid: string | null): UseProfileComments {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedComments, setLikedComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setComments([]);
      setLikedComments([]);
      setLoading(false);
      return;
    }

    let activo = true;
    setLoading(true);

    const cargar = async (force = false) => {
      try {
        const [suyos, gustados] = await Promise.all([
          getCommentsByAuthor(uid, force),
          getCommentsLikedBy(uid, force),
        ]);
        if (!activo) return;
        setComments(suyos);
        setLikedComments(gustados);
      } catch (e) {
        console.error('[Profile] No se pudieron leer los comentarios:', e);
      } finally {
        if (activo) setLoading(false);
      }
    };

    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key?.startsWith('comments:author:') || key?.startsWith('comments:liked:')) {
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

  return { comments, likedComments, loading };
}
