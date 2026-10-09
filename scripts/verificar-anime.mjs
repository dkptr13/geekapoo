// Verifica la carga de un anime contra Firestore.
//
//   node scripts/verificar-anime.mjs <mt|aot|ysa>
//
// ── QUE COMPRUEBA Y POR QUE ────────────────────────────────
//
// Comprueba lo que un lector de la wiki va a ver, y sobre todo tres
// cosas que se rompen en silencio:
//
//   · Que cada personaje tenga las TEMPORADAS CORRECTAS. Un array
//     vacio significa "sale en todas" (ver `seasonIdsDe`), asi que
//     un personaje de la T1 al que se le pase el array equivocado
//     aparece en la ficha de la T3, donde no sale.
//
//   · Que ningun capitulo de television se quede sin nota. El cero
//     es lo que guarda el panel cuando no se ha rellenado, y en la
//     wiki se ve como "sin nota" en vez de como la nota de IMDb. Los
//     capitulos EXTRA si pueden quedarse en 0: no se emitieron nunca
//     y IMDb no los puntua.
//
//   · Que no haya dos capitulos con el mismo numero en una
//     temporada. Eso paso de verdad cuando un 15.5 se guardaba
//     redondeado a 16 y la temporada se quedaba con dos "16".
//
// Los datos salen de los mismos ficheros que usa `cargar-anime.mjs`,
// asi que lo que se compara es lo que se escribio contra lo que se
// iba a escribir. `comprobar-datos.mjs` comprueba los ficheros antes
// de la carga; este, despues.

import { tokenDeAcceso } from './token-firebase.mjs';

const prefijo = process.argv[2];

if (!prefijo || prefijo.startsWith('-')) {
  console.error('Uso: node scripts/verificar-anime.mjs <mt|aot|ysa|tg|agk>');
  process.exit(1);
}

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const base = new URL('./datos/', import.meta.url);
const { ANIME_ID, EPISODIOS_TOTAL, TEMPORADAS } = await import(
  new URL(`${prefijo}-meta.mjs`, base)
);
const { PERSONAJES } = await import(new URL(`${prefijo}-personajes.mjs`, base));

const CAPITULOS = {};
for (const t of TEMPORADAS) {
  const clave = t.capitulos;
  const modulo = await import(new URL(`${prefijo}-${clave.toLowerCase()}.mjs`, base));
  CAPITULOS[clave] = modulo[clave];
}

const idTemporada = (n) => `${ANIME_ID}-s${n}`;

const token = await tokenDeAcceso();
const headers = { Authorization: `Bearer ${token}` };

/** Todos los documentos de una coleccion, paginados. */
async function todos(col) {
  const fuera = [];
  let pagina = '';

  do {
    const r = await fetch(`${BASE}/${col}?pageSize=300${pagina}`, { headers });
    const j = await r.json();

    if (j.error) throw new Error(`${col}: ${JSON.stringify(j.error)}`);

    fuera.push(...(j.documents ?? []));
    pagina = j.nextPageToken ? `&pageToken=${encodeURIComponent(j.nextPageToken)}` : '';
  } while (pagina);

  return fuera;
}

const doc = async (col, id) => {
  const r = await fetch(`${BASE}/${col}/${id}`, { headers });
  return r.ok ? r.json() : null;
};

/**
 * El número de un episodio tal y como viene del REST.
 *
 * No se puede leer siempre de `integerValue`, porque un capítulo con
 * decimales (la OVA de Mushoku Tensei, el 15.5) llega como
 * `doubleValue`. Leer solo el entero daría `NaN` en ese capítulo, y
 * un `NaN` en las comprobaciones de orden no falla: compara falso y
 * pasa siempre.
 */
function numeroDe(d) {
  const n = d.fields.number;
  if (!n) return NaN;
  if (n.integerValue !== undefined) return Number(n.integerValue);
  if (n.doubleValue !== undefined) return n.doubleValue;
  return NaN;
}

/** El slug de un personaje, con el mismo criterio que el panel. */
const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// ──────────────────────────────────────────────────────────

const anime = await doc('animes', ANIME_ID);
const temporadas = (await todos('seasons')).filter((d) => d.fields.animeId?.stringValue === ANIME_ID);
const capitulos = (await todos('episodes')).filter((d) => d.fields.animeId?.stringValue === ANIME_ID);
const personajes = (await todos('characters')).filter((d) => d.fields.animeId?.stringValue === ANIME_ID);

const fallos = [];
const anota = (ok, mensaje) => {
  if (!ok) fallos.push(mensaje);
  return ok;
};

console.log(`  ${ANIME_ID}`);
console.log('');
console.log(`  Temporadas:  ${temporadas.length} de ${TEMPORADAS.length}`);
console.log(`  Capitulos:   ${capitulos.length} de ${EPISODIOS_TOTAL}`);
console.log(`  Personajes: ${personajes.length} de ${PERSONAJES.length}`);

// ── El anime ──────────────────────────────────────────────

anota(!!anime, 'el anime no existe');

if (anime) {
  const rating = anime.fields.rating?.doubleValue ?? 0;
  const cuenta = anime.fields.episodesCount?.integerValue ?? '0';

  console.log(`  Nota del anime (IMDb): ${rating}`);
  console.log(`  Capitulos en el anime: ${cuenta}`);

  anota(rating > 0, 'el anime no tiene nota');
  anota(
    Number(cuenta) === EPISODIOS_TOTAL,
    `el anime dice ${cuenta} capitulos y hay ${EPISODIOS_TOTAL}`,
  );
  anota(
    !!anime.fields.synopsis?.stringValue,
    'el anime se quedo sin sinopsis al actualizar la nota',
  );
}

// ── Temporadas ────────────────────────────────────────────

for (const t of TEMPORADAS) {
  const d = await doc('seasons', idTemporada(t.numero));
  anota(!!d, `falta la temporada ${t.numero}`);

  if (!d) continue;

  const esperados = CAPITULOS[t.capitulos].length;
  const guardados = Number(d.fields.episodesCount?.integerValue ?? -1);

  anota(
    guardados === esperados,
    `la temporada ${t.numero} dice ${guardados} capitulos y deberia decir ${esperados}`,
  );
  anota(!!d.fields.synopsis?.stringValue, `la temporada ${t.numero} se quedo sin sinopsis`);

  const nota = d.fields.rating?.doubleValue ?? 0;
  if (nota > 0) {
    console.log(`  Nota T${t.numero} (media de sus capitulos): ${nota}`);
  }
}

// ── Capitulos ──────────────────────────────────────────────

let sinNota = 0;
let sinFecha = 0;
let sinDescripcion = 0;

/**
 * La nota que el fichero de datos dice para cada capitulo.
 *
 * indexed por `${seasonId}|${numero}`.
 *
 * Hace falta para la comprobacion de las notas. Antes se deducía del
 * numero (un entero tiene que traer nota, un decimal es un extra sin
 * nota) y era incorrecto: los siete capitulos de "The Final Chapters"
 * son enteros y tampoco tienen nota, porque IMDb no los puntua por
 * separado sino los dos especiales de dos horas de los que salieron.
 *
 * Comparar contra el dato de origen no falla en ningun caso y no
 * necesita suponer nada sobre por que un capitulo no tiene nota.
 */
const notaEsperada = new Map();

for (const t of TEMPORADAS) {
  const sid = idTemporada(t.numero);

  for (const fila of CAPITULOS[t.capitulos]) {
    notaEsperada.set(`${sid}|${fila[0]}`, fila[4]);
  }
}

for (const cap of capitulos) {
  const numero = numeroDe(cap);
  const sid = cap.fields.seasonId?.stringValue;
  const guardada = cap.fields.rating?.doubleValue ?? 0;

  if (guardada <= 0) sinNota++;

  const esperada = notaEsperada.get(`${sid}|${numero}`);

  anota(
    esperada !== undefined,
    `el capitulo ${numero} de ${sid} no esta en los ficheros de datos`,
  );
  anota(
    esperada !== undefined && guardada === esperada,
    `capitulo ${numero} de ${sid}: nota ${guardada} y deberia ser ${esperada}`,
  );

  if (!cap.fields.airDate?.stringValue) sinFecha++;
  if (!cap.fields.description?.stringValue) sinDescripcion++;
  anota(!!sid, `capitulo ${numero} sin temporada`);
}

// Y al reves: ningun capitulo de los ficheros se ha quedado sin
// escribir. Un capitulo del fichero que no aparece en Firestore es un
// capitulo que el visitante no vera, y el recuento de "de 102" lo
// delata, pero el mensaje concreto ayuda mas.
const escritos = new Set(
  capitulos.map((c) => `${c.fields.seasonId?.stringValue}|${numeroDe(c)}`),
);

for (const clave of notaEsperada.keys()) {
  anota(escritos.has(clave), `el capitulo ${clave.split('|')[1]} de los datos no llego a Firestore`);
}

console.log(`  Capitulos con nota IMDb: ${capitulos.length - sinNota}/${capitulos.length}`);
console.log(`  Capitulos extra (sin nota en IMDb): ${sinNota}`);
anota(sinFecha === 0, `${sinFecha} capitulos sin fecha`);
anota(sinDescripcion === 0, `${sinDescripcion} capitulos sin descripcion`);

// El orden: dentro de cada temporada, los numeros tienen que ir en
// orden ASCENDENTE y sin repeticiones. Un hueco entre enteros no se
// comprueba a proposito, porque los extras ocupan justo eso: el hueco
// entre el 15 y el 16 lo ocupa el 15.5, y el hueco antes del 1 lo
// ocupa el 0.5 de "No Regrets".
for (const t of TEMPORADAS) {
  const sid = idTemporada(t.numero);
  const deLa = capitulos
    .filter((c) => c.fields.seasonId?.stringValue === sid)
    .map((c) => numeroDe(c))
    .sort((a, b) => a - b);

  for (let i = 1; i < deLa.length; i++) {
    if (deLa[i] === deLa[i - 1]) {
      anota(false, `la temporada ${t.numero} tiene dos capitulos ${deLa[i]}`);
      break;
    }
    if (deLa[i] < deLa[i - 1]) {
      anota(false, `la temporada ${t.numero} no sale en orden`);
      break;
    }
  }

  // Que el primer ENTERO sea el 1 y que el ultimo entero sea el total
  // de capitulos de television de la temporada.
  //
  // Lo del primero se comprueba sobre los enteros y no sobre la
  // lista entera a proposito: una temporada puede empezar por un 0.5,
  // que es un extra previo a toda la serie. Comprobar que el primer
  // numero sea 1 daria un fallo legitimo en cuanto hubiera un
  // precuela guardado.
  if (deLa.length > 0) {
    const enteros = deLa.filter((n) => Number.isInteger(n));

    if (enteros.length === 0) {
      anota(false, `la temporada ${t.numero} no tiene ningun capitulo entero`);
    } else {
      if (enteros[0] !== 1) {
        anota(false, `la temporada ${t.numero} empieza en el ${enteros[0]} y no en el 1`);
      }
      if (enteros[enteros.length - 1] !== enteros.length) {
        anota(
          false,
          `la temporada ${t.numero} tiene ${enteros.length} capitulos enteros y el ultimo es el ${enteros[enteros.length - 1]}`,
        );
      }
    }
  }
}

// ── Personajes: temporadas ────────────────────────────────
//
// Esta es la comprobacion que mas importa. El array `seasonIds`
// vacio significa "salen en todas", asi que un personaje de una
// sola temporada con el array equivocado apareceria en las otras dos
// sin que nada pareciera roto.

let malPuestos = 0;
const reparto = {};

for (const [nombre, temporada] of PERSONAJES) {
  const esperados = temporada === '' ? [] : temporada.split(',').map(Number);
  const idEsperados = esperados.map(idTemporada).sort();

  const d = await doc('characters', `${ANIME_ID}-${slugify(nombre)}`);

  if (!d) {
    malPuestos++;
    anota(false, `falta el personaje ${nombre}`);
    continue;
  }

  const guardados = (d.fields.seasonIds?.arrayValue?.values ?? []).map((v) => v.stringValue).sort();

  if (JSON.stringify(guardados) !== JSON.stringify(idEsperados)) {
    malPuestos++;
    anota(
      false,
      `${nombre}: temporadas ${JSON.stringify(guardados)} y deberian ser ${JSON.stringify(idEsperados)}`,
    );
  }

  const clave = temporada === '' ? 'compartido' : temporada;
  reparto[clave] = (reparto[clave] ?? 0) + 1;
}

console.log('');
console.log('  Reparto de personajes por temporadas:');
for (const [k, n] of Object.entries(reparto).sort()) {
  console.log(`    ${k.padEnd(14)} ${n}`);
}

if (malPuestos === 0) {
  console.log('');
  console.log('  Todos los personajes tienen las temporadas correctas.');
}

// ──────────────────────────────────────────────────────────

console.log('');

if (fallos.length === 0) {
  console.log('  TODO CORRECTO');
} else {
  console.log(`  ${fallos.length} FALLOS:`);
  for (const f of fallos) console.log(`    - ${f}`);
  process.exit(1);
}
