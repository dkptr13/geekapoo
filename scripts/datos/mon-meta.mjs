// LA FICHA DEL ANIME - Monster
//
// Setenta y cuatro capitulos de abril de 2004 a septiembre de 2005, en Madhouse
// para NTV. Un neurocirujano salva la vida de un niño que resulta ser un monstruo.
//
// Ficha de AniList: 19.
// TVDB: serie 74599, con la temporada 1.
// IMDb tt0434706: 8,8 con unos 77.000 votos.

export const ANIME = {
  titulo: 'Monster',

  japaneseTitle: 'MONSTER',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Tenma salva a un niño que resulta ser un monstruo.
  synopsis:
    'Kenzo Tenma es un neurocirujano japonés en Alemania que salva la ' +
    'vida de un niño en lugar de la del alcalde. El niño, Johan, ' +
    'resulta ser un asesino en serie. Tenma emprende un viaje para ' +
    'detenerlo. Setenta y cuatro capítulos de thriller psicológico y ' +
    'misterio.',

  anio: 2004,
  estado: 'finished',
  estudio: 'Madhouse',

  // Thriller y misterio con fondo de drama.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Thriller', 'Misterio', 'Psicológico', 'Drama', 'Seinen'],
};

export const ANIME_ID = 'monster';

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
  'Monster (2004)',
];

/**
 * Nota de la serie en IMDb (tt0434706): 8,8 con unos 77.000 votos.
 *
 * El capítulo 73 (The Landscape of the End) llega al 9,7. El 74
 * (The Real Monster) cierra con un 9,4.
 */
export const RATING_SERIE = 8.8;

/**
 * Capítulos en total.
 *
 *   T1  74  (abril de 2004 - septiembre de 2005)
 *   ---
 *       74
 */
export const EPISODIOS_TOTAL = 74;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com', badgeColor: '#e50914' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2004,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Setenta y cuatro capítulos de abril de 2004 a septiembre de 2005, en Madhouse para NTV. ' +
      'Tenma salva a un niño que resulta ser un monstruo. De aquí salen el viaje de Tenma, ' +
      'Johan y el final.',
    capitulos: 'T1',
  },
];
