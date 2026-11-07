// LA FICHA DEL ANIME - Danganronpa: The Animation
//
// Trece capitulos del 4 de julio al 26 de septiembre de 2013, en Lerche
// para MBS. Quince estudiantes de secundaria quedan encerrados en un
// instituto y solo pueden salir si asesinan a un compañero.
//
// Ficha de AniList: 16592.
// TVDB: serie 270058, con la temporada 1.
// IMDb tt2902582: 6,8 con unos 4.600 votos.

export const ANIME = {
  titulo: 'Danganronpa: The Animation',

  japaneseTitle: 'ダンガンロンパ 希望の学園と絶望の高校生 The Animation',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Quince estudiantes quedan encerrados y solo pueden
  // salir si asesinan a un compañero.
  synopsis:
    'Quince estudiantes de secundaria, cada uno con un talento único, ' +
    'quedan encerrados en un instituto por Monokuma, un oso robot. La ' +
    'única salida es asesinar a un compañero sin ser descubierto. Trece ' +
    'capítulos de misterio, traiciones y el juicio de clase.',

  anio: 2013,
  estado: 'finished',
  estudio: 'Lerche',

  // Misterio y thriller con fondo de survival horror.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Misterio', 'Thriller', 'Terror', 'Escolar', 'Psicológico', 'Ciencia ficción', 'Supervivencia'],
};

export const ANIME_ID = 'danganronpa-the-animation';

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
  'Danganronpa (2013)',
  'Danganronpa: The Animation (2013)',
];

/**
 * Nota de la serie en IMDb (tt2902582): 6,8 con unos 4.600 votos.
 *
 * El capítulo 12 (The Reason Super High School-Level Bad Luck
 * Attracted...) y el 13 (Goodbye, Despair High School) llegan al 7,6.
 */
export const RATING_SERIE = 6.8;

/**
 * Capítulos en total.
 *
 *   T1  13  (julio - septiembre de 2013)
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
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Trece capítulos del 4 de julio al 26 de septiembre de 2013, en Lerche para MBS. ' +
      'Quince estudiantes quedan encerrados por Monokuma. De aquí salen los asesinatos, ' +
      'los juicios de clase y el final.',
    capitulos: 'T1',
  },
];
