import { writeFileSync } from 'node:fs';
const CAB = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
};
const Q = `query ($id: ID!) { title(id:$id) { id titleText{text} ratingsSummary{aggregateRating voteCount} episodes { episodes(first:60) { edges { node { titleText{text} releaseDate{day month year} series{episodeNumber{episodeNumber seasonNumber}} ratingsSummary{aggregateRating} } } } } } }`;
const r = await fetch('https://api.graphql.imdb.com/', {
  method: 'POST', headers: CAB,
  body: JSON.stringify({ query: Q, variables: { id: 'tt0500092' } }),
});
const j = await r.json();
const t = j.data?.title;
console.log('tt0500092 ->', t?.titleText?.text, '| rating:', t?.ratingsSummary?.aggregateRating, '| votes:', t?.ratingsSummary?.voteCount);
const filas = (t?.episodes?.episodes?.edges ?? []).map((e) => ({
  num: e.node.series?.episodeNumber?.episodeNumber,
  season: e.node.series?.episodeNumber?.seasonNumber,
  title: e.node.titleText?.text,
  date: e.node.releaseDate ? `${e.node.releaseDate.year}-${String(e.node.releaseDate.month ?? 1).padStart(2, '0')}-${String(e.node.releaseDate.day ?? 1).padStart(2, '0')}` : '',
  rating: e.node.ratingsSummary?.aggregateRating ?? null,
}));
filas.sort((a, b) => a.season - b.season || a.num - b.num);
console.log('  episodes:', filas.length, '| with rating:', filas.filter((f) => f.rating).length);
for (const f of filas) console.log(`  ${f.num} ${f.date} | ${f.title} | ${f.rating}`);
writeFileSync('C:/Users/Oscar/AppData/Local/Temp/opencode/tt0500092-imdb.json', JSON.stringify(filas, null, 2), 'utf8');
console.log('  saved');
// TVDB
const k = '68867123-fc1f-4da8-8e21-993509ab64b7';
const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: k }),
});
const token = (await login.json())?.data?.token;
let all = [];
for (let p = 0; p < 5; p++) {
  const r2 = await fetch('https://api4.thetvdb.com/v4/series/78814/episodes/default?page=' + p, { headers: { Authorization: 'Bearer ' + token } });
  const d = await r2.json();
  if (!d.data?.episodes?.length) break;
  all.push(...d.data.episodes);
}
console.log('\nTVDB total:', all.length);
for (const e of all.filter(x => x.seasonNumber === 1)) console.log('  ', e.number, JSON.stringify(e.name), e.aired);