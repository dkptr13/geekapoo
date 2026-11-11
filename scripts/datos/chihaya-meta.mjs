// META - Chihayafuru
//
// AniList 10800 (serie, 2011, 25 capítulos de 22 minutos).
// IMDb tt2150751: 8,1.
// JustWatch ES: ts11257. Disponible en Crunchyroll en España.
//
// MADHOUSE adapta el manga de Yuki Suetsugu. Emitida del 5 de octubre
// de 2011 al 28 de marzo de 2012.

export const ANIME = {
  titulo: 'Chihayafuru',

  japaneseTitle: 'ちはやふる',

  synopsis:
    'Chihaya Ayase descubre el karuta gracias a Arata, un compañero de la infancia que le enseña a escuchar los poemas y a moverse antes que nadie. ' +
    'Años después, en el instituto, funda un club con Taichi y otros compañeros para llegar a la final nacional y reencontrarse con Arata. ' +
    'Un deporte de memoria, velocidad y poemas clásicos.',

  anio: 2011,
  estado: 'finished',
  estudio: 'MADHOUSE',

  // Drama deportivo con romance y vida escolar: los dos cajones que
  // mejor describen la serie.
  categorias: ['Josei & Drama', 'Romance & Comedia'],

  generos: ['Drama', 'Romance', 'Recuentos de la vida', 'Deportes'],
};

export const ANIME_ID = 'chihayafuru';

export const ALIASES = ['Chihaya Furu'];

/**
 * Nota de la serie completa en IMDb, tt2150751: 8,1. Los episodios 11,
 * 14 y 19 son lo mejor con 9,0.
 */
export const RATING_SERIE = 8.1;

/**
 * Capítulos en total.
 *
 *   T1  25  (octubre de 2011 - marzo de 2012)
 *   --
 *        25
 */
export const EPISODIOS_TOTAL = 25;

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
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Veinticinco episodios emitidos entre octubre de 2011 y marzo de 2012. Chihaya, Taichi y Arata se conocen en la escuela y el karuta los separa y los vuelve a unir. ' +
      'En el instituto, Chihaya forma un club con Taichi y otros compañeros para competir en el nacional y volver a ver a Arata.',
    capitulos: 'T1',
  },
];
