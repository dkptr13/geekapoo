const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};
const Q = `query B($f: TitleFilter) { popularTitles(country: ES, first: 10, filter: $f) { edges { node { ... on MovieOrShow { objectId objectType content(country: US, language: en) { title originalReleaseYear } es: content(country: ES, language: es) { title } } } } } }`;
for (const t of ['Code Geass: Lelouch of the Rebellion III - Glorification', 'Glorification', 'Code Geass Glorification']) {
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q, variables: { f: { searchQuery: t } } }) });
  const d = await r.json();
  console.log('\n---', t);
  for (const e of d.data?.popularTitles?.edges ?? []) {
    const n = e.node;
    console.log(`  ${n.objectType === 'SHOW' ? 'ts' : 'tm'}${n.objectId} | ${n.content?.title} (${n.content?.originalReleaseYear}) | es: ${n.es?.title}`);
  }
}
