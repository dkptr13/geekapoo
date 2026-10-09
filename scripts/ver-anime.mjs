// Dump de datos de un anime: estructura en AniList y capitulos en IMDb.
//
//    node scripts ver-anime.mjs <nombre-anime> [<imdbId>]
//
// De las dos fuentes a la vez, porque cada una va bien en una cosa:
// AniList tiene la estructura de la franquicia (que partes hay, cuantos
// capitulos tiene cada una, formato y año) y IMDb tiene las notas y las
// fechas capitulo a capitulo.
//
// ── OJO CON LAS FECHAS DE IMDb ────────────────────────────────────
//
// Las fecha que da IMDb suelen ser uno o dos dias antes de la emision en
// Japon, porque cuenta el lanzamiento internacional. Para el catalogo
// mandan las de Japon: en `datos/<prefix>-tN.mjs` se ponen las de la
// wikipedia japonesa.

import * as anilist from './anilist.mjs';

const nombre = process.argv[2];
const imdbId = process.argv[3];

if (!nombre) {
  console.error('  uso: node scripts ver-anime.mjs <nombre-anime> [<imdbId>]');
  process.exit(1);
}

const CABECERAS = {
  'Content-Type': 'application/json',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

async function imdb(consulta, variables) {
  const r = await fetch('https://api.graphql.imdb.com/', {
    method: 'POST',
    headers: CABECERAS,
    body: JSON.stringify({ query: consulta, variables }),
  });

  const d = await r.json();

  if (d.errors) {
    console.log('  IMDb:', JSON.stringify(d.errors).slice(0, 300));
    return null;
  }

  return d.data;
}

// ── 1. Estructura, segun AniList ───────────────────────────────────

console.log(`\n===== ANILIST: ${nombre}`);

const base = await anilist.buscarAnime(nombre);

if (!base) {
  console.log('AniList no encuentra el titulo');
} else {
  const { todos } = await anilist.arbol(base.id);

  const CONSULTA = `query ($id: Int) {
    Media(id: $id, type: ANIME) {
      format
      seasonYear
      episodes
      duration
      status
      averageScore
      startDate { year month day }
      endDate { year month day }
    }
  }`;

  console.log(`base: ${base.id} "${base.titulo}"`);

  for (const m of [...todos.values()].sort((a, b) => (a.anio ?? 0) - (b.anio ?? 0))) {
    // OJO: esta parte va al endpoint de AniList, no al de IMDb. Son dos
    // APIs distintas y `imdb()` devuelve `data.Media` a null si se le
    // pregunta a la que no toca.
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CONSULTA, variables: { id: m.id } }),
    });

    const x = (await r.json())?.data?.Media;

    if (!x) continue;

    console.log(
      `  ${String(x.episodes ?? '?').padStart(4)} eps  ${String(x.format).padEnd(9)} ` +
        `${String(x.status).padEnd(17)} ${String(x.averageScore).padStart(4)}  ${x.seasonYear ?? '????'}  ${m.titulo}`,
    );

    if (x.startDate?.year) {
      console.log(
        `         del ${x.startDate.year}-${x.startDate.month}-${x.startDate.day}` +
          (x.endDate?.year ? ` al ${x.endDate.year}-${x.endDate.month}-${x.endDate.day}` : ' (en emision)'),
      );
    }
  }
}

// ── 2. Capitulos, segun IMDb ────────────────────────────────────────

if (!imdbId) {
  console.log('\n(pasa un imdbId para ver los capitulos)');
  process.exit(0);
}

console.log(`\n===== IMDB: ${imdbId}`);

const Q_EPIS = `query ($id: ID!) {
  title(id: $id) {
    id
    titleText { text }
    ratingsSummary { aggregateRating voteCount }
    episodes {
      seasons { number }
      episodes(first: 300) {
        total
        edges {
          node {
            titleText { text }
            releaseDate { year month day }
            series { episodeNumber { seasonNumber episodeNumber } }
            ratingsSummary { aggregateRating voteCount }
          }
        }
      }
    }
  }
}`;

const d = await imdb(Q_EPIS, { id: imdbId });

if (!d?.title) {
  console.log('IMDb no devuelve nada');
  process.exit(0);
}

const t = d.title;

console.log(
  `${t.titleText.text}  ·  nota ${t.ratingsSummary?.aggregateRating} ` +
    `(${t.ratingsSummary?.voteCount} votos)`,
);
console.log(`temporadas en IMDb: ${t.episodes.seasons.map((s) => s.number).join(', ')}`);
console.log(`capitulos: ${t.episodes.episodes.total}\n`);

const numDe = (n) => n.series?.episodeNumber?.seasonNumber ?? 99;
const capDe = (n) => n.series?.episodeNumber?.episodeNumber ?? 999;

const lista = t.episodes.episodes.edges
  .map((e) => e.node)
  .sort((a, b) => numDe(a) - numDe(b) || capDe(a) - capDe(b));

for (const n of lista) {
  const s = n.series?.episodeNumber;

  const iso = n.releaseDate
    ? `${n.releaseDate.year}-${String(n.releaseDate.month).padStart(2, '0')}-${String(n.releaseDate.day).padStart(2, '0')}`
    : '????-??-??';

  console.log(
    `  S${s?.seasonNumber ?? '?'}E${String(s?.episodeNumber ?? '?').padStart(2)}  ${iso}  ` +
      `nota ${String(n.ratingsSummary?.aggregateRating ?? '-').padStart(4)}  ${n.titleText?.text ?? ''}`,
  );
}