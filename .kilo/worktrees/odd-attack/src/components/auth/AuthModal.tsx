// src/components/auth/AuthModal.tsx
import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  Github,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

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

    if (!email || !password || !username) {
      setFeedback({
        type: 'error',
        message:
          'Completa todos los campos para crear tu cuenta.'
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        type: 'error',
        message:
          'La contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await register(
      email,
      password,
      username
    );

    setLoading(false);

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message: result.error || 'Error durante el registro.'
      });
    }
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
      <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-violet-950/40 md:max-w-2xl md:flex-row">

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

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
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
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">

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
                  placeholder="ejemplo@geekapoo.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 disabled:opacity-50"
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
                Nombre de Usuario (Apodo Geek)
              </label>

              <div className="relative">

                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="OtakuSenpai_26"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />

              </div>
            </div>

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
                  placeholder="tu_email@dominio.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />

              </div>
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
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 disabled:opacity-50"
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

            <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 p-3 text-xs leading-relaxed text-violet-200">
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
                  placeholder="ejemplo: kaguya.fan@geekapoo.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />

              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 disabled:opacity-50"
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

              <span className="relative z-10 bg-zinc-900 px-3 text-[11px] font-medium text-zinc-500">
                O CONTINUAR CON OAUTH
              </span>

              <div className="absolute inset-0 top-1/2 -translate-y-1/2 border-t border-zinc-800" />

            </div>

            <button
              type="button"
              onClick={handleGithub}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800/80 disabled:opacity-50"
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
              className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800/80 disabled:opacity-50"
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