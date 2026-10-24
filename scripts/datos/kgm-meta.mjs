// LA FICHA DEL ANIME - King's Game
//
// Doce capitulos del 5 de octubre al 21 de diciembre de 2017, en Seven
// para AT-X. Una clase de instituto recibe un mensaje que los obliga a
// jugar al juego del rey, con castigos mortales.
//
// Ficha de AniList: 99698.
// TVDB: serie 332981, con la temporada 1.
// IMDb tt7462702: 4,9 con unos 860 votos.

export const ANIME = {
  titulo: "King's Game",

  japaneseTitle: '王様ゲーム The Animation',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Nobuaki recibe un mensaje que lo obliga a jugar al
  // juego del rey.
  synopsis:
    'Nobuaki Kanazawa y sus compañeros de clase reciben un mensaje de ' +
    'texto que los acoge al "juego del rey": cada día reciben una orden ' +
    'que deben cumplir en 24 horas, o el castigo será la muerte. Doce ' +
    'capítulos de horror, traiciones y un juego que no se puede parar.',

  anio: 2017,
  estado: 'finished',
  estudio: 'Seven',

  // Horror y thriller con fondo de supervivencia.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Horror', 'Thriller', 'Misterio', 'Supervivencia', 'Escolar'],
};

export const ANIME_ID = 'king-s-game';

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
  "Ousama Game",
  "King's Game (2017)",
];

/**
 * Nota de la serie en IMDb (tt7462702): 4,9 con unos 860 votos.
 *
 * El capítulo 7 (Eien) llega al 6,2. El 9 (Kessoku) baja a un 5,5.
 */
export const RATING_SERIE = 4.9;

/**
 * Capítulos en total.
 *
 *   T1  12  (octubre - diciembre de 2017)
 *   ---
 *       12
 */
export const EPISODIOS_TOTAL = 12;

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
    estudio: 'Seven',
    synopsis:
      'Doce capítulos del 5 de octubre al 21 de diciembre de 2017, en Seven para AT-X. ' +
      'Nobuaki recibe un mensaje que lo obliga a jugar al juego del rey. De aquí salen ' +
      'las órdenes, los castigos y el final.',
    capitulos: 'T1',
  },
];
