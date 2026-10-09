/**
 * Comprobaciones de la LÓGICA de reacciones, sin navegador y sin
 * emulador.
 *
 * Existe por un motivo concreto: el bug de los contadores que no
 * se pintaban NO daba ningún error. El hook comparaba la clave de
 * un objetivo construida con un separador ("thread:abc") contra la
 * que devolvía `reactionKey()` ("thread_abc"), el filtro no
 * coincidía con nada y todas las reacciones se descartaban en
 * silencio. El botón de "reaccionar" seguía funcionando (usa
 * `mia`, otra lista), así que la web parecía viva y los
 * contadores no aparecían nunca.
 *
 * Estos asserts son la red que habría atrapado eso: son rápidos de
 * escribir y tardan cero segundos.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import { EMOJIS, EMOJI_POR_CLAVE } from '../src/data/emojis';
import type { ReactionCounts } from '../src/types';

// Se importa el módulo PURO a propósito: si este test sacara las
// funciones de `services/reactions.ts`, cargaría `lib/firebase` y
// `import.meta.env` no existiría fuera de Vite, que es
// justamente lo que hizo falta separar.
import {
  MAX_PASTILLAS,
  REACCIONES_VACIAS,
  clavesParaAgrupar,
  idsParaConsulta,
  reactionKey,
  sumar,
  topReacciones,
  totalReacciones,
} from '../src/services/reactionLogic';

// ──────────────────────────────────────────────────────────
// 0. El catálogo tiene que ser coherente consigo mismo
// ──────────────────────────────────────────────────────────
//
// Esto ya ha roto una vez: había dos emojis con la clave "cry"
// (el 😭 destacado y el 😢 de la categoría caras). No daba error
// en ninguna parte, pero el índice `EMOJI_POR_CLAVE` se quedaba
// con la última entrada, así que el 😭 de las reacciones —que es
// una de las cinco originales— se pintaba como una lágrima.

const claves = EMOJIS.map((e) => e.key);
const clavesRepetidas = claves.filter((k, i) => claves.indexOf(k) !== i);
assert.deepEqual(
  clavesRepetidas,
  [],
  `claves de emoji repetidas en el catálogo: ${clavesRepetidas.join(', ')}`,
);

const emojisRepetidos = EMOJIS.map((e) => e.emoji).filter(
  (c, i, todos) => todos.indexOf(c) !== i,
);
assert.deepEqual(
  emojisRepetidos,
  [],
  `emojis repetidos en el catálogo: ${emojisRepetidos.join(' ')}`,
);

assert.equal(
  Object.keys(EMOJI_POR_CLAVE).length,
  EMOJIS.length,
  'el índice por clave tiene que tener una entrada por emoji',
);

// Las cinco de siempre, con su emoji de siempre. Si alguien las
// renombra o les cambia el emoji, las reacciones ya guardadas en
// Firestore dejan de pintarse.
assert.equal(EMOJI_POR_CLAVE.fire?.emoji, '🔥');
assert.equal(EMOJI_POR_CLAVE.shocked?.emoji, '😱');
assert.equal(EMOJI_POR_CLAVE.laugh?.emoji, '😂');
assert.equal(EMOJI_POR_CLAVE.cry?.emoji, '😭', 'la reacción 😭 no puede ser la lágrima');
assert.equal(EMOJI_POR_CLAVE.trophy?.emoji, '🏆');

// ──────────────────────────────────────────────────────────
// 1. La consulta y el mapa usan formatos DISTINTOS
// ──────────────────────────────────────────────────────────
//
// Este es el bug que hizo que los contadores no se vieran: la
// consulta pedía `where('targetId', 'in', [reactionKey(...)])`,
// es decir, "thread_demo-thread-kaguya", cuando el campo
// `targetId` vale "demo-thread-kaguya". La consulta no fallaba:
// devolvía CERO documentos, siempre y sin avisar.
//
// La diferencia entre "pedir" y "agrupar" es de un carácter, así
// que se comprueba aquí con ids reales.

const objetivosReales = [
  { targetType: 'thread' as const, targetId: 'demo-thread-kaguya' },
  { targetType: 'thread' as const, targetId: 'demo-thread-frieren' },
  // Un comentario que casualmente tiene el mismo id que un hilo:
  // por eso el mapa necesita el tipo dentro.
  { targetType: 'comment' as const, targetId: 'demo-thread-kaguya' },
];

const paraLaConsulta = idsParaConsulta(objetivosReales);
const paraAgrupar = clavesParaAgrupar(objetivosReales);

assert.deepEqual(
  paraLaConsulta,
  ['demo-thread-frieren', 'demo-thread-kaguya'],
  'a Firestore se le piden los targetId CRUDOS',
);
assert.ok(
  !paraLaConsulta.includes('thread_demo-thread-kaguya'),
  'NO se le pide ninguna clave con el tipo dentro',
);

assert.ok(paraAgrupar.has('thread_demo-thread-kaguya'), 'el hilo está en el mapa');
assert.ok(paraAgrupar.has('comment_demo-thread-kaguya'), 'el comentario con el mismo id también');
assert.equal(paraAgrupar.size, 3, 'y no se pisan entre sí');

// Y el filtro del hook: de lo que vuelve de la consulta solo pasa
// lo que es del tipo que se está mirando.
function filtrarComoElHook(documentos: {
  targetType: string;
  targetId: string;
  type: string;
}[]) {
  const salida: Record<string, ReactionCounts> = {};

  documentos.forEach((d) => {
    const key = reactionKey(d.targetType as 'thread', d.targetId);
    if (!paraAgrupar.has(key)) return;
    salida[key] = sumar(salida[key] ?? {}, d.type, 1);
  });

  return salida;
}

const loQueVuelveFirestore = [
  // Dos reacciones del hilo, de dos personas distintas.
  { targetType: 'thread', targetId: 'demo-thread-kaguya', type: 'cry' },
  { targetType: 'thread', targetId: 'demo-thread-kaguya', type: 'laugh' },
  // Una del comentario con el MISMO id.
  { targetType: 'comment', targetId: 'demo-thread-kaguya', type: 'cry' },
  // Y una de un hilo que no está en pantalla: la consulta por
  // targetId no la trae, pero si algún día la trajera, el filtro
  // la descarta.
  { targetType: 'thread', targetId: 'otro-hilo', type: 'fire' },
];

const agrupado = filtrarComoElHook(loQueVuelveFirestore);

assert.deepEqual(
  agrupado['thread_demo-thread-kaguya'],
  { cry: 1, laugh: 1 },
  'el hilo ve las dos reacciones de los demás, con su contador',
);
assert.deepEqual(agrupado['comment_demo-thread-kaguya'], { cry: 1 }, 'el comentario ve la suya');
assert.equal(
  Object.keys(agrupado).length,
  2,
  'y el hilo NO se come la reacción del comentario que tiene el mismo id',
);

// La regresión exacta: si la consulta usara las claves, no
// llegaría nada y esto se quedaría a cero.
assert.notDeepEqual(agrupado, {}, 'con las claves en la consulta esto estaría vacío');

// ──────────────────────────────────────────────────────────
// 2. Solo se pintan las tres más puestas
// ──────────────────────────────────────────────────────────

const muchos: ReactionCounts = {
  fire: 5,
  laugh: 12,
  cry: 3,
  heart: 20,
  skull: 1,
};

assert.equal(MAX_PASTILLAS, 3, 'tres pastillas, no cinco ni diez');

const top = topReacciones(muchos);
assert.equal(top.length, MAX_PASTILLAS, 'solo tres pastillas');
assert.deepEqual(top, ['heart', 'laugh', 'fire'], 'de más a menos votos');
assert.equal(totalReacciones(muchos), 5, 'pero se sabe que hay cinco en total');
assert.equal(
  totalReacciones(muchos) - top.length,
  2,
  'y por eso aparece la pastilla "+2"',
);

// ──────────────────────────────────────────────────────────
// 3. Empate: manda el orden del catálogo y no recoloca solo
// ──────────────────────────────────────────────────────────

const empatados: ReactionCounts = { fire: 4, laugh: 4, cry: 4, heart: 4 };

assert.deepEqual(
  topReacciones(empatados),
  topReacciones(empatados),
  'con empate el orden es estable',
);
assert.deepEqual(
  topReacciones(empatados),
  ['fire', 'laugh', 'cry'],
  'y es el orden del catálogo',
);

const ordenCatalogo = EMOJIS.map((e) => e.key);
assert.ok(
  ordenCatalogo.indexOf('fire') < ordenCatalogo.indexOf('laugh'),
  'fire va antes que laugh en el catálogo',
);
assert.deepEqual(
  topReacciones({ laugh: 1, fire: 1 }),
  ['fire', 'laugh'],
  'el desempate no depende del orden del objeto',
);

// ──────────────────────────────────────────────────────────
// 4. Casos raros
// ──────────────────────────────────────────────────────────

assert.deepEqual(topReacciones({}), [], 'nada pintado si nadie ha reaccionado');
assert.equal(totalReacciones({}), 0);

assert.deepEqual(
  topReacciones({ no_existe_en_el_catalogo: 9, fire: 1 }),
  ['fire'],
  'una clave que no está en el catálogo no se pinta',
);
assert.deepEqual(
  topReacciones({ fire: 0, laugh: 2 }),
  ['laugh'],
  'un emoji con cero votos no aparece',
);
assert.equal(
  topReacciones({ fire: 1 }, 99).length,
  1,
  'pedir más de tres sigue funcionando (el catálogo entero del chat)',
);

// ──────────────────────────────────────────────────────────
// 5. Una persona, un documento
// ──────────────────────────────────────────────────────────
//
// Dos personas con 🔥 son dos documentos y suman 2. Si esto no
// fuera así, cambiar de reacción crearía un segundo documento y
// el contador iría a más.

const dosPersonas = sumar(sumar({}, 'fire', 1), 'fire', 1);
assert.equal(dosPersonas.fire, 2, 'dos personas, dos votos');
assert.equal(Object.keys(dosPersonas).length, 1, 'pero una sola clave');
assert.equal(
  sumar(dosPersonas, 'fire', -1).fire,
  1,
  'y quitar una reacción baja el contador en uno',
);

// ──────────────────────────────────────────────────────────
// 6. El caso "sin reacciones" de la barra
// ──────────────────────────────────────────────────────────

assert.equal(REACCIONES_VACIAS.total, 0);
assert.deepEqual(REACCIONES_VACIAS.counts, {});
assert.deepEqual(REACCIONES_VACIAS.nombres, {});

console.log('✓ lógica de reacciones: todo correcto');
console.log('  · a Firestore se piden los targetId CRUDOS, no las claves del mapa');
console.log('  · un hilo y un comentario con el mismo id no se pisan');
console.log(`  · se pintan las ${MAX_PASTILLAS} más puestas y el resto con "+N"`);
console.log('  · los empates no recolocan las pastillas');
console.log('  · dos personas con el mismo emoji = 2 votos');
