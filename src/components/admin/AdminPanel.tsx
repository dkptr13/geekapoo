import { useState } from 'react';
import type { FC, ElementType } from 'react';
import {
  Shield,
  Image,
  Loader2,
  Users,
  BookOpen,
  Tv,
  ShieldCheck,
  ShieldX,
  Trash2,
  HardDrive,
  Settings2,
  Tag,
  Flame,
  LifeBuoy,
  Flag,
  Trophy,
  CalendarDays,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useQueryState } from '../../hooks/useQueryState';
import type { UploadProvider } from '../../services/imageUpload';

import { MigrationPanel } from './MigrationPanel';
import {
  AnimesSection,
  ThreadsSection,
  TriviaSection,
} from './CatalogSections';
import {
  CategoriesSection,
  SettingsSection,
  WorksSection,
} from './SiteSections';
import { SupportTicketsSection } from './SupportTicketsSection';
import { DailyTriviaSection } from './DailyTriviaSection';
import { ReportsSection } from './ReportsSection';
import { GamificationSection } from './GamificationSection';
import { useAdminCatalog, type AdminSection } from './useAdminCatalog';

import type { User } from '../../types';

// ======================================================
// SECCIONES
// ======================================================
//
// Ni "Episodios" ni "Personajes" son secciones aparte: cada
// anime lleva dentro los suyos, que es como se ven en la wiki.
// Editar un personaje desde una lista suelta no dice a qué
// serie pertenece, y se acababa mirando el animeId a mano.
//
// "Ajustes" y "Obras" controlan la web en sí, no el contenido:
// el logo, el texto de bienvenida y lo que se destaca cada semana.
// "Tickets" no edita nada: es la bandeja de soporte, y lo único
// que se toca ahí es el estado de cada ticket.

// La migración de datos NO es una sección: es un bloque que solo
// se pinta arriba del todo, y solo para el admin (ver más abajo).
// Un moderador no debe poder sembrar ni reescribir la base de
// datos: gestiona contenido, usuarios y tickets, nada más.

const SECTIONS: { id: AdminSection; label: string; icon: ElementType; color: string }[] = [
  { id: 'animes',      label: 'Animes',     icon: Tv,        color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { id: 'trivia',      label: 'Trivia',     icon: BookOpen,  color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  // La trivia diaria es OTRA cosa: se programa por fecha y lleva
  // sus propias respuestas correctas (que el navegador no puede
  // tocar). Va en pestaña aparte para que no se confunda con las
  // curiosidades de la wiki de arriba.
  { id: 'triviaDiaria', label: 'Trivia diaria', icon: CalendarDays, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { id: 'categories',  label: 'Categorías', icon: Tag,       color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'weeklyWorks', label: 'Obras',      icon: Flame,     color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { id: 'settings',    label: 'Ajustes',    icon: Settings2, color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
  { id: 'users',       label: 'Usuarios',   icon: Users,     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'threads',     label: 'Hilos',      icon: Image,     color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  { id: 'tickets',     label: 'Tickets',    icon: LifeBuoy,  color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  // Cola de denuncias de la comunidad. Va junto a los tickets
  // (que son "algo no funciona") porque son lo mismo de
  // distinto: "esto no debería estar aquí".
  { id: 'reportes',    label: 'Reportes',   icon: Flag,      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'gamificacion', label: 'Gamificación', icon: Trophy,   color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
];

const ROLES: User['role'][] = ['user', 'moderator', 'admin'];

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';

// ======================================================
// GESTIÓN DE ROLES Y BANOS
// ========================================================
//
// Dos niveles, y no es solo una diferencia de interfaz:
//
//   - El SELECTOR DE ROL solo existe para el admin. Un
//     moderador no puede tocar roles ni siquiera desde la
//     consola del navegador: en las reglas, /users solo
//     admite update si isAdmin().
//
//   - El BANEO se limita a gente que no es del equipo. Ni
//     un admin ni un moderador banearían a otro admin o
//     moderador, así que el botón aparece deshabilitado y
//     con la razón al lado, en vez de fallar en el
//     servidor con un error que no se entiende.
// ========================================================

interface UserRoleManagerProps {
  users: ReturnType<typeof useAdminCatalog>['users'];
  setUserRole: ReturnType<typeof useAdminCatalog>['setUserRole'];
  setUserBanned: ReturnType<typeof useAdminCatalog>['setUserBanned'];
  deleteUser: ReturnType<typeof useAdminCatalog>['deleteUser'];
}

const TEAM: User['role'][] = ['admin', 'moderator'];

const ROLE_LABELS: Record<User['role'], string> = {
  user: 'Usuario',
  moderator: 'Moderador',
  admin: 'Admin',
};

// Exportado para poder probarlo aislado: si no, cualquier test
// tiene que montar el panel entero, con su Router, sus hooks y
// sus ocho pestañas.
export const UserRoleManager: FC<UserRoleManagerProps> = ({
  users,
  setUserRole,
  setUserBanned,
  deleteUser,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  // Usuario que está a punto de borrarse, esperando la segunda
  // pulsación que confirma. Mientras sea null no hay nadie en
  // confirmation.
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);
  const [error, setError] = useState('');

  const run = async (uid: string, action: () => Promise<void>) => {
    setBusyId(uid);
    setError('');
    try {
      await action();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo aplicar el cambio.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-bold">Usuario</th>
              <th className="px-4 py-3 font-bold">Correo</th>
              <th className="px-4 py-3 font-bold">Rol</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {users.map((u) => {
              const isMe = u.uid === currentUser?.uid;
              const busy = busyId === u.uid;
              // Alguien del equipo no se puede banear entre sí:
              // un moderador se quitaría a sí mismo el acceso,
              // y un admin podría tumbar a otro admin.
              const isTeam = TEAM.includes(u.role ?? 'user');
              const canBan = !isMe && !isTeam;
              // Borrarte a ti mismo te dejaría fuera de tu propia
              // aplicación sin previo aviso. El resto sí se puede:
              // las reglas lo permiten a cualquier admin.
              const canDelete = !isMe;

              return (
                <tr key={u.id} className="bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatarUrl || PLACEHOLDER}
                        alt={u.username}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                      <span className="font-semibold text-white">@{u.username}</span>
                      {isMe && (
                        <span className="rounded border border-violet-400/20 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-violet-200">
                          TÚ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select
                        value={u.role ?? 'user'}
                        disabled={busy || isMe}
                        onChange={(e) =>
                          run(u.uid, () => setUserRole(u.uid, e.target.value as User['role']))
                        }
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-white focus:border-violet-400 focus:outline-none disabled:opacity-40"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          isTeam
                            ? 'border border-violet-400/20 bg-violet-500/15 text-violet-200'
                            : 'border border-white/[0.06] bg-white/[0.04] text-zinc-400'
                        }`}
                      >
                        {ROLE_LABELS[u.role ?? 'user']}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        u.isBanned
                          ? 'border border-red-400/20 bg-red-500/15 text-red-300'
                          : 'border border-emerald-400/20 bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {u.isBanned ? 'Baneado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy || !canBan}
                      title={
                        isMe
                          ? 'No puedes banearte'
                          : isTeam
                            ? 'Los admins y moderadores no se pueden banear entre sí'
                            : undefined
                      }
                      onClick={() => run(u.uid, () => setUserBanned(u.uid, !u.isBanned))}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        u.isBanned
                          ? 'border border-emerald-400/20 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/15'
                      }`}
                    >
                      {busy ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : u.isBanned ? (
                        <ShieldCheck size={12} />
                      ) : (
                        <ShieldX size={12} />
                      )}
                        {u.isBanned ? 'Desbanear' : 'Banear'}
                      </button>

                      {/* Borrar es irreversible, así que pide una
                          segunda pulsación en el mismo botón antes de
                          hacer nada. Un descuido de un clic no
                          debería dejar a alguien sin cuenta. */}
                      {confirmarBorrado === u.uid ? (
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setConfirmarBorrado(null);
                              run(u.uid, () => deleteUser(u.uid));
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                          >
                            {busy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            {busy ? 'Borrando...' : 'Sí, borrar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmarBorrado(null)}
                            className="rounded-xl bg-white/[0.04] px-2 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy || !canDelete}
                          onClick={() => setConfirmarBorrado(u.uid)}
                          title={
                            isMe
                              ? 'No puedes borrarte a ti mismo'
                              : 'Borra su perfil de la aplicación'
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-600">
        {isAdmin
          ? 'No puedes cambiar tu propio rol ni banearte: las reglas de seguridad lo bloquean en el servidor, y el botón aparece deshabilitado para no intentarlo. Los admins y moderadores tampoco se pueden banear entre sí.'
          : 'Como moderador no puedes cambiar roles: eso es solo del admin. Sí puedes banear usuarios normales, pero no a otros admins ni moderadores.'}
      </p>

      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-amber-300/90">
          <strong>"Eliminar" borra el perfil de la aplicación</strong> (nombre, avatar, chatId y
          rol), no la cuenta de acceso. La cuenta sigue existiendo en Firebase Auth: si esa
          persona vuelve a entrar con el mismo correo, la app le crea un perfil nuevo y entra
          con normalidad.
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-300/70">
          Si lo que quieres es que no pueda volver, banealo en vez de borrarlo (o haz las dos
          cosas). Borrar la cuenta de verdad hay que hacerlo en la consola de Firebase:
          Authentication → Users.
        </p>
      </div>
    </div>
  );
};

// ======================================================
// PANEL
// ======================================================

export function AdminPanel() {
  const catalog = useAdminCatalog();
  const { isAdmin } = useAuth();

  // La pestaña abierta del panel también vive en la URL, así que
  // recargar no devuelve a Animes cuando lo que se estaba
  // revisando eran los tickets. Si alguien escribe "?seccion=xyz"
  // a mano, cae en Animes en vez de romperse: el valor de la URL
  // no está garantizado.
  const [sectionParam, setSectionParam] = useQueryState('seccion', 'animes');
  const activeSection: AdminSection = SECTIONS.some((s) => s.id === sectionParam)
    ? (sectionParam as AdminSection)
    : 'animes';
  const setActiveSection = (id: AdminSection) => setSectionParam(id);
  const [provider, setProvider] = useState<UploadProvider>('storage');

  const current = SECTIONS.find((s) => s.id === activeSection)!;
  const CurrentIcon = current.icon;

  // Crece con la ventana: las tablas de usuarios y el editor
  // de animes aprovechan mucho más en pantallas grandes que
  // con el ancho fijo de antes.
  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-7xl space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-600/25 to-sky-500/15 shadow-inner">
          <Shield className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAdmin ? 'Panel de Administración' : 'Panel de Moderación'}
          </h1>
          <p className="text-sm text-zinc-400">
            {isAdmin
              ? 'Animes, episodios, personajes, usuarios y migración de datos'
              : 'Contenido, usuarios, hilos y tickets de soporte'}
          </p>
        </div>
      </div>

      {/* ERROR */}
      {catalog.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
          {catalog.error}
        </div>
      )}

      {/* MIGRACIÓN
          Solo para el admin. Es la única parte del panel con
          poder de reescribir la base de datos entera, así que
          ni se monta para un moderador. Que el botón no exista
          es más claro que dejar un control deshabilitado sin
          explicación, y las reglas ya lo impiden igual. */}
      {isAdmin && <MigrationPanel />}

      {/* PROVEEDOR DE IMÁGENES */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-zinc-400" />
            <h2 className="text-sm font-bold text-white">Dónde se guardan las imágenes</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setProvider('storage')}
              className={`chat-boton rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                provider === 'storage'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/40'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Firebase Storage
            </button>
            <button
              type="button"
              onClick={() => setProvider('imgbb')}
              className={`chat-boton rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                provider === 'imgbb'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/40'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100'
              }`}
            >
              ImgBB
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          {provider === 'storage'
            ? 'Recomendado. Las imágenes se guardan en tu proyecto y no hay ninguna clave secreta expuesta en el navegador.'
            : 'Atención: la clave de ImgBB está dentro del bundle de JavaScript, cualquiera que abra las herramientas de desarrollo puede leerla.'}
        </p>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {SECTIONS.map(({ id, label, icon: Icon, color }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                isActive
                    ? 'border-violet-400/25 bg-violet-500/15 text-violet-200 shadow-sm'
                    : 'border-white/[0.06] bg-white/[0.03] text-zinc-500 hover:border-white/[0.1] hover:text-zinc-200'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
              <span className="text-[10px] opacity-60">{catalog.counts[id]}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO */}
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2">
          <CurrentIcon size={18} className="text-zinc-400" />
          <h2 className="text-base font-bold text-white">{current.label}</h2>
          {/* El contador solo tiene sentido en las secciones que son
              una colección de documentos. "users" y "tickets"
              cuentan otra cosa, y "gamificacion" no es una
              colección: `catalog.counts` no tiene esa clave y
              saldría "undefined elementos". */}
          {activeSection !== 'users' &&
            activeSection !== 'tickets' &&
            activeSection !== 'gamificacion' && (
              <span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400">
                {catalog.counts[activeSection]} elementos
              </span>
            )}
        </div>

        {catalog.loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Cargando desde Firestore...</span>
          </div>
        ) : activeSection === 'users' ? (
          <UserRoleManager
            users={catalog.users}
            setUserRole={catalog.setUserRole}
            setUserBanned={catalog.setUserBanned}
            deleteUser={catalog.deleteUser}
          />
        ) : activeSection === 'animes' ? (
          <AnimesSection
            animes={catalog.animes}
            seasons={catalog.seasons}
            episodes={catalog.episodes}
            characters={catalog.characters}
            categories={catalog.categories}
            provider={provider}
          />
        ) : activeSection === 'trivia' ? (
          <TriviaSection trivia={catalog.trivia} provider={provider} />
        ) : activeSection === 'triviaDiaria' ? (
          <DailyTriviaSection />
        ) : activeSection === 'categories' ? (
          <CategoriesSection />
        ) : activeSection === 'weeklyWorks' ? (
          <WorksSection provider={provider} />
        ) : activeSection === 'settings' ? (
          <SettingsSection provider={provider} />
        ) : activeSection === 'threads' ? (
          <ThreadsSection threads={catalog.threads} />
        ) : activeSection === 'tickets' ? (
          <SupportTicketsSection
            tickets={catalog.tickets}
            setTicketStatus={catalog.setTicketStatus}
          />
        ) : activeSection === 'reportes' ? (
          <ReportsSection />
        ) : activeSection === 'gamificacion' ? (
          <GamificationSection />
        ) : (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-8 text-center text-zinc-500">
            Sección no disponible.
          </p>
        )}
      </div>
    </div>
  );
}
