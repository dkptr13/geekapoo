import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCheck,
  Clock3,
  History,
  Loader2,
  Search,
  ShieldCheck,
  VolumeX,
  X,
} from 'lucide-react';

import {
  estadoDe,
  fechaLegible,
  filtrarSanciones,
  MOTIVO_MAX,
  puedeLevantar,
} from '../../data/clubModeracion';
import { levantarSancion, subscribeHistorial } from '../../services/clubModeracion';
import { useAuth } from '../../context/AuthContext';
import { ClubRoleBadge } from './ClubRoleBadge';
import type { Club, ClubSancion, SancionEstado } from '../../types';

// ======================================================
// PANEL DE MODERACIÓN DEL CLUB
// ======================================================
//
// Un solo sitio para ver las sanciones: las vigentes, las
// caducadas (se conservan para la trazabilidad, pero ya no
// bloquean nada) y las retiradas a mano.
//
// El HISTORIAL se trae con un único `onSnapshot` de la
// subcolección, no una consulta por persona: son pocos
// documentos y se abrió solo mientras el panel está en pantalla.
//
// Quien no puede levantar una sanción lo ve escrito al lado, en
// vez de esconder el botón: así el equipo sabe por qué no puede
// en lugar de pensar que la web falla.
// ======================================================

const FILTROS: { id: SancionEstado | 'todas'; nombre: string }[] = [
  { id: 'activa', nombre: 'Activas' },
  { id: 'expirada', nombre: 'Expiradas' },
  { id: 'retirada', nombre: 'Retiradas' },
  { id: 'todas', nombre: 'Todas' },
];

export const ClubModerationPanel: React.FC<{
  club: Club;
  onClose: () => void;
}> = ({ club, onClose }) => {
  const { currentUser, usersList } = useAuth();

  const [sanciones, setSanciones] = useState<ClubSancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<SancionEstado | 'todas'>('activa');
  const [busqueda, setBusqueda] = useState('');
  const [levantando, setLevantando] = useState<string | null>(null);
  const [pedidoLevantar, setPedidoLevantar] = useState<ClubSancion | null>(null);
  const [motivoRetirada, setMotivoRetirada] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    return subscribeHistorial(
      club.id,
      (lista) => {
        setSanciones(lista);
        setCargando(false);
      },
      (e) => {
        setError(e.message);
        setCargando(false);
      },
    );
  }, [club.id]);

  // El reloj del panel: recalcula cada minuto para que una
  // sanción que caduca pase a «expirada» sola, sin recargar.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const lista = useMemo(
    () => filtrarSanciones(sanciones, busqueda, filtro, ahora),
    [sanciones, busqueda, filtro, ahora],
  );

  const nombreDe = useCallback(
    (uid: string) => {
      const u = usersList.find((x) => x.uid === uid);
      return u?.displayName || u?.username || 'Alguien';
    },
    [usersList],
  );

  const confirmarLevantar = async () => {
    if (!pedidoLevantar || !currentUser) return;
    setLevantando(pedidoLevantar.id);
    setError(null);
    const r = await levantarSancion({
      club,
      actorUid: currentUser.uid,
      actorNombre: nombreDe(currentUser.uid),
      objetivoUid: pedidoLevantar.objetivoUid,
      objetivoNombre: pedidoLevantar.objetivoNombre,
      motivoRetirada: motivoRetirada.trim().slice(0, MOTIVO_MAX),
    });
    setLevantando(null);
    if (!r.ok) {
      setError(r.error ?? 'No se pudo levantar.');
      return;
    }
    setPedidoLevantar(null);
    setMotivoRetirada('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <ShieldCheck size={15} className="text-violet-300" />
          Moderación del club
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Búsqueda. */}
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por persona, motivo o moderador"
            aria-label="Buscar sanciones"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
          />
        </div>

        {/* Filtros. */}
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                filtro === f.id
                  ? 'border-violet-400 bg-violet-950/50 text-violet-200'
                  : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
          >
            {error}
          </p>
        )}

        {cargando ? (
          <p className="flex items-center gap-2 px-1 py-6 text-[11px] text-zinc-500">
            <Loader2 size={13} className="animate-spin" />
            Cargando sanciones…
          </p>
        ) : lista.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] px-3 py-8 text-center text-[11px] text-zinc-500">
            No hay sanciones que enseñar.
          </p>
        ) : (
          <ul className="space-y-2">
            {lista.map((s) => {
              const estado = estadoDe(s, ahora);
              const permiso = puedeLevantar(club, currentUser?.uid ?? '', s);
              const Icono = s.tipo === 'baneo' ? Ban : VolumeX;
              return (
                <li
                  key={s.id}
                  className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <Icono
                      size={14}
                      className={`mt-0.5 flex-shrink-0 ${
                        s.tipo === 'baneo' ? 'text-red-400' : 'text-orange-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-white">
                        {s.objetivoNombre || nombreDe(s.objetivoUid)}
                        <ClubRoleBadge club={club} uid={s.objetivoUid} size="xs" />
                        <span
                          className={`rounded border px-1.5 py-px text-[9px] font-bold ${
                            estado === 'activa'
                              ? s.tipo === 'baneo'
                                ? 'border-red-400/40 bg-red-500/10 text-red-200'
                                : 'border-orange-400/40 bg-orange-500/10 text-orange-200'
                              : 'border-white/[0.06] bg-white/[0.03] text-zinc-500'
                          }`}
                        >
                          {estado === 'retirada' ? 'retirada' : estado}
                        </span>
                      </p>
                      <p className="mt-0.5 break-words text-[11px] leading-relaxed text-zinc-300">
                        {s.motivo}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 gap-x-3 gap-y-0.5 pl-[26px] text-[10px] text-zinc-500 sm:grid-cols-2">
                    <div className="flex gap-1.5">
                      <dt>Aplica:</dt>
                      <dd className="truncate text-zinc-400">
                        {s.aplicadaPorNombre || nombreDe(s.aplicadaPor)}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>Inicio:</dt>
                      <dd className="text-zinc-400">{fechaLegible(s.inicio)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>Fin:</dt>
                      <dd className="text-zinc-400">
                        {s.retirada && s.retiradaEn
                          ? `retirada el ${fechaLegible(s.retiradaEn)}`
                          : s.permanente
                            ? 'Permanente'
                            : fechaLegible(s.fin)}
                      </dd>
                    </div>
                    {s.motivoRetirada && (
                      <div className="flex gap-1.5">
                        <dt>Motivo retirada:</dt>
                        <dd className="truncate text-zinc-400">{s.motivoRetirada}</dd>
                      </div>
                    )}
                  </dl>

                  {estado === 'activa' && (
                    <div className="pl-[26px]">
                      {permiso.ok ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPedidoLevantar(s);
                            setMotivoRetirada('');
                            setError(null);
                          }}
                          disabled={levantando === s.id}
                          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
                        >
                          {levantando === s.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <CheckCheck size={11} />
                          )}
                          {s.tipo === 'baneo' ? 'Desbanear del club' : 'Quitar el silencio'}
                        </button>
                      ) : (
                        <p className="text-[10px] italic text-zinc-600">
                          {permiso.motivo}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="flex items-start gap-1.5 pt-1 text-[10px] leading-relaxed text-zinc-600">
          <History size={11} className="mt-0.5 flex-shrink-0" />
          Las sanciones caducadas y retiradas se conservan para la trazabilidad, pero ya no
          bloquean nada. El registro no lo puede editar ni borrar ningún miembro del club.
        </p>
      </div>

      {/* Confirmación de retirada, con motivo opcional. */}
      {pedidoLevantar && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={levantando ? undefined : () => setPedidoLevantar(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Levantar sanción"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-white/[0.08] bg-[#0c0c14] p-5 shadow-2xl"
          >
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <Clock3 size={14} className="text-violet-300" />
              Levantar sanción
            </h4>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              {pedidoLevantar.tipo === 'baneo' ? (
                <>
                  Se le quitará el baneo a{' '}
                  <strong className="text-white">
                    {pedidoLevantar.objetivoNombre || nombreDe(pedidoLevantar.objetivoUid)}
                  </strong>{' '}
                  y <strong className="text-white">vuelve al club</strong> con el cargo que
                  tenía antes del baneo.
                </>
              ) : (
                <>
                  Se le quitará el silencio a{' '}
                  <strong className="text-white">
                    {pedidoLevantar.objetivoNombre || nombreDe(pedidoLevantar.objetivoUid)}
                  </strong>{' '}
                  y podrá escribir en el club de inmediato.
                </>
              )}
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="motivo-retirada"
                className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500"
              >
                Motivo de la retirada (opcional)
              </label>
              <textarea
                id="motivo-retirada"
                value={motivoRetirada}
                onChange={(e) => setMotivoRetirada(e.target.value)}
                rows={2}
                maxLength={MOTIVO_MAX}
                placeholder="Queda registrado en el historial del club."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPedidoLevantar(null)}
                disabled={levantando !== null}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarLevantar()}
                disabled={levantando !== null}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                {levantando !== null && <Loader2 size={12} className="animate-spin" />}
                Levantar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubModerationPanel;