/**
 * Comprobaciones de las categorías del foro.
 *
 *   npm run test:logica
 *
 * Lo importante: "Debates" debe existir en las categorías de los
 * hilos y NO colarse en los filtros de anime. Y las categorías que
 * solo viven en código deben marcarse como fijas para que el panel
 * no intente borrar un documento que no existe.
 */
import assert from 'node:assert/strict';

import {
  ALL_ANIME_CATEGORIES,
  FORUM_CATEGORIES,
  mergeCategories,
  normalize,
  type StoredCategory,
} from '../src/data/animeCategories';

// La categoría de foro existe y tiene forma completa.
const debates = FORUM_CATEGORIES.find((c) => c.id === 'debates');
assert.ok(debates, 'Debates debe estar en las categorías del foro');
assert.equal(debates!.name, 'Debates');
assert.ok(debates!.description.trim().length > 10);
assert.ok(debates!.color.includes('amber'));

// No es un género de anime: los filtros del catálogo no deben verla.
assert.ok(
  !ALL_ANIME_CATEGORIES.some((c) => c.id === 'debates'),
  'Debates no debe aparecer en los filtros de anime',
);

// `mergeCategories` añade las categorías de código que Falta.
const merged = mergeCategories<StoredCategory>([]);
const mergedDebates = merged.find((c) => c.id === 'debates');
assert.ok(mergedDebates, 'Debates debe aparecer al construir el foro');
assert.equal(mergedDebates!.fixed, true, 'Debates es una categoría fija de código');
assert.equal(mergedDebates!.threadsCount, 0);

// Las categorías canónicas de anime también se añaden al foro.
for (const categoria of ALL_ANIME_CATEGORIES) {
  assert.ok(
    merged.some((c) => normalize(c.name) === normalize(categoria.name)),
    `falta la categoría ${categoria.name} en el foro`,
  );
}

// No hay nombres duplicados.
const nombres = merged.map((c) => normalize(c.name));
assert.equal(
  nombres.filter((nombre, i) => nombres.indexOf(nombre) !== i).length,
  0,
  `categorías duplicadas: ${nombres.join(', ')}`,
);

// Un documento de Firestore manda sobre la definición de código y
// conserva su contador real.
const conRomance = mergeCategories<StoredCategory>([
  { id: 'romance', name: 'Romance & Comedia', threadsCount: 12 },
]);
const romance = conRomance.find((c) => c.id === 'romance');
assert.ok(romance, 'Romance debe seguir estando');
assert.equal(romance!.threadsCount, 12, 'manda el contador de Firestore');
assert.equal(romance!.fixed, undefined, 'una categoría de Firestore no es fija');

// Si algún día se crea "Debates" en Firestore, su documento manda.
const conDebates = mergeCategories<StoredCategory>([
  { id: 'debates', name: 'Debates', threadsCount: 7 },
]);
const debatesReales = conDebates.find((c) => c.name === 'Debates');
assert.ok(debatesReales);
assert.equal(debatesReales!.id, 'debates');
assert.equal(debatesReales!.threadsCount, 7);
assert.equal(debatesReales!.fixed, undefined);
assert.equal(
  conDebates.filter((c) => normalize(c.name) === 'debates').length,
  1,
  'no debe duplicar Debates si ya existe en Firestore',
);

// Aunque el nombre haya cambiado, el id evita duplicar la clave.
const conDebatesRenombrada = mergeCategories<StoredCategory>([
  { id: 'debates', name: 'Debate general', threadsCount: 3 },
]);
assert.equal(
  conDebatesRenombrada.filter((c) => c.id === 'debates').length,
  1,
  'un id repetido rompería las keys del desplegable',
);

console.log('✓ categorías del foro: todo correcto');
console.log('  · Debates existe solo en los hilos, no en los filtros de anime');
console.log('  · las categorías de código se marcan como fijas');
console.log('  · los documentos de Firestore mandan y no se duplican');
