// LA FICHA DEL ANIME - Gleipnir
//
// Trece capitulos del 5 de abril al 28 de junio de 2020, en Pine Jam para
// Tokyo MX. Un chico que se transforma en un monstruo de felpa y la
// chica que lo chantajea para que la ayude a buscar a su hermana.
//
// Ficha de AniList: 108241.
// TVDB: serie 374198, con la temporada 1.
// IMDb tt11988478: 6,7 con unos 2.500 votos.

export const ANIME = {
  titulo: 'Gleipnir',

  japaneseTitle: 'グレイプニル',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Shuichi se transforma en un monstruo y Clair lo
  // chantajea para que la ayude.
  synopsis:
    'Shuichi Kagaya es un estudiante normal que un día descubre que ' +
    'puede transformarse en un monstruo de felpa con una cremallera en ' +
    'la espalda. Clair Aoki, una chica que lo chantajea, le pide ayuda ' +
    'para buscar a su hermana. Juntos se adentran en un mundo de ' +
    'monstruos y secretos. Trece capítulos de acción, misterio y un ' +
    'protagonista que no sabe quién es.',

  anio: 2020,
  estado: 'finished',
  estudio: 'Pine Jam',

  // Acción y misterio con fondo de ciencia ficción.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Misterio', 'Ciencia ficción', 'Shonen', 'Ecchi', 'Sobrenatural'],
};

export const ANIME_ID = 'gleipnir';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés con el año. Los escribe el agente que añade
// el anime, a mano, y se guardan en "alternativeTitles" del documento
// de Firestore, que es lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Gleipnir (2020)',
];

/**
 * Nota de la serie en IMDb (tt11988478): 6,7 con unos 2.500 votos.
 *
 * El capítulo 12 (Where the Promise Was Made) llega al 8,1.
 */
export const RATING_SERIE = 6.7;

/**
 * Capítulos en total.
 *
 *   T1  13  (abril - junio de 2020)
 *   ---
 *       13
 */
export const EPISODIOS_TOTAL = 13;

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
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'Pine Jam',
    synopsis:
      'Trece capítulos del 5 de abril al 28 de junio de 2020, en Pine Jam para Tokyo MX. ' +
      'Shuichi se transforma en un monstruo de felpa y Clair lo chantajea para que la ayude. ' +
      'De aquí salen el encuentro con Elena, la metamorfosis y la batalla final.',
    capitulos: 'T1',
  },
];
