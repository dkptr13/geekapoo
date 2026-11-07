// META - Bocchi the Rock!
//
// TVDB 413522 "ぼっち・ざ・ろっく！" (2022, Ended). El extra de
// Navidad y las dos compis van en S0 sin imagen y no entran; la
// S2 anunciada esta vacia (TBA) y no entra hasta emitirse.
// AniList 130003 (T1, 2022, 12 capitulos).
// IMDb tt17158756 (el S2E1 es esa segunda sin fecha).
//
// El titulo con exclamacion es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Bocchi the Rock!',

  japaneseTitle: 'ぼっち・ざ・ろっく！',

  synopsis:
    'Hitori toca la guitarra de miedo y no sabe pedir ni un cafe. Nijika la arrastra a Kessoku Band con Ryou y Kita por bandera. ' +
    'Entre el local Starry, el festival del instituto y una caja de carton por camerino, la mas timida aprende a hacer ruido.',

  anio: 2022,
  estado: 'finished',
  estudio: 'CloverWorks',

  // Comedia escolar de banda con ansiedad social de propina: risas
  // y chicas de instituto. Son dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Música', 'Recuentos de la vida', 'Escolar', 'Coming-of-age'],
};

export const ANIME_ID = 'bocchi-the-rock';

/**
 * Nota de la serie completa en IMDb, serie tt17158756: 8,3 con unos
 * 9.700 votos. El 8 es lo mejor con 9,3.
 */
export const RATING_SERIE = 8.3;

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
    estudio: 'CloverWorks',
    synopsis:
      'Doce capitulos entre el 9 de octubre y el 25 de diciembre de 2022. ' +
      'Bocchi entra en Kessoku Band sin saber socializar: Starry, festival del instituto y bolo salvando el local. ' +
      'Cierra por Navidad tocando para otros y ya no sola.',
    capitulos: 'T1',
  },
];
