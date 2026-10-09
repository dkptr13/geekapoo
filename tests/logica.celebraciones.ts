// Lo celebrado no se repite: el almacén persistente, sin navegador.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// El aviso de medalla salía en CADA inicio de sesión. La causa de
// fondo: "visto" vivía en un `ref`, que muere con el componente. Cada
// remontaje, cada cambio de usuario y cada primera lectura con el
// documento vacío volvía a empezar de cero.
//
// Ahora lo visto vive en `localStorage` por usuario. Estos tests usan
// un guardado falso en memoria, porque en Node no hay `localStorage`:
// lo que se comprueba es el contrato, no el navegador.
//
// ── LO QUE SE COMPRUEBA ───────────────────────────────────────────
//
//   · Apuntar y leer: lo apuntado consta, lo demás no.
//   · Cada usuario va por su cuenta.
//   · Un guardado roto o ausente no rompe: devuelve vacío.
//   · Solo viajan textos: un número colado no se apunta.

import assert from 'node:assert/strict';

import {
  apuntarCelebradas,
  guardadoNavegador,
  leerCelebradas,
  type GuardadoCelebraciones,
} from '../src/utils/celebraciones';

/** Un `localStorage` de mentira, en memoria. */
function falsoGuardado(inicial: Record<string, string> = {}): GuardadoCelebraciones {
  const caja = new Map(Object.entries(inicial));

  return {
    getItem: (k: string) => caja.get(k) ?? null,
    setItem: (k: string, v: string) => {
      caja.set(k, v);
    },
  };
}

// ═══════════════════════════════════════════════════════════
// APUNTAR Y LEER
// ═══════════════════════════════════════════════════════════

{
  const g = falsoGuardado();

  assert.deepEqual(
    [...leerCelebradas(g, 'yo')],
    [],
    'al principio no hay nada celebrado',
  );

  const trasPrimera = apuntarCelebradas(g, 'yo', leerCelebradas(g, 'yo'), [
    'medal_miembro_fundador',
    'medal_primera_voz',
  ]);

  assert.ok(trasPrimera.has('medal_miembro_fundador'), 'lo apuntado consta');
  assert.ok(trasPrimera.has('medal_primera_voz'), 'lo otro también');

  // Y al volver a leer (otro inicio de sesión), sigue ahí.
  const releido = leerCelebradas(g, 'yo');

  assert.ok(releido.has('medal_miembro_fundador'), 'persiste entre lecturas');
  assert.equal(releido.size, 2, 'sin duplicados ni añadidos');
}

// ═══════════════════════════════════════════════════════════
// CADA USUARIO POR SU CUENTA
// ═══════════════════════════════════════════════════════════

{
  const g = falsoGuardado();

  apuntarCelebradas(g, 'ana', leerCelebradas(g, 'ana'), ['medal_x']);

  assert.ok(!leerCelebradas(g, 'pepe').has('medal_x'), 'lo de Ana no es lo de Pepe');
  assert.ok(leerCelebradas(g, 'ana').has('medal_x'), 'y lo de Ana sigue');
}

// ═══════════════════════════════════════════════════════════
// UN GUARDADO ROTO NO ROMPE
// ═══════════════════════════════════════════════════════════

{
  // Sin guardado (privado, SSR, test): vacío, sin celebrar de más.
  assert.deepEqual([...leerCelebradas(null, 'yo')], [], 'sin guardado no hay nada');
  assert.deepEqual([...leerCelebradas(undefined, 'yo')], [], 'ni con undefined');

  const nulo = apuntarCelebradas(null, 'yo', new Set(['a']), ['b']);

  assert.ok(nulo.has('a') && nulo.has('b'), 'pero en memoria se apunta igual');

  // Contenido corrupto: se ignora, no se celebra de más ni se rompe.
  const roto = falsoGuardado({ geekapoo_celebrado_yo: 'esto no es json' });

  assert.deepEqual([...leerCelebradas(roto, 'yo')], [], 'json roto equivale a vacío');

  const numero = falsoGuardado({ geekapoo_celebrado_yo: '42' });

  assert.deepEqual([...leerCelebradas(numero, 'yo')], [], 'un número no es una lista');
}

// ═══════════════════════════════════════════════════════════
// SOLO VIAJAN TEXTOS
// ═══════════════════════════════════════════════════════════

{
  const mezclado = falsoGuardado({
    geekapoo_celebrado_yo: JSON.stringify(['medal_a', 7, null, 'medal_b']),
  });

  const leido = leerCelebradas(mezclado, 'yo');

  assert.ok(leido.has('medal_a') && leido.has('medal_b'), 'los textos pasan');
  assert.equal(leido.size, 2, 'y lo demás se filtra');
}

// ═══════════════════════════════════════════════════════════
// EL GUARDADO DEL NAVEGADOR FUERA DEL NAVEGADOR
// ═══════════════════════════════════════════════════════════

{
  // En Node no hay `localStorage`: tiene que devolver `null` en vez
  // de reventar, para que el contexto siga funcionando (en memoria).
  assert.equal(guardadoNavegador(), null, 'sin localStorage no hay guardado');
}

console.log('  celebraciones persistentes: OK');
