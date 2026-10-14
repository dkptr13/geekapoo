// META - More than a Married Couple, but Not Lovers
//
// TVDB 412806 "夫婦以上、恋人未満。" (2022, Ended). El especial y
// los dos programas de S0 no entran.
// AniList 141949 (T1, 2022, 12 capitulos).
// IMDb tt16231800.
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'More than a Married Couple, but Not Lovers',

  japaneseTitle: '夫婦以上、恋人未満。',

  synopsis:
    'Jirou emparejado con Akari para el cursillo de matrimonio soñando con Shiori. ' +
    'Entre puntos, fuegos y cambios de pareja que no llegan, fingir se vuelve querer. ' +
    'Doce capitulos de studio MOTHER con amor por puntos.',

  anio: 2022,
  estado: 'finished',
  estudio: 'studio MOTHER',

  // Comedia romantica escolar con matrimonio fingido: risas y
  // puntos. Son dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Drama', 'Romance', 'Escolar'],
};

export const ANIME_ID = 'more-than-a-married-couple-but-not-lovers';

/**
 * Nota de la serie completa en IMDb, serie tt16231800: 7,6 con unos
 * 8.200 votos. El 7 es lo mejor con 8,5.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total.
 *
 *   T1  12  (octubre - diciembre de 2022)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

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
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'studio MOTHER',
    synopsis:
      'Doce capitulos entre el 9 de octubre y el 25 de diciembre de 2022. ' +
      'Jirou y Akari fingiendo matrimonio por puntos con Shiori en medio. ' +
      'Cierre por Navidad amando sin ponerle nombre.',
    capitulos: 'T1',
  },
];
