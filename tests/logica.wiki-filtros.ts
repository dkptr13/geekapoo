/**
 * Filtros de la wiki: pestañas principales y filtros avanzados.
 *
 * Todo lo que se prueba aquí es lógica pura de
 * `src/utils/wikiFilter.ts`, sin React ni Firebase: si dos
 * sitios de la wiki filtran distinto, el fallo está en ese
 * archivo y estos tests lo señalan.
 *
 *   npx tsx tests/logica.wiki-filtros.ts
 */
import assert from 'node:assert/strict';
import type { Anime } from '../src/types/index.ts';
import { normalizarGenero } from '../src/data/animeGenres.ts';
import {
  FILTROS_VACIOS,
  contarFiltrosActivos,
  episodioDeAnimeValido,
  esPelicula,
  generosDisponibles,
  ordenarAnimes,
  ordenarEpisodios,
  ordenarHilos,
  ordenarPersonajes,
  pasaCategoriaHilo,
  pasaFiltrosAnime,
  pasaPestanaAnime,
  rangoAnios,
  sanearFiltros,
  sinDuplicados,
  type FiltrosAvanzados,
} from '../src/utils/wikiFilter.ts';

// Una peli es un anime de un solo capítulo. Una serie con un
// único capítulo no existe en el catálogo.
assert.equal(esPelicula({ episodesCount: 1 }), true);
assert.equal(esPelicula({ episodesCount: 24 }), false);
assert.equal(esPelicula({ episodesCount: 0 }), false);

assert.equal(pasaPestanaAnime({ episodesCount: 1 }, 'movies'), true);
assert.equal(pasaPestanaAnime({ episodesCount: 24 }, 'movies'), false);
assert.equal(pasaPestanaAnime({ episodesCount: 24 }, 'series'), true);
assert.equal(pasaPestanaAnime({ episodesCount: 1 }, 'series'), false);
assert.equal(pasaPestanaAnime({ episodesCount: 1 }, 'all'), true);

// Sin filtros todo pasa.
const serie: Pick<Anime, 'genres' | 'year' | 'status' | 'rating'> = {
  genres: ['Fantasía', 'Aventura'],
  year: 2024,
  status: 'finished',
  rating: 8.5,
};
assert.equal(pasaFiltrosAnime(serie, FILTROS_VACIOS), true);

// Géneros: basta con tener UNO de los marcados.
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, generos: ['Fantasía'] }), true);
assert.equal(
  pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, generos: ['Romance', 'Fantasía'] }),
  true,
);
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, generos: ['Romance'] }), false);

// Los géneros se comparan sin tildes ni mayúsculas, y los alias
// del catálogo cuentan como el mismo género. Antes "Acción" no
// encontraba una ficha guardada como "Accion".
const conVariantes: Pick<Anime, 'genres' | 'year' | 'status' | 'rating'> = {
  ...serie,
  genres: ['Accion', 'Sci-Fi', 'Horror', 'Slice of Life', 'Shōnen'],
};
assert.equal(pasaFiltrosAnime(conVariantes, { ...FILTROS_VACIOS, generos: ['Acción'] }), true);
assert.equal(
  pasaFiltrosAnime(conVariantes, { ...FILTROS_VACIOS, generos: ['Ciencia ficción'] }),
  true,
);
assert.equal(pasaFiltrosAnime(conVariantes, { ...FILTROS_VACIOS, generos: ['Terror'] }), true);
assert.equal(
  pasaFiltrosAnime(conVariantes, { ...FILTROS_VACIOS, generos: ['Recuentos de la vida'] }),
  true,
);
assert.equal(pasaFiltrosAnime(conVariantes, { ...FILTROS_VACIOS, generos: ['Shonen'] }), true);
assert.equal(pasaFiltrosAnime(conVariantes, { ...FILTROS_VACIOS, generos: ['Romance'] }), false);

// Año concreto manda sobre el intervalo.
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, anio: 2024 }), true);
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, anio: 2023 }), false);
assert.equal(
  pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, desde: 2020, hasta: 2024 }),
  true,
);
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, desde: 2025 }), false);
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, hasta: 2023 }), false);

// El estado vale en palabra corta o larga: Firestore mezcla.
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, estados: ['Finalizado'] }), true);
assert.equal(
  pasaFiltrosAnime({ ...serie, status: 'En emisión' }, { ...FILTROS_VACIOS, estados: ['Finalizado'] }),
  false,
);
assert.equal(
  pasaFiltrosAnime({ ...serie, status: 'emitiendo' }, { ...FILTROS_VACIOS, estados: ['En emisión'] }),
  true,
);

// Nota mínima: el 0 es "sin valorar", no "mala", y no filtra.
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, notaMin: 8 }), true);
assert.equal(pasaFiltrosAnime(serie, { ...FILTROS_VACIOS, notaMin: 9 }), false);
assert.equal(pasaFiltrosAnime({ ...serie, rating: 0 }, { ...FILTROS_VACIOS, notaMin: 6 }), false);

// Los filtros se combinan: uno que falle cierra la puerta.
const combinados: FiltrosAvanzados = {
  ...FILTROS_VACIOS,
  generos: ['Fantasía'],
  desde: 2020,
  hasta: 2024,
  estados: ['Finalizado'],
  notaMin: 8,
};
assert.equal(pasaFiltrosAnime(serie, combinados), true);
assert.equal(pasaFiltrosAnime({ ...serie, year: 2019 }, combinados), false);

// La insignia cuenta grupos: géneros y estados de uno en uno,
// el año (concreto o intervalo) como uno.
assert.equal(contarFiltrosActivos(FILTROS_VACIOS), 0);
assert.equal(contarFiltrosActivos(combinados), 1 + 1 + 1 + 1);
assert.equal(
  contarFiltrosActivos({ ...FILTROS_VACIOS, generos: ['A', 'B'], orden: 'az' }),
  3,
);

// Al cambiar de pestaña solo viaja lo compatible.
assert.deepEqual(sanearFiltros(combinados, 'movies').estados, ['Finalizado']);
const conEmision: FiltrosAvanzados = { ...FILTROS_VACIOS, estados: ['En emisión', 'Finalizado'] };
assert.deepEqual(sanearFiltros(conEmision, 'movies').estados, ['Finalizado']);
const saneadoEp = sanearFiltros(combinados, 'episodes');
assert.deepEqual(saneadoEp.generos, []);
assert.equal(saneadoEp.notaMin, 8);
assert.equal(saneadoEp.orden, 'defecto');
const saneadoHilos = sanearFiltros({ ...combinados, orden: 'nuevos' }, 'threads');
assert.equal(saneadoHilos.notaMin, 0);
assert.equal(saneadoHilos.orden, 'nuevos');

// Opciones desde los datos: sin duplicados, sin valores que no
// son texto y con una sola entrada para cada alias.
assert.equal(normalizarGenero('  Accion '), 'Acción');
assert.equal(normalizarGenero('Sci-Fi'), 'Ciencia ficción');
assert.equal(normalizarGenero('Horror'), 'Terror');
assert.equal(normalizarGenero('Mahou Shoujo'), 'Chicas mágicas');
assert.equal(normalizarGenero('Sports'), 'Deportes');
assert.equal(normalizarGenero('Slice of Life'), 'Recuentos de la vida');
assert.equal(normalizarGenero('Supernatural'), 'Sobrenatural');
assert.equal(normalizarGenero('Psychological'), 'Psicológico');
assert.equal(normalizarGenero('[object Object]'), null);
assert.equal(normalizarGenero('Ekstasis'), null);

const catalogo = [
  { genres: ['Drama', 'Romance', '[object Object]', 'Accion', 'Shōnen'], year: 2016 },
  { genres: ['Drama', 'Acción', 'Horror', 'Slice of Life', 'Shonen'], year: 2024 },
  { genres: ['Ekstasis'], year: 0 },
];
assert.deepEqual(generosDisponibles(catalogo), [
  'Acción',
  'Drama',
  'Recuentos de la vida',
  'Romance',
  'Shonen',
  'Terror',
]);
assert.deepEqual(rangoAnios(catalogo), { min: 2016, max: 2024 });
assert.equal(rangoAnios([{ year: 0 }]), null);

// Ordenación: no muta y desempata por título.
const base = [
  { title: 'B', year: 2020, rating: 9 },
  { title: 'A', year: 2024, rating: 7 },
  { title: 'C', year: 2024, rating: 8 },
];
assert.deepEqual(ordenarAnimes(base, 'az').map((a) => a.title), ['A', 'B', 'C']);
assert.deepEqual(ordenarAnimes(base, 'za').map((a) => a.title), ['C', 'B', 'A']);
assert.deepEqual(ordenarAnimes(base, 'nuevos').map((a) => a.title), ['A', 'C', 'B']);
assert.deepEqual(ordenarAnimes(base, 'antiguos').map((a) => a.title), ['B', 'A', 'C']);
assert.deepEqual(ordenarAnimes(base, 'valorados').map((a) => a.title), ['B', 'C', 'A']);
assert.deepEqual(base.map((a) => a.title), ['B', 'A', 'C']);
assert.deepEqual(ordenarAnimes(base, 'defecto').map((a) => a.title), ['B', 'A', 'C']);

// Capítulos por fecha y nota; personajes sin fecha caen a A-Z;
// hilos nuevos primero por defecto.
const eps = [
  { title: 'B', airDate: '2024-01-02', rating: 7 },
  { title: 'A', airDate: '2024-01-01', rating: 9 },
];
assert.deepEqual(ordenarEpisodios(eps, 'nuevos').map((e) => e.title), ['B', 'A']);
assert.deepEqual(ordenarEpisodios(eps, 'valorados').map((e) => e.title), ['A', 'B']);
const pers = [
  { name: 'B', likesCount: 1 },
  { name: 'A', likesCount: 5 },
];
assert.deepEqual(ordenarPersonajes(pers, 'nuevos').map((p) => p.name), ['A', 'B']);
assert.deepEqual(ordenarPersonajes(pers, 'valorados').map((p) => p.name), ['A', 'B']);
const hilos = [
  { title: 'Viejo', createdAt: '2024-01-01', likesCount: 10 },
  { title: 'Nuevo', createdAt: '2024-06-01', likesCount: 1 },
];
assert.deepEqual(ordenarHilos(hilos, 'defecto').map((h) => h.title), ['Nuevo', 'Viejo']);
assert.deepEqual(ordenarHilos(hilos, 'valorados').map((h) => h.title), ['Viejo', 'Nuevo']);

// Sin duplicados por id, manteniendo el primero.
assert.deepEqual(
  sinDuplicados([{ id: 'a' }, { id: 'b' }, { id: 'a' }]).map((x) => x.id),
  ['a', 'b'],
);

// El capítulo hereda los filtros del padre; sin ficha no se juzga.
const padres = new Map([['x', serie]]);
assert.equal(episodioDeAnimeValido(padres, 'x', combinados), true);
assert.equal(episodioDeAnimeValido(padres, 'x', { ...FILTROS_VACIOS, generos: ['Terror'] }), false);
assert.equal(episodioDeAnimeValido(padres, 'desconocido', combinados), true);

// Los hilos filtran por su categoría del foro, sin tildes ni
// mayúsculas de por medio. Vacío = todas.
const hilo = { categoryName: 'Seinen & Psicológico' };
assert.equal(pasaCategoriaHilo(hilo, FILTROS_VACIOS), true);
assert.equal(
  pasaCategoriaHilo(hilo, { ...FILTROS_VACIOS, categorias: ['Seinen & Psicológico'] }),
  true,
);
assert.equal(
  pasaCategoriaHilo(hilo, { ...FILTROS_VACIOS, categorias: ['seinen & psicologico', 'Romance & Comedia'] }),
  true,
);
assert.equal(
  pasaCategoriaHilo(hilo, { ...FILTROS_VACIOS, categorias: ['Romance & Comedia'] }),
  false,
);

// La categoría del hilo viaja solo entre hilos: al salir a
// animes se cae (ahí manda la temática del catálogo), y al
// entrar desde animes llega vacía.
assert.deepEqual(
  sanearFiltros({ ...FILTROS_VACIOS, categorias: ['Romance & Comedia'] }, 'all').categorias,
  [],
);
const aHilos = sanearFiltros({ ...FILTROS_VACIOS, orden: 'nuevos' }, 'threads');
assert.deepEqual(aHilos.categorias, []);
assert.equal(
  contarFiltrosActivos({ ...FILTROS_VACIOS, categorias: ['A', 'B'] }),
  2,
);

console.log('  wiki-filtros: TODO CORRECTO');
