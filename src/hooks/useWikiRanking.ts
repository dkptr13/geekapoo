import { useEffect, useState } from 'react';

import {
  fetchAnimeRanking,
  type RankingMetric,
} from '../services/animeStats';
import type { Anime } from '../types';

interface WikiRankingState {
  entries: Anime[];
  loading: boolean;
  error: string | null;
}

/**
 * Ranking ya ordenado y limitado.
 *
 * No monta ningún listener: los contadores cambian poco y una
 * consulta de 5 documentos con caché de 5 minutos es suficiente.
 * Al abrir el ranking completo se pide otro bloque mayor.
 */
export function useWikiRanking(
  metric: RankingMetric,
  limite: number,
): WikiRankingState {
  const [entries, setEntries] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    setError(null);

    void fetchAnimeRanking(metric, limite)
      .then((lista) => {
        if (!activo) return;
        setEntries(lista);
      })
      .catch((e: unknown) => {
        if (!activo) return;
        console.error(`[Wiki] No se pudo cargar el ranking de ${metric}:`, e);
        setEntries([]);
        setError('No se pudo cargar el ranking.');
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [metric, limite]);

  return { entries, loading, error };
}
