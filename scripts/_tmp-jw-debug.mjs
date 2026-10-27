import { coleccion, str, num } from './firestore-rest.mjs';

const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const buscar = async (texto) => {
  const Q = `query B($f: TitleFilter) { popularTitles(country: ES, first: 10, filter: $f) { edges { node { ... on MovieOrShow { objectId objectType content(country: ES, language: es) { title originalReleaseYear } } } } } }`;
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q, variables: { f: { searchQuery: texto } } }) });
  const d = await r.json();
  if (d.errors) { console.log('  ERR', JSON.stringify(d.errors).slice(0, 200)); return []; }
  return d.data.popularTitles.edges.map((e) => e.node);
};

const animes = await coleccion('animes');
for (const id of ['tenki-no-ko', 'the-promised-neverland', 'to-love-ru', 'spy-family', 'solo-leveling', 'ataque-a-los-titanes', 'frieren-beyond-journeys-end', 'dandadan']) {
  const d = animes.find((x) => x.id === id);
  const titulo = str(d, 'title');
  const jap = str(d, 'japaneseTitle');
  const alt = (d.f.alternativeTitles?.arrayValue?.values ?? []).map((v) => v.stringValue);
  console.log(`\n### ${id} | "${titulo}" | jap "${jap}" | alt ${JSON.stringify(alt)}`);
  for (const q of [...new Set([titulo, jap, ...alt].filter(Boolean))]) {
    const cs = await buscar(q);
    console.log(`  query "${q}" -> ${cs.length}`);
    for (const c of cs.slice(0, 4)) console.log(`     ${c.objectType} "${c.content?.title}" (${c.content?.originalReleaseYear})`);
  }
}
