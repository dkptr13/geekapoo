/**
 * Comprobaciones del BUSCADOR DE LUGARES, sin navegador y sin red.
 *
 * Aquí está lo que no se ve a ojo leyendo el componente: que el
 * servicio devuelve las coordenadas al revés y que hay que enderezarlas
 * antes de dárselas a nada.
 *
 * ── EL ERROR QUE ESTA PRUEBA PERSIGUE ───────────────────────────────
 *
 * GeoJSON, que es lo que devuelve el geocodificador, escribe el punto
 * como `[longitud, latitud]`. Todo lo demás de la web lo tiene al revés:
 * `LocationAttachment` va `lat` y luego `lng`, y así lo da también
 * `navigator.geolocation`.
 *
 * Si las dos cosas se mezclan, Madrid acaba en `-3.70, 40.41` en vez de
 * `40.41, -3.70`. No da ningún error: los dos son números dentro de
 * rango, así que pasan la validación, se guardan en Firestore sin que las
 * reglas protesten, y el fallo sale cuando alguien abre el mapa y el
 * marcador aparece en mitad del golfo de Guinea. Por eso el intercambio
 * se hace una sola vez, al leer la respuesta, y se comprueba aquí.
 *
 * ── LO DEMÁS QUE SE COMPRUEBA ──────────────────────────────────────
 *
 *   · que una respuesta sin punto no reviente el buscador;
 *   · que un sitio sin nombre no aparece, porque elegirlo sería a ciegas;
 *   · que los sitios repetidos se quitan, o la lista de "Gran Vía" parece
 *     más mala de lo que es;
 *   · que dos sitios con el mismo nombre en sitios distintos se quedan;
 *   · que el corte de caracteres del nombre del sitio coincide con el
 *     mismo tope que comprueban las reglas del servidor.
 */
import assert from 'node:assert/strict';

import { aLugar, aLugares, LIMITE_BUSQUEDA, MINIMO_BUSQUEDA } from '../src/services/geocoding';
import { mensajeDeFallo, motivoDeCodigo } from '../src/services/geolocacion';
import type { MotivoFallo } from '../src/services/geolocacion';
import { etiquetaDeLugar, MAX_LUGAR } from '../src/services/ubicacion';

// ──────────────────────────────────────────────────────────
// EL ORDEN DE LAS COORDENADAS
// ──────────────────────────────────────────────────────────

/** Como viene de GeoJSON: longitud primero. */
const rawMadrid = {
  geometry: { type: 'Point', coordinates: [-3.7038762, 40.416863] },
  properties: { name: 'Puerta del Sol', city: 'Madrid', country: 'España', postcode: '28013' },
};

const madrid = aLugar(rawMadrid);

assert.ok(madrid, 'un punto con coordenadas y nombre tiene que valer');

assert.equal(
  madrid.lat,
  40.416863,
  'la latitud es el SEGUNDO numero de GeoJSON, no el primero',
);

assert.equal(
  madrid.lng,
  -3.7038762,
  'la longitud es el PRIMERO numero de GeoJSON',
);

assert.equal(madrid.titulo, 'Puerta del Sol');
assert.equal(madrid.ciudad, 'Madrid');

// Un sitio del otro hemisferio, donde los dos números tienen el mismo
// signo y un intercambio pasaría más desapercibido.
const sydney = aLugar({
  geometry: { coordinates: [151.2093, -33.8688] },
  properties: { name: 'Opera House', city: 'Sydney' },
});

assert.ok(sydney);
assert.equal(sydney.lat, -33.8688, 'hemisferio sur: la latitud es negativa');
assert.equal(sydney.lng, 151.2093, 'hemisferio este: la longitud es positiva');

// ──────────────────────────────────────────────────────────
// LO QUE NO TIENE PUNTO
// ──────────────────────────────────────────────────────────

assert.equal(aLugar({ properties: { name: 'Sin geometría' } }), null, 'sin coordenadas no hay lugar');

assert.equal(
  aLugar({ geometry: { coordinates: [] }, properties: { name: 'Vacío' } }),
  null,
  'una lista de coordenadas vacía no vale',
);

assert.equal(
  aLugar({ geometry: { coordinates: [1] }, properties: { name: 'Solo una' } }),
  null,
  'con un solo número no se sabe dónde está',
);

// Un punto con tres números es un punto CON ALTITUD, que GeoJSON admite
// y el servicio devuelve para los que están en la montaña. La altitud no
// se guarda ni se enseña, porque en la tarjeta no cabe y a la gente no
// le sirve para encontrar el sitio, pero el punto sigue siendo válido:
// dejarlo fuera tiraría a la basura resultados buenos.
const enLaMontana = aLugar({
  geometry: { coordinates: [-3.6882, 40.453, 650] },
  properties: { name: 'Puerto de Navacerrada' },
});

assert.ok(enLaMontana, 'un punto con altitud sigue siendo un sitio');
assert.equal(enLaMontana.lat, 40.453, 'la latitud se lee igual');
assert.equal(enLaMontana.lng, -3.6882, 'la longitud se lee igual');

// Un `NaN` o un `null` en las coordenadas. GeoJSON no los manda, pero un
// servicio que cambiara un día sí, y una latitude nula se dibujaría en
// el golfo de Guinea sin más.
assert.equal(
  aLugar({ geometry: { coordinates: [null, 40] }, properties: { name: 'Nulo' } }),
  null,
  'una coordenada nula no es un lugar',
);

assert.equal(
  aLugar({ geometry: { coordinates: ['a', 40] }, properties: { name: 'Texto' } }),
  null,
  'una coordenada que no es número no es un lugar',
);

// ──────────────────────────────────────────────────────────
// LO QUE NO TIENE NOMBRE
// ──────────────────────────────────────────────────────────

assert.equal(
  aLugar({ geometry: { coordinates: [0, 0] }, properties: {} }),
  null,
  'un punto sin nombre no se puede elegir a ciegas',
);

// ── LO QUE ESTÁ FUERA DE LA TIERRA ─────────────────────
//
// El servicio no lo comprueba, pero el filtro de datos que se hace al
// recibirlos tiene que rechazarlo. Un punto en el mar del Norte es un
// dato imposible y acabaría guardado y mostrado como si fuera un sitio.
assert.equal(
  aLugar({ geometry: { coordinates: [0, 91] }, properties: { name: 'Fuera' } }),
  null,
  'una latitud de 91 grados no es un sitio',
);

assert.equal(
  aLugar({ geometry: { coordinates: [181, 0] }, properties: { name: 'Al otro lado' } }),
  null,
  'una longitud de 181 grados no es un sitio',
);

// Los extremos sí: el polo y la línea de cambio de fecha son reales.
assert.ok(
  aLugar({ geometry: { coordinates: [0, 90] }, properties: { name: 'Polo Norte' } }),
  'el polo norte es un sitio',
);

assert.ok(
  aLugar({ geometry: { coordinates: [180, -90] }, properties: { name: 'Polo Sur' } }),
  'el polo sur es un sitio',
);

// ── TEXTO QUE NO ES TEXTO ───────────────────────────────
//
// Si un campo llega con un objeto, un `String()` a pelo pondría
// "[object Object]" en la tarjeta de un sitio que sí existe.
const conBasura = aLugar({
  geometry: { coordinates: [-3.7, 40.4] },
  properties: { name: 'Real', city: { algo: 'raro' }, street: 42, postcode: null },
});

assert.ok(conBasura);
assert.equal(conBasura.titulo, 'Real');
assert.equal(conBasura.ciudad, undefined, 'una ciudad que no es texto no se enseña');
assert.equal(conBasura.calle, undefined, 'una calle que no es texto no se enseña');
assert.ok(!JSON.stringify(conBasura).includes('object Object'), 'nada de "[object Object]"');

// Sin `name`, pero con calle: la calle es un nombre suficiente.
const soloCalle = aLugar({
  geometry: { coordinates: [-3.7, 40.4] },
  properties: { street: 'Gran Vía', housenumber: '28' },
});

assert.ok(soloCalle, 'con calle se puede enseñar');
assert.equal(soloCalle.titulo, 'Gran Vía 28', 'la calle y el número van juntos');
assert.equal(soloCalle.ciudad, undefined, 'sin ciudad no se inventa ninguna');

// ──────────────────────────────────────────────────────────
// LA LISTA ENTERA
// ──────────────────────────────────────────────────────────

const lista = aLugares({
  features: [rawMadrid, rawMadrid, { geometry: { coordinates: [] }, properties: {} }],
});

assert.equal(lista.length, 1, 'el mismo sitio dos veces sale una vez');

assert.equal(lista[0].lat, 40.416863, 'y sale con las coordenadas bien');

// Dos sitios con el mismo nombre en sitios distintos: son dos sitios de
// verdad y quedarse con uno sería esconder la respuesta.
const dosConElMismoNombre = aLugares({
  features: [
    { geometry: { coordinates: [-3.7, 40.4] }, properties: { name: 'Plaza Mayor', city: 'Madrid' } },
    { geometry: { coordinates: [-4.42, 37.88] }, properties: { name: 'Plaza Mayor', city: 'Toledo' } },
  ],
});

assert.equal(
  dosConElMismoNombre.length,
  2,
  'dos plazas mayores en dos ciudades son dos resultados',
);

// Dos entradas del mismo edificio, una por la vía y otra por el nombre
 // oficial. Se distinguen en metros, no en kilómetros: a cinco decimales son
// unos tres metros.
const mismoPortal = aLugares({
  features: [
    { geometry: { coordinates: [-3.688197, 40.4530437] }, properties: { name: 'Bernabéu' } },
    { geometry: { coordinates: [-3.688200, 40.4530410] }, properties: { name: 'Estadio Santiago Bernabéu' } },
  ],
});

assert.equal(mismoPortal.length, 1, 'dos formas de llamar al mismo portal son un sitio');

// Y uno a un centímetro sí son dos, que a esa escala ya se nota.
const dosMuyJuntos = aLugares({
  features: [
    { geometry: { coordinates: [0, 0] }, properties: { name: 'Uno' } },
    { geometry: { coordinates: [0, 0.001] }, properties: { name: 'Dos' } },
  ],
});

assert.equal(dosMuyJuntos.length, 2, 'a cien metros ya son sitios distintos');

// Respuestas raras: no son un error, pero tampoco una lista.
assert.deepEqual(aLugares(null), [], 'una respuesta vacía es una lista vacía');
assert.deepEqual(aLugares({}), [], 'sin la lista de resultados no hay resultados');
assert.deepEqual(aLugares({ features: null }), [], 'una lista nula no es una lista');
assert.deepEqual(aLugares('texto'), [], 'si no es un objeto, no hay lugares');

// El tope: por mucho que mande el servicio, se pinta una pantalla y
// media como mucho.
const muchos = aLugares({
  features: Array.from({ length: 40 }, (_, i) => ({
    geometry: { coordinates: [i * 0.01, i * 0.01] },
    properties: { name: `Sitio ${i}` },
  })),
});

assert.equal(muchos.length, LIMITE_BUSQUEDA, 'no se pintan más de los que caben');

assert.ok(MINIMO_BUSQUEDA >= 3, 'con menos de tres letras no hay sitio que buscar');

// ──────────────────────────────────────────────────────────
// EL TEXTO QUE VE LA PERSONA
// ──────────────────────────────────────────────────────────

const motivos: MotivoFallo[] = ['sin-soporte', 'denegado', 'no-disponible', 'timeout', 'desconocido'];

for (const motivo of motivos) {
  const texto = mensajeDeFallo(motivo);

  assert.ok(texto.length > 10, `el motivo "${motivo}" tiene que tener un texto`);
  assert.ok(!/\b(permission-denied|undefined|NaN|null)\b/.test(texto), `"${motivo}" dice "${texto}"`);
}

// Que los cuatro casos de fallo_real digan algo distinto. Si dos
// devolvieran el mismo texto, no se puede distinguir el caso bueno del
// malo, y está gastando una llamada de geolocalización.
const textosDistintos = new Set(motivos.map(mensajeDeFallo));

assert.equal(textosDistintos.size, motivos.length, 'cada motivo tiene su propio texto');

// Y que ninguno sea un error bloqueante sin salida: todos tienen que
// poder llevar al mapa, así que ninguno puede sonar a "no se puede".
for (const motivo of motivos) {
  assert.ok(
    !/no se puede|no está permitido/i.test(mensajeDeFallo(motivo)),
    `"${motivo}" no puede sonar a puerta cerrada`,
  );
}

assert.equal(motivoDeCodigo(1), 'denegado');
assert.equal(motivoDeCodigo(2), 'no-disponible');
assert.equal(motivoDeCodigo(3), 'timeout');

// Códigos que no son los tres del estándar: no se inventan motivos.
assert.equal(motivoDeCodigo(0), 'desconocido');
assert.equal(motivoDeCodigo(4), 'desconocido');
assert.equal(motivoDeCodigo(-1), 'desconocido');
assert.equal(motivoDeCodigo(99), 'desconocido');

// ──────────────────────────────────────────────────────────
// EL NOMBRE QUE VIAJA EN EL MENSAJE
// ──────────────────────────────────────────────────────────

assert.equal(etiquetaDeLugar(['Puerta del Sol', 'Madrid']), 'Puerta del Sol, Madrid');

// Sin ciudad no puede quedar una coma suelta al principio.
assert.equal(etiquetaDeLugar(['Puerta del Sol', undefined]), 'Puerta del Sol');
assert.equal(etiquetaDeLugar([undefined, 'Madrid']), 'Madrid');
assert.equal(etiquetaDeLugar([null, undefined, '']), '', 'nada que poner');

// El nombre puede venir dos veces: en `name` y en `street`.
assert.equal(
  etiquetaDeLugar(['Gran Vía', 'Gran Vía', 'Madrid']),
  'Gran Vía, Madrid',
  'un nombre repetido se pone una vez',
);

// Los espacios de más se limpian antes de nada, que vienen del servidor.
assert.equal(etiquetaDeLugar(['  Puerta   del  Sol ', ' Madrid ']), 'Puerta del Sol, Madrid');

// ── EL CORTE ─────────────────────────────────────────────
//
// El mismo tope que comprueban las reglas de Firestore. Si aquí se
// pasara, la previsualización enseñaría el nombre entero y el mensaje
// saldría partido, sin avisar de nada.
//
// Y el orden en que se quita: primero la parte menos específica. Un
// nombre de 200 caracteres ya ocupa el tope entero, así que si la
// ciudad no cupiera con él, lo que se sacrifica es la ciudad. Al revés
// que antes, que recortaba el texto entero y se comía justo eso.
const largo = etiquetaDeLugar(['x'.repeat(MAX_LUGAR), 'Madrid']);

assert.equal(largo.length, MAX_LUGAR, `el nombre no pasa de ${MAX_LUGAR}: mide ${largo.length}`);
assert.equal(largo, 'x'.repeat(MAX_LUGAR), 'un nombre que ya ocupa el tope se queda solo');

const conCola = etiquetaDeLugar(['Gran Vía', 'z'.repeat(250)]);

assert.ok(conCola.length <= MAX_LUGAR, 'se quita por el final hasta que cabe');
assert.equal(conCola, 'Gran Vía', 'al faltar la parte gigante solo queda el nombre');

// Y solo cuando el nombre a secas no cabe, se recorta con los tres
// puntos, para que se vea que está cortado.
const soloLargo = etiquetaDeLugar(['y'.repeat(1000)]);

assert.equal(soloLargo.length, MAX_LUGAR, 'un nombre enorme se corta igual');
assert.equal(soloLargo.endsWith('…'), true, 'un nombre que se corta avisa con los tres puntos');
assert.equal(soloLargo, 'y'.repeat(MAX_LUGAR - 1) + '…');

console.log('  ubicacion (nombres y geocodificador): OK');
