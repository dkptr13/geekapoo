/**
 * Comprobaciones de las etiquetas y la ficha de Fanart.
 *
 *   npx tsx tests/logica.fanarts.ts
 *
 * Lo importante: la técnica y «Ilustración original» se añaden
 * solas, no se duplican y el tope de etiquetas se respeta. La
 * categoría `fanarts` no debe aparecer en los filtros de anime.
 */
import assert from 'node:assert/strict';

import { ALL_ANIME_CATEGORIES, FORUM_CATEGORIES } from '../src/data/animeCategories';
import {
  FANART_CATEGORY_ID,
  FANART_MAX_TAGS,
  FANART_TAGS,
  esEtiquetaFijaDeFanart,
  etiquetasDeFanart,
} from '../src/data/fanarts';

assert.ok(
  FANART_TAGS.some((t) => t.id === 'digital'),
  'debe existir la etiqueta de dibujo digital',
);
assert.ok(
  !FORUM_CATEGORIES.some((c) => c.id === FANART_CATEGORY_ID),
  'Fanart no debe salir como categoría normal del foro',
);
assert.ok(
  !ALL_ANIME_CATEGORIES.some((c) => c.id === FANART_CATEGORY_ID),
  'Fanart no debe salir en los filtros de anime',
);

const digital = etiquetasDeFanart(['Anime / Manga'], 'digital', true);
assert.deepEqual(digital, [
  'Dibujo digital',
  'Ilustración original',
  'Anime / Manga',
]);
assert.ok(esEtiquetaFijaDeFanart('Dibujo digital'));
assert.ok(esEtiquetaFijaDeFanart('dibujo digital'));

const sinDuplicados = etiquetasDeFanart(
  ['Dibujo digital', 'Anime / Manga', 'dibujo digital'],
  'digital',
  false,
);
assert.deepEqual(sinDuplicados, ['Dibujo digital', 'Anime / Manga']);

const mixto = etiquetasDeFanart([], 'mixed', false);
assert.deepEqual(mixto, ['Dibujo digital', 'Dibujo tradicional']);

const muchas = etiquetasDeFanart(
  Array.from({ length: 20 }, (_, i) => `Etiqueta ${i + 1}`),
  'digital',
  true,
);
assert.equal(muchas.length, FANART_MAX_TAGS);
assert.ok(muchas.includes('Dibujo digital'));
assert.ok(muchas.includes('Ilustración original'));

console.log('✓ fanarts: etiquetas y ficha correctas');
console.log('  · la técnica y la obra original se añaden solas');
console.log('  · las etiquetas no se duplican y respetan el tope');
console.log('  · Fanart no aparece en los filtros de anime');
