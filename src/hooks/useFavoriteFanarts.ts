import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getFavoriteFanartIds,
  setFavoriteFanart,
} from '../services/fanartFavorites';

/**
 * Estado de los fanarts guardados por la persona.
 *
 * Se lee una vez per usuario (y solo cuando la pestaña Fanarts está
 * activa). No hay listener. El botón actualiza la lista de forma
 * optimista y revierte si Firestore rechaza la escritura.
 */
export function useFavoriteFanarts(
  uid: string | null | undefined,
  enabled = true,
) {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const cargadoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) {
      cargadoRef.current = null;
      setIds([]);
      setLoading(false);
      return;
    }

    // No se consulta hasta que hace falta, y no se repite cada vez
    // que se vuelve a la pestaña dentro de la misma sesión.
    if (!enabled || cargadoRef.current === uid) return;

    let activo = true;
    cargadoRef.current = uid;
    setLoading(true);

    void getFavoriteFanartIds(uid)
      .then((lista) => {
        if (activo) setIds(lista);
      })
      .catch((e) => {
        if (activo) {
          cargadoRef.current = null;
          console.error('[Fanarts] No se pudieron leer los guardados:', e);
        }
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [uid, enabled]);

  const guardados = useMemo(() => new Set(ids), [ids]);

  const esGuardado = useCallback(
    (threadId: string) => guardados.has(threadId),
    [guardados],
  );

  const alternar = useCallback(
    async (threadId: string): Promise<boolean> => {
      if (!uid) throw new Error('Necesitas iniciar sesión para guardar fanarts.');

      const estaba = ids.includes(threadId);

      setIds((prev) =>
        estaba
          ? prev.filter((id) => id !== threadId)
          : [threadId, ...prev.filter((id) => id !== threadId)],
      );

      try {
        await setFavoriteFanart(uid, threadId, !estaba);
        return !estaba;
      } catch (e) {
        setIds((prev) =>
          estaba
            ? [threadId, ...prev.filter((id) => id !== threadId)]
            : prev.filter((id) => id !== threadId),
        );
        throw e;
      }
    },
    [ids, uid],
  );

  return { ids, loading, esGuardado, alternar };
}
