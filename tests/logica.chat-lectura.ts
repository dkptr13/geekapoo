// La barra de "mensajes nuevos" del chat, sin navegador y sin React.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// El punto de "sin leer" no se quitaba hasta que contestabas. La causa
// no era el cálculo de sin leer, sino una diferencia de 219 ms entre
// dos escrituras del MISMO envío:
//
//   1º setDoc(mensaje) → createdAt     = serverTimestamp  (…24.634)
//   2º updateDoc(chat) → lastMessageAt = serverTimestamp  (…24.853)
//
// La marca de lectura guardaba `createdAt` (la primera), y el cálculo
// de sin leer comparaba `lastMessageAt <= readAt`, o sea `853 <= 634`,
// que es falso. El punto no se iba nunca, y lo único que lo quitaba
// era la regla que ignora los chats cuyo último mensaje es tuyo, es
// decir: contestar.
//
// ── LO QUE COMPRUEBA ESTE ARCHIVO ────────────────────────────────
//
//   · La frontera cae en el PRIMER mensaje nuevo, no en el último.
//   · Lo que tú escribiste nunca cuenta como nuevo.
//   · Sin marca de lectura, todo lo de los demás es nuevo.
//   · Una marca corrupta deja cero nuevos, no todos.
//   · El texto de la barra concuerda en singular y plural.

import assert from 'node:assert/strict';

import {
  SIN_NUEVOS,
  corteDeNuevos,
  cuentaDeNuevos,
  textoDeNuevos,
  type MensajeLectura,
} from '../src/utils/chatLectura';

// ═══════════════════════════════════════════════════════════
// LOS DATOS
// ═══════════════════════════════════════════════════════════

const YO = 'yo';
const OTRO = 'otro';

const m = (n: number, senderId: string, createdAt: string): MensajeLectura => ({
  id: `m${n}`,
  senderId,
  createdAt,
});

/**
 * Reproduce el caso real: la marca de lectura quedó 219 ms ANTES que
 * la fecha del mensaje, porque venía de la primera de las dos
 * escrituras.
 */
const MARCA = '2026-10-09T16:21:24.634Z';
const MENSAJE_NUEVO = '2026-10-09T16:21:24.853Z';
const VIEJO = '2026-10-08T10:00:00.000Z';

// ═══════════════════════════════════════════════════════════
// LA FRONTERA CAE EN EL PRIMER NUEVO
// ═══════════════════════════════════════════════════════════

{
  const lista = [
    m(1, OTRO, VIEJO),
    m(2, YO, VIEJO),
    m(3, OTRO, MENSAJE_NUEVO),
    m(4, OTRO, '2026-10-09T17:00:00.000Z'),
  ];

  const r = corteDeNuevos(lista, MARCA, YO);

  assert.equal(r.indice, 2, 'la barra va justo antes del primer mensaje nuevo');
  assert.equal(r.total, 2, 'y cuenta los dos nuevos');
  assert.equal(
    cuentaDeNuevos(lista, MARCA, YO),
    2,
    'el contador del rooms list dice lo mismo',
  );
}

// ═══════════════════════════════════════════════════════════
// LO QUE ES TUYO NO ES NUEVO
// ═══════════════════════════════════════════════════════════

{
  // Escribes tú después de la marca. Obviamente no es "nuevo": lo
  // escribiste tú. Y aun así es POSTERIOR a la marca, así que este
  // es el caso que separa "posterior" de "nuevo".
  const lista = [
    m(1, OTRO, VIEJO),
    m(2, YO, '2026-10-09T18:00:00.000Z'),
  ];

  const r = corteDeNuevos(lista, MARCA, YO);

  assert.deepEqual(r, SIN_NUEVOS, 'contestar no genera una barra de nuevos');
}

{
  // Uno mío en medio, entre dos del otro. La barra va al primer
  // nuevo, saltándose el mío, y el total cuenta solo los ajenos.
  const lista = [
    m(1, OTRO, VIEJO),
    m(2, OTRO, MENSAJE_NUEVO),
    m(3, YO, '2026-10-09T17:00:00.000Z'),
    m(4, OTRO, '2026-10-09T17:30:00.000Z'),
  ];

  const r = corteDeNuevos(lista, MARCA, YO);

  assert.equal(r.indice, 1, 'la barra se planta en el primero');
  assert.equal(r.total, 2, 'y el total no cuenta el tuyo');
}

// ═══════════════════════════════════════════════════════════
// SIN MARCA: EN UNA CONVERSACIÓN NUEVA
// ═══════════════════════════════════════════════════════════

{
  // La marca solo se escribe al CREAR el chat, y solo para quien lo
  // crea. Quien acepta la solicitud entra sin marca, así que todo lo
  // que haya es nuevo para él.
  const lista = [m(1, YO, VIEJO), m(2, OTRO, MENSAJE_NUEVO)];

  assert.deepEqual(
    corteDeNuevos(lista, undefined, YO),
    { indice: 1, total: 1 },
    'sin marca, lo del otro es nuevo',
  );

  assert.deepEqual(
    corteDeNuevos(lista, null, YO),
    { indice: 1, total: 1 },
    'y null se trata igual que undefined',
  );

  assert.deepEqual(
    corteDeNuevos([m(1, YO, VIEJO)], undefined, YO),
    SIN_NUEVOS,
    'pero lo tuyo solo, no es nuevo',
  );
}

// ═══════════════════════════════════════════════════════════
// UNA MARCA CORRUPTA
// ═══════════════════════════════════════════════════════════

{
  // Si `Date.parse` no entiende la marca, el resultado es `NaN`, y al
  // comparar `NaN` siempre da `false`. Sin el filtro, TODOS los
  // mensajes saldrían como nuevos y la barra aparecería arriba del
  // todo de una conversación ya leída.
  const lista = [m(1, OTRO, VIEJO), m(2, OTRO, MENSAJE_NUEVO)];

  assert.deepEqual(
    corteDeNuevos(lista, 'no-es-una-fecha', YO),
    SIN_NUEVOS,
    'una marca ilegible no convierte el historial entero en nuevo',
  );
}

{
  // Y un mensaje con la fecha rota se salta en vez de romper el bucle.
  const lista = [m(1, OTRO, 'tampoco-es-fecha'), m(2, OTRO, MENSAJE_NUEVO)];

  const r = corteDeNuevos(lista, MARCA, YO);

  assert.equal(r.indice, 1, 'el roto se salta y el bueno se detecta');
}

// ═══════════════════════════════════════════════════════════
// NADA QUE DIBUJAR
// ═══════════════════════════════════════════════════════════

assert.deepEqual(corteDeNuevos([], MARCA, YO), SIN_NUEVOS, 'conversación vacía');
assert.deepEqual(corteDeNuevos([], undefined, YO), SIN_NUEVOS, 'ni sin marca');

{
  // Todo lo que hay es anterior a la marca: leído, no nuevo.
  const lista = [m(1, OTRO, VIEJO), m(2, OTRO, '2026-10-09T16:00:00.000Z')];

  assert.deepEqual(
    corteDeNuevos(lista, MARCA, YO),
    SIN_NUEVOS,
    'anterior o igual a la marca ya estaba leído',
  );
}

{
  // Justo en la marca: leído. El mensaje se guardó a la vez que la
  // marca se puso, así que no puede considerarse pendiente.
  const r = corteDeNuevos([m(1, OTRO, MARCA)], MARCA, YO);

  assert.deepEqual(r, SIN_NUEVOS, 'la marca exacta cuenta como leído');
}

assert.deepEqual(
  corteDeNuevos([m(1, OTRO, MENSAJE_NUEVO)], MARCA, undefined),
  { indice: 0, total: 1 },
  'sin uid no hay mensajes propios que descartar',
);

assert.deepEqual(
  corteDeNuevos([m(1, 'x', MENSAJE_NUEVO)], MARCA, null),
  { indice: 0, total: 1 },
  'y con null tampoco',
);

// ═══════════════════════════════════════════════════════════
// EL TEXTO DE LA BARRA
// ═══════════════════════════════════════════════════════════

assert.equal(textoDeNuevos(1), '1 mensaje nuevo', 'singular');
assert.equal(textoDeNuevos(2), '2 mensajes nuevos', 'plural');
assert.equal(textoDeNuevos(37), '37 mensajes nuevos', 'y muchos');

{
  // El caso que sale al recibir el primer mensaje en una conversación
  // nueva: una barra que dice "1 mensajes nuevos" parece un error de
  // la web, y es la primera impresión al usar el chat.
  assert.equal(
    corteDeNuevos([m(1, OTRO, MENSAJE_NUEVO)], MARCA, YO).total,
    1,
    'el caso real de un solo mensaje nuevo',
  );
  assert.equal(textoDeNuevos(1), '1 mensaje nuevo', 'y sale bien escrito');
}

assert.equal(textoDeNuevos(0), '1 mensaje nuevo', 'cero no se pinta, pero no inventa plural');
assert.equal(textoDeNuevos(-3), '1 mensaje nuevo', 'y un negativo tampoco');

console.log('  barra de mensajes nuevos: OK');
