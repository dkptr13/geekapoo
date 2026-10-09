// Cambia una linea de un fichero por otra, escribiendo el par en un
// fichero aparte para no pelearse con las comillas de PowerShell.
//    node scripts/poner-linea.mjs <fichero> <numero> <texto>
//
// Existe porque escribir `node -e "...\n..."` desde PowerShell parte la
// cadena en puntos suspensivos que no son del texto, y el fichero que
// se acaba escribiendo no es el que se queria. Un argumento por
// fichero y sin comillas dentro no tiene ese problema.

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, numero, ...resto] = process.argv.slice(2);
const texto = resto.join(' ');

if (!rutaRel || !numero || !texto) {
  console.error('  uso: node scripts/poner-linea.mjs <fichero> <numero> <texto>');

  process.exit(1);
}

const ruta = new URL(rutaRel, import.meta.url);
const lineas = (await readFile(ruta, 'utf8')).split('\n');
const n = Number(numero);

if (!Number.isInteger(n) || n < 1 || n > lineas.length) {
  console.error(`  la linea ${numero} no existe`);

  process.exit(1);
}

lineas[n - 1] = texto;

await writeFile(ruta, lineas.join('\n'), 'utf8');

console.log(`  L${n}: ${texto.slice(0, 70)}`);
