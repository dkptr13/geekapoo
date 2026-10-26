// LA FICHA DEL ANIME - Summer Time Render
//
// Veinticinco capitulos de abril a septiembre de 2022, en OLM
// para Tokyo MX. Shinpei vuelve a su isla natal para el funeral de
// Ushio y descubre un misterio.
//
// Ficha de AniList: 129201.
// TVDB: serie 407306, con la temporada 1.
// IMDb tt15686254: 8,2 con unos 12.000 votos.

export const ANIME = {
  titulo: 'Summer Time Render',

  japaneseTitle: 'サマータイムレンダ',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Shinpei vuelve a su isla natal para el funeral de Ushio.
  synopsis:
    'Shinpei Ajiro vuelve a su isla natal para el funeral de su amiga ' +
    'Ushio Kofune. Allí descubre que su muerte no fue un accidente. ' +
    'Veinticinco capítulos de misterio, thriller y ciencia ficción, ' +
    'con viajes en el tiempo y sombras.',

  anio: 2022,
  estado: 'finished',
  estudio: 'OLM',

  // Thriller y misterio con fondo de ciencia ficción.
  categorias: ['Thriller & Misterio', 'Ciencia Ficción & Futuro'],

  generos: ['Misterio', 'Thriller', 'Ciencia ficción', 'Sobrenatural', 'Drama'],
};

export const ANIME_ID = 'summer-time-render';

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
  'Summer Time Rendering',
  'Summer Time Render (2022)',
];

/**
 * Nota de la serie en IMDb (tt15686254): 8,2 con unos 12.000 votos.
 *
 * El capítulo 15 (Lights, Camera, Action) llega al 9,2. El 12
 * (Bloody Night) al 9,1.
 */
export const RATING_SERIE = 8.2;

/**
 * Capítulos en total.
 *
 *   T1  25  (abril - septiembre de 2022)
 *   ---
 *       25
 */
export const EPISODIOS_TOTAL = 25;

/**
 * Donde se emite en España.
 *
 *   · Disney+ -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Disney+', url: 'https://www.disneyplus.com', badgeColor: '#0063e5', regions: ['ES', 'LATAM', 'UK', 'JP'] },
  { name: 'Hulu', url: 'https://www.hulu.com', badgeColor: '#1ce783', regions: ['US'] },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'OLM',
    synopsis:
      'Veinticinco capítulos de abril a septiembre de 2022, en OLM para Tokyo MX. ' +
      'Shinpei vuelve a su isla natal para el funeral de Ushio. De aquí salen ' +
      'los misterios y el final.',
    capitulos: 'T1',
  },
];
