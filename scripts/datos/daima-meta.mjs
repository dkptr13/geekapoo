// META - Dragon Ball Daima
//
// AniList 170083 (serie, 2024, 20 capítulos de 24 minutos).
// IMDb tt29485149: 7,7.
// JustWatch ES: ts407747. Disponible en Netflix, RTVE Play (gratis),
// Crunchyroll y AnimeBox en España.
//
// Toei Animation produce la serie, emitida en Fuji TV del 11 de octubre
// de 2024 al 28 de febrero de 2025. Es la última obra de Akira Toriyama
// con guion y diseño de personajes originales.

export const ANIME = {
  titulo: 'Dragon Ball Daima',

  japaneseTitle: 'ドラゴンボールDAIMA',

  synopsis:
    'Tras la derrota de Majin Buu, Gomah y Degesu convierten a Goku y sus amigos en niños y se llevan las bolas de dragón al Reino de los Demonios. ' +
    'Goku, el Kaioushin, Glorio y Panzy cruzan a un mundo dividido en tres reinos para recuperarlas y volver a su tamaño normal. ' +
    'Un viaje de aventuras con artes marciales, magia y los tamagamis custodiando las bolas.',

  anio: 2024,
  estado: 'finished',
  estudio: 'Toei Animation',

  // Aventuras de artes marciales con el humor de Toriyama: los dos
  // cajones de siempre para la franquicia.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Comedia', 'Artes marciales'],
};

export const ANIME_ID = 'dragon-ball-daima';

/**
 * Nota de la serie completa en IMDb, tt29485149: 7,7 con unos 5.500
 * votos. El 19 es lo mejor con 9,5.
 */
export const RATING_SERIE = 7.7;

/**
 * Capítulos en total.
 *
 *   T1  20  (octubre de 2024 - febrero de 2025)
 *   --
 *        20
 */
export const EPISODIOS_TOTAL = 20;

/**
 * Donde se emite en España.
 *
 *   · Netflix       -> licencia global, con castellano.
 *   · RTVE Play     -> emisión gratuita en Clan.
 *   · Crunchyroll   -> simulcast y catálogo completo.
 *   · AnimeBox      -> catálogo por suscripción.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'RTVE Play', url: 'https://www.rtve.es/play/', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Veinte episodios emitidos entre octubre de 2024 y febrero de 2025. Goku y sus amigos, convertidos en niños, recorren los tres reinos demoníacos en busca de las bolas de dragón. ' +
      'La temporada presenta a Glorio, Panzy, los tamagamis y al nuevo rey Gomah, y cierra con una batalla por el Tercer Ojo y el regreso a la forma adulta.',
    capitulos: 'T1',
  },
];
