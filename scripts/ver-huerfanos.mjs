// Busca documentos huerfanos en el catalogo: los que no tienen `name`.
//
//    node scripts/ver-huerfanos.mjs --full [--borrar]
//
// ── QUE SON Y POR QUE HAN APARECIDO ───────────────────────────────
//
// En Firestore, un PATCH con `updateMask` sobre un id que NO existe no
// falla: CREA el documento con solo los campos de la mascara. O sea,
// un script que se equivoca al escribir un nombre no da error, deja un
// cascaron con un campo suelto y sigue como si nada.
//
// La diferencia entre eso y un personaje de verdad es que el cascaron
// no tiene `name`, que es lo unico que lo identifica. Un personaje
// siempre lo tiene.

import { coleccion, borrar } from './firestore-rest.mjs';

if (!process.argv.includes('--full')) {
  console.error('  uso: ver-huerfanos.mjs --full [--borrar]');
  console.error('  Recorre animes, temporadas, personajes y episodios: requiere --full.');
  process.exit(1);
}

const COLECCIONES = ['animes', 'seasons', 'characters', 'episodes'];

// Campos que un documento necesita para existir de verdad.
//
// OJO con `animes`: NO guardan el nombre en `name`, lo guardan en
// `title`. Es lo que hizo que la primera version de este script
// marcara los 12 animes como huerfanos cuando estan perfectamente
// completos.
const IDENTIDAD = {
  animes: 'title',
  seasons: 'number',
  characters: 'name',
  episodes: 'number',
};

let totalHuerfanos = 0;
let conImagen = 0;

for (const col of COLECCIONES) {
  const docs = await coleccion(col);
  const sinIdentidad = docs.filter((d) => !d.f[IDENTIDAD[col]]);

  console.log(`\n${col}: ${docs.length} docs, ${sinIdentidad.length} sin \`${IDENTIDAD[col]}\``);

  for (const d of sinIdentidad) {
    totalHuerfanos++;

    const campos = Object.keys(d.f);
    const tieneImagen = campos.includes('imageUrl') || campos.includes('posterUrl');

    if (tieneImagen) conImagen++;

    console.log(`  ${d.id}`);
    console.log(`    campos: ${campos.join(', ') || '(ninguno)'}${tieneImagen ? '   <-- TIENE IMAGEN' : ''}`);
  }
}

console.log(`\n${totalHuerfanos} huerfanos en total, ${conImagen} con imagen (no se deben borrar sin mirarlos)`);

if (process.argv.includes('--borrar') && !conImagen) {
  console.log('\nBorrando...');

  for (const col of COLECCIONES) {
    const docs = await coleccion(col);

    for (const d of docs.filter((x) => !x.f[IDENTIDAD[col]])) {
      await borrar(col, d.id);
      console.log(`  borrado ${col}/${d.id}`);
    }
  }

  console.log('\nHecho. Vuelve a ejecutar sin --borrar para comprobar.');
} else if (process.argv.includes('--borrar')) {
  console.log('\nNO se borra: hay huerfanos con imagen. Revisa la lista de arriba.');
}