import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';

import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';
import { AvatarUsuario } from '../profile/AvatarUsuario';
import { tiempoRelativo, iconoDe, textoDe, esNotificacionImportante } from '../../utils/notificaciones';
import { useGoToNotification } from '../../hooks/useGoToNotification';

// ======================================================
// NOTIFICATION BELL
// ======================================================
//
// Icono de campana en el Navbar + panel dropdown.
//
// Se cierra al:
//   - pulsar fuera (click en el documento)
//   - pulsar Escape
//   - navegar a otro contenido

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    openPanel,
    setOpenPanel,
  } = useNotifications();
  const { usersList } = useAuth();

  const [tiempoRefresh, setTiempoRefresh] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Posición calculada para que el panel quepa siempre en el viewport. */
  const [panelBox, setPanelBox] = useState<{ left: number; width: number } | null>(null);
  const [confirmarBorrarTodas, setConfirmarBorrarTodas] = useState(false);
  const [borrandoTodas, setBorrandoTodas] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [saliendo, setSaliendo] = useState<Set<string>>(new Set());

  // ── Ir al contenido del aviso ──────────────────────────
  const irA = useGoToNotification();

  // Aviso de "este aviso ya no lleva a ningún sitio". Antes el panel
  // se cerraba sin más y el clic parecía no haber hecho nada, que es
  // justo lo que hace pensar que la web está rota.
  const [aviso, setAviso] = useState('');
  const avisoTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
    },
    [],
  );

  // ====================================================
  // CERRAR CON ESCAPE / FUERA
  // ====================================================

  useEffect(() => {
    if (!openPanel) return;

    const cerrarFuera = (e: MouseEvent) => {
      if (confirmarBorrarTodas) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(false);
      }
    };

    const cerrarEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmarBorrarTodas) {
        if (!borrandoTodas) setConfirmarBorrarTodas(false);
        return;
      }
      setOpenPanel(false);
    };

    document.addEventListener('mousedown', cerrarFuera);
    window.addEventListener('keydown', cerrarEscape);

    return () => {
      document.removeEventListener('mousedown', cerrarFuera);
      window.removeEventListener('keydown', cerrarEscape);
    };
  }, [openPanel, setOpenPanel, confirmarBorrarTodas, borrandoTodas]);

  // Al abrir el panel se limpia el error de la acción anterior.
  useEffect(() => {
    if (openPanel) setErrorAccion('');
  }, [openPanel]);

  // Si el panel se cierra por cualquier vía, el diálogo no debe
  // quedarse flotando por encima de la página.
  useEffect(() => {
    if (!openPanel) {
      setConfirmarBorrarTodas(false);
      setBorrandoTodas(false);
    }
  }, [openPanel]);

  // El panel está anclado a la campana, que en móvil no está pegada
  // al borde derecho: la hamburguesa y el avatar van detrás. Con
  // `right-0` y el ancho del viewport, se salía por la izquierda.
  // Se calcula una posición dentro de la pantalla y se recalcula al
  // girar el móvil o cambiar el tamaño de la ventana.
  useLayoutEffect(() => {
    if (!openPanel) return;
    const wrapper = panelRef.current;
    if (!wrapper) return;

    const ajustar = () => {
      const rect = wrapper.getBoundingClientRect();
      const viewport = window.innerWidth;
      const width = Math.min(380, Math.max(0, viewport - 32));
      const left = Math.max(16, Math.min(rect.right - width, viewport - 16 - width));
      setPanelBox({ left: left - rect.left, width });
    };

    ajustar();
    window.addEventListener('resize', ajustar);
    window.visualViewport?.addEventListener('resize', ajustar);
    return () => {
      window.removeEventListener('resize', ajustar);
      window.visualViewport?.removeEventListener('resize', ajustar);
    };
  }, [openPanel]);

  // ====================================================
  // REFRESCAR TIEMPOS RELATIVOS CADA MINUTO
  // ====================================================

  useEffect(() => {
    if (!openPanel) return;
    const intervalo = window.setInterval(() => setTiempoRefresh((n) => n + 1), 60_000);
    return () => window.clearInterval(intervalo);
  }, [openPanel]);

  // ====================================================
  // AL PULSAR UNA NOTIFICACIÓN
  // ====================================================

  const handleClick = async (n: typeof notifications[0]) => {
    // Ir al contenido primero y marcar leído después. Al revés había
    // un fallo molesto: `markAsRead` es una escritura a Firestore y,
    // si tardaba o fallaba, el clic se comido y no pasaba nada,
    // pareciendo que el aviso no responde.
    const aviso = irA(n);

    setOpenPanel(false);

    // Que el aviso quede sin leer no puede impedir que se abra: si
    // el marcado falla, se avisa y se navega igual.
    try {
      await markAsRead(n.id);
    } catch (e) {
      console.error('[Notifications] No se pudo marcar como leída:', e);
    }

    if (aviso) {
      if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
      setAviso(aviso);
      avisoTimer.current = window.setTimeout(() => {
        avisoTimer.current = null;
        setAviso('');
      }, 4000);
    }
  };

  const borrarUna = async (id: string) => {
    if (saliendo.has(id)) return;

    setErrorAccion('');
    setSaliendo((prev) => new Set(prev).add(id));

    const ok = await deleteNotification(id);
    setSaliendo((prev) => {
      const siguiente = new Set(prev);
      siguiente.delete(id);
      return siguiente;
    });

    if (!ok) {
      setErrorAccion('No se pudo eliminar la notificación.');
    }
  };

  const eliminarTodas = async () => {
    setBorrandoTodas(true);
    setErrorAccion('');

    const ok = await deleteAllNotifications();
    setBorrandoTodas(false);

    if (ok) {
      setConfirmarBorrarTodas(false);
    } else {
      setErrorAccion('No se pudieron eliminar todas las notificaciones.');
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="relative" ref={panelRef}>
      {/* ================================================
          BOTÓN CAMPANA
      ================================================ */}

      <button
        type="button"
        onClick={() => setOpenPanel(!openPanel)}
        aria-label={openPanel ? 'Cerrar notificaciones' : 'Abrir notificaciones'}
        aria-expanded={openPanel}
        title={openPanel ? 'Cerrar notificaciones' : 'Notificaciones'}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <Bell size={18} />

        {/* Punto de notificaciones sin leer */}
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} notificaciones sin leer`}
            className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ring-zinc-950" />
          </span>
        )}
      </button>

      {/* ================================================
          PANEL DROPDOWN
      ================================================ */}

      {openPanel && (
        <div
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-[calc(100vw-2rem)] max-w-[380px] overflow-y-auto overscroll-contain rounded-xl border border-white/[0.06] bg-[#0c0c14]/95 shadow-2xl backdrop-blur-xl"
          style={
            panelBox
              ? { left: panelBox.left, right: 'auto', width: panelBox.width }
              : undefined
          }
        >
          {/* ==============================================
              CABECERA
          ============================================== */}

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-violet-300" />
              <h3 className="text-sm font-bold text-white">Notificaciones</h3>

              {unreadCount > 0 && (
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="chat-boton flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition-colors hover:text-violet-200"
                >
                  <CheckCheck size={12} />
                  Marcar todas como leídas
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorAccion('');
                    setConfirmarBorrarTodas(true);
                  }}
                  className="chat-boton flex items-center gap-1 text-[11px] font-semibold text-rose-300 transition-colors hover:text-rose-200"
                >
                  <Trash2 size={12} />
                  Eliminar todas
                </button>
              )}
            </div>
          </div>

          {errorAccion && (
            <div className="border-b border-rose-500/15 bg-rose-500/10 px-4 py-2 text-[11px] font-semibold text-rose-200">
              {errorAccion}
            </div>
          )}

          {/* ==============================================
              LISTA
          ============================================== */}

          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-6 text-center text-xs text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No tienes notificaciones todavía.</p>
                <p className="mt-1 text-xs text-gray-500">✨ ¡Todo tranquilo por aquí!</p>
              </div>
            )}

            {!loading &&
              !error &&
              notifications.map((n) => {
                const esImportante = esNotificacionImportante(n);
                const noLeida = !n.read;
                const actor = usersList.find((u) => u.uid === n.actorId);
                const aviso = actor
                  ? {
                      ...n,
                      actorName: actor.displayName || n.actorName,
                      actorAvatar: actor.avatarUrl || n.actorAvatar,
                    }
                  : n;

                return (
                  <div
                    key={n.id}
                    className={`flex w-full items-start gap-1 border-b border-white/[0.04] transition-all duration-200 ${
                      noLeida ? 'bg-violet-500/5' : ''
                    } ${
                      saliendo.has(n.id)
                        ? 'pointer-events-none -translate-x-2 opacity-0'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className="chat-boton flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      {/* Avatar */}
                      {aviso.actorAvatar ? (
                        <AvatarUsuario
                          src={aviso.actorAvatar}
                          fallbackSrc="/img/avatar-comunidad.webp"
                          alt={aviso.actorName}
                          frame={actor?.avatarFrame}
                          color={actor?.profileColor}
                          sizeClass="h-9 w-9"
                          shapeClass="rounded-full"
                        />
                      ) : (
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-sm text-zinc-400">
                          {iconoDe(n)}
                        </span>
                      )}

                      {/* Contenido */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{iconoDe(n)}</span>
                          <span className="truncate text-sm sm:text-xs font-semibold text-white">
                            {aviso.actorName}
                          </span>
                          {actor?.username && (
                            <span className="truncate font-mono text-[9px] text-zinc-500">
                              @{actor.username}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-0.5 text-sm sm:text-xs leading-relaxed ${
                            noLeida ? 'text-gray-200' : 'text-gray-400'
                          }`}
                        >
                          {textoDe(aviso)}
                        </p>

                        {n.snippet && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">
                            &quot;{n.snippet}&quot;
                          </p>
                        )}

                        <p className="mt-1 text-[10px] text-zinc-500">
                          {tiempoRelativo(n.createdAt)}
                        </p>
                      </div>

                      {/* Indicador no leído + flecha */}
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        {noLeida && (
                          <span className="h-2 w-2 rounded-full bg-violet-500" />
                        )}
                        <ChevronRight size={12} className="text-gray-600" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void borrarUna(n.id)}
                      aria-label="Eliminar notificación"
                      title="Eliminar notificación"
                      className="chat-boton mr-2 mt-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
          </div>

          {/* ==============================================
              PIE
          ============================================== */}

          {notifications.length > 0 && (
            <div className="border-t border-white/[0.06] px-4 py-2 text-center">
              <p className="text-[10px] text-zinc-500">
                Las notificaciones se actualizan en tiempo real
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================================================
          CONFIRMACIÓN: eliminar todas
      ================================================
          Va en un portal para que el `backdrop-blur` del navbar no
          recorte el overlay fijo. */}
      {confirmarBorrarTodas &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-notificaciones"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !borrandoTodas) {
                setConfirmarBorrarTodas(false);
              }
            }}
          >
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0c0c14] p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                  <AlertTriangle size={18} />
                </span>
                <div className="min-w-0">
                  <h4 id="titulo-eliminar-notificaciones" className="text-sm font-bold text-white">
                    ¿Eliminar todas las notificaciones?
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    Se borrarán todas las notificaciones de tu cuenta. No se eliminarán los
                    hilos, comentarios, mensajes ni el contenido original.
                  </p>
                </div>
              </div>

              {errorAccion && (
                <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-200">
                  {errorAccion}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmarBorrarTodas(false)}
                  disabled={borrandoTodas}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void eliminarTodas()}
                  disabled={borrandoTodas}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {borrandoTodas ? 'Eliminando...' : 'Sí, eliminar todas'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ================================================
          AVISO: "este aviso ya no lleva a ningún sitio"
      ================================================
          Fuera del desplegable a propósito: el panel se cierra al
          navegar, así que un mensaje dentro de él no se vería. */}
      {aviso && (
        <p className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-xl border border-amber-400/25 bg-[#0c0c14]/95 px-4 py-2.5 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur">
          {aviso}
        </p>
      )}
    </div>
  );
};
