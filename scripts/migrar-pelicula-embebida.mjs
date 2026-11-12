// Saca una película que está metida como temporada de una serie y
// renumera las temporadas que quedan detrás. Solo lee el anime indicado.
//
//   node scripts/migrar-pelicula-embebida.mjs \
//     --anime <animeId> --temporada <n> --peli <nuevoId> \
//     --titulo "<título>" [--japones "<título japonés>"] [--escribir]
//
//   node scripts/migrar-pelicula-embebida.mjs \
//     --anime <animeId> --temporada <n> --peli <nuevoId> \
//     --ficha-existente <animeIdDeLaPelicula> [--escribir]
//
// ── QUÉ HACE ──────────────────────────────────────────────────────
//
// 1. Crea la ficha independiente de la película (si no existe ya) con
//    su única temporada, su episodio y los personajes que salen en esa
//    temporada (o son compartidos).
// 2. Quita esa temporada de la serie.
// 3. Renumera las temporadas posteriores: T(n+1) pasa a T(n), y sus
//    episodios y personajes se mueven con ella.
// 4. Actualiza los contadores de la serie.
//
// La disponibilidad no se copia de la serie: suele ser distinta. Se
// importa después con `importar-disponibilidad-justwatch.mjs` para el
// nuevo id (hace falta añadirlo antes a FICHAS).
//
// `--ficha-existente` es para películas que ya tienen ficha propia y
// solo están duplicadas como temporada (por ejemplo, Kimetsu: Tren
// Infinito). En ese caso no se crea nada: solo se limpia la serie.

import {
  arrayDe,
  borrar,
  crear,
  escribir,
  i,
  s,
  str,
  uno,
} from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const args = process.argv.slice(2);

/** Valor de un argumento `--nombre valor`. */
function arg(nombre) {
  const pos = args.indexOf(nombre);
  return pos >= 0 ? (args[pos + 1] ?? '') : '';
}

const ANIME_ID = arg('--anime').trim();
const TEMPORADA = Number(arg('--temporada'));
const PELI_ID = arg('--peli').trim();
const TITULO = arg('--titulo').trim();
const JAPONES = arg('--japones').trim();
const FICHA_EXISTENTE = arg('--ficha-existente').trim();
const ESCRIBIR = args.includes('--escribir');

if (!ANIME_ID || !TEMPORADA || !PELI_ID) {
  console.error('  uso: migrar-pelicula-embebida.mjs --anime <id> --temporada <n> --peli <id> --titulo "<título>" [--escribir]');
  process.exit(1);
}
if (!FICHA_EXISTENTE && !TITULO) {
  console.error('  falta --titulo (o usa --ficha-existente si la película ya tiene ficha).');
  process.exit(1);
}

const num = (doc) => Number(doc.f.number?.integerValue ?? doc.f.number?.doubleValue ?? 0);
const listaDe = (doc, campo) => {
  const values = doc.f[campo]?.arrayValue?.values;
  return Array.isArray(values)
    ? values.map((v) => v.stringValue).filter((v) => typeof v === 'string' && v)
    : [];
};
const idsDe = (doc) => {
  const ids = listaDe(doc, 'seasonIds');
  if (ids.length) return ids;
  const antiguo = str(doc, 'seasonId');
  return antiguo ? [antiguo] : [];
};
const slugify = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
const seasonIdDe = (n) => `${ANIME_ID}-s${n}`;
const ahora = new Date().toISOString();

const anime = await uno('animes', ANIME_ID);
if (!anime) throw new Error(`no existe animes/${ANIME_ID}`);

const [seasons, episodes, characters] = await Promise.all([
  leerPorCampo({ coleccion: 'seasons', campo: 'animeId', valor: ANIME_ID }),
  leerPorCampo({ coleccion: 'episodes', campo: 'animeId', valor: ANIME_ID }),
  leerPorCampo({ coleccion: 'characters', campo: 'animeId', valor: ANIME_ID }),
]);

const season = seasons.find((x) => num(x) === TEMPORADA);
if (!season) throw new Error(`no existe la temporada ${TEMPORADA} de ${ANIME_ID}`);

const episodiosPeli = episodes.filter((e) => str(e, 'seasonId') === season.id);
if (!episodiosPeli.length) throw new Error(`la temporada ${TEMPORADA} no tiene episodios`);

const maxTemporada = Math.max(...seasons.map(num));
const posteriores = seasons
  .filter((x) => num(x) > TEMPORADA)
  .sort((a, b) => num(a) - num(b));

// Para una película no basta con los personajes marcados en esa
// temporada: muchas series solo tienen asignados los personajes a las
// temporadas de TV y la película se quedaría sin reparto. Se copian
// también los protagonistas (`role: main`), que en una película de la
// misma franquicia aparecen salvo excepciones muy concretas.
const personajesPeli = characters.filter((c) => {
  const ids = idsDe(c);
  return ids.length === 0 || ids.includes(season.id) || str(c, 'role') === 'main';
});
const soloPeli = personajesPeli.filter((c) => {
  const ids = idsDe(c);
  return ids.length === 1 && ids[0] === season.id;
});

/** Id libre para personaje: añade -2, -3... si el slug se repite. */
const idsPersonajes = new Set();
function idPersonaje(nombre) {
  const base = `${PELI_ID}-${slugify(nombre) || 'personaje'}`;
  let id = base;
  let n = 2;
  while (idsPersonajes.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  idsPersonajes.add(id);
  return id;
}

console.log(`\n${ANIME_ID}: sacar T${TEMPORADA} "${str(season, 'title') || '(sin título)'}"`);
console.log(`  episodios: ${episodiosPeli.length}`);
console.log(`  personajes a copiar: ${personajesPeli.length} (solo de la película: ${soloPeli.length})`);
console.log(
  FICHA_EXISTENTE
    ? `  ficha existente: ${FICHA_EXISTENTE} (no se crea nada)`
    : `  ficha nueva: ${PELI_ID} — "${TITULO}"`,
);
for (const x of posteriores) {
  const eps = episodes.filter((e) => str(e, 'seasonId') === x.id).length;
  console.log(`  ${x.id} (T${num(x)}) -> ${seasonIdDe(num(x) - 1)} (T${num(x) - 1}) | ${eps} episodios`);
}
console.log(
  `  serie: ${seasons.length} T / ${episodes.length} E -> ${seasons.length - 1} T / ${episodes.length - episodiosPeli.length} E`,
);

if (!FICHA_EXISTENTE) {
  const yaExiste = await uno('animes', PELI_ID);
  if (yaExiste) throw new Error(`ya existe animes/${PELI_ID}; usa --ficha-existente si es la misma película`);
}

if (!ESCRIBIR) {
  console.log('\nSimulación. Usa --escribir para aplicar.');
  process.exit(0);
}

// ── 1. Ficha independiente ────────────────────────────────────────
if (!FICHA_EXISTENTE) {
  const nuevoAnime = {
    id: s(PELI_ID),
    slug: s(PELI_ID),
    title: s(TITULO),
    japaneseTitle: s(JAPONES),
    alternativeTitles: arrayDe([]),
    synopsis: season.f.synopsis ?? anime.f.synopsis ?? s(''),
    year: season.f.year ?? anime.f.year ?? i(0),
    status: s('finished'),
    studio: season.f.studio ?? anime.f.studio ?? s(''),
    category: anime.f.category ?? s(''),
    categories: anime.f.categories ?? arrayDe([]),
    genres: anime.f.genres ?? arrayDe([]),
    episodesCount: i(episodiosPeli.length),
    seasonsCount: i(1),
    rating: season.f.rating ?? anime.f.rating ?? { doubleValue: 0 },
    coverUrl: season.f.posterUrl ?? s(''),
    coverFocus:
      season.f.posterFocus ??
      { mapValue: { fields: { x: { doubleValue: 0.5 }, y: { doubleValue: 0.5 } } } },
    bannerUrl: season.f.bannerUrl ?? s(''),
    bannerFocus:
      season.f.bannerFocus ??
      { mapValue: { fields: { x: { doubleValue: 0.5 }, y: { doubleValue: 0.5 } } } },
    streaming: arrayDe([]),
    likesCount: i(0),
    likedBy: arrayDe([]),
    commentsCount: i(0),
    viewsCount: i(0),
    communityRatingSum: i(0),
    communityRatingCount: i(0),
    communityRatingAvg: { doubleValue: 0 },
    createdAt: { timestampValue: ahora },
  };
  await crear('animes', PELI_ID, nuevoAnime);
  console.log(`creado animes/${PELI_ID}`);

  const nuevoSeasonId = `${PELI_ID}-s1`;
  const camposSeason = {
    ...season.f,
    number: i(1),
    animeId: s(PELI_ID),
    title: s(''),
  };
  delete camposSeason.id;
  await crear('seasons', nuevoSeasonId, camposSeason);
  console.log(`creado seasons/${nuevoSeasonId}`);

  for (const [indice, ep] of episodiosPeli.entries()) {
    const nuevoEpId = `${PELI_ID}-s1-e${String(indice + 1).padStart(2, '0')}`;
    const camposEp = {
      ...ep.f,
      animeId: s(PELI_ID),
      seasonId: s(nuevoSeasonId),
      number: i(indice + 1),
      likesCount: i(0),
      likedBy: arrayDe([]),
      createdAt: { timestampValue: ahora },
    };
    delete camposEp.id;
    await crear('episodes', nuevoEpId, camposEp);
    console.log(`creado episodes/${nuevoEpId}`);
  }

  for (const c of personajesPeli) {
    const nombre = str(c, 'name') || c.id;
    const nuevoId = idPersonaje(nombre);
    const campos = { ...c.f };
    delete campos.animeId;
    delete campos.seasonId;
    delete campos.seasonIds;
    delete campos.seasonKeys;
    await crear('characters', nuevoId, {
      ...campos,
      animeId: s(PELI_ID),
      seasonIds: arrayDe([]),
      seasonKeys: arrayDe(['*']),
    });
  }
  console.log(`copiados ${personajesPeli.length} personajes`);
}

// ── 2. Renumerar las temporadas posteriores ───────────────────────
// Se hace de menor a mayor: el hueco que deja la película lo ocupa la
// siguiente temporada, y así el id que se libera sirve para la próxima.
for (const vieja of posteriores) {
  const n = num(vieja);
  const destinoN = n - 1;
  const destinoId = seasonIdDe(destinoN);
  const existeDestino = seasons.some((x) => num(x) === destinoN);
  const campos = { ...vieja.f, number: i(destinoN), animeId: s(ANIME_ID) };
  delete campos.id;

  if (existeDestino) {
    await escribir('seasons', destinoId, campos, Object.keys(campos));
  } else {
    await crear('seasons', destinoId, campos);
  }

  for (const ep of episodes.filter((e) => str(e, 'seasonId') === vieja.id)) {
    await escribir('episodes', ep.id, { seasonId: s(destinoId) }, ['seasonId']);
  }

  if (vieja.id !== destinoId) await borrar('seasons', vieja.id);
  console.log(`T${n} -> T${destinoN} (${destinoId})`);
}

// ── 3. Quitar la película de la serie ─────────────────────────────
for (const ep of episodiosPeli) {
  await borrar('episodes', ep.id);
  console.log(`borrado episodes/${ep.id}`);
}
// Si había temporadas detrás, el documento de la película se ha
// reutilizado como T(TEMPORADA) y no se borra.
if (!posteriores.length) {
  await borrar('seasons', season.id);
  console.log(`borrada seasons/${season.id}`);
}

// ── 4. Personajes de la serie ─────────────────────────────────────
function mapaTemporada(id) {
  const m = id.match(new RegExp(`^${ANIME_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-s(\\d+)$`));
  if (!m) return id;
  const n = Number(m[1]);
  if (n === TEMPORADA) return null;
  return n > TEMPORADA ? seasonIdDe(n - 1) : id;
}

for (const c of characters) {
  const ids = idsDe(c);
  if (!ids.length || !ids.includes(season.id)) continue;
  if (ids.length === 1) {
    await borrar('characters', c.id);
    console.log(`borrado personaje solo de la película: ${str(c, 'name') || c.id}`);
    continue;
  }
  const nuevos = [...new Set(ids.map(mapaTemporada).filter(Boolean))];
  await escribir(
    'characters',
    c.id,
    { seasonIds: arrayDe(nuevos), seasonKeys: arrayDe(nuevos.length ? nuevos : ['*']) },
    ['seasonIds', 'seasonKeys'],
  );
}

// ── 5. Contadores de la serie ────────────────────────────────────
await escribir(
  'animes',
  ANIME_ID,
  {
    seasonsCount: i(seasons.length - 1),
    episodesCount: i(episodes.length - episodiosPeli.length),
  },
  ['seasonsCount', 'episodesCount'],
);
console.log(`\n${ANIME_ID}: ${seasons.length - 1} T / ${episodes.length - episodiosPeli.length} E`);
console.log('Falta importar la disponibilidad y actualizar el índice.');
