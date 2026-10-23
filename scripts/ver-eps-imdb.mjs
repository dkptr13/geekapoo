import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
};

const Q = `query ($id: ID!) {
  title(id: $id) {
    episodes {
      episodes(first: 300) {
        edges {
          node {
            titleText { text }
            releaseDate { day month year }
            series { episodeNumber { episodeNumber seasonNumber } }
            ratingsSummary { aggregateRating }
          }
        }
      }
    }
  }
}`;

const [id, temp] = process.argv.slice(2);
const r = await fetch('https://api.graphql.imdb.com/', {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ query: Q, variables: { id } }),
});
const d = await r.json();
for (const e of d.data.title.episodes.episodes.edges) {
  const n = e.node;
  if (n.series?.episodeNumber?.seasonNumber !== Number(temp)) continue;
  const num = n.series?.episodeNumber?.episodeNumber;
  const rd = n.releaseDate;
  const fecha = rd?.year
    ? `${rd.year}-${String(rd.month ?? 1).padStart(2, '0')}-${String(rd.day ?? 1).padStart(2, '0')}`
    : '';
  console.log(`${num}\t${fecha}\t${n.ratingsSummary?.aggregateRating ?? '?'}\t${n.titleText?.text ?? ''}`);
}