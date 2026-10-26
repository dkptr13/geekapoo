// LA FICHA DEL ANIME - Cowboy Bebop
//
// Veintiséis capitulos de abril de 1998 a abril de 1999, en Sunrise
// para TV Tokyo. Spike Spiegel y Jet Black son cazarrecompensas en
// el espacio.
//
// Ficha de AniList: 1.
// TVDB: serie 76885, con la temporada 1.
// IMDb tt0213338: 8,9 con unos 175.000 votos.

export const ANIME = {
  titulo: 'Cowboy Bebop',

  japaneseTitle: 'カウボーイビバップ',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Spike y Jet son cazarrecompensas en el espacio.
  synopsis:
    'Spike Spiegel y Jet Black son dos cazarrecompensas que viajan por ' +
    'el espacio en la nave Bebop. Junto a Faye Valentine, Edward y Ein, ' +
    'persiguen criminales por toda la galaxia. Veintiséis capítulos de ' +
    'ciencia ficción, acción y jazz, con una banda sonora icónica.',

  anio: 1998,
  estado: 'finished',
  estudio: 'Sunrise',

  // Ciencia ficción y acción con fondo de jazz.
  categorias: ['Ciencia Ficción & Futuro', 'Shonen & Acción'],

  generos: ['Ciencia ficción', 'Acción', 'Jazz', 'Drama', 'Seinen'],
};

export const ANIME_ID = 'cowboy-bebop';

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
  'Cowboy Bebop (1998)',
];

/**
 * Nota de la serie en IMDb (tt0213338): 8,9 con unos 175.000 votos.
 *
 * El capítulo 26 (The Real Folk Blues: Part 2) llega al 9,5.
 */
export const RATING_SERIE = 8.9;

/**
 * Capítulos en total.
 *
 *   T1  26  (abril de 1998 - abril de 1999)
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
    anio: 1998,
    estado: 'Finalizado',
    estudio: 'Sunrise',
    synopsis:
      'Veintiséis capítulos de abril de 1998 a abril de 1999, en Sunrise para TV Tokyo. ' +
      'Spike y Jet son cazarrecompensas en el espacio. De aquí salen las aventuras y el final.',
    capitulos: 'T1',
  },
];
