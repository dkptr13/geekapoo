import React, { useMemo, useState } from 'react';
import { Trophy, Lock, Loader2 } from 'lucide-react';

import { useProgression } from '../../context/ProgressionContext';
import { CATALOGO_MEDALLAS } from '../../utils/progression';
import { ESTILO_RAREZA, MedalCard } from './MedalCard';
import type { MedalRarity } from '../../types/gamification';

// ======================================================
// PAGINA DE LOGROS
// ======================================================
//
// El catalogo completo de medallas, con el estado de cada una.
//
// Va como una pestana mas (`?tab=logros`) y no como una ruta
// nueva, para no tocar el enrutado: la web ya usa la query
// string para todo lo demas y anadir una ruta obligaria a
// revisar el boton de "volver" de la wiki y el de cerrar sesion.
//
// Se ven tambien las de otros usuarios, y por eso es la unica
// pagina que lleva su propio `ProgressionProvider`: el del
// contexto sigue al usuario de la sesion.

type Filtro = 'todas' | 'conseguidas' | 'pendientes' | MedalRarity;

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'conseguidas', etiqueta: 'Conseguidas' },
  { id: 'pendientes', etiqueta: 'Pendientes' },
  { id: 'legendaria', etiqueta: 'Legendarias' },
  { id: 'epica', etiqueta: 'Epicas' },
  { id: 'rara', etiqueta: 'Raras' },
  { id: 'comun', etiqueta: 'Comunes' },
];

export const AchievementsView: React.FC = () => {
  const { catalogo, nivel, rango, progresoNivel, loading } = useProgression();

  const [filtro, setFiltro] = useState<Filtro>('todas');

  const visibles = useMemo(() => {
    switch (filtro) {
      case 'conseguidas':
        return catalogo.filter((c) => c.desbloqueada);
      case 'pendientes':
        return catalogo.filter((c) => !c.desbloqueada);
      case 'todas':
        return catalogo;
      default:
        return catalogo.filter((c) => c.medal.rareza === filtro);
    }
  }, [catalogo, filtro]);

  // Recuento por rareza, para los numeros de los filtros.
  const recuento = useMemo(
    () =>
      catalogo.reduce<Record<string, number>>((acc, c) => {
        acc[c.medal.rareza] = (acc[c.medal.rareza] ?? 0) + 1;
        return acc;
      }, {}),
    [catalogo],
  );

  const conseguidas = catalogo.filter((c) => c.desbloqueada).length;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 size={20} className="animate-spin text-violet-400" />
        <span className="text-sm text-zinc-400">Cargando logros...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* ── Cabecera ─────────────────────────────────── */}
      <header className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-white">
              <Trophy size={20} className="text-amber-400" />
              Logros
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Todas las medallas de la comunidad y como conseguirlas.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Medallas
            </p>
            <p className="font-mono text-lg font-bold text-white">
              {conseguidas}
              <span className="text-sm text-zinc-500">/{catalogo.length}</span>
            </p>
          </div>
        </div>

        {/* Progreso total. La etiqueta va primero y la barra
            detras. */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-white">
              Nivel {nivel} &middot; {rango}
            </span>
            <span className="font-mono text-xs text-zinc-400">
              {Math.round(progresoNivel * 100)}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-700"
              style={{ width: `${Math.round(progresoNivel * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* ── Filtros ───────────────────────────────────── */}
      <nav className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          // Solo se enseña el filtro de una rareza si hay
          // medallas de esa rareza en el catalogo.
          const esRareza = !['todas', 'conseguidas', 'pendientes'].includes(f.id);
          if (esRareza && !recuento[f.id]) return null;

          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activo
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {f.etiqueta}
              {esRareza && (
                <span className="ml-1.5 font-mono text-[10px] text-zinc-500">
                  {recuento[f.id]}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Rejilla ───────────────────────────────────── */}
      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-4 py-12 text-center text-sm text-zinc-500">
          No hay medallas en este filtro.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((estado) => (
            <MedalCard key={estado.medal.id} estado={estado} />
          ))}
        </div>
      )}

      {/* ── Nota sobre las manuales ───────────────────── */}
      {CATALOGO_MEDALLAS.some((m) => !m.requisito) && (
        <p className="flex items-start gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-[11px] leading-relaxed text-zinc-500">
          <Lock size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            Las medallas con candado no se consiguen jugando: las concede el equipo a
            mano segun criterios historicos. Son las que no se pueden ganar con barra
            de progreso.
          </span>
        </p>
      )}
    </div>
  );
};

export default AchievementsView;
