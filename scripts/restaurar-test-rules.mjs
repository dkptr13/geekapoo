// Restaura la linea de "test:rules" en package.json.
//
// Lo que hace falta: la version que se escribio antes dejo la linea
// partida en dos, con un fragmento de mas al final. Este script quita
// ese fragmento y deja el valor entero.
//
//   --timeout 60000""mocha ...  ->  --timeout 60000"

import { readFile, writeFile } from 'node:fs/promises';

const RUTA = 'package.json';

const texto = await readFile(RUTA, 'utf8');

const lineas = texto.split('\n');

const cambiadas = lineas.map((linea) => {
  if (!linea.includes('"test:rules"')) return linea;

  // Se busca el final del valor: la ultima comilla antes de la coma.
  // En este archivo el valor acaba en --timeout 60000\" y despues viene
  // la coma de la propiedad.
  return linea.replace(/--timeout 60000\\*"[\s\S]*?"\s*,?\s*$/, '--timeout 60000\\"",');
});

await writeFile(RUTA, cambiadas.join('\n'), 'utf8');

const despues = JSON.parse(await readFile(RUTA, 'utf8'));

console.log('el JSON es valido');
console.log('');
console.log(despues.scripts['test:rules']);