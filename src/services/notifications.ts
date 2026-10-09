import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  limit as limitQuery,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { mapWithId, toIsoString, WithId } from './firestoreUtils';
import type { AppNotification } from '../types/notifications';

// ======================================================
// SERVICIO DE NOTIFICACIONES
// ======================================================
//
// Solo LEE notificaciones desde el cliente y marca como leídas.
// Las notificaciones las CREA la Cloud Function con el Admin SDK.
// Las reglas de Firestore lo impiden, y es lo que evita el spam.

const NOTIFICATIONS = 'notifications';

// ======================================================
// LECTURA EN TIEMPO REAL
// ======================================================

/**
 * Escucha las notificaciones de un usuario en tiempo real.
 *
 * @param uid        Dueño de las notificaciones. `null` cancela.
 * @param pageSize   Cuántas cargar de golpe.
 * @param alCambiar  Se llama con la lista completa y el contador.
 * @returns Función para cancelar la suscripción.
 */
export function escucharNotificaciones(
  uid: string | null,
  pageSize: number,
  alCambiar: (data: {
    notifications: WithId<AppNotification>[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
  }) => void,
): () => void {
  if (!uid) {
    alCambiar({ notifications: [], unreadCount: 0, loading: false, error: null });
    return () => {};
  }

  let pageSizeActual = pageSize;
  let ultimoCreado: string | null = null;

  const cargar = () => {
    alCambiar({
      notifications: [],
      unreadCount: 0,
      loading: true,
      error: null,
    });

    const constraints: any[] = [
      orderBy('createdAt', 'desc'),
      limitQuery(pageSizeActual),
    ];

    if (ultimoCreado) {
      constraints.push(startAfter(ultimoCreado));
    }

    const q = query(collection(db, 'users', uid, NOTIFICATIONS), ...constraints);

    return onSnapshot(
      q,
      (snap) => {
        const notificaciones = mapWithId<AppNotification>(snap);
        const unreadCount = snap.docs.filter((d) => d.data().read !== true).length;

        if (snap.docs.length > 0) {
          const ultimo = snap.docs[snap.docs.length - 1];
          ultimoCreado = (ultimo.data().createdAt as string) ?? null;
        }

        alCambiar({
          notifications: notificaciones,
          unreadCount,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('[Notifications] Error leyendo notificaciones:', error);
        alCambiar({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: mensajeDe(error),
        });
      },
    );
  };

  const unsubscribe = cargar();

  return () => {
    unsubscribe();
    ultimoCreado = null;
  };
}

// ======================================================
// ERRORES
// ======================================================

/**
 * Traduce el error de Firestore a algo que se pueda leer.
 *
 * Sin esto, la campana enseña el mensaje crudo del servidor
 * ("Missing or insufficient permissions"), que no dice nada: no
 * se sabe si es que las reglas están sin desplegar, si la sesión
 * ha caducado o si es un fallo de verdad.
 */
function mensajeDe(error: unknown): string {
  const crudo = error instanceof Error ? error.message : String(error);

  // Lo primero es lo más probable: las reglas de `firestore.rules`
  // siguen en el servidor sin el bloque de notificaciones.
  if (crudo.includes('permission-denied') || crudo.includes('Missing or insufficient')) {
    return (
      'No se pudieron leer tus notificaciones: las reglas de seguridad no lo permiten. ' +
      'Si acabas de tocar firestore.rules, falta desplegarlas con ' +
      '`npx firebase deploy --only firestore:rules`.'
    );
  }

  if (crudo.includes('offline') || crudo.includes('unavailable')) {
    return 'Sin conexión con el servidor. Los avisos se recuperarán solos al volver.';
  }

  return 'No se pudieron leer tus notificaciones.';
}

// ======================================================
// MARCAR COMO LEÍDA
// ======================================================

/**
 * Marca UNA notificación como leída.
 */
export async function marcarComoLeida(
  uid: string,
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, NOTIFICATIONS, notificationId), {
    read: true,
    readAt: new Date().toISOString(),
  });
}

/**
 * Marca TODAS las notificaciones no leídas de un usuario como leídas.
 *
 * Lo hace en un lote de hasta 500 (el límite de Firestore).
 */
export async function marcarTodasComoLeidas(
  uid: string,
  notificaciones: WithId<AppNotification>[],
): Promise<void> {
  const pendientes = notificaciones.filter((n) => !n.read);

  if (pendientes.length === 0) return;

  const ahora = new Date().toISOString();

  // Firestore limita los lotes a 500 operaciones.
  const lotes: WithId<AppNotification>[][] = [];
  for (let i = 0; i < pendientes.length; i += 500) {
    lotes.push(pendientes.slice(i, i + 500));
  }

  for (const lote of lotes) {
    const batch = writeBatch(db);
    lote.forEach((n) => {
      const ref = doc(db, 'users', uid, NOTIFICATIONS, n.id);
      batch.update(ref, { read: true, readAt: ahora });
    });
    await batch.commit();
  }
}
