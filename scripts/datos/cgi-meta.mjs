// LA FICHA DEL ANIME - Code Geass: Lelouch of the Rebellion I - Initiation
//
// Pelicula recopilatoria de 2017 que resume la primera temporada de
// Code Geass: Lelouch of the Rebellion, con escenas nuevas y un final
// ligeramente distinto.
//
// Ficha de AniList: 101811.
// IMDb tt8100900: 7,3 con unos 950 votos.

export const ANIME = {
  titulo: 'Code Geass: Lelouch of the Rebellion I - Initiation',

  japaneseTitle: 'コードギアス 反逆のルルーシュⅠ 興道',

  // Base: la sinopsis de AniList y el argumento de la pelicula, en
  // castellano. Lelouch obtiene el Geass y se convierte en Zero.
  synopsis:
    'Lelouch Lamperouge, un estudiante exiliado de la familia real de ' +
    'Britannia, obtiene el poder del Geass y se convierte en Zero, el ' +
    'lider de la rebelion. Esta pelicula recopila la primera temporada ' +
    'con escenas nuevas y un final ligeramente distinto. La lucha por ' +
    'la independencia de Japon comienza.',

  anio: 2017,
  estado: 'finished',
  estudio: 'Sunrise',

  // Mecha y ciencia ficcion con fondo de drama militar y estrategia.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Mecha', 'Ciencia ficción', 'Drama', 'Militar', 'Thriller'],
};

export const ANIME_ID = 'code-geass-lelouch-of-the-rebellion-i-initiation';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles y el romanizado. Los escribe el agente que
// anade el anime, a mano, y se guardan en "alternativeTitles" del
// documento de Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El japones ya esta en japaneseTitle, asi que no se repite aqui.
export const ALIASES = [
  'Code Geass: Lelouch of the Rebellion I',
  'Code Geass: Initiation',
];

/**
 * Nota de la pelicula en IMDb (tt8100900): 7,3 con unos 950 votos.
 */
export const RATING_SERIE = 7.3;

/**
 * Capitulos en total: la pelicula, del 21 de octubre de 2017.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la pelicula, con subtitulos en castellano.
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
    estudio: 'Sunrise',
    synopsis:
      'Pelicula de 137 minutos del 21 de octubre de 2017. Lelouch obtiene ' +
      'el Geass y se convierte en Zero. Recopila la primera temporada con ' +
      'escenas nuevas y un final ligeramente distinto.',
    capitulos: 'T1',
  },
];
