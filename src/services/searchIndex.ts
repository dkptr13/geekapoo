import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import type { Anime, Character, Episode, Season } from '../types';

// ======================================================
// ÍNDICE DE BÚSQUEDA
// ======================================================
//
// Firestore no permite buscar subcadenas: `where('title', '>=', q)`
// solo sirve para prefijos y obliga a ordenar. Hasta ahora la wiki
// resolvía eso descargando TODOS los episodios y personajes en la
// primera búsqueda (miles de documentos).
//
// Este índice lo genera `scripts/generar-indice-busqueda.mjs` en
// cada build, con los mismos campos que usa la búsqueda inteligente:
// título, japonés, romaji, alias, sinopsis, géneros, estudio,
// descripciones, notas, imágenes y claves. Se sirve como un archivo
// estático desde el mismo dominio, así que:
//
//   - Buscar no gasta ni una lectura de Firestore.
//   - No hay un servicio externo que pagar ni que mantener.
//   - Se actualiza en cada despliegue, igual que el sitemap; un
//     navegador que ya había buscado puede tardar como máximo una
//     hora (el TTL) en ver la versión nueva.
//
// El archivo se guarda una vez en IndexedDB con `persistentCache`
// (a través de `cachedRead`), de modo que recargar no lo vuelve a
// descargar mientras el TTL siga vigente. Si el archivo no existe o
// el despliegue es antiguo, `AnimeWiki` conserva la carga completa
// como red de seguridad: el buscador nunca se queda sin resultados.

export interface IndiceBusqueda {
  version: number;
  generado: string;
  animes: Anime[];
  seasons?: Season[];
  episodes: Episode[];
  characters: Character[];
}

/** Temporadas de cada anime, indexadas por id del anime. */
export type TemporadasPorAnime = Record<string, Season[]>;

const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';
const INDEX_URL = `/busqueda/indice.json?v=${encodeURIComponent(BUILD_ID)}`;
const ANIMES_URL = `/busqueda/animes.json?v=${encodeURIComponent(BUILD_ID)}`;
const TEMPORADAS_URL = `/busqueda/temporadas.json?v=${encodeURIComponent(BUILD_ID)}`;
// Una hora: si se publica un catálogo nuevo, como mucho se tarda
// una hora en verlo en un navegador que ya había buscado. Mantener
// la clave estable evita acumular copias de 5 MB en IndexedDB en
// cada despliegue.
const INDEX_TTL = 60 * 60 * 1000;

function esIndiceValido(value: unknown): value is IndiceBusqueda {
  if (!value || typeof value !== 'object') return false;
  const indice = value as Partial<IndiceBusqueda>;
  return (
    indice.version === 1 &&
    Array.isArray(indice.animes) &&
    Array.isArray(indice.episodes) &&
    Array.isArray(indice.characters)
  );
}

/**
 * Lista ligera de animes para la Wiki y los perfiles.
 *
 * Es un archivo aparte del índice grande: así el catálogo puede
 * pintarse sin descargar episodios/personajes ni leer los 195
 * documentos de Firestore.
 */
export async function cargarAnimesIndice(): Promise<Anime[] | null> {
  try {
    return await cachedRead<Anime[]>({
      key: 'search:animes:v1',
      ttlMs: INDEX_TTL,
      scope: PUBLIC_CACHE,
      persist: true,
      read: async () => {
        const respuesta = await fetch(ANIMES_URL, { cache: 'no-cache' });
        if (!respuesta.ok) {
          throw new Error(`lista de animes: HTTP ${respuesta.status}`);
        }

        const datos: unknown = await respuesta.json();
        if (!Array.isArray(datos)) {
          throw new Error('lista de animes: formato no válido');
        }

        return datos as Anime[];
      },
    });
  } catch (error) {
    console.warn('[Wiki] No se pudo cargar la lista estática de animes:', error);
    return null;
  }
}

function esTemporadasValidas(value: unknown): value is TemporadasPorAnime {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(
    ([, lista]) =>
      Array.isArray(lista) &&
      lista.every(
        (temporada) =>
          temporada &&
          typeof temporada === 'object' &&
          typeof (temporada as Season).id === 'string' &&
          typeof (temporada as Season).animeId === 'string',
      ),
  );
}

/**
 * Temporadas agrupadas por anime para la ficha.
 *
 * La ficha necesita el selector y la ficha de cada temporada nada
 * más abrirse. Antes se pedían a Firestore (hasta 22 documentos en
 * One Piece); ahora vienen de este archivo y la colección solo se
 * lee como respaldo si el archivo falta o no conoce la serie.
 */
export async function cargarTemporadasIndice(): Promise<TemporadasPorAnime | null> {
  try {
    return await cachedRead<TemporadasPorAnime>({
      key: 'search:temporadas:v1',
      ttlMs: INDEX_TTL,
      scope: PUBLIC_CACHE,
      persist: true,
      read: async () => {
        const respuesta = await fetch(TEMPORADAS_URL, { cache: 'no-cache' });
        if (!respuesta.ok) {
          throw new Error(`temporadas: HTTP ${respuesta.status}`);
        }

        const datos: unknown = await respuesta.json();
        if (!esTemporadasValidas(datos)) {
          throw new Error('temporadas: formato no válido');
        }

        return datos;
      },
    });
  } catch (error) {
    console.warn('[Wiki] No se pudo cargar la lista estática de temporadas:', error);
    return null;
  }
}

/**
 * Descarga (o recupera de caché) el índice estático.
 *
 * Devuelve `null` si no existe o está corrupto, para que quien
 * llama pueda usar el camino de respaldo sin romper la búsqueda.
 */
export async function cargarIndiceBusqueda(): Promise<IndiceBusqueda | null> {
  try {
    return await cachedRead<IndiceBusqueda>({
      key: 'search:index:v1',
      ttlMs: INDEX_TTL,
      scope: PUBLIC_CACHE,
      persist: true,
      read: async () => {
        const respuesta = await fetch(INDEX_URL, { cache: 'no-cache' });
        if (!respuesta.ok) {
          throw new Error(`índice de búsqueda: HTTP ${respuesta.status}`);
        }

        const datos: unknown = await respuesta.json();
        if (!esIndiceValido(datos)) {
          throw new Error('índice de búsqueda: formato no válido');
        }

        return datos;
      },
    });
  } catch (error) {
    console.warn('[Búsqueda] No se pudo cargar el índice estático:', error);
    return null;
  }
}
