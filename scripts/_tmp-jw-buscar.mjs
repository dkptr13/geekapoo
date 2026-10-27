const URL_GQL = 'https://apis.justwatch.com/graphql';
const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const buscar = async (texto) => {
  const Q = `query Buscar($filtrar: TitleFilter) {
    popularTitles(country: ES, first: 8, filter: $filtrar) {
      edges {
        node {
          ... on MovieOrShow {
            objectId
            objectType
            content(country: ES, language: es) { title originalReleaseYear fullPath }
          }
        }
      }
    }
  }`;
  const r = await fetch(URL_GQL, {
    method: 'POST',
    headers: CABECERAS,
    body: JSON.stringify({ query: Q, variables: { filtrar: { searchQuery: texto } } }),
  });
  const d = await r.json();
  if (d.errors) return { error: JSON.stringify(d.errors).slice(0, 300) };
  return d.data.popularTitles.edges.map((e) => e.node);
};

for (const t of ['Akame ga Kill!', 'Berserk', 'Takopi', 'Gintama', 'Cowboy Bebop']) {
  const r = await buscar(t);
  console.log('---', t);
  console.log(JSON.stringify(r).slice(0, 800));
}
