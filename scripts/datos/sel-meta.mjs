// LA FICHA DEL ANIME - Serial Experiments Lain
//
// Trece capitulos de julio a septiembre de 1998, en Triangle Staff
// para TV Tokyo. Lain Iwakura se obsesiona con un mundo virtual llamado
// The Wired.
//
// Ficha de AniList: 339.
// TVDB: serie 78814, con la temporada 1.
// IMDb tt0500092: 8,0 con unos 23.000 votos.

export const ANIME = {
  titulo: 'Serial Experiments Lain',

  japaneseTitle: 'serial experiments lain',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Lain se obsesiona con The Wired.
  synopsis:
    'Lain Iwakura es una chica introvertida que empieza a obsesionarse ' +
    'con Wired, un mundo virtual que se entrelaza con la realidad. ' +
    'Trece capítulos de ciencia ficción, misterio y filosofía, con una ' +
    'atmósfera onírica y perturbadora en cada episodio.',

  anio: 1998,
  estado: 'finished',
  estudio: 'Triangle Staff',

  // Ciencia ficción y misterio con fondo de psicológico.
  categorias: ['Ciencia Ficción & Futuro', 'Thriller & Misterio'],

  generos: ['Ciencia ficción', 'Misterio', 'Psicológico', 'Drama', 'Seinen', 'Sobrenatural', 'Cyberpunk'],
};

export const ANIME_ID = 'serial-experiments-lain';

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
  'Serial Experiments Lain (1998)',
];

/**
 * Nota de la serie en IMDb (tt0500092): 8,0 con unos 23.000 votos.
 *
 * El capítulo 13 (Ego) llega al 8,7. El 12 (Landscape) al 8,5.
 */
export const RATING_SERIE = 8.0;

/**
 * Capítulos en total.
 *
 *   T1  13  (julio - septiembre de 1998)
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
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521', regions: ['ES', 'LATAM', 'JP'] },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1998,
    estado: 'Finalizado',
    estudio: 'Triangle Staff',
    synopsis:
      'Trece capítulos de julio a septiembre de 1998, en Triangle Staff para TV Tokyo. ' +
      'Lain se obsesiona con Wired. De aquí salen los Layers y el final de la serie.',
    capitulos: 'T1',
  },
];
