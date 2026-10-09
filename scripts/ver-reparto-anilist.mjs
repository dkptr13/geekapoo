// Reparto de un anime por temporada, segun AniList.
//
//    node scripts ver-reparto-anilist.mjs <nombre-anime>
//
// Para cada una de las partes de la franquicia, la lista de personajes
// con el rol y la parte en la que sale. Es lo que permite rellenar el
// campo `temporada` de `datos/<prefix>-personajes.mjs` sin suponer: un
// personaje que sale en la parte 1 y en la 3 pero no en la 2 tiene que ir
// con "1,3", no con "".

import * as anilist from './anilist.mjs';

const nombre = process.argv[2] || 'Tokyo Revengers';

const base = await anilist.buscarAnime(nombre);
const { todos } = await anilist.arbol(base.id);

const PERSONAJES = `query ($id: Int, $pagina: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    characters(page: $pagina, perPage: 50, sort: [ROLE, ID]) {
      pageInfo { hasNextPage }
      edges {
        role
        node { id name { full native } }
      }
    }
  }
}`;

async function de(id) {
  const salida = [];
  let pagina = 1;
  let medio = null;

  for (;;) {
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: PERSONAJES, variables: { id, pagina } }),
    });

    medio = (await r.json())?.data?.Media;

    if (!medio) break;

    for (const e of medio.characters.edges) {
      salida.push({
        id: e.node.id,
        nombre: e.node.name.full,
        nativo: e.node.name.native,
        rol: e.role,
      });
    }

    if (!medio.characters.pageInfo.hasNextPage) break;

    pagina++;
  }

  return { medio, salida };
}

// Se excluye solo lo que de verdad no es temporada. La lista blanca
// (TV y TV_SHORT) se quedaba fuera las peliculas, que en este catalogo
// van aparte como temporada y tienen su propio reparto: Zero, los tres
// capitulos de Evangelion, la OVA de Toradora.
const TEMPORADAS = [...todos.values()]
  .filter((m) => m.formato !== 'SPECIAL')
  .sort((a, b) => (a.anio ?? 0) - (b.anio ?? 0) || (a.id > b.id ? 1 : -1));

const porPersonaje = new Map();

for (const [i, t] of TEMPORADAS.entries()) {
  const { medio, salida } = await de(t.id);

  console.log(`T${i + 1}  ${medio?.title?.romaji} (${t.anio}): ${salida.length} personajes`);

  for (const p of salida) {
    if (!porPersonaje.has(p.id)) {
      porPersonaje.set(p.id, { ...p, temporadas: new Set(), roles: new Set() });
    }

    porPersonaje.get(p.id).temporadas.add(i + 1);
    porPersonaje.get(p.id).roles.add(p.rol);
  }
}

console.log(`\n${porPersonaje.size} personajes en total\n`);

const PESO = { MAIN: 0, SUPPORTING: 1, BACKGROUND: 2 };

const lista = [...porPersonaje.values()].sort((a, b) => {
  const pa = PESO[a.roles.values().next().value] ?? 3;
  const pb = PESO[b.roles.values().next().value] ?? 3;

  return pa - pb || b.temporadas.size - a.temporadas.size || a.nombre.localeCompare(b.nombre);
});

for (const p of lista) {
  console.log(
    `  ${[...p.roles].join('/').padEnd(18)} ${[...p.temporadas].join(',').padEnd(12)} ` +
      `${p.nombre.padEnd(24)} ${p.nativo ?? ''}`,
  );
}