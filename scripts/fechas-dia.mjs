// Las fechas en las que se emitio una serie, por el dia de la semana.
//    node scripts/fechas-dia.mjs <inicio> <fin> [dia] [saltar]
//    node scripts/fechas-dia.mjs 2008-10-02 2009-03-26 4 2009-01-01
//
// ── POR QUE HACE FALTA ──────────────────────────────────────────────
//
// Cuando la tabla de capitulos de la wiki no trae la fecha, hay dos
// caminos: fiarse de la que da IMDb, o deducirla del dia de emision que
// dice la ficha de la serie. Los dos fallan de forma distinta.
//
// IMDb da la fecha del previo por la tarde en Estados Unidos, que es uno
// o dos dias ANTES de la emision en Japon. En Toradora el primero es el
// 30 de septiembre de 2008 en IMDb y el 2 de octubre en Japon.
//
// TVDB da la fecha de la madrugada, que en Japon es el mismo dia por la
// tarde: el segmento de las 1:20 de un jueves pertenece a la madrugada
// del miercoles anterior. Toradora es uno de esos casos y por eso TVDB
// fecha los capitulos en dia habil.
//
// La ficha de la serie es la que dice de verdad cuando se emitio, asi
// que es la que se usa para generar la lista.
//
// ── EL SALTO ────────────────────────────────────────────────────────
//
// Una serie de，每周 no emite todos los dias de la semana: los jueves de
// Año Nuevo, el 1 de enero de 2009, no habia cadena. Sin el parametro
// de salto, la cuenta sale un capitulo corrida a partir de ahi.
//
//   node scripts/fechas-dia.mjs 2008-10-02 2009-03-26 4 2009-01-01

const inicio = process.argv[2] ?? '2008-10-02';
const fin = process.argv[3] ?? '2009-03-26';

// getDay: 0 domingo, 1 lunes ... 4 jueves.
const dia = Number(process.argv[4] ?? 4);

const saltos = new Set((process.argv[5] ?? '').split(',').filter(Boolean));

const NOMBRES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const iso = (d) => d.toISOString().slice(0, 10);

const salida = [];

for (let d = new Date(`${inicio}T00:00:00Z`); iso(d) <= fin; d.setUTCDate(d.getUTCDate() + 1)) {
  if (d.getUTCDay() !== dia) continue;

  const clave = iso(d);

  if (saltos.has(clave)) {
    console.log(`  (se salta ${clave}, ${NOMBRES[d.getUTCDay()]})`);

    continue;
  }

  salida.push(clave);
}

console.log(`\n${inicio} a ${fin}, ${NOMBRES[dia]}:`);
console.log(`${salida.length} capitulos\n`);

salida.forEach((f, i) => {
  const d = new Date(`${f}T00:00:00Z`);

  console.log(`${String(i + 1).padStart(3)}  ${f}  ${NOMBRES[d.getUTCDay()]}`);
});

if (salida.length) {
  console.log(`\nultimo: ${salida.at(-1)}   diferencia con el fin: ${fin} - ${salida.at(-1)}`);
}