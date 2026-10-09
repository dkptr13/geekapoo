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

import { MAX_LUGAR, ubicacionPlausible } from '../src/services/ubicacion';

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

console.log('  ubicaciones: OK');