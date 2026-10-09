// Mira lo que devuelve cada fuente RSS configurada.
//    node scripts/probar-feeds.mjs
//
// Para cuando se añade una fuente nueva y hay que ver si funciona
// ANTES de desplegar. Es el mismo `leerFeed` que usa la Cloud Function,
// con el mismo recorte y los mismos filtros, así que lo que sale aquí
// es exactamente lo que se guardaría.
//
// Sin esto, probar una fuente nueva es desplegar, esperar a que pase
// su turno, mirar los registros y volver a desplegar. Y si la fuente
// está mal, ese es un ciclo de diez minutos por cada intento.
//
//   node scripts/probar-feeds.mjs            todas
//   node scripts/probar-feeds.mjs 2          solo la segunda

import { FUENTES_RSS, leerFeed, RESUMEN_MAX } from '../functions/src/rss.ts';

const cual = process.argv[2] ? Number(process.argv[2]) : null;

const fuentes = cual
  ? FUENTES_RSS.slice(cual - 1, cual)
  : FUENTES_RSS;

if (cual && fuentes.length === 0) {
  console.error(`  solo hay ${FUENTES_RSS.length} fuentes configuradas`);

  process.exit(1);
}

let algunaFalla = false;

for (const fuente of fuentes) {
  console.log('');
  console.log(`  ${fuente.nombre}`);
  console.log(`  ${fuente.url}`);
  console.log('  ' + '-'.repeat(60));

  let noticias;

  try {
    noticias = await leerFeed(fuente);
  } catch (e) {
    algunaFalla = true;
    console.log(`  FALLA: ${e instanceof Error ? e.message : e}`);
    console.log('');
    console.log('  Lo normal es una de estas tres cosas:');
    console.log('    · la direccion no lleva /feed/ y devuelve una pagina web');
    console.log('    · el sitio pide un navegador y no un lector de RSS');
    console.log('    · la direccion ha cambiado');

    continue;
  }

  console.log(`  ${noticias.length} noticias`);

  if (noticias.length === 0) {
    algunaFalla = true;
    console.log('  CERO noticias. O el feed esta vacio, o el parser no lo entiende.');
    console.log('  Esto casi siempre es una pagina HTML con la extension .xml.');

    continue;
  }

  // La más reciente primero, que es como se ordenan en el widget.
  const ordenadas = [...noticias].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  for (const n of ordenadas.slice(0, 3)) {
    console.log('');
    console.log(`    ${n.titulo}`);
    console.log(`      fuente: ${n.fuente}`);
    console.log(`      fecha:  ${n.fecha}`);
    console.log(`      resumen: ${n.resumen}`);
    console.log(`      ${n.resumen.length}/${RESUMEN_MAX} caracteres`);
    console.log(`      ${n.enlace}`);

    // Lo que en la tarjeta se vería raro, aquí se ve pronto.
    if (n.resumen.includes('<') || n.resumen.includes('&amp;')) {
      algunaFalla = true;
      console.log('      AVISO: el resumen parece que ha quedado con HTML');
    }
  }

  const laMasLarga = ordenadas.reduce((a, b) => (a.resumen.length > b.resumen.length ? a : b));

  console.log('');
  console.log(`  el resumen mas largo es de ${laMasLarga.resumen.length} de ${RESUMEN_MAX}`);

  if (laMasLarga.resumen.length < 40) {
    console.log('  AVISO: los resúmenes son muy cortos. El widget verá lineas de un solo renglón.');
  }
}

console.log('');

if (algunaFalla) {
  console.log('  hay cosas que revisar antes de desplegar');
  process.exit(1);
}

console.log('  todas las fuentes responden bien');
