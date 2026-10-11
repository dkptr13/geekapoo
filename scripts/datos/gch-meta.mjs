// META - Gachiakuta
//
// TVDB 450537 "ガチアクタ" (2025, Continuing; la S2E1 vacia es la
// segunda anunciada sin fecha ni capitulos y no entra).
// AniList 178025 (T1, 2025, 24 capitulos).
// IMDb tt32612521.
//
// El titulo corto es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Gachiakuta',

  japaneseTitle: 'ガチアクタ',

  synopsis:
    'Rudo vive en la ciudad flotante rebuscando basura que arreglar con Regto, su padre adoptivo. ' +
    'Lo acusan de su asesinato y lo tiran al Abismo, el vertedero del mundo bajo. ' +
    'Alli lo recogen los Barrenderos de Enjin, que cazan bestias de desecho con objetos con alma. ' +
    'Guantes heredados, saqueadores y venganza mirando al cielo: subir es la unica direccion.',

  anio: 2025,
  estado: 'emitiendo',
  estudio: 'Bones Film',

  // Accion sucia de chatarra y fantasia oscura de vertedero, con
  // drama de venganza por debajo. Son tres.
  categorias: ['Shonen & Acción', 'Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico'],

  generos: ['Acción', 'Drama', 'Fantasía', 'Distopía'],
};

export const ANIME_ID = 'gachiakuta';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * La T1 E21 se titula "TIME ATTACK" tambien en Japon, tal como lo
 * lista TVDB. La bandera le dice a `comprobar-datos.mjs` que no
 * exija kanji ni kana en el campo japones. Los otros 23 si lo
 * traen.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb: 8,3 de media ponderada de los
 * 24 capitulos (tt32612521, unos 47.000 votos entre todos). El 13 y
 * el 21 son lo mejor con 9,2 y el 8 y el 9 lo peor con 7,5.
 */
export const RATING_SERIE = 8.3;

/**
 * Capitulos en total.
 *
 *   T1  24  (julio - diciembre de 2025)
 *   --
 *       24
 *
 * La segunda, anunciada sin fecha (TVDB la lista como S2E1 vacio),
 * no entra hasta emitirse.
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
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Bones Film',
    synopsis:
      'Veinticuatro capitulos entre el 6 de julio y el 21 de diciembre de 2025. ' +
      'Rudo cae al Abismo acusado injustamente y Enjin lo ficha para los Barrenderos. ' +
      'Saqueadores, ciudad de grafitis, desierto vedado, guardianes y contrarreloj final con excursion de cierre. ' +
      'Venganza y chatarra con alma.',
    capitulos: 'T1',
  },
];
