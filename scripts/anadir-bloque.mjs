// Añade un bloque al final de un fichero, o lo sustituye si ya está.
//    node scripts/anadir-bloque.mjs <fichero> <bloque> <marca>
//
// La marca es un texto que tiene que estar dentro del bloque, y que se
// busca para no duplicarlo. Sin la marca, volver a ejecutar el script
// añade el bloque otra vez y aparecen dos copias de la misma función.
//
// Se escribe con `node -e` es un desastre cuando el bloque lleva
// comillas, acentos y saltos de línea, así que va en fichero.

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, bloqueRel, marca] = process.argv.slice(2);

if (!rutaRel || !bloqueRel || !marca) {
  console.error('  uso: node scripts/anadir-bloque.mjs <fichero> <bloque> <marca>');

  process.exit(1);
}

const ruta = new URL(rutaRel, import.meta.url);
const bloqueUrl = new URL(bloqueRel, import.meta.url);

const texto = await readFile(ruta, 'utf8');
const bloque = (await readFile(bloqueUrl, 'utf8')).replace(/\n+$/, '');

if (texto.includes(marca)) {
  console.log('  ya estaba');

  process.exit(0);
}

await writeFile(ruta, `${texto.replace(/\n+$/, '')}\n${bloque}\n`, 'utf8');

console.log(`  anadido a ${ruta.pathname.split('/').pop()}`);
