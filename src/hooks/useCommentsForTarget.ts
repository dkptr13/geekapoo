import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import {
  measureRead,
  recordListenerSnapshot,
  trackListener,
} from '../lib/firestoreDiagnostics';
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
// instante, pero el alcance es un único target.
//
// La primera página trae las 200 más recientes. Los tramos anteriores
// se piden solo al pulsar "Cargar comentarios anteriores" y se guardan
// mientras el objetivo siga abierto.

export const COMMENTS_PAGE_SIZE = 200;

function ordenarYUnir(a: Comment[], b: Comment[]): Comment[] {
  const porId = new Map<string, Comment>();
  [...a, ...b].forEach((comment) => porId.set(comment.id, comment));
  return [...porId.values()].sort(
    (x, y) => (Date.parse(x.createdAt) || 0) - (Date.parse(y.createdAt) || 0),
  );
}

export interface UseCommentsForTarget {
  comments: Comment[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  /** Carga el tramo anterior al más antiguo que ya está en pantalla. */
  loadMore: () => Promise<void>;
  /** Cambia el corazón y el contador locales sin esperar al servidor. */
  marcarLikeLocal: (commentId: string, uid: string, liked: boolean) => void;
}

export function useCommentsForTarget(
  targetType: Comment['targetType'] | null,
  targetId: string | null,
): UseCommentsForTarget {
  const [pagina, setPagina] = useState<Comment[]>([]);
  const [anteriores, setAnteriores] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cursor de la página más antigua cargada. Se guarda el documento
  // real y no solo la fecha para no saltarse mensajes con el mismo
  // timestamp.
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hayAnterioresRef = useRef(false);

  useEffect(() => {
    if (!targetType || !targetId) {
      setPagina([]);
      setAnteriores([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      cursorRef.current = null;
      hayAnterioresRef.current = false;
      return;
    }

    let activo = true;
    setLoading(true);
    setPagina([]);
    setAnteriores([]);
    setHasMore(false);
    setLoadingMore(false);
    setError(null);
    cursorRef.current = null;
    hayAnterioresRef.current = false;

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
            limit(COMMENTS_PAGE_SIZE + 1),
          )
        // Si el índice nuevo aún no está desplegado, se usa el índice
        // anterior. No se ofrece paginación hasta poder ordenar bien.
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

          const docs = ordenada
            ? snap.docs.slice(0, COMMENTS_PAGE_SIZE)
            : snap.docs;
          const filas = mapWithId<Comment>(snap).slice(0, docs.length);
          filas.sort(
            (a, b) =>
              (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
          );

          setPagina(filas);
          setHasMore(ordenada && snap.size > COMMENTS_PAGE_SIZE);
          setLoading(false);
          setError(null);

          if (!hayAnterioresRef.current) {
            // En orden ascendente el último doc es el más antiguo de
            // esta página; desde ahí se pide el tramo anterior.
            cursorRef.current = docs[docs.length - 1] ?? null;
          }
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
  }, [targetType, targetId]);

  const comments = useMemo(
    () => ordenarYUnir(anteriores, pagina),
    [anteriores, pagina],
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (!targetType || !targetId || !hasMore || loadingMore) return;
    const cursor = cursorRef.current;
    if (!cursor) return;

    setLoadingMore(true);
    try {
      const snap = await measureRead(
        {
          name: 'comments:anteriores',
          collection: 'comments',
          origin: 'useCommentsForTarget',
        },
        (result) => result.size,
        () => getDocs(query(
          collection(db, 'comments'),
          where('targetType', '==', targetType),
          where('targetId', '==', targetId),
          orderBy('createdAt', 'desc'),
          startAfter(cursor),
          limit(COMMENTS_PAGE_SIZE + 1),
        )),
      );

      const docs = snap.docs.slice(0, COMMENTS_PAGE_SIZE);
      const filas = mapWithId<Comment>(snap).slice(0, docs.length);
      filas.sort(
        (a, b) =>
          (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
      );

      hayAnterioresRef.current = true;
      cursorRef.current = docs[docs.length - 1] ?? cursor;
      setAnteriores((prev) => ordenarYUnir(prev, filas));
      setHasMore(snap.size > COMMENTS_PAGE_SIZE);
    } catch (e) {
      console.error('[Comments] No se pudo cargar el historial anterior:', e);
      setError('No se pudo cargar el historial anterior.');
    } finally {
      setLoadingMore(false);
    }
  }, [targetType, targetId, hasMore, loadingMore]);

  const marcarLikeLocal = useCallback(
    (commentId: string, uid: string, liked: boolean) => {
      const cambiar = (prev: Comment[]) => prev.map((c) => (
        c.id === commentId ? ponerLikeLocal(c, uid, liked) : c
      ));
      setPagina(cambiar);
      setAnteriores(cambiar);
    },
    [],
  );

  return {
    comments,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    marcarLikeLocal,
  };
}
