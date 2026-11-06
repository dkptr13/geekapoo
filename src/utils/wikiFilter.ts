// ======================================================
// FILTROS DE LA WIKI: PESTAÑAS Y FILTROS AVANZADOS
// ======================================================
// Toda la lógica de filtrado y ordenación vive aquí, sin
// React, para poder probarla con `tsx` como el resto de la
// lógica del proyecto (ver `tests/logica.wiki-filtros.ts`).
//
// Los componentes (`MainTabs`, `AdvancedFilters`,
// `CatalogSearch`, `CatalogBrowser`) solo pintan lo que estas
// funciones devuelven: si dos sitios filtran distinto, el fallo
// está aquí y se ve en un solo sitio.
// ======================================================

import { normalize } from '../data/animeCategories';
import { claveGenero, normalizarGenero } from '../data/animeGenres';
import { toTextList } from './safeData';
import { textoEstado } from './seasonData';
import type { Anime, Character, Episode, Thread } from '../types';

// ======================================================
// PESTAÑAS PRINCIPALES
// ======================================================
// "series" y "movies" parten en dos lo que antes era un solo
// filtro "anime": las películas son animes con un único
// capítulo (así las guarda `cargar-anime.mjs`), y no hay
// ningún campo de formato en Firestore que las distinga.

export type MainTab = 'all' | 'series' | 'movies' | 'episodes' | 'characters' | 'threads';

/** Alias para no romper las importaciones que ya existían. */
export type SearchFilter = MainTab;

export const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'series', label: 'Series' },
  { id: 'movies', label: 'Películas' },
  { id: 'episodes', label: 'Episodios' },
  { id: 'characters', label: 'Personajes' },
  { id: 'threads', label: 'Hilos' },
];

/**
 * ¿Este anime es una película?
 *
 * Las pelis se cargan como un anime de un solo capítulo (ver
 * `yn-meta.mjs`, `tnk-meta.mjs`: EPISODIOS_TOTAL = 1). Una serie
 * con un único capítulo no existe en el catálogo, así que el
 * recuento basta y no hace falta migrar nada.
 */
export function esPelicula(anime: Pick<Anime, 'episodesCount'>): boolean {
  return (anime.episodesCount ?? 0) === 1;
}

// ======================================================
// ESTADO DE LOS FILTROS AVANZADOS
// ======================================================

export type OrdenWiki = 'defecto' | 'az' | 'za' | 'nuevos' | 'antiguos' | 'valorados';

export interface FiltrosAvanzados {
  /** Géneros marcados. Vacío = todos. Se cumple con que tenga UNO. */
  generos: string[];
  /** Año concreto. Si hay, manda sobre el intervalo. */
  anio: number | null;
  /** Intervalo de años, ambos extremos incluidos. */
  desde: number | null;
  hasta: number | null;
  /** Estados marcados, en palabra larga ('Finalizado'...). */
  estados: string[];
  /** Nota mínima del 1 al 10. 0 = sin filtro. */
  notaMin: number;
  orden: OrdenWiki;
  /**
   * Categorías de hilo marcadas (las del foro: 'Fantasía &
   * Aventura'...). Vacío = todas. Solo la usa la pestaña de
   * hilos; las de animes ya tienen su filtro temático (?wikiCat).
   */
  categorias: string[];
}

export const FILTROS_VACIOS: FiltrosAvanzados = {
  generos: [],
  anio: null,
  desde: null,
  hasta: null,
  estados: [],
  notaMin: 0,
  orden: 'defecto',
  categorias: [],
};

/** Etiquetas de estado que entiende el filtro, en palabra larga. */
export const ESTADOS_WIKI = ['En emisión', 'Finalizado', 'Próximamente'] as const;

/**
 * Cuántos filtros hay activos, para la insignia del botón.
 *
 * Cada grupo cuenta como uno o por elementos: los géneros y los
 * estados cuentan de uno en uno porque cada uno se puede quitar
 * por separado en las pastillas.
 */
export function contarFiltrosActivos(f: FiltrosAvanzados): number {
  let n = f.generos.length + f.estados.length + f.categorias.length;
  if (f.anio != null) n += 1;
  else if (f.desde != null || f.hasta != null) n += 1;
  if (f.notaMin > 0) n += 1;
  if (f.orden !== 'defecto') n += 1;
  return n;
}

/**
 * Deja solo los filtros compatibles con la pestaña nueva.
 *
 * - Películas: se cae 'En emisión', que no tiene sentido para
 *   una peli (ya estrenada o anunciada).
 * - Episodios: se quedan orden y nota mínima (la del capítulo);
 *   género, año y estado son del anime padre y ya filtran por él.
 * - Personajes: solo la ordenación. No tienen nota (solo "me
 *   gusta") y el resto es de su anime.
 * - Hilos: ordenación y categoría del foro. Lo demás es de
 *   animes y no les aplica.
 * - Animes: la categoría del foro no viaja; para eso está el
 *   filtro temático del catálogo (?wikiCat).
 */
export function sanearFiltros(f: FiltrosAvanzados, tab: MainTab): FiltrosAvanzados {
  if (tab === 'movies') {
    return { ...f, estados: f.estados.filter((e) => e !== 'En emisión'), categorias: [] };
  }
  if (tab === 'episodes') {
    return { ...f, generos: [], anio: null, desde: null, hasta: null, estados: [], categorias: [] };
  }
  if (tab === 'characters') {
    return {
      ...f,
      generos: [],
      anio: null,
      desde: null,
      hasta: null,
      estados: [],
      notaMin: 0,
      categorias: [],
    };
  }
  if (tab === 'threads') {
    return {
      ...f,
      generos: [],
      anio: null,
      desde: null,
      hasta: null,
      estados: [],
      notaMin: 0,
    };
  }
  return { ...f, categorias: [] };
}

// ======================================================
// OPCIONES QUE SALEN DE LOS DATOS
// ======================================================

/**
 * Todos los géneros del catálogo, ordenados. Sin duplicados.
 *
 * Se agrupa por clave normalizada, no por texto: "Accion" y
 * "Acción" son la misma opción y solo se pinta una vez. Los
 * valores que no son géneros ("[object Object]", "undefined"...)
 * se descartan aquí, para que no lleguen al panel.
 */
export function generosDisponibles(animes: Pick<Anime, 'genres'>[]): string[] {
  const porClave = new Map<string, string>();
  for (const a of animes) {
    for (const g of toTextList(a.genres)) {
      const nombre = normalizarGenero(g);
      if (!nombre) continue;
      const clave = normalize(nombre);
      if (!porClave.has(clave)) porClave.set(clave, nombre);
    }
  }
  return [...porClave.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Año mínimo y máximo del catálogo. Sin años no hay filtro. */
export function rangoAnios(animes: Pick<Anime, 'year'>[]): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const a of animes) {
    const y = typeof a.year === 'number' && Number.isFinite(a.year) ? a.year : 0;
    if (y > 0) {
      if (y < min) min = y;
      if (y > max) max = y;
    }
  }
  return min <= max ? { min, max } : null;
}

// ======================================================
// FILTRADO DE ANIMES
// ======================================================

/** ¿Pasa este anime los filtros avanzados? */
export function pasaFiltrosAnime(
  anime: Pick<Anime, 'genres' | 'year' | 'status' | 'rating'>,
  f: FiltrosAvanzados,
): boolean {
  if (f.generos.length > 0) {
    const suyos = new Set(
      toTextList(anime.genres)
        .map(claveGenero)
        .filter(Boolean),
    );
    const alguno = f.generos.some((g) => {
      const clave = claveGenero(g);
      return clave !== '' && suyos.has(clave);
    });
    if (!alguno) return false;
  }

  const y = typeof anime.year === 'number' ? anime.year : 0;
  if (f.anio != null) {
    if (y !== f.anio) return false;
  } else {
    if (f.desde != null && (y <= 0 || y < f.desde)) return false;
    if (f.hasta != null && (y <= 0 || y > f.hasta)) return false;
  }

  if (f.estados.length > 0) {
    // El estado en Firestore viene en palabra corta
    // ('finished') o larga ('Finalizado'): `textoEstado` las une.
    if (!f.estados.includes(textoEstado(anime.status))) return false;
  }

  if (f.notaMin > 0) {
    const nota = typeof anime.rating === 'number' ? anime.rating : 0;
    // Sin nota no filtra: un 0 significa "sin valorar", no "mala".
    if (nota <= 0 || nota < f.notaMin) return false;
  }

  return true;
}

/** ¿Es de series, de pelis, o de lo que pida la pestaña? */
export function pasaPestanaAnime(
  anime: Pick<Anime, 'episodesCount'>,
  tab: MainTab,
): boolean {
  if (tab === 'series') return !esPelicula(anime);
  if (tab === 'movies') return esPelicula(anime);
  return true;
}

// ======================================================
// ORDENACIÓN
// ======================================================

function porTitulo(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

/** Animes ya filtrados, en el orden pedido. No muta la lista. */
export function ordenarAnimes<T extends Pick<Anime, 'title' | 'year' | 'rating'>>(
  lista: T[],
  orden: OrdenWiki,
): T[] {
  const copia = [...lista];
  switch (orden) {
    case 'az':
      return copia.sort((a, b) => porTitulo(a.title, b.title));
    case 'za':
      return copia.sort((a, b) => porTitulo(b.title, a.title));
    case 'nuevos':
      return copia.sort((a, b) => (b.year || 0) - (a.year || 0) || porTitulo(a.title, b.title));
    case 'antiguos':
      return copia.sort((a, b) => (a.year || 0) - (b.year || 0) || porTitulo(a.title, b.title));
    case 'valorados':
      return copia.sort((a, b) => (b.rating || 0) - (a.rating || 0) || porTitulo(a.title, b.title));
    default:
      return copia;
  }
}

/** Capítulos en el orden pedido. Sin fecha ni nota, como vengan. */
export function ordenarEpisodios<T extends Pick<Episode, 'title' | 'airDate' | 'rating'>>(
  lista: T[],
  orden: OrdenWiki,
): T[] {
  const copia = [...lista];
  switch (orden) {
    case 'az':
      return copia.sort((a, b) => porTitulo(a.title, b.title));
    case 'za':
      return copia.sort((a, b) => porTitulo(b.title, a.title));
    case 'nuevos':
      return copia.sort((a, b) => String(b.airDate || '').localeCompare(String(a.airDate || '')));
    case 'antiguos':
      return copia.sort((a, b) => String(a.airDate || '').localeCompare(String(b.airDate || '')));
    case 'valorados':
      return copia.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    default:
      return copia;
  }
}

/** Personajes: por nombre o por "me gusta". Sin fecha que valga. */
export function ordenarPersonajes<T extends Pick<Character, 'name' | 'likesCount'>>(
  lista: T[],
  orden: OrdenWiki,
): T[] {
  const copia = [...lista];
  switch (orden) {
    case 'za':
      return copia.sort((a, b) => porTitulo(b.name, a.name));
    case 'valorados':
      return copia.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    case 'az':
    default:
      // 'nuevos' y 'antiguos' no tienen sentido sin fecha: A-Z.
      return copia.sort((a, b) => porTitulo(a.name, b.name));
  }
}

/** Hilos: por fecha de creación o por "me gusta". */
export function ordenarHilos<T extends Pick<Thread, 'title' | 'createdAt' | 'likesCount'>>(
  lista: T[],
  orden: OrdenWiki,
): T[] {
  const copia = [...lista];
  switch (orden) {
    case 'az':
      return copia.sort((a, b) => porTitulo(a.title, b.title));
    case 'za':
      return copia.sort((a, b) => porTitulo(b.title, a.title));
    case 'antiguos':
      return copia.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    case 'valorados':
      return copia.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    case 'nuevos':
    default:
      // Ya vienen nuevos primero desde Firestore.
      return copia.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }
}

// ======================================================
// SIN DUPLICADOS
// ======================================================
// `Object.values(...).flat()` puede traer el mismo documento
// dos veces si el contexto lo duplica. Se desduplica por id
// antes de pintar, para que ningún título salga repetido.

export function sinDuplicados<T extends { id: string }>(lista: T[]): T[] {
  const vistos = new Set<string>();
  return lista.filter((item) => {
    if (vistos.has(item.id)) return false;
    vistos.add(item.id);
    return true;
  });
}

/** ¿Este hilo es de una categoría marcada? Vacío = todas. */
export function pasaCategoriaHilo(
  thread: Pick<Thread, 'categoryName'>,
  f: FiltrosAvanzados,
): boolean {
  if (f.categorias.length === 0) return true;
  // El nombre viene del foro tal como lo escribió el autor al
  // publicar: se compara normalizado, como las temáticas.
  const suya = normalize(thread.categoryName);
  return f.categorias.some((c) => normalize(c) === suya);
}

/** ¿Este capítulo es de un anime que pasa los filtros? */
export function episodioDeAnimeValido(
  animePorId: Map<string, Pick<Anime, 'genres' | 'year' | 'status' | 'rating'>>,
  animeId: string,
  f: FiltrosAvanzados,
): boolean {
  const anime = animePorId.get(animeId);
  // Sin ficha del padre no se puede juzgar: se enseña.
  if (!anime) return true;
  return pasaFiltrosAnime(anime, f);
}

/** ¿Este personaje es de un anime que pasa los filtros? */
export function personajeDeAnimeValido(
  animePorId: Map<string, Pick<Anime, 'genres' | 'year' | 'status' | 'rating'>>,
  animeId: string,
  f: FiltrosAvanzados,
): boolean {
  return episodioDeAnimeValido(animePorId, animeId, f);
}
