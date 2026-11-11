// META - Skip and Loafer
//
// AniList 141911 (serie, 2023, 12 capítulos de 24 minutos).
// IMDb tt16156718: 7,8.
// JustWatch ES: ts326198. Disponible en Crunchyroll en España.
//
// P.A.WORKS adapta el manga de Misaki Takamatsu. Emitida del 4 de abril
// al 20 de junio de 2023.

export const ANIME = {
  titulo: 'Skip and Loafer',

  japaneseTitle: 'スキップとローファー',

  synopsis:
    'Mitsumi Iwakura deja su pueblo de Ishikawa para estudiar en un instituto de Tokio. ' +
    'Está decidida a que su vida sea perfecta, pero el primer día se pierde y llega tarde. ' +
    'Allí conoce a Sousuke Shima y a un grupo de compañeros con los que descubre que la amistad, el amor y los errores también forman parte del plan.',

  anio: 2023,
  estado: 'finished',
  estudio: 'P.A.WORKS',

  // Comedia de instituto con romance y mucha vida cotidiana: los dos
  // cajones que mejor describen la serie.
  categorias: ['Romance & Comedia', 'Comedia & Slice of Life'],

  generos: ['Romance', 'Comedia', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'skip-and-loafer';

export const ALIASES = ['Skip to Loafer'];

/**
 * Nota de la serie completa en IMDb, tt16156718: 7,8 con unos 4.500
 * votos. El 6 es lo mejor con 8,5.
 */
export const RATING_SERIE = 7.8;

/**
 * Capítulos en total.
 *
 *   T1  12  (abril - junio de 2023)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia completa, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'P.A.WORKS',
    synopsis:
      'Doce episodios emitidos entre abril y junio de 2023. Mitsumi llega desde Ishikawa a un instituto de Tokio y descubre que la vida perfecta que había planeado no cabe en un curso escolar. ' +
      'La temporada sigue su amistad con Shima, Mika, Yuzuki y Makoto, el club de teatro, los exámenes y el festival cultural.',
    capitulos: 'T1',
  },
];
