import React, { useEffect, useState } from 'react';
import { Eye, Loader2, Trophy } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { getTierList } from '../../services/tierlists';
import type { TierList, TierListRef } from '../../types';
import { TierListView } from './TierListView';

// ======================================================
// TARJETA DE TIER LIST EN UN MENSAJE
// ======================================================
//
// Compacta a propósito: título, autor, miniatura de niveles
// y botón para verla completa. La vista completa (con votos
// y acciones) vive en el visor, fuera de la conversación,
// para no comerse la pantalla del chat.
// ======================================================

interface ChatTierCardProps {
  referencia: TierListRef;
  onAbrir: (tierListId: string) => void;
}

export const ChatTierCard: React.FC<ChatTierCardProps> = ({ referencia, onAbrir }) => {
  const { usersList } = useAuth();
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
      <div className="mt-1.5 flex w-full max-w-72 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-[11px] text-zinc-500">
        <Loader2 size={12} className="animate-spin" />
        Cargando la tier list...
      </div>
    );
  }

  if (falta || !tier) {
    return (
      <div className="mt-1.5 w-full max-w-72 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-[11px] text-zinc-500">
        Esta tier list ya no está disponible.
      </div>
    );
  }

  const nombreAutor =
    usersList.find((u) => u.uid === tier.authorId)?.displayName ||
    tier.authorName;

  return (
    <div className="mt-1.5 w-full max-w-72 overflow-hidden rounded-xl border border-violet-500/25 bg-zinc-950/70">
      <div className="flex items-center gap-1.5 border-b border-violet-500/15 px-2.5 py-1.5">
        <Trophy size={11} className="flex-shrink-0 text-violet-400" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">
          {tier.title}
        </span>
      </div>
      <div className="px-2.5 pt-2">
        <p className="truncate text-[10px] text-zinc-500">por {nombreAutor}</p>
        <div className="mt-1.5">
          <TierListView tier={tier} tamano="sm" maxFilas={3} />
        </div>
      </div>
      <div className="p-2.5">
        <button
          type="button"
          onClick={() => onAbrir(tier.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-violet-500"
        >
          <Eye size={12} />
          Ver tier list
        </button>
      </div>
    </div>
  );
};
