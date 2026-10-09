import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, X, ChevronRight } from 'lucide-react';

import { useNotifications } from '../../context/NotificationsContext';
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
    openPanel,
    setOpenPanel,
  } = useNotifications();

  const [tiempoRefresh, setTiempoRefresh] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

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
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPanel(false);
      }
    };

    const cerrarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPanel(false);
    };

    document.addEventListener('mousedown', cerrarFuera);
    window.addEventListener('keydown', cerrarEscape);

    return () => {
      document.removeEventListener('mousedown', cerrarFuera);
      window.removeEventListener('keydown', cerrarEscape);
    };
  }, [openPanel, setOpenPanel]);

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
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
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
          className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-xl border border-gray-800 bg-zinc-950 shadow-2xl backdrop-blur-md"
        >
          {/* ==============================================
              CABECERA
          ============================================== */}

          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-violet-400" />
              <h3 className="text-sm font-bold text-white">Notificaciones</h3>

              {unreadCount > 0 && (
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 transition-colors hover:text-violet-300"
              >
                <CheckCheck size={12} />
                Marcar todas como leídas
              </button>
            )}
          </div>

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

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-gray-800/60 px-4 py-3 text-left transition-colors hover:bg-gray-800/50 ${
                      noLeida ? 'bg-violet-500/5' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-800 text-xs text-gray-400">
                      {n.actorAvatar ? (
                        <img
                          src={n.actorAvatar}
                          alt={n.actorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">{iconoDe(n)}</span>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{iconoDe(n)}</span>
                        <span className="truncate text-sm sm:text-xs font-semibold text-white">
                          {n.actorName}
                        </span>
                      </div>

                      <p
                        className={`mt-0.5 text-sm sm:text-xs leading-relaxed ${
                          noLeida ? 'text-gray-200' : 'text-gray-400'
                        }`}
                      >
                        {textoDe(n)}
                      </p>

                      {n.snippet && (
                        <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">
                          &quot;{n.snippet}&quot;
                        </p>
                      )}

                      <p className="mt-1 text-[10px] text-gray-500">
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
                );
              })}
          </div>

          {/* ==============================================
              PIE
          ============================================== */}

          {notifications.length > 0 && (
            <div className="border-t border-gray-800 px-4 py-2 text-center">
              <p className="text-[10px] text-gray-500">
                Las notificaciones se actualizan en tiempo real
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================================================
          AVISO: "este aviso ya no lleva a ningún sitio"
      ================================================
          Fuera del desplegable a propósito: el panel se cierra al
          navegar, así que un mensaje dentro de él no se vería. */}
      {aviso && (
        <p className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-xl border border-amber-500/30 bg-zinc-900/95 px-4 py-2.5 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur">
          {aviso}
        </p>
      )}
    </div>
  );
};
