// Busca el id de IMDb de una serie por su titulo.
//   node scripts/buscar-imdb.mjs <titulo>
const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
};

const texto = process.argv[2];
if (!texto) {
  console.error('  uso: node scripts/buscar-imdb.mjs <titulo>');
  process.exit(1);
}

const Q = `query ($q: String!) {
  mainSearch(options: { searchTerm: $q, type: TITLE, includeAdult: false }, first: 8) {
    edges {
      node {
        entity {
          ... on Title {
            id
            titleText { text }
            releaseYear { year }
            titleType { id }
            series { episodeNumber { episodeNumber seasonNumber } }
          }
        }
      }
    }
  }
}`;

const r = await fetch('https://api.graphql.imdb.com/', {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ query: Q, variables: { q: texto } }),
});

const crudo = await r.text();
let d = null;
try { d = JSON.parse(crudo); } catch { /* se informa abajo */ }

if (!d) {
  console.log(`respondio ${r.status}: ${crudo.slice(0, 300)}`);
  process.exit(1);
}
if (d.errors) {
  console.log(`error: ${JSON.stringify(d.errors).slice(0, 300)}`);
  process.exit(1);
}

const edges = d.data?.mainSearch?.edges ?? [];
console.log(`"${texto}": ${edges.length} resultados`);
for (const e of edges) {
  const t = e.node?.entity;
  if (!t || !t.id) continue;
  const serie = t.series?.episodeNumber?.seasonNumber;
  console.log(`  ${t.id}  ${t.titleText?.text}  (${t.releaseYear?.year ?? '?'})  ${t.titleType?.id ?? ''}${serie ? '  temp ' + serie : ''}`);
}