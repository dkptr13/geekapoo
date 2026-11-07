// LA FICHA DEL ANIME - Miss Kobayashi's Dragon Maid
//
// Trece capitulos de la primera temporada (enero - abril de 2017) y
// doce de la segunda (julio - septiembre de 2021), en Kyoto Animation
// para Tokyo MX. Una oficinista que acoge a una dragona como criada.
//
// Ficha de AniList: 21776 (T1) y 107717 (T2).
// TVDB: serie 318893, con la temporada 1 y la 2.
// IMDb tt6185782: 7,7 con unos 7.000 votos.

export const ANIME = {
  titulo: "Miss Kobayashi's Dragon Maid",

  japaneseTitle: '小林さんちのメイドラゴン',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Kobayashi acoge a Tohru, una dragona, como criada.
  synopsis:
    'Kobayashi es una oficinista que un día, tras una borrachera, ' +
    'invita a Tohru, una dragona, a vivir con ella como criada. Poco ' +
    'después llega Kanna, otra dragona. Juntas aprenden a vivir en el ' +
    'mundo humano. Veinticinco capítulos de comedia, fantasía y ' +
    'slice of life.',

  anio: 2017,
  estado: 'finished',
  estudio: 'Kyoto Animation',

  // Comedia y fantasía con fondo de slice of life.
  categorias: ['Comedia & Slice of Life', 'Fantasía & Magia'],

  generos: ['Comedia', 'Fantasía', 'Recuentos de la vida', 'Shonen', 'Dragones', 'Monstruos', 'Magia', 'Isekai'],
};

export const ANIME_ID = 'miss-kobayashi-s-dragon-maid';

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
  'Kobayashi-san Chi no Maid Dragon',
  "Miss Kobayashi's Dragon Maid (2017)",
];

/**
 * Nota de la serie en IMDb (tt6185782): 7,7 con unos 7.000 votos.
 *
 * El capítulo 9 de la segunda temporada (There Are Various Reasons
 * Behind It) llega al 8,6.
 */
export const RATING_SERIE = 7.7;

/**
 * Capítulos en total.
 *
 *   T1  13  (enero - abril de 2017)
 *   T2  12  (julio - septiembre de 2021)
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
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Trece capítulos de enero a abril de 2017, en Kyoto Animation para Tokyo MX. ' +
      'Kobayashi acoge a Tohru como criada. De aquí salen el encuentro con Kanna, ' +
      'Elma y el final de temporada.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Doce capítulos de julio a septiembre de 2021, en Kyoto Animation para Tokyo MX. ' +
      'Ilulu se une al grupo. De aquí salen las aventuras veraniegas y el final.',
    capitulos: 'T2',
  },
];
