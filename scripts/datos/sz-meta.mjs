// META - Suzume no Tojimari
//
// AniList 142770 (peli, 2022, 122 minutos).
// IMDb tt16428256.
// TVDB la tiene como peli suelta (movie 331904), sin arte de
// episodio: el capitulo va sin miniatura. El corto del Big Mac es
// promo y no entra.
//
// El titulo romanizado es el oficial en todo el mundo ("Suzume"
// es la licencia en ingles).

export const ANIME = {
  titulo: 'Suzume no Tojimari',

  japaneseTitle: 'すずめの戸締まり',

  synopsis:
    'Suzume abre una puerta que no debia y el gusano de los terremotos sale a pasear por Japon. ' +
    'Con Souta hecho silla y un gato blanco por delante, cierra puertas de pueblo en pueblo. ' +
    'Ciento veintidos minutos de Shinkai cerrando su trilogia del desastre.',

  anio: 2022,
  estado: 'finished',
  estudio: 'CoMix Wave',

  // Road movie fantastica de desastres con duelo y madurez: puerta
  // y terremoto. Son dos.
  categorias: ['Fantasía & Aventura', 'Seinen & Psicológico'],

  generos: ['Aventura', 'Drama', 'Fantasía', 'Sobrenatural', 'Misterio', 'Coming-of-age', 'Magia'],
};

export const ANIME_ID = 'suzume-no-tojimari';

/**
 * Nota de la peli completa en IMDb, tt16428256: 7,6 con unos
 * 66.000 votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total: la peli, del 11 de noviembre de 2022.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 *   · Netflix -> tambien en catalogo, segun JustWatch España.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'CoMix Wave',
    synopsis:
      'Ciento veintidos minutos del 11 de noviembre de 2022. ' +
      'Suzume y Souta-silla cerrando puertas contra el gusano, del pueblo a Tokio. ' +
      'Shinkai cierra la trilogia con gato, silla y terremoto.',
    capitulos: 'T1',
  },
];
