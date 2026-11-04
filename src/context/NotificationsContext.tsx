import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../context/AuthContext';

import {
  contarNoLeidas,
  eliminarNotificacion,
  eliminarTodasNotificaciones,
  escucharNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '../services/notifications';
import type { AppNotification } from '../types/notifications';

import type { WithId } from '../services/firestoreUtils';

// ======================================================
// CONTEXTO DE NOTIFICACIONES
// ======================================================
//
// Provee:
//   - notifications: lista en tiempo real
//   - unreadCount: contador de no leídas
//   - loading / error
//   - markAsRead(notificationId)
//   - markAllAsRead()
//   - openPanel / setOpenPanel
//
// Usa un ÚNICO listener onSnapshot por usuario. No hace polling.

export interface NotificationsContextType {
  notifications: WithId<AppNotification>[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  openPanel: boolean;
  setOpenPanel: (open: boolean) => void;

  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  /** Borra una notificación propia. `false` si Firestore la rechazó. */
  deleteNotification: (notificationId: string) => Promise<boolean>;
  /** Borra todas las notificaciones propias por páginas. */
  deleteAllNotifications: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ======================================================
// PROVIDER
// ======================================================

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();

  const [notifications, setNotifications] = useState<WithId<AppNotification>[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openPanel, setOpenPanel] = useState(false);
  // Se incrementa solo si una operación en lote falla a medias y hay
  // que volver a montar el listener para reconstruir la lista.
  const [refreshKey, setRefreshKey] = useState(0);

  // ====================================================
  // LISTENER
  // ====================================================
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    const cancelar = escucharNotificaciones(
      currentUser.uid,
      20,
      (data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setLoading(data.loading);
        setError(data.error);
      },
    );

    return cancelar;
  }, [currentUser?.uid, refreshKey]);

  // Al abrir el panel se vuelve a pedir el contador exacto. Cubre
  // cambios hechos desde otra pestaña que no entran en la página de
  // 20 avisos y, por tanto, no disparan una nueva instantánea aquí.
  useEffect(() => {
    if (!openPanel || !currentUser?.uid) return;

    let activo = true;
    void contarNoLeidas(currentUser.uid)
      .then((n) => {
        if (activo) setUnreadCount(n);
      })
      .catch(() => {
        // Si falla, se conserva el contador que ya había.
      });

    return () => {
      activo = false;
    };
  }, [openPanel, currentUser?.uid]);

  // ====================================================
  // ACCIONES
  // ====================================================

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!currentUser?.uid) return;
      try {
        await marcarComoLeida(currentUser.uid, notificationId);
      } catch (e) {
        console.error('[Notifications] Error marcando como leída:', e);
      }
    },
    [currentUser?.uid],
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;

    const antes = notifications;
    const noLeidasAntes = unreadCount;
    const ahora = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true, readAt: ahora })),
    );
    setUnreadCount(0);

    try {
      await marcarTodasComoLeidas(currentUser.uid);
    } catch (e) {
      console.error('[Notifications] Error marcando todas como leídas:', e);
      setNotifications(antes);
      setUnreadCount(noLeidasAntes);
      setError('No se pudieron marcar todas como leídas.');
      setRefreshKey((n) => n + 1);
    }
  }, [currentUser?.uid, notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (notificationId: string): Promise<boolean> => {
      if (!currentUser?.uid) return false;

      const objetivo = notifications.find((n) => n.id === notificationId);
      if (!objetivo) return true;

      const eraNoLeida = !objetivo.read;
      if (eraNoLeida) setUnreadCount((n) => Math.max(0, n - 1));

      try {
        await eliminarNotificacion(currentUser.uid, notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        return true;
      } catch (e) {
        console.error('[Notifications] Error eliminando una notificación:', e);
        if (eraNoLeida) setUnreadCount((n) => n + 1);
        setError('No se pudo eliminar la notificación.');
        return false;
      }
    },
    [currentUser?.uid, notifications],
  );

  const deleteAllNotifications = useCallback(async (): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    const antes = notifications;
    const noLeidasAntes = unreadCount;

    setNotifications([]);
    setUnreadCount(0);

    try {
      await eliminarTodasNotificaciones(currentUser.uid);
      return true;
    } catch (e) {
      console.error('[Notifications] Error eliminando todas las notificaciones:', e);
      setNotifications(antes);
      setUnreadCount(noLeidasAntes);
      setError('No se pudieron eliminar todas las notificaciones.');
      setRefreshKey((n) => n + 1);
      return false;
    }
  }, [currentUser?.uid, notifications, unreadCount]);

  // ====================================================
  // VALOR
  // ====================================================

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      openPanel,
      setOpenPanel,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      openPanel,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// ======================================================
// HOOK
// ======================================================

export const useNotifications = (): NotificationsContextType => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications debe usarse dentro de un NotificationsProvider');
  }
  return ctx;
};
