// META - Maboroshi
//
// AniList 136149 (peli, 2023, 111 minutos).
// IMDb tt14935892.
// TVDB la tiene como peli suelta (movie 345424), sin arte de
// episodio: el capitulo va sin miniatura.
//
// El titulo corto es el oficial en todo el mundo (Netflix).

export const ANIME = {
  titulo: 'Maboroshi',

  japaneseTitle: 'アリスとテレスのまぼろし工場',

  synopsis:
    'Una explosion deja al pueblo parado en el tiempo y Masamune, de 14 años, se enamora de una niña feral. ' +
    'Entre fabrica, invierno eterno y prohibicion de cambiar, el amor adolescente lo pone todo patas arriba. ' +
    'Ciento once minutos de Okada con MAPPA al frente.',

  anio: 2023,
  estado: 'finished',
  estudio: 'MAPPA',

  // Drama fantastico romantico con pueblo congelado: amor y fin
  // del cambio. Son dos.
  categorias: ['Fantasía & Aventura', 'Romance & Comedia'],

  generos: ['Drama', 'Romance', 'Fantasía', 'Sobrenatural'],
};

export const ANIME_ID = 'maboroshi';

/**
 * Nota de la peli completa en IMDb, tt14935892: 6,4 con unos 3.100
 * votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 6.4;

/**
 * Capitulos en total: la peli, del 15 de septiembre de 2023.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> estreno mundial en streaming, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Ciento once minutos del 15 de septiembre de 2023. ' +
      'Pueblo congelado tras la explosion con Masamune enamorado de la niña feral. ' +
      'Okada con amor adolescente contra un mundo que prohibe cambiar.',
    capitulos: 'T1',
  },
];
