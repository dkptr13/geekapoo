import {
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

export { Timestamp };

// ======================================================
// UTILIDADES COMPARTIDAS DE FIRESTORE
// ======================================================

export type WithId<T> = T & { id: string };

// Campos de fecha que se convierten a texto ISO al leer.
//
// OJO: "lastSeen" NO está en la lista a propósito. En este proyecto
// no es una fecha, es texto ya formateado ("En línea", "Hace 5m",
// "Ayer"). Si se intentara convertir, toDate("En línea") daría null y
// el campo se quedaría vacío.
const DATE_FIELDS = ['createdAt', 'updatedAt', 'lastMessageAt', 'deletedAt', 'editedAt'] as const;

/**
 * Convierte cualquier formato de fecha de Firestore a un objeto Date.
 *
 * Por qué existe: en Firestore las fechas son objetos `Timestamp`, y
 * `new Date(unTimestamp)` devuelve `Invalid Date` porque `Timestamp.valueOf()`
 * devuelve un string tipo "000001758851200.000000000" en lugar de un número.
 */
export function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  if (typeof value === 'string') {
    if (value.trim() === '') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Timestamp serializado (por ejemplo tras pasar por JSON)
  if (value && typeof value === 'object' && 'seconds' in value) {
    const v = value as { seconds: number; nanoseconds?: number };
    return new Date(v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1e6));
  }

  return null;
}

/** Igual que toDate pero devuelve siempre texto ISO, para pintar en la interfaz. */
export function toIsoString(value: unknown): string {
  return toDate(value)?.toISOString() ?? '';
}

/** Marca si el usuario ya le dio "me gusta" a este elemento. */
export function hasLiked(item: { likedBy?: string[] } | null | undefined, uid: string | undefined): boolean {
  if (!uid || !item?.likedBy) return false;
  return item.likedBy.includes(uid);
}

/**
 * Mapea un snapshot de Firestore a un objeto con `id` incluido
 * y las fechas convertidas a texto ISO.
 *
 * Sin esto, `onSnapshot(d => d.data())` pierde el id del documento
 * y `new Date(doc.createdAt)` devuelve Invalid Date.
 */
export function withId<T>(snap: QueryDocumentSnapshot<DocumentData>): WithId<T> {
  const data = { ...(snap.data() as Record<string, unknown>) };

  DATE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) data[field] = toIsoString(data[field]);
  });

  return { ...data, id: snap.id } as WithId<T>;
}

/** Igual que withId pero para un snapshot completo. */
export function mapWithId<T>(snap: QuerySnapshot<DocumentData>): WithId<T>[] {
  return snap.docs.map((d) => withId<T>(d));
}

/**
 * Da o quita "me gusta" de forma atómica.
 *
 * El código anterior hacía esto (CommunityContext.tsx:278):
 *   1. lee el documento
 *   2. calcula el array en memoria
 *   3. lo escribe
 * Si dos personas pulsan a la vez, la segunda lectura pisa a la primera
 * y se pierde un "me gusta". `runTransaction` reintenta solo si alguien
 * escribió mientras tanto, así que nunca se pierde ninguno.
 *
 * El contador SIEMPRE se deriva de la longitud de likedBy, nunca se
 * incrementa por separado. Así no puede existir un desajuste entre lo
 * quedice el número y lo que dicen los usuarios, y un contenido sin
 * nadie que lo haya marcado muestra 0.
 */
export async function toggleLike(
  ref: DocumentReference,
  uid: string,
  counterField: string = 'likesCount',
): Promise<boolean> {
  let nowLiked = false;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('El elemento ya no existe.');

    const data = snap.data() as Record<string, unknown>;
    const likedBy: string[] = Array.isArray(data.likedBy) ? (data.likedBy as string[]) : [];

    const alreadyLiked = likedBy.includes(uid);
    nowLiked = !alreadyLiked;

    const nextLikedBy = alreadyLiked
      ? likedBy.filter((id) => id !== uid)
      : [...likedBy, uid];

    tx.update(ref, {
      likedBy: nextLikedBy,
      [counterField]: nextLikedBy.length,
    });
  });

  return nowLiked;
}

export { serverTimestamp };
