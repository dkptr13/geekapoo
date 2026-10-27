const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const Q = `query B($f: TitleFilter) {
  popularTitles(country: ES, first: 3, filter: $f) {
    edges { node { ... on MovieOrShow {
      objectId objectType
      content(country: ES, language: es) { title originalReleaseYear }
    } } }
  }
}`;

const buscar = async (texto) => {
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q, variables: { f: { searchQuery: texto } } }) });
  const d = await r.json();
  if (d.errors) console.log('  error busqueda:', JSON.stringify(d.errors).slice(0, 200));
  return d.data?.popularTitles?.edges?.map((e) => e.node) ?? [];
};

const OFERTAS = `query O($id: ID!) { node(id: $id) { ... on MovieOrShow {
  content(country: ES, language: es) { title }
  es: offers(country: ES, platform: WEB) { monetizationType standardWebURL package { clearName } }
} } }`;

for (const texto of ['Severance', 'Ted Lasso', 'The Morning Show']) {
  const c = await buscar(texto);
  if (!c.length) { console.log(texto, 'sin resultados'); continue; }
  const n = c[0];
  const id = (n.objectType === 'SHOW' ? 'ts' : 'tm') + n.objectId;
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: OFERTAS, variables: { id } }) });
  const d = await r.json();
  if (d.errors) { console.log(texto, 'error:', JSON.stringify(d.errors).slice(0, 300)); continue; }
  console.log('---', texto, '->', d.data?.node?.content?.title, '| ofertas:', (d.data?.node?.es ?? []).length);
  const set = new Map();
  for (const o of d.data?.node?.es ?? []) set.set(o.package?.clearName + ' / ' + o.monetizationType, o.standardWebURL);
  for (const [k, v] of set) console.log('   ', k, v);
}
