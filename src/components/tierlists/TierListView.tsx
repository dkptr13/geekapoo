import type { FC } from 'react';

import { elementosDe, tiersOrdenados } from '../../utils/tierlists';
import type { TierList } from '../../types';

// ======================================================
// VISTA DE UNA TIER LIST (solo lectura)
// ======================================================
//
// La misma renderización en todas partes: vista previa del
// editor, tarjeta del hilo, visor completo y tarjeta del
// chat. Así una clasificación se reconoce igual la veas
// donde la veas.
//
// Las tarjetas de elemento tienen tamaño fijo: no hay saltos
// de diseño al cargar (la caja ya mide lo suyo) y en móvil
// se encogen por CSS sin scroll horizontal.
// ======================================================

interface TierListViewProps {
  tier: TierList;
  /** Votos por nivel (para pintar barras y totales). */
  votos?: Record<string, number>;
  /** Compacta para tarjetas: menos filas visibles. */
  maxFilas?: number;
  /** Tamaño de tarjeta: `sm` en tarjetas, `md` en visor. */
  tamano?: 'sm' | 'md';
}

export const TierListView: FC<TierListViewProps> = ({
  tier,
  votos,
  maxFilas,
  tamano = 'md',
}) => {
  const filas = tiersOrdenados(tier.tiers);
  const visibles = maxFilas != null ? filas.slice(0, maxFilas) : filas;
  const totalVotos = votos ? Object.values(votos).reduce((a, b) => a + b, 0) : 0;

  const tile = tamano === 'sm' ? 'h-12 w-12 text-[9px]' : 'h-16 w-16 text-[10px]';

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
      {visibles.map((fila) => {
        const elementos = elementosDe(tier.items, tier.poolOrder, fila.id);
        const nv = votos?.[fila.id] ?? 0;
        const pct = totalVotos > 0 ? Math.round((nv / totalVotos) * 100) : 0;

        return (
          <div key={fila.id} className="flex min-h-14 border-b border-zinc-800 last:border-b-0">
            <div
              className="flex w-14 flex-shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-2 sm:w-16"
              style={{ backgroundColor: `${fila.color}26` }}
              title={fila.label}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-zinc-950 sm:h-8 sm:w-8 sm:text-sm"
                style={{ backgroundColor: fila.color }}
              >
                {fila.label.slice(0, 2)}
              </span>
              {votos && (
                <span className="font-mono text-[9px] font-bold text-zinc-400">
                  {nv} · {pct}%
                </span>
              )}
            </div>

            <div className="relative min-w-0 flex-1 p-1.5">
              {votos && totalVotos > 0 && nv > 0 && (
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 bg-violet-500/10"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              )}
              {elementos.length === 0 ? (
                <span className="flex h-full min-h-10 items-center px-1 text-[10px] text-zinc-700">
                  —
                </span>
              ) : (
                <div className="relative flex flex-wrap gap-1.5">
                  {elementos.map((el) => (
                    <span
                      key={el.id}
                      title={el.name}
                      className={`group/tile relative flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900 ${tile}`}
                    >
                      {el.imageUrl ? (
                        <img
                          src={el.imageUrl}
                          alt={el.name}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center p-0.5 text-center font-semibold leading-tight text-zinc-300">
                          {el.name}
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/70 px-0.5 py-px text-center font-semibold leading-tight text-white opacity-0 transition-opacity group-hover/tile:opacity-100">
                        {el.name}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {maxFilas != null && filas.length > maxFilas && (
        <p className="px-3 py-1.5 text-[10px] text-zinc-500">
          +{filas.length - maxFilas} niveles más
        </p>
      )}
    </div>
  );
};
