import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  UserCog,
  Trash2,
  Save,
  KeyRound,
  Mail,
  LogOut,
  AlertTriangle,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

import {
  DEFAULT_PRIVACY,
  hasPassword,
  loginMethodOf,
  readPrivacy,
  acceptsChatRequests,
  changeAccountEmail,
  changeAccountPassword,
  sendPasswordResetTo,
  previewOwnData,
  deleteOwnAccount,
  type DeletePreview,
} from '../../services/accountSettings';

import type { PrivacySettings } from '../../types';

// ======================================================
// CONFIGURACIÓN DE LA CUENTA
//
// Tres apartados, como los de cualquier web:
//
//   Privacidad        → quién puede encontrarte y hablar contigo
//   Gestión de cuenta → correo, contraseña y sesión
//   Eliminar cuenta   → la zona roja, con su contraseña
//
// Vive en su pestaña propia (`?tab=ajustes`) y no al final del
// perfil: es de la cuenta, no del perfil público. Todo lo que
// hay aquí es de la cuenta propia: el admin puede banear a
// alguien, pero no puede cambiarle el correo ni borrarle la
// cuenta, y al revés: el usuario no se borra a sí mismo desde un
// comando de la consola, sino desde aquí, con confirmación y
// escribiendo su contraseña.
// ======================================================

type Tab = 'privacidad' | 'cuenta' | 'eliminar';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'privacidad', label: 'Privacidad', icon: Shield },
  { id: 'cuenta', label: 'Gestión de cuenta', icon: UserCog },
  { id: 'eliminar', label: 'Eliminar cuenta', icon: Trash2 },
];

/** Interruptor de la sección de privacidad. */
const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, hint, disabled }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-zinc-200">{label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{hint}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        checked ? 'bg-violet-600' : 'bg-zinc-800'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);

const inputClass =
  'w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none';

const labelClass = 'mb-1 block text-xs font-medium text-zinc-300';

export const AccountSettings: React.FC = () => {
  const { currentUser, updateProfileData, logout } = useAuth();

  const [tab, setTab] = useState<Tab>('privacidad');

  // ── Privacidad ──────────────────────────────────────
  // Empieza con los valores por defecto; el efecto de abajo los
  // sustituye por los guardados (o los deja si la cuenta no tiene).
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => ({ ...DEFAULT_PRIVACY }));
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // ── Gestión de cuenta ────────────────────────────────
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Eliminar cuenta ──────────────────────────────────
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteStep, setDeleteStep] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // El usuario puede venir ya con ajustes (los guardados en otra
  // sesión) o sin ellos (una cuenta anterior a este apartado).
  useEffect(() => {
    if (!currentUser) return;
    setPrivacy(readPrivacy(currentUser));
  }, [currentUser]);

  // Con qué método se entró. Se lee en cada render porque
  // auth.currentUser cambia al reautenticar y no hay estado que
  // sincronizar: es un dato de solo lectura.
  const method = loginMethodOf(auth.currentUser);
  const passwordAccount = hasPassword(auth.currentUser);

  // ── Privacidad ──────────────────────────────────────
  const handleSavePrivacy = async () => {
    setPrivacyBusy(true);
    setPrivacyError(null);
    setPrivacySaved(false);
    try {
      // Los tres campos van sueltos en el documento del usuario, no
      // dentro de un mapa: es lo que leen las reglas de seguridad al
      // decidir si se acepta una solicitud de conversación.
      await updateProfileData({
        profileVisibility: privacy.profileVisibility,
        allowChatRequests: privacy.allowChatRequests,
        showActivity: privacy.showActivity,
      });
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2500);
    } catch (e: unknown) {
      console.error('[Cuenta] No se pudieron guardar los ajustes de privacidad:', e);
      setPrivacyError('No se pudieron guardar los ajustes. Prueba otra vez.');
    } finally {
      setPrivacyBusy(false);
    }
  };

  // ── Gestión de cuenta ────────────────────────────────
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    setEmailBusy(true);
    setEmailMsg(null);
    const result = await changeAccountEmail(fbUser, newEmail, emailPassword);
    if (result.ok) {
      setEmailMsg({
        ok: true,
        text:
          'Correo cambiado. Te hemos enviado un correo de verificación al nuevo ' +
          'dirección: ábrelo para que la cuenta siga activa.',
      });
      setNewEmail('');
    } else {
      setEmailMsg({ ok: false, text: result.error ?? 'No se pudo cambiar el correo.' });
    }
    setEmailPassword('');
    setEmailBusy(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    setPassBusy(true);
    setPassMsg(null);
    const result = await changeAccountPassword(fbUser, currentPassword, newPassword);
    if (result.ok) {
      setPassMsg({ ok: true, text: 'Contraseña cambiada.' });
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setPassMsg({ ok: false, text: result.error ?? 'No se pudo cambiar la contraseña.' });
    }
    setPassBusy(false);
  };

  const handleSendReset = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;

    setResetBusy(true);
    setResetMsg(null);
    const result = await sendPasswordResetTo(email);
    setResetMsg(
      result.ok
        ? { ok: true, text: `Te hemos enviado el correo a ${email}. Revisa también la carpeta de spam.` }
        : { ok: false, text: result.error ?? 'No se pudo enviar el correo.' },
    );
    setResetBusy(false);
  };

  // ── Eliminar cuenta ──────────────────────────────────
  //
  // El recuento se pide al entrar en el apartado, no al
  // montarlo: es una consulta más que no hace falta si el
  // usuario nunca llega a esta pantalla.
  useEffect(() => {
    if (tab !== 'eliminar' || preview || previewBusy || !currentUser) return;

    let alive = true;
    setPreviewBusy(true);
    previewOwnData(currentUser.uid)
      .then((data) => {
        if (alive) setPreview(data);
      })
      .catch((e: unknown) => {
        console.error('[Cuenta] No se pudo calcular lo que se va a borrar:', e);
        if (alive) {
          setPreview({
            threads: 0,
            comments: 0,
            requests: 0,
            blocked: 0,
            following: 0,
            followers: 0,
            chats: 0,
            groups: 0,
          });
        }
      })
      .finally(() => {
        if (alive) setPreviewBusy(false);
      });

    return () => {
      alive = false;
    };
  }, [tab, preview, previewBusy, currentUser]);

  const CONFIRMAR = 'ELIMINAR';

  // Con cuenta de Google o GitHub no hay contraseña que escribir:
  // basta con la frase de confirmación, y la identidad se
  // comprueba en la ventana del proveedor.
  const canDelete =
    !deleteBusy &&
    confirmText.trim().toUpperCase() === CONFIRMAR &&
    (passwordAccount || deletePassword.length > 0);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const fbUser = auth.currentUser;
    if (!fbUser || !canDelete) return;

    setDeleteBusy(true);
    setDeleteMsg(null);
    setDeleteStep('Preparando...');

    const result = await deleteOwnAccount(fbUser, deletePassword, (mensaje) =>
      setDeleteStep(mensaje),
    );

    if (result.ok) {
      setDeleteStep(null);
      setDeleteMsg({
        ok: true,
        text: 'Cuenta eliminada. Ya has salido de la web, así que no queda nada que cerrar.',
      });
      setDeleteBusy(false);
      return;
    }

    setDeleteStep(null);
    setDeleteMsg({ ok: false, text: result.error ?? 'No se pudo eliminar la cuenta.' });
    setDeleteBusy(false);
  };

  if (!currentUser) return null;

  // ── Aviso de que la cuenta tiene un perfil "oculto" ──
  const hiddenFromRequests = !acceptsChatRequests(privacy);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 p-6 sm:px-8">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Settings size={18} className="text-violet-400" />
          <span>Configuración de la cuenta</span>
        </h3>

        {tab !== 'privacidad' && (
          <button
            type="button"
            onClick={() => setTab('privacidad')}
            className="text-xs font-semibold text-violet-400 transition-colors hover:text-violet-300"
          >
            Volver a privacidad
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div role="tablist" className="flex flex-wrap gap-1.5 border-b border-zinc-800/80 p-4 sm:px-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
              tab === id
                ? id === 'eliminar'
                  ? 'bg-red-600 text-white'
                  : 'bg-violet-600 text-white'
                : 'border border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        {/* ══════════════════════════════════════════════
            PRIVACIDAD
        ══════════════════════════════════════════════ */}
        {tab === 'privacidad' && (
          <div className="space-y-5">
            <p className="text-xs leading-relaxed text-zinc-400">
              Estos ajustes solo te afectan a ti. Se guardan en tu cuenta y se aplican al
              instante, también si entras desde otro dispositivo.
            </p>

            {/* Visibilidad del perfil */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="text-xs font-semibold text-zinc-200">Visibilidad del perfil</p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                Decide si la gente te puede encontrar y pedir conversación. Las conversaciones
                que ya tienes siguen funcionando igual.
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    {
                      value: 'public',
                      label: 'Público',
                      icon: Eye,
                      hint: 'Cualquiera con tu ID puede verte y pedirte conversación.',
                    },
                    {
                      value: 'private',
                      label: 'Privado',
                      icon: EyeOff,
                      hint: 'Nadie puede abrir una conversación nueva contigo.',
                    },
                  ] as const
                ).map(({ value, label, icon: Icon, hint }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setPrivacy((p) => ({
                        ...p,
                        profileVisibility: value,
                        // Poner el perfil en privado cierra la puerta a las
                        // solicitudes, así que el interruptor de abajo
                        // también tiene que reflejarlo o mentiría.
                        allowChatRequests: value === 'public' ? p.allowChatRequests : false,
                      }))
                    }
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                      privacy.profileVisibility === value
                        ? 'border-violet-500 bg-violet-600/10'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <Icon
                      size={15}
                      className={
                        privacy.profileVisibility === value ? 'mt-0.5 text-violet-400' : 'mt-0.5 text-zinc-500'
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-zinc-100">{label}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              label="Recibir solicitudes de conversación"
              hint="Si lo apagas, nadie puede pedirte hablar. Es lo que hace el apartado de abajo por ti si eliges dejar el perfil en privado."
              checked={privacy.allowChatRequests}
              disabled={privacy.profileVisibility === 'private'}
              onChange={(next) => setPrivacy((p) => ({ ...p, allowChatRequests: next }))}
            />

            <Toggle
              label="Mostrar mi actividad"
              hint="Si lo apagas, en tu perfil no se listan los hilos que has publicado ni tus comentarios."
              checked={privacy.showActivity}
              onChange={(next) => setPrivacy((p) => ({ ...p, showActivity: next }))}
            />

            {hiddenFromRequests && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[11px] text-amber-200">
                Ahora mismo no aceptas solicitudes de conversación: nadie puede abrir un chat
                nuevo contigo.
              </p>
            )}

            {privacyError && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[11px] text-red-300">
                {privacyError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              {privacySaved && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <Check size={14} /> ¡Ajustes guardados!
                </span>
              )}
              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={privacyBusy}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 disabled:opacity-50"
              >
                {privacyBusy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>Guardar privacidad</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            GESTIÓN DE CUENTA
        ══════════════════════════════════════════════ */}
        {tab === 'cuenta' && (
          <div className="space-y-6">
            {/* Con qué cuenta se entra */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Método de acceso</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {method === 'password'
                    ? 'Correo electrónico y contraseña.'
                    : method === 'google'
                      ? 'Cuenta de Google. La contraseña y el correo los gestiona Google.'
                      : method === 'github'
                        ? 'Cuenta de GitHub. La contraseña y el correo los gestiona GitHub.'
                        : 'Este método no se reconoce.'}
                </p>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-600/15 px-3 py-1 text-[11px] font-bold text-violet-300">
                {method}
              </span>
            </div>

            {/* Correo */}
            <form onSubmit={handleChangeEmail} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <Mail size={14} className="text-violet-400" />
                <span>Correo electrónico</span>
              </p>

              <p className="text-[11px] text-zinc-500">
                Ahora mismo: <span className="font-mono text-zinc-300">{currentUser.email || 'sin correo'}</span>
              </p>

              {passwordAccount ? (
                <>
                  <div>
                    <label className={labelClass} htmlFor="nuevo-correo">
                      Nuevo correo
                    </label>
                    <input
                      id="nuevo-correo"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="correo-contrasena">
                      Tu contraseña actual
                    </label>
                    <input
                      id="correo-contrasena"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      required
                    />
                  </div>

                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Al cambiarlo te mandamos un correo de verificación a la nueva dirección. Hasta
                    que lo abras, la cuenta queda sin verificar y no podrás entrar.
                  </p>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={emailBusy}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
                    >
                      {emailBusy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                      <span>Cambiar correo</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Este correo lo gestiona {method === 'google' ? 'Google' : 'GitHub'}. Para cambiarlo
                  entra en los ajustes de tu cuenta de {method === 'google' ? 'Google' : 'GitHub'} y
                  vuelve aquí: la web lo leerá al entrar la próxima vez.
                </p>
              )}

              {emailMsg && (
                <p
                  className={`rounded-xl border px-3.5 py-2.5 text-[11px] ${
                    emailMsg.ok
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {emailMsg.text}
                </p>
              )}
            </form>

            {/* Contraseña */}
            <form onSubmit={handleChangePassword} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <KeyRound size={14} className="text-violet-400" />
                <span>Contraseña</span>
              </p>

              {passwordAccount ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="clave-actual">
                        Contraseña actual
                      </label>
                      <input
                        id="clave-actual"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="clave-nueva">
                        Nueva contraseña
                      </label>
                      <input
                        id="clave-nueva"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={passBusy}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
                    >
                      {passBusy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                      <span>Cambiar contraseña</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Tu cuenta no tiene contraseña propia: se entra con {method === 'google' ? 'Google' : 'GitHub'}.
                  Puedes establecer una con el botón de abajo, y a partir de ahí podrás entrar
                  también con correo.
                </p>
              )}

              {/* Recuperación: funciona con todos los métodos */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
                <p className="text-[11px] text-zinc-500">
                  ¿No te acuerdas? Te enviamos un correo para elegir una nueva.
                </p>
                <button
                  type="button"
                  onClick={handleSendReset}
                  disabled={resetBusy || !currentUser.email}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white disabled:opacity-50"
                >
                  {resetBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                  Enviar correo de recuperación
                </button>
              </div>

              {passMsg && (
                <p
                  className={`rounded-xl border px-3.5 py-2.5 text-[11px] ${
                    passMsg.ok
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {passMsg.text}
                </p>
              )}

              {resetMsg && (
                <p
                  className={`rounded-xl border px-3.5 py-2.5 text-[11px] ${
                    resetMsg.ok
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {resetMsg.text}
                </p>
              )}
            </form>

            {/* Sesión */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div>
                <p className="text-xs font-semibold text-zinc-200">Sesión</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Cierra la sesión en este dispositivo. Tus ajustes y tu contenido se quedan guardados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ELIMINAR CUENTA
        ══════════════════════════════════════════════ */}
        {tab === 'eliminar' && (
          <form onSubmit={handleDelete} className="space-y-5">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-red-300">
                <AlertTriangle size={15} />
                <span>Esto no se puede deshacer</span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                Al eliminar la cuenta desaparecen tu perfil y tu acceso a la web. Lo que escribiste
                en el foro también se borra: hilos y comentarios tuyos, tus solicitudes de
                conversación y tu lista de bloqueados. No hay forma de recuperarlo.
              </p>

              {/* Lo que se va a borrar, contado */}
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Se va a eliminar
                </p>

                {previewBusy ? (
                  <p className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                    <Loader2 size={12} className="animate-spin" />
                    Contando...
                  </p>
                ) : (
                  <ul className="mt-2 grid gap-x-4 gap-y-1 text-[11px] text-zinc-400 sm:grid-cols-2">
                    {[
                      ['Hilos publicados', preview?.threads ?? 0],
                      ['Comentarios', preview?.comments ?? 0],
                      ['Solicitudes de chat', preview?.requests ?? 0],
                      ['Personas bloqueadas', preview?.blocked ?? 0],
                      // Los seguimientos se cuentan aparte y con su
                      // propia línea porque el borrado tiene un
                      // efecto que va MÁS ALLÁ de esta cuenta: se
                      // borran también los documentos que esta
                      // persona dejó en la carpeta de quienes
                      // seguía. Sin eso, esa gente la seguiría
                      // viendo en su contador sin poder quitarla.
                      ['Personas a las que sigue', preview?.following ?? 0],
                      ['Personas que le siguen', preview?.followers ?? 0],
                      ['Conversaciones privadas', preview?.chats ?? 0],
                      ['Grupos creados', preview?.groups ?? 0],
                    ].map(([label, value]) => (
                      <li key={String(label)} className="flex items-center justify-between gap-2">
                        <span>{label}</span>
                        <span className="font-mono font-bold text-zinc-200">{value}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-3 border-t border-zinc-800/80 pt-2 text-[11px] leading-relaxed text-zinc-500">
                  Lo que escribieron OTRAS personas (comentarios en tus hilos, mensajes en
                  conversaciones compartidas) se queda: es contenido suyo, y borrarlo desde aquí
                  sería quitarles su conversación de la nada.
                </p>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="confirmar-borrado">
                Escribe <span className="font-mono font-bold text-red-300">{CONFIRMAR}</span> para
                confirmar
              </label>
              <input
                id="confirmar-borrado"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRMAR}
                autoComplete="off"
                className={inputClass}
              />
            </div>

            {/* La confirmación de identidad depende del método de acceso:
                una cuenta con contraseña escribe la suya, y una de Google
                o GitHub confirma en la ventana del proveedor, que es donde
                se comprueba de verdad. */}
            {passwordAccount ? (
              <div>
                <label className={labelClass} htmlFor="borrado-contrasena">
                  Tu contraseña
                </label>
                <input
                  id="borrado-contrasena"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-[11px] leading-relaxed text-zinc-400">
                Al continuar se abrirá la ventana de {method === 'google' ? 'Google' : 'GitHub'} para
                confirmar que eres tú. Sin ese paso no se borra nada, porque la cuenta no tiene
                contraseña que pedir.
              </p>
            )}

            <p className="text-[11px] leading-relaxed text-zinc-500">
              {passwordAccount
                ? 'Se pide a propósito: es lo único que impide que alguien que se siente un momento en tu navegador te borre la cuenta.'
                : 'Por el mismo motivo que con la contraseña, aquí hace falta confirmar la identidad.'}
            </p>

            {deleteStep && (
              <p className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-[11px] text-zinc-300">
                <Loader2 size={13} className="animate-spin" />
                {deleteStep}
              </p>
            )}

            {deleteMsg && (
              <p
                className={`rounded-xl border px-3.5 py-2.5 text-[11px] ${
                  deleteMsg.ok
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {deleteMsg.text}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canDelete}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-900/40 transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteBusy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>Eliminar mi cuenta definitivamente</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
