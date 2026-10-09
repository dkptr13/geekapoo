// Arregla un fichero de datos sin reescribirlo entero.
//
//    node scripts/arreglar-fichero.mjs <datos/xxx.mjs> <cambio1> <cambio2> ...
//
// Cada cambio es un par separado por `=`: lo que hay antes, y lo que
// tiene que poner.
//
//     node scripts/arreglar-fichero.mjs datos/gbd-t1.mjs "viejo=nuevo"
//
// Se cambia por linea y no con un buscar-y-reemplazar global, porque lo
// que hay que arreglar suele ser un trozo corto dentro de un texto
// largo, y asi no se tocan las demas apariciones.
//
// El motivo de que exista este script: al escribir ficheros largos a
// mano se cuelan ideogramas, cirilico y palabras en otro idioma dentro
// del texto. Buscar el trozo bueno en el fichero no sirve, porque el
// fichero no lo tiene. Cambiar por linea si.

import { readFile, writeFile } from 'node:fs/promises';

const [rutaRel, ...cambios] = process.argv.slice(2);

if (!rutaRel || !cambios.length) {
  console.error('  uso: node scripts/arreglar-fichero.mjs <fichero> <viejo=nuevo> ...');
  process.exit(1);
}

// Las rutas son relativas a `scripts/`, que es donde estan los datos.
const ruta = new URL(rutaRel, import.meta.url);

// Al pasar a expresion regular hay que escapar los caracteres que
// tienen sentido: el punto de una abreviatura, los parentesis de una
// nota al pie y el interrogante de un titulo.
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let lineas = (await readFile(ruta, 'utf8')).split('\n');

let hechos = 0;
let fallados = 0;

for (const cambio of cambios) {
  const corte = cambio.indexOf('=');

  if (corte < 1) {
    console.log(`  cambio sin "=":\n    ${cambio}`);
    fallados++;
    continue;
  }

  const viejo = cambio.slice(0, corte);
  const nuevo = cambio.slice(corte + 1);

  // Un `*` en lo que se busca lo convierte en expresion regular, y vale
  // por "cualquier cosa". Es lo que se usa cuando el trozo a arreglar
  // tiene un caracter que no se puede escribir a mano (un ideograma
  // colado, por ejemplo) y no se sabe bien cual es: `ya* con todo` lo
  // encuentra sin nombrarlo.
  // Un `*` es "cualquier cosa", pero al final de la linea no puede
  // comerse el cierre del string de JavaScript, que es lo que rompia el
  // fichero. Por eso el ultimo `*` no puede pasar de una comilla.
  const partes = viejo.split('*').map(escapar);

  if (viejo.endsWith('*')) partes[partes.length - 1] += "[^']*$";

  const re = viejo.includes('*') ? new RegExp(partes.join('.*'), 'u') : null;

  let n = 0;

  lineas = lineas.map((l) => {
    if (re) {
      if (!re.test(l)) return l;
      n++;
      return l.replace(re, nuevo);
    }

    if (!l.includes(viejo)) return l;
    n++;
    return l.replace(viejo, nuevo);
  });

  if (n === 0) {
    console.log(`  NO ENCONTRADO: ${viejo.slice(0, 50)}`);
    fallados++;
    continue;
  }

  console.log(`  ${n} linea(s): ${viejo.slice(0, 40)}`);
  hechos += n;
}

await writeFile(ruta, lineas.join('\n'), 'utf8');

console.log(`\n${hechos} cambios hechos, ${fallados} sin hacer`);