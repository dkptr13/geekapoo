import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../context/AuthContext';

import {
  escucharNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '../services/notifications';
import type { AppNotification } from '../types/notifications';

import { withId, type WithId } from '../services/firestoreUtils';

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
  }, [currentUser?.uid]);

  // ====================================================
  // ACCIONES
  // ====================================================

  const markAsRead = async (notificationId: string) => {
    if (!currentUser?.uid) return;
    try {
      await marcarComoLeida(currentUser.uid, notificationId);
    } catch (e) {
      console.error('[Notifications] Error marcando como leída:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.uid) return;
    try {
      await marcarTodasComoLeidas(currentUser.uid, notifications);
    } catch (e) {
      console.error('[Notifications] Error marcando todas como leídas:', e);
    }
  };

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
    }),
    [notifications, unreadCount, loading, error, openPanel, markAsRead, markAllAsRead],
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
