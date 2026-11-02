import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { recordListenerSnapshot, trackListener } from '../lib/firestoreDiagnostics';
import type { PresenceInfo } from '../utils/presence';
import { toIsoString } from './firestoreUtils';

// ======================================================
// PRESENCIA
// ======================================================
//
// Un documento pequeño por usuario:
//
//   presence/{uid} = { online, lastSeenAt }
//
// El cliente escribe solo su propio documento. Para saber si alguien
// está conectado no basta con `online`: también se exige que el último
// latido sea reciente. Así una pestaña cerrada de golpe termina
// apareciendo desconectada aunque no llegue a escribir `online:false`.

export const PRESENCE = 'presence';
export const HEARTBEAT_MS = 60_000;

export async function marcarPresencia(uid: string, online: boolean): Promise<void> {
  if (!uid) return;
  await setDoc(
    doc(db, PRESENCE, uid),
    {
      online,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Escucha la presencia de una lista de personas. Firestore permite
 * hasta 30 ids por `in`, así que se reparte en bloques.
 */
export function subscribePresence(
  uids: string[],
  onData: (presence: Record<string, PresenceInfo>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const ids = [...new Set(uids.filter(Boolean))].sort();
  if (ids.length === 0) {
    onData({});
    return () => undefined;
  }

  const acumulado: Record<string, PresenceInfo> = {};
  const unsubs: Unsubscribe[] = [];
  const meta = { name: 'presence', collection: PRESENCE, origin: 'ChatView' };

  for (let i = 0; i < ids.length; i += 30) {
    const grupo = ids.slice(i, i + 30);
    const unsubscribe = onSnapshot(
      query(collection(db, PRESENCE), where(documentId(), 'in', grupo)),
      (snap) => {
        recordListenerSnapshot(meta, snap.size, snap.docChanges().length);
        const presentes = new Set(snap.docs.map((d) => d.id));
        grupo.forEach((uid) => {
          if (!presentes.has(uid)) delete acumulado[uid];
        });
        snap.docs.forEach((d) => {
          const data = d.data() as { online?: unknown; lastSeenAt?: unknown };
          const lastSeenAt = toIsoString(data.lastSeenAt);
          acumulado[d.id] = {
            online: data.online === true,
            lastSeenAt: lastSeenAt || null,
          };
        });
        onData({ ...acumulado });
      },
      (e) => onError?.(e),
    );
    unsubs.push(trackListener(meta, unsubscribe));
  }

  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}
