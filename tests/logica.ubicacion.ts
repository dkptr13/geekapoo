/**
 * Comprobaciones de la VALIDACION DE UBICACIONES, sin navegador y sin
 * red.
 *
 * Existe por lo que valida: las coordenadas de un mensaje de chat las
 * escribe el navegador del que lo manda, y sin comprobar los rangos
 * cualquiera podria mandar una latitud de 900 y se dibujaria en un
 * sitio que no existe.
 *
 * Aqui se comprueba lo que NO es obvio de leer el codigo:
 *
 *   · que un `NaN` se RECHAZA, que es el caso que un rango escrito al
 *     reves deja pasar sin querer (las dos comparaciones con `NaN` son
 *     falsas, con lo que `||` da falso y la funcion acepta);
 *   · que los extremos validos se aceptan, porque un rango con `<` en
 *     vez de `<=` dejaria fuera la latitud -90, que es el polo sur;
 *   · que la precision cero se acepta, que es lo que significa "exacta"
 *     y no "sin dato";
 *   · que el nombre del sitio tiene un tope, porque es texto libre.
 *
 * Lo mismo esta en las reglas de Firestore (`ubicacionValida`), que
 * son las que garantizan de verdad: un cliente se puede modificar desde
 * la consola del navegador, unas reglas no.
 */
import assert from 'node:assert/strict';

import {
  MAX_LUGAR,
  enlaceGoogleMaps,
  enlaceMapa,
  ubicacionPlausible,
} from '../src/services/ubicacion';

// ──────────────────────────────────────────────────────────
// LO QUE TIENE QUE VALER
// ──────────────────────────────────────────────────────────

assert.ok(ubicacionPlausible({ lat: 40.41678, lng: -3.70379 }), 'una ubicacion normal');
assert.ok(ubicacionPlausible({ lat: 0, lng: 0 }), 'el cruce de Greenwich');
assert.ok(ubicacionPlausible({ lat: -89.9, lng: 179.9 }), 'casi en el borde, pero dentro');

// ── LOS EXTREMOS ──────────────────────────────────────────
//
// -90 y 180 son puntos reales: el polo sur y la linea de cambio de
// fecha. Con `<` en vez de `<=` quedarian fuera, que es un fallo que no
// se ve hasta que alguien manda la ubicacion de un sitio en el que
// justo da.

assert.ok(ubicacionPlausible({ lat: -90, lng: -180 }), 'el extremo de las dos');
assert.ok(ubicacionPlausible({ lat: 90, lng: 180 }), 'el otro extremo');

// ── EL NaN, QUE ES EL CASO QUE JUSTIFICA EL FICHERO ──────

// Con un rango al reves ("lat < -90 || lat > 90"), un NaN pasaria:
// NaN < -90 es falso y NaN > 90 es falso, con lo que el || da falso y
// la funcion acepta una latitud que no existe. El mapa se dibujaria
// donde le diese el gana y el enlace llevaria a ningun sitio.

assert.ok(!ubicacionPlausible({ lat: Number.NaN, lng: 0 }), 'NaN en la latitud');
assert.ok(!ubicacionPlausible({ lat: 0, lng: Number.NaN }), 'NaN en la longitud');
assert.ok(
  !ubicacionPlausible({ lat: Number.POSITIVE_INFINITY, lng: 0 }),
  'infinito en la latitud',
);

// ── FUERA DE RANGO ────────────────────────────────────────

assert.ok(!ubicacionPlausible({ lat: 90.1, lng: 0 }), 'la latitud no pasa de 90');
assert.ok(!ubicacionPlausible({ lat: -90.1, lng: 0 }), 'la latitud no baja de -90');
assert.ok(!ubicacionPlausible({ lat: 0, lng: 180.1 }), 'la longitud no pasa de 180');
assert.ok(!ubicacionPlausible({ lat: 0, lng: -180.1 }), 'la longitud no baja de -180');
assert.ok(
  !ubicacionPlausible({ lat: 1000, lng: 1000 }),
  'las dos fuera, que es lo que da un GPS roto',
);

// ── LA PRECISION ──────────────────────────────────────────
//
// El navegador a veces no la da, y en ese caso el campo no viene. Cuando
// viene, cero significa "exacto", no "sin dato", asi que vale.

assert.ok(ubicacionPlausible({ lat: 0, lng: 0, accuracy: 25 }), 'una precision normal');
assert.ok(ubicacionPlausible({ lat: 0, lng: 0, accuracy: 0 }), 'precision cero, que es exacta');
assert.ok(
  ubicacionPlausible({ lat: 0, lng: 0, accuracy: undefined }),
  'sin precision, que el navegador no siempre la da',
);
assert.ok(!ubicacionPlausible({ lat: 0, lng: 0, accuracy: -1 }), 'una precision negativa');
assert.ok(
  !ubicacionPlausible({ lat: 0, lng: 0, accuracy: Number.NaN }),
  'una precision que no es un numero',
);

// ── EL NOMBRE DEL SITIO ───────────────────────────────────
//
// Es texto libre y lo pone el navegador segun donde estés. Sin tope, un
// campo de 50 KB por mensaje.

assert.ok(ubicacionPlausible({ lat: 0, lng: 0, place: 'Puerta del Sol' }), 'con nombre de sitio');
assert.ok(
  ubicacionPlausible({ lat: 0, lng: 0, place: 'x'.repeat(MAX_LUGAR) }),
  'un nombre justo en el limite',
);
assert.ok(
  !ubicacionPlausible({ lat: 0, lng: 0, place: 'x'.repeat(MAX_LUGAR + 1) }),
  'un nombre una letra mas alla',
);

// ── NADA ──────────────────────────────────────────────────

assert.ok(!ubicacionPlausible(null as never), 'sin ubicacion no hay ubicacion');

// ═══════════════════════════════════════════════════════
// LOS ENLACES
// ═══════════════════════════════════════════════════════
//
// Los dos generan una URL a partir de las mismas coordenadas, que son
// las que hay en el mensaje. Lo que se comprueba aqui es que la URL de
// Google tiene la forma exacta que espera su visor, y que no se arma
// cuando las coordenadas no valen.
//
// El formato es el que documenta Google para abrir un punto:
//
//     https://www.google.com/maps/search/?api=1&query=LAT%2CLNG
//
// La coma va como %2C y no suelta porque es el separador de la query:
// sinla, `?query=40.4,-3.7` se leeria como el parametro `query` con
// el valor `40.4` y un parametro `-3.7` sin nombre.

// ── LA FORMA DE LA URL ─────────────────────────────────────
//
// Madrid, con las coordenadas de la prueba de arriba.

assert.equal(
  enlaceGoogleMaps(40.41678, -3.70379),
  'https://www.google.com/maps/search/?api=1&query=40.41678%2C-3.70379',
  'la URL de Google Maps lleva las coordenadas con la coma escapada',
);

assert.equal(
  enlaceGoogleMaps(0, 0),
  'https://www.google.com/maps/search/?api=1&query=0.00000%2C0.00000',
  'el cruce de Greenwich tambien vale',
);

// ── QUE NO HAYA UNA COMA SUELTA ────────────────────────────
//
// Es el fallo que no se ve leyendo la URL: parece correcta y Google
// abre donde le parece, porque ha leido un parametro y ha disregarded
// el otro.

{
  const url = enlaceGoogleMaps(40.41678, -3.70379)!;

  assert.ok(url.includes('%2C'), 'la coma va escapada como %2C');
  assert.ok(!url.includes('query=40.41678,'), 'no queda una coma sin escapar en la query');
}

// ── SIN COPIAR NADA A OTRO SITIO ───────────────────────────
//
// La URL tiene que ser solo de Google Maps. Si apareciera el nombre
// del sitio o el pais seria informacion del usuario yendo a un tercero
// que no la necesita: el punto ya lo dicen las coordenadas.

{
  const url = enlaceGoogleMaps(40.41678, -3.70379)!;

  assert.ok(!url.includes('place='), 'no manda el nombre del sitio');
  assert.ok(!url.includes('Madrid'), 'no manda la ciudad');
  assert.ok(url.startsWith('https://'), 'va por https');
  assert.ok(
    new URL(url).hostname === 'www.google.com',
    'el host es el de Google Maps y nada mas',
  );
}

// ── CINCO DECIMALES, COMO EL DE OPENSTREETMAP ─────────────
//
// Un grado son unos 111 km. Con menos decimales el enlace abre en la
// calle de al lado, que en un barrio normal es otro portal.

assert.ok(
  enlaceGoogleMaps(40.4167899, -3.7037901)!.includes('40.41679%2C-3.70379'),
  'redondea a cinco decimales, que es del orden de un metro',
);

// ── COORDENADAS QUE NO VALEN ──────────────────────────────
//
// Aqui es donde `enlaceGoogleMaps` se separa de `enlaceMapa`. El de
// OpenStreetMap devuelve una cadena siempre, porque aunque las
// coordenadas sean una porqueria la URL es una URL y el navegador no
// avisa de nada. El de Google devuelve `null`, para que quien lo llama
// esconda el boton en vez de pintar un enlace roto.
//
// Un `NaN` dentro de una query llega a Google como la letra "N", y
// Google abre en un sitio que no es el. No es un error visible: es un
// enlace que funciona y lleva a cualquier sitio.

assert.equal(enlaceGoogleMaps(Number.NaN, 0), null, 'NaN en la latitud no genera URL');
assert.equal(enlaceGoogleMaps(0, Number.NaN), null, 'NaN en la longitud no genera URL');
assert.equal(enlaceGoogleMaps(90.1, 0), null, 'una latitud de mas de 90 no genera URL');
assert.equal(enlaceGoogleMaps(-90.1, 0), null, 'una latitud de menos de -90 no genera URL');
assert.equal(enlaceGoogleMaps(0, 180.1), null, 'una longitud de mas de 180 no genera URL');
assert.equal(enlaceGoogleMaps(0, -180.1), null, 'una longitud de menos de -180 no genera URL');
assert.equal(
  enlaceGoogleMaps(Number.POSITIVE_INFINITY, 0),
  null,
  'un infinito no genera URL',
);

// ── LOS EXTREMOS, QUE SI SON PUNTOS REALES ────────────────

assert.equal(
  enlaceGoogleMaps(-90, -180),
  'https://www.google.com/maps/search/?api=1&query=-90.00000%2C-180.00000',
  'el polo sur y la linea de fecha generan URL',
);

// ── LOS DOS ENLACES NO SE ROMPEN ──────────────────────────
//
// Lo que se rompe de verdad es meter un `<a>` dentro de otro `<a>`: es
// HTML invalido y cada navegador lo reparte a su manera. La tarjeta
// lleva los dos como hermanos, y `enlaceMapa` sigue dando lo que
// daba antes.

assert.ok(
  enlaceMapa(40.41678, -3.70379).startsWith('https://www.openstreetmap.org/'),
  'el enlace de OpenStreetMap sigue siendo de OpenStreetMap',
);

assert.ok(
  !enlaceMapa(40.41678, -3.70379).includes('google'),
  'el enlace de OpenStreetMap no lleva a Google',
);

assert.ok(
  !enlaceGoogleMaps(40.41678, -3.70379)!.includes('openstreetmap'),
  'el enlace de Google no lleva a OpenStreetMap',
);

console.log('  ubicaciones: OK');
console.log('  enlaces a mapas: OK');