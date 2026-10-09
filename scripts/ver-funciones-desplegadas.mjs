// Mira cuando se desplego cada funcion de verdad, en vez de fiarse del
// mensaje del comando.
//
//   firebase functions:list --json > lista-funciones.json
//   node scripts/ver-funciones-desplegadas.mjs lista-funciones.json
//
// ── POR QUE HACE FALTA ─────────────────────────────────────────────
//
// Porque `firebase deploy --only functions` puede imprimir un monton de
// "Successful update operation" y aun asi dejar UNA funcion sin subir. Es
// lo que paso con `concederMedalla`: Cloud Run se quedo sin aprovisionar
// ("Resource readiness deadline exceeded"), el comando devolvio error, y
// las otras 17 si que se actualizaron.
//
// El mensaje de exito del comando no es una garantia. Esto si.
//
// ── DE DONDE SALE LA FECHA ─────────────────────────────────────────
//
// Del campo `source.storageSource.generation`, que es un numero de
// generacion del objeto del zip en Cloud Storage. Cambia con cada
// despliegue, asi que sirve de marca: si dos funciones tienen generaciones
// muy distintas, es que una se ha subido y la otra no.
//
// Las funciones programadas y las que son trigger tienen ese campo. Las
// de tipo http tambien, pero conviene mirarlo, porque no todas lo
// declaran igual.

import { readFile } from 'node:fs/promises';

const ruta = process.argv[2] ?? 'lista-funciones.json';

const crudo = await readFile(ruta, 'utf8');
const datos = JSON.parse(crudo.replace(/^﻿/, ''));
const lista = datos.result ?? datos.functions ?? [];

const idDe = (f) => f.id ?? String(f.name ?? '').split('/').pop();

const generacionDe = (f) => {
  const g = f.source?.storageSource?.generation;

  return g === undefined || g === null ? null : Number(g);
};

/** Los milisegundos de la generacion, para poder ordenarla. */
const fechaDe = (f) => {
  const g = generacionDe(f);

  // El numero viene en microsegundos. Con solo los 13 primeros digitos
  // ya sale una fecha legible, y no da problemas con el limite de
  // precision de los enteros de JavaScript.
  return g === null ? null : Math.floor(g / 1000);
};

const filas = lista
  .map((f) => ({
    nombre: idDe(f),
    region: f.region ?? '?',
    estado: f.state ?? 'desconocido',
    ms: fechaDe(f),
    sinFecha: generacionDe(f) === null,
  }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre));

console.log(`  ${filas.length} funciones\n`);
console.log('  ' + 'funcion'.padEnd(26) + 'region'.padEnd(18) + 'estado'.padEnd(12) + 'subida');
console.log('  ' + '-'.repeat(76));

const formato = (ms) => (ms === null ? '(sin fecha)' : new Date(ms).toISOString().slice(0, 19).replace('T', ' '));

for (const f of filas) {
  const mala = /FAILED|ERROR|DEPLOY_IN_PROGRESS/i.test(f.estado);

  console.log(
    `  ${f.nombre.padEnd(26)}${f.region.padEnd(18)}` +
      `${(mala ? 'FALLIDA' : f.estado).padEnd(12)}${formato(f.ms)}`,
  );
}

// ── QUE ESTEN TODAS EN LA MISMA OLEADA ────────────────────────────
//
// Si el despliegue funciono entero, todas se subi a la vez y las
// generaciones caen muy juntas. Una generacionmucho mas antigua que
// las demas es la senal de que esa funcion se quedo atras.
const conFecha = filas.filter((f) => f.ms !== null);

if (conFecha.length < 2) {
  console.log('\n  No hay suficientes fechas para comparar oleadas.');
  process.exit(0);
}

const minima = Math.min(...conFecha.map((f) => f.ms));
const maxima = Math.max(...conFecha.map((f) => f.ms));

// Media hora de margen: una actualizacion tarda unos minutos por
// funcion, pero todas salen del mismo zip.
const MARGEN = 30 * 60 * 1000;
const atrasadas = conFecha.filter((f) => maxima - f.ms > MARGEN);

console.log('');
console.log(`  Ventana de despliegue: ${formato(minima)} - ${formato(maxima)}`);

if (atrasadas.length) {
  console.log(`\n  ATENCION: ${atrasadas.length} se han quedado atras:`);

  for (const f of atrasadas) console.log(`    - ${f.nombre} (${formato(f.ms)})`);

  console.log('\n  Vuelve a desplegar solo esas, uno a cada vez:');
  console.log('    firebase deploy --only functions:<nombre>');

  process.exit(1);
}

const sinFecha = filas.filter((f) => f.sinFecha);

if (sinFecha.length) {
  console.log(`  ${sinFecha.length} sin fecha de generacion: ${sinFecha.map((f) => f.nombre).join(', ')}`);
}

console.log('  Todas en la misma oleada: despliegue completo.');