// META - Wind Breaker
//
// AniList 163270 (serie, 2024, 13 capítulos de 24 minutos).
// IMDb tt29605391: 7,4.
// JustWatch ES: ts389317. Disponible en Crunchyroll en España.
//
// CloverWorks adapta el manga de Satoru Nii. Emitida del 5 de abril al
// 28 de junio de 2024.

export const ANIME = {
  titulo: 'Wind Breaker',

  japaneseTitle: 'WIND BREAKER',

  synopsis:
    'Haruka Sakura llega a Furin, un instituto conocido por sus peleas, con la intención de ser el más fuerte. ' +
    'Allí descubre que los alumnos protegen el barrio y que la verdadera fuerza consiste en defender a los demás. ' +
    'Con Nirei, Suou y el resto de la clase, aprende que pertenecer a un lugar también implica pelear por él.',

  anio: 2024,
  estado: 'finished',
  estudio: 'CloverWorks',

  // Acción escolar con bandas y peleas callejeras: los dos cajones
  // que mejor encajan con la serie.
  categorias: ['Shonen & Acción', 'Drama'],

  generos: ['Acción', 'Drama', 'Escolar'],
};

export const ANIME_ID = 'wind-breaker';

// El título japonés está escrito en letras latinas, sin kanji ni kana.
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, tt29605391: 7,4. El episodio 8 es
 * lo mejor con 9,1.
 */
export const RATING_SERIE = 7.4;

/**
 * Capítulos en total.
 *
 *   T1  13  (abril - junio de 2024)
 *   --
 *        13
 */
export const EPISODIOS_TOTAL = 13;

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
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Trece episodios emitidos entre abril y junio de 2024. Sakura entra en Furin y descubre que la escuela protege el barrio en lugar de sembrar el caos. ' +
      'La temporada presenta a Bofurin, a los Cuatro Reyes y el conflicto con Shishitoren, y cierra con la clase 1-1 convertida en una familia.',
    capitulos: 'T1',
  },
];
