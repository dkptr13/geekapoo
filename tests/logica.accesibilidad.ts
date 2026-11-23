/**
 * Preferencias del Centro de Accesibilidad.
 *
 * Lógica pura de `src/data/accessibilityPreferences.ts`: migración,
 * saneo, perfiles rápidos y decisión de qué configuración aplicar al
 * entrar en una cuenta.
 *
 *   npx tsx tests/logica.accesibilidad.ts
 */
import assert from 'node:assert/strict';

import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  QUICK_PROFILES,
  SPACING_PRESETS,
  elegirPreferenciasIniciales,
  firmaPreferencias,
  normalizarPreferenciasAccesibilidad,
  quickProfilePatch,
} from '../src/data/accessibilityPreferences.ts';

// ── Valores por defecto ──────────────────────────────────
assert.deepEqual(
  normalizarPreferenciasAccesibilidad(null),
  DEFAULT_ACCESSIBILITY_PREFERENCES,
);
assert.deepEqual(
  normalizarPreferenciasAccesibilidad(undefined),
  DEFAULT_ACCESSIBILITY_PREFERENCES,
);
assert.deepEqual(
  normalizarPreferenciasAccesibilidad('basura'),
  DEFAULT_ACCESSIBILITY_PREFERENCES,
);
assert.equal(normalizarPreferenciasAccesibilidad({}).version, 2);

// ── Migración de la Fase 1 ───────────────────────────────
assert.deepEqual(
  normalizarPreferenciasAccesibilidad({
    reduceMotion: true,
    highContrast: true,
    underlineLinks: true,
    largeText: true,
  }),
  {
    ...DEFAULT_ACCESSIBILITY_PREFERENCES,
    textScale: 1.125,
    contrast: 'high',
    underlineLinks: true,
    motion: 'reduced',
  },
);

// ── Saneo de valores fuera de rango ──────────────────────
const saneado = normalizarPreferenciasAccesibilidad({
  version: 2,
  textScale: 9,
  lineHeight: 0,
  letterSpacing: 9,
  wordSpacing: -1,
  paragraphSpacing: 99,
  contrast: 'inventado',
  motion: 'inventado',
  spacingPreset: 'inventado',
  soundVolume: 5,
  largeControls: 'sí',
  simplified: 1,
});
assert.equal(saneado.textScale, 2);
assert.equal(saneado.lineHeight, 1.1);
assert.equal(saneado.letterSpacing, 0.3);
assert.equal(saneado.wordSpacing, 0);
assert.equal(saneado.paragraphSpacing, 3);
assert.equal(saneado.contrast, 'normal');
assert.equal(saneado.motion, 'system');
assert.equal(saneado.spacingPreset, 'normal');
assert.equal(saneado.soundVolume, 1);
assert.equal(saneado.largeControls, false);
assert.equal(saneado.simplified, false);

// Los valores válidos se conservan.
const valido = normalizarPreferenciasAccesibilidad({
  version: 2,
  textScale: 1.5,
  contrast: 'high',
  motion: 'none',
  spacingPreset: 'wcag',
  lineHeight: 1.5,
  letterSpacing: 0.12,
  wordSpacing: 0.16,
  paragraphSpacing: 2,
  underlineLinks: true,
  soundEnabled: true,
  soundVolume: 0.3,
  largeControls: true,
  simplified: true,
});
assert.equal(valido.textScale, 1.5);
assert.equal(valido.contrast, 'high');
assert.equal(valido.motion, 'none');
assert.equal(valido.spacingPreset, 'wcag');
assert.equal(valido.lineHeight, 1.5);
assert.equal(valido.letterSpacing, 0.12);
assert.equal(valido.wordSpacing, 0.16);
assert.equal(valido.paragraphSpacing, 2);
assert.equal(valido.underlineLinks, true);
assert.equal(valido.soundEnabled, true);
assert.equal(valido.soundVolume, 0.3);
assert.equal(valido.largeControls, true);
assert.equal(valido.simplified, true);

// ── Perfiles rápidos ─────────────────────────────────────
for (const perfil of QUICK_PROFILES) {
  const patch = quickProfilePatch(perfil.id);
  assert.ok(Object.keys(patch).length > 0, `El perfil ${perfil.id} está vacío`);
}

assert.equal(quickProfilePatch('lectura').textScale, 1.25);
assert.equal(quickProfilePatch('lectura').spacingPreset, 'comfortable');
assert.equal(quickProfilePatch('lectura').underlineLinks, true);
assert.equal(quickProfilePatch('visibilidad').contrast, 'high');
assert.equal(quickProfilePatch('visibilidad').strongBorders, true);
assert.equal(quickProfilePatch('movimiento').motion, 'reduced');
assert.equal(quickProfilePatch('controles').largeControls, true);
assert.equal(quickProfilePatch('simplificada').simplified, true);

// Los presets de espaciado conservan los valores de WCAG 1.4.12.
assert.equal(SPACING_PRESETS.wcag.lineHeight, 1.5);
assert.equal(SPACING_PRESETS.wcag.letterSpacing, 0.12);
assert.equal(SPACING_PRESETS.wcag.wordSpacing, 0.16);
assert.equal(SPACING_PRESETS.wcag.paragraphSpacing, 2);

// ── Firma estable ────────────────────────────────────────
assert.equal(
  firmaPreferencias(DEFAULT_ACCESSIBILITY_PREFERENCES),
  firmaPreferencias(normalizarPreferenciasAccesibilidad({})),
);
assert.notEqual(
  firmaPreferencias(DEFAULT_ACCESSIBILITY_PREFERENCES),
  firmaPreferencias({ ...DEFAULT_ACCESSIBILITY_PREFERENCES, textScale: 1.1 }),
);

// ── Decisión al entrar en una cuenta ─────────────────────
const remoto = {
  ...DEFAULT_ACCESSIBILITY_PREFERENCES,
  textScale: 1.5,
  contrast: 'high' as const,
};
const cache = {
  ...DEFAULT_ACCESSIBILITY_PREFERENCES,
  textScale: 1.25,
  motion: 'reduced' as const,
};
const invitado = {
  ...DEFAULT_ACCESSIBILITY_PREFERENCES,
  textScale: 1.1,
  largeControls: true,
};

// 1. El perfil manda sobre la caché y sobre el invitado.
assert.deepEqual(elegirPreferenciasIniciales(remoto, cache, invitado), {
  prefs: remoto,
  origen: 'remoto',
  subir: false,
});

// 2. Sin perfil, se usa la caché de ese usuario y se sube.
assert.deepEqual(elegirPreferenciasIniciales(null, cache, invitado), {
  prefs: cache,
  origen: 'cache',
  subir: true,
});

// 3. Sin perfil ni caché, se usa lo del invitado y se sube.
assert.deepEqual(elegirPreferenciasIniciales(null, null, invitado), {
  prefs: invitado,
  origen: 'invitado',
  subir: true,
});

// 4. Sin nada personalizado no se escribe en Firestore.
assert.deepEqual(
  elegirPreferenciasIniciales(
    null,
    DEFAULT_ACCESSIBILITY_PREFERENCES,
    DEFAULT_ACCESSIBILITY_PREFERENCES,
  ),
  {
    prefs: DEFAULT_ACCESSIBILITY_PREFERENCES,
    origen: 'defectos',
    subir: false,
  },
);

console.log('accesibilidad: preferencias, perfiles y sincronización OK');
