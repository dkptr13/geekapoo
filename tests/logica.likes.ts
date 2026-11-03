/**
 * Comprobaciones de la lógica pura de los "me gusta" de hilos y
 * comentarios, sin navegador y sin emulador.
 *
 * Lo que se comprueba aquí es justo lo que no puede fallar en
 * silencio:
 *
 *   - Que un reintento del trigger no se confunda con un cambio de
 *     estado (alta + alta sigue siendo "crear"; un update no es
 *     ninguna de las dos).
 *   - Que la lista que se guarda en `likedBy` se recalcula desde los
 *     documentos, sin duplicados y en un orden estable. Si se
 *     sumaran deltas, dos altas simultáneas podrían dejar el
 *     contador en 1.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import {
  accionDeLike,
  debeProcesarLike,
  idsDeLikes,
} from '../functions/src/likesLogic';
import { actualizarLikeEnLista, ponerLikeLocal } from '../src/utils/likes';

// ──────────────────────────────────────────────────────────
// 1. Qué ha pasado con el documento
// ──────────────────────────────────────────────────────────

assert.equal(accionDeLike(false, true), 'crear', 'alta nueva');
assert.equal(accionDeLike(true, false), 'borrar', 'baja');
assert.equal(accionDeLike(true, true), null, 'un update no cambia el estado');
assert.equal(accionDeLike(false, false), null, 'un borrado repetido no es una baja nueva');

// Un trigger repetido del alta vuelve a decir "crear". El pago y el
// contador son idempotentes por su cuenta (libro de recompensas y
// recálculo desde la subcolección), pero la acción no se disfraza de
// otra cosa.
assert.equal(accionDeLike(false, true), 'crear');

// ──────────────────────────────────────────────────────────
// 2. La lista de uids que se guarda en el padre
// ──────────────────────────────────────────────────────────

assert.deepEqual(
  idsDeLikes(['bob', 'alice', 'bob']),
  ['alice', 'bob'],
  'se quitan los duplicados y se ordena',
);

assert.deepEqual(
  idsDeLikes(['alice', '', null, 42, { uid: 'bob' }, 'alice ']),
  ['alice', 'alice '],
  'solo pasan textos no vacíos; los espacios no se recortan (un uid no los lleva)',
);

assert.deepEqual(idsDeLikes([]), [], 'sin "me gusta" la lista queda vacía');

// ──────────────────────────────────────────────────────────
// 3. Carreras y recálculo
// ──────────────────────────────────────────────────────────
//
// Dos personas dan "me gusta" casi a la vez. El orden en que se
// procesen los triggers no puede cambiar el resultado: los dos
// recalculan desde el MISMO conjunto final de documentos, así que
// los dos escriben la misma lista y el mismo número.
//
// Esto es lo que se rompería con `increment(1)`: si el segundo
// trigger se repitiera, el contador subiría dos veces aunque solo
// hubiera dos documentos.

const trasPrimeraAlta = ['alice'];
const trasSegundaAlta = idsDeLikes([...trasPrimeraAlta, 'bob']);

assert.deepEqual(trasSegundaAlta, ['alice', 'bob']);
assert.equal(trasSegundaAlta.length, 2, 'dos personas, dos "me gusta"');

// Recálculo repetido (el trigger se entrega otra vez): mismo estado.
assert.deepEqual(idsDeLikes(trasSegundaAlta), trasSegundaAlta);
assert.equal(idsDeLikes(trasSegundaAlta).length, 2, 'un reintento no suma otro');

// Y si una de las dos quita el suyo, el estado vuelve a ser el de
// una persona, no el de cero ni el de dos.
const trasBaja = idsDeLikes(['alice']);
assert.deepEqual(trasBaja, ['alice']);
assert.equal(trasBaja.length, 1);

// ──────────────────────────────────────────────────────────
// 4. Triggers desordenados
// ──────────────────────────────────────────────────────────
//
// Firestore entrega "al menos una vez" y no garantiza el orden. La
// decisión de pagar o retirar se toma con la lista FINAL: si el
// documento ya no está, la creación que llegó tarde no paga; si
// volvió a estar, el borrado que llegó tarde no retira.

assert.equal(
  debeProcesarLike('crear', 'alice', ['alice', 'bob']),
  true,
  'alta que sigue existiendo: paga',
);
assert.equal(
  debeProcesarLike('crear', 'alice', ['bob']),
  false,
  'alta que se borró antes del trigger: no paga',
);
assert.equal(
  debeProcesarLike('borrar', 'alice', ['bob']),
  true,
  'baja que sigue fuera: retira',
);
assert.equal(
  debeProcesarLike('borrar', 'alice', ['alice', 'bob']),
  false,
  'baja seguida de alta antes del trigger: no retira',
);
assert.equal(debeProcesarLike(null, 'alice', ['bob']), false, 'un update no paga ni retira');

// ──────────────────────────────────────────────────────────
// 5. Actualización optimista de la interfaz
// ──────────────────────────────────────────────────────────

const hilo = {
  id: 'hilo-1',
  title: 'Se conserva el resto del hilo',
  likedBy: ['bob'],
  likesCount: 1,
};
const hiloConAlice = ponerLikeLocal(hilo, 'alice', true);

assert.deepEqual(hiloConAlice.likedBy, ['bob', 'alice']);
assert.equal(hiloConAlice.likesCount, 2, 'el corazón y el contador cambian a la vez');
assert.equal(hiloConAlice.title, hilo.title, 'no se pierde ningún campo');
assert.deepEqual(hilo.likedBy, ['bob'], 'no se muta el estado anterior');

assert.equal(
  ponerLikeLocal(hiloConAlice, 'alice', true),
  hiloConAlice,
  'confirmar un estado ya visible no vuelve a sumar',
);
assert.deepEqual(
  ponerLikeLocal(hiloConAlice, 'alice', false),
  hilo,
  'si falla la escritura, la interfaz puede revertir el cambio',
);
assert.equal(
  ponerLikeLocal({ likedBy: ['alice'], likesCount: 0 }, 'alice', false).likesCount,
  0,
  'un dato antiguo desajustado nunca produce un contador negativo',
);

// El feed normal y la copia histórica (categorías, búsqueda,
// populares) tienen que recibir el mismo cambio. Si solo se
// actualizara una, el corazón no cambiaría al filtrar por categoría.
const feed = [{ ...hilo }];
const historico = [{ ...hilo }];
const feedActualizado = actualizarLikeEnLista(feed, 'hilo-1', 'alice', true);
const historicoActualizado = actualizarLikeEnLista(historico, 'hilo-1', 'alice', true);
assert.equal(feedActualizado[0].likesCount, 2);
assert.equal(historicoActualizado[0].likesCount, 2);
assert.deepEqual(feedActualizado[0].likedBy, ['bob', 'alice']);
assert.deepEqual(historicoActualizado[0].likedBy, ['bob', 'alice']);

// Una lista en la que no está el hilo se devuelve tal cual, para no
// repintar listas ajenas.
const otraLista = [{ ...hilo, id: 'hilo-2' }];
assert.equal(
  actualizarLikeEnLista(otraLista, 'hilo-1', 'alice', true),
  otraLista,
  'sin el hilo no se crea una copia nueva',
);

console.log('OK · lógica de "me gusta" por usuario');
