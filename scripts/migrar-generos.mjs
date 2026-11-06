// ======================================================
// MIGRAR LOS GÉNEROS DE TODOS LOS ANIMES
// ======================================================
//
// Deja el campo `genres` de cada ficha con el vocabulario
// canónico de `src/data/animeGenres.ts`. El filtro ya entiende
// las variantes antiguas, así que la web funciona sin migrar;
// esto solo limpia los datos para que no se acumulen "Accion",
// "Sci-Fi", "Slice of Life" y compañía.
//
// Por defecto solo simula. Para escribir de verdad:
//
//   npx tsx scripts/migrar-generos.mjs --aplicar
//
// Solo toca el campo `genres` (con máscara), nunca el resto del
// documento.

import { arrayDe, coleccion, escribir, str } from './firestore-rest.mjs';
import { claveGenero, normalizarGenero } from '../src/data/animeGenres.ts';

const aplicar = process.argv.includes('--aplicar');
const animes = await coleccion('animes');

const antes = new Set();
const despues = new Set();
const cambios = [];
const problemas = [];

for (const anime of animes) {
  const campo = anime.f.genres;

  if (campo && !campo.arrayValue) {
    problemas.push(`${str(anime, 'title')}: "genres" no es un array`);
    continue;
  }

  const valores = campo?.arrayValue?.values ?? [];
  const originales = valores.map((v) => v.stringValue);
  const hayNoTexto = originales.some((v) => typeof v !== 'string');
  const textos = originales.filter((v) => typeof v === 'string');

  for (const genero of textos) antes.add(genero.trim());

  const nuevos = [];
  const vistos = new Set();

  for (const genero of textos) {
    const nombre = normalizarGenero(genero);
    if (!nombre) continue;

    const clave = claveGenero(nombre);
    if (vistos.has(clave)) continue;

    vistos.add(clave);
    nuevos.push(nombre);
    despues.add(nombre);
  }

  const iguales =
    !hayNoTexto &&
    originales.length === nuevos.length &&
    originales.every((genero, i) => genero === nuevos[i]);

  if (!iguales) cambios.push({ anime, originales, nuevos });
}

console.log(`Modo: ${aplicar ? 'APLICAR' : 'simulación (añade --aplicar para escribir)'}`);
console.log(`Animes revisados: ${animes.length}`);
console.log(`Géneros distintos antes: ${antes.size}`);
console.log(`Géneros distintos después: ${despues.size}`);
console.log(`Animes que cambiarían: ${cambios.length}`);

if (problemas.length > 0) {
  console.log('\nDocumentos que no se tocan:');
  for (const problema of problemas) console.log(`  - ${problema}`);
}

console.log('\nPrimeros cambios:');
for (const { anime, originales, nuevos } of cambios.slice(0, 20)) {
  const antesTxt = originales.map((g) => (typeof g === 'string' ? g : '(no texto)')).join(', ');
  console.log(`  - ${str(anime, 'title')}`);
  console.log(`      antes: ${antesTxt || '(vacío)'}`);
  console.log(`      ahora: ${nuevos.join(', ') || '(vacío)'}`);
}

if (aplicar && cambios.length > 0) {
  let hechos = 0;
  for (const { anime, nuevos } of cambios) {
    await escribir('animes', anime.id, { genres: arrayDe(nuevos) }, ['genres']);
    hechos++;
    if (hechos % 25 === 0) console.log(`  ... ${hechos}/${cambios.length}`);
  }
  console.log(`\nActualizados ${hechos} animes.`);
}
