// ======================================================
// ÍNDICE LIGERO DE BÚSQUEDA
// ======================================================
// Firestore no hace búsqueda de subcadenas. Hasta ahora, la primera
// búsqueda de la wiki descargaba las colecciones completas de animes,
// episodios, personajes y temporadas (miles de documentos) para
// filtrar en memoria.
//
// Este script genera un JSON con solo los campos que necesita el
// buscador y lo deja en `public/busqueda/indice.json`. Vercel lo
// sirve como archivo estático: buscar deja de costar lecturas de
// Firestore y no hace falta ningún servicio externo.
//
//   · Se ejecuta en `predev` y `prebuild`. Si existe el índice
//     comprimido versionado (`indice.json.gz`), lo descomprime y NO
//     lee Firestore. El build normal cuesta 0 lecturas de catálogo.
//   · Para refrescar el índice cuando cambie el catálogo:
//       npm run index:buscar
//     Ese comando lee Firestore, escribe el JSON y su `.gz`; después
//     hay que commitear `public/busqueda/indice.json.gz`.
//   · Si Firestore no responde, NO rompe el build: conserva el JSON
//     comprimido anterior y avisa. El buscador tiene además una red
//     de seguridad en el cliente (vuelve a la carga completa).
//   · No escribe nada en Firestore.
//
// Los alias, títulos japoneses y romaji ya están en los documentos
// (los rellena `scripts/rellenar-alias.mjs`). Aquí no se inventa
// ninguno.

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, 'public', 'busqueda', 'indice.json');
const SALIDA_GZ = `${SALIDA}.gz`;
// Lista ligera solo de animes, para que la Wiki y los perfiles no
// tengan que leer los 195 documentos de Firestore.
const SALIDA_ANIMES = path.join(RAIZ, 'public', 'busqueda', 'animes.json');
// Temporadas agrupadas por anime. La ficha solo necesita las de la
// serie abierta; así no descarga la colección `seasons` cada vez.
const SALIDA_TEMPORADAS = path.join(RAIZ, 'public', 'busqueda', 'temporadas.json');
// Disponibilidad de streaming agrupada por anime y región. Es un
// archivo pequeño comprimido y evita pedir la colección en cada ficha.
const SALIDA_STREAMING = path.join(RAIZ, 'public', 'busqueda', 'streaming.json');
const PROYECTO = process.env.VITE_FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;
const REFRESCAR = process.argv.includes('--refresh');

const CAMPOS = {
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
  streaming: [
    'animeId',
    'platformId',
    'region',
    'status',
    'accessType',
    'url',
    'verifiedAt',
  ],
};

/** Convierte un valor REST de Firestore al valor JS equivalente. */
function valor(v) {
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
const objeto = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? v : undefined;

/** Lee una colección entera paginando de 300 en 300. */
async function leerColeccion(coleccion, campos) {
  const docs = [];
  let token = '';

  do {
    const url = new URL(`${BASE}/${coleccion}`);
    url.searchParams.set('pageSize', '300');
    for (const campo of campos) {
      url.searchParams.append('mask.fieldPaths', campo);
    }
    if (token) url.searchParams.set('pageToken', token);

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`${coleccion}: HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    for (const doc of datos.documents ?? []) {
      const f = doc.fields ?? {};
      docs.push({
        id: doc.name.split('/').pop(),
        f,
        actualizado: doc.updateTime,
      });
    }
    token = datos.nextPageToken ?? '';
  } while (token);

  return docs;
}

function animeDe(doc) {
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
    // Campos obligatorios del tipo Anime que no usa el buscador,
    // pero que evitan tener que rellenarlos en cada tarjeta.
    streaming: [],
    // Perfiles y destacados muestran el contador; se lee del catálogo
    // al refrescar el índice para no perderlo con la lista estática.
    likesCount: numero(valor(f.likesCount)),
    likedBy: [],
    commentsCount: 0,
    viewsCount: numero(valor(f.viewsCount)),
    communityRatingSum: numero(valor(f.communityRatingSum)),
    communityRatingCount: numero(valor(f.communityRatingCount)),
    communityRatingAvg: numero(valor(f.communityRatingAvg)),
  };
}

function episodioDe(doc) {
  const f = doc.f;
  return {
    id: doc.id,
    animeId: texto(valor(f.animeId)),
    number: numero(valor(f.number)),
    title: texto(valor(f.title)),
    romajiTitle: texto(valor(f.romajiTitle)),
    // La descripción se usa para buscar y para las dos líneas de la
    // tarjeta. Con 220 caracteres sobra; guardarla entera multiplica
    // el tamaño del índice por ocho mil episodios.
    description: texto(valor(f.description)).slice(0, 160),
    thumbnailUrl: texto(valor(f.thumbnailUrl)),
    airDate: texto(valor(f.airDate)),
    duration: texto(valor(f.duration)),
    rating: numero(valor(f.rating)),
    // Campos obligatorios del tipo Episode que el buscador no usa.
    likesCount: 0,
    likedBy: [],
  };
}

function personajeDe(doc) {
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
    // El prerender solo pinta los principales; para el resto no
    // hace falta la voz. `likesCount` sí se mantiene para que el
    // objeto cumpla el tipo Character completo.
    ...(role === 'main' ? { voiceActor: texto(valor(f.voiceActor)) } : {}),
    likesCount: numero(valor(f.likesCount)),
    tags: [],
    likedBy: [],
  };
}

function temporadaDe(doc) {
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

function streamingDe(doc) {
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

/**
 * Agrupa las temporadas por anime. Incluye una entrada vacía para
 * cada anime del índice, para que el cliente sepa que «no tiene
 * temporadas» no es lo mismo que «el archivo es antiguo y no lo
 * conoce»: en el segundo caso cae a Firestore.
 */
function mapaDeTemporadas(animes, temporadas) {
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

/**
 * Agrupa la disponibilidad por anime y región. Incluye una entrada
 * vacía para cada anime del índice: así el cliente distingue «no
 * tiene filas» de «este archivo no conoce la serie» y solo cae a
 * Firestore en el segundo caso.
 */
function mapaDeStreaming(animes, filas) {
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

async function tamanoPrevio() {
  try {
    const info = await stat(SALIDA);
    return `${Math.round(info.size / 1024)} KB`;
  } catch {
    return 'inexistente';
  }
}

function esIndiceValido(indice) {
  return Boolean(
    indice &&
      indice.version === 1 &&
      Array.isArray(indice.animes) &&
      Array.isArray(indice.episodes) &&
      Array.isArray(indice.characters),
  );
}

/**
 * Usa el índice comprimido versionado, sin tocar Firestore.
 *
 * El `.gz` se commitea y se refresca a mano con `npm run index:buscar`.
 * Así un push normal no vuelve a leer los 13.481 documentos del
 * catálogo.
 */
async function usarIndiceCacheado() {
  try {
    const comprimido = await readFile(SALIDA_GZ);
    const texto = gunzipSync(comprimido).toString('utf8');
    const indice = JSON.parse(texto);
    if (!esIndiceValido(indice)) return false;

    await mkdir(path.dirname(SALIDA), { recursive: true });
    await writeFile(SALIDA, texto, 'utf8');
    await writeFile(SALIDA_ANIMES, JSON.stringify(indice.animes), 'utf8');

    const temporadas = Array.isArray(indice.seasons) ? indice.seasons : [];
    await writeFile(
      SALIDA_TEMPORADAS,
      JSON.stringify(mapaDeTemporadas(indice.animes, temporadas)),
      'utf8',
    );

    const streaming = Array.isArray(indice.streaming) ? indice.streaming : [];
    await writeFile(
      SALIDA_STREAMING,
      JSON.stringify(mapaDeStreaming(indice.animes, streaming)),
      'utf8',
    );

    const generado = Date.parse(indice.generado);
    const dias = Number.isFinite(generado)
      ? Math.floor((Date.now() - generado) / (24 * 60 * 60 * 1000))
      : null;

    console.log(
      `indice-busqueda: usa cache local (${indice.animes.length} animes, ` +
        `${temporadas.length} temporadas, ${streaming.length} filas de streaming, ` +
        `${indice.episodes.length} episodios, ${indice.characters.length} personajes` +
        `${dias !== null ? `, generado hace ${dias} dia(s)` : ''})`,
    );

    if (dias !== null && dias > 7) {
      console.warn(
        'indice-busqueda: el cache tiene más de 7 días. ' +
          'Ejecuta "npm run index:buscar" para refrescarlo cuando cambie el catálogo.',
      );
    }

    return true;
  } catch {
    return false;
  }
}

if (!REFRESCAR && (await usarIndiceCacheado())) {
  process.exit(0);
}

try {
  const [animes, episodes, characters, seasons, streaming] = await Promise.all([
    leerColeccion('animes', CAMPOS.animes).then((docs) =>
      docs.map(animeDe).filter((a) => a.id && a.title),
    ),
    leerColeccion('episodes', CAMPOS.episodes).then((docs) =>
      docs.map(episodioDe).filter((e) => e.id && e.animeId && e.title),
    ),
    leerColeccion('characters', CAMPOS.characters).then((docs) =>
      docs.map(personajeDe).filter((c) => c.id && c.animeId && c.name),
    ),
    leerColeccion('seasons', CAMPOS.seasons).then((docs) =>
      docs.map(temporadaDe).filter((s) => s.id && s.animeId),
    ),
    leerColeccion('streamingAvailability', CAMPOS.streaming).then((docs) =>
      docs
        .map(streamingDe)
        .filter((s) => s.id && s.animeId && s.platformId && s.region),
    ),
  ]);

  animes.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  episodes.sort(
    (a, b) => a.animeId.localeCompare(b.animeId) || a.number - b.number,
  );
  characters.sort(
    (a, b) => a.animeId.localeCompare(b.animeId) || a.name.localeCompare(b.name, 'es'),
  );
  seasons.sort(
    (a, b) => a.animeId.localeCompare(b.animeId) || a.number - b.number,
  );
  streaming.sort(
    (a, b) =>
      a.animeId.localeCompare(b.animeId) ||
      a.region.localeCompare(b.region) ||
      a.platformId.localeCompare(b.platformId),
  );

  const indice = {
    version: 1,
    generado: new Date().toISOString(),
    animes,
    seasons,
    streaming,
    episodes,
    characters,
  };

  await mkdir(path.dirname(SALIDA), { recursive: true });
  const serializado = JSON.stringify(indice);
  const comprimido = gzipSync(Buffer.from(serializado, 'utf8'));

  await writeFile(SALIDA, serializado, 'utf8');
  await writeFile(SALIDA_ANIMES, JSON.stringify(animes), 'utf8');
  await writeFile(
    SALIDA_TEMPORADAS,
    JSON.stringify(mapaDeTemporadas(animes, seasons)),
    'utf8',
  );
  await writeFile(
    SALIDA_STREAMING,
    JSON.stringify(mapaDeStreaming(animes, streaming)),
    'utf8',
  );
  await writeFile(SALIDA_GZ, comprimido);

  const kb = Math.round(Buffer.byteLength(serializado) / 1024);
  const kbGz = Math.round(comprimido.length / 1024);
  console.log(
    `indice-busqueda: ${animes.length} animes, ${seasons.length} temporadas, ` +
      `${streaming.length} filas de streaming, ${episodes.length} episodios, ` +
      `${characters.length} personajes (${kb} KB, ${kbGz} KB gzip)`,
  );
} catch (error) {
  const anterior = await tamanoPrevio();
  console.warn(
    `No se pudo generar el índice de búsqueda (${error.message}). ` +
      `Se conserva el anterior: ${anterior}.`,
  );
}
