// Compara los titulos de capitulo de AniList con los de IMDb.
//    node scripts/dif-titulos.mjs <nombre-anime>
//
// Cuando `emparejar-miniaturas.mjs` descarta capitulos, hay que saber
// si es porque los titulos son distintos de verdad o porque se parecen
// pero no dan igual. Este script enseña los dos lados, en crudo y
// normalizados, para decidir si el filtro hay quearlo o no.
//
//   ANI  Deep Blue
//   IMDB Deep Blue            <- distintos de verdad: el filtro debe
//                               seguir descartando
//
//   ANI  Deciding the Night for Two
//   IMDB Deciding the Night for Two.        <- puntuacion o tipografia:
//                                             el filtro deberia aceptarlo

const CABECERAS = {
  'Content-Type': 'application/json',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

const normalizar = (s) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[''\u2019]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const Q_EPIS = `query ($id: ID!) {
  title(id: $id) {
    episodes {
      seasons { number }
      episodes(first: 300) {
        edges {
          node {
            titleText { text }
            series { episodeNumber { seasonNumber episodeNumber } }
          }
        }
      }
    }
  }
}`;

const Q_STREAMING = `query ($id: Int!) {
  Media(id: $id, type: ANIME) {
    title { romaji }
    streamingEpisodes { title thumbnail }
  }
}`;

async function anilistPorNombre(nombre) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'query ($s: String) { Media(search: $s, type: ANIME) { id title { romaji } } }',
      variables: { s: nombre },
    }),
  });

  const m = (await r.json())?.data?.Media;

  const r2 = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: Q_STREAMING, variables: { id: m.id } }),
  });

  return (await r2.json())?.data?.Media;
}

async function imdbPorNombre(nombre) {
  const r = await fetch(
    `https://v2.sg.media-imdb.com/suggestion/x/${encodeURIComponent(nombre)}.json`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );

  const id = ((await r.json()).d ?? []).find((x) => x.q === 'TV series')?.id;

  const r2 = await fetch('https://api.graphql.imdb.com/', {
    method: 'POST',
    headers: CABECERAS,
    body: JSON.stringify({ query: Q_EPIS, variables: { id } }),
  });

  const d = (await r2.json()).data;

  const porTemporada = new Map();

  for (const e of d?.title?.episodes?.episodes?.edges ?? []) {
    const n = e.node.series?.episodeNumber;

    if (!n) continue;

    const lista = porTemporada.get(n.seasonNumber) ?? [];

    lista.push({ numero: n.episodeNumber, titulo: e.node.titleText?.text ?? '' });

    porTemporada.set(n.seasonNumber, lista);
  }

  return { id, porTemporada };
}

const nombre = process.argv[2] || 'Tokyo Ghoul';

const media = await anilistPorNombre(nombre);
const imdb = await imdbPorNombre(nombre);

console.log(`\nAniList: ${media?.title?.romaji}   IMDb: ${imdb.id}`);
console.log(`temporadas en IMDb: ${[...imdb.porTemporada.keys()].sort().join(', ')}\n`);

const streaming = (media?.streamingEpisodes ?? []).filter((e) => e.thumbnail);

if (!streaming.length) {
  console.log('AniList no tiene miniaturas para este titulo');
  process.exit(0);
}

for (const e of streaming) {
  const m = /^episode\s*(\d+)\s*[-–—:]?\s*(.*)$/i.exec(e.title);

  if (!m) {
    console.log(`formato raro: ${JSON.stringify(e.title)}`);
    continue;
  }

  const numero = Number(m[1]);
  const deAniList = m[2].trim();

  const deImdb = [];

  for (const [, lista] of imdb.porTemporada) {
    for (const x of lista) {
      if (x.numero === numero) deImdb.push(x.titulo);
    }
  }

  const iguales = deImdb.some((t) => normalizar(t) === normalizar(deAniList));

  console.log(
    `  ${iguales ? 'IGUAL ' : 'DIST '} n=${String(numero).padStart(3)}  ` +
      `ANI  ${deAniList.slice(0, 52)}`,
  );

  if (!iguales) {
    for (const t of deImdb) console.log(`  ${' '.repeat(9)}IMDB ${t.slice(0, 52)}`);
  }
}