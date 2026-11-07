// META - Darwin's Game
//
// TVDB 355220 "ダーウィンズゲーム" (2020, Ended).
// AniList 105190 (T1, 2020, 11 capitulos).
// IMDb tt11405390.
//
// El titulo en ingles es el oficial en todo el mundo. El resumen
// de S0 (logline) no entra: es un recapitulo.

export const ANIME = {
  titulo: "Darwin's Game",

  japaneseTitle: 'ダーウィンズゲーム',

  synopsis:
    'Kaname acepta la invitacion al juego por el movil y lo apuñalan en Shibuya de verdad. ' +
    'Cada jugador tiene un sigilo, un superpoder con reglas, y se mata por puntos en la vida real. ' +
    'Con Shuka y su clan Sunset Ravens por bandera, Kaname pasa de presa a cazador sin dejar de ser el mismo.',

  anio: 2020,
  estado: 'finished',
  estudio: 'Nexus',

  // Accion de supervivencia con misterio de quien maneja el juego,
  // y ciencia ficcion por los sigilos. Son tres.
  categorias: ['Shonen & Acción', 'Thriller & Misterio', 'Ciencia Ficción & Cyberpunk'],

  generos: ['Acción', 'Misterio', 'Ciencia ficción', 'Supervivencia', 'Thriller'],
};

export const ANIME_ID = 'darwin-s-game';

/**
 * Nota de la serie completa en IMDb, serie tt11405390: 7,2 con unos
 * 4.400 votos. El 11 es lo mejor con 7,9 y el 2 lo peor con 7,1.
 */
export const RATING_SERIE = 7.2;

/**
 * Capitulos en total.
 *
 *   T1  11  (enero - marzo de 2020; el 1 de febrero no hubo)
 *   --
 *       11
 */
export const EPISODIOS_TOTAL = 11;

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
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'Nexus',
    synopsis:
      'Once capitulos entre el 4 de enero y el 21 de marzo de 2020. ' +
      'Kaname entra al juego, junta al clan Sunset Ravens con Shuka y planta cara a Eighth. ' +
      'Duelos con sigilos, mina de gemas, acuario y pacto de sangre final. El manga sigue.',
    capitulos: 'T1',
  },
];
