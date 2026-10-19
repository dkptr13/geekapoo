/**
 * Preferencias por conversación: saneo de `ChatPrefs`.
 *
 * Lógica pura de `src/services/chatPrefs.ts`, sin React ni
 * Firebase. Lo que se guarda en `chats/{chatId}/prefs/{uid}`
 * pasa por `sujetarPrefs`, así que si un formato se cuela, el
 * test lo señala aquí.
 *
 *   npx tsx tests/logica.chat-prefs.ts
 */
import assert from 'node:assert/strict';

import { sujetarPrefs } from '../src/data/chatPrefs.ts';

// Campo vacío → objeto vacío (sin claves basura).
assert.deepEqual(sujetarPrefs(null), {});
assert.deepEqual(sujetarPrefs(undefined), {});
assert.deepEqual(sujetarPrefs(''), {});

// Válidos: se guardan tal cual.
assert.deepEqual(
  sujetarPrefs({
    color: '#7C3AED',
    nickname: '  Mi apodo  ',
    notify: 'mentions',
    muteUntil: '1h',
    favorite: true,
  }),
  {
    color: '#7c3aed',
    nickname: 'Mi apodo',
    notify: 'mentions',
    muteUntil: '1h',
    favorite: true,
  },
);

// Color: solo hex de 7 caracteres (# + 6).
assert.deepEqual(sujetarPrefs({ color: '#fff' }), {});
assert.deepEqual(sujetarPrefs({ color: 'rojo' }), {});
assert.deepEqual(sujetarPrefs({ color: '#1234567' }), {});
assert.deepEqual(sujetarPrefs({ color: '#GGGGGG' }), {});
assert.deepEqual(sujetarPrefs({ color: '#059669' }), { color: '#059669' });

// Apodo: recorta a 60 caracteres y limpia espacios.
assert.deepEqual(sujetarPrefs({ nickname: '' }), {});
assert.deepEqual(sujetarPrefs({ nickname: '   ' }), {});
const largo = 'a'.repeat(80);
assert.equal(sujetarPrefs({ nickname: largo }).nickname?.length, 60);

// Notify: solo 'all' | 'mentions' | 'muted'.
assert.deepEqual(sujetarPrefs({ notify: 'all' }), { notify: 'all' });
assert.deepEqual(sujetarPrefs({ notify: 'mentions' }), { notify: 'mentions' });
assert.deepEqual(sujetarPrefs({ notify: 'muted' }), { notify: 'muted' });
assert.deepEqual(sujetarPrefs({ notify: 'nada' }), {});
assert.deepEqual(sujetarPrefs({ notify: 'ALL' }), {});

// MuteUntil: solo '1h' | '8h' | '24h' | 'until'.
assert.deepEqual(sujetarPrefs({ muteUntil: '1h' }), { muteUntil: '1h' });
assert.deepEqual(sujetarPrefs({ muteUntil: '8h' }), { muteUntil: '8h' });
assert.deepEqual(sujetarPrefs({ muteUntil: '24h' }), { muteUntil: '24h' });
assert.deepEqual(sujetarPrefs({ muteUntil: 'until' }), { muteUntil: 'until' });
assert.deepEqual(sujetarPrefs({ muteUntil: 'semana' }), {});

// Favorite: solo true (false no se guarda para no ensuciar).
assert.deepEqual(sujetarPrefs({ favorite: true }), { favorite: true });
assert.deepEqual(sujetarPrefs({ favorite: false }), {});
assert.deepEqual(sujetarPrefs({ favorite: 'sí' }), {});

// Unknowns: se ignoran.
assert.deepEqual(sujetarPrefs({ hacker: 'x' }), {});

// Test 20: mutado sin muteUntil → se conserva (el panel lo pide aparte).
assert.deepEqual(sujetarPrefs({ notify: 'muted' }), { notify: 'muted' });

// ── El fondo va POR CONVERSACIÓN ─────────────────────────
// Sin la clave `fondo`, la conversación nunca se tocó: se usa el
// fondo general. Con `fondo: null`, esta conversación está sin
// fondo. Las dos cosas son distintas y se guardan distintas.
assert.deepEqual(sujetarPrefs({ color: '#7c3aed' }), { color: '#7c3aed' });
assert.equal('fondo' in sujetarPrefs({ color: '#7c3aed' }), false);

const conFondo = sujetarPrefs({ fondo: { url: 'https://x/y.jpg', dim: 12 } });
assert.equal(conFondo.fondo?.url, 'https://x/y.jpg');
assert.equal(conFondo.fondo?.dim, 12);
assert.equal(conFondo.fondo?.ajuste, 'cover');
assert.equal(conFondo.fondo?.position, 'center');

const sinFondo = sujetarPrefs({ fondo: null });
assert.equal('fondo' in sinFondo, true);
assert.equal(sinFondo.fondo, null);

// Un fondo con forma rara se limpia, no se cuela.
const raro = sujetarPrefs({ fondo: { url: 'no-es-una-url', dim: 999 } });
assert.equal(raro.fondo, null);
const ajustado = sujetarPrefs({
  fondo: { url: 'https://x/y.jpg', dim: 999, ajuste: 'contain', position: 'top' },
});
assert.equal(ajustado.fondo?.dim, 80);
assert.equal(ajustado.fondo?.ajuste, 'contain');
assert.equal(ajustado.fondo?.position, 'top');

console.log('  chat-prefs: TODO CORRECTO');
