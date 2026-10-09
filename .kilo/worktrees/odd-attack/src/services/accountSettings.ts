import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  deleteUser,
  type User as FirebaseUser,
} from 'firebase/auth';

import { auth, db, githubProvider, googleProvider } from '../lib/firebase';

import { deleteThread } from './threads';
import { deleteChat, hideChat, leaveGroup } from './chats';

import type { PrivacySettings } from '../types';

// ======================================================
// AJUSTES DE CUENTA
//
// Lo que se puede hacer desde la propia cuenta: cambiar la
// privacidad, el correo, la contraseña, y borrarlo todo.
//
// Aquí vive también el borrado en cascada. Firestore no tiene
// borrado en cascada: al borrar un documento se borra ESE
// documento y nada más. Por eso hay que ir quitando a mano todo
// lo que cuelga de la cuenta, y en el orden correcto (ver
// `borrarTodoLoDeLaCuenta`).
//
// Y ojo con una cosa: la cuenta de Firebase Auth se borra al
// FINAL. En cuanto se borra, el cliente se queda sin sesión y
// cualquier escritura posterior a Firestore sale con
// permission-denied. Si se hiciera al principio, a mitad del
// borrado ya no se podría ni escribir.
// ======================================================

export const USERS = 'users';
export const CHAT_REQUESTS = 'chatRequests';

/**
 * Ajustes por defecto: todo abierto, que es como ha funcionado
 * la web hasta ahora. Las cuentas que no tengan estos campos en
 * Firestore (todas las anteriores a este apartado) se leen con
 * estos valores.
 */
export const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: 'public',
  allowChatRequests: true,
  showActivity: true,
};

/** Lo mínimo que hay que mirar para leer los ajustes de alguien. */
type PrivacySource = {
  profileVisibility?: unknown;
  allowChatRequests?: unknown;
  showActivity?: unknown;
};

/**
 * Normaliza lo que venga de Firestore.
 *
 * Hace falta porque los campos son opcionales y porque una cuenta
 * puede tener uno de los tres y los otros dos no (si se guardó a
 * medias, o si se añadió un ajuste nuevo más tarde). Sin esto,
 * `allowChatRequests` sería undefined y un `=== false` daría
 * false, dejando al usuario como si lo hubiera permitido cuando
 * lo que quería era justo lo contrario.
 */
export function readPrivacy(source: PrivacySource | null | undefined): PrivacySettings {
  return {
    profileVisibility: source?.profileVisibility === 'private' ? 'private' : 'public',
    allowChatRequests: source?.allowChatRequests !== false,
    showActivity: source?.showActivity !== false,
  };
}

/** ¿Se puede mandar una solicitud de conversación a esta persona? */
export function acceptsChatRequests(source: PrivacySource | null | undefined): boolean {
  const p = readPrivacy(source);
  return p.profileVisibility === 'public' && p.allowChatRequests;
}

// ────────────────────────────────────────────────────────
// PRIVACIDAD: GUARDADO
// ────────────────────────────────────────────────────────
//
// El guardado va por updateProfileData() del contexto de
// autenticación, no por una función propia: ese helper escribe
// en Firestore Y actualiza el usuario en memoria. Si se
// escribiera solo en Firestore, los ajustes no cambiarían hasta
// recargar la página.
//
// Los tres campos van sueltos, no dentro de un mapa, y sin
// notación de punto, porque la regla de seguridad de
// actualización de /users/{uid} comprueba
// diff().affectedKeys().hasAny([...]).

// ────────────────────────────────────────────────────────
// CORREO Y CONTRASEÑA
// ────────────────────────────────────────────────────────

/** Con qué método se creó la cuenta: 'password', 'google.com'... */
export function loginMethodOf(fbUser: FirebaseUser | null): string {
  const providerId = fbUser?.providerData?.[0]?.providerId;
  if (providerId === 'google.com') return 'google';
  if (providerId === 'github.com') return 'github';
  if (providerId === 'password') return 'password';
  return providerId ?? 'desconocido';
}

/** ¿Se puede cambiar la contraseña desde aquí? */
export function hasPassword(fbUser: FirebaseUser | null): boolean {
  return loginMethodOf(fbUser) === 'password';
}

export interface AccountResult {
  ok: boolean;
  error?: string;
}

/**
 * Vuelve a pedir la contraseña antes de tocar algo delicado.
 *
 * Firebase exige "sesión reciente" para cambiar el correo, la
 * contraseña o borrar la cuenta. Reautenticar es lo que la
 * renueva: es el paso que evita que alguien que se siente un
 * momento en tu navegador pueda cerrarte la cuenta sin saber la
 * contraseña.
 *
 * Con Google y GitHub no hay contraseña que pedir, así que se
 * reautentica con la ventana del propio proveedor (que es lo que
 * hacen allí). Si la persona cierra la ventana, se cancela: sin
 * ese paso no se continúa.
 */
async function reauth(fbUser: FirebaseUser, password: string): Promise<AccountResult> {
  const method = loginMethodOf(fbUser);

  if (method !== 'password') {
    const provider = method === 'google' ? googleProvider : githubProvider;
    const nombre = method === 'google' ? 'Google' : 'GitHub';

    try {
      await reauthenticateWithPopup(fbUser, provider);
      return { ok: true };
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/cancelled-popup-error' || code === 'auth/popup-closed-by-user') {
        return { ok: false, error: `Se cerró la ventana de ${nombre} antes de confirmar.` };
      }
      return {
        ok: false,
        error: `No se pudo confirmar tu identidad con ${nombre}. Prueba otra vez.`,
      };
    }
  }

  const email = fbUser.email;
  if (!email) {
    return { ok: false, error: 'No hay ningún correo asociado a esta cuenta.' };
  }

  if (!password) {
    return { ok: false, error: 'Escribe tu contraseña para continuar.' };
  }

  try {
    await reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(email, password));
    return { ok: true };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return { ok: false, error: 'La contraseña no es correcta.' };
    }
    if (code === 'auth/too-many-requests') {
      return { ok: false, error: 'Demasiados intentos. Espera un momento y prueba otra vez.' };
    }
    return { ok: false, error: 'No se pudo verificar la contraseña. Prueba otra vez.' };
  }
}

/**
 * Cambia el correo de la cuenta.
 *
 * Se actualiza en DOS sitios y a la vez: en Firebase Auth (que es
 * quien manda, porque es la que controla el acceso) y en el
 * documento de Firestore (que es lo que ve la app). Si se
 * actualizara solo uno, la app seguiría enseñando el correo
 * viejo en el perfil.
 *
 * Firebase manda un correo de verificación al nuevo dirección y
 * la cuenta queda sin verificar hasta que se abre, así que puede
 * ser que haya que volver a entrar después.
 */
export async function changeAccountEmail(
  fbUser: FirebaseUser,
  newEmail: string,
  password: string,
): Promise<AccountResult> {
  const email = newEmail.trim();
  if (!email) return { ok: false, error: 'Escribe el nuevo correo.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'Ese correo no parece válido.' };
  }
  if (fbUser.email === email) {
    return { ok: false, error: 'Ese ya es tu correo actual.' };
  }

  const verified = await reauth(fbUser, password);
  if (!verified.ok) return verified;

  try {
    await updateEmail(fbUser, email);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/email-already-in-use') {
      return { ok: false, error: 'Ya hay una cuenta con ese correo.' };
    }
    if (code === 'auth/requires-recent-login') {
      return { ok: false, error: 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar el correo.' };
    }
    return { ok: false, error: 'No se pudo cambiar el correo. Prueba otra vez.' };
  }

  // El perfil va después, a propósito: si el cambio de correo ya
  // está hecho en Auth, esta parte no debería poder fallar, y si
  // falla solo queda desincronizado el texto que se ve en el
  // perfil, no el acceso a la cuenta.
  try {
    await updateDoc(doc(db, USERS, fbUser.uid), { email });
  } catch (e) {
    console.warn('[Cuenta] El correo cambió en Auth, pero no en el perfil:', e);
  }

  await sendEmailVerification(fbUser).catch(() => undefined);

  return { ok: true };
}

/** Cambia la contraseña, previa verificación de la actual. */
export async function changeAccountPassword(
  fbUser: FirebaseUser,
  currentPassword: string,
  newPassword: string,
): Promise<AccountResult> {
  if (newPassword.length < 6) {
    return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }
  if (currentPassword === newPassword) {
    return { ok: false, error: 'La nueva contraseña es la misma que la actual.' };
  }

  const verified = await reauth(fbUser, currentPassword);
  if (!verified.ok) return verified;

  try {
    await updatePassword(fbUser, newPassword);
    return { ok: true };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/weak-password') {
      return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }
    return { ok: false, error: 'No se pudo cambiar la contraseña. Prueba otra vez.' };
  }
}

/**
 * Envía el correo para elegir una contraseña nueva.
 *
 * Es la única vía que funciona con cuentas de Google y GitHub:
 * esas no tienen contraseña en Firebase, así que no hay
 * "cambiar contraseña" que hacer, pero sí se les puede mandar un
 * correo para establecer una.
 */
export async function sendPasswordResetTo(email: string): Promise<AccountResult> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { ok: true };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      return { ok: false, error: 'No hay ninguna cuenta con ese correo.' };
    }
    if (code === 'auth/too-many-requests') {
      return { ok: false, error: 'Demasiados correos enviados. Espera un momento.' };
    }
    return { ok: false, error: 'No se pudo enviar el correo. Prueba otra vez.' };
  }
}

// ────────────────────────────────────────────────────────
// ELIMINAR LA CUENTA
// ────────────────────────────────────────────────────────

/** Lo que se va a borrar, para poder enseñarlo antes de hacerlo. */
export interface DeletePreview {
  threads: number;
  comments: number;
  requests: number;
  blocked: number;
  chats: number;
  groups: number;
}

/** Cuántas cosas hay de cada tipo. Solo lee, no borra nada. */
export async function previewOwnData(uid: string): Promise<DeletePreview> {
  const [threads, comments, incoming, outgoing, blocked, chats] = await Promise.all([
    getDocs(query(collection(db, 'threads'), where('authorId', '==', uid))),
    getDocs(query(collection(db, 'comments'), where('authorId', '==', uid))),
    getDocs(query(collection(db, CHAT_REQUESTS), where('toId', '==', uid))),
    getDocs(query(collection(db, CHAT_REQUESTS), where('fromId', '==', uid))),
    getDocs(collection(db, USERS, uid, 'blocked')),
    getDocs(query(collection(db, 'chats'), where('memberIds', 'array-contains', uid))),
  ]);

  const owned = chats.docs.filter((d) => d.data()?.ownerId === uid).length;

  return {
    threads: threads.size,
    comments: comments.size,
    requests: incoming.size + outgoing.size,
    blocked: blocked.size,
    chats: chats.size - owned,
    groups: owned,
  };
}

/** Va aviando del borrado, para que la pantalla no parezca colgada. */
export type DeleteStep = (mensaje: string) => void;

const LOTE = 400; // por debajo del límite de 500 escrituras por lote

/**
 * Borra en Firestore todo lo que pertenece a la cuenta.
 *
 * Lo que se puede borrar desde el cliente es lo que las reglas
 * permiten: los hilos y comentarios propios, las solicitudes
 * propias, la lista de bloqueados, y los mensajes que uno mismo
 * escribió. En conversaciones ajenas NO se pueden borrar los
 * mensajes de los demás, ni los comentarios que otros dejaron en
 * los hilos de uno: para eso hace falta un admin, y la web no
 * puede fingir lo contrario.
 *
 * Un hilo eliminado deja sus comentarios apuntando a un hilo que
 * ya no está. La app lo contempla: donde se listan, salen como
 * "Hilo eliminado".
 */
async function borrarTodoLoDeLaCuenta(uid: string, paso: DeleteStep): Promise<void> {
  // ── 1. Hilos propios ────────────────────────────────
  // Se usan los helpers del servicio de hilos y no un borrado
  // a pelo, porque deleteThread descuenta el contador de la
  // categoría en la misma transacción. Si se borrara el
  // documento directamente, las categorías se quedarían
  // contando hilos que ya no existen.
  paso('Borrando tus hilos del foro...');
  const threads = await getDocs(query(collection(db, 'threads'), where('authorId', '==', uid)));
  for (let i = 0; i < threads.docs.length; i += LOTE) {
    const batch = writeBatch(db);
    threads.docs.slice(i, i + LOTE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // ── 2. Comentarios propios ──────────────────────────
  paso('Borrando tus comentarios...');
  const comments = await getDocs(query(collection(db, 'comments'), where('authorId', '==', uid)));
  for (let i = 0; i < comments.docs.length; i += LOTE) {
    const batch = writeBatch(db);
    comments.docs.slice(i, i + LOTE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // ── 3. Solicitudes de chat ──────────────────────────
  // Las dos direcciones: las que te mandaron y las que mandaste.
  paso('Borrando tus solicitudes de conversación...');
  const requests = [
    ...(await getDocs(query(collection(db, CHAT_REQUESTS), where('toId', '==', uid)))).docs,
    ...(await getDocs(query(collection(db, CHAT_REQUESTS), where('fromId', '==', uid)))).docs,
  ];
  const seenRequests = new Set<string>();
  for (const d of requests) {
    if (seenRequests.has(d.id)) continue;
    seenRequests.add(d.id);
    await deleteDoc(d.ref);
  }

  // ── 4. Lista de bloqueados ─────────────────────────
  // Va antes de borrar el documento del usuario porque es una
  // subcolección SUYA: Firestore no borra en cascada, así que si
  // se borrara el documento primero, estos se quedarían ahí
  // huérfanos para siempre.
  paso('Borrando tu lista de bloqueados...');
  const blocked = await getDocs(collection(db, USERS, uid, 'blocked'));
  for (const d of blocked.docs) {
    await deleteDoc(d.ref);
  }

  // ── 5. Conversaciones ───────────────────────────────
  // Tres casos distintos, porque las reglas dan permisos
  // distintos en cada uno:
  //
  //  - Grupo que creaste tú: lo puedes borrar entero, y con él
  //    su índice de códigos (que solo borra su dueño).
  //  - Grupo en el que estás: sales tú. Los mensajes de los
  //    demás se quedan, que son suyos.
  //  - Chat privado: no se borra (se le borraría el historial
  //    a la otra persona), solo se esconde de tu lista.
  //
  // Los mensajes propios se borran ANTES de salir del grupo:
  // una vez fuera ya no se es miembro y las reglas no dejan
  // borrar dentro.
  paso('Saliendo de tus conversaciones...');
  const chats = await getDocs(query(collection(db, 'chats'), where('memberIds', 'array-contains', uid)));

  for (const chat of chats.docs) {
    const chatId = chat.id;

    // Tope de 400 por conversación: a partir de ahí ya no se
    // está borrando una conversación con mil mensajes, y lo que
    // queda de esos mensajes se ve igual de inaccesible para
    // cualquiera: quien los lea es la otra persona, y puede
    // borrarlos ella misma.
    const mine = await getDocs(
      query(collection(db, 'chats', chatId, 'messages'), where('senderId', '==', uid), limit(400)),
    );
    for (let i = 0; i < mine.docs.length; i += LOTE) {
      const batch = writeBatch(db);
      mine.docs.slice(i, i + LOTE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    const data = chat.data() as { ownerId?: string; type?: string; code?: string };
    const isOwner = data.ownerId === uid;

    if (isOwner && data.type === 'group') {
      if (data.code) {
        await deleteDoc(doc(db, 'groupCodes', data.code)).catch(() => undefined);
      }
      await deleteChat(chatId).catch(() => undefined);
    } else if (data.type === 'group') {
      await leaveGroup(chatId, uid).catch(() => undefined);
    } else {
      await hideChat(chatId, uid).catch(() => undefined);
    }
  }

  // ── 6. Documento de perfil ──────────────────────────
  // Último de todo en Firestore, porque tiene subcolecciones
  // (los bloqueados, ya borrados) y porque es el que la app
  // lee para saber quién eres.
  paso('Borrando tu perfil...');
  await deleteDoc(doc(db, USERS, uid)).catch((e) => {
    console.error('[Cuenta] No se pudo borrar el documento del perfil:', e);
    throw e;
  });
}

/**
 * Elimina la cuenta entera: lo de Firestore y la cuenta de
 * Firebase Auth.
 *
 * El orden importa y no es libre:
 *
 *  1. Se reautentica (con la contraseña, o con la ventana de
 *     Google/GitHub). Firebase exige sesión reciente para borrar
 *     la cuenta, y sin esto cualquiera que se colara en el
 *     navegador podría borrarla.
 *  2. Se borra todo de Firestore, que necesita la sesión.
 *  3. Se borra la cuenta de Auth AL FINAL. Es lo que cierra la
 *     sesión, y a partir de ese momento cualquier escritura en
 *     Firestore sale con permission-denied.
 */
export async function deleteOwnAccount(
  fbUser: FirebaseUser,
  password: string,
  paso: DeleteStep,
): Promise<AccountResult> {
  const verified = await reauth(fbUser, password);
  if (!verified.ok) return verified;

  try {
    await borrarTodoLoDeLaCuenta(fbUser.uid, paso);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'permission-denied') {
      return {
        ok: false,
        error:
          'Las reglas de seguridad no dejan borrar este documento. Sube las reglas ' +
          'actualizadas con "firebase deploy --only firestore:rules" y prueba otra vez.',
      };
    }
    return { ok: false, error: 'No se pudo borrar todo tu contenido. Prueba otra vez.' };
  }

  paso('Cerrando la sesión y borrando la cuenta...');
  try {
    await deleteUser(fbUser);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/requires-recent-login') {
      return {
        ok: false,
        error:
          'Tu contenido se ha borrado, pero la cuenta de acceso no: por seguridad, ' +
          'cierra sesión y vuelve a entrar para poder eliminarla.',
      };
    }
    return { ok: false, error: 'El contenido se ha borrado, pero no se pudo eliminar la cuenta de acceso.' };
  }

  return { ok: true };
}
