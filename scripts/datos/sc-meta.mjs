// LA FICHA DEL ANIME - Samurai Champloo
//
// Veintiséis capitulos de mayo de 2004 a marzo de 2005, en Manglobe
// para Fuji TV. Mugen, Jin y Fuu buscan al samurái que huele a girasoles.
//
// Ficha de AniList: 205.
// TVDB: serie 79089, con la temporada 1.
// IMDb tt0423731: 8,5 con unos 65.000 votos.

export const ANIME = {
  titulo: 'Samurai Champloo',

  japaneseTitle: 'サムライチャンプルー',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Mugen, Jin y Fuu buscan al samurái que huele a girasoles.
  synopsis:
    'Mugen, un espadachín salvaje, y Jin, un ronin estoico, son ' +
    'rescatados de la ejecución por Fuu, una joven que les pide ayuda ' +
    'para encontrar al samurái que huele a girasoles. Juntos viajan por ' +
    'el Japón feudal. Veintiséis capítulos de acción, comedia y hip-hop.',

  anio: 2004,
  estado: 'finished',
  estudio: 'Manglobe',

  // Acción y comedia con fondo de samuráis.
  categorias: ['Shonen & Acción', 'Comedia & Slice of Life'],

  generos: ['Acción', 'Comedia', 'Samuráis', 'Aventura', 'Histórico'],
};

export const ANIME_ID = 'samurai-champloo';

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
  'Samurai Champloo (2004)',
];

/**
 * Nota de la serie en IMDb (tt0423731): 8,5 con unos 65.000 votos.
 *
 * El capítulo 26 (Seishi ruten sono san) llega al 9,3.
 */
export const RATING_SERIE = 8.5;

/**
 * Capítulos en total.
 *
 *   T1  26  (mayo de 2004 - marzo de 2005)
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
    anio: 2004,
    estado: 'Finalizado',
    estudio: 'Manglobe',
    synopsis:
      'Veintiséis capítulos de mayo de 2004 a marzo de 2005, en Manglobe para Fuji TV. ' +
      'Mugen, Jin y Fuu buscan al samurái que huele a girasoles. De aquí salen las ' +
      'aventuras y el final.',
    capitulos: 'T1',
  },
];
