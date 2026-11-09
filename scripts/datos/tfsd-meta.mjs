// META - The First Slam Dunk
//
// AniList 128207 (peli, 2022, 124 minutos).
// IMDb tt15242330: 8,0 con unas 13.500 votos.
// JustWatch ES: tm1095723. Disponible en Netflix en España.
//
// El título oficial es el inglés y no tiene versión japonesa distinta:
// AniList lo lista como THE FIRST SLAM DUNK. Por eso el meta lleva
// TITULOS_EN_INGLES, igual que Tokyo Revengers, y el comprobador no
// exige kanji ni kana en el título del capítulo.

export const ANIME = {
  titulo: 'The First Slam Dunk',

  japaneseTitle: 'THE FIRST SLAM DUNK',

  synopsis:
    'Ryouta Miyagi es el base del Shohoku y juega con el recuerdo de su hermano mayor, que murió cuando él era pequeño. ' +
    'En el campeonato nacional, el equipo se enfrenta al Sannoh, el campeón invicto, con Hanamichi, Rukawa, Mitsui y Akagi al lado. ' +
    'La película intercala el partido con la historia de Ryouta para contar lo que cuesta jugar por alguien que ya no está.',

  anio: 2022,
  estado: 'finished',
  estudio: 'Toei Animation',

  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Deportes', 'Baloncesto', 'Equipo', 'Amistad', 'Competencia', 'Drama', 'Shonen', 'Coming-of-age'],
};

export const ANIME_ID = 'the-first-slam-dunk';

export const ALIASES = ['Slam Dunk: The Movie', 'El primer Slam Dunk', 'スラムダンク'];

/**
 * El título oficial es el inglés. No hay subtítulo japonés que buscar.
 */
export const TITULOS_EN_INGLES = true;

export const RATING_SERIE = 8.0;

export const EPISODIOS_TOTAL = 1;

export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'La película, estrenada en Japón el 3 de diciembre de 2022. El Shohoku llega al campeonato nacional y se mide al Sannoh, el equipo que lleva años sin perder. El partido ocupa casi todo el metraje, pero la historia de Ryouta y su hermano es la que explica por qué cada posesión pesa tanto.',
    capitulos: 'T1',
  },
];
