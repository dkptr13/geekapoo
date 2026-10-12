import React, { useState } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  Hash,
  Globe,
  Lock,
  AlertTriangle,
} from 'lucide-react';

import { useClubs } from '../../context/ClubsContext';
import {
  CANAL_LIMITS,
  canalSlugify,
  validarCanalSlug,
} from '../../services/canales';
import type { Club, ClubChannel, NuevoCanal } from '../../types';

// ======================================================
// MODAL PARA CREAR O EDITAR UN CANAL
// ======================================================
// El mismo patrón que `ClubCreateModal`: el `id` interno es
// un slug estable que NO cambia al renombrar (es el id del
// documento), y el nombre visible puede llevar de todo.
//
// Solo lo abre quien puede gestionar canales (propietario o
// moderadores): el botón que lo invoca ya filtra por rol, y
// las reglas lo vuelven a comprobar en el servidor.
// ======================================================

interface Props {
  club: Club;
  /** Sin canal = crear; con canal = editar. */
  channel?: ClubChannel | null;
  /** Slugs ya usados en el club (para avisar duplicados). */
  slugsEnUso: string[];
  /** Orden que se propone al crear (normalmente el final). */
  ordenSugerido: number;
  /** Tras crear, para abrir el canal sin recargar. */
  onCreado?: (channelId: string) => void;
  onClose: () => void;
}

export const ClubChannelModal: React.FC<Props> = ({
  club,
  channel,
  slugsEnUso,
  ordenSugerido,
  onCreado,
  onClose,
}) => {
  const { crearCanal, actualizarCanal } = useClubs();
  const editando = !!channel;
  const esGeneral = channel?.id === 'general';

  const [name, setName] = useState(channel?.name ?? '');
  const [slug, setSlug] = useState(channel?.id ?? '');
  const [slugEditado, setSlugEditado] = useState(editando);
  const [description, setDescription] = useState(channel?.description ?? '');
  const [visibility, setVisibility] = useState<'all' | 'mods'>(channel?.visibility ?? 'all');
  const [spoiler, setSpoiler] = useState(channel?.spoiler ?? false);
  const [order, setOrder] = useState(channel?.order ?? ordenSugerido);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarNombre = (valor: string) => {
    setName(valor.slice(0, CANAL_LIMITS.name.max));
    if (!slugEditado) setSlug(canalSlugify(valor));
  };

  const slugViable = editando || (!!slug && validarCanalSlug(slug).ok);
  const slugDuplicado =
    !editando && slugViable && slugsEnUso.includes(slug.trim().toLowerCase());

  const deshabilitado =
    enviando ||
    name.trim().length < 1 ||
    (!editando && (!slugViable || slugDuplicado));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deshabilitado) return;

    setEnviando(true);
    setError(null);

    try {
      if (editando && channel) {
        const res = await actualizarCanal(club.id, channel.id, {
          name: name.trim(),
          description: description.trim(),
          // El `general` sigue público siempre (las reglas lo
          // exigen): aquí ni se ofrece cambiarlo.
          visibility: esGeneral ? 'all' : visibility,
          spoiler,
          order,
        });
        if (!res.ok) {
          setError(res.error ?? 'No se pudo actualizar el canal.');
          setEnviando(false);
          return;
        }
        onClose();
        return;
      }

      const datos: NuevoCanal = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        visibility,
        spoiler,
        order,
      };

      const res = await crearCanal(club, datos);
      if (!res.ok) {
        setError(res.error ?? 'No se pudo crear el canal.');
        setEnviando(false);
        return;
      }

      if (res.channelId) onCreado?.(res.channelId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el canal.');
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-violet-400">
              <Hash size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {editando ? `Editar #${channel?.name}` : `Nuevo canal en ${club.name}`}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {editando
                  ? 'El identificador interno no cambia al renombrar.'
                  : 'Los miembros lo verán al instante en la lista.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {/* ── Nombre ─────────────────────────────── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="canal-nombre" className="text-[11px] font-bold text-zinc-300">
                  Nombre del canal
                </label>
                <span className="text-[10px] text-zinc-600">
                  {name.length}/{CANAL_LIMITS.name.max}
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950 transition-colors focus-within:border-violet-500">
                <span className="pl-3 text-xs font-bold text-zinc-600">#</span>
                <input
                  id="canal-nombre"
                  type="text"
                  value={name}
                  onChange={(e) => manejarNombre(e.target.value)}
                  placeholder="teorias"
                  className="w-full flex-1 bg-transparent px-1 py-2 text-xs font-bold text-zinc-200 placeholder-zinc-700 focus:outline-none"
                />
              </div>
            </div>

            {/* ── Identificador (solo al crear) ──────── */}
            {!editando && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="canal-slug" className="text-[11px] font-bold text-zinc-300">
                    Identificador interno
                  </label>
                  <span className="text-[10px] text-zinc-600">
                    {slug.length}/{CANAL_LIMITS.slug.max}
                  </span>
                </div>
                <input
                  id="canal-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugEditado(true);
                    setSlug(canalSlugify(e.target.value));
                  }}
                  placeholder="teorias"
                  spellCheck={false}
                  className={`w-full rounded-xl border bg-zinc-950 px-3 py-2 font-mono text-xs text-violet-300 placeholder-zinc-700 focus:outline-none ${
                    slugDuplicado ? 'border-red-500/60' : 'border-zinc-800 focus:border-violet-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${slugDuplicado ? 'text-red-400' : 'text-zinc-600'}`}>
                  {slugDuplicado
                    ? 'Ya hay un canal con ese identificador en este club.'
                    : 'Minúsculas, números y guiones. No cambia al renombrar.'}
                </p>
              </div>
            )}

            {/* ── Descripción ────────────────────────── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="canal-desc" className="text-[11px] font-bold text-zinc-300">
                  Descripción
                </label>
                <span className="text-[10px] text-zinc-600">
                  {description.length}/{CANAL_LIMITS.description.max}
                </span>
              </div>
              <textarea
                id="canal-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, CANAL_LIMITS.description.max))}
                placeholder="¿De qué va este canal?"
                rows={2}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* ── Visibilidad ────────────────────────── */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                Quién puede entrar
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setVisibility('all')}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
                    visibility === 'all'
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <Globe size={15} className={`mt-0.5 ${visibility === 'all' ? 'text-violet-400' : 'text-zinc-500'}`} />
                  <span>
                    <span className="block text-[11px] font-bold text-zinc-200">
                      Todos los miembros
                    </span>
                    <span className="block text-[10px] text-zinc-500">
                      Cualquiera del club puede leer y escribir.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('mods')}
                  disabled={esGeneral}
                  title={esGeneral ? 'El canal general siempre es público.' : undefined}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    visibility === 'mods'
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <Lock size={15} className={`mt-0.5 ${visibility === 'mods' ? 'text-violet-400' : 'text-zinc-500'}`} />
                  <span>
                    <span className="block text-[11px] font-bold text-zinc-200">
                      Solo equipo
                    </span>
                    <span className="block text-[10px] text-zinc-500">
                      {esGeneral
                        ? 'El canal general siempre es público.'
                        : 'Solo propietario y moderadores (p. ej. coordinación).'}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* ── Spoilers y orden ───────────────────── */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={spoiler}
                  onChange={(e) => setSpoiler(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-violet-500"
                />
                <span className="text-[11px] leading-snug text-zinc-300">
                  Canal de spoilers
                  <span className="block text-[10px] text-zinc-500">
                    Se avisa antes de entrar.
                  </span>
                </span>
              </label>

              <div>
                <label htmlFor="canal-orden" className="mb-1 block text-[11px] font-bold text-zinc-300">
                  Posición en la lista
                </label>
                <input
                  id="canal-orden"
                  type="number"
                  min={0}
                  step={1}
                  value={Number.isFinite(order) ? order : 0}
                  onChange={(e) => setOrder(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-zinc-800 p-4">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                <p className="text-[11px] text-red-300">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deshabilitado}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando && <Loader2 size={14} className="animate-spin" />}
                <span>{enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear canal'}</span>
              </button>
            </div>

            {!editando && (
              <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-zinc-600">
                <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                Al crearlo aparece al instante para todos los miembros con acceso, sin recargar.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
