// LA FICHA DEL ANIME - Berserk
//
// Veinticinco capitulos de octubre de 1997 a marzo de 1998, en OLM
// para NTV. Guts y la Banda del Halcón luchan en un mundo medieval.
//
// Ficha de AniList: 33.
// TVDB: serie 73752, con la temporada 1.
// IMDb tt0318871: 8,8 con unos 84.000 votos.

export const ANIME = {
  titulo: 'Berserk',

  japaneseTitle: '剣風伝奇ベルセルク',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Guts y la Banda del Halcón luchan en un mundo medieval.
  synopsis:
    'Guts es un mercenario que se une a la Banda del Halcón, liderada ' +
    'por Griffith. Juntos luchan en un mundo medieval de violencia y ' +
    'traición. Veinticinco capítulos de dark fantasy, acción y drama, ' +
    'con una historia épica y trágica.',

  anio: 1997,
  estado: 'finished',
  estudio: 'OLM',

  // Dark fantasy y acción con fondo de drama.
  categorias: ['Fantasía & Magia', 'Seinen & Psicológico'],

  generos: ['Dark fantasy', 'Acción', 'Drama', 'Seinen', 'Medieval'],
};

export const ANIME_ID = 'berserk';

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
  'Kenpuu Denki Berserk',
  'Berserk (1997)',
];

/**
 * Nota de la serie en IMDb (tt0318871): 8,8 con unos 84.000 votos.
 *
 * El capítulo 25 (Eien no koku) llega al 9,6. El 24 (Shoku) al 9,2.
 */
export const RATING_SERIE = 8.8;

/**
 * Capítulos en total.
 *
 *   T1  25  (octubre de 1997 - marzo de 1998)
 *   ---
 *       25
 */
export const EPISODIOS_TOTAL = 25;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521', regions: ['ES', 'LATAM', 'JP'] },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1997,
    estado: 'Finalizado',
    estudio: 'OLM',
    synopsis:
      'Veinticinco capítulos de octubre de 1997 a marzo de 1998, en OLM para NTV. ' +
      'Guts y la Banda del Halcón luchan en un mundo medieval. De aquí salen ' +
      'las batallas y el final.',
    capitulos: 'T1',
  },
];
