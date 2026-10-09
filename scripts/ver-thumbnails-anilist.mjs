// Miniaturas de capitulo segun AniList.
//    node scripts ver-thumbnails-anilist.mjs [<nombre-anime>]
//
// La pregunta es si AniList guarda una imagen por capitulo. La respuesta
// corta es que no tiene un tipo `Episode`, pero si tiene un campo
// `thumbnail` dentro de `MediaStreamingEpisode`, que es la lista de
// capitulos con su plataforma de streaming. Ese campo puede estar vacio,
// asi que hay que probarlo de verdad en vez de suponer.
//
// Esto saca los `streamingEpisodes` de unaSearchingpelicula y dice
// cuantos traen miniatura.
//
// Esto es lo que decide si las 586 miniaturas que faltan se pueden
// rellenar desde ahi o no.

import * as anilist from './anilist.mjs';

const nombre = process.argv[2] || 'Saenai Heroine no Sodatekata';

const CONSULTA = `query ($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    episodes
    streamingEpisodes { title site url thumbnail }
  }
}`;

async function de(id) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CONSULTA, variables: { id } }),
  });

  return (await r.json())?.data?.Media;
}

const base = await anilist.buscarAnime(nombre);
const { todos } = await anilist.arbol(base.id);

let totalEps = 0;
let conThumb = 0;

for (const m of [...todos.values()].sort((a, b) => (a.anio ?? 0) - (b.anio ?? 0))) {
  const x = await de(m.id);

  if (!x) {
    console.log(`${m.titulo}: sin datos`);
    continue;
  }

  const eps = x.streamingEpisodes ?? [];
  const conImagen = eps.filter((e) => e.thumbnail);

  totalEps += eps.length;
  conThumb += conImagen.length;

  console.log(
    `${String(x.episodes ?? '?').padStart(4)} eps  ${String(eps.length).padStart(4)} en streaming  ` +
      `${String(conImagen.length).padStart(4)} con miniatura   ${x.title.romaji}`,
  );

  for (const e of conImagen.slice(0, 3)) {
    console.log(`      ${String(e.title).slice(0, 34).padEnd(36)} ${e.site.padEnd(14)} ${e.thumbnail.slice(0, 90)}`);
  }
}

console.log(`\n${conThumb} con miniatura de ${totalEps} capitulos listados en streaming`);