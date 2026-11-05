import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../lib/firebase';
import { toIsoString } from './firestoreUtils';
import { deleteStoredImage, storagePathFromUrl } from './imageUpload';
import { listarCanales } from './canales';
import type {
  Club,
  ClubCategory,
  ClubChannel,
  ClubListing,
  ClubMember,
  ClubRequest,
  ClubRole,
  User,
} from '../types';

// ======================================================
// CLUBES EN FIRESTORE
// ======================================================
// Estructura:
//   clubs/{clubId}                      -> ficha del club
//   clubs/{clubId}/requests/{reqId}     -> solicitudes pendientes
//   chats/{chatId}/messages/{messageId} -> mensajes (misma colección
//                                          que los chats privados)
//
// El club referencia un documento de `chats` (chatId) para
// reutilizar el sistema de mensajería existente. La
// pertenencia se guarda en DOS sitos a propósito:
//
//   - `clubs/{clubId}.members` : mapa uid -> { rol, fecha }.
//     Lo lee el cliente para pintar la lista y los permisos.
//   - `clubs/{clubId}.memberIds`: array para poder filtrar
//     por "array-contains" (lo mismo que hace `chats/`).
//   - `chats/{chatId}.memberIds`: lo que comprueban las reglas
//     de Firestore para dar acceso a los mensajes.
//
// Las tres listas se escriban SIEMPRE juntas, en la misma
// transacción: si una se quedara atrás, alguien vería el club
// en su lista sin poder leer el chat, o al revés.
// ======================================================

export const CLUBS = 'clubs';

/** Límites configurables de creación de clubes. */
export const CLUB_LIMITS = {
  name: { min: 3, max: 60 },
  slug: { min: 3, max: 40 },
  description: { min: 10, max: 500 },
  rules: { max: 1000 },
} as const;

const SLUG_RE = /^[a-z0-9-]+$/;

type Speaker = Pick<User, 'uid' | 'displayName' | 'username' | 'avatarUrl'>;

const nameOf = (u: Speaker): string => u.displayName || u.username;

// ────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────

/**
 * Normaliza un nombre a slug para la URL interna.
 *
 * Se pasa a minúsculas, se quitan las tildes (normalización
 * NFD + filtro de diacríticos), se sustituyen los caracteres
 * que no valen por guiones y se recortan los guiones de los
 * extremos. Los grupos de guiones se colapsan en uno.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CLUB_LIMITS.slug.max);
}

export function validarSlug(slug: string): { ok: boolean; error?: string } {
  const clean = slug.trim().toLowerCase();

  if (!clean) {
    return { ok: false, error: 'El identificador es obligatorio.' };
  }
  if (clean.length < CLUB_LIMITS.slug.min) {
    return {
      ok: false,
      error: `El identificador necesita al menos ${CLUB_LIMITS.slug.min} caracteres.`,
    };
  }
  if (clean.length > CLUB_LIMITS.slug.max) {
    return {
      ok: false,
      error: `El identificador no puede superar los ${CLUB_LIMITS.slug.max} caracteres.`,
    };
  }
  if (!SLUG_RE.test(clean)) {
    return {
      ok: false,
      error: 'Solo letras minúsculas, números y guiones (sin espacios).',
    };
  }
  return { ok: true };
}

/**
 * Comprueba que un slug esté libre.
 *
 * El id del documento ES el slug: así la unicidad la garantiza
 * Firestore, y un segundo intento choca contra el documento
 * que ya existe en lugar de crear un club duplicado.
 *
 * OJO con el `permission-denied` de un slug PRIVADO ocupado:
 * la regla de lectura niega el `get` a quien no es miembro
 * (es lo que oculta los privados), así que un slug privado
 * existente se informa como "no disponible" en lugar de
 * lanzar el crudo "Missing or insufficient permissions".
 */
export async function slugDisponible(slug: string): Promise<boolean> {
  const clean = slug.trim().toLowerCase();
  if (!validarSlug(clean).ok) return false;

  try {
    const snap = await getDoc(doc(db, CLUBS, clean));
    return !snap.exists();
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code ?? '';
    // Slug ocupado por un club privado ajeno: no se puede leer,
    // pero tampoco se puede usar.
    if (code === 'permission-denied') return false;
    throw e;
  }
}

// ────────────────────────────────────────────────────────
// CREAR UN CLUB
// ────────────────────────────────────────────────────────

export interface NuevoClub {
  name: string;
  slug: string;
  description: string;
  category: ClubCategory;
  coverUrl?: string;
  iconUrl?: string;
  rules?: string;
  accessType: Club['accessType'];
}

export interface ClubResult {
  ok: boolean;
  error?: string;
  /** Id del club recién creado (igual que el slug). */
  clubId?: string;
}

/**
 * Crea un club con su chat grupal.
 *
 * El usuario que lo crea se convierte automáticamente en
 * propietario y primer administrador.
 *
 * Son varias escrituras, pero NO se juntan en un lote: la
 * ficha del club referencia el chat, y las reglas leen el
 * chat para comprobar la pertenencia. Con una transacción
 * sí se puede, y es lo que se hace aquí abajo.
 */
export async function crearClub(actual: User, datos: NuevoClub): Promise<ClubResult> {
  const name = datos.name.trim();
  const slug = datos.slug.trim().toLowerCase();
  const description = datos.description.trim();

  // ── Validación de forma ──────────────────────────────
  if (!name || name.length < CLUB_LIMITS.name.min) {
    return { ok: false, error: `El nombre necesita al menos ${CLUB_LIMITS.name.min} caracteres.` };
  }
  if (name.length > CLUB_LIMITS.name.max) {
    return { ok: false, error: `El nombre no puede superar los ${CLUB_LIMITS.name.max} caracteres.` };
  }

  const checkSlug = validarSlug(slug);
  if (!checkSlug.ok) return { ok: false, error: checkSlug.error };

  if (description.length < CLUB_LIMITS.description.min) {
    return {
      ok: false,
      error: `La descripción necesita al menos ${CLUB_LIMITS.description.min} caracteres.`,
    };
  }
  if (description.length > CLUB_LIMITS.description.max) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${CLUB_LIMITS.description.max} caracteres.`,
    };
  }

  const rules = (datos.rules ?? '').trim();
  if (rules.length > CLUB_LIMITS.rules.max) {
    return {
      ok: false,
      error: `Las normas no pueden superar los ${CLUB_LIMITS.rules.max} caracteres.`,
    };
  }

  if (!['public', 'private', 'request'].includes(datos.accessType)) {
    return { ok: false, error: 'El tipo de acceso no es válido.' };
  }

  try {
    // ── Comprobación de duplicados ───────────────────────
    // Va DENTRO del try a propósito: `slugDisponible` hace un
    // `getDoc` que puede fallar con `permission-denied` si las
    // reglas de Firestore aún no están desplegadas en
    // producción (la colección `clubs` cae entonces en el
    // `deny` por defecto). Fuera del try, ese fallo subía como
    // excepción cruda ("Missing or insufficient permissions")
    // en lugar de un ClubResult con mensaje amable.
    let libre: boolean;
    try {
      libre = await slugDisponible(slug);
    } catch (e: unknown) {
      return { ok: false, error: mensajeAmableReglas(e) };
    }
    if (!libre) {
      return { ok: false, error: 'Ese identificador ya está en uso. Elige otro.' };
    }

    // El chat se crea FUERA de la transacción porque el
    // documento del club lo referencia por id, y dentro de una
    // transacción no se pueden crear documentos nuevos con id
    // automático. Si la creación del club falla después, el
    // chat queda huérfano: se limpia con `orphanImages` y no
    // es legible por nadie más que su creador.
    const chatRef = doc(collection(db, 'chats'));
    await setDoc(chatRef, {
      type: 'club',
      name,
      slug,
      category: datos.category,
      avatar: datos.iconUrl ?? '',
      coverUrl: datos.coverUrl ?? '',
      ownerId: actual.uid,
      memberIds: [actual.uid],
      hiddenFor: [],
      lastMessage: `Club creado por ${nameOf(actual)}`,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: actual.uid,
      readAt: { [actual.uid]: serverTimestamp() },
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, CLUBS, slug), {
      slug,
      name,
      description,
      category: datos.category,
      coverUrl: datos.coverUrl ?? '',
      iconUrl: datos.iconUrl ?? '',
      rules: rules || '',
      accessType: datos.accessType,
      ownerId: actual.uid,
      moderatorIds: [],
      memberIds: [actual.uid],
      members: {
        [actual.uid]: {
          uid: actual.uid,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
      },
      memberCount: 1,
      chatId: chatRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // El canal `general` nace con el club, apuntando al chat de
    // arriba: así hay conversación principal desde el primer
    // minuto. Si falla, no se invalida el club: la migración
    // (`asegurarGeneral`) lo crea al abrir el club.
    try {
      await setDoc(doc(db, CLUBS, slug, 'channels', 'general'), {
        id: 'general',
        clubId: slug,
        chatId: chatRef.id,
        name: 'General',
        description: 'Conversación general del club.',
        type: 'text',
        visibility: 'all',
        spoiler: false,
        order: 0,
        createdBy: actual.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[Clubes] El club se creó sin su canal general:', e);
    }

    return { ok: true, clubId: slug };
  } catch (e: unknown) {
    // Si el chat se creó pero la ficha falló (p. ej. reglas sin
    // desplegar), se intenta borrar el huérfano para no dejar
    // chats invisibles. El borrado puede fallar también y no
    // debe tapar el error original.
    try {
      const code = (e as { code?: string } | null)?.code ?? '';
      if (code === 'permission-denied') {
        // No se intenta limpiar nada: sin permiso ni siquiera
        // se sabe si el chat llegó a crearse.
        return { ok: false, error: mensajeAmableReglas(e) };
      }
    } catch {
      // Nunca tapar el error original por el de limpieza.
    }
    return { ok: false, error: messageOf(e, 'No se pudo crear el club.') };
  }
}

// ────────────────────────────────────────────────────────
// LECTURA DE CLUBES
// ────────────────────────────────────────────────────────

/** Convierte un documento de Firestore al tipo `Club`. */
function mapearClub(id: string, data: Record<string, unknown>): Club {
  const d = data as Omit<Club, 'id' | 'createdAt' | 'updatedAt'> & {
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

/**
 * Escucha los clubes del usuario.
 *
 * La consulta filtra por `memberIds array-contains`, que es
 * la misma condición que exige la regla de seguridad: así la
 * consulta no puede devolver clubes ajenos.
 */
export function subscribeMisClubes(
  uid: string,
  onData: (clubs: Club[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, CLUBS), where('memberIds', 'array-contains', uid)),
    (snap) => {
      onData(snap.docs.map((d) => mapearClub(d.id, d.data())));
    },
    (e) => onError?.(e),
  );
}

/** Lee la ficha de un club por su id. */
export async function getClub(clubId: string): Promise<Club | null> {
  const snap = await getDoc(doc(db, CLUBS, clubId));
  if (!snap.exists()) return null;
  return mapearClub(snap.id, snap.data());
}

/**
 * Lista de clubes para descubrir, ordenados por popularidad.
 *
 * Solo se enseñan los públicos y por solicitud: los privados
 * no salen en la galería (se accede por invitación y se ven en
 * "Mis clubes"). El filtro `accessType in [...]` va EN la
 * consulta a propósito: la regla de lectura niega los privados
 * ajenos, y una consulta sin filtro que PUDIERA devolverlos
 * falla entera con `permission-denied` en cuanto existe el
 * primer privado.
 *
 * Si el índice compuesto aún no está desplegado, Firestore
 * devuelve `failed-precondition` con el enlace de creación: se
 * reintenta sin el filtro y se criba en el cliente para no
 * dejar la galería vacía mientras tanto.
 */
export async function listarClubes(
  busqueda = '',
  categoria: ClubCategory | 'todas' = 'todas',
): Promise<ClubListing[]> {
  const texto = busqueda.trim().toLowerCase();

  const mapear = (id: string, data: Record<string, unknown>): ClubListing => ({
    id,
    slug: data.slug as string,
    name: data.name as string,
    description: data.description as string,
    category: data.category as ClubCategory,
    coverUrl: data.coverUrl as string | undefined,
    iconUrl: data.iconUrl as string | undefined,
    accessType: data.accessType as Club['accessType'],
    ownerId: data.ownerId as string,
    ownerName: '',
    moderatorIds: (data.moderatorIds as string[]) ?? [],
    memberCount: (data.memberCount as number) ?? 0,
    createdAt: toIsoString(data.createdAt),
  });

  const filtrar = (lista: ClubListing[]): ClubListing[] =>
    lista
      .filter((c) => c.accessType === 'public' || c.accessType === 'request')
      .filter((c) => {
        if (!texto) return true;
        return (
          c.name.toLowerCase().includes(texto) ||
          c.description.toLowerCase().includes(texto) ||
          c.category.includes(texto)
        );
      });

  try {
    const partes: Parameters<typeof where>[] = [];
    // `in` + `orderBy` exige índice compuesto (ver
    // firestore.indexes.json). Si falta, se cae al fallback.
    partes.push(where('accessType', 'in', ['public', 'request']) as never);

    if (categoria !== 'todas') {
      partes.push(where('category', '==', categoria) as never);
    }

    const q = query(
      collection(db, CLUBS),
      ...(partes as never[]),
      orderBy('memberCount', 'desc'),
      fsLimit(50),
    );

    const snap = await getDocs(q);
    return filtrar(snap.docs.map((d) => mapear(d.id, d.data() as Record<string, unknown>)));
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code ?? '';
    // Sin índice: consulta simple y criba en el cliente.
    if (code === 'failed-precondition') {
      const partesFallback = [];

      if (categoria !== 'todas') {
        partesFallback.push(where('category', '==', categoria));
      }

      const q = query(
        collection(db, CLUBS),
        ...partesFallback,
        orderBy('memberCount', 'desc'),
        fsLimit(50),
      );

      const snap = await getDocs(q);
      return filtrar(snap.docs.map((d) => mapear(d.id, d.data() as Record<string, unknown>)));
    }
    throw e;
  }
}

// ────────────────────────────────────────────────────────
// MIEMBROS
// ────────────────────────────────────────────────────────

/** Escucha una ficha de club (la usa el detalle y el chat). */
export function subscribeClub(
  clubId: string,
  onData: (club: Club | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, CLUBS, clubId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapearClub(snap.id, snap.data()));
    },
    (e) => onError?.(e),
  );
}

/**
 * El rol del usuario en el club, o null si no es miembro.
 *
 * La autoridad real la dan `ownerId` y `moderatorIds`, que son
 * los campos que comprueban las reglas. El `role` de la ficha
 * sirve de respaldo para clubes antiguos, anteriores a que
 * existiera `moderatorIds`.
 */
export function rolDe(club: Club | null, uid: string | null): ClubMember | null {
  if (!club || !uid) return null;

  let rol: ClubRole | null = null;
  if (club.ownerId === uid) {
    rol = 'owner';
  } else if ((club.moderatorIds ?? []).includes(uid)) {
    rol = 'moderator';
  } else {
    rol = club.members[uid]?.role ?? null;
  }

  if (!rol) return null;

  return {
    uid,
    role: rol,
    joinedAt: club.members[uid]?.joinedAt ?? '',
    mutedUntil: club.members[uid]?.mutedUntil,
  };
}

export function esPropietario(club: Club | null, uid: string | null): boolean {
  return !!club && club.ownerId === uid;
}

export function esModerador(club: Club | null, uid: string | null): boolean {
  const rol = rolDe(club, uid);
  return rol?.role === 'moderator' || rol?.role === 'owner';
}

/**
 * Entra en un club público.
 *
 * La transacción real (ficha + chats) la hace la Cloud Function
 * `unirseClubPublico` con el Admin SDK. Antes la hacía el cliente,
 * pero las reglas de cada escritura de un lote se evalúan contra el
 * estado ANTERIOR: el chat no podía comprobar que la persona ya era
 * miembro del club, y quedaba un hueco para leer el historial de un
 * club público sin haberse unido.
 */
export async function anadirMiembro(
  clubId: string,
  _nuevo: Speaker,
): Promise<ClubResult> {
  try {
    const llamar = httpsCallable(functions, 'unirseClubPublico');
    await llamar({ clubId });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo añadir al miembro.') };
  }
}

/**
 * Quita a un miembro del club y de TODOS sus chats.
 *
 * Sea expulsión o abandono voluntario, el efecto es el mismo
 * y tiene que ser inmediato: quien sale pierde el acceso a
 * cada canal aunque conserve una pestaña abierta, porque la
 * regla de los mensajes comprueba `chat.memberIds` en cada
 * lectura.
 */
export async function quitarMiembro(
  clubId: string,
  uid: string,
): Promise<ClubResult> {
  try {
    // Chats de todos los canales (públicos y restringidos):
    // quien sale, sale de todas partes.
    const canales = await listarCanales(clubId);

    await runTransaction(db, async (tx) => {
      const clubRef = doc(db, CLUBS, clubId);
      const snap = await tx.get(clubRef);
      if (!snap.exists()) throw new Error('El club ya no existe.');

      const data = snap.data();
      const miembros = { ...((data.members ?? {}) as Record<string, ClubMember>) };

      if (miembros[uid]?.role === 'owner') {
        throw new Error('El propietario no puede ser expulsado.');
      }

      delete miembros[uid];

      const uids = Object.keys(miembros);

      const cambiosClub: Record<string, unknown> = {
        members: miembros,
        memberIds: uids,
        memberCount: uids.length,
        updatedAt: serverTimestamp(),
      };

      // Si la persona era moderadora o admin del club, sale también
      // de esos arrays. Si no, `equipoDeClub()` seguiría contándola
      // para los canales `mods` aunque ya no fuera miembro, y las
      // reglas que exigen que el chat tenga EXACTAMENTE al equipo
      // fallarían al crear o sincronizar un canal.
      if (Array.isArray(data.moderatorIds)) {
        cambiosClub.moderatorIds = data.moderatorIds.filter((m) => m !== uid);
      }
      if (Array.isArray(data.adminIds)) {
        cambiosClub.adminIds = data.adminIds.filter((m) => m !== uid);
      }

      tx.update(clubRef, cambiosClub);

      // El histórico más cada canal, sin duplicar el chat si el
      // `general` migrado ya lo apunta. Primero TODOS los gets
      // (en una transacción no se lee después de escribir).
      const chats = [(data.chatId as string), ...canales.map((c) => c.chatId)].filter(
        (id, i, arr) => typeof id === 'string' && id.length > 0 && arr.indexOf(id) === i,
      );
      const sinEl: Record<string, string[]> = {};
      for (const id of chats) {
        const chatSnap = await tx.get(doc(db, 'chats', id));
        sinEl[id] = chatSnap.exists()
          ? ((chatSnap.data().memberIds ?? []) as string[]).filter((m) => m !== uid)
          : [];
      }

      for (const id of chats) {
        tx.update(doc(db, 'chats', id), {
          memberIds: sinEl[id],
          hiddenFor: arrayUnion(uid),
        });
      }
    });

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo quitar al miembro.') };
  }
}

/** Cambia el rol de un miembro (solo el propietario). */
export async function cambiarRol(
  clubId: string,
  uid: string,
  rol: 'moderator' | 'member',
): Promise<ClubResult> {
  try {
    const snap = await getDoc(doc(db, CLUBS, clubId));
    if (!snap.exists()) return { ok: false, error: 'El club ya no existe.' };

    const data = snap.data();
    const miembros = { ...((data.members ?? {}) as Record<string, ClubMember>) };

    if (!miembros[uid]) return { ok: false, error: 'Esa persona ya no es miembro.' };
    if (miembros[uid].role === 'owner') {
      return { ok: false, error: 'No se puede cambiar el rol del propietario.' };
    }

    miembros[uid] = { ...miembros[uid], role: rol };

    // `moderatorIds` es lo que de verdad comprueban las reglas,
    // así que se mantiene al día en la misma escritura.
    const moderadores = (data.moderatorIds ?? []) as string[];
    const nuevosModeradores =
      rol === 'moderator'
        ? moderadores.includes(uid)
          ? moderadores
          : [...moderadores, uid]
        : moderadores.filter((m) => m !== uid);

    await updateDoc(doc(db, CLUBS, clubId), {
      members: miembros,
      moderatorIds: nuevosModeradores,
      updatedAt: serverTimestamp(),
    });

    // Los canales restringidos (`mods`) llevan la pertenencia
    // del equipo: al ascender se entra, al bajar se sale. Sin
    // esto, un moderador degradado seguiría leyendo el canal
    // de coordinación, y uno nuevo no lo vería.
    const restringidos = (await listarCanales(clubId)).filter((c) => c.visibility === 'mods');
    for (const canal of restringidos) {
      if (rol === 'moderator') {
        await updateDoc(doc(db, 'chats', canal.chatId), {
          memberIds: arrayUnion(uid),
          hiddenFor: arrayRemove(uid),
        });
      } else {
        const chatSnap = await getDoc(doc(db, 'chats', canal.chatId));
        const actuales = chatSnap.exists()
          ? ((chatSnap.data().memberIds ?? []) as string[]).filter((m) => m !== uid)
          : [];
        await updateDoc(doc(db, 'chats', canal.chatId), {
          memberIds: actuales,
          hiddenFor: arrayUnion(uid),
        });
      }
    }

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo cambiar el rol.') };
  }
}

/**
 * Abandona el club voluntariamente.
 *
 * El propietario NO puede salir así como así: tiene que
 * transferir la propiedad o eliminar el club antes. Es la
 * comprobación que evita que un club se quede sin nadie que
 * lo administre.
 */
export async function abandonarClub(club: Club, uid: string): Promise<ClubResult> {
  if (club.ownerId === uid) {
    return {
      ok: false,
      error:
        'Eres el propietario. Transfiere la propiedad a otro miembro o elimina el club antes de salir.',
    };
  }

  return quitarMiembro(club.id, uid);
}

/**
 * Transfiere la propiedad del club a otro miembro.
 *
 * El que recibe pasa a propietario y el que la entrega baja a
 * moderador, todo en la misma escritura: así no queda ni un
 * instante con dos propietarios ni con ninguno.
 */
export async function transferirPropiedad(
  clubId: string,
  nuevoOwnerId: string,
): Promise<ClubResult> {
  try {
    const snap = await getDoc(doc(db, CLUBS, clubId));
    if (!snap.exists()) return { ok: false, error: 'El club ya no existe.' };

    const data = snap.data();
    const miembros = { ...((data.members ?? {}) as Record<string, ClubMember>) };

    if (!miembros[nuevoOwnerId]) {
      return { ok: false, error: 'Esa persona no es miembro del club.' };
    }
    if (miembros[nuevoOwnerId].role === 'owner') {
      return { ok: false, error: 'Esa persona ya es la propietaria.' };
    }

    const anterior = data.ownerId as string;
    miembros[nuevoOwnerId] = { ...miembros[nuevoOwnerId], role: 'owner' };
    if (miembros[anterior]) {
      miembros[anterior] = { ...miembros[anterior], role: 'moderator' };
    }

    // El que recibe deja de ser moderador (ya es propietario) y
    // el que entrega baja a moderador, no a miembro: así el club
    // nunca se queda sin nadie con permisos.
    const moderadores = (data.moderatorIds ?? []) as string[];
    const nuevosModeradores = [
      ...moderadores.filter((m) => m !== nuevoOwnerId && m !== anterior),
      ...(miembros[anterior] ? [anterior] : []),
    ];

    await updateDoc(doc(db, CLUBS, clubId), {
      ownerId: nuevoOwnerId,
      members: miembros,
      moderatorIds: nuevosModeradores,
      updatedAt: serverTimestamp(),
    });

    // El nuevo propietario entra en los canales restringidos
    // (era miembro normal y no los veía). El anterior sigue
    // como moderador, así que ya está en todos.
    const restringidos = (await listarCanales(clubId)).filter((c) => c.visibility === 'mods');
    for (const canal of restringidos) {
      await updateDoc(doc(db, 'chats', canal.chatId), {
        memberIds: arrayUnion(nuevoOwnerId),
        hiddenFor: arrayRemove(nuevoOwnerId),
      });
    }

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo transferir la propiedad.') };
  }
}

// ────────────────────────────────────────────────────────
// SOLICITUDES DE ACCESO
// ────────────────────────────────────────────────────────

/**
 * Solicita entrar en un club.
 *
 * Un club público se entra directamente (una sola escritura).
 * Uno privado o por solicitud genera un documento pendiente
 * que un moderador acepta o rechaza.
 */
export async function solicitarEntrada(
  club: Club,
  solicitante: Speaker,
): Promise<ClubResult> {
  if (club.members[solicitante.uid]) {
    return { ok: false, error: 'Ya eres miembro de este club.' };
  }

  if (club.accessType === 'public') {
    return anadirMiembro(club.id, solicitante);
  }

  try {
    // El id de la solicitud es determinista (club + usuario).
    // Así una persona no puede inundar el club repitiendo la
    // misma solicitud: la segunda escritura pisa la primera.
    const reqId = `${club.slug}_${solicitante.uid}`;

    await setDoc(doc(db, CLUBS, club.slug, 'requests', reqId), {
      clubId: club.slug,
      clubName: club.name,
      fromId: solicitante.uid,
      fromName: nameOf(solicitante),
      fromAvatar: solicitante.avatarUrl,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo enviar la solicitud.') };
  }
}

/** Solicitudes pendientes de un club (las ve el moderador). */
export function subscribeSolicitudesClub(
  clubId: string,
  onData: (requests: ClubRequest[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, CLUBS, clubId, 'requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
    ),
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          ...(d.data() as Omit<ClubRequest, 'id' | 'createdAt'>),
          id: d.id,
          createdAt: toIsoString(d.data().createdAt),
        })),
      );
    },
    (e) => onError?.(e),
  );
}

/**
 * Acepta una solicitud de acceso.
 *
 * La hace la Cloud Function `responderSolicitudClub`: comprueba que
 * quien responde es del equipo, que la solicitud sigue pendiente y
 * que la persona no está baneada ni sancionada, y añade al miembro
 * al club y a todos sus chats públicos en una transacción.
 */
export async function aceptarSolicitud(
  clubId: string,
  request: ClubRequest,
): Promise<ClubResult> {
  try {
    const llamar = httpsCallable(functions, 'responderSolicitudClub');
    await llamar({ clubId, requestId: request.id, accion: 'aceptar' });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo aceptar la solicitud.') };
  }
}

/** Rechaza una solicitud de acceso. */
export async function rechazarSolicitud(
  clubId: string,
  requestId: string,
): Promise<ClubResult> {
  try {
    const llamar = httpsCallable(functions, 'responderSolicitudClub');
    await llamar({ clubId, requestId, accion: 'rechazar' });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo rechazar la solicitud.') };
  }
}

// ────────────────────────────────────────────────────────
// MODERACIÓN DE MENSAJES
// ────────────────────────────────────────────────────────

/**
 * Elimina un mensaje del chat de un club (moderación).
 *
 * Es un borrado lógico, como el de "para todos": el documento
 * sigue existiendo para no romper el orden ni las citas, pero
 * el contenido se vacía y queda la marca. Así los demás ven
 * que el mensaje fue retirado sin que desaparezca de golpe.
 */
export async function eliminarMensajeClub(
  chatId: string,
  messageId: string,
  moderadorId: string,
): Promise<ClubResult> {
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      body: '',
      deletedForEveryone: true,
      deletedAt: serverTimestamp(),
      deletedBy: moderadorId,
      deletedByMod: true,
    });

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo eliminar el mensaje.') };
  }
}

/** Silencia a un miembro hasta una fecha (moderación). */
export async function silenciarMiembro(
  clubId: string,
  uid: string,
  hastaIso: string,
): Promise<ClubResult> {
  try {
    const snap = await getDoc(doc(db, CLUBS, clubId));
    if (!snap.exists()) return { ok: false, error: 'El club ya no existe.' };

    const data = snap.data();
    const miembros = { ...((data.members ?? {}) as Record<string, ClubMember>) };

    if (!miembros[uid]) return { ok: false, error: 'Esa persona ya no es miembro.' };
    if (miembros[uid].role === 'owner') {
      return { ok: false, error: 'No se puede silenciar al propietario.' };
    }

    miembros[uid] = { ...miembros[uid], mutedUntil: hastaIso };

    await updateDoc(doc(db, CLUBS, clubId), {
      members: miembros,
      updatedAt: serverTimestamp(),
    });

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo silenciar al miembro.') };
  }
}

// ────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL CLUB
// ────────────────────────────────────────────────────────

/**
 * Modifica los datos del club (solo el propietario).
 *
 * Si cambian el nombre o el icono, se actualizan también en
 * el documento del chat: si no, la lista de conversaciones
 * seguiría enseñando el nombre viejo hasta recargar (y la
 * regla de actualización del chat solo permite unos campos,
 * así que se hace aquí y no al revés).
 */
export async function actualizarClub(
  clubId: string,
  cambios: Partial<
    Pick<Club, 'name' | 'description' | 'coverUrl' | 'iconUrl' | 'rules' | 'accessType'>
  >,
): Promise<ClubResult> {
  try {
    const snap = await getDoc(doc(db, CLUBS, clubId));
    if (!snap.exists()) return { ok: false, error: 'El club ya no existe.' };

    const chatId = snap.data().chatId as string;

    await updateDoc(doc(db, CLUBS, clubId), {
      ...cambios,
      updatedAt: serverTimestamp(),
    });

    const enChat: Record<string, unknown> = {};
    if (cambios.name !== undefined) enChat.name = cambios.name;
    if (cambios.iconUrl !== undefined) enChat.avatar = cambios.iconUrl;
    if (cambios.coverUrl !== undefined) enChat.coverUrl = cambios.coverUrl;

    if (Object.keys(enChat).length > 0) {
      await updateDoc(doc(db, 'chats', chatId), enChat);
    }

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo actualizar el club.') };
  }
}

/**
 * Elimina el club y sus imágenes.
 *
 * La confirmación explícita va en la interfaz: la operación
 * no se puede deshacer y se lleva por delante el chat.
 *
 * El documento del chat NO se borra, igual que en los chats
 * privados: Firestore no borra en cascada y sus mensajes
 * quedarían huérfanos gastando cuota sin que nadie pudiera
 * leerlos. Lo que se hace es vaciar la lista de miembros,
 * con lo que el chat deja de ser legible para todos.
 *
 * El vaciado de chats, el borrado de canales y el del propio
 * club van en UN lote atómico. Así no queda un club a medias
 * si falla un paso, y el `general` se puede borrar junto a su
 * club: las reglas solo permiten quitarlo cuando el documento
 * del club desaparece en la misma operación. Un `general`
 * huérfano reaparecería si alguien reutilizara el slug.
 */
export async function eliminarClub(clubId: string): Promise<ClubResult> {
  try {
    const snap = await getDoc(doc(db, CLUBS, clubId));
    if (!snap.exists()) return { ok: false, error: 'El club ya no existe.' };

    const data = snap.data() as {
      coverUrl?: string;
      iconUrl?: string;
      chatId: string;
      members?: Record<string, ClubMember>;
    };

    const todos = Object.keys(data.members ?? {});

    const canales = await listarCanales(clubId);
    const chats = [data.chatId, ...canales.map((c) => c.chatId)].filter(
      (id, i, arr) => typeof id === 'string' && id.length > 0 && arr.indexOf(id) === i,
    );

    // Todo va en el mismo lote atómico: o se vacían los chats y
    // desaparecen los canales y el club, o no se aplica nada. Así
    // no queda un club a medias con las conversaciones cerradas.
    const lote = writeBatch(db);

    for (const id of chats) {
      lote.update(doc(db, 'chats', id), {
        memberIds: [],
        hiddenFor: todos,
      });
    }

    for (const canal of canales) {
      lote.delete(doc(db, CLUBS, clubId, 'channels', canal.id));
    }

    lote.delete(doc(db, CLUBS, clubId));

    await lote.commit();

    // Las imágenes se borran DESPUÉS de haber vaciado el club.
    // Si se borraran antes y el vaciado fallara, el club se
    // quedaría sin imagen pero seguiría existiendo.
    const borrar = async (url?: string) => {
      if (url && storagePathFromUrl(url)) await deleteStoredImage(url);
    };
    await borrar(data.coverUrl);
    await borrar(data.iconUrl);

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo eliminar el club.') };
  }
}

// ────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────

function messageOf(e: unknown, fallback: string): string {
  const code = (e as { code?: string } | null)?.code ?? '';
  if (code.includes('permission-denied')) {
    return 'No tienes permiso para esta acción.';
  }
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  }
  if (code.includes('not-found')) {
    return 'Eso ya no existe.';
  }
  if (code.includes('failed-precondition') || code.includes('unauthenticated')) {
    return 'No se ha podido completar la operación.';
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/**
 * Mensaje cuando crear o comprobar el slug falla por reglas.
 *
 * El caso típico es que las reglas de `clubs` aún no estén
 * desplegadas en producción: la colección cae en el `deny` por
 * defecto y TODO (incluido el `getDoc` de comprobación) da
 * `permission-denied`. En lugar del crudo inglés de Firebase
 * se dice qué hay que hacer.
 */
function mensajeAmableReglas(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? '';
  if (code === 'permission-denied') {
    return 'No tienes permiso para crear el club (las reglas de Firestore de "clubs" no están desplegadas o tu sesión no tiene perfil). Despliega firestore.rules y vuelve a intentarlo.';
  }
  if (e instanceof Error && e.message) return e.message;
  return 'No se pudo crear el club.';
}

/** Fecha corta para las tarjetas: "hace 2 días". */
export function fechaRelativa(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const segundos = Math.floor((Date.now() - then) / 1000);

  if (segundos < 60) return 'ahora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anos = Math.floor(meses / 12);
  return `hace ${anos} ${anos === 1 ? 'año' : 'años'}`;
}

export type { Club, ClubMember, ClubRequest, ClubListing };
