import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { invalidateCache, PUBLIC_CACHE } from '../lib/firestoreCache';
import {
  estadoCorto,
  seasonIdsDe,
  seasonKeysDe,
  numeroDeEpisodioValido,
  ERROR_NUMERO_EPISODIO,
} from '../utils/seasonData';
import { normalizaTags } from '../utils/tags';

// ======================================================
// ESCRITURA DEL CATÁLOGO DESDE EL PANEL DE ADMIN
// ======================================================
// Todas las reglas de estos Tomorrow dan "allow write if isAdmin()",
// así que aquí no hace falta comprobar permisos: si la escritura
// pasa, es que quien la hace es admin.
//
// Estas funciones usan los métodos de instancia (setDoc, updateDoc,
// deleteDoc) a propósito, NO los "ref.set()" de la versión antigua:
// en firebase v12 esos métodos ya no existen y no compilan.
// ======================================================

export type CatalogSection =
  | 'animes'
  | 'seasons'
  | 'episodes'
  | 'characters'
  | 'trivia'
  | 'categories'
  | 'threads'
  | 'users'
  | 'tickets';

export const SECTION_LABELS: Record<CatalogSection, string> = {
  animes: 'Anime',
  seasons: 'Temporada',
  episodes: 'Episodio',
  characters: 'Personaje',
  trivia: 'Curiosidad',
  categories: 'Categoría',
  threads: 'Hilo',
  users: 'Usuario',
  tickets: 'Ticket',
};

/**
 * Sección -> colección real de Firestore.
 *
 * Casi todas se llaman igual, pero "trivia" vive en "trivia_extras"
 * (por el plural, que viene de la colección en inglés de siempre).
 *
 * Esto DEBERÍA existir solo en un sitio. Estaba únicamente en
 * useAdminCatalog, que es donde se LEE, y las funciones genéricas
 * de escritura usaban el nombre de la sección tal cual. Resultado:
 * el panel leía las curiosidades de "trivia_extras" y al guardar
 * escribía en "trivia", una colección que no existe y para la que
 * no hay ninguna regla, así que Firestore respondía "Missing or
 * insufficient permissions". Crear sí funcionaba, porque
 * createTrivia sí usaba el nombre bueno; editar y borrar no.
 */
export const SECTION_COLLECTIONS: Record<CatalogSection, string> = {
  animes: 'animes',
  seasons: 'seasons',
  episodes: 'episodes',
  characters: 'characters',
  trivia: 'trivia_extras',
  categories: 'categories',
  threads: 'threads',
  users: 'users',
  tickets: 'support_tickets',
};

/** Colección donde vive una sección. */
export const collectionOf = (section: CatalogSection): string =>
  SECTION_COLLECTIONS[section];

/** Límites de longitud, para no escribir basura ni textos enormes. */
const LIMITS = {
  title: 200,
  name: 120,
  synopsis: 4000,
  description: 4000,
  url: 1000,
} as const;

function assertText(
  value: unknown,
  field: string,
  max: number,
  required = true,
): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) {
    throw new Error(`El campo "${field}" no puede estar vacío.`);
  }
  if (text.length > max) {
    throw new Error(`"${field}" no puede superar los ${max} caracteres.`);
  }
  return text;
}

/**
 * Nota de 1 a 10, la misma que se pone a un anime. Vacío o 0
 * significa "sin nota": no se escribe nada en Firestore para no
 * distinguir un 0 de un episodio que nadie ha puntuado todavía.
 */
export function normalizeRating(value: unknown): number {
  if (value === '' || value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num <= 0) return 0;
  return Math.min(10, Math.round(num * 10) / 10);
}

/** "Kaguya-sama: Love is War" → "kaguya-sama-love-is-war" */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Devuelve un slug libre dentro de la colección. Si el título ya
 * produce un slug que existe ("Anime" y "Anime 2"), añade "-2",
 * "-3"... para que los dos se puedan distinguir.
 */
async function uniqueSlug(collectionName: string, title: string): Promise<string> {
  const base = slugify(title) || 'elemento';
  let candidate = base;
  let n = 2;

  // Antes se descargaba la colección entera solo para saber si un id
  // estaba libre. Lo habitual es una única lectura del candidato.
  while ((await getDoc(doc(db, collectionName, candidate))).exists()) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

const CACHE_KEYS: Record<string, string> = {
  animes: 'community:animes',
  seasons: 'community:seasons',
  episodes: 'community:episodes',
  characters: 'community:characters',
  categories: 'community:categories',
  trivia_extras: 'community:trivia-extras',
  threads: 'community:threads',
};

function invalidarCatalogo(...colecciones: string[]): void {
  colecciones.forEach((coleccion) => {
    const key = CACHE_KEYS[coleccion];
    if (key) invalidateCache(key, PUBLIC_CACHE);
    // Las páginas de 60 del catálogo y sus recuentos también se
    // cachean. Si se edita un episodio o un personaje, la página
    // vieja no puede seguir enseñándose durante cinco minutos.
    invalidateCache(`catalog:page:${coleccion}`, PUBLIC_CACHE);
    invalidateCache(`catalog:count:${coleccion}`, PUBLIC_CACHE);
  });

  // La ficha lee el documento completo de una serie aparte.
  if (colecciones.includes('animes')) invalidateCache('anime-doc:', PUBLIC_CACHE);
}

// ────────────────────────────────────────────────────────
// CREAR
// ────────────────────────────────────────────────────────

export interface NewAnimeInput {
  title: string;
  synopsis: string;
  year: string;
  status: string;
  category: string;
  /**
   * Todas las categorías de la serie. Opcional: si no viene, se
   * guarda solo "category". Se escribe además de "category" (no en
   * vez de) porque hay partes de la app que solo leen la principal,
   * y esas tienen que seguir funcionando.
   */
  categories?: string[];
  genres: string;
  studio?: string;
  coverUrl?: string;
  bannerUrl?: string;
  /** Encuadre de la portada, ajustado en el formulario de crear. */
  coverFocus?: { x: number; y: number };
  /** Encuadre del banner, ajustado en el formulario de crear. */
  bannerFocus?: { x: number; y: number };
}

export async function createAnime(input: NewAnimeInput): Promise<string> {
  const title = assertText(input.title, 'título', LIMITS.title);
  const synopsis = assertText(input.synopsis, 'sinopsis', LIMITS.synopsis);
  const year = Number(input.year);

  if (input.year && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
    throw new Error('El año debe ser un número entre 1900 y 2100.');
  }

  const id = await uniqueSlug('animes', title);

  await setDoc(doc(db, 'animes', id), {
    id,
    title,
    slug: id,
    synopsis,
    coverUrl: input.coverUrl ?? '',
    bannerUrl: input.bannerUrl ?? '',
    // Punto de enfoque del recorte de cada imagen. El panel lo
    // ajusta a mano cuando la foto no sale bien recortada; nace
    // centrado. Van separados porque la portada se recorta en un
    // recuadro vertical pequeño y el banner en uno horizontal
    // enorme: lo que va bien para uno no va bien para el otro.
    coverFocus: input.coverFocus ?? { x: 0.5, y: 0.5 },
    bannerFocus: input.bannerFocus ?? { x: 0.5, y: 0.5 },
    year: input.year ? year : 0,
    status: input.status || 'emitiendo',
    // Debe coincidir EXACTAMENTE con el nombre de una categoría
    // de /categories, porque así es como la wiki agrupa los
    // animes. Si no coincide, el anime queda fuera de su filtro.
    category: input.category,
    // Lista completa de categorías, para las series que encajan en
    // más de una. Se omiten las repetidas y las vacías.
    ...(input.categories && input.categories.length > 0
      ? {
          categories: Array.from(new Set(input.categories.map((c) => c.trim()).filter(Boolean))),
        }
      : {}),
    genres: input.genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean),
    studio: (input.studio ?? '').trim(),
    // Estos dos los pinta la ficha técnica. Se dejan a 0 en vez de
    // omitirlos, para que la wiki no tenga que comprobar si existen.
    rating: 0,
    episodesCount: 0,
    // El panel usa este contador para el filtro "Con temporadas"
    // sin descargar toda la colección `seasons`.
    seasonsCount: 0,
    streaming: [],
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });

  invalidarCatalogo('animes');
  return id;
}

export interface NewEpisodeInput {
  animeId: string;
  /** Vacío = temporada 1 implícita del anime. */
  seasonId?: string;
  number: number;
  title: string;
  description: string;
  airDate: string;
  thumbnailUrl?: string;
  rating?: number;
  /** Encuadre de la miniatura, ajustado en el formulario de crear. */
  thumbnailFocus?: { x: number; y: number };
}

export async function createEpisode(input: NewEpisodeInput): Promise<string> {
  const title = assertText(input.title, 'título', LIMITS.title);
  const description = assertText(input.description, 'descripción', LIMITS.description, false);

  // Un episodio puede llevar decimales para las OVAs, que van entre
  // dos capitulos sin renumerar la temporada entera. Ver
  // `numeroDeEpisodioValido`.
  const numero = numeroDeEpisodioValido(input.number);

  if (numero === null) {
    throw new Error(ERROR_NUMERO_EPISODIO);
  }

  const rating = normalizeRating(input.rating);

  const ref = doc(collection(db, 'episodes'));

  await setDoc(ref, {
    animeId: input.animeId,
    // El campo solo se escribe si hay temporada: dejarlo como ""
    // haría que "sin temporada" y "temporada vacía" fueran dos
    // cosas distintas al filtrar.
    ...(input.seasonId ? { seasonId: input.seasonId } : {}),
    number: input.number,
    title,
    description,
    airDate: input.airDate || '',
    thumbnailUrl: input.thumbnailUrl ?? '',
    thumbnailFocus: input.thumbnailFocus ?? { x: 0.5, y: 0.5 },
    rating,
    likesCount: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });

  invalidarCatalogo('episodes');
  return ref.id;
}

export interface NewCharacterInput {
  animeId: string;
  /**
   * Temporadas en las que sale. Vacío = compartido, que es lo
   * normal. Ver `seasonIdsDe` en utils/seasonData.ts.
   */
  seasonIds?: string[];
  name: string;
  description: string;
  role: string;
  imageUrl?: string;
  /** Nombre en japonés, como "白銀 御行". Opcional. */
  japaneseName?: string;
  /** Actor de doblaje, como "Makoto Furukawa". Opcional. */
  voiceActor?: string;
  /** Etiquetas que salen bajo el nombre en la wiki ("#Destacados"). */
  tags?: string[];
  /** Encuadre de la imagen, ajustado en el formulario de crear. */
  imageFocus?: { x: number; y: number };
}

export async function createCharacter(input: NewCharacterInput): Promise<string> {
  const name = assertText(input.name, 'nombre', LIMITS.name);
  const description = assertText(input.description, 'descripción', LIMITS.description, false);

  const ref = doc(collection(db, 'characters'));
  const seasonIds = normalizaSeasonIds(input.seasonIds);

  await setDoc(ref, {
    animeId: input.animeId,
    // Array de temporadas, aunque venga vacío: vacío es
    // COMPARTIDO (sale en todas), y guardar el array lo deja
    // explícito en vez de depender de que falte el campo.
    seasonIds,
    // Índice consultable: ['*'] si es compartido, o los ids.
    seasonKeys: seasonKeysDe({ seasonIds }),
    name,
    slug: slugify(name),
    description,
    role: input.role || 'main',
    imageUrl: input.imageUrl ?? '',
    // Nombre japonés y seiyuu. Vacíos si no se rellenan: en la
    // wiki el bloque solo se pinta cuando hay algo, así que
    // guardar "" es la forma de no dejarlo a medias.
    japaneseName: input.japaneseName ?? '',
    voiceActor: input.voiceActor ?? '',
    // Punto de enfoque de la imagen. El panel lo ajusta a mano
    // cuando la foto no sale bien recortada en la tarjeta de la
    // wiki; aquí nace centrado.
    imageFocus: input.imageFocus ?? { x: 0.5, y: 0.5 },
// Etiquetas. Se guardan siempre, aunque no haya ninguna: el
    // buscador y el filtro de "Destacados" de la wiki recorren el
    // array, y un documento sin él se queda fuera de los dos.
    tags: normalizaTags(input.tags),
    likesCount: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });

  invalidarCatalogo('characters');
  return ref.id;
}

// ────────────────────────────────────────────────────────
// TEMPORADAS
// ────────────────────────────────────────────────────────

export interface NewSeasonInput {
  animeId: string;
  number: number;
  title?: string;
  synopsis?: string;
  posterUrl?: string;
  /** Banner propio de la temporada. Vacío = se usa el del anime. */
  bannerUrl?: string;
  /** Encuadre de los recortes. Ver `Character.imageFocus`. */
  posterFocus?: { x: number; y: number };
  bannerFocus?: { x: number; y: number };
  year?: number;
  status?: string;
  /**
   * Ficha técnica. Los tres son PROPIOS de la temporada: vacío o 0
   * hace que la wiki herede el valor del anime (ver `fichaDe`).
   */
  studio?: string;
  rating?: number;
  episodesCount?: number;
}

/**
 * Crea una temporada dentro de un anime.
 *
 * El id se genera a partir del anime y el número ("kaguya-sama-s2")
 * en vez de dejar que lo ponga Firestore: así se puede abrir la
 * temporada directamente desde el enlace sin tener que buscarla
 * antes, y el nombre se lee en la URL de la wiki.
 *
 * El póster y el banner son PROPIOS de la temporada, y no sustituyen
 * los del anime: la wiki usa los de la temporada que se esté
 * viendo y, si no tiene, cae en los del anime. Por eso los dos
 * se guardan aunque vengan vacíos, para que "todavía no tiene
 * imagen propia" se distinga de "no existe el campo".
 */
export async function createSeason(input: NewSeasonInput): Promise<string> {
  if (!Number.isInteger(input.number) || input.number < 1) {
    throw new Error('El número de temporada debe ser 1 o mayor.');
  }

  const animeId = assertText(input.animeId, 'anime', LIMITS.name);
  const year = Number(input.year ?? 0);
  if (input.year && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
    throw new Error('El año debe ser un número entre 1900 y 2100.');
  }

  const episodesCount = Number(input.episodesCount ?? 0);
  if (!Number.isInteger(episodesCount) || episodesCount < 0) {
    throw new Error('Los capítulos emitidos deben ser un número entero.');
  }

  const id = await uniqueSlug('seasons', `${animeId}-s${input.number}`);

  await setDoc(doc(db, 'seasons', id), {
    animeId,
    number: input.number,
    title: (input.title ?? '').trim(),
    synopsis: (input.synopsis ?? '').trim(),
    posterUrl: input.posterUrl ?? '',
    bannerUrl: input.bannerUrl ?? '',
    posterFocus: input.posterFocus ?? { x: 0.5, y: 0.5 },
    bannerFocus: input.bannerFocus ?? { x: 0.5, y: 0.5 },
    year: input.year ? year : 0,
    status: input.status || 'Próximamente',
    // Ficha técnica. Se escribe aunque venga vacía, para que
    // "todavía no lo he rellenado" (y por tanto se hereda lo del
    // anime) sea una decisión y no un campo que falte.
    studio: (input.studio ?? '').trim(),
    rating: normalizeRating(input.rating),
    episodesCount: episodesCount ?? 0,
    createdAt: serverTimestamp(),
  });

  // Contador desnormalizado para que la lista del panel no tenga
  // que leer las 481 temporadas solo para filtrar por "tiene
  // temporadas". `increment` es atómico y funciona aunque el campo
  // no existiera.
  await setDoc(
    doc(db, 'animes', animeId),
    { seasonsCount: increment(1) },
    { merge: true },
  );

  invalidarCatalogo('seasons', 'animes');
  return id;
}


/**
 * Cambia de temporada un EPISODIO.
 *
 * Un episodio es de una sola temporada, así que aquí un solo id.
 * Los personajes no entran por esta puerta: como pueden estar en
 * varias, van con `setCharacterSeasons`.
 *
 * Se usa deleteField en vez de guardar "" porque "sin temporada"
 * tiene que seguir siendo la ausencia del campo: es lo que
 * distingue a los documentos antiguos de los ya organizados, y
 * sobre todo lo que hace que el filtro de la wiki no tenga que
 * distinguir entre null y cadena vacía.
 */
export async function moveToSeason(
  itemId: string,
  seasonId: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'episodes', itemId), {
    seasonId: seasonId ? seasonId : deleteField(),
  });
  invalidarCatalogo('episodes');
}

/** Ids de temporada limpios: sin vacíos y sin repetidos. */
function normalizaSeasonIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((id): id is string => typeof id === 'string' && id !== '')),
  );
}

/**
 * Fija las temporadas en las que sale un personaje.
 *
 * Lista vacía = COMPARTIDO, que sale en todas. Se escribe siempre,
 * porque "todas" es una decisión y no la ausencia de campo.
 *
 * El "seasonId" antiguo se borra al guardar: a partir de aquí
 * manda "seasonIds", y dejarlo puesto haría que un personaje
 * compartido (array vacío) siguiera apareciendo solo en la
 * temporada que tenía antes.
 */
export async function setCharacterSeasons(
  characterId: string,
  seasonIds: string[],
): Promise<void> {
  const ids = normalizaSeasonIds(seasonIds);
  await updateDoc(doc(db, 'characters', characterId), {
    seasonIds: ids,
    seasonKeys: seasonKeysDe({ seasonIds: ids }),
    seasonId: deleteField(),
  });
  invalidarCatalogo('characters');
}

// ======================================================
// FICHAS POR TEMPORADA
// ======================================================
// La ficha (año, estado, estudio, puntuación, capítulos,
// portada y banner) es de cada temporada: la 2 puede tener
// estudio, año y portada distintos de la 1. Lo único que se
// comparte entre temporadas son las categorías, los géneros y
// las plataformas de streaming, que son de la serie entera.
//
// Lo que NO se copia a la ficha del anime: el nombre de la
// temporada. "Segunda Parte" es el subtítulo de esa temporada, y
// si se copiara al anime acabaría llamándose "Kaguya-sama: Love
// is War: Segunda Parte" en las tarjetas del catálogo.
const CAMPO_ANIME_POR_CAMPO_TEMPORADA: Record<string, string> = {
  year: 'year',
  status: 'status',
  studio: 'studio',
  rating: 'rating',
  episodesCount: 'episodesCount',
  posterUrl: 'coverUrl',
  posterFocus: 'coverFocus',
  bannerUrl: 'bannerUrl',
  bannerFocus: 'bannerFocus',
};

/**
 * Guarda la ficha de una temporada y, si es la primera, también la
 * del anime.
 *
 * ¿Por qué la copia? Porque el anime es lo que leen las tarjetas
 * del catálogo, el buscador, la barra lateral y el filtro de
 * estado del panel: sitios que no saben qué temporada se está
 * viendo. Si la portada de la temporada 1 se guardara solo en su
 * documento, las tarjetas se quedarían con la imagen de siempre y
 * parecería que la edición no ha hecho nada.
 *
 * La temporada 1 es la base de la serie: por eso copia. La 2 y la
 * 3 solo guardan lo suyo.
 */
export async function saveSeasonFields(
  seasonId: string,
  animeId: string,
  esLaPrimera: boolean,
  fields: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, 'seasons', seasonId), fields);
  invalidarCatalogo('seasons');

  if (!esLaPrimera) return;

  const paraElAnime: Record<string, unknown> = {};
  Object.entries(fields).forEach(([campo, valor]) => {
    const destino = CAMPO_ANIME_POR_CAMPO_TEMPORADA[campo];
    if (!destino) return;
    // El estado se traduce al vocabulario corto que espera el
    // filtro del panel. Ver `estadoCorto`.
    paraElAnime[destino] = destino === 'status' ? estadoCorto(valor) : valor;
  });

  if (Object.keys(paraElAnime).length > 0) {
    await updateDoc(doc(db, 'animes', animeId), paraElAnime);
    invalidarCatalogo('animes');
  }
}


export interface NewTriviaInput {
  title: string;
  characterOrAnime: string;
  fact: string;
  category: string;
  imageUrl?: string;
}

export async function createTrivia(input: NewTriviaInput): Promise<string> {
  const title = assertText(input.title, 'título', LIMITS.title);
  const fact = assertText(input.fact, 'curiosidad', LIMITS.synopsis);

  const ref = doc(collection(db, 'trivia_extras'));

  await setDoc(ref, {
    title,
    characterOrAnime: assertText(input.characterOrAnime, 'personaje o anime', LIMITS.name),
    fact,
    category: input.category || 'Curiosidades',
    imageUrl: input.imageUrl ?? '',
    likes: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });

  invalidarCatalogo('trivia_extras');
  return ref.id;
}

// ────────────────────────────────────────────────────────
// CATEGORÍAS
// ────────────────────────────────────────────────────────

/**
 * El id se genera a partir del nombre para que sea legible y
 * no aleatorio: es el mismo valor con el que los hilos guardan
 * su categoryId.
 */
export async function createCategory(
  name: string,
  description: string,
  color: string,
): Promise<string> {
  const cleanName = assertText(name, 'nombre de la categoría', LIMITS.name);

  const id = await uniqueSlug('categories', cleanName);

  await setDoc(doc(db, 'categories', id), {
    id,
    name: cleanName,
    slug: id,
    description: description.trim(),
    // Clases de Tailwind para el color de la etiqueta.
    color: color.trim(),
    // Los contadores los recalcula la migración: no se ponen a
    // cero aquí porque borraría los valores buenos si alguien
    // crease una categoría nueva.
    animeCount: 0,
    threadsCount: 0,
    createdAt: serverTimestamp(),
  });

  invalidarCatalogo('categories');
  return id;
}

// ────────────────────────────────────────────────────────
// MODIFICAR
// ────────────────────────────────────────────────────────

export type SectionOf<S extends CatalogSection> = S;

/** Cambia varios campos a la vez. Los no indicados se quedan. */
export async function updateFields(
  section: CatalogSection,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  );

  if (Object.keys(clean).length === 0) return;

  await updateDoc(doc(db, collectionOf(section), itemId), clean);
  invalidarCatalogo(collectionOf(section));
}

/** Guarda un único campo (normalmente una URL de imagen). */
export async function setField(
  section: CatalogSection,
  itemId: string,
  field: string,
  value: unknown,
): Promise<void> {
  await setDoc(doc(db, collectionOf(section), itemId), { [field]: value }, { merge: true });
  invalidarCatalogo(collectionOf(section));
}

// ────────────────────────────────────────────────────────
// ELIMINAR
// ────────────────────────────────────────────────────────

export async function deleteItem(section: CatalogSection, itemId: string): Promise<void> {
  await deleteDoc(doc(db, collectionOf(section), itemId));
  invalidarCatalogo(collectionOf(section));
}

/**
 * Borra un anime junto con todo lo que cuelga de él: sus
 * temporadas, y los episodios y personajes de cada una.
 *
 * Firestore no borra en cascada. Si solo se borrara el anime, sus
 * episodios y personajes se quedarían huérfanos en la base de
 * datos, ocupando cuota y sin ninguna forma de llegar a ellos
 * desde la interfaz, porque la wiki solo llega a ellos a través
 * de su anime. Para eso está este borrado en cascada.
 *
 * Los episodios y personajes se filtran por animeId, no por
 * seasonId: así también caen los que no tienen temporada, que son
 * los que ya había antes de que existiera el concepto.
 */
export async function deleteAnimeCascade(animeId: string): Promise<{
  seasons: number;
  episodes: number;
  characters: number;
}> {
  // Un único `where` no necesita índice compuesto y evita descargar
  // episodios, temporadas y personajes de todos los demás animes.
  const [seasonSnap, episodeSnap, characterSnap] = await Promise.all([
    getDocs(query(collection(db, 'seasons'), where('animeId', '==', animeId))),
    getDocs(query(collection(db, 'episodes'), where('animeId', '==', animeId))),
    getDocs(query(collection(db, 'characters'), where('animeId', '==', animeId))),
  ]);

  const seasonDocs = seasonSnap.docs;
  const episodeDocs = episodeSnap.docs;
  const characterDocs = characterSnap.docs;

  // Firestore admite un máximo de 500 operaciones por batch. El
  // catálogo es pequeño, pero partirlo evita que un anime con
  // muchas temporadas falle justo al borrarlo.
  const refs = [
    ...episodeDocs.map((d) => d.ref),
    ...characterDocs.map((d) => d.ref),
    ...seasonDocs.map((d) => d.ref),
    doc(db, 'animes', animeId),
  ];

  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  invalidarCatalogo('animes', 'seasons', 'episodes', 'characters');
  return {
    seasons: seasonDocs.length,
    episodes: episodeDocs.length,
    characters: characterDocs.length,
  };
}

/**
 * Borra una temporada con lo que cuelga de ella.
 *
 * Los episodios y personajes que se le quitan NO se borran. Los
 * episodios vuelven a la temporada 1 implícita del anime, que es
 * donde se han estado mostrando los que nunca tuvieron temporada.
 *
 * De los personajes solo se quita LA TEMPORADA BORRADA, y el
 * resto se respeta: alguien que estaba en la 2 y en la 3 pasa a
 * estar solo en la 3. Si era su única temporada, se queda con la
 * lista vacía, que es lo mismo que ser COMPARTIDO (sale en
 * todas). Perder el resto sería castigar al personaje por borrar
 * una temporada.
 *
 * Borrarlos en cascada perdería contenido del autor, que es lo
 * contrario de lo que alguien quiere al quitar una temporada que
 * se creó por error.
 */
export async function deleteSeasonCascade(
  seasonId: string,
): Promise<{ episodes: number; characters: number }> {
  const seasonSnap = await getDoc(doc(db, 'seasons', seasonId));
  const animeId = typeof seasonSnap.data()?.animeId === 'string'
    ? String(seasonSnap.data()?.animeId)
    : '';

  const [episodeSnap, charactersNew, charactersLegacy] = await Promise.all([
    getDocs(query(collection(db, 'episodes'), where('seasonId', '==', seasonId))),
    getDocs(query(collection(db, 'characters'), where('seasonIds', 'array-contains', seasonId))),
    getDocs(query(collection(db, 'characters'), where('seasonId', '==', seasonId))),
  ]);

  const episodeDocs = episodeSnap.docs;

  // Se admiten los dos formatos sin descargar personajes ajenos a
  // esta temporada. El mapa evita duplicados si un documento antiguo
  // conserva los dos campos durante la migración.
  const porId = new Map<string, (typeof charactersNew.docs)[number]>();
  [...charactersNew.docs, ...charactersLegacy.docs].forEach((d) => porId.set(d.id, d));
  const personajes = [...porId.values()]
    .map((d) => ({ ref: d.ref, ids: seasonIdsDe(d.data()) }))
    .filter((p) => p.ids.includes(seasonId));

  const batch = writeBatch(db);
  batch.delete(doc(db, 'seasons', seasonId));

  // Null borra el campo: el episodio vuelve a la temporada 1
  // implícita. Sigue apareciendo en la wiki.
  episodeDocs.forEach((d) => batch.update(d.ref, { seasonId: null }));

  personajes.forEach(({ ref, ids }) => {
    const restantes = ids.filter((id) => id !== seasonId);
    batch.update(ref, {
      seasonIds: restantes,
      seasonKeys: seasonKeysDe({ seasonIds: restantes }),
      // El campo antiguo se borra también, o volvería a colar la
      // temporada que se está eliminando.
      seasonId: deleteField(),
    });
  });

  await batch.commit();

  if (animeId) {
    const animeRef = doc(db, 'animes', animeId);
    const animeSnap = await getDoc(animeRef);
    if (animeSnap.exists()) {
      const actual = Number(animeSnap.data()?.seasonsCount);
      const siguiente = Number.isFinite(actual) && actual > 0 ? actual - 1 : 0;
      await updateDoc(animeRef, { seasonsCount: siguiente });
    }
  }

  invalidarCatalogo('seasons', 'episodes', 'characters', 'animes');

  return { episodes: episodeDocs.length, characters: personajes.length };
}
