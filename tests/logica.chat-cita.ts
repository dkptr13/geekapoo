// Citar mensajes: texto canónico, fragmento y lo que se pinta si
// borran el citado.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// La cita guarda una foto fija del mensaje. Tres bordes:
//
//   1. Un mensaje sin texto (solo foto, GIF o ubicación) no tiene
//      palabras que citar: se guarda "[Foto]", "GIF" o "Ubicación".
//   2. Si el citado se borra para todos DESPUÉS, la cita no puede
//      seguir enseñando el texto que el borrado quitó.
//   3. Las reglas comparan la cita EXACTA con el mensaje real. No
//      tienen `slice`, así que el texto canónico no se puede
//      recortar: el recorte es solo de la vista.
//
// Por eso hay dos funciones con el mismo origen y distinto uso:
// `textoParaCita` (completo, lo que se guarda y validan las reglas)
// y `fragmentoParaCita` (recortado, lo que se pinta).

import assert from 'node:assert/strict';

import {
  MAX_CITA,
  citaVisible,
  fragmentoParaCita,
  textoParaCita,
} from '../src/utils/chatCita';

const base = {
  id: 'm1',
  senderName: 'Ana',
  body: 'Hola, ¿viste el capítulo de ayer?',
};

// ═══════════════════════════════════════════════════════════
// EL TEXTO CANÓNICO (LO QUE GUARDA LA CITA Y VALIDAN LAS REGLAS)
// ═══════════════════════════════════════════════════════════

assert.equal(
  textoParaCita(base),
  'Hola, ¿viste el capítulo de ayer?',
  'con texto, el texto completo',
);

// La clave de F4: si se recortara aquí, las reglas no podrían
// comparar la cita con el mensaje real (no tienen `slice`).
const largo = 'x'.repeat(4000);

assert.equal(
  textoParaCita({ ...base, body: largo }),
  largo,
  'el texto largo NO se recorta: la regla compara exacto',
);

assert.equal(
  textoParaCita({ ...base, body: '  Hola  ' }),
  'Hola',
  'los espacios de los extremos se quitan, como en la regla',
);

assert.equal(
  textoParaCita({ ...base, body: '  ', imageUrl: 'https://x/y.webp' }),
  '[Foto]',
  'foto sin texto: [Foto]',
);

assert.equal(
  textoParaCita({ ...base, body: '', gif: { url: 'https://x/y.gif' } }),
  'GIF',
  'GIF sin texto: GIF',
);

assert.equal(
  textoParaCita({ ...base, body: '', location: { lat: 1, lng: 2 } }),
  'Ubicación',
  'ubicación sin texto: Ubicación',
);

assert.equal(
  textoParaCita({
    ...base,
    body: '',
    poll: { question: '  ¿Sí o no?  ' },
  }),
  '📊 ¿Sí o no?',
  'encuesta sin texto: la pregunta canónica',
);

assert.equal(
  textoParaCita({ ...base, body: '', poll: {} }),
  '📊 Encuesta',
  'encuesta sin pregunta: el marcador',
);

assert.equal(
  textoParaCita({
    ...base,
    body: '',
    tierList: { title: '  Mejores animes  ' },
  }),
  '🏆 Mejores animes',
  'tier list sin texto: el título canónico',
);

assert.equal(
  textoParaCita({ ...base, body: '', tierList: {} }),
  '🏆 Tier list',
  'tier list sin título: el marcador',
);

assert.equal(
  textoParaCita({ ...base, body: '' }),
  '',
  'vacío total: no rompe',
);

// El texto manda sobre el adjunto: una foto CON pie se cita por el pie.
assert.equal(
  textoParaCita({ ...base, imageUrl: 'https://x/y.webp' }),
  base.body,
  'con texto y foto, el texto',
);

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
