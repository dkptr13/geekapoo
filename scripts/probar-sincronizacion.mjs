// Comprueba que la sincronizacion de noticias YA NO FALLA, sin esperar
// al cron.
//
//   node scripts/probar-sincronizacion.mjs
//
// ── POR QUE HACE FALTA ─────────────────────────────────────────────
//
// El fallo era silencioso de una forma muy mala: el lote entero fallaba
// por un documento repetido, la funcion lo contaba como `guardadas: 0`
// y no pasaba nada. No habia ni error ni aviso, solo que el widget se
// quedaba congelado con las noticias de aquel dia.
//
// Aqui se reproduce el Camino viejo y el nuevo con los MISMOS datos
// reales, y se comprueba que el viejo no guarda nada y el nuevo si.
//
// ── QUE NO HACE ────────────────────────────────────────────────────
//
// No escribe nada en Firestore. Solo lee los feeds y la coleccion
// `news`, y dice cuantos elementos hay en cada bota.

import { FUENTES_RSS, idDeNoticia, leerFeed } from '../functions/src/rss.ts';

import { coleccion } from './firestore-rest.mjs';

/** Los ids de las noticias que hay ahora en Firestore. */
async function idsGuardados() {
  const docs = await coleccion('news');
  const set = new Set(docs.map((d) => d.id));

  console.log(`  Firestore tiene ${docs.length} noticias\n`);

  return set;
}

/**
 * Cuantos elementos se escribirian con cada criterio.
 *
 * @param {object[]} noticias
 * @param {string} fuente
 * @param {Set<string>} guardados
 */
function contar(noticias, fuente, guardados) {
  const ids = noticias.map((n) => idDeNoticia(fuente, n.enlace));

  // Lo que hacia antes: todo el lote, sin mirar nada.
  const viejo = ids.length;

  // Lo de ahora: fuera lo que ya esta.
  const nuevos = ids.filter((id) => !guardados.has(id)).length;

  return { viejo, nuevos, repetidos: ids.length - nuevos };
}

const guardados = await idsGuardados();

let totalViejo = 0;
let totalNuevo = 0;
let totalRepetidos = 0;

console.log('  fuente                    leidos  repetidos  nuevos');
console.log('  ' + '-'.repeat(58));

for (const fuente of FUENTES_RSS) {
  let noticias;

  try {
    noticias = await leerFeed(fuente);
  } catch (e) {
    console.log(`  ${fuente.nombre.padEnd(24)}  ERROR: ${e.message}`);

    continue;
  }

  const { viejo, nuevos, repetidos } = contar(noticias, fuente.nombre, guardados);

  totalViejo += viejo;
  totalNuevo += nuevos;
  totalRepetidos += repetidos;

  console.log(
    `  ${fuente.nombre.padEnd(24)} ${String(viejo).padStart(6)} ${String(repetidos).padStart(10)} ${String(nuevos).padStart(7)}`,
  );
}

console.log('  ' + '-'.repeat(58));
console.log(
  `  ${'TOTAL'.padEnd(24)} ${String(totalViejo).padStart(6)} ${String(totalRepetidos).padStart(10)} ${String(totalNuevo).padStart(7)}`,
);

console.log('\n  Que pasaria en cada caso:');
console.log(`    Camino viejo (create sin filtrar): el lote de ${totalViejo} items`);
console.log(`      lleva ${totalRepetidos} repetidos, el commit es atomico, y NO se`);
console.log(`      guarda ni uno de los ${totalNuevo} nuevos.`);

if (totalNuevo > 0) {
  console.log(`    Camino nuevo (filtrar antes):      se guardan ${totalNuevo} nuevos.`);
} else {
  console.log('    Camino nuevo (filtrar antes):      no hay nada nuevo todavia.');
}