// META - Shimoneta
//
// TVDB 293774 "下ネタという概念が存在しない退屈な世界" (2015,
// Ended). Los anuncios y comentarios de S0 no entran: promos, y
// aqui eso no entra.
// AniList 20910 (T1, 2015, 12 capitulos).
// IMDb tt4967674.
//
// El titulo corto es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Shimoneta',

  japaneseTitle: '下ネタという概念が存在しない退屈な世界',

  synopsis:
    'Tanukichi entra al instituto mas decente y Ayame lo ficha para SOX, terrorismo guarro. ' +
    'Entre Anna desatada, Otome dibujando y moral con bragas fuera, el instituto arde. ' +
    'Doce capitulos de J.C.STAFF con lo prohibido por bandera.',

  anio: 2015,
  estado: 'finished',
  estudio: 'J.C.STAFF',

  // Comedia guarra escolar con terrorismo de bragas: risas y
  // moral. Son dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Ecchi', 'Escolar', 'Distopía', 'Parodia'],
};

export const ANIME_ID = 'shimoneta';

/**
 * Nota de la serie completa en IMDb, serie tt4967674: 6,9 con unos
 * 4.300 votos. El 4 es lo mejor con 7,8.
 */
export const RATING_SERIE = 6.9;

/**
 * Capitulos en total.
 *
 *   T1  12  (julio - septiembre de 2015)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

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
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'J.C.STAFF',
    synopsis:
      'Doce capitulos entre el 4 de julio y el 19 de septiembre de 2015. ' +
      'Tanukichi fichado por SOX con Anna desatada y Otome dibujando. ' +
      'Cierra con el guarreo declarado eterno.',
    capitulos: 'T1',
  },
];
