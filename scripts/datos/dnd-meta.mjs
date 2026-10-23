// LA FICHA DEL ANIME - Dandadan
//
// Comedia de acción y horror de Science SARU: una chica que cree en los
// espíritus y un chico que cree en los extraterrestres se desafían para
// demostrar cuál de los dos tiene razón. De ahí salen ovnis, posesiones,
// monstruos gigantes y una historia de amor que va a trompicones.
//
// La primera temporada va de octubre a diciembre de 2024 y la segunda de
// julio a septiembre de 2025. La tercera está anunciada para 2027 y aún no
// se ha emitido, así que no entra en el catálogo.
//
// Fichas de AniList: 171018 (T1) y 185660 (T2).
// TVDB: serie 432832, con las temporadas 1 y 2 y cuatro entrevistas sueltas
// en la temporada 0 que no se cuentan como capítulos.
//
// IMDb tt30217403: 8,3 con unos 60.000 votos.

export const ANIME = {
  titulo: 'Dandadan',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'ダンダダン',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. La gracia de la serie es que el chico y la chica se
  // complementan justo por lo que el otro no cree.
  synopsis:
    'Momo Ayase cree en los espíritus y no en los extraterrestres; Ken Takakura, al que ' +
    'llama Okarun, cree justo lo contrario. Para demostrar quién tiene razón, cada uno va a ' +
    'buscar pruebas donde el otro no las cree: ella a un ovni, él a un túnel. Momo acaba ' +
    'secuestrada por unos alienígenas y Okarun poseído por Turbo Abuela, y entre los dos ' +
    'desmontan el ovni. Después llegan la medium, el primer amor que vuelve, un espíritu ' +
    'venganativo, un kaiju y la duda de si lo que sienten es de verdad.',

  anio: 2024,

  // La serie no ha terminado: la tercera temporada está confirmada para
  // 2027. No está emitiéndose ahora mismo, pero sigue viva.
  estado: 'emitiendo',

  estudio: 'Science SARU',

  // Shonen de acción con un pie en el terror y otro en la comedia
  // romántica de instituto. La parte de extraterrestres es ciencia
  // ficción, y lo de los espíritus es la misma cosa pasada de rosca.
  categorias: ['Shonen & Acción', 'Romance & Comedia', 'Ciencia Ficción & Cyberpunk'],

  generos: ['Acción', 'Comedia', 'Romance', 'Sobrenatural', 'Ciencia ficción', 'Escolar'],
};

export const ANIME_ID = 'dandadan';

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
// La marca escribe el nombre con los espacios: DAN DA DAN.
export const ALIASES = [
  'DAN DA DAN',
];

/**
 * Nota de la serie en IMDb (tt30217403): 8,3 con unos 60.000 votos.
 *
 * El capítulo 7 de la T1 ("Un mundo más amable", con Aira) se lleva el
 * 9,7 y el 20.000 de votos; en la T2 destaca el 8,9 del 2 y del 4.
 */
export const RATING_SERIE = 8.3;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1  12  (octubre - diciembre de 2024)
 *   T2  12  (julio - septiembre de 2025)
 *   --
 *       24
 */
export const EPISODIOS_TOTAL = 24;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> las dos temporadas, con subtítulos en castellano.
 *   · Netflix     -> las dos temporadas, con anuncios.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Science SARU',
    synopsis:
      'Doce capítulos del 4 de octubre al 20 de diciembre de 2024, en Science SARU para MBS y ' +
      'TBS. La apuesta entre Momo y Okarun sobre los extraterrestres y los espíritus acaba con un ' +
      'ovni por los suelos, una maldición, un amuleto robado y una pareja que todavía no sabe que ' +
      'se quiere.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Science SARU',
    synopsis:
      'Doce capítulos del 4 de julio al 19 de septiembre de 2025. El arco de Jiji lleva a los ' +
      'tres al balneario de su familia: un gusano de la muerte gigante, un espíritu con muy mal ' +
      'genio y un pueblo entero enterrado bajo la montaña. La temporada cierra con un kaiju, un ' +
      'mecha con forma de Buda y un beso que nadie se esperaba.',
    capitulos: 'T2',
  },
];
