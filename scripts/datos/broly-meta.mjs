// META - Dragon Ball Super: Broly
//
// AniList 101302 (película, 2018, 100 minutos).
// IMDb tt7961060: 7,7.
// JustWatch ES: tm371140. Disponible en Netflix, Prime Video, AnimeBox,
// Apple TV y Rakuten TV en España.
//
// Toei Animation produce la película, dirigida por Tatsuya Nagamine y
// estrenada en Japón el 14 de diciembre de 2018.

export const ANIME = {
  titulo: 'Dragon Ball Super: Broly',

  japaneseTitle: 'ドラゴンボール超 ブロリー',

  synopsis:
    'Goku y Vegeta entrenan en la Tierra mientras Freeza busca nuevas formas de aumentar su poder. ' +
    'La llegada de Broly, un saiyano con una fuerza descomunal, desata una batalla que obliga a los dos guerreros a unir fuerzas. ' +
    'La película repasa el pasado de los saiyanos y el origen del guerrero legendario.',

  anio: 2018,
  estado: 'finished',
  estudio: 'Toei Animation',

  // Aventura y peleas de la franquicia: los dos cajones de siempre.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Ciencia ficción'],
};

export const ANIME_ID = 'dragon-ball-super-broly';

export const ALIASES = ['DB Super Broly'];

export const RATING_SERIE = 7.7;

export const EPISODIOS_TOTAL = 1;

/**
 * Donde se ve en España.
 *
 *   · Netflix       -> incluida en el catálogo.
 *   · Prime Video   -> incluida en el catálogo.
 *   · AnimeBox      -> catálogo por suscripción.
 *   · Apple TV      -> alquiler y compra.
 *   · Rakuten TV    -> alquiler y compra.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Prime Video', url: 'https://www.primevideo.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
  { name: 'Apple TV', url: 'https://tv.apple.com', badgeColor: 'bg-neutral-500/20 text-neutral-300' },
  { name: 'Rakuten TV', url: 'https://www.rakuten.tv', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Película estrenada en Japón el 14 de diciembre de 2018. Freeza recluta a Broly y a su padre Paragus para vengarse de Goku y Vegeta. ' +
      'La lucha saca a la luz el pasado del planeta Vegeta y el poder del saiyano legendario.',
    capitulos: 'T1',
  },
];
