// Muestra la profundidad de llaves linea a linea en un rango.
//    node scripts/ver-profundidad.mjs <fichero> <desde> <hasta>

import { readFile } from 'node:fs/promises';

const [ruta, desde, hasta] = process.argv.slice(2);

const lineas = (await readFile(new URL(`../${ruta}`, import.meta.url), 'utf8')).split('\n');

let profundidad = 0;

for (const [i, linea] of lineas.entries()) {
  const limpio = linea
    .replace(/\\./g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/\/\/.*$/, '');

  const antes = profundidad;

  for (const c of limpio) {
    if ('{[('.includes(c)) profundidad++;
    if ('}])'.includes(c)) profundidad--;
  }

  const n = i + 1;

  if (n >= Number(desde) && n <= Number(hasta)) {
    console.log(
      `${String(n).padStart(4)}  ${String(profundidad).padStart(2)}  ` +
        (antes === profundidad ? '   ' : `${antes}->${profundidad} `) + '  ' + linea.slice(0, 70),
    );
  }
}