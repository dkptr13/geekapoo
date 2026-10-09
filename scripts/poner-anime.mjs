// Pone un campo de la ficha de un anime.
//    node scripts/poner-anime.mjs <animeId> <campo> <valor> [<campo> <valor> ...]
//
// ── PARA QUE HACE FALTA ────────────────────────────────────────
//
// `cargar-anime.mjs --actualizar` actualiza temporadas, capitulos y
// personajes, y con eso dos campos de la ficha: la nota y el recuento
// de capitulos. Los demas campos los escribe `crear-anime.mjs`, que
// solo crea: si el anime ya existe no toca la ficha.
//
// No hay ningun script que corrija un campo suelto de la ficha. Para
// cambiar la sinopsis habia que editar el fichero de datos y subir el
// anime entero otra vez, que ademas vacia las imagenes.
//
// Asi que esto: un PATCH con mascara de los campos que se le pasen, y
// nada mas. Es lo que hacia falta para arreglar "el peso de su padre"
// escrito como "el pairo de su padre" en Chainsaw Man.
//
// ── LO QUE NO HACE ──────────────────────────────────────────────
//
// No lee los ficheros de datos. Los campos van en la linea de orden,
// como argumentos, para que quede claro en el historial de consola
// que se ha escrito y que no.

import { escribir, s } from './firestore-rest.mjs';

const argumentos = process.argv.slice(2);
const animeId = argumentos.shift();

if (!animeId || argumentos.length < 2 || argumentos.length % 2 !== 0) {
  console.error('  uso: node scripts/poner-anime.mjs <animeId> <campo> <valor> [<campo> <valor> ...]');

  process.exit(1);
}

for (let i = 0; i < argumentos.length; i += 2) {
  const campo = argumentos[i];
  const valor = argumentos[i + 1];

  await escribir('animes', animeId, { [campo]: s(valor) }, [campo]);

  console.log(`  ${animeId}  ${campo} = ${valor.slice(0, 70)}`);
}