// LA FICHA DEL ANIME - Angels of Death
//
// Dieciséis capitulos del 6 de julio al 26 de octubre de 2018, en J.C.Staff
// para AT-X. Rachel Gardner despierta en un sótano y pide a Zack que la mate.
//
// Ficha de AniList: 99629.
// TVDB: serie 344844, con la temporada 1.
// IMDb tt8670784: 6,5 con unos 4.200 votos.

export const ANIME = {
  titulo: 'Angels of Death',

  japaneseTitle: '殺戮の天使',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Rachel despierta en un sótano y pide a Zack que la mate.
  synopsis:
    'Rachel Gardner despierta en el sótano de un edificio desconocido. ' +
    'Allí conoce a Isaac Foster, alias Zack, un asesino que le promete ' +
    'matarla si ella le ayuda a escapar. Juntos recorren los pisos del ' +
    'edificio, cada uno con su propio guardián. Dieciséis capítulos de ' +
    'horror y un pacto mortal.',

  anio: 2018,
  estado: 'finished',
  estudio: 'J.C.Staff',

  // Horror y thriller con fondo de supervivencia.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Terror', 'Thriller', 'Misterio', 'Psicológico', 'Supervivencia', 'Acción', 'Aventura', 'Asesinos'],
};

export const ANIME_ID = 'angels-of-death';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en japonés romanizado y los sinónimos que de verdad se
// usan. Los escribe el agente que añade el anime, a mano, y se
// guardan en "alternativeTitles" del documento de Firestore, que es
// lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Satsuriku no Tenshi',
  'Angels of Death (2018)',
];

/**
 * Nota de la serie en IMDb (tt8670784): 6,5 con unos 4.200 votos.
 *
 * El capítulo 8 (Yeah..., I'm a monster.) llega al 8,0. El 13
 * (I'm not Your God.) llega al 8,3.
 */
export const RATING_SERIE = 6.5;

/**
 * Capítulos en total.
 *
 *   T1  16  (julio - octubre de 2018)
 *   ---
 *       16
 */
export const EPISODIOS_TOTAL = 16;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Dieciséis capítulos del 6 de julio al 26 de octubre de 2018, en J.C.Staff para AT-X. ' +
      'Rachel despierta en un sótano y pide a Zack que la mate. De aquí salen el pacto, ' +
      'los pisos del edificio y el final.',
    capitulos: 'T1',
  },
];
