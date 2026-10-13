import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Lock,
  Pencil,
  RotateCcw,
  Trash2,
  Trophy,
  Users,
  Vote,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  eliminarTierList,
  listenTierVotes,
  subscribeTierList,
  votarTier,
  type TierResult,
  type TierVoteRow,
} from '../../services/tierlists';
import { contarVotos, tiersOrdenados } from '../../utils/tierlists';
import { CLUB_CATEGORIES } from '../../types';
import type { TierList } from '../../types';
import { TierListView } from './TierListView';

// ======================================================
// VISOR DE TIER LIST
// ======================================================
//
// Vista completa de una clasificación: filas, descripción,
// votación en vivo (si el autor la activó) y acciones.
//
//   - Cualquiera con acceso la abre y vota.
//   - "Usar como plantilla" abre el editor con una copia
//     editable: el original no se toca nunca.
//   - Editar y eliminar, solo el autor (con confirmación).
//     La votación no modifica la clasificación: son
//     resultados aparte.
//
// Se escucha el documento y los votos: si el autor edita o
// alguien vota mientras se mira, se ve al momento.
// ======================================================

interface TierListViewerProps {
  tierListId: string;
  /** Abrir el editor con una copia (el padre decide dónde). */
  onUsarPlantilla: (tier: TierList) => void;
  /** Abrir el editor con esta tier list (solo el autor). */
  onEditar: (tier: TierList) => void;
  onClose: () => void;
}

export const TierListViewer: React.FC<TierListViewerProps> = ({
  tierListId,
  onUsarPlantilla,
  onEditar,
  onClose,
}) => {
  const { currentUser, requireAuth } = useAuth();
  const [tier, setTier] = useState<TierList | null>(null);
  const [noExiste, setNoExiste] = useState(false);
  const [votes, setVotes] = useState<TierVoteRow[]>([]);
  const [votando, setVotando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);

  useEffect(() => {
    setTier(null);
    setNoExiste(false);
    setVotes([]);
    setError(null);
    setConfirmandoBorrar(false);
    return subscribeTierList(
      tierListId,
      (t) => {
        if (!t) setNoExiste(true);
        else setTier(t);
      },
      () => setNoExiste(true),
    );
  }, [tierListId]);

  useEffect(() => {
    if (!tier) return;
    return listenTierVotes(tierListId, (rows) => setVotes(rows));
  }, [tierListId, tier]);

  const counts = useMemo(() => contarVotos(votes), [votes]);
  const totalVotos = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );
  const miVoto = currentUser ? votes.find((v) => v.userId === currentUser.uid)?.tierId ?? null : null;
  const soyAutor = !!currentUser && !!tier && tier.authorId === currentUser.uid;
  const categoria = tier ? CLUB_CATEGORIES.find((c) => c.id === tier.category) : undefined;

  const votar = async (tierId: string) => {
    if (!tier || !currentUser) {
      requireAuth('votar en esta tier list');
      return;
    }
    if (votando) return;
    setVotando(tierId);
    setError(null);
    const res: TierResult = await votarTier(tier, tierId, currentUser.uid);
    setVotando(null);
    if (!res.ok) setError(res.error ?? 'No se pudo votar.');
  };

  const borrar = async () => {
    if (!tier || borrando) return;
    setBorrando(true);
    const res = await eliminarTierList(tier.id);
    setBorrando(false);
    if (!res.ok) {
      setError(res.error ?? 'No se pudo eliminar.');
      setConfirmandoBorrar(false);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Cabecera */}
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-violet-400">
              <Trophy size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">
                {tier?.title ?? (noExiste ? 'Tier list no disponible' : 'Cargando...')}
              </h2>
              <p className="truncate text-[11px] text-zinc-500">
                {tier
                  ? `por ${tier.authorName}${
                      tier.originTitle ? ` · basada en “${tier.originTitle}”` : ''
                    }`
                  : ' '}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {noExiste || (!tier && error) ? (
            <div className="space-y-2 py-8 text-center">
              <p className="text-sm font-bold text-white">Esta tier list ya no está disponible</p>
              <p className="mx-auto max-w-sm text-[11px] text-zinc-500">
                Puede que su autor la haya eliminado. Los hilos y mensajes que la
                mostraban siguen ahí.
              </p>
            </div>
          ) : !tier ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-500">
              <Loader2 size={15} className="animate-spin" />
              Cargando la clasificación...
            </div>
          ) : (
            <>
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                {categoria && (
                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-bold text-zinc-400">
                    {categoria.icon} {categoria.label}
                  </span>
                )}
                {tier.visibility === 'club' && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-300">
                    <Lock size={9} />
                    Solo club
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-zinc-400">
                  <Users size={9} />
                  {totalVotos} {totalVotos === 1 ? 'voto' : 'votos'}
                </span>
              </div>

              {tier.coverUrl && (
                <img
                  src={tier.coverUrl}
                  alt=""
                  className="h-32 w-full rounded-2xl border border-zinc-800 object-cover"
                />
              )}

              {tier.description && (
                <p className="text-xs leading-relaxed text-zinc-400">{tier.description}</p>
              )}

              {/* Clasificación */}
              <TierListView tier={tier} votos={tier.voting.enabled ? counts : undefined} />

              {/* Votación */}
              {tier.voting.enabled ? (
                <section className="space-y-2 rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Vote size={13} className="text-violet-400" />
                    ¿Qué nivel te gusta más?
                  </h3>
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={() => requireAuth('votar en esta tier list')}
                      className="w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500"
                    >
                      Inicia sesión para votar
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tiersOrdenados(tier.tiers).map((nivel) => (
                        <button
                          key={nivel.id}
                          type="button"
                          disabled={votando !== null || (miVoto !== null && !tier.voting.allowChange)}
                          onClick={() => votar(nivel.id)}
                          title={
                            miVoto !== null && !tier.voting.allowChange
                              ? 'Ya votaste y no se puede cambiar'
                              : undefined
                          }
                          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            miVoto === nivel.id
                              ? 'border-violet-400 bg-violet-600/30 text-white'
                              : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-violet-500/60'
                          }`}
                        >
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-zinc-950"
                            style={{ backgroundColor: nivel.color }}
                          >
                            {nivel.label.slice(0, 2)}
                          </span>
                          {nivel.label}
                          {votando === nivel.id && <Loader2 size={11} className="animate-spin" />}
                          {miVoto === nivel.id && <Check size={11} />}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="flex items-center gap-1 text-[10px] text-zinc-500">
                    {miVoto !== null && !tier.voting.allowChange ? (
                      <>
                        <Lock size={9} />
                        Ya votaste: un voto por persona.
                      </>
                    ) : miVoto !== null && tier.voting.allowChange ? (
                      <>
                        <RotateCcw size={9} />
                        Puedes cambiar de nivel.
                      </>
                    ) : (
                      'Tu voto no cambia la clasificación del autor: es tu opinión aparte.'
                    )}
                  </p>
                </section>
              ) : (
                <p className="text-[10px] text-zinc-600">
                  El autor no activó la votación en esta tier list.
                </p>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                  <p className="text-[11px] text-red-300">{error}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      requireAuth('crear tu propia versión');
                      return;
                    }
                    onUsarPlantilla(tier);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold text-zinc-200 hover:border-violet-500/50 hover:text-white"
                >
                  <Copy size={12} />
                  Crear mi propia versión
                </button>

                {soyAutor && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditar(tier)}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold text-zinc-200 hover:border-violet-500/50 hover:text-white"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    {confirmandoBorrar ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={borrar}
                          disabled={borrando}
                          className="rounded-xl bg-red-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {borrando ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoBorrar(false)}
                          disabled={borrando}
                          className="rounded-xl bg-zinc-800 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmandoBorrar(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold text-zinc-400 hover:border-red-500/50 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
