/**
 * Dimensiones de imagen para reservar su sitio (ver
 * `src/utils/imagenes.ts` y `StableImage`).
 *
 * La reserva solo vale si las medidas son enteros sensatos:
 * un 0, un negativo o un disparate romperian la caja igual
 * que no tener el dato, asi que se tratan como ausentes y la
 * imagen se pinta como antes (sin reserva, con fundido).
 *
 *   npx tsx tests/logica.imagenes.ts
 */
import assert from 'node:assert/strict';

import { aspectoDe, dimsValidas, MAX_DIMENSION } from '../src/utils/imagenes';

// Medidas normales: vertical, horizontal y cuadrada.
assert.equal(dimsValidas(800, 600), true);
assert.equal(dimsValidas(600, 800), true);
assert.equal(dimsValidas(500, 500), true);

// Un GIF animado mide igual que una foto: el formato no
// importa, solo que los numeros cuadren.
assert.equal(dimsValidas(480, 270), true);

// Bordes: el minimo es 1x1 y el maximo el tope configurado.
assert.equal(dimsValidas(1, 1), true);
assert.equal(dimsValidas(MAX_DIMENSION, MAX_DIMENSION), true);
assert.equal(dimsValidas(MAX_DIMENSION + 1, 100), false);

// Lo que romperia la caja se rechaza.
assert.equal(dimsValidas(0, 600), false);
assert.equal(dimsValidas(800, 0), false);
assert.equal(dimsValidas(-800, 600), false);
assert.equal(dimsValidas(800.5, 600), false);
assert.equal(dimsValidas(800, NaN), false);

// Tipos que no son numero (documentos antiguos o corruptos).
assert.equal(dimsValidas(undefined, undefined), false);
assert.equal(dimsValidas(null, 600), false);
assert.equal(dimsValidas('800', '600'), false);
assert.equal(dimsValidas({}, []), false);

// La proporcion no se simplifica: es la de la foto tal cual.
assert.equal(aspectoDe(800, 600), '800 / 600');
assert.equal(aspectoDe(1080, 1920), '1080 / 1920');

console.log('dimensiones de imagen: OK');
