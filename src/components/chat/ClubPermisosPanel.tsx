import React, { useEffect, useState } from 'react';
import { Check, Crown, Loader2, Shield, ShieldCheck, Swords, User, X } from 'lucide-react';

import {
  PERMISOS_DELEGABLES,
  permisosDe,
  PESO_RANGO,
  rangoEnClub,
} from '../../data/clubModeracion';
import { guardarPermisos } from '../../services/clubModeracion';
import { useAuth } from '../../context/AuthContext';
import type { Club, ClubPermisos, ClubRango } from '../../types';

// ======================================================
// PANEL DE ROLES Y PERMISOS DEL CLUB
// ======================================================
// La tabla de arriba compara lo que puede hacer cada rango de
// serie. Debajo están los permisos DELEGABLES, que el
// propietario enciende o apaga.
//
// Solo el propietario puede tocar los interruptores: un
// administrador que viera esta pantalla podría concessionarse
// poderes a sí mismo. Las reglas de Firestore lo impiden en el
// servidor (`permisos` solo está en la rama del propietario).
//
// Lo que un admin ve de esta pantalla es de solo lectura, y
// con el motivo de por qué: es más honesto que esconder el
// panel y dejarle pensando que el club no tiene estas
// opciones.
// ======================================================

/** Lo que puede hacer cada rango de serie, sin nada delegado. */
const CAPACIDADES: { texto: string; rangos: ClubRango[] }[] = [
  { texto: 'Administrar el club (configuración, canales, roles)', rangos: ['owner'] },
  { texto: 'Nombrar y retirar administradores y moderadores', rangos: ['owner'] },
  { texto: 'Transferir la propiedad o eliminar el club', rangos: ['owner'] },
  { texto: 'Editar el aspecto del club (nombre, icono, banner)', rangos: ['owner', 'admin'] },
  { texto: 'Gestionar canales', rangos: ['owner', 'admin'] },
  { texto: 'Consultar y gestionar miembros', rangos: ['owner', 'admin', 'moderator'] },
  { texto: 'Silenciar a un miembro', rangos: ['owner', 'admin', 'moderator'] },
  { texto: 'Bquear a un miembro', rangos: ['owner', 'admin', 'moderator'] },
  { texto: 'Baneo permanente', rangos: ['owner', 'admin'] },
  { texto: 'Retirar mensajes que incumplen las normas', rangos: ['owner', 'admin', 'moderator'] },
  { texto: 'Retirar sanciones de otros', rangos: ['owner', 'admin', 'moderator'] },
  { texto: 'Consultar el historial de moderación', rangos: ['owner', 'admin', 'moderator'] },
  { texto: 'Leer, escribir, responder y reaccionar', rangos: ['owner', 'admin', 'moderator', 'member'] },
  { texto: 'Denunciar un mensaje', rangos: ['owner', 'admin', 'moderator', 'member'] },
];

const RANGOS_FILA: { rango: ClubRango; nombre: string; icono: React.ReactNode }[] = [
  { rango: 'owner', nombre: 'Propietario', icono: <Crown size={13} className="text-amber-300" /> },
  { rango: 'admin', nombre: 'Admin', icono: <Shield size={13} className="text-violet-300" /> },
  { rango: 'moderator', nombre: 'Moderador', icono: <Swords size={13} className="text-sky-300" /> },
  { rango: 'member', nombre: 'Miembro', icono: <User size={13} className="text-zinc-400" /> },
];

export const ClubPermisosPanel: React.FC<{ club: Club }> = ({ club }) => {
  const { currentUser } = useAuth();
  const esDueño = rangoEnClub(club, currentUser?.uid) === 'owner';

  const [borrador, setBorrador] = useState<ClubPermisos>(() => permisosDe(club));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    setBorrador(permisosDe(club));
  }, [club]);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    setAviso(null);
    const r = await guardarPermisos(club.id, borrador);
    setGuardando(false);
    if (!r.ok) {
      setError(r.error ?? 'No se pudieron guardar los permisos.');
      return;
    }
    setAviso('Permisos guardados.');
  };

  const alternar = (id: keyof ClubPermisos) =>
    setBorrador((b) => ({ ...b, [id]: !b[id] }));

  return (
    <div className="space-y-5">
      {/* ── Tabla comparativa ─────────────────────────── */}
      <section className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <ShieldCheck size={11} />
          Qué puede hacer cada cargo
        </h4>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500">Permiso</th>
                {RANGOS_FILA.map((r) => (
                  <th
                    key={r.rango}
                    className="px-2 py-2 text-center text-[10px] font-bold text-zinc-300"
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      {r.icono}
                      {r.nombre}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPACIDADES.map((c) => (
                <tr key={c.texto} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-2.5 py-1.5 text-[10px] leading-relaxed text-zinc-400">
                    {c.texto}
                  </td>
                  {RANGOS_FILA.map((r) => (
                    <td key={r.rango} className="px-2 py-1.5 text-center">
                      {c.rangos.includes(r.rango) ? (
                        <Check size={12} className="mx-auto text-emerald-400" />
                      ) : (
                        <X size={11} className="mx-auto text-zinc-700" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] leading-relaxed text-zinc-600">
          Esto es lo que cada cargo puede hacer de serie. Los permisos de abajo pueden
          cambiarse; la propiedad del club, la seguridad y el reparto de cargos
          superiores no se pueden delegar en nadie.
        </p>
      </section>

      {/* ── Permisos delegables ──────────────────────── */}
      <section className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Permisos delegables
        </h4>

        {!esDueño && (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
            Solo el propietario puede cambiar estos permisos. Puedes verlos, pero no
            activarlos ni desactivarlos.
          </p>
        )}

        <ul className="space-y-1.5">
          {PERMISOS_DELEGABLES.map((p) => {
            const activo = borrador[p.id] === true;
            return (
              <li
                key={p.id}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={activo}
                  aria-label={p.etiqueta}
                  disabled={!esDueño || guardando}
                  onClick={() => alternar(p.id)}
                  className={`mt-0.5 flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50 ${
                    activo ? 'bg-violet-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      activo ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-white">
                    {p.etiqueta}
                    <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-px text-[9px] font-semibold text-zinc-500">
                      {p.para === 'admin' ? 'Admins' : 'Moderadores'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">
                    {p.descripcion}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
          >
            {error}
          </p>
        )}
        {aviso && (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
            {aviso}
          </p>
        )}

        {esDueño && (
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {guardando && <Loader2 size={13} className="animate-spin" />}
            Guardar permisos
          </button>
        )}
      </section>
    </div>
  );
};

export default ClubPermisosPanel;
