import React, { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';

import { getTierList } from '../../services/tierlists';
import { CLUB_CATEGORIES } from '../../types';
import type { TierList, TierListRef } from '../../types';
import { TierListView } from './TierListView';

// ======================================================
// TARJETA DE TIER LIST EN UN HILO
// ======================================================
//
// La clasificación renderizada dentro de la publicación:
// título, autor, categoría, filas, descripción y acceso a la
// vista completa. Sin URL pelada: se ve aquí mismo.
//
// Si la tier list se eliminó, pinta "ya no disponible" en vez
// de romperse (el hilo sigue existiendo).
// ======================================================

interface TierListCardProps {
  referencia: TierListRef;
  onAbrir: (tierListId: string) => void;
}

export const TierListCard: React.FC<TierListCardProps> = ({ referencia, onAbrir }) => {
  const [tier, setTier] = useState<TierList | null>(null);
  const [cargando, setCargando] = useState(true);
  const [falta, setFalta] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setFalta(false);
    void getTierList(referencia.tierListId).then((t) => {
      if (!vivo) return;
      setCargando(false);
      if (!t) setFalta(true);
      else setTier(t);
    });
    return () => {
      vivo = false;
    };
  }, [referencia.tierListId]);

  if (cargando) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-[11px] text-zinc-500">
        <Loader2 size={13} className="animate-spin" />
        Cargando la tier list...
      </div>
    );
  }

  if (falta || !tier) {
    return (
      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-[11px] text-zinc-500">
        Esta tier list ya no está disponible.
      </div>
    );
  }

  const categoria = CLUB_CATEGORIES.find((c) => c.id === tier.category);

  return (
    <section
      aria-label={`Tier list: ${tier.title}`}
      className="mt-4 overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/30 to-zinc-950/60"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/15 px-4 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-300">
          <Trophy size={13} className="flex-shrink-0 text-violet-400" />
          <span className="truncate">Tier list · por {tier.authorName}</span>
        </span>
        {categoria && (
          <span className="flex-shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
            {categoria.icon} {categoria.label}
          </span>
        )}
      </div>

      <div className="px-4 pt-3">
        <h4 className="text-sm font-bold leading-snug text-white">{tier.title}</h4>
        {tier.originTitle && (
          <p className="mt-0.5 text-[10px] text-zinc-500">basada en “{tier.originTitle}”</p>
        )}
        {tier.description && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
            {tier.description}
          </p>
        )}
      </div>

      <div className="px-4 pt-3">
        <TierListView tier={tier} tamano="sm" maxFilas={4} />
      </div>

      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => onAbrir(tier.id)}
          className="w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-500"
        >
          Ver tier list completa y votar
        </button>
      </div>
    </section>
  );
};
