import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  Shield,
  LogOut,
  User,
  Home,
  Search,
  Code2,
  Tv,
  MessageCircle,
  Gift,
  LifeBuoy,
  Menu,
  X,
  ArrowUpRight,
  Trophy,
  Brain,
  Sparkles,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { useNotifications } from '../../context/NotificationsContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { AccountMenu } from './AccountMenu';
import { useQueryState, useQueryStateBatch } from '../../hooks/useQueryState';


// ======================================================
// PROPS DEL NAVBAR
// ======================================================

interface NavbarProps {
  currentTab: string;
  /**
   * Cambia de pestaña. Ya no es un setState: escribe en la URL,
   * que es lo que hace que recargar no pierda la vista.
   */
  setCurrentTab: (tab: string) => void;
  /**
   * Lleva a la wiki y deja el buscador listo para escribir.
   *
   * Opcional: si no viene, el botón solo cambia de pestaña y el
   * cursor se queda donde estuviera.
   */
  onOpenSearch?: () => void;
  onOpenArchitecture: () => void;
}

/**
 * Un destino de la barra. O bien va a una pestaña ('tab') o hace
 * una cosa propia ('accion'), nunca las dos: "Arquitectura" abre
 * un modal y "Buscar" salta a la wiki con el foco puesto, y en
 * ninguno de los dos casos hay una pestaña a la que volver.
 */
interface Destino {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  tab?: string;
  accion?: () => void;
  /** 'admin' y 'violeta' solo cambian los colores. */
  tono?: 'admin' | 'violeta';
  /** Punto de mensajes sin leer. */
  aviso?: boolean;
  titulo?: string;
}


// ======================================================
// NAVBAR
// ======================================================

export default function Navbar({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  onOpenArchitecture,
}: NavbarProps) {
  const {
    currentUser,
    logout,
    openAuth,
    canManage,
  } = useAuth();

  const { unreadRoomIds } = useChat();
  const { settings } = useSiteContent();
  const unreadCount = unreadRoomIds.length;
  const hasUnread = unreadCount > 0;

  const navigate = useNavigate();

  // Escritura conjunta de la URL (pestaña + acción del perfil).
  // `setCurrentTab` solo toca `tab` y limpia `usuario`; para
  // abrir el editor o los ajustes hace falta escribir `accion`
  // en la misma operación, o se pisa una clave a otra.
  const setUrl = useQueryStateBatch();

  // Si se está mirando el perfil propio (sin `usuario`), para
  // marcar "Mi perfil" como activo en el desplegable.
  const [usuarioParam] = useQueryState('usuario', '');

  const perfilPropioActivo = currentTab === 'perfil' && !usuarioParam;

  /** Va al perfil propio, con el editor abierto si se pide. */
  const irAPerfil = (editar?: boolean) => {
    setUrl({ tab: 'perfil', usuario: null, accion: editar ? 'editar' : null });
  };

  /** Va al apartado propio de configuración de la cuenta. */
  const irAAjustes = () => {
    setUrl({ tab: 'ajustes', usuario: null, accion: null });
  };


  // ====================================================
  // MENÚ DEL MÓVIL
  // ====================================================
  // Por debajo de md (768px) los enlaces de la barra no caben, así
  // que se esconden y su sitio lo ocupa este menú. No es un
  // detalle: sin él la web en un teléfono no tenía forma de llegar
  // a la wiki, los chats ni el soporte.
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cambiar de vista lo cierra siempre. Se hace con un efecto y no
  // dentro de goToTab porque no todos los caminos pasan por ahí:
  // "Panel Admin" también se puede abrir desde una tarjeta, y
  // "Buscar" lleva a la wiki sin tocar la pestaña.
  useEffect(() => {
    setMenuAbierto(false);
  }, [currentTab]);

  // Escape lo cierra, como cualquier cosa que esté abierta encima.
  useEffect(() => {
    if (!menuAbierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [menuAbierto]);

  /** Pulsa un destino del menú y lo cierra. */
  const elegir = (d: Destino) => {
    setMenuAbierto(false);
    if (d.accion) {
      d.accion();
      return;
    }
    if (d.tab) goToTab(d.tab);
  };


  // ====================================================
  // CERRAR SESIÓN
  // ====================================================

  const handleLogout = async () => {
    try {
      await logout();
      // Al cerrar sesión, la URL se deja como estaba en el
      // Navegador: si alguien entre como admin recargara la
      // página, no tiene que encontrarse con un panel al que
      // ya no puede entrar.
      setCurrentTab('inicio');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };


  // ====================================================
  // CAMBIAR TAB
  // ====================================================

  // No hace falta un navigate() aquí. setCurrentTab ya escribe el
  // parámetro "?tab=..." en la barra de direcciones, y recargar
  // vuelve a esta misma vista. Antes sí había un navigate('/'),
  // pero ahora borraría los filtros y el anime que se estaban
  // viendo al saltar de pestaña.
  const goToTab = (tab: string) => {
    setCurrentTab(tab);
  };


  // ====================================================
  // CLASES
  // ====================================================

  // ====================================================
  // DESTINOS
  // ====================================================
  // La barra de la pantalla grande y el menú del móvil enseñan
  // exactamente lo mismo, así que la lista se escribe UNA vez y se
  // pinta dos veces. Duplicar los botones a mano era la forma
  // segura de que se quedaran distintos: el menú del móvil se
  // olvidaba de un enlace, o ponía otro color en el activo, y
  // nadie se enteraba hasta abrir la web en el teléfono.
  const destinos: Destino[] = [
    { id: 'inicio', etiqueta: 'Inicio', icono: Home, tab: 'inicio' },
    { id: 'wiki', etiqueta: 'Navegar (Wiki)', icono: Tv, tab: 'wiki' },
    {
      id: 'chats',
      etiqueta: 'Chats',
      icono: MessageCircle,
      tab: 'chats',
      // Punto de mensajes sin leer, como en la barra.
      aviso: hasUnread,
      titulo: hasUnread
        ? `Tienes ${unreadCount} ${unreadCount === 1 ? 'conversación' : 'conversaciones'} sin leer`
        : undefined,
    },
    { id: 'extras', etiqueta: 'Extras', icono: Gift, tab: 'extras' },
    { id: 'trivia', etiqueta: 'Trivia', icono: Brain, tab: 'trivia' },
    { id: 'logros', etiqueta: 'Logros', icono: Trophy, tab: 'logros' },
    { id: 'soporte', etiqueta: 'Soporte', icono: LifeBuoy, tab: 'soporte' },
    {
      id: 'arquitectura',
      etiqueta: 'Arquitectura',
      icono: Code2,
      accion: () => onOpenArchitecture(),
    },
    ...(canManage
      ? [
          {
            id: 'admin',
            etiqueta: 'Panel Admin',
            icono: Shield,
            tab: 'admin',
            tono: 'admin' as const,
          },
        ]
      : []),
    {
      id: 'buscar',
      etiqueta: 'Buscar',
      icono: Search,
      // Siempre se llama a onOpenSearch, estés donde estés. App.tsx
      // es quien va a la wiki y pone el cursor en el buscador; aquí
      // solo se avisa de que lo han pulsado.
      //
      // Antes, estando ya en la wiki, se limitaba a limpiar el texto
      // y el foco se quedaba en el botón, así que tocaba pincar en
      // la barra a mano.
      accion: () => (onOpenSearch ? onOpenSearch() : goToTab('wiki')),
      tono: 'violeta' as const,
    },
  ];

  // ====================================================
  // CLASES
  // ====================================================

  /** Si este destino es el que está en pantalla ahora mismo. */
  const activo = (d: Destino) => d.tab != null && currentTab === d.tab;

  /**
     * Colores de fondo y texto, según esté activo o no.
     *
     * Se comparte entre la barra y el menú para que el estado activo
     * se lea igual en los dos. Con un "colorDe" único, el menú
     * acababa usando el gris genérico para "Buscar" y "Panel Admin"
     * cuando no estaban activos: es decir, el sitio se veía distinto
     * en el móvil justo en los dos enlaces que tienen color propio.
     *
     * Aquí no entra el color del borde: lo pone `bordeDe`. En una
     * misma clase solo puede haber un color de borde, y en Tailwind 4
     * un "border" sin color se pinta con "currentColor", que dejaría
     * cada botón inactivo con un contorno gris.
     */
  const colorDe = (d: Destino): string => {
    if (activo(d)) {
      if (d.tono === 'admin') return 'bg-emerald-600/20 text-emerald-300';
      if (d.tono === 'violeta') return 'bg-violet-600/20 text-violet-300';
      return 'bg-purple-600/20 text-purple-300';
    }
    if (d.tono === 'admin') return 'text-emerald-400 hover:bg-emerald-950/40';
    if (d.tono === 'violeta') return 'text-violet-400 hover:bg-violet-950/40';
    return 'text-gray-300 hover:text-white hover:bg-gray-800/70';
  };

  /** El borde de la barra: el color solo sale al activarse. */
  const bordeDe = (d: Destino): string => {
    if (!activo(d)) return 'border border-transparent';
    if (d.tono === 'admin') return 'border border-emerald-500/30';
    if (d.tono === 'violeta') return 'border border-violet-500/30';
    return 'border border-purple-500/30';
  };

  /** Barra horizontal: botón compacto, uno al lado del otro. */
  const classBar = (d: Destino) =>
    `relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      activo(d) ? 'font-semibold' : ''
    } ${bordeDe(d)} ${colorDe(d)}`;

  /**
   * Menú del móvil: botón de ancho completo y más alto.
   *
   * El alto no es un capricho: por debajo de 44px de alto los
   * dedos aprietan la fila de al lado, que en un menú de una sola
   * columna es justo la de arriba. Con py-3 y text-sm el botón
   * queda en 44px, que es el mínimo que recomiendan las guías de
   * táctil (WCAG 2.5.5).
   *
   * El borde va siempre y transparente, y al activarse no cambia
   * de color como en la barra: así ninguna fila salta de alto al
   * elegirla, que en una columna vertical se nota mucho. Por eso
   * aquí no se usa `bordeDe`.
   */
  const classMenu = (d: Destino) =>
    `flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm font-semibold transition-colors ${colorDe(d)}`;


  // ====================================================
  // USUARIO
  // ====================================================

  const displayName =
    currentUser?.username ||
    currentUser?.displayName ||
    'Usuario';


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md">

      {/* El ancho tiene que coincidir EXACTAMENTE con el del
          <main> de App.tsx. Si el Navbar fuera más estrecho, el
          logo quedaría desalineado del contenido al crecer la
          ventana. */}
      <div className="mx-auto flex h-16 max-w-[1900px] items-center justify-between gap-4 px-4 sm:px-6">


        {/* ==================================================
            LOGO
        ================================================== */}

        <Link
          to="/"
          onClick={() => setCurrentTab('inicio')}
          className="flex shrink-0 items-center gap-2.5 text-left group"
        >

          {/* Logo. Si el admin ha subido una imagen, se usa esa;
              si no, se dibuja la "G" de siempre. */}
          {settings.logoUrl ? (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
              {/* `object-contain` y NO `object-cover`, a propósito: un
                  logo casi nunca es cuadrado, y con `cover` se le
                  cortaban los laterales y quedaba ilegible. Con
                  `contain` se ve entero, aunque sobre fondo. Por eso
                  el contenedor es `bg-transparent` y no un color
                  sólido detrás. */}
              <img
                src={settings.logoUrl}
                alt="Logo de geekapoo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
              <span className="font-mono text-base font-black text-white">G</span>
            </div>
          )}


          {/* Nombre.

              A 320px la cabecera lleva el logo, el avatar y el
              botón del menú, y con el nombre a text-xl la fila se
              pasaba de largo: "geekapoo.com" mide unos 145px a ese
              tamaño y solo quedaban unos 135. Con text-lg cabe
              entero, y a partir de sm (640px) ya no hay nada que
              apretar y vuelve a su tamaño. */}
          <div>
            <span className="text-lg font-black tracking-tight text-white transition-colors group-hover:text-violet-400 sm:text-xl">
              geekapoo<span className="text-violet-400">.com</span>
            </span>
          </div>

        </Link>


        {/* ==================================================
            LINKS PRINCIPALES
        ==================================================
        A partir de md (768px) van en la barra. Por debajo están
        escondidos y su sitio lo ocupa el menú del final: en una
        pantalla de 375px no caben ni de lejos. */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {destinos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => (d.accion ? d.accion() : d.tab && goToTab(d.tab))}
              className={classBar(d)}
              title={d.titulo}
            >
              <d.icono size={16} />
              <span>{d.etiqueta}</span>

              {/* Punto de mensajes sin leer */}
              {d.aviso && (
                <span
                  aria-label={`${unreadCount} conversaciones sin leer`}
                  className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-zinc-950" />
                </span>
              )}
            </button>
          ))}
        </nav>


{/* ==================================================
            ZONA USUARIO
        ==================================================
        En el móvil aquí solo caben el avatar y el botón del
        menú. Con el nombre, el botón de salir y el de iniciar
        sesión, la fila se iba de 320px: el ancho más estrecho
        que sigue existiendo, y el más común en un móvil pequeño.

        Lo que no cabe pasa al menú, que además es donde está
        en un sitio más cómodo: "Cerrar sesión" no es algo a lo
        que haya que ir con prisa. */}

        <div className="flex items-center gap-2">

          {currentUser ? (

            <>

              {/* NOTIFICACIONES */}
              <NotificationBell />

              {/* CUENTA.
                  El desplegable con "Mi perfil", "Personalizar
                  perfil", "Configuración de cuenta" y "Cerrar
                  sesión". El botón de salir suelto que había aquí
                  se movió dentro, para no tenerlo dos veces. */}
              <AccountMenu
                usuario={currentUser}
                currentTab={currentTab}
                perfilPropioActivo={perfilPropioActivo}
                onMiPerfil={() => irAPerfil()}
                onPersonalizar={() => irAPerfil(true)}
                onAjustes={irAAjustes}
                onLogout={() => void handleLogout()}
              />

            </>

          ) : (

            /* ==============================================
               NO AUTENTICADO
            ==============================================
            El botón va a partir de md. En el móvil, con el logo
            entero, no cabía, y empujar el logo a un lado para
            que entrase un botón de "Iniciar sesión" se pagaba
            con la marca de la web apretada contra el borde. En el
            menú hay sitio de sobra para el texto entero. */

            <button
              type="button"
              onClick={() => openAuth('login')}
              className="hidden items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition-colors hover:bg-purple-500 md:flex"
            >

              <User size={16} />

              <span>
                Iniciar sesión
              </span>

            </button>

          )}

        </div>

        {/* ==================================================
            BOTÓN DEL MENÚ
        ==================================================
        Solo por debajo de md (768px), que es donde la barra
        esconde los enlaces.

        Va después de la zona de usuario a propósito: así el
        extremo derecho de la pantalla queda para el avatar, que en
        un móvil es lo que más se pulsa, y no para el menú, que se
        abre una vez y se cierra al elegir. */}

        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar el menú' : 'Abrir el menú'}
          title={menuAbierto ? 'Cerrar el menú' : 'Abrir el menú'}
          className="-mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-gray-800 hover:text-white md:hidden"
        >
          {menuAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>

      </div>


      {/* ==================================================
          MENÚ DEL MÓVIL
      ==================================================
      Cae debajo de la cabecera, no la cubre. La cabecera es
      "sticky" y eso la convierte en referencia de sus hijos
      absolutos, así que "top-full" la deja justo debajo por
      mucho que haya página debajo.

      El alto máximo evita que, con muchas secciones, el menú se
      saliera por abajo de la pantalla: "dvh" porque en móvil la
      barra de direcciones encoge al hacer scroll y "vh" mide mal
      en ese momento. */}

      {menuAbierto && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-gray-800 bg-zinc-950/98 shadow-2xl backdrop-blur-md md:hidden">

          <nav className="space-y-1 p-3">
            {destinos.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => elegir(d)}
                className={classMenu(d)}
              >
                <d.icono size={17} className="flex-shrink-0" />
                <span className="flex-1">{d.etiqueta}</span>

                {d.aviso && (
                  <span
                    aria-label={`${unreadCount} conversaciones sin leer`}
                    className="flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-pink-500 ring-2 ring-zinc-950"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* CUENTA. El sitio donde el avatar deja de caber en la
              cabecera pasa aquí, con el texto entero y sin
              mutilarlo. */}
          <div className="border-t border-gray-800 p-3">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    goToTab('perfil');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left transition-colors hover:bg-gray-800/70"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-500/40 bg-purple-600/20">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-purple-300" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">
                      {displayName}
                    </span>
                    <span className="block truncate text-[10px] text-gray-400">
                      {currentUser.role === 'admin'
                        ? 'Administrador'
                        : currentUser.role === 'moderator'
                          ? 'Moderador'
                          : '@' + currentUser.username}
                    </span>
                  </span>

                  <ArrowUpRight size={14} className="flex-shrink-0 text-gray-500" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    irAPerfil(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800/70 hover:text-white"
                >
                  <Sparkles size={17} className="flex-shrink-0 text-violet-400" />
                  Personalizar perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    irAAjustes();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800/70 hover:text-white"
                >
                  <Settings size={17} className="flex-shrink-0 text-gray-400" />
                  Configuración de cuenta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    void handleLogout();
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={17} className="flex-shrink-0" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  openAuth('login');
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
              >
                <User size={17} className="flex-shrink-0" />
                Iniciar sesión
              </button>
            )}
          </div>

        </div>
      )}

    </header>
  );
}
