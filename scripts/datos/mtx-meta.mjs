// META - Marriagetoxin (2026)
//
// TVDB 468734 (マリッジトキシン, 2026) tiene 13 capitulos en la
// temporada 1, mas 2 sin fecha (segunda temporada anunciada, aun no
// emitida).
// AniList 199547. IMDb tt39122769: 7,3 con unos 1.500 votos.
//
// Los titulos en castellano y los japoneses salen del anexo de la
// wikipedia en espanol; las fechas, del mismo anexo; las notas, de
// IMDb. Los resumenes son traduccion de los de la wikipedia en
// ingles.

export const ANIME = {
  titulo: 'Marriagetoxin',

  japaneseTitle: 'マリッジトキシン',

  synopsis:
    'Hikaru Gero es el heredero designado del Clan Venenoso, una de las Cinco ' +
    'Grandes Familias de asesinos, y se considera sin futuro con las mujeres. ' +
    'El dia que el clan le obliga a tener un heredero o lo obligaran a su ' +
    'hermana menor, le pide matrimonio a una de sus victimas, Mei Kinosaki, ' +
    'un estafador matrimonial que se disfraza de mujer. Kinosaki se niega, ' +
    'pero acepta ensenarle a salir con mujeres y a conquistarlas para que ' +
    'encuentre a alguien con quien de verdad quiera casarse. Lo que empieza ' +
    'como un acuerdo de conveniencia acaba siendo una busqueda de esposa a ' +
    'traves de los distintos clanes de asesinos.',

  anio: 2026,
  estado: 'emitiendo',
  estudio: 'Bones Film',

  categorias: ['Shonen & Acción', 'Romance & Comedia'],

  generos: ['Acción', 'Aventura', 'Comedia', 'Romance', 'Drama', 'Asesinos', 'Crimen'],
};

export const ANIME_ID = 'marriagetoxin';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
export const ALIASES = [
  'Marriage Toxin',
  'Marriagetoxin (2026)',
];

/**
 * Nota de la serie en IMDb (tt39122769): 7,3 con unos 1.500 votos.
 */
export const RATING_SERIE = 7.3;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  13  (abril - junio de 2026)
 *   --
 *       13
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con doblaje en espanol.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2026,
    estado: 'En emisión',
    estudio: 'Bones Film',
    synopsis:
      'Trece capitulos emitidos del 7 de abril al 30 de junio de 2026. Hikaru ' +
      'Gero, heredero del Clan Venenoso, tiene que encontrar esposa para dar un ' +
      'heredero o su hermana menor sera obligada a tenerlo en su lugar. Con la ' +
      'ayuda de Mei Kinosaki, un estafador matrimonial travesti, Gero va ' +
      'conociendo a las candidatas de los distintos clanes de asesinos.',
    capitulos: 'T1',
  },
];
