// Arregla el script de pruebas de logica si se ha quedado sin `tsx`.
//    node scripts/arreglar-prefijo-tsx.mjs
//
// `tsx` es lo que sabe ejecutar un `.ts` sin compilar. Si una entrada se
// anade sin el prefijo, Windows responde '"tests" no se reconoce como un
// comando', que no dice nada de la comprobacion que se pretendia
// ejecutar y parece un fallo del entorno.

import { readFile, writeFile } from 'node:fs/promises';

const RUTA = new URL('../package.json', import.meta.url);

const texto = await readFile(RUTA, 'utf8');

const Arreglado = texto.replace(/(^|&& )tests\/logica\./gm, '$1tsx tests/logica.');

if (Arreglado === texto) {
  console.log('  no habia ninguna entrada sin tsx');

  process.exit(0);
}

await writeFile(RUTA, Arreglado, 'utf8');

const despues = JSON.parse(await readFile(RUTA, 'utf8'));

const sinPrefijo = despues.scripts['test:logica']
  .split('&&')
  .map((p) => p.trim())
  .filter((p) => p.startsWith('tests/'));

if (sinPrefijo.length > 0) {
  console.error(`  siguen sin tsx: ${sinPrefijo.join(', ')}`);

  process.exit(1);
}

console.log('  prefijos tsx puestos');
console.log('  el JSON sigue siendo valido');
