import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';

import type { User as Usuario } from '../../types';

// ======================================================
// MENÚ DE CUENTA
// ======================================================
//
// El desplegable del avatar en la barra: cabecera con quién
// eres, "Mi perfil", "Personalizar perfil", "Configuración de
// cuenta" y "Cerrar sesión".
//
// No navega por su cuenta: todo lo que hace es avisar al padre
// (`Navbar`), que es quien sabe cambiar de pestaña y escribir
// la URL. Así no hay dos sitios decidiendo a dónde se va.
//
// Se cierra al elegir, al pulsar fuera, con Escape y al cambiar
// de pestaña. Sin eso, el menú se quedaría abierto encima de la
// vista nueva, que es lo que pasa cuando solo se cierra "al
// elegir".

export const AccountMenu: React.FC<{
  usuario: Usuario;
  /** Pestaña actual, para cerrar al navegar y marcar "Mi perfil". */
  currentTab: string;
  /** `true` si se está mirando el perfil propio. */
  perfilPropioActivo: boolean;
  onMiPerfil: () => void;
  onPersonalizar: () => void;
  onAjustes: () => void;
  onLogout: () => void;
}> = ({
  usuario,
  currentTab,
  perfilPropioActivo,
  onMiPerfil,
  onPersonalizar,
  onAjustes,
  onLogout,
}) => {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement | null>(null);

  const nombre = usuario.displayName || usuario.username;

  const rolTexto =
    usuario.role === 'admin'
      ? 'Administrador'
      : usuario.role === 'moderator'
        ? 'Moderador'
        : `@${usuario.username}`;

  // Cambiar de vista lo cierra siempre, igual que el menú del
  // móvil: si no, se queda flotando sobre la vista nueva.
  useEffect(() => {
    setAbierto(false);
  }, [currentTab]);

  // Fuera y Escape lo cierran. El listener vive solo mientras
  // está abierto, para no escuchar clics de toda la web.
  useEffect(() => {
    if (!abierto) return;

    const fuera = (e: PointerEvent) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const elegir = (accion: () => void) => {
    setAbierto(false);
    accion();
  };

  const itemClase =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors';

  return (
    <div ref={cajaRef} className="relative">
      {/* Disparador: el avatar y el nombre de siempre. Toda la
          zona es el botón, no solo la foto. */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar el menú de cuenta' : 'Abrir el menú de cuenta'}
        title={abierto ? 'Cerrar el menú de cuenta' : 'Abrir el menú de cuenta'}
        className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-gray-800"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-violet-500/40 bg-purple-600/20 text-purple-300">
          {usuario.avatarUrl ? (
            <img
              src={usuario.avatarUrl}
              alt={nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={16} />
          )}
        </span>

        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-xs font-bold text-white">
            {usuario.username || usuario.displayName || 'Usuario'}
          </span>
          <span className="block text-[10px] text-gray-400">
            {usuario.role === 'admin'
              ? '[ADMIN]'
              : usuario.role === 'moderator'
                ? '[MODERADOR]'
                : 'Usuario'}
          </span>
        </span>

        <ChevronDown
          size={14}
          className={`hidden text-gray-500 transition-transform sm:block ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div
          role="menu"
          aria-label="Menú de cuenta"
          // Alineado a la derecha del avatar y sin salirse en
          // móvil: el ancho está topado al viewport. La aparición
          // usa `geo-pop-in`, la animación de los paneles
          // flotantes del proyecto (`animate-in` no hace nada
          // aquí, no hay ese plugin).
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] geo-pop-in origin-top-right overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
        >
          {/* ── Cabecera ─────────────────────────── */}
          <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-500/40 bg-purple-600/20 text-purple-300">
              {usuario.avatarUrl ? (
                <img
                  src={usuario.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={18} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-white">{nombre}</span>
              <span className="block truncate text-[11px] text-zinc-400">{rolTexto}</span>
            </span>
          </div>

          {/* ── Opciones ─────────────────────────── */}
          <div className="space-y-0.5 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onMiPerfil)}
              className={`${itemClase} ${
                perfilPropioActivo
                  ? 'bg-violet-600/20 text-violet-200'
                  : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <User size={16} className="flex-shrink-0 text-violet-400" />
              Mi perfil
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onPersonalizar)}
              className={`${itemClase} text-zinc-200 hover:bg-zinc-800 hover:text-white`}
            >
              <Sparkles size={16} className="flex-shrink-0 text-violet-400" />
              Personalizar perfil
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onAjustes)}
              className={`${itemClase} text-zinc-200 hover:bg-zinc-800 hover:text-white`}
            >
              <Settings size={16} className="flex-shrink-0 text-zinc-400" />
              Configuración de cuenta
            </button>

            <div aria-hidden="true" className="mx-1 my-1 border-t border-zinc-800" />

            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onLogout)}
              className={`${itemClase} text-zinc-300 hover:bg-red-500/10 hover:text-red-300`}
            >
              <LogOut size={16} className="flex-shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
