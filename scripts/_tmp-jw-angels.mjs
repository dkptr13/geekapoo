const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};
const Q = `query B($f: TitleFilter) { popularTitles(country: ES, first: 10, filter: $f) { edges { node { ... on MovieOrShow { objectId objectType content(country: ES, language: es) { title originalReleaseYear } } } } } }`;
for (const t of ['Angels of Death', 'Satsuriku no Tenshi', 'Ángeles de la muerte']) {
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q, variables: { f: { searchQuery: t } } }) });
  const d = await r.json();
  console.log('---', t, 'HTTP', r.status, d.errors ? JSON.stringify(d.errors).slice(0, 200) : '');
  console.log(JSON.stringify(d.data?.popularTitles?.edges?.map((e) => e.node) ?? []).slice(0, 600));
}
