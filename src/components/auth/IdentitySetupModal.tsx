import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  DISPLAY_NAME_MAX,
  errorDisplayName,
  errorUsername,
  normalizarDisplayName,
  normalizarUsername,
} from '../../data/usernames';
import {
  comprobarUsername,
  type ResultadoDisponibilidad,
} from '../../services/identity';

/**
 * Completar identidad de una cuenta de Auth sin perfil.
 *
 * Pasa la primera vez que se entra con GitHub o Google, y también si
 * el perfil se borró. No se crea nada automáticamente: la persona
 * elige su @usuario permanente y su nombre visible.
 */
export const IdentitySetupModal: React.FC = () => {
  const { identitySetup, completeIdentity, cancelIdentitySetup } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [estado, setEstado] = useState<ResultadoDisponibilidad | null>(null);
  const [comprobando, setComprobando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!identitySetup) return;
    setUsername(identitySetup.suggestedUsername);
    setDisplayName(identitySetup.suggestedDisplayName);
    setDisplayNameTouched(false);
    setEstado(null);
    setError('');
  }, [identitySetup]);

  useEffect(() => {
    if (!identitySetup) return;
    if (!displayNameTouched && !identitySetup.usernameFijo) {
      setDisplayName(username);
    }
  }, [username, displayNameTouched, identitySetup]);

  useEffect(() => {
    if (!identitySetup) return;

    if (identitySetup.usernameFijo) {
      setEstado({
        estado: 'disponible',
        mensaje: 'Es tu identificador permanente y sigue reservado a tu cuenta.',
        username: normalizarUsername(identitySetup.suggestedUsername),
      });
      setComprobando(false);
      return;
    }

    const limpio = normalizarUsername(username);
    if (!limpio) {
      setEstado({ estado: 'vacio', mensaje: 'Introduce un nombre de usuario.', username: '' });
      setComprobando(false);
      return;
    }

    const local = errorUsername(limpio);
    if (local) {
      setEstado({ estado: 'invalido', mensaje: local, username: limpio });
      setComprobando(false);
      return;
    }

    setComprobando(true);
    let activo = true;
    const temporizador = window.setTimeout(() => {
      void comprobarUsername(limpio)
        .then((resultado) => {
          if (activo) setEstado(resultado);
        })
        .finally(() => {
          if (activo) setComprobando(false);
        });
    }, 450);

    return () => {
      activo = false;
      window.clearTimeout(temporizador);
    };
  }, [username, identitySetup]);

  if (!identitySetup) return null;

  const nombreVisible = normalizarDisplayName(displayName);
  const usernameLimpio = normalizarUsername(
    identitySetup.usernameFijo
      ? identitySetup.suggestedUsername
      : username,
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errorNombre = errorUsername(usernameLimpio);
    if (errorNombre) {
      setError(errorNombre);
      return;
    }
    const errorVisible = errorDisplayName(nombreVisible);
    if (errorVisible) {
      setError(errorVisible);
      return;
    }
    if (estado?.estado !== 'disponible') {
      setError('Comprueba que el nombre de usuario esté disponible.');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await completeIdentity(usernameLimpio, nombreVisible);
      if (!resultado.ok) {
        setError(resultado.error ?? 'No se pudo completar la identidad.');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-500/30 bg-zinc-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => void cancelIdentitySetup()}
          className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white"
          aria-label="Cancelar y cerrar sesión"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={identitySetup.avatarUrl}
            alt=""
            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-violet-500/40"
          />
          <div className="min-w-0">
            <h2 className="text-base font-black text-white">
              Completa tu identidad
            </h2>
            <p className="truncate text-[11px] text-zinc-500">
              {identitySetup.email || 'Cuenta de GitHub/Google'}
            </p>
          </div>
        </div>

        <p className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-[11px] leading-relaxed text-violet-200">
          {identitySetup.usernameFijo
            ? 'Tu perfil se borró, pero tu @usuario permanente sigue siendo tuyo. Solo tienes que elegir el nombre visible.'
            : 'Tu cuenta todavía no tiene perfil en Geekapoo. Elige un nombre de usuario permanente y el nombre que verá la comunidad.'}
        </p>

        <form onSubmit={enviar} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">
              Nombre de usuario único
            </label>
            <div className="relative">
              <AtSign
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  if (identitySetup.usernameFijo) return;
                  setUsername(e.target.value);
                  setEstado(null);
                }}
                placeholder="kapo_25"
                autoComplete="username"
                maxLength={20}
                readOnly={identitySetup.usernameFijo}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-10 text-base text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 read-only:cursor-not-allowed read-only:opacity-70 sm:text-xs"
                required
              />
              {comprobando && (
                <Loader2
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-violet-400"
                />
              )}
            </div>

            <p
              className={`mt-1 flex items-center gap-1 text-[11px] ${
                comprobando
                  ? 'text-zinc-400'
                  : estado?.estado === 'disponible'
                    ? 'text-emerald-400'
                    : estado?.estado === 'ocupado' ||
                        estado?.estado === 'invalido' ||
                        estado?.estado === 'reservado'
                      ? 'text-red-400'
                      : 'text-zinc-500'
              }`}
            >
              {comprobando ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  Comprobando disponibilidad...
                </>
              ) : estado?.estado === 'disponible' ? (
                <>
                  <CheckCircle2 size={11} />
                  {estado.mensaje}
                </>
              ) : estado?.estado === 'ocupado' ||
                estado?.estado === 'invalido' ||
                estado?.estado === 'reservado' ? (
                <>
                  <AlertCircle size={11} />
                  {estado.mensaje}
                </>
              ) : (
                estado?.mensaje || 'Introduce un nombre de usuario.'
              )}
            </p>

            <p className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-amber-200">
              Será permanente y no podrás cambiarlo. Aparecerá como{' '}
              <strong>@{usernameLimpio || 'usuario'}</strong>.
            </p>
            {identitySetup.usernameFijo && (
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                Este identificador se conserva de tu cuenta anterior; no se
                puede elegir otro.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">
              Nombre visible
            </label>
            <div className="relative">
              <Sparkles
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayNameTouched(true);
                  setDisplayName(e.target.value);
                }}
                placeholder="Kapo"
                maxLength={DISPLAY_NAME_MAX}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 sm:text-xs"
                required
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Puede repetirse con otras personas y podrás cambiarlo desde tus
              ajustes.
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => void cancelIdentitySetup()}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
            >
              Cancelar y cerrar sesión
            </button>
            <button
              type="submit"
              disabled={
                guardando ||
                comprobando ||
                estado?.estado !== 'disponible'
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {guardando ? 'Guardando...' : 'Entrar en Geekapoo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
