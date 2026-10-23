// Las piezas de una serie en IMDb, con sus temporadas.
//   node scripts/imdb-piezas.mjs <tt> [...]
const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
};

const Q = `query ($id: ID!) {
  title(id: $id) {
    titleText { text }
    titleType { id }
    releaseYear { year }
    releaseDate { day month year }
    ratingsSummary { aggregateRating voteCount }
    episodes {
      seasons { number }
      episodes(first: 300) {
        total
        edges {
          node {
            titleText { text }
            releaseDate { day month year }
            series { episodeNumber { episodeNumber seasonNumber } }
            ratingsSummary { aggregateRating voteCount }
          }
        }
      }
    }
  }
}`;

for (const id of process.argv.slice(2)) {
  const r = await fetch('https://api.graphql.imdb.com/', {
    method: 'POST',
    headers: CABECERAS,
    body: JSON.stringify({ query: Q, variables: { id } }),
  });
  const d = await r.json();
  const t = d.data?.title;
  if (!t) {
    console.log(`${id}: sin datos`);
    continue;
  }
  const porTemporada = new Map();
  for (const e of t.episodes?.episodes?.edges ?? []) {
    const n = e.node;
    const s = n.series?.episodeNumber?.seasonNumber;
    const num = n.series?.episodeNumber?.episodeNumber;
    if (num == null) continue;
    if (!porTemporada.has(s)) porTemporada.set(s, []);
    porTemporada.get(s).push(num);
  }
  console.log(
    `\n${id}  "${t.titleText.text}"  (${t.releaseYear?.year})  ${t.titleType?.id}` +
      `  nota ${t.ratingsSummary?.aggregateRating ?? '?'} (${t.ratingsSummary?.voteCount ?? '?'} votos)`,
  );
  for (const s of [...porTemporada.keys()].sort((a, b) => a - b)) {
    const nums = porTemporada.get(s).sort((a, b) => a - b);
    console.log(
      `   temporada ${s}: ${nums.length} capitulos (${nums[0]}..${nums[nums.length - 1]})`,
    );
  }
}