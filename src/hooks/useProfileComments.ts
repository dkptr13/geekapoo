import { useCallback, useEffect, useState } from 'react';

import {
  countCommentsByAuthor,
  getCommentsByAuthor,
  getCommentsLikedBy,
  getMoreCommentsByAuthor,
  PROFILE_COMMENTS_PAGE_SIZE,
  sumCommentReactionsByAuthor,
} from '../services/comments';
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
  /** Recuento total, no limitado a la página cargada. */
  totalComments: number;
  /**
   * Reacciones recibidas en todos sus comentarios. `null` si la
   * agregación falla; en ese caso se usa lo cargado como respaldo.
   */
  reactionsTotal: number | null;
  likedComments: Comment[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useProfileComments(uid: string | null): UseProfileComments {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [reactionsTotal, setReactionsTotal] = useState<number | null>(null);
  const [likedComments, setLikedComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!uid) {
      setComments([]);
      setTotalComments(0);
      setReactionsTotal(null);
      setLikedComments([]);
      setLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      return;
    }

    let activo = true;
    setLoading(true);
    setLoadingMore(false);

    const cargar = async (force = false) => {
      try {
        const [suyos, gustados, total, reacciones] = await Promise.all([
          getCommentsByAuthor(uid, force),
          getCommentsLikedBy(uid, force),
          countCommentsByAuthor(uid).catch(() => null),
          sumCommentReactionsByAuthor(uid).catch(() => null),
        ]);
        if (!activo) return;
        setComments(suyos.slice(0, PROFILE_COMMENTS_PAGE_SIZE));
        setHasMore(suyos.length > PROFILE_COMMENTS_PAGE_SIZE);
        setTotalComments(total ?? suyos.length);
        setReactionsTotal(reacciones);
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

  const loadMore = useCallback(async (): Promise<void> => {
    if (!uid || !hasMore || loadingMore) return;
    const ultimo = comments[comments.length - 1];
    if (!ultimo) return;

    setLoadingMore(true);
    try {
      const pagina = await getMoreCommentsByAuthor(uid, ultimo.createdAt);
      setComments((prev) => {
        const porId = new Map<string, Comment>();
        [...prev, ...pagina.comments].forEach((c) => porId.set(c.id, c));
        return [...porId.values()].sort(
          (a, b) =>
            (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
        );
      });
      setHasMore(pagina.hasMore);
    } catch (e) {
      console.error('[Profile] No se pudo cargar más actividad:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [uid, comments, hasMore, loadingMore]);

  return {
    comments,
    totalComments,
    reactionsTotal,
    likedComments,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  };
}
