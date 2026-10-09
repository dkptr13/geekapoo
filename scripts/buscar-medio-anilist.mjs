// Busca un medio en AniList por texto.
//    node scripts/buscar-medio-anilist.mjs <texto>
//
// Para encontrar el identificador de una pelicula o un especial. El
// emparejador de personajes solo mira la lista de la serie de television,
// asi que cuando un personaje sale solo en la pelicula hay que buscar el
// id de la pelicula a mano, y para eso hace falta esto.
//
// La busqueda va por el titulo en japones, que es donde AniList
// tiene los nombres de las peliculas: "I Want Nothing" es el titulo en
// ingles de エルスのゴブリン討伐 y buscarlo por el ingles no devuelve
// nada.

const texto = process.argv[2];

if (!texto) {
  console.error('  uso: node scripts/buscar-medio-anilist.mjs <texto>');
  process.exit(1);
}

const consulta = `query ($q: String) {
  Page(perPage: 12) {
    media(search: $q, type: ANIME, sort: [SEARCH_MATCH]) {
      id
      title { romaji native english }
      format
      episodes
      seasonYear
      startDate { year month day }
    }
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: consulta, variables: { q: texto } }),
});

const d = await r.json();

if (d.errors) {
  console.log(`error: ${JSON.stringify(d.errors).slice(0, 250)}`);
  process.exit(1);
}

const lista = d.data?.Page?.media ?? [];

console.log(`\n"${texto}": ${lista.length} resultados\n`);

for (const m of lista) {
  console.log(
    `${String(m.id).padEnd(9)}${String(m.format ?? '').padEnd(9)}` +
      `${String(m.episodes ?? '?').padStart(3)} eps  ${m.seasonYear ?? '????'}  ` +
      `${m.title.romaji}  |  ${m.title.native ?? ''}`,
  );
}