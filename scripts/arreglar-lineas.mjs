// Cambia lineas sueltas de un fichero, una a una.
//    node scripts/arreglar-lineas.mjs <fichero> <fichero-de-instrucciones>
//
// El fichero de instrucciones lleva una linea por cambio, con el
// formato:
//
//    NUMERO<TAB o |><texto nuevo>
//
// El numero es el que da el editor, base 1. Sirve para arreglar las
// palabras que se cuelan al escribir un fichero largo, que aparecen
// siempre en las mismas lineas y donde buscar una por una es eterno.
//
// Se aplica sobre el contenido ya leido y se escribe una sola vez, de
// modo que los numeros se refieren al fichero tal y como estaba antes
// del cambio y no van Saltando al corregirse.
//
// Los numeros van en orden pero no hace falta: da igual el orden en
// que se apliquen porque cada uno toca su linea y no la de al lado.

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, ordenesRel] = process.argv.slice(2);

if (!rutaRel || !ordenesRel) {
  console.error('  uso: node scripts/arreglar-lineas.mjs <fichero> <instrucciones>');

  process.exit(1);
}

const ruta = new URL(rutaRel, import.meta.url);
const ordenesUrl = new URL(ordenesRel, import.meta.url);

const lineas = (await readFile(ruta, 'utf8')).split('\n');
const ordenes = (await readFile(ordenesUrl, 'utf8')).split('\n');

const cambios = [];

let hechos = 0;
const sinHacer = [];

// Se mira TODO antes de escribir nada.
//
// Antes se aplicaba cada cambio y se escribia al final, así que un
// fichero de instrucciones con una línea sin su número —un comentario
// suelto, una línea en blanco, un separador— aplicaba las primeras y
// dejaba esas cuatro. Y como las líneas se cuentan desde arriba, lo que
// se rompía no era donde apuntaba la línea mala sino otra zona del
// fichero, a cuatrocientas líneas de distancia y sin relación ninguna.
//
// Por eso ahora: o se entiende el fichero de instrucciones entero, o no
// se toca el destino.
for (const orden of ordenes) {
  if (!orden.trim()) continue;

  const corte = orden.search(/[|]/);
  const numero = Number(orden.slice(0, corte));
  const texto = orden.slice(corte + 1);

  if (!Number.isInteger(numero) || numero < 1 || numero > lineas.length) {
    sinHacer.push(`"${orden.slice(0, 40)}": numero fuera de rango`);

    continue;
  }

  cambios.push({ numero, texto });
}

if (sinHacer.length > 0) {
  console.error('  el fichero de instrucciones tiene lineas sin numero:');
  console.error('  no se ha tocado nada. Cada linea debe ser "NUMERO|texto".');
  console.error('');

  for (const m of sinHacer) console.error(`    ${m}`);

  process.exit(1);
}

for (const { numero, texto } of cambios) {
  if (lineas[numero - 1] === texto) continue;

  lineas[numero - 1] = texto;
  hechos++;
}

await writeFile(ruta, lineas.join('\n'), 'utf8');

console.log(`  ${hechos} lineas cambiadas`);
