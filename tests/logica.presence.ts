/**
 * Comprobaciones de la presencia visible, sin red.
 *
 * `npm run test:logica` ejecuta este archivo.
 */
import assert from 'node:assert/strict';

import { estadoPresencia, ONLINE_WINDOW_MS } from '../src/utils/presence';

const ahora = Date.parse('2026-11-02T12:00:00.000Z');

assert.deepEqual(
  estadoPresencia(
    { online: true, lastSeenAt: new Date(ahora - 30_000).toISOString() },
    ahora,
  ),
  { online: true, label: 'En línea' },
  'un latido reciente está en línea',
);

assert.equal(
  estadoPresencia(
    { online: true, lastSeenAt: new Date(ahora - ONLINE_WINDOW_MS - 1).toISOString() },
    ahora,
  ).online,
  false,
  'online:true caduca si el latido es demasiado antiguo',
);

assert.equal(
  estadoPresencia({ online: false, lastSeenAt: null }, ahora).label,
  'Desconectado',
);

assert.equal(
  estadoPresencia(
    { online: false, lastSeenAt: new Date(ahora - 20_000).toISOString() },
    ahora,
  ).label,
  'Hace un momento',
);

assert.equal(
  estadoPresencia(
    { online: false, lastSeenAt: new Date(ahora - 5 * 60_000).toISOString() },
    ahora,
  ).label,
  'Últ. vez hace 5 min',
);

assert.equal(
  estadoPresencia(
    { online: false, lastSeenAt: new Date(ahora - 3 * 60 * 60_000).toISOString() },
    ahora,
  ).label,
  'Últ. vez hace 3 h',
);

assert.equal(
  estadoPresencia(
    { online: false, lastSeenAt: new Date(ahora - 2 * 24 * 60 * 60_000).toISOString() },
    ahora,
  ).label,
  'Últ. vez hace 2 d',
);

console.log('OK · presencia visible');
