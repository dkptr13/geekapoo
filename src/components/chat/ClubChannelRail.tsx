import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Hash,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import type { Club, ClubChannel } from '../../types';
import type { ClubResult } from '../../services/clubs';

// ======================================================
// LISTA LATERAL DE CANALES DE UN CLUB
// ======================================================
// La columna estilo Discord dentro de la vista del club:
// cabecera del club, lista de canales y botón de crear.
//
// Solo enseña los canales que el usuario puede ver (el padre
// ya filtra los `mods` para miembros normales) y solo enseña
// los controles de gestión al equipo del club. Los permisos
// de verdad están en las reglas; aquí solo se pintan.
//
// Se reutiliza igual en escritorio (columna fija) y en móvil
// (cajón superpuesto): la raíz ocupa todo el alto que le den.
// ======================================================

interface RailProps {
  club: Club;
  /** Canales ya visibles para el usuario, ordenados. */
  canales: ClubChannel[];
  canalActivoId: string | null;
  /** Ids de chat con mensajes sin leer. */
  sinLeerIds: string[];
  cargando: boolean;
  /** Propietario o moderador del club. */
  puedeGestionar: boolean;
  onElegir: (canal: ClubChannel) => void;
  onCrear: () => void;
  onEditar: (canal: ClubChannel) => void;
  onEliminar: (canal: ClubChannel) => Promise<ClubResult>;
  onMover: (canal: ClubChannel, dir: -1 | 1) => Promise<ClubResult>;
}

export const ClubChannelRail: React.FC<RailProps> = ({
  club,
  canales,
  canalActivoId,
  sinLeerIds,
  cargando,
  puedeGestionar,
  onElegir,
  onCrear,
  onEditar,
  onEliminar,
  onMover,
}) => {
  // Canal con la confirmación de borrado abierta (dos pasos:
  // pulsar la papelera no borra nada por sí solo).
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borrar = async (canal: ClubChannel) => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    const res = await onEliminar(canal);
    setOcupado(false);
    if (res.ok) {
      setConfirmando(null);
    } else {
      setError(res.error ?? 'No se pudo eliminar el canal.');
    }
  };

  const mover = async (canal: ClubChannel, dir: -1 | 1) => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    const res = await onMover(canal, dir);
    setOcupado(false);
    if (!res.ok) setError(res.error ?? 'No se pudo reordenar el canal.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Cabecera del club ──────────────────────── */}
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-zinc-800 p-3.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-600/20 text-base ring-1 ring-violet-500/30">
          {club.iconUrl ? (
            <img src={club.iconUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Users size={16} className="text-violet-300" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-white">{club.name}</span>
          <span className="block text-[10px] text-zinc-500">
            {club.memberCount} {club.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </span>
      </div>

      {/* ── Canales + crear ────────────────────────── */}
      <div className="flex flex-shrink-0 items-center justify-between px-3.5 pb-1 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Canales ({canales.length})
        </span>
        {puedeGestionar && (
          <button
            type="button"
            onClick={onCrear}
            title="Crear canal"
            aria-label="Crear canal"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-violet-300"
          >
            <Plus size={11} />
            <span>Crear canal</span>
          </button>
        )}
      </div>

      {/* ── Lista ──────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3 pt-1">
        {cargando && canales.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-6 text-[11px] text-zinc-500">
            <Loader2 size={13} className="animate-spin" />
            <span>Cargando canales...</span>
          </div>
        ) : canales.length === 0 ? (
          <p className="p-4 text-center text-[11px] text-zinc-600">
            Todavía no hay canales visibles.
          </p>
        ) : (
          canales.map((canal, i) => {
            const activo = canal.id === canalActivoId;
            const sinLeer = sinLeerIds.includes(canal.chatId);

            // El `general` no se borra: sin conversación
            // principal el club se queda sin sitio común.
            if (confirmando === canal.id) {
              return (
                <div
                  key={canal.id}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 p-2"
                >
                  <p className="text-[10px] font-bold leading-snug text-red-300">
                    ¿Eliminar #{canal.name} con su historial?
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-red-300/70">
                    Sus mensajes dejarán de verse. No se puede deshacer.
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => borrar(canal)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                    >
                      {ocupado ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Check size={10} />
                      )}
                      <span>Sí, eliminar</span>
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => {
                        setConfirmando(null);
                        setError(null);
                      }}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                    >
                      <X size={10} />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={canal.id}
                className={`group flex items-center gap-0.5 rounded-lg border px-1.5 py-1 transition-colors ${
                  activo
                    ? 'border-violet-500/40 bg-violet-950/40'
                    : 'border-transparent hover:bg-zinc-900/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onElegir(canal)}
                  title={canal.description || `#${canal.name}`}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-0.5 text-left"
                >
                  {canal.visibility === 'mods' ? (
                    <Lock size={11} className="flex-shrink-0 text-amber-300/80" />
                  ) : (
                    <Hash
                      size={12}
                      className={`flex-shrink-0 ${activo ? 'text-violet-300' : 'text-zinc-500'}`}
                    />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate text-[11px] font-bold ${
                      activo ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {canal.name}
                  </span>
                  {canal.spoiler && (
                    <span className="flex-shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1 text-[8px] font-bold text-amber-300">
                      SPOILERS
                    </span>
                  )}
                  {sinLeer && !activo && (
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full bg-pink-500"
                      title="Mensajes sin leer"
                    />
                  )}
                </button>

                {puedeGestionar && (
                  <span className="flex flex-shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => mover(canal, -1)}
                      disabled={ocupado || i === 0}
                      title="Subir en la lista"
                      aria-label={`Subir #${canal.name}`}
                      className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-25"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(canal, 1)}
                      disabled={ocupado || i === canales.length - 1}
                      title="Bajar en la lista"
                      aria-label={`Bajar #${canal.name}`}
                      className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-25"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditar(canal)}
                      title="Editar canal"
                      aria-label={`Editar #${canal.name}`}
                      className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <Pencil size={11} />
                    </button>
                    {canal.id !== 'general' && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setConfirmando(canal.id);
                        }}
                        title="Eliminar canal"
                        aria-label={`Eliminar #${canal.name}`}
                        className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </span>
                )}
              </div>
            );
          })
        )}

        {error && (
          <p className="mt-1 flex items-start gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-300">
            <AlertCircle size={11} className="mt-px flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
