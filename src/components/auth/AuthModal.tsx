// src/components/auth/AuthModal.tsx
import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  Github,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AtSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { comprobarUsername, type ResultadoDisponibilidad } from '../../services/identity';
import {
  DISPLAY_NAME_MAX,
  errorDisplayName,
  errorUsername,
  normalizarDisplayName,
  normalizarUsername,
} from '../../data/usernames';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authMode,
    returnToAction,
    closeAuth,
    login,
    loginWithGithub,
    loginWithGoogle,
    register,
    sendPasswordReset,
    openAuth,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [usernameState, setUsernameState] =
    useState<ResultadoDisponibilidad | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  // El nombre visible se rellena con el identificador mientras la
  // persona no lo haya tocado. En cuanto lo edita, manda su texto.
  useEffect(() => {
    if (!displayNameTouched) {
      setDisplayName(username);
    }
  }, [username, displayNameTouched]);

  // Comprobación con debounce: 450 ms después de dejar de escribir.
  // La disponibilidad NO reserva; el backend vuelve a comprobarlo.
  useEffect(() => {
    if (!authModalOpen || authMode !== 'register') return;

    const limpio = normalizarUsername(username);
    if (!limpio) {
      setUsernameState({
        estado: 'vacio',
        mensaje: 'Introduce un nombre de usuario.',
        username: '',
      });
      setCheckingUsername(false);
      return;
    }

    const local = errorUsername(limpio);
    if (local) {
      setUsernameState({
        estado: 'invalido',
        mensaje: local,
        username: limpio,
      });
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    let activo = true;
    const temporizador = window.setTimeout(() => {
      void comprobarUsername(limpio)
        .then((resultado) => {
          if (activo) setUsernameState(resultado);
        })
        .finally(() => {
          if (activo) setCheckingUsername(false);
        });
    }, 450);

    return () => {
      activo = false;
      window.clearTimeout(temporizador);
    };
  }, [username, authMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setFeedback({
        type: 'error',
        message: 'Por favor, rellena todos los campos.'
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await login(email, password);

    setLoading(false);

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message:
          result.error ||
          'Error al iniciar sesión. Revisa tus credenciales.'
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameLimpio = normalizarUsername(username);
    const displayNameLimpio = normalizarDisplayName(displayName);

    if (!email || !password || !usernameLimpio || !displayNameLimpio) {
      setFeedback({
        type: 'error',
        message: 'Completa todos los campos para crear tu cuenta.'
      });
      return;
    }

    const errorNombre = errorUsername(usernameLimpio);
    if (errorNombre) {
      setFeedback({ type: 'error', message: errorNombre });
      return;
    }

    const errorVisible = errorDisplayName(displayNameLimpio);
    if (errorVisible) {
      setFeedback({ type: 'error', message: errorVisible });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        type: 'error',
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Las dos contraseñas no coinciden.'
      });
      return;
    }

    if (usernameState?.estado !== 'disponible') {
      setFeedback({
        type: 'error',
        message:
          usernameState?.mensaje ||
          'Comprueba que el nombre de usuario esté disponible antes de continuar.'
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await register(
      email,
      password,
      usernameLimpio,
      displayNameLimpio
    );

    setLoading(false);

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message: result.error || 'Error durante el registro.'
      });
      return;
    }

    setFeedback({
      type: 'success',
      message:
        '¡Cuenta creada! Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada o Spam y luego inicia sesión.'
    });
    openAuth('login');
  };

  const handleSendResetEmail = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!email) {
      setFeedback({
        type: 'error',
        message:
          'Introduce tu correo para enviarte el enlace de recuperación.'
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await sendPasswordReset(email);

    setLoading(false);

    if (result.ok) {
      setFeedback({
        type: 'success',
        message:
          'Te hemos enviado un enlace seguro a tu correo electrónico para restablecer la contraseña.'
      });
    } else {
      setFeedback({
        type: 'error',
        message:
          result.error ||
          'No se pudo enviar el correo de recuperación.'
      });
    }
  };

  const handleGithub = async () => {
    setLoading(true);
    setFeedback(null);

    const result = await loginWithGithub();

    setLoading(false);

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message:
          result.error ||
          'Error al iniciar sesión con GitHub.'
      });
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setFeedback(null);

    const result = await loginWithGoogle();

    setLoading(false);

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message:
          result.error ||
          'Error al iniciar sesión con Google.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">

      {/* Glow Background Corners */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-pink-600/20 blur-3xl" />

      {/* ==================================================
          TARJETA
          En móvil es una columna: la ilustración va como
          banner arriba y el formulario debajo. A partir de
          md se parte en dos columnas, con la imagen a la
          izquierda (ancho fijo) y el formulario ocupando
          todo el hueco que queda (flex-1).

          El ancho de la imagen es FIJO a propósito. Lo de
          dejar que el alto de la tarjeta le marcara el
          ancho (w-auto + h-full) parece más elegante, pero
          es circular: el navegador no sabe cuánto mide
          ninguno de los dos lados, así que se va al tamaño
          real del archivo (942x1670), la tarjeta crece
          desmesuradamente y el botón de "Iniciar Sesión"
          se va fuera de la pantalla.

          Con w-60 y h-auto el alto sale solo de la
          proporción de la imagen (240x426), que es un
          número que el navegador sí puede calcular de
          entrada. El max-h en unidades de pantalla está
          para pantallas bajas: ahí la imagen se empequeñece
          y, si aun así no cabe, el formulario se scrolls y
          el botón siempre está a un clic.
      ================================================== */}
      <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0c0c14]/95 shadow-2xl shadow-violet-950/40 md:max-w-2xl md:flex-row">

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuth}
          className="absolute right-5 top-5 z-10 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Ilustración */}
        <div className="relative flex shrink-0 items-center justify-center overflow-hidden md:w-60">
          <img
            src="/img/auth-art.webp"
            alt="Ilustración de la comunidad geekapoo"
            className="h-32 w-full object-cover object-top md:h-auto md:max-h-[calc(100dvh-3rem)] md:w-60 md:object-contain"
          />

          {/* El degradado solo hace falta en el banner de móvil, que
              recorta la imagen y la corta de golpe por abajo. En
              escritorio la ilustración va entera y con fondo
              transparente, así que se apoya sola en la tarjeta y
              cualquier velo la taparía. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent md:hidden" />
        </div>

        {/* Formulario */}
        <div className="relative flex-1 overflow-y-auto p-6 sm:p-8">

        {/* Header */}
        <div className="mb-6 text-center">

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
            <Sparkles size={24} />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {authMode === 'login' && 'Iniciar Sesión'}
            {authMode === 'register' && 'Únete a geekapoo'}
            {authMode === 'recover' && 'Recuperar Contraseña'}
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            {returnToAction ? (
              <span className="text-violet-400 font-medium">
                Acción protegida: Inicia sesión para{' '}
                {returnToAction}
              </span>
            ) : (
              'Tu comunidad geek, anime y cultura pop favorita.'
            )}
          </p>
        </div>

        {/* Mode Tabs */}
        {(authMode === 'login' ||
          authMode === 'register') && (
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">

            <button
              type="button"
              onClick={() => {
                openAuth(
                  'login',
                  returnToAction || undefined
                );
                setFeedback(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                authMode === 'login'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={() => {
                openAuth(
                  'register',
                  returnToAction || undefined
                );
                setFeedback(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                authMode === 'register'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Registro
            </button>

          </div>
        )}

        {/* Feedback Alerts */}
        {feedback && (
          <div
            className={`mb-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
              feedback.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5"
              />
            ) : (
              <CheckCircle2
                size={16}
                className="shrink-0 mt-0.5"
              />
            )}

            <div>
              <p>{feedback.message}</p>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                Correo Electrónico
              </label>

              <div className="relative">

                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="ejemplo@geekapoo.es"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />

              </div>
            </div>

            <div>

              <div className="mb-1 flex items-center justify-between">

                <label className="text-xs font-medium text-zinc-300">
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={() => {
                    openAuth(
                      'recover',
                      returnToAction || undefined
                    );
                    setFeedback(null);
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>

              </div>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Verificando...'
                  : 'Iniciar Sesión'}
              </span>

              <ArrowRight size={14} />
            </button>

          </form>
        )}

        {/* REGISTER FORM */}
        {authMode === 'register' && (
          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                Correo Electrónico
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu_email@dominio.com"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />
              </div>
            </div>

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
                    setUsername(e.target.value);
                    setUsernameState(null);
                  }}
                  placeholder="kapo_25"
                  autoComplete="username"
                  maxLength={20}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-10 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />
                {checkingUsername && (
                  <Loader2
                    size={15}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-violet-400"
                  />
                )}
              </div>

              <p
                className={`mt-1 flex items-center gap-1 text-[11px] ${
                  checkingUsername
                    ? 'text-zinc-400'
                    : usernameState?.estado === 'disponible'
                      ? 'text-emerald-400'
                      : usernameState?.estado === 'ocupado' ||
                          usernameState?.estado === 'invalido' ||
                          usernameState?.estado === 'reservado'
                        ? 'text-red-400'
                        : 'text-zinc-500'
                }`}
              >
                {checkingUsername ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    Comprobando disponibilidad...
                  </>
                ) : usernameState?.estado === 'disponible' ? (
                  <>
                    <CheckCircle2 size={11} />
                    {usernameState.mensaje}
                  </>
                ) : usernameState?.estado === 'ocupado' ||
                  usernameState?.estado === 'invalido' ||
                  usernameState?.estado === 'reservado' ? (
                  <>
                    <AlertCircle size={11} />
                    {usernameState.mensaje}
                  </>
                ) : (
                  usernameState?.mensaje || 'Introduce un nombre de usuario.'
                )}
              </p>

              <p className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-amber-200">
                Tu nombre de usuario será permanente y no podrás cambiarlo
                después. Aparecerá como <strong>@{normalizarUsername(username) || 'usuario'}</strong>.
              </p>
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
                  autoComplete="nickname"
                  maxLength={DISPLAY_NAME_MAX}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                Este es el nombre que verá la comunidad. Puede repetirse y
                podrás cambiarlo más adelante.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                Contraseña Segura
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                Confirmar contraseña
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || usernameState?.estado !== 'disponible'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Creando cuenta...'
                  : 'Crear Cuenta y Unirme'}
              </span>

              <Sparkles size={14} />
            </button>

          </form>
        )}

        {/* RECOVER PASSWORD (FIREBASE ENLACE SEGURO) */}
        {authMode === 'recover' && (
          <form
            onSubmit={handleSendResetEmail}
            className="space-y-4"
          >

            <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-xs leading-relaxed text-violet-200">
              Introduce tu correo electrónico registrado.
              Firebase te enviará un correo con un enlace
              seguro para restablecer tu contraseña.
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                Correo Electrónico Registrado
              </label>

              <div className="relative">

                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="ejemplo: kaguya.fan@geekapoo.es"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-base sm:text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  required
                />

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Enviando...'
                  : 'Enviar Enlace de Recuperación'}
              </span>

              <KeyRound size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                openAuth(
                  'login',
                  returnToAction || undefined
                );
                setFeedback(null);
              }}
              className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              ← Volver al inicio de sesión
            </button>

          </form>
        )}

        {/* OAuth GitHub */}
        {(authMode === 'login' ||
          authMode === 'register') && (
          <div className="mt-5 border-t border-zinc-800/80 pt-5">

            <div className="relative mb-4 text-center">

              <span className="relative z-10 bg-[#0c0c14] px-3 text-[11px] font-medium text-zinc-500">
                O CONTINUAR CON OAUTH
              </span>

              <div className="absolute inset-0 top-1/2 -translate-y-1/2 border-t border-zinc-800" />

            </div>

            <button
              type="button"
              onClick={handleGithub}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] disabled:opacity-50"
            >
              <Github
                size={16}
                className="text-white"
              />

              <span>
                Continuar con GitHub OAuth
              </span>
            </button>

            {/* Google

                Se pone primero: es el proveedor que más gente
                espera por defecto, y así el botón se ve sin
                tener que buscar. El de GitHub queda debajo. */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] disabled:opacity-50"
            >
              {/* El logo de Google es multicolor, así que se
                  escribe con las clases que traen sus colores
                  oficiales en vez de usar el icono monocromo de
                  lucide, que saldría todo blanco. */}
              <svg
                width={16}
                height={16}
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>

              <span>
                Continuar con Google
              </span>
            </button>

          </div>
        )}

        </div>
      </div>
    </div>
  );
};