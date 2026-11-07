// LA FICHA DEL ANIME - Parasyte: The Maxim
//
// Veinticuatro capitulos de octubre de 2014 a marzo de 2015, en Madhouse
// para NTV. Shinichi Izumi es infectado por un parásito que se apodera
// de su mano derecha.
//
// Ficha de AniList: 20623.
// TVDB: serie 279831, con la temporada 1.
// IMDb tt3358020: 8,2 con unos 66.000 votos.

export const ANIME = {
  titulo: 'Parasyte: The Maxim',

  japaneseTitle: '寄生獣 セイの格率',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Shinichi es infectado por un parásito.
  synopsis:
    'Shinichi Izumi es un estudiante normal que un día es atacado por ' +
    'un parásito alienígena. El parásito, llamado Migi, se apodera de ' +
    'su mano derecha. Juntos deben sobrevivir mientras otros parásitos ' +
    'amenazan a la humanidad. Veinticuatro capítulos de horror, ciencia ' +
    'ficción y thriller psicológico.',

  anio: 2014,
  estado: 'finished',
  estudio: 'Madhouse',

  // Horror y ciencia ficción con fondo de thriller.
  categorias: ['Ciencia Ficción & Futuro', 'Thriller & Misterio'],

  generos: ['Terror', 'Ciencia ficción', 'Thriller', 'Psicológico', 'Seinen', 'Acción', 'Drama', 'Supervivencia'],
};

export const ANIME_ID = 'parasyte-the-maxim';

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
  'Kiseijuu: Sei no Kakuritsu',
  'Parasyte: The Maxim (2014)',
];

/**
 * Nota de la serie en IMDb (tt3358020): 8,2 con unos 66.000 votos.
 *
 * El capítulo 18 (Ningen'ijô) llega al 9,1. El 12 (Kokoro) al 9,0.
 */
export const RATING_SERIE = 8.2;

/**
 * Capítulos en total.
 *
 *   T1  24  (octubre de 2014 - marzo de 2015)
 *   ---
 *       24
 */
export const EPISODIOS_TOTAL = 24;

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
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Veinticuatro capítulos de octubre de 2014 a marzo de 2015, en Madhouse para NTV. ' +
      'Shinichi es infectado por un parásito. De aquí salen las batallas y el final.',
    capitulos: 'T1',
  },
];
