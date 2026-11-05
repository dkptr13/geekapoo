/**
 * Comprobaciones del sistema de identidad.
 *
 *   npx tsx tests/logica.usuarios.ts
 *
 * Lo importante: el @usuario es único, permanente y normalizado; el
 * nombre visible puede repetirse; las listas de reservados de la web
 * y de Functions son la misma; y el plazo de 7 días se calcula bien.
 */
import assert from 'node:assert/strict';

import {
  DISPLAY_NAME_COOLDOWN_DAYS,
  DISPLAY_NAME_MAX,
  RESERVED_USERNAMES,
  displayNameValido,
  errorDisplayName,
  errorUsername,
  normalizarDisplayName,
  normalizarUsername,
  puedeCambiarDisplayName,
  siguienteCambioDisplayName,
  usernameReservado,
  usernameValido,
} from '../src/data/usernames';
import {
  RESERVED_USERNAMES as RESERVED_BACKEND,
  displayNameValido as displayNameValidoBackend,
  normalizarUsername as normalizarUsernameBackend,
  usernameValido as usernameValidoBackend,
} from '../functions/src/usernames';

assert.deepEqual(
  [...RESERVED_USERNAMES].sort(),
  [...RESERVED_BACKEND].sort(),
  'las listas de reservados de web y Functions deben ser iguales',
);

assert.equal(normalizarUsername('  Kapó_25  '), 'kapo_25');
assert.equal(normalizarUsernameBackend('  Kapó_25  '), 'kapo_25');
assert.ok(usernameValido('kapo_25'));
assert.ok(usernameValidoBackend('kapo_25'));
assert.ok(!usernameValido('kapo-25'), 'el guion no está permitido');
assert.ok(!usernameValido('ka'), 'mínimo 3 caracteres');
assert.ok(!usernameValido('a'.repeat(21)), 'máximo 20 caracteres');
assert.ok(usernameReservado('Admin'));
assert.ok(usernameReservado('geekapoo'));
assert.equal(errorUsername(''), 'Introduce un nombre de usuario.');
assert.match(errorUsername('kapo-25') ?? '', /letras sin acentos/i);
assert.match(errorUsername('admin') ?? '', /reservado/i);

assert.ok(displayNameValido('Kapo'));
assert.ok(displayNameValido('Kapo'));
assert.ok(displayNameValidoBackend('Kapo'));
assert.ok(displayNameValido('Kapo ✨'));
assert.ok(!displayNameValido('K'));
assert.ok(!displayNameValido('a'.repeat(DISPLAY_NAME_MAX + 1)));
assert.equal(normalizarDisplayName('  Kapo   Moon  '), 'Kapo Moon');
assert.ok(errorDisplayName('K'));

// Dos personas pueden llamarse igual: no hay ninguna función que
// compare displayName entre usuarios.
assert.equal(normalizarDisplayName('Kapo'), normalizarDisplayName('Kapo'));

const ahora = Date.UTC(2026, 10, 5, 12, 0, 0);
const haceUnDia = new Date(ahora - 86_400_000).toISOString();
const haceOchoDias = new Date(
  ahora - (DISPLAY_NAME_COOLDOWN_DAYS + 1) * 86_400_000,
).toISOString();

assert.equal(puedeCambiarDisplayName({ displayNameChangedAt: haceUnDia, role: 'user' }, ahora), false);
assert.equal(puedeCambiarDisplayName({ displayNameChangedAt: haceOchoDias, role: 'user' }, ahora), true);
assert.equal(puedeCambiarDisplayName({ displayNameChangedAt: haceUnDia, role: 'admin' }, ahora), true);
assert.equal(siguienteCambioDisplayName({ displayNameChangedAt: haceUnDia, role: 'user' }, ahora) instanceof Date, true);

console.log('✓ identidad: usuarios y nombres visibles correctos');
console.log('  · @usuario normalizado, único y con formato limitado');
console.log('  · web y Functions comparten los nombres reservados');
console.log('  · el nombre visible se repite y respeta el plazo de 7 días');
