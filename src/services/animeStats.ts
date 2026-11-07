import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../lib/firebase';
import {
  cachedRead,
  invalidateCache,
  PUBLIC_CACHE,
} from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { mapWithId } from './firestoreUtils';
import type { Anime } from '../types';

// ======================================================
// ESTADÍSTICAS DE LA WIKI
// ======================================================
//
// Los tres indicadores viven separados:
//
//   - likesCount        → ranking de series más gustadas.
//   - viewsCount        → ranking de series más vistas.
//   - communityRating*  → puntuación 1-10 de la comunidad.
//
// `rating` sigue siendo la nota externa de IMDb y no se toca.
//
// Los rankings se piden ya ordenados y limitados. No se descargan
// votos ni visitas individuales: los agregados están en el documento
// del anime y solo las Cloud Functions pueden escribirlos.

export type RankingMetric = 'likes' | 'views';

/** Cuánto se reutiliza un ranking antes de volver a pedirlo. */
const RANKING_TTL = 5 * 60 * 1000;

/** Tope del ranking completo. El catálogo actual son ~211 series. */
export const RANKING_COMPLETO_LIMITE = 300;

const CAMPO_RANKING: Record<RankingMetric, string> = {
  likes: 'likesCount',
  views: 'viewsCount',
};

/**
 * Series ordenadas por el contador indicado.
 *
 * La consulta es una sola, ordenada y limitada. `viewsCount` necesita
 * la migración de estadísticas para que todas las series tengan el
 * campo a 0; sin él, Firestore las dejaría fuera del `orderBy`.
 */
export async function fetchAnimeRanking(
  metric: RankingMetric,
  limite = 5,
): Promise<Anime[]> {
  return cachedRead<Anime[]>({
    key: `wiki:ranking:${metric}:${limite}`,
    ttlMs: RANKING_TTL,
    scope: PUBLIC_CACHE,
    persist: true,
    read: async () => {
      const snap = await measureRead(
        {
          name: `animes:ranking:${metric}`,
          collection: 'animes',
          origin: 'animeStats',
        },
        (result) => result.size,
        () =>
          getDocs(
            query(
              collection(db, 'animes'),
              orderBy(CAMPO_RANKING[metric], 'desc'),
              limit(limite),
            ),
          ),
      );
      return mapWithId<Anime>(snap);
    },
  });
}

/**
 * Registra una visita real a la ficha.
 *
 * El cliente solo llama al abrir/entrar en una ficha, no en cada
 * render. La Cloud Function deduplica:
 *   - usuario registrado por UID;
 *   - anónimo por huella de sesión en servidor (IP + navegador).
 *
 * Si falla, no se pinta error: una visita no debe romper la wiki.
 */
export async function registrarVisitaAnime(
  animeId: string,
): Promise<{ contado: boolean; viewsCount?: number }> {
  try {
    const llamar = httpsCallable<
      { animeId: string },
      { contado: boolean; viewsCount?: number }
    >(functions, 'registrarVisitaAnime');
    const respuesta = await llamar({ animeId });
    if (respuesta.data.contado) invalidateCache('wiki:ranking:views');
    return respuesta.data;
  } catch (e) {
    console.warn('[Wiki] No se pudo registrar la visita:', e);
    return { contado: false };
  }
}

/** Voto personal del usuario en una serie, o `null` si no ha votado. */
export async function obtenerMiVotoAnime(
  animeId: string,
  uid: string,
): Promise<number | null> {
  if (!animeId || !uid) return null;
  try {
    const snap = await getDocFromServer(
      doc(db, 'animeRatings', animeId, 'votes', uid),
    );
    if (!snap.exists()) return null;
    const score = Number(snap.data()?.score);
    return Number.isInteger(score) && score >= 1 && score <= 10 ? score : null;
  } catch (e) {
    console.warn('[Wiki] No se pudo leer tu voto:', e);
    return null;
  }
}

/**
 * Vota o cambia el voto de la serie.
 *
 * El servidor valida 1-10, actualiza la suma, el contador y la media
 * en la misma transacción y devuelve los agregados ya recalculados.
 */
export async function votarAnime(
  animeId: string,
  score: number,
): Promise<{ media: number; votos: number; miVoto: number }> {
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    throw new Error('La puntuación debe estar entre 1 y 10.');
  }

  try {
    const llamar = httpsCallable<
      { animeId: string; score: number },
      { media: number; votos: number; miVoto: number }
    >(functions, 'votarAnime');
    const respuesta = await llamar({ animeId, score });
    // La ficha cachea el documento del anime; al cambiar la media,
    // la próxima apertura debe leer los agregados nuevos.
    invalidateCache(`anime-doc:${animeId}`, PUBLIC_CACHE);
    return respuesta.data;
  } catch (e) {
    const code = (e as { code?: string } | null)?.code ?? '';
    const mensaje = (e as { message?: string } | null)?.message;
    if (code.includes('unauthenticated')) {
      throw new Error('Inicia sesión para votar esta serie.');
    }
    if (code.includes('permission-denied')) {
      throw new Error(mensaje || 'Tu cuenta no puede votar ahora mismo.');
    }
    if (code.includes('invalid-argument') || code.includes('not-found')) {
      throw new Error(mensaje || 'No se pudo guardar tu voto.');
    }
    throw new Error(mensaje || 'No se pudo guardar tu voto.');
  }
}
