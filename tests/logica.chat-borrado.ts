// La ventana de 2 horas del borrado para todos, sin navegador.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// El plazo tiene bordes exactos y el cliente los usa para enseñar o
// esconder la opción "Eliminar para todos":
//
//   · 10 minutos → se puede.
//   · 1 h 59 min → se puede.
//   · 2 h justas → NO (el plazo es "menos de 2 horas").
//   · 3 horas → NO.
//   · Receptor → NUNCA, tenga la edad que tenga.
//   · Fecha rota o ausente → NO (sin creación fiable no hay
//     borrado global).
//
// La que MANDA es la del servidor, que repite la cuenta con su
// reloj. Esta solo decide qué se pinta.

import assert from 'node:assert/strict';

import { VENTANA_BORRADO_MS, puedeBorrarParaTodos } from '../src/utils/chatBorrado';

assert.equal(VENTANA_BORRADO_MS, 7_200_000, 'dos horas en milisegundos');

const YO = 'yo';
const OTRO = 'otro';

// Un "ahora" fijo para que los bordes no bailen entre la creación
// del mensaje y la comprobación.
const AHORA = Date.parse('2026-10-09T18:00:00.000Z');

const hace = (ms: number) => new Date(AHORA - ms).toISOString();
const MIN = 60_000;

// ═══════════════════════════════════════════════════════════
// EL AUTOR DENTRO DEL PLAZO
// ═══════════════════════════════════════════════════════════

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: hace(10 * MIN) }, YO, AHORA),
  true,
  '10 minutos: se puede',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: hace(119 * MIN) }, YO, AHORA),
  true,
  '1 h 59 min: todavía se puede',
);

// ═══════════════════════════════════════════════════════════
// LOS BORDES EXACTOS
// ═══════════════════════════════════════════════════════════

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: hace(VENTANA_BORRADO_MS) }, YO, AHORA),
  false,
  '2 horas justas: ya no (el plazo es MENOS de 2 horas)',
);

assert.equal(
  puedeBorrarParaTodos(
    { senderId: YO, createdAt: hace(VENTANA_BORRADO_MS - 1000) },
    YO,
    AHORA,
  ),
  true,
  'un segundo antes de las 2 horas: aún se puede',
);

assert.equal(
  puedeBorrarParaTodos(
    { senderId: YO, createdAt: hace(VENTANA_BORRADO_MS + 1000) },
    YO,
    AHORA,
  ),
  false,
  'un segundo después: ya no',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: hace(3 * 60 * MIN) }, YO, AHORA),
  false,
  '3 horas: no',
);

// ═══════════════════════════════════════════════════════════
// EL RECEPTOR NUNCA
// ═══════════════════════════════════════════════════════════

assert.equal(
  puedeBorrarParaTodos({ senderId: OTRO, createdAt: hace(10 * MIN) }, YO, AHORA),
  false,
  'reciente pero ajeno: no',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: OTRO, createdAt: hace(5 * 24 * 60 * MIN) }, YO, AHORA),
  false,
  'antiguo y ajeno: tampoco',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: hace(10 * MIN) }, null, AHORA),
  false,
  'sin sesión no se puede',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: hace(10 * MIN) }, undefined, AHORA),
  false,
  'ni con uid ausente',
);

// ═══════════════════════════════════════════════════════════
// FECHAS ROTAS
// ═══════════════════════════════════════════════════════════

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: 'no-es-fecha' }, YO, AHORA),
  false,
  'fecha ilegible: no',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: '' }, YO, AHORA),
  false,
  'fecha vacía: no',
);

assert.equal(
  puedeBorrarParaTodos({ senderId: YO, createdAt: undefined as never }, YO, AHORA),
  false,
  'fecha ausente: no',
);

console.log('  borrado para todos (ventana): OK');
