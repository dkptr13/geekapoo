// META - Golden Time
//
// TVDB 272138 "ゴールデンタイム" (2013, Ended).
// AniList 17895 (T1, 2013, 24 capitulos).
// IMDb tt3105452.
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Golden Time',

  japaneseTitle: 'ゴールデンタイム',

  synopsis:
    'Banri entra en la universidad sin recuerdos por una caida del puente. ' +
    'Kouko, perfecta y explosiva, lo arrastra a su orbita mientras Linda, amiga de antes, calla lo que sabe. ' +
    'Entre club de festivales, playa y un fantasma del yo anterior, Banri elige su futuro con memoria o sin ella.',

  anio: 2013,
  estado: 'finished',
  estudio: 'J.C.STAFF',

  // Romance universitario con drama de amnesia: los dos cajones de
  // siempre para este genero.
  categorias: ['Romance & Comedia', 'Josei & Drama'],

  generos: ['Romance', 'Comedia', 'Drama', 'Universitario'],
};

export const ANIME_ID = 'golden-time';

/**
 * Nota de la serie completa en IMDb, serie tt3105452: 7,6 con unos
 * 7.000 votos. El 24 es lo mejor con 8,9 y el 7 lo peor con 6,3.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total.
 *
 *   T1  24  (octubre de 2013 - marzo de 2014)
 *   --
 *       24
 */
export const EPISODIOS_TOTAL = 24;

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
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'J.C.STAFF',
    synopsis:
      'Veinticuatro capitulos entre el 4 de octubre de 2013 y el 28 de marzo de 2014. ' +
      'Banri sin memoria, Kouko perfecta, Linda callada y el club de festivales de por medio. ' +
      'Playa, pueblo, fantasma interior y boda futura: el tiempo dorado de verdad.',
    capitulos: 'T1',
  },
];
