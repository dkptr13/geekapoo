// META - SPY×FAMILY
//
// TVDB 405920 "SPY×FAMILY" (2022, Continuing). La S1 junta las
// dos partes (25), la S2 es la Season 2 (12) y la S3 la Season 3
// (13). La peli va en Specials (S0E3); el cursillo, el anuncio y
// la publi no entran.
// AniList 140960 (T1 parte 1, 2022, 12), 142838 (T1 parte 2,
// 2022, 13), 158928 (T2 peli, 2023), 158927 (T3 Season 2, 2023,
// 12) y 177937 (T4 Season 3, 2025, 13).
// IMDb tt13706018 (serie) y tt26684398 (peli).
//
// El titulo con la equis es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'SPY×FAMILY',

  japaneseTitle: 'SPY×FAMILY',

  synopsis:
    'Twilight necesita familia en una semana y adopta a Anya, que lee mentes, y se casa con Yor, que mata de noche. ' +
    'Entre Eden, misiones y un perro que ve el futuro, la tapadera se vuelve familia de verdad. ' +
    'Cuatro entregas de WIT y CloverWorks con cacahuetes y secretos.',

  anio: 2022,
  estado: 'emitiendo',
  estudio: 'WIT STUDIO',

  // Comedia de espias con familia falsa: accion shonen y risas.
  // Son dos.
  categorias: ['Shonen & Acción', 'Romance & Comedia'],

  generos: ['Acción', 'Comedia', 'Espionaje', 'Familiar'],
};

export const ANIME_ID = 'spy-family';

/**
 * Nota de la serie completa en IMDb, serie tt13706018: 8,2 con unos
 * 65.800 votos. El T1 E2 es lo mejor con 8,9.
 */
export const RATING_SERIE = 8.2;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   25  (abril - diciembre de 2022, dos partes juntas)
 *   T2    1  (diciembre de 2023, peli CODE: White)
 *   T3   12  (octubre - diciembre de 2023, Season 2)
 *   T4   13  (octubre - diciembre de 2025, Season 3)
 *   --
 *        51
 */
export const EPISODIOS_TOTAL = 51;

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
    estudio: 'WIT STUDIO',
    synopsis:
      'Veinticinco capitulos entre el 9 de abril y el 24 de diciembre de 2022, con las dos partes juntas. ' +
      'Twilight monta la familia, Anya entra en Eden y Bond se une con visiones. ' +
      'Cierra con Desmond a la vista y contacto sin contacto.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'CODE: White',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'WIT STUDIO',
    synopsis:
      'Ciento diez minutos del 22 de diciembre de 2023. ' +
      'Concurso de cocina con microfilm en el postre y Anya decidiendo mundos. ' +
      'Peli de puente entre temporadas.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Season 2',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'WIT STUDIO',
    synopsis:
      'Doce capitulos entre el 7 de octubre y el 23 de diciembre de 2023. ' +
      'Crucero con Yor desatada y futuro unido a mano. ' +
      'Cierra con Bond ya de la casa del todo.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Season 3',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'WIT STUDIO',
    synopsis:
      'Trece capitulos entre el 4 de octubre y el 27 de diciembre de 2025. ' +
      'Bus secuestrado y cloacas con Anya y Damian al frente. ' +
      'Cierra con mundo que no perdona y familia que si.',
    capitulos: 'T4',
  },
];
