// META - Hunter x Hunter (2011)
//
// TVDB 252322 (HUNTER×HUNTER, 2011, Ended) guarda la serie en tres
// bloques de produccion de 58, 78 y 12 episodios, no en temporadas
// oficiales. El catalogo la cuenta como una sola temporada de 148
// episodios, que es como se emitio y como la conocen las plataformas.
// Por eso el emparejador de miniaturas necesita el caso especial de
// `SIN_COMPROBAR_NUMERO`: los titulos son unicos y el numero de
// temporada de TVDB no coincide con el del catalogo.
//
// AniList 11061 (serie, 148 episodios), 13271 (pelicula Phantom Rouge,
// 2013) y 19951 (The Last Mission, 2013). IMDb tt2098220: 9,0 con unos
// 206.000 votos. Las dos peliculas puntuan aparte, con 6,5 cada una.
//
// La serie de 1999 y sus OVAs son otra franquicia y no entran aqui.
//
// Los titulos japoneses salen de TVDB; los titulos en castellano son
// traduccion propia de los titulos oficiales en ingles, que es como se
// conocen los episodios en todas las plataformas. Las fechas salen de
// la Wikipedia en espanol y las notas de IMDb. Los resumenes son
// propios.

export const ANIME = {
  titulo: 'Hunter x Hunter',

  japaneseTitle: 'HUNTER×HUNTER',

  synopsis:
    'Gon Freecss vive en la Isla Ballena y descubre que su padre, Ging, sigue vivo y es uno de los ' +
    'Cazadores más legendarios. Para encontrarlo, Gon se presenta al Examen de Cazador, donde conoce a ' +
    'Killua, Kurapika y Leorio. Juntos cruzarán pruebas mortales, torneos de Nen, subastas, islas de ' +
    'videojuego y la amenaza de las hormigas quimera. La amistad y la búsqueda del padre son el motor ' +
    'de una aventura que no da tregua.',

  anio: 2011,
  estado: 'finished',
  estudio: 'Madhouse',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Shōnen'],
};

export const ANIME_ID = 'hunter-x-hunter';

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
// La x y la multiplicacion se leen igual, asi que basta una.
export const ALIASES = [
  'Hunter x Hunter (2011)',
];

/**
 * Nota de la serie en IMDb (tt2098220): 9,0 con unos 206.000 votos.
 */
export const RATING_SERIE = 9.0;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  148  (octubre de 2011 - septiembre de 2014, serie)
 *   T2    1  (enero de 2013, pelicula Phantom Rouge)
 *   T3    1  (diciembre de 2013, pelicula The Last Mission)
 *   --
 *       150
 *
 * Las peliculas van como temporada propia, con su nota de IMDb.
 */
export const EPISODIOS_TOTAL = 150;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con subtitulos en castellano.
 *   · Netflix     -> la serie, con doblaje y subtitulos.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Ciento cuarenta y ocho episodios emitidos del 2 de octubre de 2011 al 24 de septiembre de 2014. ' +
      'Gon persigue el rastro de su padre a través del Examen de Cazador, la Torre del Cielo, la subasta ' +
      'de Yorknew y la isla de Greed Island. El último tramo lo enfrenta a las hormigas quimera y al ' +
      'nacimiento de Meruem, el enemigo más peligroso de toda la serie.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Phantom Rouge',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Película estrenada el 12 de enero de 2013. Kurapika persigue a la Brigada Fantasma para recuperar ' +
      'los ojos escarlata de su clan, pero alguien le roba los suyos. Gon, Killua y Leorio lo ayudan a ' +
      'recuperarlos mientras aparece un antiguo miembro de la banda y una niña llamada Retz.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'La última misión',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Película estrenada el 27 de diciembre de 2013. Gon y sus amigos visitan la Torre del Cielo para ' +
      'el torneo Battle Olympia, pero un grupo armado ataca el evento. El pasado de Netero y los ' +
      'Cazadores de la oscuridad ponen en peligro a todos los asistentes.',
    capitulos: 'T3',
  },
];
