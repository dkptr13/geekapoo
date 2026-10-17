/**
 * Apariencia del chat: valores, saneado y resolución.
 *
 * Lógica pura de `src/data/chatApariencia.ts`, sin React ni
 * Firebase. Lo que se pinta en la conversación sale de
 * `resolverApariencia`, así que si un tema se ve roto, el
 * fallo está ahí y estos tests lo señalan.
 *
 *   npx tsx tests/logica.chat-apariencia.ts
 */
import assert from 'node:assert/strict';
import {
  APARIENCIA_POR_DEFECTO,
  FONDOS_CHAT,
  TEMAS_CHAT,
  aparienciaAGuardar,
  resolverApariencia,
  sujetarApariencia,
} from '../src/data/chatApariencia.ts';

// Por defecto sale la casa: violeta contenido, recibida
// grafito suave, radio amplio, letra y hueco equilibrados.
const casa = resolverApariencia(APARIENCIA_POR_DEFECTO);
assert.equal(casa.burbujaPropia.background, 'linear-gradient(135deg,#6d28d9 0%,#7c3aed 100%)');
assert.equal(casa.burbujaPropia.color, '#ffffff');
assert.equal(casa.burbujaRecibida.background, '#1b1b22');
assert.equal(casa.burbujaRecibida.color, '#e9e9f0');
assert.equal(casa.radio.borderRadius, '1.125rem');
assert.equal(casa.letraClase, 'text-[15px] sm:text-sm');
assert.deepEqual(casa.letra, {});
assert.equal(casa.gapLista.rowGap, '0.875rem');
assert.equal(casa.ancho, 'max-w-[80%] sm:max-w-[68%] 2xl:max-w-[46%]');
assert.equal(casa.relleno, 'px-3.5 py-2');
// El fondo por defecto es tenue: acompaña, no compite.
assert.ok(String(casa.fondoLista.background ?? casa.fondoLista.backgroundImage).includes('#0a0a11'));
// Las burbujas traen borde y sombra sutiles de serie.
assert.ok('border' in casa.burbujaPropia);
assert.ok('border' in casa.burbujaRecibida);
// La cola del bocadillo se conserva en redondas y suaves.
assert.deepEqual(casa.esquinaPropia, { borderTopRightRadius: 0 });
assert.deepEqual(casa.esquinaRecibida, { borderTopLeftRadius: 0 });

// Seis temas, cada uno con su nombre: son los que enseña el panel.
assert.equal(TEMAS_CHAT.length, 6);
assert.ok(TEMAS_CHAT.some((t) => t.id === 'oscuro'));
assert.ok(TEMAS_CHAT.some((t) => t.id === 'personalizado'));

// Basura entrante, casa saliente: cuentas antiguas, campos
// tocados a mano o temas que ya no existen.
assert.deepEqual(sujetarApariencia(undefined), APARIENCIA_POR_DEFECTO);
assert.deepEqual(sujetarApariencia(null), APARIENCIA_POR_DEFECTO);
assert.deepEqual(sujetarApariencia({ tema: 'inventado' }), APARIENCIA_POR_DEFECTO);
assert.deepEqual(sujetarApariencia('hola'), APARIENCIA_POR_DEFECTO);
const sujeta = sujetarApariencia({
  tema: 'neon',
  colorPropio: '#FFFFFF',
  colorRecibido: 'rojo',
  forma: 'triangulo',
  fondo: { preset: 'ola', dim: 200 },
  reducirMovimiento: true,
});
assert.equal(sujeta.tema, 'neon');
assert.equal(sujeta.colorPropio, '#ffffff');
assert.equal(sujeta.colorRecibido, null);
assert.equal(sujeta.forma, 'redonda');
assert.equal(sujeta.fondo?.dim, 80);
assert.equal(sujeta.reducirMovimiento, true);
// Fondo sin preset ni URL no es fondo.
assert.equal(sujetarApariencia({ fondo: {} }).fondo, null);
assert.equal(sujetarApariencia({ fondo: null }).fondo, null);

// Al guardar no viaja ningún `undefined` (Firestore los
// rechaza dentro de un mapa) y lo que es defecto se omite.
const guardado = aparienciaAGuardar({
  ...APARIENCIA_POR_DEFECTO,
  tema: 'neon',
  colorPropio: null,
  fondo: { preset: 'ola', dim: 30 },
});
assert.deepEqual(guardado, {
  tema: 'neon',
  fondo: { preset: 'ola', ajuste: 'cover', position: 'center', dim: 30 },
});
assert.ok(
  Object.values(aparienciaAGuardar(APARIENCIA_POR_DEFECTO)).every((v) => v !== undefined),
  'sin undefined al guardar',
);

// El tema claro vela en blanco y el oscuro en negro.
const claro = resolverApariencia({ tema: 'claro', fondo: { preset: 'ola', dim: 40 } });
assert.ok(String(claro.fondoLista.backgroundImage).startsWith('linear-gradient(rgba(255,255,255,0.4)'));
assert.equal(claro.burbujaRecibida.color, '#27272a');
const oscuroVelo = resolverApariencia({ tema: 'oscuro', fondo: { preset: 'ola', dim: 40 } });
assert.ok(String(oscuroVelo.fondoLista.backgroundImage).startsWith('linear-gradient(rgba(0,0,0,0.4)'));

// URL propia con ajuste y posición; preset desconocido no rompe.
const conUrl = resolverApariencia({
  fondo: { url: 'https://x/y.jpg', ajuste: 'contain', position: 'top', dim: 10 },
});
assert.ok(String(conUrl.fondoLista.backgroundImage).includes('url("https://x/y.jpg")'));
assert.equal(conUrl.fondoLista.backgroundSize, 'contain');
const presetRaro = resolverApariencia({ fondo: { preset: 'inventado', dim: 0 } });
assert.ok(String(presetRaro.fondoLista.backgroundImage).includes('transparent'));

// Personalizado: mandan los colores elegidos.
const propio = resolverApariencia({
  tema: 'personalizado',
  colorPropio: '#2563eb',
  textoPropio: '#ffffff',
  colorRecibido: '#f4f4f5',
  textoRecibido: '#18181b',
});
assert.equal(propio.burbujaPropia.background, '#2563eb');
assert.equal(propio.burbujaRecibida.color, '#18181b');

// Formas, letras, huecos y anchos tienen su traducción.
assert.equal(resolverApariencia({ forma: 'cuadrada' }).radio.borderRadius, '0.375rem');
assert.deepEqual(resolverApariencia({ forma: 'cuadrada' }).esquinaPropia, {});
assert.equal(resolverApariencia({ letra: 'grande' }).letra.fontSize, '17px');
assert.equal(resolverApariencia({ letra: 'pequena' }).letra.fontSize, '13px');
assert.equal(resolverApariencia({}).letraClase, 'text-[15px] sm:text-sm');
assert.deepEqual(resolverApariencia({}).letra, {});
assert.equal(resolverApariencia({ espaciado: 'amplio' }).gapLista.rowGap, '1.5rem');
assert.equal(resolverApariencia({ espaciado: 'compacto' }).gapLista.rowGap, '0.5rem');
assert.equal(resolverApariencia({ estilo: 'compacto' }).relleno, 'px-3 py-1.5');

// La galería trae fondos de verdad (no solo "ninguno").
assert.ok(FONDOS_CHAT.length > 5);
assert.ok(FONDOS_CHAT.every((f) => f.id && f.nombre));

console.log('  chat-apariencia: TODO CORRECTO');
