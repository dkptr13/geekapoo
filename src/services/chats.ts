import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  endAt,
  getDoc,
  getDocs,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../lib/firebase';
import { measureRead, recordListenerSnapshot, trackListener } from '../lib/firestoreDiagnostics';
import { mapWithId, toDate, toIsoString, withId, Timestamp } from './firestoreUtils';
import { esUrlDeGifValida } from './gifs';
import { ubicacionPlausible } from './ubicacion';
import { deleteStoredImage, storagePathFromUrl, uploadChatImage } from './imageUpload';
import { inviteToGroup } from './chatRequests';
import type {
  ChatMessage,
  ChatReplyTo,
  ChatRequest,
  ChatRoom,
  GifAttachment,
  GroupListing,
  LocationAttachment,
  Poll,
  TierListRef,
  User,
} from '../types';

// ======================================================
// CHATS EN FIRESTORE
// ======================================================
// Antes esto vivía en localStorage: cada navegador tenía su
// propia copia, así que dos dispositivos del mismo usuario no
// veían los mismos mensajes, y al limpiar el navegador se
// perdían todos.
//
// Estructura:
//   chats/{chatId}                      → datos de la conversación
//   chats/{chatId}/messages/{messageId}  → mensajes
//
// La pertenencia se guarda en el array "memberIds" del chat.
// No se usa la subcolección members: escribirla en el mismo
// lote que el chat no funcionaría, porque las reglas de
// seguridad leen el estado anterior del documento.
// ======================================================

export const CHATS = 'chats';

/** Convierte un mapa { uid: Timestamp } de Firestore a { uid: ISO }. */
function toDateMap(raw: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;

  Object.entries(raw).forEach(([key, value]) => {
    const iso = toIsoString(value);
    if (iso) out[key] = iso;
  });
  return out;
}

const MAX_BODY = 4000;
const MAX_MEMBERS = 50;
const DEFAULT_GROUP_AVATAR =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80';

/**
 * Códigos que se pueden CONSULTAR: los nuevos de tres bloques y los
 * antiguos de dos. La creación solo acepta los nuevos; los antiguos
 * siguen existiendo y hay que poder entrar con ellos.
 */
const GROUP_CODE_PATTERN =
  /^GRP-[A-F0-9]{4}-[A-F0-9]{4}(?:-[A-F0-9]{4})?$/;

type Speaker = Pick<User, 'uid' | 'displayName' | 'username' | 'avatarUrl'>;

const nameOf = (u: Speaker): string => u.displayName || u.username;

// ────────────────────────────────────────────────────────
// SUSCRIPCIONES EN TIEMPO REAL
// ────────────────────────────────────────────────────────

/**
 * Escucha solo los chats del usuario. La consulta
 * "memberIds array-contains" es la que garantiza que nadie
 * ve conversaciones ajenas: la misma condición que exige la
 * regla de seguridad, pero aplicada en la propia consulta.
 */
export function subscribeChats(
  uid: string,
  onData: (rooms: ChatRoom[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const meta = { name: 'chats:propios', collection: 'chats', origin: 'ChatContext' };
  const unsubscribe = onSnapshot(
    query(collection(db, CHATS), where('memberIds', 'array-contains', uid)),
    (snap) => {
      recordListenerSnapshot(meta, snap.size, snap.docChanges().length);
      const visible: ChatRoom[] = [];

      snap.docs.forEach((d) => {
        // Chats que este usuario eliminó o de los que salió: no
        // aparecen en su lista, pero siguen existiendo para el
        // resto de participantes.
        const hidden = (d.data() as { hiddenFor?: string[] }).hiddenFor ?? [];
        if (hidden.includes(uid)) return;

        // readAt y clearedAt son mapas uid -> Timestamp. Se
        // convierten aquí para que el resto de la app solo
        // compare cadenas ISO.
        const raw = d.data() as {
          readAt?: Record<string, unknown>;
          clearedAt?: Record<string, unknown>;
        };

        visible.push({
          ...withId<ChatRoom>(d),
          readAt: toDateMap(raw.readAt),
          clearedAt: toDateMap(raw.clearedAt),
        });
      });

      visible.sort((a, b) => {
        // lastMessageAt es opcional en el tipo porque un chat
        // recién creado puede no tenerlo todavía. Si falta, se
        // trata como 0 y ese chat queda al final.
        const at = Date.parse(a.lastMessageAt ?? '') || 0;
        const bt = Date.parse(b.lastMessageAt ?? '') || 0;
        return bt - at;
      });
      onData(visible);
    },
    (e) => onError?.(e),
  );
  return trackListener(meta, unsubscribe);
}

/** Cuántos mensajes se cargan de golpe en una conversación. */
export const CHAT_PAGE_SIZE = 80;

function visiblesDesde(
  messages: ChatMessage[],
  clearedMs: number,
): ChatMessage[] {
  if (Number.isNaN(clearedMs)) return messages;
  return messages.filter((m) => {
    const at = Date.parse(m.createdAt);
    if (Number.isNaN(at)) return true;
    // Margen de 1 s: si el servidor del mensaje y el de la marca no
    // coinciden exactamente, el último mensaje se quedaría a la vista.
    return at > clearedMs - 1000;
  });
}

/**
 * Escucha solo la página más reciente del chat.
 *
 * El historial completo se carga por tramos con
 * `cargarMensajesAnteriores`. La conversación sigue siendo en tiempo
 * real; lo único que cambia es que no descarga años de historial para
 * enseñar el final.
 */
export function subscribeMessages(
  chatId: string,
  clearedAt: string | undefined,
  onData: (messages: ChatMessage[], hasMore: boolean) => void,
  onError?: (e: Error) => void,
): () => void {
  if (!chatId) {
    onData([], false);
    return () => undefined;
  }

  const clearedMs = clearedAt ? Date.parse(clearedAt) : NaN;
  const meta = { name: 'chat:mensajes-recientes', collection: 'messages', origin: 'ChatContext' };

  const unsubscribe = onSnapshot(
    query(
      collection(db, CHATS, chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limitToLast(CHAT_PAGE_SIZE + 1),
    ),
    (snap) => {
      recordListenerSnapshot(meta, snap.size, snap.docChanges().length);
      const all = mapWithId<ChatMessage>(snap);
      const hasMore = all.length > CHAT_PAGE_SIZE;
      const pagina = hasMore ? all.slice(all.length - CHAT_PAGE_SIZE) : all;
      onData(visiblesDesde(pagina, clearedMs), hasMore);
    },
    (e) => onError?.(e),
  );

  return trackListener(meta, unsubscribe);
}

/** Carga el tramo inmediatamente anterior a la fecha indicada. */
export async function cargarMensajesAnteriores(
  chatId: string,
  antesDeIso: string,
  clearedAt: string | undefined,
  pageSize = CHAT_PAGE_SIZE,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const ms = Date.parse(antesDeIso);
  if (!chatId || Number.isNaN(ms)) return { messages: [], hasMore: false };

  const snap = await measureRead(
    { name: 'chat:mensajes-anteriores', collection: 'messages', origin: 'ChatContext' },
    (result) => result.size,
    () => getDocs(query(
      collection(db, CHATS, chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      endAt(Timestamp.fromMillis(ms)),
      limitToLast(pageSize + 1),
    )),
  );

  const all = mapWithId<ChatMessage>(snap);
  const hasMore = all.length > pageSize;
  const pagina = hasMore ? all.slice(all.length - pageSize) : all;
  const clearedMs = clearedAt ? Date.parse(clearedAt) : NaN;
  return { messages: visiblesDesde(pagina, clearedMs), hasMore };
}

// ────────────────────────────────────────────────────────
// CREAR CONVERSACIONES
// ────────────────────────────────────────────────────────

/**
 * Abre un chat privado desde el servidor.
 *
 * Es una herramienta de administración/migración: el flujo normal
 * de la interfaz es mandar una solicitud (ver chatRequests.ts) y que
 * la conversación se cree al aceptarla. Un usuario normal NO puede
 * abrirle una conversación a nadie: la callable
 * `abrirChatDirecto` exige ser del equipo.
 */
export async function createDirectChat(
  owner: Speaker,
  target: Speaker,
): Promise<{ ok: true; chatId: string } | { ok: false; error: string }> {
  if (owner.uid === target.uid) {
    return { ok: false, error: 'No puedes abrir un chat privado contigo mismo.' };
  }

  try {
    const llamar = httpsCallable(functions, 'abrirChatDirecto');
    const respuesta = await llamar({ targetUid: target.uid });
    const datos = respuesta.data as { chatId?: string };

    if (typeof datos?.chatId !== 'string') {
      return { ok: false, error: 'No se pudo crear la conversación.' };
    }

    return { ok: true, chatId: datos.chatId };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo crear la conversación.') };
  }
}

/**
 * Crea un grupo con UNA SOLA persona: su creador.
 *
 * El resto no se añade aquí. Cualquiera que quiera entrar tiene
 * que presentar el CÓDIGO del grupo y que el dueño lo acepte.
 *
 * Se usa el código y no el nombre porque los nombres se repiten
 * ("Club de Anime", "Fans de Shingeki"...): con el nombre no se
 * sabe a qué grupo te quieres apuntar. El código es único y lo
 * comparte quien lo crea.
 */
export async function createGroupChat(
  owner: Speaker,
  name: string,
): Promise<{ ok: true; chatId: string; code: string } | { ok: false; error: string }> {
  const cleanName = name.trim();
  if (!cleanName) return { ok: false, error: 'El nombre del grupo es obligatorio.' };
  if (cleanName.length > 60) {
    return { ok: false, error: 'El nombre no puede superar los 60 caracteres.' };
  }

  const code = generateGroupCode();

  try {
    const ref = doc(collection(db, CHATS));
    await setDoc(ref, {
      type: 'group',
      name: cleanName,
      code,
      avatar: DEFAULT_GROUP_AVATAR,
      ownerId: owner.uid,
      memberIds: [owner.uid],
      hiddenFor: [],
      lastMessage: `Grupo creado por ${nameOf(owner)}`,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: owner.uid,
      readAt: { [owner.uid]: serverTimestamp() },
      createdAt: serverTimestamp(),
    });

    // Índice código → grupo. Existe para que alguien con el
    // código pueda pedir entrar SIN ser miembro, algo que no
    // puede hacerse sobre chats/ porque ahí solo se lee lo
    // propio.
    await setDoc(doc(db, 'groupCodes', code), {
      code,
      groupId: ref.id,
      name: cleanName,
      ownerId: owner.uid,
      ownerName: nameOf(owner).slice(0, 60),
      memberCount: 1,
      createdAt: serverTimestamp(),
    });

    return { ok: true, chatId: ref.id, code };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo crear el grupo.') };
  }
}

/**
 * Código aleatorio del tipo GRP-1A2B-3C4D-5E6F.
 *
 * 48 bits sacados de `crypto.getRandomValues`, no de `Math.random`:
 * un código de invitación es una capacidad y no puede depender de un
 * generador pensado para animaciones. Las reglas comprueban el
 * formato; la entropía la pone esto.
 */
function generateGroupCode(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return `GRP-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/**
 * Busca un grupo por su código. Devuelve null si no existe, si el
 * código no tiene forma de invitación o si la cuenta no puede leerlo.
 */
export async function findGroupByCode(
  code: string,
): Promise<GroupListing | null> {
  const clean = code.trim().toUpperCase();
  if (!GROUP_CODE_PATTERN.test(clean)) return null;

  try {
    const snap = await getDoc(doc(db, 'groupCodes', clean));
    if (!snap.exists()) return null;

    const data = snap.data() as {
      groupId: string;
      name: string;
      ownerId: string;
      ownerName: string;
      memberCount: number;
      createdAt?: unknown;
    };
    return {
      id: data.groupId,
      code: clean,
      name: data.name,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      memberCount: data.memberCount,
      createdAt: toIsoString(data.createdAt),
    };
  } catch (e) {
    console.warn('[Chats] No se pudo buscar el grupo por código:', e);
    return null;
  }
}

/** Mantiene el contador de miembros del índice de códigos al día. */
export async function syncGroupMemberCount(
  code: string,
  memberCount: number,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'groupCodes', code), { memberCount });
  } catch (e) {
    // No es crítico para la conversación: se registra y se sigue.
    console.warn('[Chats] No se pudo actualizar el contador del grupo:', e);
  }
}

/**
 * Genera el código de invitación de un grupo que aún no lo
 * tiene (grupos antiguos) o cuyo índice se perdió.
 *
 * Solo quien creó el grupo: las reglas solo le dejan tocar
 * `code` a él (y al admin). Hace las DOS escrituras que
 * necesita un código para funcionar:
 *
 *   1. `groupCodes/{code}` → índice de invitación para entrar
 *      con el código sin ser miembro.
 *   2. `chats/{id}.code`  → lo que enseña la barra del chat.
 *
 * Si el chat ya trae un código con su índice en regla, no
 * toca nada. Si el índice es de otro grupo (código repetido
 * a mano), se genera uno nuevo en vez de pisarlo.
 */
export async function ensureGroupCode(
  room: ChatRoom,
  owner: Speaker,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  if (room.type !== 'group') {
    return { ok: false, error: 'Solo los grupos tienen código de invitación.' };
  }
  if (room.ownerId !== owner.uid) {
    return { ok: false, error: 'Solo quien creó el grupo puede generar su código.' };
  }

  // El código que ya trae, si su índice sigue siendo el suyo.
  if (room.code) {
    try {
      const snap = await getDoc(doc(db, 'groupCodes', room.code));
      if (snap.exists()) {
        const data = snap.data() as { groupId?: string; ownerId?: string };
        if (data.groupId === room.id) {
          if (data.ownerId === owner.uid) {
            return { ok: true, code: room.code };
          }

          // El grupo cambió de dueño y el índice se quedó con el
          // anterior. El dueño actual puede reclamarlo (las
          // reglas lo permiten si el chat ya es suyo), así que
          // conservamos el mismo código en vez de crear otro.
          try {
            await updateDoc(doc(db, 'groupCodes', room.code), {
              ownerId: owner.uid,
              ownerName: nameOf(owner).slice(0, 60),
            });
            return { ok: true, code: room.code };
          } catch (e) {
            console.warn('[Chats] No se pudo reclamar el índice del código:', e);
          }
        }
      }
    } catch (e) {
      console.warn('[Chats] No se pudo comprobar el índice del código:', e);
    }
  }

  // Uno nuevo que no pise a nadie: si el índice ya existe
  // (otra persona lo cogió primero), se prueba con otro.
  for (let intento = 0; intento < 3; intento++) {
    const code = generateGroupCode();

    try {
      const previo = await getDoc(doc(db, 'groupCodes', code));
      if (previo.exists()) continue;

      await setDoc(doc(db, 'groupCodes', code), {
        code,
        groupId: room.id,
        name: room.name,
        ownerId: owner.uid,
        ownerName: nameOf(owner).slice(0, 60),
        memberCount: room.memberIds.length,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, CHATS, room.id), { code });

      // Limpieza del índice viejo, si era nuestro: que no
      // queden dos códigos vivos para el mismo grupo.
      if (room.code && room.code !== code) {
        try {
          const viejo = await getDoc(doc(db, 'groupCodes', room.code));
          if (
            viejo.exists() &&
            (viejo.data() as { ownerId?: string }).ownerId === owner.uid
          ) {
            await deleteDoc(doc(db, 'groupCodes', room.code));
          }
        } catch (e) {
          console.warn('[Chats] No se pudo limpiar el código anterior:', e);
        }
      }

      return { ok: true, code };
    } catch (e: unknown) {
      const ferr = (e as { code?: string })?.code ?? '';
      // Sin permiso no hay nada que reintentar: las reglas
      // mandan y el error vuelve al usuario tal cual.
      if (ferr === 'permission-denied' || ferr === 'unauthenticated') {
        return { ok: false, error: messageOf(e, 'No se pudo generar el código.') };
      }
      console.warn('[Chats] Reintentando la generación del código:', e);
    }
  }

  return { ok: false, error: 'No se pudo generar un código libre. Inténtalo de nuevo.' };
}

export async function sendChatMessage(
  chatId: string,
  sender: Speaker,
  body: string,
  gif?: GifAttachment,
  adjunto?: { imageUrl?: string; location?: LocationAttachment },
  respuesta?: ChatReplyTo | null,
  encuesta?: Poll | null,
  tier?: TierListRef | null,
): Promise<void> {
  const text = body.trim();

  // Se puede mandar un mensaje SOLO con un GIF (" responded with a
  // GIF" es un meme tan viejo como los foros), y también solo con una
  // foto, con una ubicación, con una encuesta o con una tier list.
  // Un mensaje sin texto y sin nada más sí es vacío y no vale.
  if (!text && !gif && !adjunto?.imageUrl && !adjunto?.location && !encuesta && !tier) return;

  if (text.length > MAX_BODY) {
    throw new Error(`El mensaje no puede superar los ${MAX_BODY} caracteres.`);
  }

  // Misma comprobación que en los comentarios, y por el mismo
  // motivo: el campo `gif.url` lo escribe el cliente, así que sin
  // esto el chat serviría para colgar cualquier URL.
  if (gif && !esUrlDeGifValida(gif.url)) {
    throw new Error('Ese GIF no es válido.');
  }

  // Las coordenadas también las escribe el cliente. Se comprueban los
  // rangos aquí y también en las reglas, por el mismo motivo que el
  // GIF: el cliente puede estar mintiendo y las reglas son las que no
  // se pueden saltar. Aquí el aviso es para el usuario, que puede
  // ver enseguida qué ha fallado; allí está la garantía.
  if (adjunto?.location && !ubicacionPlausible(adjunto.location)) {
    throw new Error('Esa ubicación no es válida.');
  }

  // ── 1. El mensaje. Esto es lo imprescindible. ────────
  await setDoc(doc(collection(db, CHATS, chatId, 'messages')), {
    chatId,
    senderId: sender.uid,
    senderName: nameOf(sender),
    senderAvatar: sender.avatarUrl,
    body: text,
    // El tipo dice qué se tiene que PINTAR. Lo que va en su sitio es
    // lo que va: un mensaje puede llevar texto Y una ubicación, y el
    // texto sigue siendo texto.
    type: tier
      ? 'tier'
      : encuesta
        ? 'poll'
        : adjunto?.location
          ? 'location'
          : gif
            ? 'gif'
            : adjunto?.imageUrl
              ? 'image'
              : 'text',
    ...(gif ? { gif } : {}),
    ...(adjunto?.imageUrl ? { imageUrl: adjunto.imageUrl } : {}),
    ...(adjunto?.location ? { location: adjunto.location } : {}),
    // La encuesta viaja dentro del mensaje, igual que el GIF o la
    // ubicación. Las reglas exigen que tenga forma válida
    // (`pollValido`): aquí llega ya normalizada desde el
    // compositor, que es quien enseña los errores al escribir.
    ...(encuesta ? { poll: encuesta } : {}),
    // La tier list viaja como referencia (id + título): el
    // contenido vive en su documento. Las reglas exigen forma
    // válida (`tierRefValida`).
    ...(tier ? { tierList: { tierListId: tier.tierListId, title: tier.title.slice(0, 160) } } : {}),
    // La cita es una foto fija del citado. `texto` va COMPLETO
    // porque las reglas lo comparan exacto con el mensaje real; el
    // recorte es solo de la vista y lo hace `fragmentoParaCita`.
    // `snippet` no se escribe en mensajes nuevos: queda para leer
    // citas antiguas.
    ...(respuesta?.messageId
      ? {
          replyTo: {
            messageId: String(respuesta.messageId).slice(0, 100),
            senderName: String(respuesta.senderName ?? ''),
            texto: String(respuesta.texto ?? respuesta.snippet ?? '').slice(0, 4000),
          },
        }
      : {}),
    createdAt: serverTimestamp(),
  });

  // ── 2. La vista previa en la lista. ──────────────────
  //
  // La escribe el trigger `onChatMessageCreated` desde el mensaje
  // real. Antes la movía este cliente en una segunda escritura, y
  // eso obligaba a las reglas a dejarle tocar `lastMessage*`: con
  // ese permiso, un miembro podía falsear el remitente o el texto
  // para todos. El mensaje ya existe; la vista previa llega sola.
}

/**
 * "Vacía" la conversación para un usuario: a partir de ahora no
 * ve ningún mensaje anterior.
 *
 * Los mensajes NO se borran de Firestore. Son documentos
 * compartidos, y destruirlos le quitaría el historial también a
 * la otra persona, que es justo lo que no debe pasar. Lo que se
 * guarda es una marca personal con la fecha, y el listado de
 * mensajes oculta para ese usuario todo lo anterior a ella.
 *
 * Se escribe el mapa entero y no con notación de punto
 * ("clearedAt.<uid>") porque la regla de seguridad compara
 * diff().affectedKeys().hasOnly([...]) y, con rutas anidadas,
 * affectedKeys() devuelve la hoja en lugar del campo de primer
 * nivel, y la escritura se rechaza con permission-denied.
 */
export async function clearConversationFor(
  chatId: string,
  uid: string,
): Promise<void> {
  const ref = doc(db, CHATS, chatId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const current = (snap.data()?.clearedAt ?? {}) as Record<string, unknown>;
    tx.update(ref, { clearedAt: { ...current, [uid]: serverTimestamp() } });
  });
}

export async function deleteChat(chatId: string): Promise<void> {
  await deleteDoc(doc(db, CHATS, chatId));
}

// ────────────────────────────────────────────────────────
// GESTIÓN DE LA CONVERSACIÓN
// ────────────────────────────────────────────────────────
// "Eliminar" y "salir" NO borran el documento. Un chat
// privado es compartido: si lo destruyera uno, se le
// borraría la conversación al otro. En su lugar se guarda
// una lista hiddenFor, y cada persona decide si lo ve.
//
// Los mensajes tampoco se borran: Firestore no tiene borrado
// en cascada, así que eliminar el chat dejaría sus
// subcolecciones de mensajes huérfanas, gastando cuota sin
// que nadie pueda verlas ni borrarlas nunca.
// ────────────────────────────────────────────────────────

/** Elimina un chat privado de la lista del usuario (para el otro no cambia nada). */
export async function hideChat(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, CHATS, chatId), {
    hiddenFor: arrayUnion(uid),
  });
}

/** Sale de un grupo: se quita de memberIds y de su lista. */
export async function leaveGroup(chatId: string, uid: string): Promise<void> {
  const ref = doc(db, CHATS, chatId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const data = snap.data() as { memberIds?: string[] };
    const members = (data.memberIds ?? []).filter((m) => m !== uid);

    tx.update(ref, {
      memberIds: members,
      hiddenFor: arrayUnion(uid),
    });
  });
}

/**
 * Pasa la propiedad del grupo a otro miembro.
 * Necesario antes de que el dueño salga, para no dejar el
 * grupo sin nadie que pueda administrarlo.
 */
export async function transferGroupOwnership(
  chatId: string,
  newOwnerId: string,
): Promise<void> {
  const chatRef = doc(db, CHATS, chatId);
  await updateDoc(chatRef, { ownerId: newOwnerId });

  // El índice de invitación del código también guarda quién es el
  // dueño. Si no lo actualizáramos, quien entrara con el código
  // mandaría la solicitud al dueño ANTIGUO y las reglas la
  // rechazarían (el dueño real ya es otro). Es best-effort: el
  // traspaso del chat ya está hecho y el nuevo dueño puede
  // reclamar el índice al abrir el grupo.
  try {
    const chatSnap = await getDoc(chatRef);
    const code = (chatSnap.data() as { code?: string } | undefined)?.code;
    if (!code) return;

    const ownerSnap = await getDoc(doc(db, 'users', newOwnerId));
    const owner = ownerSnap.data() as
      | { displayName?: string; username?: string }
      | undefined;
    const ownerName = (owner?.displayName || owner?.username || 'Miembro').slice(0, 60);

    await updateDoc(doc(db, 'groupCodes', code), {
      ownerId: newOwnerId,
      ownerName,
    });
  } catch (e) {
    console.warn(
      '[Chats] El grupo cambió de dueño, pero no se pudo actualizar el índice del código:',
      e,
    );
  }
}

/**
 * Cambia la foto del grupo.
 *
 * La foto va subida a Storage, no como URL suelta, y eso por una razón
 * que ya se-payment de cabeza en otras partes: si el campo `avatar`
 * aceptara cualquier URL, quien administrara el grupo podría dejar
 * colgada una URL de rastreo. Las reglas ya limitan a `avatar` a los
 * dueños (ver `chats/{chatId}` en firestore.rules), pero el servicio
 * comprueba además que la URL sea de nuestro propio almacenamiento
 * antes de escribirla.
 *
 * La imagen anterior se borra de Storage después de escribir la nueva.
 * Si se borrara antes y la escritura fallara, el grupo se quedaría sin
 * foto. Al revés, si la escritura funciona y el borrado falla, solo
 * queda un fichero huérfano que se limpia con `orphanImages.ts`.
 *
 * @param chatId  id del grupo
 * @param archivo la foto elegida por el usuario
 * @param anterior la URL que tenía antes, para borrarla después
 *
 * No lleva el uid porque no hace falta: las reglas de Storage
 * comprueban la pertenencia al grupo contra el documento del chat, que
 * es lo único que importa aquí. El dueño es quien cambia la foto, pero
 * lo que se valida al subir es ser miembro.
 */
export async function setGroupAvatar(
  chatId: string,
  archivo: File,
  anterior?: string,
): Promise<string> {
  const url = await uploadChatImage(archivo, chatId, 'group-avatar');

  await updateDoc(doc(db, CHATS, chatId), { avatar: url });

  // La de antes solo se borra si era nuestra. La de por defecto es un
  // enlace a Unsplash y no hay nada que borrar, y un avatar puesto a
  // mano con una URL externa tampoco es un fichero nuestro.
  //
  // `storagePathFromUrl` devuelve null si la URL no es del bucket, y con
  // eso basta: es la misma comprobación que usa el borrado de las
  // imágenes del catálogo.
  if (anterior && storagePathFromUrl(anterior)) {
    await deleteStoredImage(anterior);
  }

  return url;
}

/**
 * El dueño invita a alguien al grupo.
 *
 * No lo añade directamente: crea una solicitud `invite` y la
 * persona entra cuando la acepta. La regla de `chatRequests`
 * comprueba que quien invita es el dueño y que el invitado no es
 * ya miembro; la Cloud Function hace la entrada real.
 */
export async function inviteGroupMember(
  chatId: string,
  owner: Speaker,
  target: Speaker,
  existing: ChatRequest[] = [],
): Promise<void> {
  const snap = await getDoc(doc(db, CHATS, chatId));
  if (!snap.exists()) throw new Error('El grupo ya no existe.');

  const data = snap.data() as { type?: string; ownerId?: string; name?: string };
  if (data.type !== 'group') throw new Error('Ese chat no es un grupo.');
  if (data.ownerId !== owner.uid) {
    throw new Error('Solo quien creó el grupo puede invitar.');
  }

  const resultado = await inviteToGroup(
    owner,
    target,
    { id: chatId, name: data.name ?? 'Grupo' },
    existing,
  );

  if (!resultado.ok) {
    throw new Error(resultado.error ?? 'No se pudo enviar la invitación.');
  }
}

/** El dueño expulsa a un miembro. */
export async function removeGroupMember(
  chatId: string,
  memberId: string,
): Promise<void> {
  const ref = doc(db, CHATS, chatId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const data = snap.data() as { memberIds?: string[] };
    const members = (data.memberIds ?? []).filter((m) => m !== memberId);

    tx.update(ref, {
      memberIds: members,
      // La persona expulsada también se oculta. Si no, la
      // suscripción la seguiría mostrando aunque ya no figure en
      // memberIds... y, de hecho, dejaría de llegarle porque la
      // consulta filtra por memberIds, pero si el dueño la
      // reincorpora antes volvería a asomar sin querer.
      hiddenFor: arrayUnion(memberId),
    });
  });
}

// ────────────────────────────────────────────────────────
// RECIBOS DE LECTURA (doble tick y punto de sin leer)
// ────────────────────────────────────────────────────────
// La marca de lectura se guarda DENTRO del documento del chat,
// en un mapa: readAt = { "<uid>": Timestamp, ... }
//
// Se intentó primero como subcolección (chats/{id}/readReceipts/
// {uid}) y fue un error: para saber qué conversaciones tienes sin
// leer hacen falta los recibos de TODAS, pero solo se está
// suscrito a los del chat abierto. En cuanto cambiabas de
// conversación se olvidaba la anterior y el punto no se quitaba
// nunca.
//
// Con el mapa dentro del chat no hace falta ninguna suscripción
// adicional: el documento del chat ya se descarga entero para
// todas las conversaciones del usuario.
// ────────────────────────────────────────────────────────

/**
 * Marca la conversación como leída HASTA el momento de ahora.
 *
 * ── POR QUÉ YA NO PASA LA FECHA DEL MENSAJE ──────────────────────
 *
 * Antes esta función escribía la fecha del último mensaje visto, y
 * con eso el punto de "sin leer" no se quitaba nunca. No era un fallo
 * del cálculo sino de los datos, y hay que ver los números para
 * entenderlo.
 *
 * Enviar un mensaje son DOS escrituras separadas:
 *
 *   1º `setDoc` del mensaje   → `createdAt`     = 16:21:24.634
 *   2º `updateDoc` del chat   → `lastMessageAt` = 16:21:24.853
 *
 * Las dos usan `serverTimestamp()`, pero son dos viajes de red, así
 * que el servidor les da dos instantes distintos. La marca de lectura
 * guardaba la primera (`.634`) y el cálculo de sin leer compara
 * `lastMessageAt <= readAt`, o sea `853 <= 634`, que es FALSO. El
 * punto se quedaba.
 *
 * Lo único que lo quitaba era la regla que ignora las conversaciones
 * cuyo último mensaje es tuyo, es decir: contestar. Por eso el punto
 * solo se iba si respondías.
 *
 * ── EL ARREGLO ────────────────────────────────────────────────────
 *
 * Se escribe `serverTimestamp()`: la hora del servidor en el momento
 * de la lectura. Siempre es posterior a cualquier mensaje que ya
 * había llegado, y no depende del reloj del dispositivo, que puede
 * ir adelantado o atrasado y volver a dejar la marca antes que el
 * mensaje.
 *
 * El doble tick sigue funcionando: `isReadByEveryone` compara con un
 * margen de 2 s, y ahora la marca es posterior al mensaje, que es lo
 * que significa "lo ha leído".
 *
 * ── LO QUE PIERDE ESTO ───────────────────────────────────────────
 *
 * La marca ya no dice "hasta qué mensaje leí", sino "cuándo lo leí".
 * Es una diferencia real y hay que tenerla presente: la barra de
 * mensajes nuevos NO puede calcularse con el `readAt` actual, porque
 * en cuanto se marca, esa marca avanza y la barra se calcularía
 * contra sí misma. Por eso `ChatContext` congela la marca de lectura
 * DEL MOMENTO EN QUE SE ABRE LA CONVERSACIÓN, antes de marcar nada.
 *
 * Sigue escribiéndose el mapa entero y no `readAt.<uid>` por el
 * motivo de las reglas que se explica arriba: con rutas anidadas,
 * `affectedKeys()` devuelve la hoja y la comparación del `hasOnly`
 * falla.
 */
export async function markChatRead(chatId: string, uid: string): Promise<void> {
  const ref = doc(db, CHATS, chatId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const current = (snap.data()?.readAt ?? {}) as Record<string, unknown>;

    // Aquí no se comprueba si la marca estaba al día: eso lo decide
    // timestamps que confunden leído de no leído.
    // último mensaje. Comprobarlo aquí exigiría volver a interpretarla
    // dentro de la transacción, y se volvería a caer en la cuenta de
    // timestamps que différencia "leído" de "no leído".
    tx.update(ref, { readAt: { ...current, [uid]: serverTimestamp() } });
  });
}

// ────────────────────────────────────────────────────────
// BORRAR MENSAJES (estilo WhatsApp)
// ────────────────────────────────────────────────────────
// Dos operaciones distintas, con dos caminos distintos:
//
//   · Para TODOS: borrado lógico vía Cloud Function
//     (`eliminarMensajeParaTodos`). El servidor comprueba
//     autoría y plazo (2 h) con su reloj, vacía el contenido y
//     deja el marcador. El cliente NO puede hacerlo solo: las
//     reglas solo dejan a un admin tocar mensajes.
//   · Solo PARA MÍ: registro personal en
//     `users/{uid}/hiddenMessages/{messageId}`. El mensaje sigue
//     intacto para los demás; este usuario deja de verlo porque
//     el cliente filtra esos ids. Las reglas solo dejan tocar
//     los propios.
// ────────────────────────────────────────────────────────

/** Subcolección de mensajes ocultos solo para su dueño. */
export const HIDDEN_MESSAGES = 'hiddenMessages';

/**
 * Oculta un mensaje solo para quien lo pide.
 *
 * No toca el mensaje: crea un registro personal. Si ya existía,
 * `setDoc` con el mismo id lo deja igual, así que pulsar dos
 * veces no duplica nada.
 */
export async function ocultarMensajeParaMi(
  uid: string,
  chatId: string,
  messageId: string,
): Promise<void> {
  if (!uid || !chatId || !messageId) {
    throw new Error('Falta el usuario, el chat o el mensaje.');
  }

  await setDoc(doc(db, 'users', uid, HIDDEN_MESSAGES, messageId), {
    chatId,
    messageId,
    hiddenAt: serverTimestamp(),
  });
}

/**
 * Escucha los ids de mensajes que este usuario ocultó.
 *
 * Es una colección pequeña (un documento por mensaje oculto) y
 * vive en el propio usuario, así que no hace falta paginar: se
 * trae entera y se filtra en memoria.
 */
export function subscribeOcultos(
  uid: string | null,
  onData: (ids: Set<string>) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!uid) {
    onData(new Set());
    return () => undefined;
  }

  return onSnapshot(
    collection(db, 'users', uid, HIDDEN_MESSAGES),
    (snap) => onData(new Set(snap.docs.map((d) => d.id))),
    (e) => onError?.(e),
  );
}

/** Lo que devuelve el borrado para todos cuando va bien. */
export interface BorradoParaTodos {
  ok: true;
}

/**
 * Pide al servidor el borrado para todos de un mensaje.
 *
 * La comprobación de verdad (autoría, pertenencia y 2 horas con
 * el reloj del servidor) la hace la Cloud Function. Si el cliente
 * pudiera marcar el mensaje, bastaría la consola del navegador
 * para saltarse el plazo.
 */
export async function eliminarMensajeParaTodos(
  chatId: string,
  messageId: string,
): Promise<BorradoParaTodos> {
  if (!chatId || !messageId) {
    throw new Error('Falta el chat o el mensaje.');
  }

  const llamar = httpsCallable<{ chatId: string; messageId: string }, BorradoParaTodos>(
    functions,
    'eliminarMensajeParaTodos',
  );

  try {
    await llamar({ chatId, messageId });
    return { ok: true };
  } catch (e: unknown) {
    throw new Error(mensajeDeBorrado(e));
  }
}

/**
 * Pide al servidor cambiar el texto de un mensaje propio.
 *
 * Como el borrado, solo el servidor puede: las reglas no dejan a
 * ningún cliente actualizar mensajes. El servidor comprueba
 * autoría y que no esté borrado para todos; la creación
 * (`createdAt`) no se toca, así que editar no rejuvenece el
 * mensaje y el plazo de borrado sigue contando desde el envío.
 */
export async function editarMensajeChat(
  chatId: string,
  messageId: string,
  body: string,
): Promise<void> {
  if (!chatId || !messageId) {
    throw new Error('Falta el chat o el mensaje.');
  }

  const llamar = httpsCallable<{ chatId: string; messageId: string; body: string }, { ok: true }>(
    functions,
    'editarMensajeChat',
  );

  try {
    await llamar({ chatId, messageId, body });
  } catch (e: unknown) {
    throw new Error(mensajeDeEdicion(e));
  }
}

/**
 * Traduce el error de la edición a algo que se pueda enseñar.
 *
 * Separado del de borrado porque los motivos no son los mismos:
 * aquí no hay plazo, pero sí "ya se borró" y "vacío".
 */
function mensajeDeEdicion(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';

  if (code.includes('unauthenticated')) return 'Tienes que iniciar sesión.';
  if (code.includes('not-found')) return 'Ese mensaje ya no está.';
  if (code.includes('permission-denied')) {
    return 'Ya no se puede editar: o no es tuyo o se eliminó para todos.';
  }
  if (code.includes('failed-precondition')) {
    return 'Ese mensaje ya se eliminó para todos y no se puede editar.';
  }
  if (code.includes('invalid-argument')) {
    return 'El texto no vale: vacío o demasiado largo.';
  }
  if (code.includes('unavailable')) {
    return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  }
  return e instanceof Error ? e.message : 'No se pudo editar el mensaje.';
}

/**
 * Traduce el error de la callable a algo que se pueda enseñar.
 *
 * Sin esto saldría el código crudo ("functions/permission-denied"),
 * que no dice si es que ya pasaron las 2 horas, si el mensaje no
 * es tuyo o si se fue la conexión.
 */
function mensajeDeBorrado(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';

  if (code.includes('unauthenticated')) return 'Tienes que iniciar sesión.';
  if (code.includes('not-found')) return 'Ese mensaje ya no está.';
  if (code.includes('permission-denied')) {
    return 'Ya no se puede eliminar para todos: o no es tuyo o pasaron las 2 horas.';
  }
  if (code.includes('failed-precondition')) {
    return 'Ese mensaje ya se eliminó para todos.';
  }
  if (code.includes('invalid-argument')) return 'Falta el chat o el mensaje.';
  if (code.includes('unavailable')) {
    return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  }
  return e instanceof Error ? e.message : 'No se pudo eliminar el mensaje.';
}

// ────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────

export function messageOf(e: unknown, fallback: string): string {
  const code = (e as { code?: string } | null)?.code ?? '';

  if (code.includes('permission-denied') || (e instanceof Error && e.message.includes('permission-denied'))) {
    return 'No tienes permiso para hacer esa acción en esta conversación.';
  }
  if (code.includes('resource-exhausted')) {
    return 'El grupo ya tiene el máximo de miembros.';
  }
  if (e instanceof Error) {
    return e.message;
  }
  return fallback;
}

const LEGACY_KEYS = ['geekapoo_chat_rooms', 'geekapoo_chat_messages'];

/**
 * Borra los chats que quedaron guardados en el navegador con
 * el sistema anterior. Sus interlocutores eran usuarios
 * inventados (user_otaku_01...), así que no se pueden migrar:
 * simplemente desaparecen.
 */
export function purgeLegacyLocalChats(): number {
  let removed = 0;
  LEGACY_KEYS.forEach((key) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removed++;
    }
  });
  return removed;
}
