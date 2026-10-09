/**
 * Comprobaciones de los SALTOS entre preguntas de la trivia, sin
 * navegador y sin red.
 *
 * Existe por el bug que arreglaron: al terminar, la trivia se quedaba
 * en "corrigiendo…" y había que recargar la página para ver las notas.
 * Alongside, la otra mitad del problema era que no se podía cambiar una
 * respuesta una vez elegida ni volver a una pregunta anterior.
 *
 * La parte de red (las reglas que impedían oír las notas) está en
 * `tests/firestore.trivia.rules.test.cjs`. Aquí lo que se comprueba es
 * el salto de pregunta en pregunta, que es lo que permite corregir.
 *
 * Lo que no es obvio de leer el código:
 *
 *   · que "Siguiente" salte al primer hueco y no uno a uno, porque si no
 *     corregir una de la primera mitad obligaba a ir pulsando todas las
 *     de la segunda;
 *   · que buscar HAGA ATRÁS sin querer, que es peor que no saltar;
 *   · que el botón se apague cuando ya no quedan huecos, porque es la
 *     señal de que toca enviar.
 */
import assert from 'node:assert/strict';

import { primeraSinResponder, siguienteSinResponder } from '../src/utils/triviaSaltos';

const PREGUNTAS = ['q1', 'q2', 'q3', 'q4', 'q5'];

// ──────────────────────────────────────────────────────────
// EMPEZAR
// ──────────────────────────────────────────────────────────

assert.equal(
  siguienteSinResponder(PREGUNTAS, {}, 0),
  0,
  'sin nada contestado se va a la primera',
);

assert.equal(
  primeraSinResponder(PREGUNTAS, {}),
  0,
  'la primera sin responder es la primera',
);

// ── YA HAY UNA CONTESTADA ─────────────────────────────────

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0 }, 0),
  1,
  'con la primera ya contestada, salta a la segunda',
);

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0, q2: 2 }, 0),
  2,
  'con dos contestadas, salta a la tercera',
);

// ── UN HUECO EN MEDIO ─────────────────────────────────────
//
// Es el caso para el que sirve: alguien se salta una y vuelve atrás.

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0, q3: 1 }, 0),
  1,
  'con un hueco en medio, salta al hueco y no al final',
);

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0, q3: 1, q4: 3 }, 0),
  1,
  'el hueco de la segunda tiene prioridad sobre seguir hacia delante',
);

// ── DESDE ─────────────────────────────────────────────────
//
// Que busque a partir de donde se le dice, no desde cero: es lo que hace
// que "Siguiente" no salte hacia atrás sin avisar.

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 }, 0),
  null,
  'con todas contestadas no hay a donde ir',
);

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q3: 1, q4: 1 }, 3),
  4,
  'desde la tercera, salta a la cuarta aunque la segunda falte',
);

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0 }, 1),
  1,
  'desde la segunda, y la segunda sin contestar, salta a ella misma',
);

// ── LA COTA ───────────────────────────────────────────────
//
// Que un `desde` raro no reviente. `Math.max(0, desde)` deja los
// negativos en cero, y un `desde` mayor que la lista da null, no un
// undefined que rompería el `setIndice`.

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0 }, -5),
  1,
  'un indice negativo empieza en el principio',
);

assert.equal(
  siguienteSinResponder(PREGUNTAS, {}, 99),
  null,
  'un indice fuera de rango no hay salto',
);

assert.equal(
  siguienteSinResponder([], {}, 0),
  null,
  'una trivia sin preguntas no hay salto',
);

// ── EL VALOR DE LA RESPUESTA ──────────────────────────────
//
// Que se mire que la clave exista, no que valga algo. Una respuesta
// guardada como 0 es una respuesta de verdad: con `if (respuestas[id])`
// en vez de `!== undefined` la primera opción de todas las preguntas
// contaría como sin contestar y el salto se iría al principio cada vez.

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0 }, 0),
  1,
  'la opción 0 es una respuesta, no un hueco',
);

// ── LO QUE PASA AL VOLVER ATRÁS ───────────────────────────
//
// Al corregir, se llega a una pregunta ya contestada. Al pulsar
// "Siguiente" desde ahi tiene que saltar a la siguiente que falte, y si
// no falta ninguna, a ninguna parte: es el momento de enviar.

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0, q2: 1, q3: 2 }, 0),
  3,
  'volviendo a la primera, salta a la cuarta',
);

assert.equal(
  siguienteSinResponder(PREGUNTAS, { q1: 0, q2: 1, q3: 2, q4: 3, q5: 4 }, 0),
  null,
  'todo contestado: no hay salto y toca enviar',
);

console.log('  trivia (saltos): OK');