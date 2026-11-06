/**
 * Comprobaciones de las categorías del foro.
 *
 *   npm run test:logica
 *
 * Lo importante: "Debates", "Encuestas" y "Recomendaciones" deben
 * existir en las categorías de los hilos y NO colarse en los filtros
 * de anime. Y las categorías que solo viven en código deben marcarse
 * como fijas para que el panel no intente borrar un documento que no
 * existe.
 */
import assert from 'node:assert/strict';

import {
  ALL_ANIME_CATEGORIES,
  FORUM_CATEGORIES,
  animeCategories,
  findCategory,
  isInCategory,
  mergeCategories,
  normalizarCategoria,
  normalize,
  type StoredCategory,
} from '../src/data/animeCategories';

// Las categorías de foro existen y tienen forma completa.
const categoriasDeForo = [
  { id: 'debates', name: 'Debates', color: 'amber' },
  { id: 'encuestas', name: 'Encuestas', color: 'indigo' },
  { id: 'recomendaciones', name: 'Recomendaciones', color: 'teal' },
];

for (const esperada of categoriasDeForo) {
  const categoria = FORUM_CATEGORIES.find((c) => c.id === esperada.id);
  assert.ok(categoria, `${esperada.name} debe estar en las categorías del foro`);
  assert.equal(categoria!.name, esperada.name);
  assert.ok(categoria!.description.trim().length > 10);
  assert.ok(categoria!.color.includes(esperada.color));

  // No son géneros de anime: los filtros del catálogo no deben verlas.
  assert.ok(
    !ALL_ANIME_CATEGORIES.some((c) => c.id === esperada.id),
    `${esperada.name} no debe aparecer en los filtros de anime`,
  );
}

// `mergeCategories` añade las categorías de código que faltan.
const merged = mergeCategories<StoredCategory>([]);

for (const esperada of categoriasDeForo) {
  const categoria = merged.find((c) => c.id === esperada.id);
  assert.ok(categoria, `${esperada.name} debe aparecer al construir el foro`);
  assert.equal(categoria!.fixed, true, `${esperada.name} es una categoría fija de código`);
  assert.equal(categoria!.threadsCount, 0);
}

// Las categorías canónicas de anime también se añaden al foro.
for (const categoria of ALL_ANIME_CATEGORIES) {
  assert.ok(
    merged.some((c) => normalize(c.name) === normalize(categoria.name)),
    `falta la categoría ${categoria.name} en el foro`,
  );
}

// Las categorías antiguas se leen como su equivalente canónica.
// Sin esto, un anime con solo "Fantasía & Magia" no salía en
// ninguna tarjeta de "Explora por categoría".
assert.equal(normalizarCategoria('Fantasía & Magia'), 'Fantasía & Aventura');
assert.equal(normalizarCategoria('Fantasia & Magia'), 'Fantasía & Aventura');
assert.equal(normalizarCategoria('Ciencia Ficción & Futuro'), 'Ciencia Ficción & Cyberpunk');
assert.equal(normalizarCategoria('Ciencia ficción'), 'Ciencia Ficción & Cyberpunk');
assert.equal(normalizarCategoria('Acción & Aventura'), 'Shonen & Acción');
assert.equal(normalizarCategoria('Shonen & Accion'), 'Shonen & Acción');
assert.equal(normalizarCategoria('Shojo & Romance'), 'Shojo & Escolar');
assert.equal(normalizarCategoria('Comedia & Slice of Life'), 'Romance & Comedia');
assert.equal(normalizarCategoria('Drama & Recuerdos'), 'Josei & Drama');
assert.equal(normalizarCategoria('Misterio & Misterio'), 'Thriller & Misterio');
assert.equal(normalizarCategoria('[object Object]'), null);

// Un anime con varias formas de la misma categoría se queda con
// una sola: la ficha no debe pintar "Romance", "Comedia" y
// "Romance & Comedia" como tres etiquetas.
assert.deepEqual(
  animeCategories({ categories: ['Romance', 'Comedia', 'Romance & Comedia'] }),
  ['Romance & Comedia'],
);
assert.deepEqual(
  animeCategories({ category: 'Fantasía & Magia' }),
  ['Fantasía & Aventura'],
);
assert.deepEqual(
  animeCategories({ categories: ['Shonen & Acción', 'Fantasía & Magia'] }),
  ['Shonen & Acción', 'Fantasía & Aventura'],
);

// El filtro de la URL acepta tanto el nombre nuevo como el viejo.
assert.equal(findCategory('Fantasía & Magia')?.name, 'Fantasía & Aventura');
assert.equal(findCategory('Fantasia & Magia')?.name, 'Fantasía & Aventura');
assert.equal(isInCategory({ categories: ['Fantasía & Magia'] }, 'Fantasía & Aventura'), true);
assert.equal(isInCategory({ categories: ['Fantasía & Aventura'] }, 'Fantasía & Magia'), true);

// Una categoría desconocida no se pierde: se conserva para que una
// sección nueva no desaparezca por no estar en la lista.
assert.equal(normalizarCategoria('Categoría inventada'), 'Categoría inventada');

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
console.log('  · Debates, Encuestas y Recomendaciones existen solo en los hilos');
console.log('  · no aparecen en los filtros de anime');
console.log('  · las categorías de código se marcan como fijas');
console.log('  · los documentos de Firestore mandan y no se duplican');
