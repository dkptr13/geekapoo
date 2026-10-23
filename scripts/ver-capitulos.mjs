// Volca los capitulos de una temporada (AniList + IMDb) sin escribir
// nada: sirve para ver la lista real antes de redactar.
//   node scripts/ver-capitulos.mjs <id-anilist> <id-imdb> [temporada]
const [, , idAniList, idImdb, temporadaArg] = process.argv;
const temporada = Number(temporadaArg ?? 1);

const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
};

const Q_A = `query ($id: Int) {
  Media(id: $id) {
    title { romaji native english }
    episodes { episodeNumber airingDate title { romaji native } }
  }
}`;

const rA = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: Q_A, variables: { id: Number(idAniList) } }),
});
const dA = await rA.json();
const media = dA.data?.Media;

const Q_I = `query ($id: ID!, $t: Int) {
  title(id: $id) {
    episodes {
      episodes(first: 300, filter: { seasons: [$t] }) {
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

const rI = await fetch('https://api.graphql.imdb.com/', {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ query: Q_I, variables: { id: idImdb, t: temporada } }),
});
const dI = await rI.json();
const edges = dI.data?.title?.episodes?.episodes?.edges ?? [];

console.log(`\n${media.title.romaji} / ${media.title.native} — temporada ${temporada}`);
console.log(`AniList: ${media.episodes?.length ?? 0} capitulos · IMDb: ${edges.length}\n`);

const deAniList = new Map();
for (const e of media.episodes ?? []) {
  if (e.episodeNumber == null) continue;
  deAniList.set(e.episodeNumber, e);
}

for (const e of edges) {
  const n = e.node;
  const num = n.series?.episodeNumber?.episodeNumber;
  if (num == null) continue;
  const a = deAniList.get(num);
  const rd = n.releaseDate;
  const fecha = rd?.year
    ? `${rd.year}-${String(rd.month ?? 1).padStart(2, '0')}-${String(rd.day ?? 1).padStart(2, '0')}`
    : '?';
  const nota = n.ratingsSummary?.aggregateRating;
  const votos = n.ratingsSummary?.voteCount;
  console.log(
    `${num}\t${fecha}\t${nota ?? '?'}\t${votos ?? '?'}\t${n.titleText?.text ?? ''}\t${a?.title?.native ?? ''}\t${a?.title?.romaji ?? ''}`,
  );
}