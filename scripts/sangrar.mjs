// Reindenta una linea a un numero de espacios, sin pasar por el shell.
//
//   node scripts/sangrar.mjs <fichero> <numero> <espacios>
//
// Existe porque en PowerShell los argumentos con comillas dobles se
// pierden: al escribir una linea de JSX con className="..." desde la
// linea de comandos, lo que llega al script es className=..., y el
// fichero se queda con JSX invalido. Un fichero con la linea entera
// dentro esquiva el shell por completo.
//
//   node scripts/sangrar.mjs ../src/components/x.tsx 320 14

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

const [rutaRel, numeroTxt, espaciosTxt] = process.argv.slice(2);

if (!rutaRel || !numeroTxt) {
  console.error('  uso: node scripts/sangrar.mjs <fichero> <numero> [espacios]');

  process.exit(1);
}

const ruta = resolve(AQUI, '..', rutaRel);
const numero = Number(numeroTxt);
const espacios = ' '.repeat(Number(espaciosTxt ?? 0));

const lineas = (await readFile(ruta, 'utf8')).split('\n');

if (numero < 1 || numero > lineas.length) {
  console.error(`  la línea ${numero} no existe (el fichero tiene ${lineas.length})`);

  process.exit(1);
}

const antes = lineas[numero - 1];

lineas[numero - 1] = espacios + antes.trim();

await writeFile(ruta, lineas.join('\n'));

console.log(`  L${numero}: ${JSON.stringify(lineas[numero - 1])}`);