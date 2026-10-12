// META - Armed Girls Machiavellism
//
// TVDB 321671 "武装少女マキャヴェリズム" (2017, Ended).
// AniList 21851 (serie, 2017) y 98856 (OVA, 2017). El OVA de
// noviembre va como capitulo 13 de la T1, con nota propia en IMDb.
// IMDb tt9013220.
//
// El titulo en ingles es el oficial ("Armed Girl's Machiavellism").
// Ojo con la ortografia: es Machiavellianism con i, que es como lo
// escriben AniList y TVDB.

export const ANIME = {
  titulo: "Armed Girls Machiavellism",

  japaneseTitle: '武装少女マキャヴェリズム',

  synopsis:
    'Nomura llega expulsado a un instituto donde las chicas llevan espada y mandan ellas. ' +
    'Las Cinco Espadas Supremas lo miden a espadazos una a una mientras la Emperatriz Amou lo mira desde arriba. ' +
    'Entre dormitorio mixto, olimpiadas propias y una bala del pasado, el unico chico del centro se gana el sitio.',

  anio: 2017,
  estado: 'finished',
  estudio: 'SILVER LINK.',

  // Accion de espadas de instituto con comedia: Shonen para los
  // duelos y comedia romantica para el dormitorio. Son dos.
  categorias: ['Shonen & Acción', 'Romance & Comedia'],

  generos: ['Acción', 'Comedia', 'Romance', 'Escolar'],
};

export const ANIME_ID = 'armed-girls-machiavellism';

/**
 * Nota de la serie completa en IMDb, serie tt9013220: unos 6,6 con
 * pocos votos por capitulo (40-60). El 12 es lo mejor con 8,5 y el
 * 4 lo peor con 7,5.
 */
export const RATING_SERIE = 6.6;

/**
 * Capitulos en total.
 *
 *   T1  13  (abril - junio de 2017, 12 de television + el OVA de noviembre)
 *   --
 *       13
 */
export const EPISODIOS_TOTAL = 13;

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
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'SILVER LINK.',
    synopsis:
      'Doce capitulos entre el 5 de abril y el 22 de junio de 2017, mas el OVA de noviembre. ' +
      'Nomura contra las Cinco Espadas una a una: Rin, Mary, Warabi, Satori y Tsukuyo, con Amou de fondo. ' +
      'Cierra con todas contra la Emperatriz y la bala del pasado ya contada, y el OVA las lleva de viaje.',
    capitulos: 'T1',
  },
];
