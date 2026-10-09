// Poner la imagen de un personaje, sacada de su ficha en AniList.
//    node scripts/poner-personaje.mjs <animeId> <nombre> <anilistId> [--nota <texto>]
//
// Para los personajes que el emparejador automatico no encuentra, que son
// los que solo salen en una pelicula o en un especial: no aparecen en la
// lista de personajes de la serie de television, asi que quedan sin
// emparejar aunque AniList tenga su ficha.
//
// ── POR QUE NO SE PUEDE DELEGAR EN EL SCRIPT ───────────────────────
//
// `enlazar-imagenes.mjs` tiene un filtro que rechaza a cualquier
// personaje que no salga en el anime que se esta mirando, y el filtro es
// correcto: sin el, "Miyu" acabaria con la cara de una de Kaguya-sama.
// Pero los personajes que solo salen en una pelicula se quedan fuera por
// el mismo motivo.
//
// Para esos hay que mirar la ficha uno por uno y decidir. Este script
// escribe lo que se le dice, con la nota de por que, y no decide nada.
//
// ── LA COMPROBACION ────────────────────────────────────────────────
//
// Antes de escribir hay que mirar dos cosas en la ficha de AniList:
//
//   1. Que el nombre japones sea el mismo que el guardado. Es lo que
//      distingue a un personaje de otro con el mismo nombre en ingles.
//
//   2. Que salga en ESTA franquicia. En AniList los cinco hijos de los
//      Greyrat de Mushoku Tensei estan marcados como MANGA y no como
//      ANIME, asi que el filtro de "sale en este anime" los rechaza. Es
//      correcto que lo haga, porque en un caso asi un nombre igual puede
//      ser de otra serie. Aqui se comprueba a mano.

import { escribir, str, coleccion } from './firestore-rest.mjs';

const [animeId, nombre, anilistId] = process.argv.slice(2);
const notaIdx = process.argv.indexOf('--nota');
const nota = notaIdx > 0 ? process.argv[notaIdx + 1] : '';

if (!animeId || !nombre || !anilistId) {
  console.error('  uso: node scripts/poner-personaje.mjs <animeId> <nombre> <anilistId> [--nota <texto>]');
  process.exit(1);
}

// ── La ficha de AniList ─────────────────────────────────────────────

const consulta = `query ($id: Int!) {
  Character(id: $id) {
    name { full native }
    image { large }
    media(perPage: 30) { nodes { id title { romaji } type } }
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: consulta, variables: { id: Number(anilistId) } }),
});

const ficha = (await r.json())?.data?.Character;

if (!ficha) {
  console.log(`AniList no tiene el personaje ${anilistId}`);
  process.exit(1);
}

if (!ficha.image?.large) {
  console.log(`${ficha.name.full} no tiene imagen en AniList`);
  process.exit(1);
}

const tipos = [...new Set(ficha.media.nodes.map((m) => m.type))];

console.log(`\nAniList ${anilistId}: ${ficha.name.full}  |  ${ficha.name.native ?? '(sin japones)'}`);
console.log(`  salida en: ${tipos.join(', ')}`);
console.log(`  ${ficha.media.nodes.map((m) => `${m.title.romaji}`).join('\n           ')}`);
console.log(`  imagen: ${ficha.image.large}`);

// ── El personaje del catalogo ───────────────────────────────────────

const personajes = await coleccion('characters');

const mio = personajes.find(
  (c) => str(c.f, 'animeId') === animeId && str(c.f, 'name') === nombre,
);

if (!mio) {
  console.log(`\nno hay "${nombre}" en ${animeId}`);
  process.exit(1);
}

console.log(`\n${animeId} / ${nombre}  (${str(mio.f, 'japaneseName') ?? 'sin japones'})`);

if (str(mio.f, 'imageUrl')) {
  console.log(`  ya tiene imagen: ${str(mio.f, 'imageUrl')}`);
  console.log('\n  usa --forzar para pisarla');

  process.exit(1);
}

await escribir('characters', mio.id, { imageUrl: { stringValue: ficha.image.large } }, [
  'imageUrl',
]);

console.log(`  PUESTA: ${ficha.image.large}`);

if (nota) console.log(`  nota: ${nota}`);