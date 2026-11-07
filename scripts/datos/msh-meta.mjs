// LA FICHA DEL ANIME - Mushi-Shi
//
// Veintiséis capitulos de octubre de 2005 a junio de 2006, en Artland
// para Fuji TV. Ginko es un mushishi que viaja por el Japón feudal
// estudiando a los mushi.
//
// Ficha de AniList: 457.
// TVDB: serie 79214, con la temporada 1.
// IMDb tt0807832: 8,5 con unos 17.000 votos.

export const ANIME = {
  titulo: 'Mushi-Shi',

  japaneseTitle: '蟲師',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Ginko es un mushishi que viaja por el Japón feudal.
  synopsis:
    'Ginko es un mushishi, un experto en mushi, seres primigenios ' +
    'que existen entre el mundo de los vivos y los muertos. Viaja por ' +
    'el Japón feudal ayudando a personas afectadas por los mushi. ' +
    'Veintiséis capítulos de slice of life, misterio y sobrenatural, ' +
    'con una atmósfera melancólica y poética.',

  anio: 2005,
  estado: 'finished',
  estudio: 'Artland',

  // Slice of life y sobrenatural con fondo de misterio.
  categorias: ['Comedia & Slice of Life', 'Thriller & Misterio'],

  generos: ['Recuentos de la vida', 'Sobrenatural', 'Misterio', 'Histórico', 'Seinen', 'Aventura', 'Fantasía', 'Psicológico'],
};

export const ANIME_ID = 'mushi-shi';

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
  'Mushishi',
  'Mushi-Shi (2005)',
];

/**
 * Nota de la serie en IMDb (tt0807832): 8,5 con unos 17.000 votos.
 *
 * El capítulo 12 (Tanyuu Karibusa) llega al 9,0. El 14 (Yume no
 * kagaribi) al 8,7.
 */
export const RATING_SERIE = 8.5;

/**
 * Capítulos en total.
 *
 *   T1  26  (octubre de 2005 - junio de 2006)
 *   ---
 *       26
 */
export const EPISODIOS_TOTAL = 26;

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
    anio: 2005,
    estado: 'Finalizado',
    estudio: 'Artland',
    synopsis:
      'Veintiséis capítulos de octubre de 2005 a junio de 2006, en Artland para Fuji TV. ' +
      'Ginko viaja por el Japón feudal estudiando a los mushi. De aquí salen las ' +
      'aventuras y el final.',
    capitulos: 'T1',
  },
];
