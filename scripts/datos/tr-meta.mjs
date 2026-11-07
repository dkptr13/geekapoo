// LA FICHA DEL ANIME - Terror in Resonance
//
// Once capitulos de julio a septiembre de 2014, en MAPPA para Fuji TV.
// Dos chicos terroristas desafían a la policía con acertijos.
//
// Ficha de AniList: 20661.
// TVDB: serie 279986, con la temporada 1.
// IMDb tt3613454: 7,8 con unos 19.000 votos.

export const ANIME = {
  titulo: 'Terror in Resonance',

  japaneseTitle: '残響のテロル',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Dos chicos terroristas desafían a la policía.
  synopsis:
    'Dos adolescentes conocidos como Sphinx lanzan un desafío a la ' +
    'policía de Tokyo con acertijos y ataques terroristas. La ' +
    'detective Lisa Mishima se ve envuelta en su plan. Once ' +
    'capítulos de thriller, misterio y drama, con una banda sonora ' +
    'de Yoko Kanno.',

  anio: 2014,
  estado: 'finished',
  estudio: 'MAPPA',

  // Thriller y misterio con fondo de drama.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Thriller', 'Misterio', 'Drama', 'Psicológico', 'Seinen', 'Crimen'],
};

export const ANIME_ID = 'terror-in-resonance';

export const TITULOS_EN_INGLES = true;

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
  'Zankyou no Terror',
  'Terror in Resonance (2014)',
];

/**
 * Nota de la serie en IMDb (tt3613454): 7,8 con unos 19.000 votos.
 *
 * El capítulo 11 (VON) llega al 9,0. El 9 (Highs & Lows) al 8,7.
 */
export const RATING_SERIE = 7.8;

/**
 * Capítulos en total.
 *
 *   T1  11  (julio - septiembre de 2014)
 *   ---
 *       11
 */
export const EPISODIOS_TOTAL = 11;

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
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Once capítulos de julio a septiembre de 2014, en MAPPA para Fuji TV. ' +
      'Sphinx desafía a la policía con acertijos. De aquí salen los atentados ' +
      'y el final.',
    capitulos: 'T1',
  },
];
