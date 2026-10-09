// Pone la miniatura de un capitulo cuando el emparejador no la ha encontrado.
//    node scripts/poner-miniatura.mjs <id-capitulo> <url> [<id> <url> ...]
//
// ── POR QUE HACE FALTA ────────────────────────────────────────
//
// El emparejador de miniaturas empareja por el titulo japones, y eso
// falla cuando el titulo guardado y el de TVDB no son el mismo texto
// aunque sean el mismo capitulo. En Chainsaw Man son dos:
//
//   · El capitulo 5. El fichero tiene 銃の悪神 y TVDB tiene 銃の悪魔.
//     La wiki en japones pone 銃の悪神, o sea que el que esta mal es
//     TVDB: se comio un caracter al escribirlo. Diferencia de un solo
//     caracter, y no hay forma de emparejar eso por titulo.
//
//   · La pelicula del arco Reze. El fichero tiene 劇場版 チェンソーマン
//     レゼ篇, que es el titulo oficial, y TVDB lo guarda como
//     チェンソーマン レゼ篇, sin el 劇場版 delante.
//
// ── POR QUE SE ESCRIBE A MANO Y NO SE TOCA EL EMPAREJADOR ───────
//
// Podria tocarse `normalizar-titulo.mjs` para queiera las dos cosas, y
// seria un parche: un caso de Chainsaw Man arreglaria todos los titulos
// parecidos de todos los animes, y alguno se emparejaria mal. A mano es
// un par de lineas y solo afecta a estos dos capitulos.
//
// ── LA COMPROBACION ────────────────────────────────────────────
//
// Poner una imagen equivocada es el fallo que mas da pan en este
// script, asi que no se fia de que el id sea el correcto: hay que
// pasar la imagen y el nombre de los dos lados.
//
//   node scripts/tvdb-capitulo.mjs <id-de-tvdb>
//
// y comparar la fecha con la del capitulo. La fecha es lo que
// desempata: el 5 es el unico capitulo de la T1 con aired 2022-11-09,
// y la pelicula es la unica con aired 2025-09-19.

import { escribir } from './firestore-rest.mjs';

const argumentos = process.argv.slice(2);

if (argumentos.length < 2 || argumentos.length % 2 !== 0) {
  console.error('  uso: node scripts/poner-miniatura.mjs <id-capitulo> <url> [<id> <url> ...]');

  process.exit(1);
}

for (let i = 0; i < argumentos.length; i += 2) {
  const id = argumentos[i];
  const url = argumentos[i + 1];

  if (!url.startsWith('https://')) {
    console.error(`  ${id}: la URL no es https`);

    process.exit(1);
  }

  await escribir('episodes', id, { thumbnailUrl: { stringValue: url } }, ['thumbnailUrl']);

  console.log(`  ${id}  ${url.split('/').pop()}`);
}