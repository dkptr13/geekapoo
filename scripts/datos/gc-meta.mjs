// META - Guilty Crown
//
// TVDB 252471 "ギルティクラウン" (2011, Ended).
// AniList 10793 (T1, 2011, 22 capitulos).
// IMDb tt2122656.
//
// El titulo corto es el oficial en todo el mundo. El recap y los
// chibis de S0 no entran; el especial Lost Christmas si, como
// capitulo 23 de la T1.

export const ANIME = {
  titulo: 'Guilty Crown',

  japaneseTitle: 'ギルティクラウン',

  synopsis:
    'Shu esconde a Inori herida y acaba con el genoma del vacio en la mano derecha: saca el arma del corazon de la gente. ' +
    'Con Gai y los Undertakers por bandera se mide al GHQ entre voids, elecciones y Navidad Perdida. ' +
    'De chico invisible a tirano de instituto y de ahi al final con plegaria.',

  anio: 2011,
  estado: 'finished',
  estudio: 'Production I.G',

  // Mecha dramatico con misterio del virus y del pasado: ciencia
  // ficcion y psicologico, con accion shonen de propina. Son tres.
  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico', 'Shonen & Acción'],

  generos: ['Acción', 'Drama', 'Mecha', 'Psicológico', 'Romance', 'Ciencia ficción'],
};

export const ANIME_ID = 'guilty-crown';

/**
 * Nota de la serie completa en IMDb, serie tt2122656: 6,9 con unos
 * 6.700 votos. El 7 es lo mejor con 7,3 y del 1 al 6 lo peor.
 */
export const RATING_SERIE = 6.9;

/**
 * Capitulos en total.
 *
 *   T1  23  (octubre de 2011 - marzo de 2012, 22 de television + el especial Lost Christmas)
 *   --
 *       23
 */
export const EPISODIOS_TOTAL = 23;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
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
    estudio: 'Production I.G',
    synopsis:
      'Veintidos capitulos entre el 14 de octubre de 2011 y el 23 de marzo de 2012, mas el especial Lost Christmas. ' +
      'Shu saca voids, entra en los Undertakers, pierde y gana elecciones, se vuelve tirano y cae. ' +
      'Navidad Perdida en medio y convergencia final con plegaria.',
    capitulos: 'T1',
  },
];
