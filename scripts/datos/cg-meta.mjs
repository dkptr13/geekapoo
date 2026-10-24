// LA FICHA DEL ANIME - Code Geass: Lelouch of the Rebellion
//
// Cincuenta capitulos del 6 de octubre de 2006 al 28 de septiembre de
// 2008, en Sunrise para MBS. Un príncipe exiliado obtiene el poder del
// Geass y lidera la rebelión contra el Imperio de Britannia.
//
//   T1  25 capitulos  (octubre de 2006 - julio de 2007)
//   T2  25 capitulos  (abril - septiembre de 2008)
//
// Ficha de AniList: 1575 (T1) y 2904 (T2).
// TVDB: serie 79525, con las temporadas 0, 1 y 2.
// IMDb tt0994314: 8,7 con unos 110.000 votos.

export const ANIME = {
  titulo: 'Code Geass: Lelouch of the Rebellion',

  japaneseTitle: 'コードギアス 反逆のルルーシュ',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Lelouch obtiene el Geass y lidera la rebelión.
  synopsis:
    'Lelouch Lamperouge, un estudiante exiliado de la familia real de ' +
    'Britannia, obtiene el poder del Geass: puede ordenar a cualquiera ' +
    'que lo mire a los ojos. Con una máscara y el nombre de Zero, ' +
    'lidera la rebelión contra el Imperio de Britannia para crear un ' +
    'mundo donde su hermana Nunnally pueda vivir en paz. Dos temporadas ' +
    'de estrategia, traiciones y un final que no se olvida.',

  anio: 2006,
  estado: 'finished',
  estudio: 'Sunrise',

  // Mecha y ciencia ficción con fondo de drama militar y estrategia.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Mecha', 'Ciencia ficción', 'Drama', 'Militar'],
};

export const ANIME_ID = 'code-geass-lelouch-of-the-rebellion';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés, el romanizado y los sinónimos que de verdad se
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
  'Code Geass',
  'Code Geass: Lelouch of the Rebellion (2006)',
  'Lelouch of the Rebellion',
  'コードギアス',
];

/**
 * Nota de la serie en IMDb (tt0994314): 8,7 con unos 110.000 votos.
 *
 * El capítulo 25 de la T1 llega al 9,0. La segunda temporada se
 * queda en un 8,8 de media.
 */
export const RATING_SERIE = 8.7;

/**
 * Capítulos en total.
 *
 *   T1  25  (octubre de 2006 - julio de 2007)
 *   T2  25  (abril - septiembre de 2008)
 *   ---
 *       50
 *
 * Las películas y los OVA no entran.
 */
export const EPISODIOS_TOTAL = 50;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> las dos temporadas, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'Sunrise',
    synopsis:
      'Veinticinco capítulos del 6 de octubre de 2006 al 29 de julio de 2007, en Sunrise para MBS. ' +
      'Lelouch obtiene el Geass y se convierte en Zero. De aquí salen la formación de los ' +
      'Caballeros Negros, la traición de Suzaku, la masacre de Euphemia y el final.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'R2',
    anio: 2008,
    estado: 'Finalizado',
    estudio: 'Sunrise',
    synopsis:
      'Veinticinco capítulos del 6 de abril al 28 de septiembre de 2008. Lelouch recupera su ' +
      'memoria y se convierte en emperador. De aquí salen el plan de la independencia de ' +
      'Japón, la traición de Schneizel y el Zero Requiem.',
    capitulos: 'T2',
  },
];
