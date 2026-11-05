import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { FANART_CATEGORY_ID } from '../data/fanarts';
import { mapWithId } from './firestoreUtils';
import { normalizarHilo } from '../utils/threads';
import type { Thread } from '../types';

// ======================================================
// LECTURA PAGINADA DE FANARTS
// ======================================================
//
// La pestaña Fanarts NO reutiliza `allThreads`: esa lista carga
// toda la colección y aquí sería un gasto innecesario. Se consulta
// solo la categoría fija, con un cursor y un límite por página.
//
// Las etiquetas se filtran en el servidor con `array-contains`.
// Los índices necesarios están documentados en
// `firestore.indexes.json` y en `docs/auditoria/firebase-costes.md`.
//
// No hay `onSnapshot`: la pestaña se lee al abrirla/cambiar filtro.
// Así no se mantiene un listener permanente sobre los fanarts.

export const FANART_PAGE_SIZE = 12;

export type FanartSort = 'recent' | 'popular';

export interface FanartPage {
  items: Thread[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

interface FetchFanartPageInput {
  sort: FanartSort;
  /** Etiqueta exacta por la que filtrar, o `null` para todas. */
  tag: string | null;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}

export async function fetchFanartPage({
  sort,
  tag,
  cursor = null,
}: FetchFanartPageInput): Promise<FanartPage> {
  const constraints: QueryConstraint[] = [
    where('categoryId', '==', FANART_CATEGORY_ID),
  ];

  if (tag) {
    constraints.push(where('tags', 'array-contains', tag));
  }

  if (sort === 'popular') {
    // `createdAt` desempata: sin él, dos fanarts con los mismos
    // me gusta podrían intercambiar posiciones entre páginas y
    // repetirse o perderse al paginar.
    constraints.push(orderBy('likesCount', 'desc'));
    constraints.push(orderBy('createdAt', 'desc'));
  } else {
    constraints.push(orderBy('createdAt', 'desc'));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(FANART_PAGE_SIZE + 1));

  const snap = await getDocs(query(collection(db, 'threads'), ...constraints));
  const docs = snap.docs.slice(0, FANART_PAGE_SIZE);
  const items = mapWithId<Thread>(snap)
    .slice(0, docs.length)
    .map(normalizarHilo);

  return {
    items,
    cursor: docs[docs.length - 1] ?? null,
    hasMore: snap.size > FANART_PAGE_SIZE,
  };
}

/**
 * Trae los hilos guardados por id, solo cuando se abre «Guardados».
 *
 * `in` admite 30 valores en el SDK actual, pero se usan bloques de
 * 10 para no depender de la versión del backend. No se lee ningún
 * otro documento del feed.
 */
export async function fetchFanartThreadsByIds(
  ids: string[],
): Promise<Thread[]> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return [];

  const bloques: string[][] = [];
  for (let i = 0; i < unicos.length; i += 10) {
    bloques.push(unicos.slice(i, i + 10));
  }

  const snaps = await Promise.all(
    bloques.map((bloque) =>
      getDocs(
        query(
          collection(db, 'threads'),
          where(documentId(), 'in', bloque),
        ),
      ),
    ),
  );

  const porId = new Map<string, Thread>();
  for (const snap of snaps) {
    for (const hilo of mapWithId<Thread>(snap).map(normalizarHilo)) {
      porId.set(hilo.id, hilo);
    }
  }

  return unicos
    .map((id) => porId.get(id))
    .filter((hilo): hilo is Thread => Boolean(hilo));
}
