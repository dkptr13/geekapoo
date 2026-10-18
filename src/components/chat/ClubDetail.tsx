import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Users,
  Crown,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  UserCog,
  LogOut,
  Trash2,
  Volume2,
  VolumeX,
  Check,
  Loader2,
  AlertCircle,
  Globe,
  Lock,
  Mail,
  BadgeCheck,
  Settings2,
  Palette,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useClubs } from '../../context/ClubsContext';
import { CLUB_CATEGORIES } from '../../types';
import type { Club, ClubMember } from '../../types';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { ChatPrefsPanel } from './ChatPrefsPanel';
import { actualizarCanal } from '../../services/canales';

// ======================================================
// DETALLE DEL CLUB
// ======================================================
// Panel lateral con la información del club: descripción,
// normas, categoría, tipo de acceso y la lista de miembros
// con su rol. Desde aquí se gestionan también las
// solicitudes, los roles, las expulsiones y la
// configuración, siempre que el usuario tenga permiso.
//
// Los permisos se muestran en la interfaz Y los aplica
// Firestore: si alguien manipula el DOM para mostrar un
// botón que no le toca, la escritura la rechazan las reglas
// y el error se enseña aquí. Los botones ocultos NO son la
// protección, son solo la cortesía de no ofrecer lo que no
// se puede hacer.
// ======================================================

interface Props {
  club: Club;
  onClose: () => void;
  canalActivo?: {
    chatFondo?: { preset?: string; url?: string } | null;
  } | null;
  canalActivoId?: string;
}

type Vista = 'info' | 'miembros' | 'solicitudes' | 'config';

export const ClubDetail: React.FC<Props> = ({ club, onClose, canalActivo, canalActivoId }) => {
  const { currentUser, usersList } = useAuth();
  const goToProfile = useGoToProfile();
  const {
    soyPropietario,
    soyModerador,
    miRolEn,
    solicitudesPendientes,
    aceptar,
    rechazar,
    expulsar,
    rol: cambiarRolAccion,
    transferir,
    silenciar,
    abandonar,
    actualizar,
    eliminar,
  } = useClubs();

  const [vista, setVista] = useState<Vista>('info');
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Configuración editable
  const [editName, setEditName] = useState(club.name);
  const [editDesc, setEditDesc] = useState(club.description);
  const [editRules, setEditRules] = useState(club.rules ?? '');
  const [editAccess, setEditAccess] = useState(club.accessType);

  // Confirmaciones
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [expulsandoA, setExpulsandoA] = useState<ClubMember | null>(null);
  const [transfiriendoA, setTransfiriendoA] = useState<ClubMember | null>(null);
  // Panel de preferencias personales del chat (color, apodo, avisos).
  const [prefsOpen, setPrefsOpen] = useState(false);

  const propietario = soyPropietario(club);
  const moderador = soyModerador(club);
  const miRol = miRolEn(club);

  // Solo se ven las solicitudes de ESTE club.
  const solicitudes = useMemo(
    () => solicitudesPendientes.filter((r) => r.clubId === club.id),
    [solicitudesPendientes, club.id],
  );

  // Nombre y avatar reales de cada miembro, del directorio de
  // usuarios. El mapa de miembros solo guarda el uid, así que
  // la foto y el nombre se resuelven aquí.
  const fichaDe = (uid: string) => usersList.find((u) => u.uid === uid);

  const nombreDe = (uid: string) => {
    const u = fichaDe(uid);
    if (!u) return uid.slice(0, 10) + '…';
    return u.uid === currentUser?.uid ? `${u.displayName || u.username} (tú)` : u.displayName || u.username;
  };

  const avatarDe = (uid: string) => fichaDe(uid)?.avatarUrl ?? '';

  const miembros = useMemo(
    () =>
      Object.values(club.members).sort((a, b) => {
        const orden = { owner: 0, moderator: 1, member: 2 };
        if (orden[a.role] !== orden[b.role]) return orden[a.role] - orden[b.role];
        return Date.parse(b.joinedAt) - Date.parse(a.joinedAt);
      }),
    [club.members],
  );

  // El estado editable se resincroniza si el club cambia
  // desde fuera (otra pestaña, o una acción propia).
  useEffect(() => {
    setEditName(club.name);
    setEditDesc(club.description);
    setEditRules(club.rules ?? '');
    setEditAccess(club.accessType);
  }, [club.name, club.description, club.rules, club.accessType]);

  const avisar = (tipo: 'ok' | 'error', texto: string) => setMensaje({ tipo, texto });

  const ejecutar = async (
    accion: () => Promise<{ ok: boolean; error?: string }>,
    textoOk: string,
    limpiar?: () => void,
  ) => {
    if (procesando) return;
    setProcesando(true);
    setMensaje(null);

    const r = await accion();
    setProcesando(false);

    if (r.ok) {
      avisar('ok', textoOk);
      limpiar?.();
    } else {
      avisar('error', r.error ?? 'No se pudo completar la operación.');
    }
  };

  const categoria = CLUB_CATEGORIES.find((c) => c.id === club.category);

  const etiquetaAcceso =
    club.accessType === 'public'
      ? 'Público'
      : club.accessType === 'private'
        ? 'Privado'
        : 'Por solicitud';

  const IconoAcceso = club.accessType === 'public' ? Globe : Lock;

  const pestanas: [Vista, string][] = [
    ['info', 'Información'],
    ['miembros', `Miembros (${miembros.length})`],
    ...(moderador
      ? ([['solicitudes', `Solicitudes${solicitudes.length ? ` (${solicitudes.length})` : ''}`]] as [
          Vista,
          string,
        ][])
      : []),
    ...(propietario ? ([['config', 'Configuración']] as [Vista, string][]) : []),
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950/98 backdrop-blur-sm">
      {/* Cabecera con la portada */}
      <div className="relative flex-shrink-0">
        <div className="h-24 bg-zinc-900">
          {club.coverUrl ? (
            <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/25 via-fuchsia-600/10 to-pink-600/20 text-3xl">
              {categoria?.icon ?? '✨'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-1.5 text-zinc-400 backdrop-blur-sm transition-colors hover:text-white"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="absolute -bottom-6 left-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-950 bg-zinc-900 text-2xl">
            {club.iconUrl ? (
              <img src={club.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{categoria?.icon ?? '✨'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-3 pt-8">
        <h2 className="text-base font-bold leading-tight text-white">{club.name}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-bold text-zinc-400">
            <Users size={10} />
            {club.memberCount} {club.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-bold text-zinc-400">
            <IconoAcceso size={10} />
            {etiquetaAcceso}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-bold text-zinc-400">
            {categoria?.label ?? club.category}
          </span>
          {miRol && miRol.role !== 'member' && (
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${
                miRol.role === 'owner'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-violet-500/30 bg-violet-500/10 text-violet-300'
              }`}
            >
              {miRol.role === 'owner' ? <Crown size={10} /> : <ShieldCheck size={10} />}
              {miRol.role === 'owner' ? 'Propietario' : 'Moderador'}
            </span>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-y border-zinc-800 px-3 py-2">
        {pestanas.map(([id, etiqueta]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setVista(id);
              setMensaje(null);
            }}
            className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
              vista === id
                ? 'bg-violet-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {mensaje && (
          <div
            className={`mb-3 flex items-start gap-2 rounded-xl border px-3 py-2 ${
              mensaje.tipo === 'ok'
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-red-500/30 bg-red-500/10'
            }`}
          >
            {mensaje.tipo === 'ok' ? (
              <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
            )}
            <p
              className={`text-[11px] ${
                mensaje.tipo === 'ok' ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {mensaje.texto}
            </p>
          </div>
        )}

        {/* ── INFORMACIÓN ─────────────────────────────── */}
        {vista === 'info' && (
          <div className="space-y-4">
            <section>
              <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Descripción
              </h4>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                {club.description}
              </p>
            </section>

            {club.rules && (
              <section>
                <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Normas de convivencia
                </h4>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400">
                    {club.rules}
                  </p>
                </div>
              </section>
            )}

            <section>
              <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Identificador
              </h4>
              <p className="font-mono text-[11px] text-violet-300">/chats/{club.slug}</p>
            </section>

            {/* Acciones propias */}
            <section className="space-y-2 border-t border-zinc-800 pt-4">
              {propietario ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmarEliminar(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar el club</span>
                  </button>
                  <p className="text-[10px] leading-relaxed text-zinc-600">
                    Eliminar el club quita el acceso al chat a todos sus miembros. La operación no
                    se puede deshacer.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmarSalir(true)}
                    disabled={!miRol}
                    className="flex w-full items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    <span>Abandonar el club</span>
                  </button>
                  {propietario && (
                    <p className="text-[10px] leading-relaxed text-amber-400/80">
                      Eres el propietario: para salir tienes que transferir la propiedad o
                      eliminar el club.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {/* ── MIEMBROS ────────────────────────────────── */}
        {vista === 'miembros' && (
          <div className="space-y-3">
            {moderador && (
              <p className="flex items-start gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-violet-300">
                <BadgeCheck size={12} className="mt-0.5 flex-shrink-0" />
                <span>
                  Como moderador puedes expulsar o silenciar a los miembros. Los roles y la
                  propiedad los decide el propietario.
                </span>
              </p>
            )}

            <ul className="space-y-1.5">
              {miembros.map((m) => {
                const esYo = m.uid === currentUser?.uid;
                const silenciado = !!m.mutedUntil && Date.parse(m.mutedUntil) > Date.now();
                const esElDueno = m.uid === club.ownerId;

                return (
                  <li
                    key={m.uid}
                    className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => goToProfile(m.uid)}
                      className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800"
                      title="Ver perfil"
                    >
                      {avatarDe(m.uid) ? (
                        <img src={avatarDe(m.uid)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-zinc-500">
                          {m.uid.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-white">
                        {nombreDe(m.uid)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                        {m.role === 'owner' && (
                          <span className="flex items-center gap-0.5 font-bold text-amber-300">
                            <Crown size={9} />
                            Propietario
                          </span>
                        )}
                        {m.role === 'moderator' && (
                          <span className="flex items-center gap-0.5 font-bold text-violet-300">
                            <ShieldCheck size={9} />
                            Moderador
                          </span>
                        )}
                        {m.role === 'member' && <span className="text-zinc-500">Miembro</span>}
                        {silenciado && (
                          <span className="flex items-center gap-0.5 font-bold text-orange-400">
                            <VolumeX size={9} />
                            Silenciado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones del propietario sobre otros miembros */}
                    {propietario && !esYo && !esElDueno && (
                      <button
                        type="button"
                        onClick={() => setTransfiriendoA(m)}
                        disabled={procesando}
                        className="flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 transition-colors hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-50"
                        title="Transferir la propiedad"
                      >
                        <Crown size={12} />
                      </button>
                    )}

                    {/* Acciones de moderación */}
                    {moderador && !esYo && !esElDueno && (
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {propietario && (
                          <button
                            type="button"
                            onClick={() =>
                              ejecutar(
                                () =>
                                  cambiarRolAccion(
                                    club.id,
                                    m.uid,
                                    m.role === 'moderator' ? 'member' : 'moderator',
                                  ),
                                m.role === 'moderator'
                                  ? 'Rol de moderador retirado.'
                                  : 'Ascendido a moderador.',
                              )
                            }
                            disabled={procesando}
                            className="rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-300 disabled:opacity-50"
                            title={
                              m.role === 'moderator' ? 'Quitar moderador' : 'Nombrar moderador'
                            }
                          >
                            {m.role === 'moderator' ? (
                              <ShieldOff size={12} />
                            ) : (
                              <UserCog size={12} />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            ejecutar(
                              () =>
                                silenciar(
                                  club.id,
                                  m.uid,
                                  silenciado ? '' : silencioDe7Dias(),
                                ),
                              silenciado ? 'Silencio levantado.' : 'Miembro silenciado 7 días.',
                            )
                          }
                          disabled={procesando}
                          className="rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-50"
                          title={silenciado ? 'Quitar silencio' : 'Silenciar 7 días'}
                        >
                          {silenciado ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpulsandoA(m)}
                          disabled={procesando}
                          className="rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                          title="Expulsar del club"
                        >
                          <UserMinus size={12} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── SOLICITUDES ─────────────────────────────── */}
        {vista === 'solicitudes' && moderador && (
          <div className="space-y-2">
            {solicitudes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600">
                  <Mail size={20} />
                </div>
                <p className="mt-3 text-xs font-bold text-white">No hay solicitudes pendientes</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Cuando alguien pida entrar, aparecerá aquí.
                </p>
              </div>
            ) : (
              solicitudes.map((r) => (
                <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="flex items-center gap-2.5">
                    {r.fromAvatar ? (
                      <img src={r.fromAvatar} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                        {r.fromName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-white">{r.fromName}</p>
                      <p className="text-[10px] text-zinc-500">
                        Pidió entrar · {new Date(r.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => ejecutar(() => aceptar(club.id, r), 'Solicitud aceptada.')}
                      disabled={procesando}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                    >
                      {procesando ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Check size={11} />
                      )}
                      <span>Aceptar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        ejecutar(() => rechazar(club.id, r.id), 'Solicitud rechazada.')
                      }
                      disabled={procesando}
                      className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CONFIGURACIÓN ───────────────────────────── */}
        {vista === 'config' && propietario && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                Nombre del club
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">Descripción</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                Normas de convivencia
              </label>
              <textarea
                value={editRules}
                onChange={(e) => setEditRules(e.target.value)}
                rows={4}
                placeholder="Sin normas"
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                Tipo de acceso
              </label>
              <div className="space-y-1.5">
                {(
                  [
                    ['public', 'Público', 'Cualquiera puede unirse directamente.'],
                    ['private', 'Privado', 'Solo miembros aprobados.'],
                    ['request', 'Por solicitud', 'Los moderadores aceptan cada entrada.'],
                  ] as const
                ).map(([valor, titulo, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setEditAccess(valor)}
                    className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
                      editAccess === valor
                        ? 'border-violet-500 bg-violet-600/10'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <Settings2
                      size={14}
                      className={editAccess === valor ? 'text-violet-400' : 'text-zinc-500'}
                    />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold text-zinc-200">{titulo}</span>
                      <span className="block text-[10px] text-zinc-500">{texto}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                ejecutar(
                  () =>
                    actualizar(club.id, {
                      name: editName.trim(),
                      description: editDesc.trim(),
                      rules: editRules.trim(),
                      accessType: editAccess,
                    }),
                  'Cambios guardados.',
                )
              }
              disabled={procesando}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {procesando && <Loader2 size={13} className="animate-spin" />}
              <span>Guardar cambios</span>
            </button>

            {/* ── PREFERENCIAS PERSONALES DEL CHAT ──────────
                Color, apodo, avisos y favorito: cada
                participante ve la conversación con SUS
                ajustes. No se comparte con nadie. */}
            <button
              type="button"
              onClick={() => setPrefsOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-zinc-200 transition-colors hover:text-white"
            >
              <Palette size={13} />
              <span>Personalizar chat</span>
            </button>

            {/* ── FONDO COMPARTIDO DEL CANAL ─────────────
                Lo cambia el equipo del club y afecta a todos los
                miembros de la conversación. Solo propietario
                y moderadores. */}
            {moderador && (
              <section className="mt-3 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Fondo del chat
                </h4>
                <p className="text-[10px] leading-relaxed text-zinc-600">
                  Este fondo lo ven todos los miembros del club en sus canales.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(
                    [
                      { id: 'ninguno', nombre: 'Sin fondo', css: '' },
                      { id: 'tinta', nombre: 'Tinta', css: '#101014' },
                      { id: 'vino', nombre: 'Vino', css: '#1c1016' },
                      { id: 'bosque', nombre: 'Bosque', css: '#0e1512' },
                      { id: 'ocaso-kyoto', nombre: 'Ocaso', css: 'linear-gradient(160deg,#241109,#4a2410 45%,#160c07)' },
                      { id: 'ola', nombre: 'Ola', css: 'linear-gradient(160deg,#0f4c5c,#1d2b64 45%,#0f0c29)' },
                      { id: 'llama', nombre: 'Llama', css: 'linear-gradient(160deg,#2d0000,#8e2de2 45%,#4a00e0)' },
                    ] as const
                  ).map((f) => {
                    const activo = (canalActivo?.chatFondo?.preset ?? 'ninguno') === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          ejecutar(
                            () =>
                              canalActivoId
                                ? actualizarCanal(club.id, canalActivoId, {
                                    chatFondo: f.id === 'ninguno' ? null : { preset: f.id },
                                  })
                                : Promise.resolve({ ok: false, error: 'Canal no disponible.' }),
                          'Fondo actualizado.',
                        )
                        }
                        disabled={procesando}
                        title={f.nombre}
                        aria-pressed={activo}
                        className={`h-12 rounded-xl border-2 transition-all disabled:opacity-50 ${
                          activo
                            ? 'border-violet-500 bg-violet-950/40'
                            : 'border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03]"
                          style={{ background: f.css || 'transparent' }}
                        />
                        {activo && <Check size={12} className="text-violet-400" />}
                      </button>
                    );
                  })}
                </div>
                {canalActivo?.chatFondo?.url && (
                  <button
                    type="button"
                    onClick={() =>
                      ejecutar(
                        () =>
                          canalActivoId
                            ? actualizarCanal(club.id, canalActivoId, { chatFondo: null })
                            : Promise.resolve({ ok: false, error: 'Canal no disponible.' }),
                        'Fondo eliminado.',
                      )
                    }
                    disabled={procesando}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
                  >
                    Eliminar fondo
                  </button>
                )}
              </section>
            )}
          </div>
        )}

        {/* ── PANEL DE PREFERENCIAS PERSONALES ────────
            Se monta solo mientras está abierto, como los
            demás modales del club. */}
        {prefsOpen && (
          <ChatPrefsPanel
            chatId={club.chatId}
            uid={currentUser?.uid ?? ''}
            onClose={() => setPrefsOpen(false)}
          />
        )}
      </div>

      {/* ── CONFIRMACIONES ────────────────────────────── */}

      {confirmarEliminar && (
        <Confirmacion
          titulo="¿Eliminar el club?"
          texto="Se eliminará «{nombre}» y todos sus miembros perderán el acceso al chat. Esta acción no se puede deshacer."
          nombre={club.name}
          procesando={procesando}
          etiqueta="Eliminar club"
          onCancelar={() => setConfirmarEliminar(false)}
          onConfirmar={() =>
            void ejecutar(
              async () => {
                const r = await eliminar(club.id);
                if (r.ok) onClose();
                return r;
              },
              'Club eliminado.',
            )
          }
        />
      )}

      {confirmarSalir && (
        <Confirmacion
          titulo="¿Abandonar el club?"
          texto="Dejarás de ver los mensajes de «{nombre}». Podrás volver a entrar si el club lo permite."
          nombre={club.name}
          procesando={procesando}
          etiqueta="Abandonar"
          onCancelar={() => setConfirmarSalir(false)}
          onConfirmar={() =>
            void ejecutar(
              async () => {
                const r = await abandonar(club);
                if (r.ok) onClose();
                return r;
              },
              'Has abandonado el club.',
            )
          }
        />
      )}

      {expulsandoA && (
        <Confirmacion
          titulo="¿Expulsar a este miembro?"
          texto="Perderá el acceso al chat de «{nombre}» de inmediato, aunque tenga la pestaña abierta."
          nombre={club.name}
          procesando={procesando}
          etiqueta="Expulsar"
          onCancelar={() => setExpulsandoA(null)}
          onConfirmar={() =>
            void ejecutar(
              () => expulsar(club.id, expulsandoA.uid),
              'Miembro expulsado.',
              () => setExpulsandoA(null),
            )
          }
        />
      )}

      {transfiriendoA && (
        <Confirmacion
          titulo="¿Transferir la propiedad?"
          texto="Esa persona pasará a ser la propietaria de «{nombre}» y tú quedarás como moderador."
          nombre={club.name}
          procesando={procesando}
          etiqueta="Transferir"
          onCancelar={() => setTransfiriendoA(null)}
          onConfirmar={() =>
            void ejecutar(
              () => transferir(club.id, transfiriendoA.uid),
              'Propiedad transferida.',
              () => setTransfiriendoA(null),
            )
          }
        />
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// CONFIRMACIÓN
// ────────────────────────────────────────────────────────

const Confirmacion: React.FC<{
  titulo: string;
  texto: string;
  nombre: string;
  procesando: boolean;
  etiqueta: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}> = ({ titulo, texto, nombre, procesando, etiqueta, onCancelar, onConfirmar }) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <AlertCircle size={17} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white">{titulo}</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
            {texto.replace('{nombre}', nombre)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={procesando}
          className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={procesando}
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {procesando && <Loader2 size={12} className="animate-spin" />}
          <span>{etiqueta}</span>
        </button>
      </div>
    </div>
  </div>
);

/** Silencio por siete días, desde ahora. */
function silencioDe7Dias(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}
