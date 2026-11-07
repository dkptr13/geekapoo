// LA FICHA DEL ANIME - Tsukimichi: Moonlit Fantasy
//
// Comedia de fantasía isekai de Felix Film: a Makoto Misumi lo convocan
// como héroe y la diosa de destino lo declara demasiado feo, así que lo
// tira al páramo. Allí monta una ciudad de orcos, enanos y lagartos,
// monta una compañía comercial, da clase en una academia y acaba
// peleando contra el ejército demoníaco.
//
//   T1  12 capítulos  (julio - septiembre de 2021)
//   T2  25 capítulos  (enero - junio de 2024)
//
// La tercera temporada está confirmada y no se ha emitido, así que no
// entra en el catálogo.
//
// Fichas de AniList: 125206 (T1) y 139518 (T2).
// TVDB: serie 390832, con las temporadas 1 y 2 y una tercera sin fecha.
// IMDb tt13311344: 7,7 con unos 6.700 votos.
//
// El título japonés es 月が導く異世界道中, "Tsuki ga Michibiku Isekai
// Douchuu", que en inglés se conoce como TSUKIMICHI -Moonlit Fantasy-.

export const ANIME = {
  titulo: 'Tsukimichi: Moonlit Fantasy',

  japaneseTitle: '月が導く異世界道中',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano.
  synopsis:
    'Un chico corriente es arrastrado a otro mundo para ser el héroe que lo salve, pero la diosa de ' +
    'destino lo mira, lo declara feo y lo manda al páramo con la capacidad de entender todos los ' +
    'idiomas. Makoto sobrevive a base de astucia, monta un negocio de ojos de rubí y ojos de dragón y ' +
    'levanta con sus propias manos una ciudad de orcos, enanos y lagartos en un semiespacio que ' +
    'solo él ve. Mientras tanto, en la Tierra, la diosa convoca a dos héroes más, un ejército ' +
    'demoníaco se organiza y alguien tiene que impedirlo todo.',

  anio: 2021,

  // La serie sigue viva: la tercera temporada está confirmada.
  estado: 'emitiendo',

  estudio: 'Felix Film',

  // Fantasía de aventura con isekai y mucho humor, y una dosis seria de
  // drama cuando las cosas se ponen de verdad malas.
  categorias: ['Fantasía & Aventura', 'Romance & Comedia'],

  generos: ['Fantasía', 'Aventura', 'Comedia', 'Romance', 'Sobrenatural', 'Acción', 'Isekai', 'Magia'],
};

export const ANIME_ID = 'tsukimichi-moonlit-fantasy';

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
// El titulo japones tambien se usa a solas.
export const ALIASES = [
  'Tsuki ga Michibiku Isekai Douchuu',
  'Moonlit Fantasy',
];

/**
 * Nota de la serie en IMDb (tt13311344): 7,7 con unos 6.700 votos.
 *
 * El final de la T1 (el capítulo de la despedida) se queda en 8,5. En
 * la T2 destacan el 8,2 del duelo contra el hombre dragón y el 8 del
 * capítulo de la princesa.
 */
export const RATING_SERIE = 7.7;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1  12  (julio - septiembre de 2021)
 *   T2  25  (enero - junio de 2024)
 *   --
 *       37
 */
export const EPISODIOS_TOTAL = 37;

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
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Felix Film',
    synopsis:
      'Doce capítulos del 7 de julio al 22 de septiembre de 2021, en Felix Film para Tokyo MX y ' +
      'AT-X. Makoto llega al páramo, sobrevive a la niebla de Shen, firma contrato con Tomoe y Mio ' +
      'y monta una compañía comercial con los ojos de rubí. Todo cambia cuando descubre que su ' +
      'maná de nivel divino lo ha puesto en la mira de la diosa.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Felix Film',
    synopsis:
      'Veinticinco capítulos del 8 de enero al 24 de junio de 2024. Makoto da clase en la academia ' +
      'de Rotsgard, conoce a la heroína Hibiki y descubre que el ejército demoníaco va a por la ' +
      'corona de Limia. Con Mio, Tomoe y Shiki al mando, monta el ejército del semiespacio y toma ' +
      'la fortaleza de Stella.',
    capitulos: 'T2',
  },
];
