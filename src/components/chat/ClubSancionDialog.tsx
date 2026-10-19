import React, { useMemo, useState } from 'react';
import { AlertTriangle, Ban, Clock3, Loader2, ShieldAlert, VolumeX, X } from 'lucide-react';

import {
  DURACIONES_SANCION,
  MOTIVO_MAX,
  MOTIVO_MIN,
  minutosAMs,
  puedeSancionar,
  fechaLegible,
} from '../../data/clubModeracion';
import { ClubRoleBadge } from './ClubRoleBadge';
import type { Club, SancionTipo } from '../../types';

// ======================================================
// DIÁLOGO DE SANCIÓN
// ======================================================
// Silenciar o banear a un miembro, con:
//   · duración (incluida la personalizada, validada),
//   · motivo OBLIGATORIO (sin motivo no hay sanción),
//   · resumen con inicio y fin calculados antes de aplicar.
//
// El resumen no es adorno: el equivocarse al escribir un motivo
// o una duración es el error más común al moderar, y esta es la
// última pantalla antes de que pase.
//
// Los botones que no el actor puede pulsar están DESHABILITADOS
// con su motivo al lado, en vez de desaparecer: así quien está
// moderando entiende por qué no puede, y quien es el sancionado
// ve que la acción es posible pero necesita motivo.
// ======================================================

export interface SancionDialogProps {
  club: Club;
  actorUid: string;
  actorNombre: string;
  objetivoUid: string;
  objetivoNombre: string;
  /** Se cierra con el motivo del error, o `null` si se cancela. */
  onClose: () => void;
  onAplicar: (datos: {
    tipo: SancionTipo;
    duracionMs: number | null;
    motivo: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  /** `true` mientras se guarda, para bloquear el doble envío. */
  guardando: boolean;
  error: string | null;
}

export const SancionDialog: React.FC<SancionDialogProps> = ({
  club,
  actorUid,
  actorNombre,
  objetivoUid,
  objetivoNombre,
  onClose,
  onAplicar,
  guardando,
  error,
}) => {
  const [tipo, setTipo] = useState<SancionTipo>('silencio');
  const [duracionId, setDuracionId] = useState('1h');
  const [minutos, setMinutos] = useState('60');
  const [motivo, setMotivo] = useState('');

  const personalizada = duracionId === 'custom';
  const preset = DURACIONES_SANCION.find((d) => d.id === duracionId);

  /** Duración elegida en ms, o `null` si es permanente. */
  const duracionMs = useMemo(() => {
    if (!personalizada) return preset ? preset.ms : 60 * 60_000;
    return minutosAMs(Number(minutos));
  }, [personalizada, preset, minutos]);

  const permanente = tipo === 'baneo' && duracionMs === null;

  const inicio = useMemo(() => new Date(), []);
  const fin = useMemo(() => {
    if (duracionMs === null) return null;
    return new Date(inicio.getTime() + duracionMs);
  }, [duracionMs, inicio]);

  const permiso = puedeSancionar(club, actorUid, objetivoUid, tipo, permanente);
  const motivoLimpio = motivo.trim().replace(/\s+/g, ' ');
  const motivoOk = motivoLimpio.length >= MOTIVO_MIN;

  const puedeEnviar = permiso.ok && motivoOk && duracionMs !== undefined && !guardando;
  const errorDuracion =
    personalizada && duracionMs === null
      ? 'Escribe un número de minutos válido (de 1 a 525.600).'
      : null;

  const aplicar = async () => {
    if (!puedeEnviar || duracionMs === undefined) return;
    await onAplicar({ tipo, duracionMs, motivo: motivoLimpio });
  };

  const estiloBaneo =
    'border-red-400/40 bg-red-500/15 text-red-200';
  const estiloSilencio =
    'border-orange-400/40 bg-orange-500/15 text-orange-200';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={guardando ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aplicar sanción"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0c0c14] shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        {/* ── Cabecera ─────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldAlert size={15} className="text-violet-300" />
            Sancionar en el club
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Cuerpo ───────────────────────────────── */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Quién va a ser sancionado. */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-black text-white"
              aria-hidden="true"
            >
              {objetivoNombre.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-bold text-white">
                {objetivoNombre}
                <ClubRoleBadge club={club} uid={objetivoUid} size="xs" />
              </p>
              <p className="text-[10px] text-zinc-500">Cargo dentro de este club</p>
            </div>
          </div>

          {/* Tipo. */}
          <section className="space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Tipo de sanción
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipo('silencio');
                  // El silencio nunca es permanente: si venía de
                  // un baneo permanente, se vuelve a un plazo real.
                  if (duracionId === 'permanente') setDuracionId('1h');
                }}
                aria-pressed={tipo === 'silencio'}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition-colors ${
                  tipo === 'silencio' ? estiloSilencio : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white'
                }`}
              >
                <VolumeX size={15} />
                <span className="text-[11px] font-bold">Silenciar</span>
                <span className="text-[9px] font-normal opacity-80">
                  Lee, pero no escribe
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('baneo')}
                aria-pressed={tipo === 'baneo'}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition-colors ${
                  tipo === 'baneo' ? estiloBaneo : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white'
                }`}
              >
                <Ban size={15} />
                <span className="text-[11px] font-bold">Banear del club</span>
                <span className="text-[9px] font-normal opacity-80">
                  Sale y no puede volver
                </span>
              </button>
            </div>
          </section>

          {/* Duración. */}
          <section className="space-y-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <Clock3 size={11} />
              Duración
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DURACIONES_SANCION.map((d) => {
                // El baneo permanente solo se ofrece donde el
                // propietario o un admin pueden aplicarlo: quien no
                // puede, lo ve tapping pero desactivado, para que
                // entienda que la opción existe y por qué no vale.
                const noPuede =
                  d.id === 'permanente' && tipo === 'silencio'
                    ? true
                    : !puedeSancionar(club, actorUid, objetivoUid, tipo, d.ms === null).ok;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDuracionId(d.id)}
                    disabled={noPuede}
                    aria-pressed={duracionId === d.id}
                    title={noPuede ? 'No tienes permiso para esta duración.' : undefined}
                    className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                      duracionId === d.id
                        ? 'border-violet-400 bg-violet-950/50 text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.nombre}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDuracionId('custom')}
                aria-pressed={personalizada}
                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  personalizada
                    ? 'border-violet-400 bg-violet-950/50 text-violet-200'
                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white'
                }`}
              >
                Personalizada
              </button>
            </div>

            {personalizada && (
              <div className="space-y-1">
                <label
                  htmlFor="minutos-sancion"
                  className="block text-[10px] text-zinc-500"
                >
                  Minutos de sanción
                </label>
                <input
                  id="minutos-sancion"
                  type="number"
                  min={1}
                  max={525600}
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                />
                {errorDuracion && (
                  <p className="text-[10px] text-red-300">{errorDuracion}</p>
                )}
              </div>
            )}
          </section>

          {/* Motivo: obligatorio. */}
          <section className="space-y-2">
            <label
              htmlFor="motivo-sancion"
              className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500"
            >
              Motivo <span className="text-red-400">*</span>
            </label>
            <textarea
              id="motivo-sancion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={MOTIVO_MAX}
              placeholder="Escribe por qué se aplica la sanción. La persona sancionada lo verá."
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
            />
            <p className="flex items-center justify-between text-[10px] text-zinc-600">
              <span>
                {motivoOk
                  ? 'La persona sancionada verá este motivo.'
                  : `Mínimo ${MOTIVO_MIN} caracteres. Sin motivo no se puede sancionar.`}
              </span>
              <span>
                {motivoLimpio.length}/{MOTIVO_MAX}
              </span>
            </p>
          </section>

          {/* Resumen: la última comprobación antes de aplicar. */}
          <section className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <AlertTriangle size={11} />
              Resumen
            </p>
            <dl className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Persona</dt>
                <dd className="truncate font-semibold text-white">{objetivoNombre}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Sanción</dt>
                <dd className="font-semibold text-white">
                  {tipo === 'baneo' ? 'Baneo del club' : 'Silencio'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Inicio</dt>
                <dd className="font-semibold text-white">{fechaLegible(inicio.toISOString())}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Fin</dt>
                <dd className="font-semibold text-white">
                  {fin ? fechaLegible(fin.toISOString()) : 'Permanente'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Aplica</dt>
                <dd className="truncate font-semibold text-white">{actorNombre}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-zinc-500">Motivo</dt>
                <dd className="truncate font-semibold text-white">
                  {motivoOk ? motivoLimpio : '—'}
                </dd>
              </div>
            </dl>
            {tipo === 'baneo' && (
              <p className="text-[10px] leading-relaxed text-red-300">
                La persona sale del club y no puede reincorporarse hasta que termine la
                sanción. Sus cuentas y el resto de clubes no se tocan.
              </p>
            )}
          </section>

          {!permiso.ok && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              {permiso.motivo}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
            >
              {error}
            </p>
          )}
        </div>

        {/* ── Pie ──────────────────────────────────── */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.06] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void aplicar()}
            disabled={!puedeEnviar}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 ${
              tipo === 'baneo'
                ? 'bg-gradient-to-r from-red-600 to-rose-700 shadow-lg shadow-red-950/40 hover:brightness-110'
                : 'bg-gradient-to-r from-orange-600 to-amber-700 shadow-lg shadow-orange-950/40 hover:brightness-110'
            }`}
          >
            {guardando && <Loader2 size={12} className="animate-spin" />}
            {tipo === 'baneo' ? 'Banear del club' : 'Silenciar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SancionDialog;