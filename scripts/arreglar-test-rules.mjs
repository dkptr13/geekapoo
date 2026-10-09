// Arregla la linea de "test:rules" en package.json.
//
// Que la regla de las pruebas necesita el emulador de Storage, no solo
// el de Firestore: las reglas de Storage son otro lenguaje y el
// emulador de Firestore no las ejecuta. Sin ese emulador,
// `tests/storage.rules.test.cjs` falla al conectarse.
//
// ── POR QUE UN SCRIPT Y NO EDITAR A MANO ────────────────────────────
//
// El package.json tiene su propio formato (4 espacios, separador
// '":  "' con dos espacios) y un editor lo reformatea entero al
// guardarlo. Un JSON.stringify lo habria dejado en 2 espacios y habria
// tocado las once lineas del archivo para cambiar una.
//
// Este script busca la linea entera y la sustituye. Si despues el JSON
// no se puede leer, se para y lo dice, en vez de dejar el archivo roto.

// El valor que estamos buscando, tal cual queda escrito en el JSON:
// las comillas del comando de mocha van escapadas.
const BUSCADO = 'firebase emulators:exec --only firestore --project demo-geekapoo-reglas';

const SUSTITUTO = 'firebase emulators:exec --only firestore,storage --project demo-geekapoo-reglas';

import { readFile, writeFile } from 'node:fs/promises';

const RUTA = 'package.json';

const antes = await readFile(RUTA, 'utf8');

const lineas = antes.split('\n');

let cambiadas = 0;

const despues = lineas.map((linea) => {
  if (!linea.includes('"test:rules"')) return linea;

  if (!linea.includes(BUSCADO)) {
    console.log(`  ya estaba cambiada: ${linea.trim().slice(0, 70)}...`);

    return linea;
  }

  cambiadas++;

  return linea.replace(BUSCADO, SUSTITUTO);
});

if (!cambiadas) {
  console.error('  no encuentro el script de pruebas o ya estaba cambiado');

  process.exit(1);
}

await writeFile(RUTA, despues.join('\n'), 'utf8');

// La comprobacion que importa: que el JSON siga siendo valido.
JSON.parse(await readFile(RUTA, 'utf8'));

const nuevo = JSON.parse(await readFile(RUTA, 'utf8'));

console.log(`${cambiadas} linea cambiada`);
console.log('  ' + nuevo.scripts['test:rules'].slice(0, 96));
console.log('\nel JSON sigue siendo valido');