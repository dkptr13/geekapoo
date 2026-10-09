// Dice en que linea se descuadran las llaves de un fichero.
//    node scripts/ver-llaves.mjs <fichero>
//
// Cuando un cambio por rangos se come una llave de cierre, el error que
// da Node es "Unexpected end of input" en la ultima linea, que no dice
// nada de donde esta el problema de verdad. Este va contando la
// profundidad y enseña solo los puntos en los que vuelve a cero, que es
// donde deberia estar el cierre de cada bloque de primer nivel.

import { readFile } from 'node:fs/promises';

const ruta = process.argv[2];

if (!ruta) {
  console.error('  uso: node scripts/ver-llaves.mjs <fichero>');
  process.exit(1);
}

const lineas = (await readFile(new URL(`../${ruta}`, import.meta.url), 'utf8')).split('\n');

let profundidad = 0;

for (const [i, linea] of lineas.entries()) {
  // Se quitan cadenas y comentarios para no contar las llaves de dentro.
  const limpio = linea
    .replace(/\\./g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/\/\/.*$/, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const antes = profundidad;

  for (const c of limpio) {
    if (c === '{' || c === '[' || c === '(') profundidad++;
    if (c === '}' || c === ']' || c === ')') profundidad--;
  }

  if (profundidad < 0) {
    console.log(`linea ${i + 1}: se pasa de 0 a ${profundidad}, sobra un cierre`);
    process.exit(1);
  }

  if (antes > 0 && profundidad === 0 && /^\S/.test(linea)) {
    console.log(`linea ${i + 1}: vuelve a 0  ${linea.slice(0, 60)}`);
  }
}

console.log(`\n${lineas.length} lineas, profundidad final: ${profundidad}`);

if (profundidad !== 0) console.log(`\nfaltan ${profundidad} cierres`);