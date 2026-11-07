import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Eye,
  Film,
  Flame,
  Heart,
  X,
} from 'lucide-react';

import { RANKING_COMPLETO_LIMITE } from '../../services/animeStats';
import type { RankingMetric } from '../../services/animeStats';
import { useWikiRanking } from '../../hooks/useWikiRanking';
import type { Anime } from '../../types';

// ======================================================
// RANKINGS DE LA WIKI
// ======================================================
//
// Dos módulos compactos debajo de «Sorpréndeme»:
//   - Series más gustadas (likesCount).
//   - Series más vistas (viewsCount).
//
// Los dos leen agregados ya calculados. No hay listeners ni se
// descargan votos/visitas individuales.

const METRICAS: Record<
  RankingMetric,
  {
    titulo: string;
    icono: typeof Flame;
    colorIcono: string;
    colorBarra: string;
    etiqueta: string;
  }
> = {
  likes: {
    titulo: 'Series más gustadas',
    icono: Flame,
    colorIcono: 'text-orange-400',
    colorBarra: 'from-orange-500 to-pink-500',
    etiqueta: 'Me gusta',
  },
  views: {
    titulo: 'Series más vistas',
    icono: Eye,
    colorIcono: 'text-violet-300',
    colorBarra: 'from-violet-500 to-sky-400',
    etiqueta: 'visualizaciones',
  },
};

function contadorDe(anime: Anime, metric: RankingMetric): number {
  return metric === 'likes'
    ? Math.max(0, Number(anime.likesCount) || 0)
    : Math.max(0, Number(anime.viewsCount) || 0);
}

/** 1245 → 1,2K; 2_100_000 → 2,1M. */
function compacto(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace('.', ',')}K`;
  }
  return String(Math.floor(n));
}

const Miniatura: FC<{ anime: Anime; size?: 'sm' | 'md' }> = ({
  anime,
  size = 'sm',
}) => {
  const clase =
    size === 'sm'
      ? 'h-10 w-8 rounded-lg'
      : 'h-12 w-9 rounded-lg';
  return anime.coverUrl ? (
    <img
      src={anime.coverUrl}
      alt=""
      loading="lazy"
      className={`${clase} shrink-0 object-cover ring-1 ring-white/10`}
    />
  ) : (
    <span
      className={`${clase} flex shrink-0 items-center justify-center bg-zinc-800 text-zinc-500 ring-1 ring-white/10`}
    >
      <Film size={13} />
    </span>
  );
};

const FilaRanking: FC<{
  anime: Anime;
  metric: RankingMetric;
  posicion: number;
  maximo: number;
  onSelect: () => void;
  tamano?: 'sm' | 'md';
}> = ({ anime, metric, posicion, maximo, onSelect, tamano = 'sm' }) => {
  const valor = contadorDe(anime, metric);
  const meta = METRICAS[metric];
  const Icono = metric === 'likes' ? Heart : Eye;
  const ancho = maximo > 0 ? Math.max(4, (valor / maximo) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`Abrir la ficha de ${anime.title}`}
      className="group flex w-full items-center gap-2 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
    >
      <span className="w-4 shrink-0 text-center font-mono text-[10px] font-black text-zinc-500">
        {posicion}
      </span>
      <Miniatura anime={anime} size={tamano} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-bold text-zinc-100 group-hover:text-white">
            {anime.title}
          </span>
          <span className="flex shrink-0 items-center gap-0.5 font-mono text-[9px] font-bold text-pink-300">
            <Icono size={9} className="fill-pink-400/80 text-pink-400" />
            {compacto(valor)}
          </span>
        </span>
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <span
            className={`block h-full rounded-full bg-gradient-to-r ${meta.colorBarra}`}
            style={{ width: `${ancho}%` }}
          />
        </span>
      </span>
    </button>
  );
};

const Esqueleto: FC<{ filas?: number }> = ({ filas = 5 }) => (
  <div className="space-y-1.5 py-1">
    {Array.from({ length: filas }).map((_, i) => (
      <div key={i} className="flex items-center gap-2 px-1.5 py-1.5">
        <span className="h-3 w-3 animate-pulse rounded bg-zinc-800" />
        <span className="h-10 w-8 animate-pulse rounded-lg bg-zinc-800" />
        <span className="h-3 flex-1 animate-pulse rounded bg-zinc-800" />
      </div>
    ))}
  </div>
);

const ModalRanking: FC<{
  metric: RankingMetric;
  onClose: () => void;
  onSelectAnime: (id: string) => void;
}> = ({ metric, onClose, onSelectAnime }) => {
  const meta = METRICAS[metric];
  const Icono = meta.icono;
  const { entries, loading, error } = useWikiRanking(
    metric,
    RANKING_COMPLETO_LIMITE,
  );
  const maximo = entries.length > 0 ? contadorDe(entries[0], metric) : 0;

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', escape);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', escape);
      document.body.style.overflow = antes;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={meta.titulo}
        className="geo-pop-in flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-violet-500/25 bg-zinc-900 shadow-2xl shadow-violet-950/60 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icono size={17} className={meta.colorIcono} />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">
                {meta.titulo}
              </h3>
              <p className="text-[10px] text-zinc-500">
                Ranking completo · {entries.length} series
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar el ranking"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <Esqueleto filas={8} />
          ) : error ? (
            <p className="px-3 py-8 text-center text-xs text-zinc-500">
              {error}
            </p>
          ) : entries.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-zinc-500">
              Todavía no hay datos para este ranking.
            </p>
          ) : (
            <ol className="space-y-0.5">
              {entries.map((anime, indice) => (
                <li key={anime.id}>
                  <FilaRanking
                    anime={anime}
                    metric={metric}
                    posicion={indice + 1}
                    maximo={maximo}
                    tamano="md"
                    onSelect={() => {
                      onSelectAnime(anime.id);
                      onClose();
                    }}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const TarjetaRanking: FC<{
  metric: RankingMetric;
  onSelectAnime: (id: string) => void;
}> = ({ metric, onSelectAnime }) => {
  const [verTodos, setVerTodos] = useState(false);
  const meta = METRICAS[metric];
  const Icono = meta.icono;
  const { entries, loading, error } = useWikiRanking(metric, 5);
  const maximo = entries.length > 0 ? contadorDe(entries[0], metric) : 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-left shadow-lg shadow-black/20">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-200">
          <Icono size={13} className={`shrink-0 ${meta.colorIcono}`} />
          <span className="truncate">{meta.titulo}</span>
        </h3>
        <button
          type="button"
          onClick={() => setVerTodos(true)}
          className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-violet-300 transition-colors hover:text-violet-200"
        >
          Ver todos
          <ArrowRight size={10} />
        </button>
      </div>

      {loading ? (
        <Esqueleto />
      ) : error ? (
        <p className="px-1 py-4 text-center text-[10px] text-zinc-600">
          {error}
        </p>
      ) : entries.length === 0 ? (
        <p className="px-1 py-4 text-center text-[10px] text-zinc-600">
          Todavía no hay datos.
        </p>
      ) : (
        <ol className="space-y-0.5">
          {entries.slice(0, 5).map((anime, indice) => (
            <li key={anime.id}>
              <FilaRanking
                anime={anime}
                metric={metric}
                posicion={indice + 1}
                maximo={maximo}
                onSelect={() => onSelectAnime(anime.id)}
              />
            </li>
          ))}
        </ol>
      )}

      {verTodos && (
        <ModalRanking
          metric={metric}
          onClose={() => setVerTodos(false)}
          onSelectAnime={onSelectAnime}
        />
      )}
    </section>
  );
};

export const WikiPopularityRankings: FC<{
  onSelectAnime: (id: string) => void;
}> = ({ onSelectAnime }) => (
  <div className="space-y-3">
    <TarjetaRanking metric="likes" onSelectAnime={onSelectAnime} />
    <TarjetaRanking metric="views" onSelectAnime={onSelectAnime} />
  </div>
);
