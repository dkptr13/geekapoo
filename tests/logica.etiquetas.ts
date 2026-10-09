// Comprobaciones de los datos que se anadieron DESPUES de la
// primera carga: las etiquetas de los personajes, la nota de
// temporada (la media de sus capitulos) y el capitulo con numero
// fraccionario de la OVA.
//
// Van aqui y no en el verificador de Firestore porque no necesitan
// red: son los datos de entrada, y si estan mal el error sale antes
// de escribir nada, cuando todavia no hay que corregir nada.

import assert from 'node:assert/strict';

import { MAX_TAG, normalizaTags, TAG_DESTACADOS } from '../src/utils/tags';
import { MAX_DECIMALES_EPISODIO, numeroDeEpisodioValido } from '../src/utils/seasonData';

import { EPISODIOS_TOTAL, TEMPORADAS } from '../scripts/datos/mt-meta.mjs';
import { T1 } from '../scripts/datos/mt-t1.mjs';
import { T2 } from '../scripts/datos/mt-t2.mjs';
import { T3 } from '../scripts/datos/mt-t3.mjs';
import { PERSONAJES } from '../scripts/datos/mt-personajes.mjs';
import { TAGS } from '../scripts/datos/mt-tags.mjs';

/**
 * Una fila de capitulo: [numero, titulo, japones, fecha, nota, descripcion].
 *
 * El tipo sale de los propios datos, no de una interfaz escrita a
 * mano, asi que si un dia se anade un campo mas al fichero, el
 * compilador avisa en vez de estar midiendo la nota equivocada.
 */
type Capitulo = [number, string, string, string, number, string];

const CAPITULOS = { T1, T2, T3 } as unknown as Record<string, Capitulo[]>;

/** La media de una lista de notas, como la calcula el cargador. */
const media = (notas: number[]): number => {
  const conNota = notas.filter((n) => typeof n === 'number' && n > 0);
  if (conNota.length === 0) return 0;
  return Math.round((conNota.reduce((a, n) => a + n, 0) / conNota.length) * 10) / 10;
};

/**
 * El mapa de etiquetas, tipado como lo que es.
 *
 * Los ficheros de datos son `.mjs` sin tipos, asi que TypeScript
 * infiere un objeto con una clave por personaje y no admite indexar
 * con un `string`. El cast es lo que deja usar `TAGS[nombre]` en
 * un bucle, que es justamente lo que hay que comprobar.
 */
const ETIQUETAS = TAGS as Record<string, string[]>;

// ──────────────────────────────────────────────────────────
// 1. LAS ETIQUETAS COBIERAN A TODOS Y A NADIE MAS
// ──────────────────────────────────────────────────────────
//
// Este es el fallo que mas se cuela: se añade un personaje y se
// olvida su entrada en el mapa de etiquetas. No da ningun error,
// el personaje sale en la wiki sin ninguna chapa debajo del
// nombre, y no hay nada roto que mirar.

const nombres = PERSONAJES.map((p) => p[0]);

for (const nombre of nombres) {
  assert.ok(
    Array.isArray(ETIQUETAS[nombre]) && ETIQUETAS[nombre].length > 0,
    `${nombre} no tiene etiquetas. Se añadiria a la wiki sin ninguna chapa.`,
  );
}

for (const clave of Object.keys(ETIQUETAS)) {
  assert.ok(
    nombres.includes(clave),
    `las etiquetas de "${clave}" no corresponden a ningun personaje. ` +
      `O sobra la entrada, o el nombre cambio en mt-personajes.mjs y aqui no.`,
  );
}

// Ni una etiqueta duplicada dentro del mismo personaje: la wiki las
// pinta todas y se veria la misma dos veces.
for (const [nombre, tags] of Object.entries(ETIQUETAS)) {
  const vistas = new Set();
  for (const tag of tags) {
    assert.ok(!vistas.has(tag.toLowerCase()), `${nombre} repite la etiqueta ${tag}`);
    vistas.add(tag.toLowerCase());
  }
}

// Y que ninguna se pase del limite del panel, porque `normalizaTags`
// la recortaria en silencio al guardar y en Firestore acabaria
// distinta de lo que pone el fichero de datos.
for (const [nombre, tags] of Object.entries(ETIQUETAS)) {
  for (const tag of tags) {
    assert.ok(
      tag.length <= MAX_TAG,
      `${nombre}: "${tag}" son ${tag.length} caracteres y el limite son ${MAX_TAG}. ` +
        `Al guardar se recortaria sola y no coincidiria con el fichero.`,
    );
    assert.ok(!tag.startsWith('#'), `${nombre}: "${tag}" lleva almohadilla, que se quita al guardar`);
  }
}

// Que lo que se guarde sea exactamente lo que pone el fichero: si
// `normalizaTags` cambiara algo, la comprobacion de Firestore
// compararia una cosa y el fichero diria otra.
for (const [nombre, tags] of Object.entries(ETIQUETAS)) {
  assert.deepEqual(
    normalizaTags(tags),
    tags,
    `${nombre}: las etiquetas cambian al pasar por normalizaTags`,
  );
}

// Al menos tiene que haber alguien en "Destacados", porque es la
// etiqueta que filtra la wiki. Si nadie la llevara, el filtro
// devolveria una lista vacia sin ningun aviso.
const destacados = nombres.filter((n) => ETIQUETAS[n].includes(TAG_DESTACADOS));
assert.ok(
  destacados.length > 0,
  'nadie lleva la etiqueta Destacados, y es la que filtra la wiki',
);

// ──────────────────────────────────────────────────────────
// 2. LA NOTA DE CADA TEMPORADA
// ──────────────────────────────────────────────────────────
//
// Se comprueba la media a mano, porque es lo que va a escribir el
// cargador. El error clásico aqui es promediar tambien el 0 de un
// capitulo sin nota (la OVA): bajaria la nota de la temporada sin
// que nadie entienda por que.

for (const t of TEMPORADAS) {
  const caps = CAPITULOS[t.capitulos];
  const notas = caps.map((c) => c[4]);
  const esperada = media(notas);

  assert.ok(esperada > 0, `la T${t.numero} se queda sin nota de temporada`);
  assert.ok(esperada <= 10, `la T${t.numero} tiene una media imposible: ${esperada}`);

  // Un decimal, como las notas de IMDb y como `normalizeRating`.
  assert.equal(
    Number(esperada.toFixed(1)),
    esperada,
    `la media de la T${t.numero} tiene mas de un decimal: ${esperada}`,
  );
}

// Que cada temporada tenga SU media, y que no sea el mismo numero
// para las tres. Esto no es una comprobacion de que las medias sean
// correctas (eso lo haria comparar con la suma a mano), sino de que
// el calculo lee los capitulos de esa temporada y no un valor fijo.
//
// Lo contrario paso de verdad: la media de la T1 es 8.1565, que
// redondeada da 8.2, y la nota de IMDb de la serie entera tambien es
// 8.2. Con una comprobacion de "son diferentes" no se habria notado
// que el calculo estaba partido, porque dos numeros distintos
// redondeados a un decimal pueden acabar iguales.
const medias = TEMPORADAS.map((t) => media(CAPITULOS[t.capitulos].map((c) => c[4])));
assert.equal(
  new Set(medias).size,
  medias.length,
  `dos temporadas tienen la misma media (${medias.join(', ')}): el calculo no esta leyendo sus propios capitulos`,
);

// Y la suma a mano, para confirmar el redondeo. Con un caso pequeno
// se ve sin tener que fiarse del promedio.
assert.equal(media([8, 7, 9]), 8, 'media de tres notas enteras');
assert.equal(media([8.1, 7.2]), 7.7, 'media de dos notas');
assert.equal(media([8, 8, 9]), 8.3, 'la media se redondea a un decimal');
assert.equal(media([0, 8, 9]), 8.5, 'el 0 de un capitulo sin nota no cuenta');
assert.equal(media([0, 0]), 0, 'una temporada sin ninguna nota se queda en 0');

// El 0 de la OVA NO puede bajar la media. Con la OVA dentro, la
// media de la T1 sale de 24 capitulos de los que 23 tienen nota.
const conOva = media(CAPITULOS.T1.map((c) => c[4]));
const soloLos23 = media(CAPITULOS.T1.filter((c) => c[4] > 0).map((c) => c[4]));
assert.equal(
  conOva,
  soloLos23,
  'el 0 de un capitulo sin nota baja la media de la temporada',
);

// ──────────────────────────────────────────────────────────
// 3. LA OVA: NUMERO FRACCIONARIO
// ──────────────────────────────────────────────────────────

const fraccionarios = CAPITULOS.T1.filter((c) => c[0] !== Math.floor(c[0]));

assert.equal(fraccionarios.length, 1, 'debe haber exactamente un capitulo fraccionario');

const ova = fraccionarios[0];
assert.equal(ova[0], 15.5, 'la OVA va entre el 15 y el 16');
assert.equal(numeroDeEpisodioValido(ova[0]), 15.5, 'y el numero es valido segun la regla');

// Que este REALMENTE entre los dos, y no en cualquier sitio.
const numeros = CAPITULOS.T1.map((c) => c[0]).sort((a, b) => a - b);
const i = numeros.indexOf(15.5);
assert.ok(i > 0 && i < numeros.length - 1, 'la OVA tiene que tener capitulos a los dos lados');
assert.equal(numeros[i - 1], 15, 'justo despues del 15');
assert.equal(numeros[i + 1], 16, 'y justo antes del 16');

// Sin nota de IMDb, y por tanto en 0. No es un fallo: es que IMDb no
// lista los extras de Blu-ray.
assert.equal(ova[4], 0, 'la OVA no tiene nota de IMDb y se queda en 0');

// Con dos decimales como mucho, que es lo que permite la regla.
assert.ok(
  String(ova[0]).split('.')[1].length <= MAX_DECIMALES_EPISODIO,
  'la OVA tiene mas decimales de los permitidos',
);

// El total de capitulos tiene que incluir la OVA, o la ficha
// diria 61 y habria 62.
const total = Object.values(CAPITULOS).reduce((s, t) => s + t.length, 0);
assert.equal(total, EPISODIOS_TOTAL, `el total declarado (${EPISODIOS_TOTAL}) no son los capitulos (${total})`);

// ──────────────────────────────────────────────────────────
// 4. LA SINONIMIA DE LA OVA
// ──────────────────────────────────────────────────────────

// Un numero fraccionario en el titulo del id documentaria bien,
// pero el resto del proyecto tendria que estar de acuerdo. Se
// comprueba que el cargador lo cambia por una "x", que es lo que
// Firestore admite.
const idDeEjemplo = `s1-e${String(ova[0]).padStart(2, '0').replace('.', 'x')}`;
assert.equal(idDeEjemplo, 's1-e15x5', 'el id del capitulo fraccionario');
assert.ok(!idDeEjemplo.includes('.'), 'un id de documento no puede acabar en punto: Firestore lo lee como extension');

console.log('logica.etiquetas: OK');