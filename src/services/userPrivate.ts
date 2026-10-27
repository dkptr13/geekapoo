import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import type {
  PrivacySettings,
  User,
  UserPrivateData,
} from '../types';

// ======================================================
// DATOS PRIVADOS DEL USUARIO
// ======================================================
//
// `users/{uid}` es un documento PÚBLICO: lo lee cualquier persona
// con sesión para pintar perfiles, directorios y avatares. Por eso
// no puede contener el correo, la apariencia del chat, la región ni
// los ajustes de privacidad.
//
// Esos datos viven en `userPrivate/{uid}`, una colección plana:
//
//   · el dueño puede leer y escribir su documento;
//   · un admin puede leerlos (el panel enseña el correo);
//   · un moderador NO puede leerlos;
//   · nadie más puede leerlos.
//
// La colección es plana (no una subcolección de `users`) para que
// el panel pueda listar los correos con una sola consulta. Una
// subcolección habría exigido un collectionGroup y reglas más
// frágiles para la misma información.
//
// Aquí NO se guarda `isBanned`: la fuente de verdad de las
// sanciones es `accountRestrictions/{uid}` y no se toca.
// ======================================================

export const USER_PRIVATE = 'userPrivate';

/** Campos que nunca deben escribirse en `users/{uid}`. */
export const PRIVATE_PROFILE_FIELDS = [
  'email',
  'profileVisibility',
  'allowChatRequests',
  'showActivity',
  'regionPreferida',
  'chatApariencia',
] as const;

export type PrivateProfileField = (typeof PRIVATE_PROFILE_FIELDS)[number];

/**
 * Copia de un perfil sin los campos que pertenecen a `userPrivate`.
 *
 * Se usa antes de guardar el perfil público y también al leerlo:
 * mientras la migración termina, un documento antiguo puede
 * conservar el correo o las preferencias, y no queremos que se
 * cuelen en el estado del directorio ni en el panel de moderación.
 */
export function soloCamposPublicos(perfil: User): Record<string, unknown> {
  const publico: Record<string, unknown> = { ...perfil };
  PRIVATE_PROFILE_FIELDS.forEach((campo) => {
    delete publico[campo];
  });
  delete publico.isBanned;
  return publico;
}

export function userPrivateRef(uid: string) {
  return doc(db, USER_PRIVATE, uid);
}

/** Lee una sola vez el documento privado. */
export async function getUserPrivate(
  uid: string,
): Promise<UserPrivateData | null> {
  const snap = await getDoc(userPrivateRef(uid));
  return snap.exists() ? (snap.data() as UserPrivateData) : null;
}

/** Escucha el documento privado propio. */
export function subscribeUserPrivate(
  uid: string,
  onData: (data: UserPrivateData | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    userPrivateRef(uid),
    (snap) => onData(snap.exists() ? (snap.data() as UserPrivateData) : null),
    (error) => onError?.(error),
  );
}

/**
 * Vuelca los datos privados en el objeto `User` que usa la interfaz.
 *
 * No se usa para `usersList`: el directorio público no debe recibir
 * correos ni preferencias. Solo se usa para `currentUser`.
 */
export function privateFieldsOf(
  data: UserPrivateData | null | undefined,
): Partial<User> {
  if (!data) return {};

  const privacy = data.privacy ?? {};

  return {
    email: data.email,
    profileVisibility: privacy.profileVisibility,
    allowChatRequests: privacy.allowChatRequests,
    showActivity: privacy.showActivity,
    chatApariencia: data.chatApariencia ?? null,
    regionPreferida: data.regionPreferida,
  };
}

/** Las dos señales públicas que sí pueden vivir en `users/{uid}`. */
export function publicPrivacySignals(
  privacy: PrivacySettings,
): Pick<User, 'privateProfile' | 'activityHidden'> {
  return {
    privateProfile: privacy.profileVisibility === 'private',
    activityHidden: !privacy.showActivity,
  };
}

/**
 * Guarda el documento privado sin tocar el público.
 *
 * Para los cambios de privacidad se usa un lote desde AuthContext,
 * porque hay que actualizar a la vez las dos señales públicas. Esta
 * función es para escrituras que solo afectan a datos privados,
 * como el correo.
 */
export async function saveUserPrivate(
  uid: string,
  data: Partial<UserPrivateData>,
): Promise<void> {
  await setDoc(
    userPrivateRef(uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
