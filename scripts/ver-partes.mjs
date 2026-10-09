// Todas las partes de una franquicia segun AniList, sin filtrar.
//    node scripts ver-partes.mjs <nombre-anime>
//
// `arbol()` filtra la lista de relaciones por palabras del titulo, que
// es lo que hace falta para no colarse en franquicias ajenas, pero
// tambien se come partes legitimas: los OVA y los especiales no suelen
// compartir el titulo entero y se quedan fuera. Para decidir que va en
// el catalogo hay que verlas todas, y este script las enseña.
//
// Formato, numero de capitulos, estado y de donde viene la relacion.

import * as anilist from './anilist.mjs';

const nombre = process.argv[2] || 'Saenai Heroine no Sodatekata';

const base = await anilist.buscarAnime(nombre);

console.log(`\nbase: ${base.id} "${base.titulo}"\n`);

const REL = `query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    format
    episodes
    duration
    status
    seasonYear
    averageScore
    title { romaji english }
    relations {
      edges {
        relationType
        node { id format episodes duration status seasonYear averageScore title { romaji english } }
      }
    }
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: REL, variables: { id: base.id } }),
});

const m = (await r.json())?.data?.Media;

const linea = (x, extra = '') =>
  `${String(x.id).padEnd(8)}${String(x.seasonYear ?? '????').padEnd(7)}` +
  `${String(x.format ?? '').padEnd(9)}${String(x.episodes ?? '?').padStart(4)} eps  ` +
  `${String(x.status ?? '').padEnd(18)}${String(x.averageScore ?? '-').padStart(4)}  ` +
  `${x.title?.romaji}${extra}`;

console.log('RELACION DIRECTAS:');
console.log('  ' + linea(m));

for (const e of m.relations.edges) {
  console.log(`  ${String(e.relationType).padEnd(18)} ${linea(e.node)}`);
}

// Y las relaciones de segundo grado, que es donde aparecen los OVA que
// cuelgan de la pelicula y no de la serie.
const vistos = new Set([base.id]);

for (const e of m.relations.edges) {
  if (vistos.has(e.node.id)) continue;

  vistos.add(e.node.id);

  const r2 = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: REL, variables: { id: e.node.id } }),
  });

  const m2 = (await r2.json())?.data?.Media;

  for (const e2 of m2?.relations?.edges ?? []) {
    if (vistos.has(e2.node.id)) continue;

    vistos.add(e2.node.id);

    console.log(`  ${'  (segundo)'.padEnd(18)} ${linea(e2.node)}`);
  }
}