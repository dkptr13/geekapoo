// Reescribe dos lineas enteras de ngl-t1.mjs.
//
//    node scripts/reescribir-lineas.mjs <fichero> <n1> <n2> ...
//
// Cada linea se pasa en un fichero aparte, uno por linea, con el numero
// al principio. Es para los casos en que el trozo a arreglar esta
// repartido entre varias lineas del fichero de datos, que es lo que
// pasa siempre que hay que quitar un ideograma de un texto largo: el
// texto partido con `+` hace que un buscar-y-reemplazar de linea no
// pueda encontrarlo.
//
// Los numeros son los que da el editor, base 1.
//
//    scripts/lineas/70.txt
//    scripts/lineas/76.txt

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, ...numeros] = process.argv.slice(2);

const ruta = new URL(rutaRel, import.meta.url);
const dirLineas = new URL('./lineas/', import.meta.url);

const lineas = (await readFile(ruta, 'utf8')).split('\n');

for (const n of numeros) {
  const i = Number(n) - 1;

  const nueva = (await readFile(new URL(`${n}.txt`, dirLineas), 'utf8')).replace(/\n$/, '');

  console.log(`linea ${n} antes:\n${lineas[i]}\n`);
  console.log(`linea ${n} despues:\n${nueva}\n`);

  lineas[i] = nueva;
}

await writeFile(ruta, lineas.join('\n'), 'utf8');

console.log('escrito');