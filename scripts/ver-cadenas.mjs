// Busca lineas con comillas o acentos graves descuadrados.
//    node scripts/ver-cadenas.mjs <fichero>
//
// Un `*` al final de un argumento de PowerShell, o un texto con
// caracteres raros, dejan cadenas sin cerrar. El sintoma es siempre el
// mismo y no dice nada util: "Unexpected end of input" en la ultima
// linea del fichero, aunque el problema este en la linea 200. Este
// ensena las lineas sospechosas.

import { readFile } from 'node:fs/promises';

const ruta = process.argv[2];

if (!ruta) {
  console.error('  uso: node scripts/ver-cadenas.mjs <fichero>');
  process.exit(1);
}

const lineas = (await readFile(new URL(`../${ruta}`, import.meta.url), 'utf8')).split('\n');

const contar = (linea, ch) => linea.split(ch).length - 1;

let raras = 0;

for (const [i, linea] of lineas.entries()) {
  // Los comentarios se ignoran: pueden tener comillas sueltas.
  const sinComentarios = linea.replace(/\/\/.*$/, '');

  const graves = contar(sinComentarios, '`');
  const simples = contar(sinComentarios, "'");
  const dobles = contar(sinComentarios, '"');

  if (graves % 2 !== 0) {
    console.log(`linea ${i + 1}: ${graves} acentos graves  ${linea.slice(0, 84)}`);
    raras++;
  }

  // Las comillas simples y dobles solo tienen que cuadrar cuando la
  // linea es una sentencia entera con una cadena; en codigo normal se
  // alternan y eso no se puede comprobar linea a linea.
  if (simples % 2 !== 0 && dobles % 2 === 0 && graves % 2 === 0) {
    console.log(`linea ${i + 1}: ${simples} comillas simples  ${linea.slice(0, 84)}`);
    raras++;
  }
}

console.log(`\n${lineas.length} lineas, ${raras} sospechosas`);