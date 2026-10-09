// Busca un personaje por nombre en AniList y ensena lo que hay.
//    node scripts ver-personaje.mjs <nombre> [<nombre-anime>]
//
// Para cuando un personaje no empareja: el emparejador puede descartar
// un nombre que AniList si tiene, y hay que ver por que. Saca el nombre
// completo y el japones tal cual estan, que es lo que se compara.

const nombre = process.argv[2];
const anime = process.argv[3] ?? 'No Game No Life';

const CONSULTA = `query ($nombre: String, $anime: String) {
  Character(search: $nombre) {
    id
    name { full native }
    media(perPage: 8) {
      nodes { id title { romaji } }
    }
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: CONSULTA, variables: { nombre, anime } }),
});

const c = (await r.json())?.data?.Character;

if (!c) {
  console.log('AniList no devuelve nada para', nombre);
  process.exit(0);
}

console.log(`id ${c.id}`);
console.log(`nombre: ${JSON.stringify(c.name.full)}`);
console.log(`japones: ${JSON.stringify(c.name.native)}`);
console.log(`buscado: ${JSON.stringify(nombre)}`);
console.log('aparece en:');

for (const m of c.media.nodes) console.log('  ' + m.title.romaji);