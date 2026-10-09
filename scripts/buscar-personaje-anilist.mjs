// Busca un personaje en AniList por nombre.
//    node scripts/buscar-personaje-anilist.mjs <nombre>
//
// Los personajes que solo salen en una pelicula o en un especial no
// aparecen en la lista de personajes de la serie de television, asi que
// el emparejador no los encuentra aunque AniList tenga su ficha. Este
// script los busca por el nombre.
//
// Se enseñan TODOS los resultados con los medios en los que sale cada
// uno, porque un mismo nombre puede ser de dos personajes distintos: hay
// dos "Taiga", dos "Kirito" y dos "Yū". Sin ver los medios, se puede
// coger la cara del equivocado.

const nombre = process.argv[2];

if (!nombre) {
  console.error('  uso: node scripts/buscar-personaje-anilist.mjs <nombre>');
  process.exit(1);
}

const consulta = `query ($q: String) {
  Page(perPage: 8) {
    characters(search: $q, sort: [SEARCH_MATCH]) {
      id
      name { full native }
      image { large }
      media(perPage: 12) {
        nodes { id title { romaji } type format }
      }
    }
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: consulta, variables: { q: nombre } }),
});

const d = await r.json();

if (d.errors) {
  console.log(`error: ${JSON.stringify(d.errors).slice(0, 250)}`);
  process.exit(1);
}

const lista = d.data?.Page?.characters ?? [];

console.log(`\n"${nombre}": ${lista.length} resultados\n`);

for (const c of lista) {
  const imagen = c.image?.large ?? '(sin imagen)';

  console.log(`  ${String(c.id).padEnd(9)}${imagen.slice(0, 60)}`);
  console.log(`            ${c.name.full}  |  ${c.name.native ?? ''}`);

  for (const m of c.media.nodes) {
    console.log(`              ${m.type.padEnd(7)}${String(m.id).padEnd(9)}${m.title.romaji}`);
  }

  console.log('');
}