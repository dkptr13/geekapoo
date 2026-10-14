// META - Kaoru Hana wa Rin to Saku
//
// TVDB 454524 "薫る花は凛と咲く" (2025, Ended).
// AniList 181444 (T1, 2025, 13 capitulos).
// IMDb tt36592690.
//
// El titulo romanizado es el oficial en Japon ("The Fragrant
// Flower Blooms With Dignity" es Netflix, "La nobleza de las
// flores" es España).

export const ANIME = {
  titulo: 'Kaoru Hana wa Rin to Saku',

  japaneseTitle: '薫る花は凛と咲く',

  synopsis:
    'Rintaro, cara de maton y corazon blando de Chidori, conoce a Kaoruko, pija de Kikyo, en la pasteleria. ' +
    'Entre institutos que no se hablan, el grupo espia, defiende y comparte paraguas. ' +
    'Trece capitulos de CloverWorks con azucar y muro por medio.',

  anio: 2025,
  estado: 'finished',
  estudio: 'CloverWorks',

  // Comedia romantica escolar entre institutos enemigos: risas y
  // muro. Son dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Drama', 'Romance', 'Escolar'],
};

export const ANIME_ID = 'kaoru-hana-wa-rin-to-saku';

/**
 * Nota de la serie completa en IMDb, serie tt36592690: 8,3 con unos
 * 16.800 votos. El 13 es lo mejor con 9,5.
 */
export const RATING_SERIE = 8.3;

/**
 * Capitulos en total.
 *
 *   T1  13  (julio - septiembre de 2025)
 *   --
 *        13
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> titulo de Netflix, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Trece capitulos entre el 6 de julio y el 28 de septiembre de 2025. ' +
      'Rintaro y Kaoruko entre Chidori y Kikyo: amigos que espian, paraguas compartidos y playa con dudas. ' +
      'Cierre con los dos con nombre propio y sabor a azucar.',
    capitulos: 'T1',
  },
];
