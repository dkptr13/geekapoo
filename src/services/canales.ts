import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { toIsoString } from './firestoreUtils';
import type {
  Club,
  ClubChannel,
  ClubChannelVisibility,
  NuevoCanal,
  User,
} from '../types';

// ======================================================
// CANALES TEMÁTICOS DE LOS CLUBES
// ======================================================
// Estructura:
//
//   clubs/{clubId}/channels/{channelId}  -> ficha del canal
//   chats/{chatId}/messages/{messageId}  -> historial del canal
//
// Cada canal tiene su propio documento de `chats/` (con
// `type: 'club'`, `slug` del club y `channelId` del canal),
// así que REUTILIZA todo lo que ya funciona: mensajes en
// tiempo real, recibos, sin leer, encuestas, reacciones y
// moderación. Lo único nuevo es la ficha del canal y la
// pertenencia sincronizada.
//
// La pertenencia de cada chat de canal se mantiene al día
// junto con la del club (ver `clubs.ts`):
//
//   - Canales `all`: todos los miembros del club.
//   - Canales `mods`: propietario + moderadores.
//
// Así las reglas de los mensajes no cambian: quien no está en
// `memberIds` del chat no lee ni escribe, aunque sepa el id.
// ======================================================

export const CANALES = 'channels';

/** Límites configurables de los canales. */
export const CANAL_LIMITS = {
  name: { min: 1, max: 40 },
  slug: { min: 1, max: 30 },
  description: { max: 280 },
} as const;

const CANAL_SLUG_RE = /^[a-z0-9-]+$/;

export interface CanalResult {
  ok: boolean;
  error?: string;
  channelId?: string;
  chatId?: string;
}

type Speaker = Pick<User, 'uid' | 'displayName' | 'username' | 'avatarUrl'>;

const nameOf = (u: Speaker): string => u.displayName || u.username;

// ────────────────────────────────────────────────────────
// VALIDACIÓN
// ────────────────────────────────────────────────────────

/**
 * Normaliza un nombre a identificador interno de canal.
 *
 * Igual que el slug de clubes pero con su propio tope: el
 * nombre visible (`# ¡Teorías locas!`) puede llevar de todo,
 * el `id` no cambia nunca aunque se renombre el canal.
 */
export function canalSlugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CANAL_LIMITS.slug.max);
}

export function validarCanalSlug(slug: string): { ok: boolean; error?: string } {
  const clean = slug.trim().toLowerCase();

  if (!clean) return { ok: false, error: 'El identificador es obligatorio.' };
  if (clean.length < CANAL_LIMITS.slug.min) {
    return { ok: false, error: 'El identificador necesita al menos 1 carácter.' };
  }
  if (clean.length > CANAL_LIMITS.slug.max) {
    return {
      ok: false,
      error: `El identificador no puede superar los ${CANAL_LIMITS.slug.max} caracteres.`,
    };
  }
  if (!CANAL_SLUG_RE.test(clean)) {
    return { ok: false, error: 'Solo letras minúsculas, números y guiones.' };
  }
  return { ok: true };
}

function validarCanal(datos: NuevoCanal): { ok: boolean; error?: string } {
  const name = datos.name.trim();
  if (name.length < CANAL_LIMITS.name.min) {
    return { ok: false, error: 'El canal necesita un nombre.' };
  }
  if (name.length > CANAL_LIMITS.name.max) {
    return {
      ok: false,
      error: `El nombre no puede superar los ${CANAL_LIMITS.name.max} caracteres.`,
    };
  }

  const checkSlug = validarCanalSlug(datos.slug);
  if (!checkSlug.ok) return checkSlug;

  if (datos.description.length > CANAL_LIMITS.description.max) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${CANAL_LIMITS.description.max} caracteres.`,
    };
  }

  if (datos.visibility !== 'all' && datos.visibility !== 'mods') {
    return { ok: false, error: 'La visibilidad no es válida.' };
  }

  if (typeof datos.spoiler !== 'boolean') {
    return { ok: false, error: 'La opción de spoilers no es válida.' };
  }

  if (typeof datos.order !== 'number' || Number.isNaN(datos.order)) {
    return { ok: false, error: 'El orden no es válido.' };
  }

  return { ok: true };
}

// ────────────────────────────────────────────────────────
// LECTURA
// ────────────────────────────────────────────────────────

/** Convierte un documento de Firestore al tipo `ClubChannel`. */
function mapearCanal(id: string, data: Record<string, unknown>): ClubChannel {
  const d = data as Omit<ClubChannel, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: unknown;
    updatedAt?: unknown;
  };

  return {
    ...d,
    id,
    createdAt: toIsoString(d.createdAt),
    updatedAt: toIsoString(d.updatedAt),
  };
}

/** Orden estable: `order`, y en empate el más antiguo primero. */
export function ordenarCanales(canales: ClubChannel[]): ClubChannel[] {
  return [...canales].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
}

/**
 * Escucha los canales de un club, ordenados.
 *
 * Es una consulta sin filtros (toda la subcolección), así que
 * no necesita índice compuesto. Los restringidos (`mods`) los
 * filtra el cliente por rol; las reglas impiden leer su
 * contenido a quien no corresponda.
 */
export function subscribeCanales(
  clubId: string,
  onData: (canales: ClubChannel[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'clubs', clubId, CANALES),
      orderBy('order', 'asc'),
      fsLimit(50),
    ),
    (snap) => {
      onData(ordenarCanales(snap.docs.map((d) => mapearCanal(d.id, d.data()))));
    },
    (e) => onError?.(e),
  );
}

/** Lee los canales de un club (para operaciones de gestión). */
export async function listarCanales(clubId: string): Promise<ClubChannel[]> {
  const snap = await getDocs(
    query(collection(db, 'clubs', clubId, CANALES), orderBy('order', 'asc'), fsLimit(50)),
  );
  return ordenarCanales(snap.docs.map((d) => mapearCanal(d.id, d.data())));
}

/** Lee la ficha de un canal. */
export async function getCanal(clubId: string, channelId: string): Promise<ClubChannel | null> {
  const snap = await getDoc(doc(db, 'clubs', clubId, CANALES, channelId));
  if (!snap.exists()) return null;
  return mapearCanal(snap.id, snap.data());
}

/**
 * Si un uid es del equipo del club (propietario o moderador).
 *
 * Decide qué canales `mods` se le enseñan. La autoridad real
 * está en `ownerId`/`moderatorIds`, igual que en las reglas.
 */
export function esEquipoDelClub(
  club: Pick<Club, 'ownerId' | 'moderatorIds'> | null,
  uid: string | null,
): boolean {
  if (!club || !uid) return false;
  return club.ownerId === uid || (club.moderatorIds ?? []).includes(uid);
}

/** Canales que un usuario puede ver en la lista. */
export function canalesVisibles(
  canales: ClubChannel[],
  club: Pick<Club, 'ownerId' | 'moderatorIds'> | null,
  uid: string | null,
): ClubChannel[] {
  if (esEquipoDelClub(club, uid)) return canales;
  return canales.filter((c) => c.visibility === 'all');
}

// ────────────────────────────────────────────────────────
// CREAR UN CANAL
// ────────────────────────────────────────────────────────

/**
 * Crea un canal con su propio chat.
 *
 * Solo propietario o moderadores (lo comprueban las reglas;
 * aquí se valida la forma para dar errores amables). El `id`
 * del documento ES el slug: la unicidad la garantiza
 * Firestore y un slug ocupado da error antes de escribir.
 *
 * Los miembros iniciales del chat dependen de la visibilidad:
 * todos los del club, o solo el equipo para `mods`.
 */
export async function crearCanal(
  club: Club,
  creador: Speaker,
  datos: NuevoCanal,
): Promise<CanalResult> {
  const valido = validarCanal(datos);
  if (!valido.ok) return { ok: false, error: valido.error };

  const slug = datos.slug.trim().toLowerCase();
  const name = datos.name.trim();
  const description = datos.description.trim();

  // ── Club fresco: los miembros para el chat salen del
  // documento actual, no del objeto que traiga la interfaz.
  const clubSnap = await getDoc(doc(db, 'clubs', club.id));
  if (!clubSnap.exists()) return { ok: false, error: 'El club ya no existe.' };
  const fresca = clubSnap.data() as {
    members?: Record<string, unknown>;
    memberIds?: string[];
    moderatorIds?: string[];
    ownerId?: string;
    slug?: string;
    category?: Club['category'];
  };

  const todos = (fresca.memberIds ?? []).filter((m): m is string => typeof m === 'string');
  const equipo = [
    ...(typeof fresca.ownerId === 'string' ? [fresca.ownerId] : []),
    ...((fresca.moderatorIds ?? []).filter((m): m is string => typeof m === 'string')),
  ].filter((uid, i, arr) => arr.indexOf(uid) === i && todos.includes(uid));

  const iniciales = datos.visibility === 'mods' ? equipo : todos;
  if (!iniciales.includes(creador.uid)) iniciales.push(creador.uid);

  // ── Duplicados: avisa antes de escribir nada.
  const previo = await getDoc(doc(db, 'clubs', club.id, CANALES, slug));
  if (previo.exists()) {
    return { ok: false, error: 'Ya hay un canal con ese identificador en este club.' };
  }

  try {
    // El chat primero: la ficha lo referencia por id. Si la
    // ficha falla después, el chat queda huérfano pero solo lo
    // ve su creador (es el único miembro inicial garantizado).
    const chatRef = doc(collection(db, 'chats'));
    await setDoc(chatRef, {
      type: 'club',
      name,
      slug: typeof fresca.slug === 'string' ? fresca.slug : club.slug,
      channelId: slug,
      category: fresca.category ?? club.category,
      avatar: '',
      coverUrl: '',
      ownerId: creador.uid,
      memberIds: iniciales,
      hiddenFor: [],
      lastMessage: `Canal #${name} creado por ${nameOf(creador)}`,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: creador.uid,
      readAt: {},
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'clubs', club.id, CANALES, slug), {
      id: slug,
      clubId: club.id,
      chatId: chatRef.id,
      name,
      description,
      type: 'text',
      visibility: datos.visibility satisfies ClubChannelVisibility,
      spoiler: datos.spoiler,
      order: datos.order,
      createdBy: creador.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ok: true, channelId: slug, chatId: chatRef.id };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo crear el canal.') };
  }
}

// ────────────────────────────────────────────────────────
// MIGRACIÓN DEL GENERAL
// ────────────────────────────────────────────────────────

/**
 * Asegura el canal `general` en clubes anteriores a los
 * canales, reutilizando su chat histórico.
 *
 * No pierde mensajes: el `general` APUNTA al `chatId` que el
 * club ya tenía. Puede ejecutarlo cualquier miembro (las
 * reglas tienen una rama estrecha solo para este caso); si el
 * club es nuevo, `crearClub` ya lo deja creado y aquí no se
 * hace nada.
 */
export async function asegurarGeneral(
  club: Club,
  actor: Speaker,
): Promise<CanalResult> {
  try {
    const previo = await getDoc(doc(db, 'clubs', club.id, CANALES, 'general'));
    if (previo.exists()) {
      const data = previo.data() as { chatId?: string };
      return { ok: true, channelId: 'general', chatId: data.chatId };
    }

    await setDoc(doc(db, 'clubs', club.id, CANALES, 'general'), {
      id: 'general',
      clubId: club.id,
      chatId: club.chatId,
      name: 'General',
      description: 'Conversación general del club.',
      type: 'text',
      visibility: 'all' satisfies ClubChannelVisibility,
      spoiler: false,
      order: 0,
      createdBy: club.ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    void actor;
    return { ok: true, channelId: 'general', chatId: club.chatId };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo preparar el canal general.') };
  }
}

// ────────────────────────────────────────────────────────
// EDITAR, ORDENAR Y ELIMINAR
// ────────────────────────────────────────────────────────

/**
 * Edita un canal (solo equipo del club, según las reglas).
 *
 * El `id` no se toca nunca: renombrar cambia `name`. El
 * `general` sigue público siempre.
 */
export async function actualizarCanal(
  clubId: string,
  channelId: string,
  cambios: Partial<Pick<ClubChannel, 'name' | 'description' | 'visibility' | 'spoiler' | 'order'>>,
): Promise<CanalResult> {
  if (cambios.name !== undefined) {
    const name = cambios.name.trim();
    if (!name) return { ok: false, error: 'El canal necesita un nombre.' };
    if (name.length > CANAL_LIMITS.name.max) {
      return {
        ok: false,
        error: `El nombre no puede superar los ${CANAL_LIMITS.name.max} caracteres.`,
      };
    }
    cambios = { ...cambios, name };
  }

  if (cambios.description !== undefined && cambios.description.length > CANAL_LIMITS.description.max) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${CANAL_LIMITS.description.max} caracteres.`,
    };
  }

  if (
    cambios.visibility !== undefined &&
    cambios.visibility !== 'all' &&
    cambios.visibility !== 'mods'
  ) {
    return { ok: false, error: 'La visibilidad no es válida.' };
  }

  try {
    await updateDoc(doc(db, 'clubs', clubId, CANALES, channelId), {
      ...cambios,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, channelId };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo actualizar el canal.') };
  }
}

/**
 * Mueve un canal una posición arriba o abajo.
 *
 * Intercambia el `order` con el vecino: dos escrituras sin
 * transacción porque el orden es cosmético y se reordena al
 * leer de todas formas (`ordenarCanales`).
 */
export async function moverCanal(
  clubId: string,
  channelId: string,
  direccion: -1 | 1,
): Promise<CanalResult> {
  const canales = await listarCanales(clubId);
  const i = canales.findIndex((c) => c.id === channelId);
  if (i < 0) return { ok: false, error: 'El canal ya no existe.' };

  const j = i + direccion;
  if (j < 0 || j >= canales.length) {
    return { ok: false, error: direccion < 0 ? 'Ya es el primero.' : 'Ya es el último.' };
  }

  const a = canales[i];
  const b = canales[j];

  try {
    await updateDoc(doc(db, 'clubs', clubId, CANALES, a.id), {
      order: b.order,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'clubs', clubId, CANALES, b.id), {
      order: a.order,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, channelId };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo reordenar el canal.') };
  }
}

/**
 * Elimina un canal con su historial.
 *
 * Política: el historial SE ELIMINA con el canal... o mejor
 * dicho, deja de ser accesible: el chat se vacía de miembros
 * (nadie puede leerlo por rutas antiguas) y la ficha se
 * borra. Los documentos de mensajes quedan huérfanos sin
 * lectores, igual que al eliminar un club entero.
 *
 * El `general` no se puede eliminar: la interfaz no enseña el
 * botón y las reglas lo rechazan.
 */
export async function eliminarCanal(club: Club, channel: ClubChannel): Promise<CanalResult> {
  if (channel.id === 'general') {
    return { ok: false, error: 'El canal general no se puede eliminar.' };
  }

  try {
    const clubSnap = await getDoc(doc(db, 'clubs', club.id));
    const miembros = clubSnap.exists()
      ? ((clubSnap.data() as { memberIds?: string[] }).memberIds ?? [])
      : [];

    // Primero se vacía el chat: aunque algo falle después, el
    // historial ya no es legible para nadie.
    await updateDoc(doc(db, 'chats', channel.chatId), {
      memberIds: [],
      hiddenFor: miembros,
    });

    await deleteDoc(doc(db, 'clubs', club.id, CANALES, channel.id));

    return { ok: true, channelId: channel.id };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo eliminar el canal.') };
  }
}

// ────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────

function messageOf(e: unknown, fallback: string): string {
  const code = (e as { code?: string } | null)?.code ?? '';
  if (code === 'permission-denied') {
    return 'No tienes permiso para esta acción.';
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
