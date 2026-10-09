// Busca texto que no sea espanol en los ficheros de datos.
//    node scripts/revisar-ingles.mjs <fichero> [<fichero> ...]
//
// `comprobar-datos.mjs` busca una lista corta de palabras inglesas para
// pillar un fragmento de traduccion pegado sin querer. Esa lista es
// corta a proposito, porque cada palabra anadida salta con alguna
// palabra espanola que se le parece.
//
// Aqui se mira otra cosa: palabras inglesas que no estan en esa lista y
// que tampoco son espanolas, que es como se cuelan las que se han
// colado al escribir ("TOK" en vez de "bar", "imama" en vez de
// "entrena", "anticipate" en vez de "previsto"). Es un aviso, no un
// fallo: el que decide es el que lee.
//
// Lo que NO comprueba, y no puede, es que una frase signifique algo.
// Eso solo se sabe leyendo.

import { readFile } from 'node:fs/promises';

const ficheros = process.argv.slice(2);

if (ficheros.length === 0) {
  console.error('  uso: node scripts/revisar-ingles.mjs <fichero> [<fichero> ...]');

  process.exit(1);
}

/**
 * Palabras que no son espanol y no estan en la lista corta.
 *
 * Casi todas se han colado alguna vez al escribir estos ficheros. Las
 * que estan pegadas a otra letra ("unTOK", "imama") se buscan aparte,
 * porque un limite de palabra las dejaria pasar.
 */
const PALABRAS = [
  'deaths', 'reganadillos', 'consortium', 'anglesa', 'imama',
  'anticipate', 'changed', 'deman', 'se财政', 'know', 'have',
  'this', 'that', 'with', 'from', 'and', 'the', 'she', 'him', 'his',
  'they', 'them', 'her', 'were', 'been', 'will', 'would', 'could',
];

/** Las que se cuelan pegadas a otra palabra, sin espacio alrededor. */
const PEGADAS = ['tok'];

/** Sin acentos y en minusculas, para comparar de verdad. */
const normalizar = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** `\b` no vale con letras acentuadas ni con japones, y aqui hay de las dos. */
const comoPalabra = (p) => `(?<![\\p{L}\\p{N}])${p}(?![\\p{L}\\p{N}])`;

for (const f of ficheros) {
  const lineas = (await readFile(new URL(f, import.meta.url), 'utf8')).split('\n');
  const hallazgos = [];

  lineas.forEach((x, i) => {
    // Las lineas con kana se dejan: ahi hay japones escrito a mano, y
    // puede llevar lo que quiera sin que sea un fallo.
    if (/[\u3040-\u30ff]/.test(x)) return;

    // Los comentarios explican decisiones, y a veces hay que citar la
    // palabra inglesa que se esta corrigiendo. Solo se mira el codigo.
    const esComentario = /^\s*(\/\/|\*|\/\*)/.test(x);

    if (esComentario) return;

    const limpia = normalizar(x);

    for (const p of [...PALABRAS, ...PEGADAS]) {
      if (new RegExp(comoPalabra(p), 'u').test(limpia)) {
        hallazgos.push(`  L${i + 1}  "${p}"  ->  ${x.trim().slice(0, 84)}`);

        return;
      }
    }
  });

  if (hallazgos.length > 0) {
    console.log(`\n  ${f}`);

    for (const h of hallazgos) console.log(h);
  }
}

console.log('\n  esto es un aviso, no un fallo: hay que leerlo');
