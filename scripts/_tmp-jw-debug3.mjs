const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};
const Q = `query B($f: TitleFilter) { popularTitles(country: ES, first: 6, filter: $f) { edges { node { ... on MovieOrShow { objectId objectType content(country: US, language: en) { title originalTitle originalReleaseYear } es: content(country: ES, language: es) { title } } } } } }`;

const buscar = async (t) => {
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q, variables: { f: { searchQuery: t } } }) });
  const d = await r.json();
  console.log(`\n--- "${t}" ${d.errors ? 'ERR' : ''}`);
  for (const e of d.data?.popularTitles?.edges ?? []) {
    const n = e.node;
    console.log(`  ${n.objectType === 'SHOW' ? 'ts' : 'tm'}${n.objectId} | ${n.content?.title} (${n.content?.originalReleaseYear}) | orig ${n.content?.originalTitle} | es ${n.es?.title}`);
  }
};

for (const t of ['けいおん!', 'K-ON!', 'K-ON', '中二病でも恋がしたい!', 'Chuunibyou demo Koi ga Shitai', 'Kämpfer', 'けんぷファー']) {
  await buscar(t);
  await new Promise((ok) => setTimeout(ok, 200));
}
