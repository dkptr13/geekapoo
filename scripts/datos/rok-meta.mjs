// META - Ranking of Kings
//
// AniList 113717 (serie, 2021, 23 capítulos de 23 minutos).
// IMDb tt13409432: 8,4.
// JustWatch ES: ts265144. Disponible en Crunchyroll en España.
//
// WIT STUDIO adapta el manga de Sousuke Touka. Emitida en Fuji TV del
// 15 de octubre de 2021 al 25 de marzo de 2022.

export const ANIME = {
  titulo: 'Ranking of Kings',

  japaneseTitle: '王様ランキング',

  synopsis:
    'Bojji es el príncipe heredero de Bosse, un niño sordo y tan débil que no puede levantar una espada. ' +
    'Su padre muere y su hermano pequeño, Daida, sube al trono mientras una figura en el espejo mueve los hilos. ' +
    'Bojji se marcha con Kage, una sombra parlante, para entrenar y demostrar que la valentía no se mide en fuerza.',

  anio: 2021,
  estado: 'finished',
  estudio: 'WIT STUDIO',

  // Cuento medieval con discapacidad, conspiraciones y un príncipe
  // que gana a base de corazón: fantasía de aventuras y drama.
  categorias: ['Fantasía & Aventura', 'Drama'],

  generos: ['Aventura', 'Fantasía', 'Drama', 'Acción'],
};

export const ANIME_ID = 'ranking-of-kings';

export const ALIASES = ['Ousama Ranking'];

/**
 * Nota de la serie completa en IMDb, tt13409432: 8,4 con unos 21.000
 * votos. Los episodios 2 y 21 son lo mejor con 9,4.
 */
export const RATING_SERIE = 8.4;

/**
 * Capítulos en total.
 *
 *   T1  23  (octubre de 2021 - marzo de 2022)
 *   --
 *        23
 */
export const EPISODIOS_TOTAL = 23;

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
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'WIT STUDIO',
    synopsis:
      'Veintitrés episodios emitidos entre octubre de 2021 y marzo de 2022. Bojji, un príncipe sordo y débil, conoce a Kage y se embarca en un viaje para hacerse fuerte. ' +
      'Mientras tanto, Daida ocupa el trono, Miranjo mueve los hilos desde el espejo y el inframundo envía a sus caballeros. La temporada cierra con la verdad sobre Bosse y la coronación de Bojji.',
    capitulos: 'T1',
  },
];
