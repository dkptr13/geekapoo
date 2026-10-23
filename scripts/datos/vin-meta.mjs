// META - Vinland Saga (2019)
//
// TVDB 359274 (ヴィンランド・サガ, 2019, Ended) tiene 24 + 24 episodios en
// las temporadas 1 y 2, y en la temporada 0 los dos especiales de la
// segunda, que aqui van intercalados en ella como el 6.5 y el 18.5.
// AniList 101348 (primera) y 136430 (segunda).
// IMDb tt10233448: 8,9 con unos 153.000 votos.
//
// Los titulos en castellano y las fechas salen de los anexos de
// temporada de la wikipedia en espanol; los titulos japoneses, de TVDB;
// las notas, de IMDb. Los resumenes son traduccion de los de la
// wikipedia en ingles. Los dos especiales no tienen nota en IMDb: la que
// se pone es la de AniList.

export const ANIME = {
  titulo: 'Vinland Saga',

  japaneseTitle: 'ヴィンランド・サガ',

  synopsis:
    'Thorfinn tiene doce años y su unico objetivo es matar a Askeladd, el capitan de la ' +
    'tripulacion de mercenarios en la que su padre murio. Lo consigue, y al final de la ' +
    'primera temporada se queda sin saber que hacer con su vida. La segunda temporada lo ' +
    'lleva por los caminos de la esclavitud, en una Islandia del siglo XI donde un rico, una ' +
    'matchmaker y un esclavo dan vuelta al destino del pais. Es una historia de venganza ' +
    'que acaba siendo una historia sobre la paz.',

  anio: 2019,
  estado: 'finished',
  estudio: 'Wit Studio',

  categorias: ['Seinen & Psicológico', 'Acción & Aventura'],

  generos: ['Acción', 'Aventura', 'Drama', 'Psicológico', 'Familiar'],
};

export const ANIME_ID = 'vinland-saga';

/**
 * Titulos alternativos, para que la busqueda los encuentre.
 *
 * El japones ya esta en `japaneseTitle` y no hace falta repetirlo: el
 * segundo desambigua el año, que es como lo lista IMDb.
 */
export const ALIASES = [
  'Vinland Saga (2019)',
];

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * El capitulo 24 de la primera temporada se titula oficialmente
 * "End of the Prologue", tambien en Japon, tal como lo lista TVDB. La
 * bandera le dice a `comprobar-datos.mjs` que no exija kanji ni kana en
 * el campo japones. Los otros 49 si los traen.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie en IMDb (tt10233448): 8,9 con unos 153.000 votos.
 */
export const RATING_SERIE = 8.9;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  24  (julio - diciembre de 2019)
 *   T2  26  (enero - junio de 2023, con los dos especiales)
 *   --
 *       50
 */
export const EPISODIOS_TOTAL = 50;

/**
 * Donde se emite en Espana.
 *
 *   · Amazon Prime Video -> la serie, con doblaje en espanol.
 */
export const STREAMING = [
  {
    name: 'Amazon Prime Video',
    url: 'https://www.primevideo.com',
    badgeColor: '#00a8e1',
  },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Wit Studio',
    synopsis:
      'Veinticuatro episodios emitidos del 7 de julio al 29 de diciembre de 2019. Thorfinn ' +
      'crece en la tripulacion de Askeladd entre mas violencias y mas secretos, hasta que el ' +
      'venganzo que ha buscado toda su vida se cumple y le deja sin saber que hacer.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Vinland Saga Season 2',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Veinticuatro episodios emitidos del 10 de enero al 20 de junio de 2023, con los dos ' +
      'especiales intercalados. Thorfinn cae en la esclavitud con un rico y una esclava muda, ' +
      'y la Islandia entera se convierte en el campo de batalla de una guerra por el trono.',
    capitulos: 'T2',
  },
];
