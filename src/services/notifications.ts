import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  limit as limitQuery,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { recordListenerSnapshot, trackListener } from '../lib/firestoreDiagnostics';
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
    const meta = { name: 'notifications', collection: 'notifications', origin: 'NotificationsContext' };

    let cancelado = false;
    let peticionContador = 0;

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        recordListenerSnapshot(meta, snap.size, snap.docChanges().length);
        const notificaciones = mapWithId<AppNotification>(snap);
        const unreadCount = snap.docs.filter((d) => d.data().read !== true).length;

        if (snap.docs.length > 0) {
          const ultimo = snap.docs[snap.docs.length - 1];
          ultimoCreado = (ultimo.data().createdAt as string) ?? null;
        }

        // La lista tiene solo la primera página, así que su cuenta
        // puede quedarse corta. Se pinta ya con la cuenta local y se
        // corrige con una agregación exacta (1 lectura por 1.000
        // documentos, no un documento por notificación).
        alCambiar({
          notifications: notificaciones,
          unreadCount,
          loading: false,
          error: null,
        });

        const peticion = ++peticionContador;
        void contarNoLeidas(uid)
          .then((exactas) => {
            if (cancelado || peticion !== peticionContador) return;
            alCambiar({
              notifications: notificaciones,
              unreadCount: exactas,
              loading: false,
              error: null,
            });
          })
          .catch(() => {
            // Si la agregación falla, se conserva la cuenta local.
          });
      },
      (error) => {
        cancelado = true;
        console.error('[Notifications] Error leyendo notificaciones:', error);
        alCambiar({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: mensajeDe(error),
        });
      },
    );

    return trackListener(meta, () => {
      cancelado = true;
      unsubscribe();
    });
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
 * Cuenta exacta de notificaciones sin leer.
 *
 * La lista del panel solo trae las 20 más recientes; contar esas
 * mismas dejaría el badge corto cuando hay más. `getCountFromServer`
 * cuenta todas sin descargarlas.
 */
export function contarNoLeidas(uid: string): Promise<number> {
  return getCountFromServer(
    query(
      collection(db, 'users', uid, NOTIFICATIONS),
      where('read', '==', false),
    ),
  ).then((snap) => snap.data().count);
}

/**
 * Marca TODAS las notificaciones no leídas de un usuario como leídas,
 * no solo las que caben en el panel.
 *
 * Va por páginas de 500 (límite de un lote de Firestore). Si el
 * usuario tiene muchas, se repiten las páginas hasta vaciar las
 * pendientes.
 */
export async function marcarTodasComoLeidas(uid: string): Promise<void> {
  const ahora = new Date().toISOString();

  for (;;) {
    const pendientes = await getDocs(
      query(
        collection(db, 'users', uid, NOTIFICATIONS),
        where('read', '==', false),
        limitQuery(500),
      ),
    );

    if (pendientes.empty) return;

    const batch = writeBatch(db);
    pendientes.docs.forEach((notificacion) => {
      batch.update(notificacion.ref, { read: true, readAt: ahora });
    });
    await batch.commit();
  }
}

/** Borra una notificación concreta del usuario. */
export async function eliminarNotificacion(
  uid: string,
  notificationId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, NOTIFICATIONS, notificationId));
}

/**
 * Borra TODAS las notificaciones de un usuario por páginas.
 *
 * No carga la colección entera: pide 500, las borra en un lote y
 * repite hasta que no queda ninguna. Las notificaciones que lleguen
 * mientras tanto pueden entrar en una página posterior; el resultado
 * sigue siendo coherente porque el listener reconstruye la lista.
 */
export async function eliminarTodasNotificaciones(uid: string): Promise<void> {
  for (;;) {
    const pagina = await getDocs(
      query(
        collection(db, 'users', uid, NOTIFICATIONS),
        limitQuery(500),
      ),
    );

    if (pagina.empty) return;

    const batch = writeBatch(db);
    pagina.docs.forEach((notificacion) => {
      batch.delete(notificacion.ref);
    });
    await batch.commit();
  }
}
