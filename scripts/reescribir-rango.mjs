// Reescribe un rango de lineas de un fichero de datos.
//    node scripts/reescribir-rango.mjs <fichero> <desde> <hasta> <fichero-nuevo>
//
// El rango se sustituye por el contenido del fichero nuevo, que puede
// tener un numero de lineas distinto. Hace falta cuando un bloque ha
// quedado partido: los textos largos van con `+` al final de cada linea,
// y basta con que una de esas uniones se pierda para que el fichero
// deje de parsear, con el sintoma de que el error apunta a una linea que
// no tiene nada de malo.
//
// Los numeros son los que da el editor, base 1, e incluyen la primera y
// la ultima.

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, desde, hasta, nuevoRel] = process.argv.slice(2);

if (!rutaRel || !desde || !hasta || !nuevoRel) {
  console.error('  uso: node scripts/reescribir-rango.mjs <fichero> <desde> <hasta> <nuevo>');
  process.exit(1);
}

const ruta = new URL(rutaRel, import.meta.url);
const nuevo = new URL(nuevoRel, import.meta.url);

const lineas = (await readFile(ruta, 'utf8')).split('\n');
const sustituto = (await readFile(nuevo, 'utf8')).replace(/\n$/, '').split('\n');

const a = Number(desde) - 1;
const b = Number(hasta);

console.log(`sustituyendo las lineas ${desde}-${hasta} (${b - a}) por ${sustituto.length}`);

const resultado = [...lineas.slice(0, a), ...sustituto, ...lineas.slice(b)];

await writeFile(ruta, resultado.join('\n'), 'utf8');

console.log('escrito');