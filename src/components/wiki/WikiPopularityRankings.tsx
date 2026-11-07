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
import { formatearNumero } from '../../utils/follows';
import type { Anime } from '../../types';

// ======================================================
// RANKINGS DE LA WIKI
// ======================================================
//
// Dos módulos en el carril derecho de la wiki:
//   - Series más gustadas (likesCount).
//   - Series más vistas (viewsCount).
//
// Los dos leen agregados ya calculados. No hay listeners ni se
// descargan votos/visitas individuales. La tarjeta muestra el top 5
// y el ranking completo se abre en un modal bajo demanda.

interface MetaRanking {
  titulo: string;
  subtitulo: string;
  etiqueta: string;
  vacio: string;
  icono: typeof Flame;
  iconoClase: string;
  halo: string;
  borde: string;
  linea: string;
  barra: string;
  contador: string;
}

const METRICAS: Record<RankingMetric, MetaRanking> = {
  likes: {
    titulo: 'Series más gustadas',
    subtitulo: 'Las favoritas de la comunidad',
    etiqueta: 'Me gusta',
    vacio: 'Cuando la comunidad marque sus favoritas, aparecerán aquí.',
    icono: Flame,
    iconoClase:
      'border-orange-400/25 bg-gradient-to-br from-orange-500/25 to-pink-500/10 text-orange-300',
    halo: 'bg-orange-500/20',
    borde: 'border-orange-500/15',
    linea: 'via-orange-400/60',
    barra: 'from-amber-400 via-orange-500 to-pink-500',
    contador: 'border-orange-400/20 bg-orange-500/10 text-orange-200',
  },
  views: {
    titulo: 'Series más vistas',
    subtitulo: 'Las fichas más visitadas',
    etiqueta: 'visualizaciones',
    vacio: 'Cuando las fichas reciban visitas, el ranking aparecerá aquí.',
    icono: Eye,
    iconoClase:
      'border-violet-400/25 bg-gradient-to-br from-violet-500/25 to-sky-500/10 text-violet-200',
    halo: 'bg-violet-500/20',
    borde: 'border-violet-500/15',
    linea: 'via-violet-400/60',
    barra: 'from-violet-500 via-fuchsia-500 to-sky-400',
    contador: 'border-violet-400/20 bg-violet-500/10 text-violet-200',
  },
};

function contadorDe(anime: Anime, metric: RankingMetric): number {
  return metric === 'likes'
    ? Math.max(0, Number(anime.likesCount) || 0)
    : Math.max(0, Number(anime.viewsCount) || 0);
}

/** Contadores legibles: 1245 → 1.245; 124_500 → 124,5K. */
function numeroCorto(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (n >= 10_000) {
    return `${(n / 1_000).toFixed(1).replace('.', ',')}K`;
  }
  return formatearNumero(n);
}

/** Medallas del podio y número discreto para el resto. */
function clasePodium(posicion: number): string {
  if (posicion === 1) {
    return 'bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 text-zinc-950 ring-1 ring-amber-200/40 shadow-md shadow-amber-950/40';
  }
  if (posicion === 2) {
    return 'bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-400 text-zinc-900 ring-1 ring-white/30 shadow-md shadow-black/30';
  }
  if (posicion === 3) {
    return 'bg-gradient-to-br from-orange-300 via-amber-600 to-orange-800 text-orange-50 ring-1 ring-orange-400/30 shadow-md shadow-orange-950/40';
  }
  return 'bg-white/[0.04] text-zinc-500 ring-1 ring-white/[0.06]';
}

const Miniatura: FC<{ anime: Anime; size?: 'sm' | 'md' }> = ({
  anime,
  size = 'sm',
}) => {
  const clase =
    size === 'sm' ? 'h-11 w-8 rounded-lg' : 'h-14 w-10 rounded-xl';

  return anime.coverUrl ? (
    <span
      className={`relative block shrink-0 overflow-hidden ${clase} ring-1 ring-white/10`}
    >
      <img
        src={anime.coverUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </span>
  ) : (
    <span
      className={`flex shrink-0 items-center justify-center bg-zinc-800 text-zinc-600 ring-1 ring-white/10 ${clase}`}
    >
      <Film size={size === 'sm' ? 13 : 15} />
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
  const ancho = maximo > 0 ? Math.max(5, Math.round((valor / maximo) * 100)) : 0;
  const podium = posicion <= 3;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`Abrir la ficha de ${anime.title}`}
      className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1 text-left transition-all duration-200 ${
        podium ? 'hover:bg-white/[0.06]' : 'hover:bg-white/[0.035]'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-black tabular-nums ${clasePodium(
          posicion,
        )}`}
      >
        {posicion}
      </span>

      <Miniatura anime={anime} size={tamano} />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold leading-tight text-zinc-100 transition-colors group-hover:text-white">
          {anime.title}
        </span>

        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className={`block h-full rounded-full bg-gradient-to-r ${meta.barra}`}
              style={{ width: `${ancho}%` }}
            />
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-[3px] font-mono text-[9px] font-bold tabular-nums ${meta.contador}`}
            title={`${formatearNumero(valor)} ${meta.etiqueta}`}
          >
            <Icono size={9} className="shrink-0 opacity-80" />
            {numeroCorto(valor)}
          </span>
        </span>
      </span>
    </button>
  );
};

const Esqueleto: FC<{ filas?: number }> = ({ filas = 5 }) => (
  <div className="animate-pulse space-y-1 px-2 pb-2">
    {Array.from({ length: filas }).map((_, i) => (
      <div key={i} className="flex items-center gap-2.5 px-2.5 py-1">
        <span className="h-5 w-5 shrink-0 rounded-md bg-zinc-800" />
        <span className="h-11 w-8 shrink-0 rounded-lg bg-zinc-800" />
        <span className="min-w-0 flex-1 space-y-2">
          <span className="block h-2.5 w-3/4 rounded bg-zinc-800" />
          <span className="block h-1 w-full rounded bg-zinc-800/70" />
        </span>
      </div>
    ))}
  </div>
);

const EstadoVacio: FC<{ meta: MetaRanking }> = ({ meta }) => {
  const Icono = meta.icono;
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.iconoClase}`}
      >
        <Icono size={17} />
      </span>
      <p className="mt-2.5 text-[11px] font-bold text-zinc-400">
        Aún no hay datos
      </p>
      <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-zinc-600">
        {meta.vacio}
      </p>
    </div>
  );
};

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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={meta.titulo}
        className="geo-pop-in flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/70 sm:rounded-3xl"
      >
        <div className="relative border-b border-white/[0.07] bg-zinc-900/95 px-4 py-3.5">
          <div
            className={`pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full blur-3xl ${meta.halo}`}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.iconoClase}`}
              >
                <Icono size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black text-white">
                  {meta.titulo}
                </h3>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Ranking completo · {entries.length} series
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar el ranking"
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {loading ? (
            <Esqueleto filas={8} />
          ) : error ? (
            <p className="px-3 py-8 text-center text-xs text-zinc-500">
              {error}
            </p>
          ) : entries.length === 0 ? (
            <EstadoVacio meta={meta} />
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
    <section
      className={`relative overflow-hidden rounded-2xl border ${meta.borde} bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 text-left shadow-[0_20px_50px_-28px_rgba(0,0,0,0.95)]`}
    >
      <span
        className={`pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${meta.linea} to-transparent`}
      />
      <span
        className={`pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full blur-3xl ${meta.halo}`}
      />

      <div className="relative flex items-start justify-between gap-2 px-3.5 pb-2 pt-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${meta.iconoClase}`}
          >
            <Icono size={15} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[12px] font-black leading-tight text-white">
              {meta.titulo}
            </h3>
            <p className="mt-0.5 truncate text-[9.5px] text-zinc-500">
              {meta.subtitulo}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setVerTodos(true)}
          aria-label="Ver todos"
          className="group/ver inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-2 py-1 text-[9px] font-bold text-violet-200 transition-colors hover:border-violet-300/40 hover:bg-violet-500/15 hover:text-white"
        >
          <span className="inline lg:hidden xl:inline">Ver todos</span>
          <ArrowRight
            size={9}
            className="transition-transform group-hover/ver:translate-x-0.5"
          />
        </button>
      </div>

      <div className="relative px-2 pb-1.5">
        {loading ? (
          <Esqueleto />
        ) : error ? (
          <p className="px-3 py-7 text-center text-[10px] text-zinc-600">
            {error}
          </p>
        ) : entries.length === 0 ? (
          <EstadoVacio meta={meta} />
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
      </div>

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
  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
    <TarjetaRanking metric="likes" onSelectAnime={onSelectAnime} />
    <TarjetaRanking metric="views" onSelectAnime={onSelectAnime} />
  </div>
);
