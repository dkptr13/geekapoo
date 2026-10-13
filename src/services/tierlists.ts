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
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { toIsoString } from './firestoreUtils';
import { aMapas, itemsComoLista, tiersOrdenados, validarTierList } from '../utils/tierlists';
import type { EditorDraft } from '../utils/tierlists';
import type {
  NuevoTierList,
  TierList,
  TierVote,
  User,
} from '../types';

// ======================================================
// TIER LISTS EN FIRESTORE
// ======================================================
// Estructura:
//
//   tierlists/{id}              -> la clasificación
//   tierlists/{id}/votes/{uid}  -> un voto por persona
//
// Los votos se CUENTAN en el cliente, igual que las
// encuestas: sin contadores que falsear. El id del voto es
// el uid, así que no hay dos votos de la misma persona.
//
// Hilos y mensajes NO duplican la clasificación: guardan
// solo `{tierListId, title}` y la leen de aquí. Borrar un
// hilo o un mensaje no borra la tier list (puede estar
// publicada en otro sitio).
// ======================================================

export const TIERLISTS = 'tierlists';
export const TIER_VOTES = 'votes';

type Speaker = Pick<User, 'uid' | 'displayName' | 'username' | 'avatarUrl'>;

const nameOf = (u: Speaker): string => u.displayName || u.username;

export interface TierResult {
  ok: boolean;
  error?: string;
  tierListId?: string;
}

/** Convierte un documento de Firestore al tipo `TierList`. */
function mapearTierList(id: string, data: Record<string, unknown>): TierList {
  const d = data as Omit<TierList, 'id' | 'createdAt' | 'updatedAt'> & {
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
 * Crea una tier list.
 *
 * Quien la crea queda como autor. La validación de forma va
 * aquí (errores amables) y en las reglas (garantía).
 */
export async function crearTierList(
  autor: Speaker,
  datos: NuevoTierList,
): Promise<TierResult> {
  const error = validarTierList(datos);
  if (error) return { ok: false, error };

  // Al documento van mapas (las reglas no recorren listas);
  // el editor trabaja con listas ordenadas.
  const { tiers, items } = aMapas(datos.tiers, datos.items);

  try {
    const ref = doc(collection(db, TIERLISTS));
    await setDoc(ref, {
      authorId: autor.uid,
      authorName: nameOf(autor),
      authorAvatar: autor.avatarUrl,
      title: datos.title.trim(),
      description: datos.description.trim(),
      category: datos.category,
      tiers,
      items,
      placement: datos.placement,
      poolOrder: datos.poolOrder,
      ...(datos.coverUrl ? { coverUrl: datos.coverUrl } : {}),
      visibility: datos.visibility,
      ...(datos.visibility === 'club' && datos.clubId ? { clubId: datos.clubId } : {}),
      voting: {
        enabled: !!datos.voting.enabled,
        allowChange: !!datos.voting.allowChange,
      },
      ...(datos.originId ? { originId: datos.originId } : {}),
      ...(datos.originTitle ? { originTitle: datos.originTitle } : {}),
      ...(datos.threadId ? { threadId: datos.threadId } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true, tierListId: ref.id };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo guardar la tier list.') };
  }
}

/** Lee una tier list por su id (null si no existe o no se puede leer). */
export async function getTierList(id: string): Promise<TierList | null> {
  try {
    const snap = await getDoc(doc(db, TIERLISTS, id));
    if (!snap.exists()) return null;
    return mapearTierList(snap.id, snap.data());
  } catch {
    return null;
  }
}

/** Escucha una tier list (la vista se actualiza al editarla). */
export function subscribeTierList(
  id: string,
  onData: (tier: TierList | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, TIERLISTS, id),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapearTierList(snap.id, snap.data()));
    },
    (e) => onError?.(e),
  );
}

/**
 * Tier lists del usuario, para elegir cuál compartir en el chat.
 *
 * La consulta filtra por `authorId`, que es la misma condición
 * que exigen las reglas: así no devuelve listas ajenas.
 */
export function subscribeMisTierLists(
  uid: string,
  onData: (tiers: TierList[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, TIERLISTS),
      where('authorId', '==', uid),
      orderBy('updatedAt', 'desc'),
      fsLimit(50),
    ),
    (snap) => {
      onData(snap.docs.map((d) => mapearTierList(d.id, d.data())));
    },
    (e) => onError?.(e),
  );
}

/**
 * Guarda los cambios del editor sobre una tier list existente.
 *
 * Convierte las listas del editor a los mapas del documento.
 * Las reglas solo dejan tocar los campos editables al autor.
 */
export async function guardarEdicionTierList(
  id: string,
  draft: EditorDraft,
): Promise<TierResult> {
  const error = validarTierList({ ...draft, clubId: undefined });
  if (error) return { ok: false, error };
  const { tiers, items } = aMapas(draft.tiers, draft.items);
  return actualizarTierList(id, {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    tiers,
    items,
    placement: draft.placement,
    poolOrder: draft.poolOrder,
    ...(draft.coverUrl ? { coverUrl: draft.coverUrl } : { coverUrl: '' }),
    visibility: draft.visibility,
    voting: draft.voting,
  });
}
export async function actualizarTierList(
  id: string,
  cambios: Partial<
    Pick<
      TierList,
      | 'title'
      | 'description'
      | 'category'
      | 'tiers'
      | 'items'
      | 'placement'
      | 'poolOrder'
      | 'coverUrl'
      | 'visibility'
      | 'voting'
    >
  >,
): Promise<TierResult> {
  try {
    await updateDoc(doc(db, TIERLISTS, id), {
      ...cambios,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, tierListId: id };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo actualizar la tier list.') };
  }
}

/**
 * Elimina una tier list propia (con confirmación en la interfaz).
 *
 * Los hilos y mensajes que la referenciaban siguen existiendo:
 * pintan "ya no disponible" en vez de romperse. Los votos se
 * van con ella (subcolección del documento).
 */
export async function eliminarTierList(id: string): Promise<TierResult> {
  try {
    await deleteDoc(doc(db, TIERLISTS, id));
    return { ok: true, tierListId: id };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo eliminar la tier list.') };
  }
}

/**
 * Copia independiente a partir de otra (plantilla).
 *
 * Nuevo id, nuevo autor y contenido editable: lo que se cambie
 * en la copia no toca el original. Las imágenes se REUTILIZAN
 * por URL (no se duplican archivos). Guarda de dónde viene.
 */
export async function duplicarTierList(
  original: TierList,
  autor: Speaker,
): Promise<TierResult> {
  return crearTierList(autor, {
    title: `Mi versión: ${original.title}`.slice(0, 80),
    description: original.description,
    category: original.category,
    tiers: tiersOrdenados(original.tiers),
    items: itemsComoLista(original.items),
    placement: { ...original.placement },
    poolOrder: Object.fromEntries(
      Object.entries(original.poolOrder).map(([k, v]) => [k, [...v]]),
    ),
    ...(original.coverUrl ? { coverUrl: original.coverUrl } : {}),
    // La copia nace pública aunque el original fuera de club:
    // si no, el autor se quedaría con algo que quizá ya no
    // puede ni ver. Al compartirla en un club se restringe allí.
    visibility: 'public',
    voting: { ...original.voting },
    originId: original.id,
    originTitle: original.title,
  });
}

// ────────────────────────────────────────────────────────
// VOTOS (nivel favorito)
// ────────────────────────────────────────────────────────

/**
 * Vota por un nivel favorito.
 *
 * Un voto por persona (el id es el uid). Cambiar de nivel solo
 * si el autor lo permitió; las reglas lo comprueban otra vez.
 */
export async function votarTier(
  tierList: TierList,
  tierId: string,
  uid: string,
): Promise<TierResult> {
  if (!tierList.voting.enabled) {
    return { ok: false, error: 'Esta tier list no admite votos.' };
  }
  if (!(tierId in (tierList.tiers ?? {}))) {
    return { ok: false, error: 'Ese nivel no existe en la tier list.' };
  }

  try {
    const ref = doc(db, TIERLISTS, tierList.id, TIER_VOTES, uid);
    const previo = await getDoc(ref);

    if (previo.exists()) {
      const yaElegido = previo.data()?.tierId as string | undefined;
      if (yaElegido === tierId) return { ok: true, tierListId: tierList.id };
      if (!tierList.voting.allowChange) {
        return { ok: false, error: 'En esta votación solo se puede votar una vez.' };
      }
      await updateDoc(ref, { tierId, updatedAt: serverTimestamp() });
      return { ok: true, tierListId: tierList.id };
    }

    await setDoc(ref, {
      userId: uid,
      tierId,
      createdAt: serverTimestamp(),
    });
    return { ok: true, tierListId: tierList.id };
  } catch (e: unknown) {
    return { ok: false, error: messageOf(e, 'No se pudo registrar el voto.') };
  }
}

/** Un voto tal y como viene de Firestore. */
export interface TierVoteRow {
  id: string;
  userId: string;
  tierId: string;
}

/** Tope de votos que trae una escucha (igual que las encuestas). */
export const TOPE_VOTOS_TIER = 400;

/** Escucha los votos de una tier list. */
export function listenTierVotes(
  tierListId: string,
  alCambiar: (votes: TierVoteRow[], error?: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, TIERLISTS, tierListId, TIER_VOTES), fsLimit(TOPE_VOTOS_TIER)),
    (snap) => {
      const votes: TierVoteRow[] = snap.docs.map((d) => ({
        id: d.id,
        userId: String(d.data().userId ?? d.id),
        tierId: String(d.data().tierId ?? ''),
      }));
      alCambiar(votes.filter((v) => v.tierId !== ''));
    },
    (e) => {
      console.error('[TierLists] Error escuchando los votos:', e);
      alCambiar([], e);
    },
  );
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

export type { TierVote };
