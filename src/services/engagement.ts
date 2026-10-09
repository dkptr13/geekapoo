import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { toggleLike } from './firestoreUtils';

// ======================================================
// INTERACCIÓN CON EL CATÁLOGO
// Animes, episodios, personajes y trivia comparten la misma
// lógica de "me gusta", así que se resuelven con un mapa.
// ======================================================

export type LikeableKind = 'anime' | 'episode' | 'character' | 'trivia';

const LIKABLE: Record<LikeableKind, { collection: string; counter: string }> = {
  anime: { collection: 'animes', counter: 'likesCount' },
  episode: { collection: 'episodes', counter: 'likesCount' },
  character: { collection: 'characters', counter: 'likesCount' },
  // La trivia llama "likes" a su contador, no "likesCount"
  trivia: { collection: 'trivia_extras', counter: 'likes' },
};

export async function toggleCatalogLike(
  kind: LikeableKind,
  itemId: string,
  uid: string,
): Promise<boolean> {
  const target = LIKABLE[kind];
  return toggleLike(doc(db, target.collection, itemId), uid, target.counter);
}

// ────────────────────────────────────────────────────────
// CONSULTAS DEL CATÁLOGO PARA LA INTERFAZ
// ────────────────────────────────────────────────────────

export function queryEpisodesOf(animeId: string) {
  return query(
    collection(db, 'episodes'),
    where('animeId', '==', animeId),
    orderBy('number', 'asc'),
  );
}

export function queryCharactersOf(animeId: string) {
  return query(collection(db, 'characters'), where('animeId', '==', animeId));
}

export async function fetchEpisodesOf(animeId: string) {
  const snap = await getDocs(queryEpisodesOf(animeId));
  return snap.docs;
}

export async function fetchCharactersOf(animeId: string) {
  const snap = await getDocs(queryCharactersOf(animeId));
  return snap.docs;
}

