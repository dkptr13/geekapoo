// Rellena `seasonsCount` en los animes existentes.
//
//   node scripts/actualizar-seasons-count.mjs            (simulación)
//   node scripts/actualizar-seasons-count.mjs --escribir (escribe)
//
// El panel usa este contador para el filtro "Con temporadas" sin
// descargar la colección completa de temporadas. Las temporadas que
// se crean o borran desde el panel ya lo mantienen al día; este
// script es la migración única para el catálogo que ya existía.
//
// Solo escribe el campo `seasonsCount`; no toca ningún otro dato.

import { coleccion, escribir, i, str } from './firestore-rest.mjs';

const ESCRIBIR = process.argv.includes('--escribir');

const [animes, temporadas] = await Promise.all([
  coleccion('animes', { select: ['title'] }),
  coleccion('seasons', { select: ['animeId'] }),
]);

const porAnime = new Map();
for (const temporada of temporadas) {
  const animeId = str(temporada, 'animeId');
  if (!animeId) continue;
  porAnime.set(animeId, (porAnime.get(animeId) ?? 0) + 1);
}

let cambios = 0;
let sinTemporadas = 0;

for (const anime of animes) {
  const total = porAnime.get(anime.id) ?? 0;
  if (total === 0) sinTemporadas += 1;

  const titulo = str(anime, 'title') || anime.id;
  console.log(`${anime.id}: ${total} temporada(s) — ${titulo}`);

  if (ESCRIBIR) {
    await escribir('animes', anime.id, { seasonsCount: i(total) }, ['seasonsCount']);
  }
  cambios += 1;
}

console.log(
  `\n${animes.length} animes, ${temporadas.length} temporadas. ` +
    `${cambios} animes ${ESCRIBIR ? 'actualizados' : 'a actualizar'}; ` +
    `${sinTemporadas} sin temporadas.`,
);

if (!ESCRIBIR) {
  console.log('Simulación. Vuelve a ejecutarlo con --escribir para guardar.');
}
