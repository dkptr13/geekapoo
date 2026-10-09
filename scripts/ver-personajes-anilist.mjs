// Los personajes de un medio de AniList, con su imagen.
//    node scripts/ver-personajes-anilist.mjs <anilistId>
//
// Para cuando el emparejador dice "AniList lo tiene pero no sale en este
// anime". Casi siempre es que el personaje sale en OTRO medio de la misma
// franquicia —una pelicula, un especial, una parte aparte— y el emparejador
// solo mira la lista de la serie de television.
//
// Con esto se comprueba si la ficha del personaje tiene imagen y si esa
// imagen es la misma que hay en la lista de otro medio.

const id = Number(process.argv[2]);

if (!id) {
  console.error('  uso: node scripts/ver-personajes-anilist.mjs <anilistId>');
  process.exit(1);
}

const consulta = `query ($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    characters(perPage: 50, sort: [RELEVANCE, ID]) {
      edges {
        role
        node {
          id
          name { full native }
          image { large medium }
        }
      }
    }
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: consulta, variables: { id } }),
});

const d = await r.json();

if (d.errors) {
  console.log(`error: ${JSON.stringify(d.errors).slice(0, 300)}`);
  process.exit(1);
}

const m = d.data?.Media;

if (!m) {
  console.log(`AniList no tiene el medio ${id}`);
  process.exit(1);
}

console.log(`\n${m.id} "${m.title.romaji}": ${m.characters.edges.length} personajes\n`);

for (const e of m.characters.edges) {
  const n = e.node;

  console.log(
    `  ${String(e.role ?? '').padEnd(11)}${(n.image?.large ?? '(sin imagen)').slice(0, 62).padEnd(64)}` +
      `${n.name.full}  |  ${n.name.native ?? ''}`,
  );
}