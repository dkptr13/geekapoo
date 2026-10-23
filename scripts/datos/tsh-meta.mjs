// LA FICHA DEL ANIME - The Rising of the Shield Hero
//
// Cuatro temporadas de fantasía de Kinema Citrus (publicadas por
// SHAKUGAN): un estudiante es arrancado de su mundo y acaba siendo el
// héroe del escudo, el que todos menosprecian. Encadenado con una esclava,
// un dragón y tres compañeros, tendrá que salvar el mundo mientras la
// nobleza, la Iglesia y los otros héroes le cierran el paso.
//
//   T1  25 capítulos  (enero - junio de 2019)
//   T2  13 capítulos  (abril - junio de 2022)
//   T3  12 capítulos  (octubre - diciembre de 2023)
//   T4  12 capítulos  (julio - septiembre de 2025)
//
// La quinta temporada está confirmada para 2027 y no se ha emitido, así que
// no entra en el catálogo.
//
// Fichas de AniList: 99263 (T1), 111321 (T2), 111322 (T3) y 173780 (T4).
// TVDB: serie 353712, con las temporadas 1 a 4 y un especial previo de la
// segunda.
// IMDb tt9529546: 7,6 con unos 25.000 votos.

export const ANIME = {
  titulo: 'The Rising of the Shield Hero',

  // La grafía oficial japonesa, de AniList y de la web de la serie.
  japaneseTitle: '盾の勇者の成り上がり',

  // Base: la sinopsis de AniList y los argumentos de las cuatro
  // temporadas de Wikipedia, en castellano.
  synopsis:
    'Un universitario lee un libro sobre los cuatro héroes y de pronto está en otro mundo, con ' +
    'la tarea de salvarlo de las olas de la calamidad. Naofumi Iwatani es el héroe del escudo, ' +
    'el más débil, y todos le menosprecian desde el primer día: una acusación falsa lo ' +
    'convierte en un paria. En su primer viaje compra a Raphtalia, una esclava de tejón, y con ' +
    'ella y con una criatura llamada Filo empieza a levantar un hogar mientras llegan las olas. ' +
    'Cuatro temporadas de peleas, trampas, reveses y un cariño que tarda lo mismo que el mundo ' +
    'en arreglarse.',

  anio: 2019,

  // La serie sigue viva: la quinta temporada está confirmada para 2027.
  estado: 'emitiendo',

  estudio: 'Kinema Citrus',

  // Fantasía de aventura con un protagonista marcado por la relegación y
  // el rencor: es una historia de seinen con elVillano por delante.
  categorias: ['Fantasía & Aventura', 'Seinen & Psicológico'],

  generos: ['Fantasía', 'Acción', 'Aventura', 'Drama', 'Ciencia ficción'],
};

export const ANIME_ID = 'the-rising-of-the-shield-hero';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles, el romanizado, el japones con otro criterio y
// los sinónimos que de verdad se usan. Los escribe el agente que anade
// el anime, a mano, y se guardan en "alternativeTitles" del documento de
// Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// En espanol se le llama "el heroe del escudo" sin el "rising".
export const ALIASES = [
  'Tate no Yuusha no Nariagari',
  'The Shield Hero',
  'El héroe del escudo',
  'Héroe del escudo',
];

/**
 * Nota de la serie en IMDb (tt9529546): 7,6 con unos 25.000 votos.
 *
 * El 21 de la T1 (el triunfo de Naofumi) llega al 9,1. La segunda
 * temporada baja: el 13 se queda en 5,7.
 */
export const RATING_SERIE = 7.6;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1  25  (enero - junio de 2019)
 *   T2  13  (abril - junio de 2022)
 *   T3  12  (octubre - diciembre de 2023)
 *   T4  12  (julio - septiembre de 2025)
 *   --
 *       62
 */
export const EPISODIOS_TOTAL = 62;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> las cuatro temporadas, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'Veinticinco capítulos del 9 de enero al 26 de junio de 2019, en Kinema Citrus para AT-X y ' +
      'MBS. Naofumi es convocado como héroe del escudo, todos le rechazan y Myne lo acusa ' +
      'falsamente de violarla. Con Raphtalia, Filo y el herrero Erhard forma su equipo, ' +
      'supera la primera ola y acaba enfrentándose al rey, a la Iglesia de los tres héroes y a ' +
      'los otros tres héroes.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'Trece capítulos del 6 de abril al 29 de junio de 2022. La cuenta atrás de las olas se ' +
      'detiene y una tortuga espiritual despierta y devora el continente: Naofumi es el único ' +
      'héroe que acepta la misión. En el camino conoce a Kizuna, la heroína de la caza de otro ' +
      'mundo, y se enfrenta a Kyo, un jugador muerto que quiere las olas para sí mismo.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Season 3',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'Doce capítulos del 6 de octubre al 22 de diciembre de 2023. Los otros tres héroes han ' +
      'desaparecido y Naofumi los busca entre una arena clandestina, los esclavos de Lurolona y ' +
      'un dragón que ha devorado a Filo por dentro. Al final descubre que Raphtalia es la ' +
      'heredera de la corona de Q\'ten Lo y que hay un país entero que quiere matarla.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Season 4',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'Doce capítulos del 9 de julio al 24 de septiembre de 2025. Naofumi viaja a la nación ' +
      'demi-humana de Siltvelt para zarpar hacia Q\'ten Lo, el país que quiere asesinar a ' +
      'Raphtalia, y allí se encuentra con la capital en disputa, con la antigua sacerdotisa ' +
      'Shildina y con el regreso del emperador pasado, que toma el cuerpo de otra persona para ' +
      'saldar sus cuentas.',
    capitulos: 'T4',
  },
];
