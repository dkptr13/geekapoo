// Borra una linea de un fichero.
//    node scripts/borrar-linea.mjs <fichero> <numero>
//
// Para deshacer un cambio que ha duplicado una linea. Solo borra una y
// avisa de lo que ha borrado, para no tener que volver a abrir el
// fichero a mirar que se ha llevado por delante lo de al lado.

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, numero] = process.argv.slice(2);

if (!rutaRel || !numero) {
  console.error('  uso: node scripts/borrar-linea.mjs <fichero> <numero>');

  process.exit(1);
}

const ruta = new URL(rutaRel, import.meta.url);
const lineas = (await readFile(ruta, 'utf8')).split('\n');

const n = Number(numero);

if (!Number.isInteger(n) || n < 1 || n > lineas.length) {
  console.error(`  la linea ${numero} no existe`);

  process.exit(1);
}

const borrada = lineas[n - 1];

await writeFile(ruta, [...lineas.slice(0, n - 1), ...lineas.slice(n)].join('\n'), 'utf8');

console.log(`  borrada la ${n}: ${borrada.trim().slice(0, 70)}`);
