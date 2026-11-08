/**
 * Contratos del índice incremental.
 *
 * Se construyen documentos REST de prueba, se transforman con las mismas
 * funciones que usa el generador y se comprueba que una actualización
 * parcial produce exactamente el mismo índice que la reconstrucción
 * completa sobre los mismos datos.
 */
import assert from 'node:assert/strict';

import {
  TRANSFORMADORES,
  crearIndice,
  fusionarSeccion,
  mapaDeStreaming,
  mapaDeTemporadas,
  ordenarIndice,
  validarIndice,
} from '../scripts/indice-busqueda-logic.mjs';

const texto = (value: string) => ({ stringValue: value });
const entero = (value: number) => ({ integerValue: String(value) });
const lista = (values: string[]) => ({ arrayValue: { values: values.map(texto) } });

const doc = (id: string, fields: Record<string, unknown>) => ({
  id,
  f: fields,
  actualizado: '2026-01-01T00:00:00.000Z',
});

const docs = {
  animes: [
    doc('anime-a', {
      slug: texto('anime-a'),
      title: texto('Anime A'),
      year: entero(2020),
    }),
    doc('anime-b', {
      slug: texto('anime-b'),
      title: texto('Anime B'),
      year: entero(2021),
    }),
  ],
  seasons: [
    doc('anime-a-s1', { animeId: texto('anime-a'), number: entero(1) }),
    doc('anime-b-s1', { animeId: texto('anime-b'), number: entero(1) }),
  ],
  episodes: [
    doc('anime-a-e1', {
      animeId: texto('anime-a'),
      seasonId: texto('anime-a-s1'),
      number: entero(1),
      title: texto('Episodio A1'),
    }),
    doc('anime-b-e1', {
      animeId: texto('anime-b'),
      seasonId: texto('anime-b-s1'),
      number: entero(1),
      title: texto('Episodio B1'),
    }),
  ],
  characters: [
    doc('anime-a-c1', {
      animeId: texto('anime-a'),
      name: texto('Personaje A'),
      role: texto('main'),
    }),
    doc('anime-b-c1', {
      animeId: texto('anime-b'),
      name: texto('Personaje B'),
      role: texto('supporting'),
    }),
  ],
  streamingAvailability: [
    doc('anime-a__netflix__ES', {
      animeId: texto('anime-a'),
      platformId: texto('netflix'),
      region: texto('ES'),
      status: texto('available'),
      accessType: texto('subscription'),
    }),
    doc('anime-b__netflix__ES', {
      animeId: texto('anime-b'),
      platformId: texto('netflix'),
      region: texto('ES'),
      status: texto('unavailable'),
      accessType: texto('unknown'),
    }),
  ],
};

const transformadas = {
  animes: docs.animes.map(TRANSFORMADORES.animes),
  seasons: docs.seasons.map(TRANSFORMADORES.seasons),
  episodes: docs.episodes.map(TRANSFORMADORES.episodes),
  characters: docs.characters.map(TRANSFORMADORES.characters),
  streaming: docs.streamingAvailability.map(TRANSFORMADORES.streamingAvailability),
};

const base = crearIndice({ ...transformadas, generado: '2026-01-01T00:00:00.000Z' });

assert.equal(base.animes.length, 2);
assert.equal(base.episodes.length, 2);
assert.equal(base.streaming.length, 2);
assert.equal(validarIndice(base).ok, true, 'el índice base es válido');
assert.deepEqual(
  Object.keys(mapaDeTemporadas(base.animes, base.seasons)).sort(),
  ['anime-a', 'anime-b'],
  'temporadas incluye todos los animes, aunque estén vacíos',
);
assert.equal(
  mapaDeStreaming(base.animes, base.streaming)['anime-a'].ES[0].platformId,
  'netflix',
);

// ──────────────────────────────────────────────────────────
// 1. CAMBIO DE EPISODIOS DE UN ANIME
// ──────────────────────────────────────────────────────────

const episodioNuevo = TRANSFORMADORES.episodes(
  doc('anime-a-e1', {
    animeId: texto('anime-a'),
    seasonId: texto('anime-a-s1'),
    number: entero(1),
    title: texto('Episodio A1 corregido'),
  }),
);
const episodioExtra = TRANSFORMADORES.episodes(
  doc('anime-a-e2', {
    animeId: texto('anime-a'),
    seasonId: texto('anime-a-s1'),
    number: entero(2),
    title: texto('Episodio A2'),
  }),
);

const incrementalEpisodios = ordenarIndice(
  fusionarSeccion(
    base,
    'episodes',
    [episodioNuevo, episodioExtra],
    ['anime-a'],
  ),
);
const completoEpisodios = crearIndice({
  ...transformadas,
  episodes: [episodioNuevo, episodioExtra, transformadas.episodes[1]],
  generado: '2026-01-01T00:00:00.000Z',
});

assert.deepEqual(
  incrementalEpisodios.episodes,
  completoEpisodios.episodes,
  'actualizar episodios de un anime equivale al índice completo',
);
assert.deepEqual(
  incrementalEpisodios.animes,
  base.animes,
  'los animes no se tocan al actualizar episodios',
);
assert.deepEqual(
  incrementalEpisodios.characters,
  base.characters,
  'los personajes no se tocan al actualizar episodios',
);
assert.deepEqual(
  incrementalEpisodios.streaming,
  base.streaming,
  'el streaming no se toca al actualizar episodios',
);

// ──────────────────────────────────────────────────────────
// 2. CAMBIO DE PERSONAJES DE UN ANIME
// ──────────────────────────────────────────────────────────

const personajeNuevo = TRANSFORMADORES.characters(
  doc('anime-a-c2', {
    animeId: texto('anime-a'),
    name: texto('Personaje A2'),
    role: texto('supporting'),
  }),
);
const incrementalPersonajes = ordenarIndice(
  fusionarSeccion(
    base,
    'characters',
    [transformadas.characters[0], personajeNuevo],
    ['anime-a'],
  ),
);
assert.deepEqual(
  incrementalPersonajes.characters.map((c: any) => c.id),
  ['anime-a-c1', 'anime-a-c2', 'anime-b-c1'],
  'se sustituyen solo los personajes del anime seleccionado',
);
assert.deepEqual(incrementalPersonajes.episodes, base.episodes);

// ──────────────────────────────────────────────────────────
// 3. STREAMING INDEPENDIENTE
// ──────────────────────────────────────────────────────────

const streamingNuevo = TRANSFORMADORES.streamingAvailability(
  doc('anime-a__crunchyroll__ES', {
    animeId: texto('anime-a'),
    platformId: texto('crunchyroll'),
    region: texto('ES'),
    status: texto('available'),
    accessType: texto('subscription'),
  }),
);
const incrementalStreaming = ordenarIndice(
  fusionarSeccion(base, 'streamingAvailability', [streamingNuevo], ['anime-a']),
);
assert.deepEqual(
  incrementalStreaming.streaming.map((fila: any) => fila.id),
  ['anime-a__crunchyroll__ES', 'anime-b__netflix__ES'],
  'solo se sustituye el streaming del anime seleccionado',
);
assert.deepEqual(incrementalStreaming.animes, base.animes);
assert.deepEqual(incrementalStreaming.episodes, base.episodes);
assert.deepEqual(incrementalStreaming.characters, base.characters);

// ──────────────────────────────────────────────────────────
// 4. ANIMES Y DERIVADOS
// ──────────────────────────────────────────────────────────

const animeNuevo = TRANSFORMADORES.animes(
  doc('anime-c', {
    slug: texto('anime-c'),
    title: texto('Anime C'),
    year: entero(2022),
  }),
);
const incrementalAnimes = ordenarIndice(
  fusionarSeccion(base, 'animes', [animeNuevo], ['anime-c']),
);
assert.equal(incrementalAnimes.animes.length, 3);
assert.equal(
  incrementalAnimes.animes.some((anime: any) => anime.id === 'anime-a'),
  true,
);
assert.equal(mapaDeTemporadas(incrementalAnimes.animes, []).hasOwnProperty('anime-c'), true);

// ──────────────────────────────────────────────────────────
// 5. VALIDACIÓN
// ──────────────────────────────────────────────────────────

assert.equal(validarIndice({ ...base, episodes: [{ id: 'duplicado' }, { id: 'duplicado' }] }).ok, false);
assert.equal(validarIndice({ ...base, version: 99 }).ok, false);
assert.equal(validarIndice({ ...base, characters: 'roto' }).ok, false);

// Ids de anime repetidos: el índice no debe publicarse.
const duplicadoAnime = {
  ...base,
  animes: [...base.animes, { ...base.animes[0] }],
};
assert.equal(validarIndice(duplicadoAnime).ok, false);

console.log('logica.indice-incremental: OK');
