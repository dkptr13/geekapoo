// Citar mensajes: el fragmento y lo que se pinta si borran el citado.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// La cita guarda una foto fija del mensaje. Dos bordes:
//
//   1. Un mensaje sin texto (solo foto, GIF o ubicación) no tiene
//      palabras que citar: se guarda "[Foto]", "GIF" o "Ubicación".
//   2. Si el citado se borra para todos DESPUÉS, la cita no puede
//      seguir enseñando el texto que el borrado quitó.

import assert from 'node:assert/strict';

import {
  MAX_CITA,
  citaVisible,
  fragmentoParaCita,
} from '../src/utils/chatCita';

const base = {
  id: 'm1',
  senderName: 'Ana',
  body: 'Hola, ¿viste el capítulo de ayer?',
};

// ═══════════════════════════════════════════════════════════
// EL FRAGMENTO
// ═══════════════════════════════════════════════════════════

assert.equal(
  fragmentoParaCita(base),
  'Hola, ¿viste el capítulo de ayer?',
  'con texto, el texto tal cual',
);

assert.equal(
  fragmentoParaCita({ ...base, body: 'x'.repeat(200) }).length,
  MAX_CITA,
  'el texto largo se recorta',
);

assert.equal(
  fragmentoParaCita({ ...base, body: '  ', imageUrl: 'https://x/y.webp' }),
  '[Foto]',
  'foto sin texto: [Foto]',
);

assert.equal(
  fragmentoParaCita({ ...base, body: '', gif: { url: 'https://x/y.gif' } }),
  'GIF',
  'GIF sin texto: GIF',
);

assert.equal(
  fragmentoParaCita({ ...base, body: '', location: { lat: 1, lng: 2 } }),
  'Ubicación',
  'ubicación sin texto: Ubicación',
);

assert.equal(
  fragmentoParaCita({ ...base, body: '' }),
  '',
  'vacío total: no rompe',
);

// El texto manda sobre el adjunto: una foto CON pie se cita por el pie.
assert.equal(
  fragmentoParaCita({ ...base, imageUrl: 'https://x/y.webp' }),
  base.body,
  'con texto y foto, el texto',
);

// ═══════════════════════════════════════════════════════════
// SI BORRAN EL CITADO
// ═══════════════════════════════════════════════════════════

assert.equal(
  citaVisible('Hola', true),
  'Este mensaje fue eliminado',
  'citado borrado: el marcador, no el texto guardado',
);

assert.equal(
  citaVisible('Hola', false),
  'Hola',
  'citado intacto: lo guardado',
);

assert.equal(
  citaVisible('Hola', undefined),
  'Hola',
  'citado fuera de la lista (antiguo): lo guardado tal cual',
);

console.log('  citas de mensajes: OK');
