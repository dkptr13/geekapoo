// Lógica pura del índice de búsqueda.
//
// Este módulo no habla con Firestore ni escribe archivos: transforma
// documentos REST al formato del índice, fusiona secciones y comprueba
// integridad. Así la reconstrucción completa y la incremental se pueden
// comparar con las mismas funciones y se pueden probar sin red.

export const VERSION_INDICE = 1;

/** Colecciones de Firestore que alimentan el índice. */
export const SECCIONES = [
  'animes',
  'seasons',
  'episodes',
  'characters',
  'streamingAvailability',
];

/** Nombre de la sección dentro del JSON del índice. */
export const CLAVE_INDICE = {
  animes: 'animes',
  seasons: 'seasons',
  episodes: 'episodes',
  characters: 'characters',
  streamingAvailability: 'streaming',
};

/** Si cambia una colección, qué partes del índice se reconstruyen. */
export const DEPENDENCIAS = {
  animes: ['animes'],
  seasons: ['seasons'],
  episodes: ['episodes'],
  characters: ['characters'],
  streamingAvailability: ['streaming'],
};

export const CAMPOS = {
  animes: [
    'slug',
    'title',
    'japaneseTitle',
    'alternativeTitles',
    'synopsis',
    'genres',
    'studio',
    'category',
    'categories',
    'year',
    'status',
    'rating',
    'episodesCount',
    'seasonsCount',
    'likesCount',
    'viewsCount',
    'communityRatingSum',
    'communityRatingCount',
    'communityRatingAvg',
    'coverUrl',
    'bannerUrl',
    'coverFocus',
    'bannerFocus',
  ],
  episodes: [
    'animeId',
    'seasonId',
    'number',
    'title',
    'romajiTitle',
    'description',
    'thumbnailUrl',
    'thumbnailFocus',
    'airDate',
    'duration',
    'rating',
  ],
  characters: [
    'animeId',
    'seasonIds',
    'name',
    'japaneseName',
    'aliases',
    'slug',
    'imageUrl',
    'imageFocus',
    'description',
    'role',
    'voiceActor',
    'likesCount',
    'tags',
  ],
  seasons: [
    'animeId',
    'number',
    'title',
    'synopsis',
    'year',
    'status',
    'studio',
    'rating',
    'episodesCount',
    'posterUrl',
    'bannerUrl',
    'posterFocus',
    'bannerFocus',
    'createdAt',
  ],
  streamingAvailability: [
    'animeId',
    'platformId',
    'region',
    'status',
    'accessType',
    'url',
    'verifiedAt',
  ],
};

export function valor(v) {
  if (!v || typeof v !== 'object') return '';
  if (v.nullValue !== undefined) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.timestampValue !== undefined) return v.timestampValue;

  if (v.arrayValue !== undefined) {
    return (v.arrayValue.values ?? []).map(valor);
  }
  if (v.mapValue !== undefined) {
    return Object.fromEntries(
      Object.entries(v.mapValue.fields ?? {}).map(([clave, contenido]) => [
        clave,
        valor(contenido),
      ]),
    );
  }

  return '';
}

const texto = (v) => (typeof v === 'string' ? v : '');
const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const lista = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : undefined);

export function animeDe(doc) {
  const f = doc.f;
  return {
    id: doc.id,
    slug: texto(valor(f.slug)) || doc.id,
    title: texto(valor(f.title)),
    actualizado: doc.actualizado ?? '',
    japaneseTitle: texto(valor(f.japaneseTitle)),
    alternativeTitles: lista(valor(f.alternativeTitles)),
    synopsis: texto(valor(f.synopsis)),
    genres: lista(valor(f.genres)),
    studio: texto(valor(f.studio)),
    category: texto(valor(f.category)),
    categories: lista(valor(f.categories)),
    year: numero(valor(f.year)),
    status: texto(valor(f.status)),
    rating: numero(valor(f.rating)),
    episodesCount: numero(valor(f.episodesCount)),
    seasonsCount: numero(valor(f.seasonsCount)),
    coverUrl: texto(valor(f.coverUrl)),
    bannerUrl: texto(valor(f.bannerUrl)),
    ...(objeto(valor(f.coverFocus)) ? { coverFocus: objeto(valor(f.coverFocus)) } : {}),
    ...(objeto(valor(f.bannerFocus)) ? { bannerFocus: objeto(valor(f.bannerFocus)) } : {}),
    streaming: [],
    likesCount: numero(valor(f.likesCount)),
    likedBy: [],
    commentsCount: 0,
    viewsCount: numero(valor(f.viewsCount)),
    communityRatingSum: numero(valor(f.communityRatingSum)),
    communityRatingCount: numero(valor(f.communityRatingCount)),
    communityRatingAvg: numero(valor(f.communityRatingAvg)),
  };
}

export function episodioDe(doc) {
  const f = doc.f;
  return {
    id: doc.id,
    animeId: texto(valor(f.animeId)),
    number: numero(valor(f.number)),
    title: texto(valor(f.title)),
    romajiTitle: texto(valor(f.romajiTitle)),
    description: texto(valor(f.description)).slice(0, 160),
    thumbnailUrl: texto(valor(f.thumbnailUrl)),
    airDate: texto(valor(f.airDate)),
    duration: texto(valor(f.duration)),
    rating: numero(valor(f.rating)),
    likesCount: 0,
    likedBy: [],
  };
}

export function personajeDe(doc) {
  const f = doc.f;
  const role = texto(valor(f.role));
  return {
    id: doc.id,
    animeId: texto(valor(f.animeId)),
    name: texto(valor(f.name)),
    japaneseName: texto(valor(f.japaneseName)),
    aliases: lista(valor(f.aliases)),
    slug: texto(valor(f.slug)),
    imageUrl: texto(valor(f.imageUrl)),
    description: texto(valor(f.description)).slice(0, 240),
    role: role === 'supporting' || role === 'antagonist' ? role : 'main',
    ...(role === 'main' ? { voiceActor: texto(valor(f.voiceActor)) } : {}),
    likesCount: numero(valor(f.likesCount)),
    tags: [],
    likedBy: [],
  };
}

export function temporadaDe(doc) {
  const f = doc.f;
  return {
    id: doc.id,
    animeId: texto(valor(f.animeId)),
    number: numero(valor(f.number)),
    title: texto(valor(f.title)),
    synopsis: texto(valor(f.synopsis)),
    year: numero(valor(f.year)),
    status: texto(valor(f.status)),
    studio: texto(valor(f.studio)),
    rating: numero(valor(f.rating)),
    episodesCount: numero(valor(f.episodesCount)),
    posterUrl: texto(valor(f.posterUrl)),
    bannerUrl: texto(valor(f.bannerUrl)),
    ...(objeto(valor(f.posterFocus))
      ? { posterFocus: objeto(valor(f.posterFocus)) }
      : {}),
    ...(objeto(valor(f.bannerFocus))
      ? { bannerFocus: objeto(valor(f.bannerFocus)) }
      : {}),
    createdAt: texto(valor(f.createdAt)),
  };
}

export function streamingDe(doc) {
  const f = doc.f;
  const accessType = texto(valor(f.accessType));
  const url = texto(valor(f.url));
  const verifiedAt = texto(valor(f.verifiedAt));

  return {
    id: doc.id,
    animeId: texto(valor(f.animeId)),
    platformId: texto(valor(f.platformId)),
    region: texto(valor(f.region)),
    status: texto(valor(f.status)),
    ...(accessType ? { accessType } : {}),
    ...(url ? { url } : {}),
    ...(verifiedAt ? { verifiedAt } : {}),
  };
}

export const TRANSFORMADORES = {
  animes: animeDe,
  seasons: temporadaDe,
  episodes: episodioDe,
  characters: personajeDe,
  streamingAvailability: streamingDe,
};

export function mapaDeTemporadas(animes, temporadas) {
  const mapa = Object.fromEntries(animes.map((anime) => [anime.id, []]));

  for (const temporada of temporadas) {
    if (!temporada.animeId) continue;
    if (!mapa[temporada.animeId]) mapa[temporada.animeId] = [];
    mapa[temporada.animeId].push(temporada);
  }

  for (const lista of Object.values(mapa)) {
    lista.sort((a, b) => a.number - b.number);
  }

  return mapa;
}

export function mapaDeStreaming(animes, filas) {
  const mapa = Object.fromEntries(animes.map((anime) => [anime.id, {}]));

  for (const fila of filas) {
    if (!fila.animeId || !fila.region) continue;
    if (!mapa[fila.animeId]) mapa[fila.animeId] = {};
    if (!mapa[fila.animeId][fila.region]) mapa[fila.animeId][fila.region] = [];
    mapa[fila.animeId][fila.region].push(fila);
  }

  for (const regiones of Object.values(mapa)) {
    for (const lista of Object.values(regiones)) {
      lista.sort((a, b) => a.platformId.localeCompare(b.platformId));
    }
  }

  return mapa;
}

/** Ordena las secciones con el mismo criterio que el índice completo. */
export function ordenarIndice(indice) {
  indice.animes.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  indice.episodes.sort(
    (a, b) => a.animeId.localeCompare(b.animeId) || a.number - b.number,
  );
  indice.characters.sort(
    (a, b) => a.animeId.localeCompare(b.animeId) || a.name.localeCompare(b.name, 'es'),
  );
  indice.seasons.sort(
    (a, b) => a.animeId.localeCompare(b.animeId) || a.number - b.number,
  );
  indice.streaming.sort(
    (a, b) =>
      a.animeId.localeCompare(b.animeId) ||
      a.region.localeCompare(b.region) ||
      a.platformId.localeCompare(b.platformId),
  );

  return indice;
}

export function esIndiceValido(indice) {
  return Boolean(
    indice &&
      indice.version === VERSION_INDICE &&
      Array.isArray(indice.animes) &&
      Array.isArray(indice.episodes) &&
      Array.isArray(indice.characters),
  );
}

/** Normaliza un índice antiguo que no tuviera temporadas/streaming. */
export function normalizarIndice(indice) {
  return {
    ...indice,
    version: VERSION_INDICE,
    seasons: Array.isArray(indice.seasons) ? indice.seasons : [],
    streaming: Array.isArray(indice.streaming) ? indice.streaming : [],
  };
}

/**
 * Sustituye una sección. Con `animeIds`, solo quita las filas de esos
 * animes y añade las nuevas; las demás se conservan intactas.
 */
/**
 * @param {any} indice
 * @param {string} seccion
 * @param {any[]} filas
 * @param {string[]|null} [animeIds]
 * @returns {any}
 */
export function fusionarSeccion(indice, seccion, filas, animeIds = null) {
  const clave = CLAVE_INDICE[seccion];
  const objetivo = animeIds ? new Set(animeIds) : null;

  if (clave === 'animes') {
    const nuevas = [...filas];
    if (!objetivo) return { ...indice, animes: nuevas };

    const porId = new Map(nuevas.map((fila) => [fila.id, fila]));
    const conservados = indice.animes.filter((fila) => !objetivo.has(fila.id));
    return { ...indice, animes: [...conservados, ...porId.values()] };
  }

  const nuevas = [...filas];
  if (!objetivo) return { ...indice, [clave]: nuevas };

  const conservados = (indice[clave] ?? []).filter(
    (fila) => !objetivo.has(fila.animeId),
  );
  return { ...indice, [clave]: [...conservados, ...nuevas] };
}

/** Índice completo a partir de secciones ya transformadas. */
export function crearIndice({ animes, seasons, episodes, characters, streaming, generado }) {
  return ordenarIndice({
    version: VERSION_INDICE,
    generado: generado ?? new Date().toISOString(),
    animes: [...animes],
    seasons: [...seasons],
    episodes: [...episodes],
    characters: [...characters],
    streaming: [...streaming],
  });
}

/** Cuenta filas por sección del índice. */
export function contarIndice(indice) {
  return {
    animes: indice.animes.length,
    seasons: indice.seasons.length,
    episodes: indice.episodes.length,
    characters: indice.characters.length,
    streaming: indice.streaming.length,
  };
}

/**
 * Comprueba estructura, duplicados y relaciones.
 *
 * Las relaciones huérfanas se devuelven como aviso, no como error: un
 * catálogo real puede tener una ficha antigua sin anime padre. Lo que sí
 * es fatal es un ID duplicado o una sección que no sea un array.
 */
export function validarIndice(indice) {
  const errores = [];
  const avisos = [];

  if (!indice || typeof indice !== 'object') {
    return { ok: false, errores: ['El índice no es un objeto.'], avisos };
  }
  if (indice.version !== VERSION_INDICE) {
    errores.push(`Versión de índice no compatible: ${indice.version}.`);
  }

  for (const [clave, nombre] of [
    ['animes', 'animes'],
    ['seasons', 'temporadas'],
    ['episodes', 'episodios'],
    ['characters', 'personajes'],
    ['streaming', 'streaming'],
  ]) {
    if (!Array.isArray(indice[clave])) {
      errores.push(`La sección ${nombre} no es un array.`);
      continue;
    }

    const ids = new Set();
    for (const fila of indice[clave]) {
      if (!fila || typeof fila !== 'object' || typeof fila.id !== 'string') {
        errores.push(`${nombre}: hay una fila sin id.`);
        continue;
      }
      if (ids.has(fila.id)) {
        errores.push(`${nombre}: id duplicado ${fila.id}.`);
      }
      ids.add(fila.id);

      if (clave !== 'animes' && !fila.animeId) {
        errores.push(`${nombre}: ${fila.id} no tiene animeId.`);
      }
    }
  }

  if (!Array.isArray(indice.animes) || !Array.isArray(indice.episodes)) {
    return { ok: errores.length === 0, errores, avisos };
  }

  const idsAnime = new Set(indice.animes.map((anime) => anime.id));
  for (const [clave, nombre] of [
    ['seasons', 'temporadas'],
    ['episodes', 'episodios'],
    ['characters', 'personajes'],
    ['streaming', 'streaming'],
  ]) {
    for (const fila of indice[clave] ?? []) {
      if (fila.animeId && !idsAnime.has(fila.animeId)) {
        avisos.push(`${nombre}: ${fila.id} apunta a un anime que no está en animes.`);
      }
    }
  }

  return { ok: errores.length === 0, errores, avisos };
}

/** Resuelve IDs reales a partir de ids o slugs del índice. */
export function resolverAnimeIds(indice, valores) {
  const buscados = new Set(valores);
  return indice.animes
    .filter((anime) => buscados.has(anime.id) || buscados.has(anime.slug))
    .map((anime) => anime.id);
}
