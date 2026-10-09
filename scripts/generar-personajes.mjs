// Junta los lotes de personajes en el fichero de datos.
//    node scripts/generar-personajes.mjs <prefijo>
//
// ── POR QUE EXISTE ───────────────────────────────────────────
//
// Los ficheros de datos se escriben con la herramienta de edicion, y
// esa herramienta destroza la prosa larga: mete barras verticales
// dentro de las palabras y cambia unas por otras. Con veinte lineas se
// puede arreglar a mano. Con cuarenta, ya no.
//
// Asi que el reparto se escribe en trozos de seis personajes, cada uno
// en su propio fichero de `lotes/`, y este script los junta. Un trozo
// danado se reescribe entero, que son seis lineas, no cuarenta.
//
// Los lotes son un fichero de texto y no de JavaScript: no se ejecutan,
// no tienen comillas que escapar y no pueden romper la sintaxis. El
// formato de cada linea es:
//
//    nombre|temporadas|rol|japones|voz|descripcion
//
// El separador es `|` porque no aparece ni en los nombres ni en las
// descripciones, y porque no es un caracter que se pueda colar sin que
// se note. Si una descripcion lo trae, el script avisa en vez de
// inventarse un campo.
//
// ── LO QUE NO HACE ────────────────────────────────────────────
//
// No comprueba que los datos sean ciertos: eso es de `comprobar-datos`
// y de las fuentes. Aqui solo se comprueba la forma.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';

const prefijo = process.argv[2];

// Segundo argumento opcional: el nombre del fichero de cabecera.
//
// Por defecto es `cabecera.txt`, el que usaba Chainsaw Man. Cada
// anime tiene su propio reparto y su propia cabecera, asi que a partir
// del segundo se pasa la suya:
//
//   node scripts/generar-personajes.mjs tak cabecera-tak-personajes.txt
//
// Antes la cabecera era siempre la misma, y solo servia para el primer
// anime que se hizo con este metodo. Los siguientes necesitan la suya:
// la de Takopi explica por que los cuatro padres de Marina se quedan
// fuera, y eso no lo puede decir una cabecera compartida.
const cabeceraNombre = process.argv[3] ?? 'cabecera.txt';

if (!prefijo) {
  console.error('  uso: node scripts/generar-personajes.mjs <prefijo> [<cabecera>]');

  process.exit(1);
}

const CARPETA = new URL(`lotes/${prefijo}/`, import.meta.url);
const SALIDA = new URL(`datos/${prefijo}-personajes.mjs`, import.meta.url);

let CABECERA;

try {
  CABECERA = await readFile(new URL(`lotes/${cabeceraNombre}`, import.meta.url), 'utf8');
} catch (e) {
  console.error(`  no se lee lotes/${cabeceraNombre}: ${e.message}`);

  process.exit(1);
}

let nombres;

try {
  nombres = (await readdir(CARPETA)).filter((n) => n.endsWith('.txt')).sort();
} catch {
  console.error(`  no hay la carpeta lotes/${prefijo}/`);

  process.exit(1);
}

if (nombres.length === 0) {
  console.error(`  lotes/${prefijo}/ esta vacia`);

  process.exit(1);
}

const filas = [];
const vistos = new Map();

for (const nombre of nombres) {
  const texto = await readFile(new URL(nombre, CARPETA), 'utf8');
  const lineas = texto.split('\n').filter((l) => l.trim() !== '');

  for (const [i, linea] of lineas.entries()) {
    const campos = linea.split('|');

    if (campos.length !== 6) {
      console.error(`  ${nombre} L${i + 1}: ${campos.length} campos, se esperaban 6`);
      console.error(`  ${JSON.stringify(linea.slice(0, 90))}`);

      process.exit(1);
    }

    const [personaje, temporadas, rol, japones, voz, desc] = campos;

    if (vistos.has(personaje)) {
      console.error(`  ${nombre} L${i + 1}: "${personaje}" sale dos veces (ya en ${vistos.get(personaje)})`);

      process.exit(1);
    }

    vistos.set(personaje, nombre);
    filas.push([personaje, temporadas, rol, japones, voz, desc]);
  }
}

// Los lotes van en orden de importance para la wiki, asi que se respeta
// el orden en que estan los ficheros y no se ordena nada aqui.

const cuerpo = filas
  .map(
    ([personaje, temporadas, rol, japones, voz, desc]) =>
      `  [${JSON.stringify(personaje)}, ${JSON.stringify(temporadas)}, ${JSON.stringify(rol)}, ` +
      `${JSON.stringify(japones)}, ${JSON.stringify(voz)},\n   ${JSON.stringify(desc)}],\n`,
  )
  .join('\n');

const final = `${CABECERA}\nexport const PERSONAJES = [\n${cuerpo}];\n`;

await mkdir(new URL('datos/', import.meta.url), { recursive: true });
await writeFile(SALIDA, final, 'utf8');

console.log(`  ${filas.length} personajes de ${nombres.length} lotes`);
console.log(`  escrito datos/${prefijo}-personajes.mjs`);

// Un resumen de lo que ha salido, que es lo primero que hay que mirar:
// si un personaje se ha quedado sin voz o con una descripcion de tres
// palabras, se ve aqui sin abrir el fichero.
const sinVoz = filas.filter((f) => f[4] === '');
const cortas = filas.filter((f) => f[5].length < 40);
const largas = filas.filter((f) => f[5].length > 400);

if (sinVoz.length) console.log(`  SIN VOZ: ${sinVoz.map((f) => f[0]).join(', ')}`);
if (cortas.length) console.log(`  DESCRIPCION CORTA: ${cortas.map((f) => `${f[0]} (${f[5].length})`).join(', ')}`);
if (largas.length) console.log(`  DESCRIPCION LARGA: ${largas.map((f) => `${f[0]} (${f[5].length})`).join(', ')}`);

if (!sinVoz.length && !cortas.length && !largas.length) console.log('  todas con voz y descripcion de 40 a 400 caracteres');