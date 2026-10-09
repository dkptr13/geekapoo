// Junta los lotes de etiquetas en el fichero de datos.
//    node scripts/generar-tags.mjs <prefijo>
//
// El tercero de la familia: `generar-personajes.mjs` para el reparto y
// `generar-capitulos.mjs` para los capitulos, los tres con el mismo
// motivo. Escribir las etiquetas a mano no es el problema, es que al
// escribir el fichero entero se cuelan barras verticales en las
// etiquetas y hay que cazarlas una a una.
//
// ── EL FORMATO ────────────────────────────────────────────────
//
// `personaje|etiqueta|etiqueta|etiqueta`, con el separador en vez de
// comas porque las etiquetas Spanish pueden llevar comas y el
// `JSON.stringify` de cada una las vuelve a meter.
//
// ── LA COMPROBACION ───────────────────────────────────────────
//
// Que ningun personaje salga dos veces y que las etiquetas no esten
// vacias. Lo que no comprueba es que el nombre exista en el fichero
// de reparto: eso lo pega un poco mas abajo el generador, que es
// quien tiene la lista delante.

import { readFile, writeFile } from 'node:fs/promises';

const prefijo = process.argv[2];

if (!prefijo) {
  console.error('  uso: node scripts/generar-tags.mjs <prefijo>');

  process.exit(1);
}

const cabecera = (
  await readFile(new URL(`lotes/cabecera-${prefijo}-tags.txt`, import.meta.url), 'utf8')
).replace(/\n+$/, '');

const lineas = (await readFile(new URL(`lotes/${prefijo}-tags.txt`, import.meta.url), 'utf8'))
  .split('\n')
  .filter((x) => x.trim() !== '');

if (lineas.length === 0) {
  console.error(`  lotes/${prefijo}-tags.txt esta vacio`);

  process.exit(1);
}

const vistos = new Set();
const filas = [];

for (const [i, linea] of lineas.entries()) {
  const [personaje, ...etiquetas] = linea.split('|');

  if (!personaje) {
    console.error(`  L${i + 1}: no hay nombre de personaje`);

    process.exit(1);
  }

  if (vistos.has(personaje)) {
    console.error(`  L${i + 1}: "${personaje}" sale dos veces`);

    process.exit(1);
  }

  if (etiquetas.length === 0) {
    console.error(`  L${i + 1}: "${personaje}" no tiene etiquetas`);

    process.exit(1);
  }

  for (const e of etiquetas) {
    if (!e.trim()) {
      console.error(`  L${i + 1}: "${personaje}" tiene una etiqueta vacia`);

      process.exit(1);
    }

    if (e.length > 40) {
      console.error(`  L${i + 1}: "${personaje}" tiene una etiqueta de ${e.length} caracteres, el maximo es 40`);

      process.exit(1);
    }
  }

  vistos.add(personaje);
  filas.push([personaje, etiquetas]);
}

// Que los nombres de las etiquetas sean los mismos que los del reparto.
// Sin esta comprobacion, una etiqueta mal escrita se queda en el
// fichero sin que nada avise: la wiki no la pinta y no hay error.
try {
  const { PERSONAJES } = await import(new URL(`datos/${prefijo}-personajes.mjs`, import.meta.url));
  const enElReparto = new Set(PERSONAJES.map((p) => p[0]));
  const sueltas = [...vistos].filter((n) => !enElReparto.has(n));
  const sinEtiqueta = PERSONAJES.map((p) => p[0]).filter((n) => !vistos.has(n));

  if (sueltas.length) {
    console.error(`  etiquetas de personajes que no estan en el reparto: ${sueltas.join(', ')}`);

    process.exit(1);
  }

  if (sinEtiqueta.length) {
    console.error(`  personajes del reparto sin etiquetas: ${sinEtiqueta.join(', ')}`);

    process.exit(1);
  }
} catch (e) {
  console.error(`  no se puede comprobar contra el reparto: ${e.message}`);

  process.exit(1);
}

const cuerpo = filas
  .map(([personaje, etiquetas]) => `  ${JSON.stringify(personaje)}: [${etiquetas.map((e) => JSON.stringify(e)).join(', ')}],`)
  .join('\n');

await writeFile(
  new URL(`datos/${prefijo}-tags.mjs`, import.meta.url),
  `${cabecera}\nexport const TAGS = {\n${cuerpo}\n};\n`,
  'utf8',
);

console.log(`  ${filas.length} personajes con etiquetas`);
console.log(`  ${filas.reduce((a, f) => a + f[1].length, 0)} etiquetas en total`);
console.log(`  escrito datos/${prefijo}-tags.mjs`);