import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Settings,
  Sparkles,
  User,
  Accessibility,
} from 'lucide-react';

import type { User as Usuario } from '../../types';
import { AvatarUsuario } from '../profile/AvatarUsuario';

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
  onAccesibilidad: () => void;
  onLogout: () => void;
}> = ({
  usuario,
  currentTab,
  perfilPropioActivo,
  onMiPerfil,
  onPersonalizar,
  onAjustes,
  onAccesibilidad,
  onLogout,
}) => {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement | null>(null);
  const botonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const nombre = usuario.displayName || usuario.username || 'Usuario';

  const rolTexto =
    usuario.role === 'admin'
      ? 'Administrador'
      : usuario.role === 'moderator'
        ? 'Moderador'
        : usuario.username
          ? `@${usuario.username}`
          : 'Usuario';

  // Texto que se ve en el disparador (incluye los corchetes del
  // rol). El nombre accesible tiene que contenerlo para que el
  // lector no oiga un nombre distinto del que hay en pantalla.
  const rolVisual =
    usuario.role === 'admin'
      ? '[ADMIN]'
      : usuario.role === 'moderator'
        ? '[MODERADOR]'
        : usuario.username
          ? `@${usuario.username}`
          : 'Usuario';

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
      if (e.key === 'Escape') {
        setAbierto(false);
        window.requestAnimationFrame(() => botonRef.current?.focus());
      }
    };

    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  // Al abrir, el foco entra en la primera opción. Sin esto, un
  // lector de pantalla anuncia el botón pero no el menú, y Tab
  // podría seguir por la página en lugar de por las opciones.
  useEffect(() => {
    if (!abierto) return;
    const frame = window.requestAnimationFrame(() => {
      const primero = menuRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"]',
      );
      primero?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [abierto]);

  /** Flechas, Inicio y Fin dentro del menú (patrón ARIA de menús). */
  const navegarMenu = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const teclas = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!teclas.includes(e.key)) return;

    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ).filter((el) => !el.hasAttribute('disabled'));
    if (items.length === 0) return;

    e.preventDefault();
    const actual = items.indexOf(document.activeElement as HTMLElement);
    let siguiente = 0;

    if (e.key === 'End') siguiente = items.length - 1;
    else if (e.key === 'ArrowDown') siguiente = (actual + 1) % items.length;
    else if (e.key === 'ArrowUp') siguiente = (actual - 1 + items.length) % items.length;

    items[siguiente]?.focus({ preventScroll: true });
  };

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
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-cuenta"
        title={abierto ? 'Cerrar el menú de cuenta' : 'Abrir el menú de cuenta'}
        className="chat-boton flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.05]"
      >
        {usuario.avatarUrl ? (
          <AvatarUsuario
            src={usuario.avatarUrl}
            fallbackSrc="/img/avatar-comunidad.webp"
            // El nombre va en el texto del botón; el avatar no debe
            // repetirlo cuando ya está visible.
            alt=""
            frame={usuario.avatarFrame}
            color={usuario.profileColor}
            sizeClass="h-8 w-8"
            shapeClass="rounded-full"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-300">
            <User size={16} />
          </span>
        )}

        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-xs font-bold text-white">
            {nombre}
          </span>
          <span className="block truncate text-[10px] text-zinc-400">
            {usuario.role === 'admin'
              ? '[ADMIN]'
              : usuario.role === 'moderator'
                ? '[MODERADOR]'
                : usuario.username
                  ? `@${usuario.username}`
                  : 'Usuario'}
          </span>
        </span>

        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`hidden text-zinc-500 transition-transform sm:block ${abierto ? 'rotate-180' : ''}`}
        />

        {/* En móvil el nombre y el rol están ocultos con `sm:block`:
            se recuperan aquí para que el botón no pierda quién es. */}
        <span className="sr-only sm:hidden">
          {nombre} {rolVisual}.{' '}
        </span>
        <span className="sr-only">
          {abierto ? 'Cerrar' : 'Abrir'} el menú de cuenta
        </span>
      </button>

      {abierto && (
        <div
          ref={menuRef}
          id="menu-cuenta"
          role="menu"
          aria-label="Menú de cuenta"
          onKeyDown={navegarMenu}
          // Alineado a la derecha del avatar y sin salirse en
          // móvil: el ancho está topado al viewport. La aparición
          // usa `geo-pop-in`, la animación de los paneles
          // flotantes del proyecto (`animate-in` no hace nada
          // aquí, no hay ese plugin).
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain geo-pop-in origin-top-right rounded-2xl border border-white/[0.06] bg-[#0c0c14]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {/* ── Cabecera ─────────────────────────── */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
            {usuario.avatarUrl ? (
              <AvatarUsuario
                src={usuario.avatarUrl}
                fallbackSrc="/img/avatar-comunidad.webp"
                alt=""
                frame={usuario.avatarFrame}
                color={usuario.profileColor}
                sizeClass="h-10 w-10"
                shapeClass="rounded-full"
              />
            ) : (
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-300">
                <User size={18} />
              </span>
            )}
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
                  ? 'bg-violet-500/15 text-violet-200'
                  : 'text-zinc-200 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <User size={16} className="flex-shrink-0 text-violet-300" />
              Mi perfil
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onPersonalizar)}
              className={`${itemClase} text-zinc-200 hover:bg-white/[0.05] hover:text-white`}
            >
              <Sparkles size={16} className="flex-shrink-0 text-violet-300" />
              Personalizar perfil
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onAjustes)}
              className={`${itemClase} text-zinc-200 hover:bg-white/[0.05] hover:text-white`}
            >
              <Settings size={16} className="flex-shrink-0 text-zinc-400" />
              Configuración de cuenta
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => elegir(onAccesibilidad)}
              className={`${itemClase} text-zinc-200 hover:bg-white/[0.05] hover:text-white`}
            >
              <Accessibility size={16} className="flex-shrink-0 text-violet-300" />
              Accesibilidad
            </button>

            <div aria-hidden="true" className="mx-1 my-1 border-t border-white/[0.06]" />

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
