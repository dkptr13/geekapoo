// META - Summer Wars
//
// AniList 5681 (película, 2009, 114 minutos).
// IMDb tt1474276: 7,4.
// JustWatch ES: tm147599. Disponible en AnimeBox en España.
//
// MADHOUSE produce la película, dirigida por Mamoru Hosoda y estrenada
// en Japón el 1 de agosto de 2009.

export const ANIME = {
  titulo: 'Summer Wars',

  japaneseTitle: 'サマーウォーズ',

  synopsis:
    'Kenji, un genio de las matemáticas, acompaña a Natsuki a la casa de su familia en Nagano para un trabajo de verano. ' +
    'Allí se ve envuelto en la celebración del clan Jinnouchi y en un ataque al mundo virtual de OZ. ' +
    'Para salvar la red y a la familia, tendrá que resolver un problema imposible con la ayuda de todos.',

  anio: 2009,
  estado: 'finished',
  estudio: 'MADHOUSE',

  // Ciencia ficción familiar con comedia y acción: los dos cajones que
  // mejor describen la película.
  categorias: ['Ciencia Ficción & Futuro', 'Comedia & Slice of Life'],

  generos: ['Acción', 'Comedia', 'Drama', 'Romance', 'Ciencia ficción'],
};

export const ANIME_ID = 'summer-wars';

export const ALIASES = ['Summer Wars (película)', 'Samā Wōzu'];

export const RATING_SERIE = 7.4;

export const EPISODIOS_TOTAL = 1;

/**
 * Donde se ve en España.
 *
 *   · AnimeBox -> catálogo por suscripción.
 */
export const STREAMING = [
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Película estrenada en Japón el 1 de agosto de 2009. Kenji viaja a Nagano con Natsuki y conoce a los Jinnouchi, una familia numerosa y llena de secretos. ' +
      'Un programa malicioso ataca OZ y Kenji, con la ayuda de la familia, tiene que recuperar el control del mundo virtual.',
    capitulos: 'T1',
  },
];
