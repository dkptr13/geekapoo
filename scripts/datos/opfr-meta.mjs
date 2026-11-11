// META - One Piece Film: Red
//
// AniList 141902 (película, 2022, 115 minutos).
// IMDb tt16183464: 6,7.
// JustWatch ES: tm1130284. Disponible en Prime Video, AnimeBox,
// Rakuten TV y Apple TV (alquiler y compra) en España.
//
// Toei Animation produce la película, dirigida por Goro Taniguchi y
// estrenada en Japón el 6 de agosto de 2022.

export const ANIME = {
  titulo: 'One Piece Film: Red',

  japaneseTitle: 'ONE PIECE FILM RED',

  synopsis:
    'Uta es la cantante más famosa del mundo y prepara un concierto que reunirá a piratas, marinos y civiles. ' +
    'Luffy y su tripulación acuden sin saber que la voz de Uta puede atrapar a todo el público en un mundo de canciones. ' +
    'Detrás del espectáculo está el pasado de Shanks y un plan para cambiar el orden del mundo.',

  anio: 2022,
  estado: 'finished',
  estudio: 'Toei Animation',

  // Aventura pirata con concierto y peleas: los dos cajones de la
  // franquicia.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Comedia', 'Música'],
};

export const ANIME_ID = 'one-piece-film-red';

// El título japonés de la película está escrito en letras latinas, sin
// kanji ni kana, igual que en el estreno de 2022.
export const TITULOS_EN_INGLES = true;

export const ALIASES = ['One Piece: Red'];

export const RATING_SERIE = 6.7;

export const EPISODIOS_TOTAL = 1;

/**
 * Donde se ve en España.
 *
 *   · Prime Video   -> incluida en el catálogo.
 *   · AnimeBox      -> catálogo por suscripción.
 *   · Rakuten TV    -> alquiler y compra.
 *   · Apple TV      -> alquiler y compra.
 */
export const STREAMING = [
  { name: 'Prime Video', url: 'https://www.primevideo.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
  { name: 'Rakuten TV', url: 'https://www.rakuten.tv', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Apple TV', url: 'https://tv.apple.com', badgeColor: 'bg-neutral-500/20 text-neutral-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Película estrenada en Japón el 6 de agosto de 2022. Uta, la hija de Shanks, ofrece un concierto mundial con una canción capaz de atrapar a todo el público. ' +
      'Luffy, su tripulación y varios aliados tienen que liberar a los asistentes y enfrentarse al pasado de la familia de Uta.',
    capitulos: 'T1',
  },
];
