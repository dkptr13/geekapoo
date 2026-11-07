// LA FICHA DEL ANIME - Kimi ni Todoke: From Me to You
//
// Treinta y siete capitulos del 6 de octubre de 2009 al 30 de marzo de
// 2011, en Production I.G para NTV. La historia de Sawako, la chica que
// todos evitan por su parecido con Sadako, y de cómo Kazehaya le enseña
// a sonreír.
//
//   T1  25 capitulos  (octubre de 2009 - marzo de 2010)
//   T2  12 capitulos  (enero - marzo de 2011)
//
// Ficha de AniList: 6045 (T1) y 9656 (T2). La T3 (ONA, 5 capitulos,
// 2024) no entra en el catálogo.
// TVDB: serie 117801, con las temporadas 0 (especiales), 1, 2 y 3.
// IMDb tt1745240: 7,8 con unos 9.000 votos.

export const ANIME = {
  titulo: "Kimi ni Todoke: From Me to You",

  japaneseTitle: '君に届け',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Sawako quiere ser como los demás y Kazehaya es el
  // primero que la trata como una persona.
  synopsis:
    "Sawako Kuronuma es la chica que todos evitan por su parecido con " +
    "Sadako, el fantasma de La llamada. Por dentro es dulce y tímida, " +
    "pero nadie se acerca a ella. Kazehaya Shouta, el chico más popular " +
    "de la clase, la trata con normalidad, y eso lo cambia todo: poco a " +
    "poco Sawako hace amigos, se enamora y aprende a sonreír. Dos " +
    "temporadas de malentendidos, celos, confesiones y una amistad que " +
    "se construye letra a letra.",

  anio: 2009,
  estado: 'finished',
  estudio: 'Production I.G',

  // Romance y comedia escolar con un fondo de soledad y crecimiento.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Comedia', 'Escolar', 'Recuentos de la vida', 'Drama', 'Shojo', 'Coming-of-age'],
};

export const ANIME_ID = 'kimi-ni-todoke-from-me-to-you';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés, el romanizado y los sinónimos que de verdad se
// usan. Los escribe el agente que añade el anime, a mano, y se guardan
// en "alternativeTitles" del documento de Firestore, que es lo que la
// búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  "Kimi ni Todoke",
  'Reaching You',
  'Llegando a ti',
];

/**
 * Nota de la serie en IMDb (tt1745240): 7,8 con unos 9.000 votos.
 *
 * La primera temporada se queda en un 7,8 de media. La segunda sube
 * un poco, con el capítulo de la confesión en un 8,2.
 */
export const RATING_SERIE = 7.8;

/**
 * Capítulos en total.
 *
 *   T1  25  (octubre de 2009 - marzo de 2010)
 *   T2  12  (enero - marzo de 2011)
 *   ---
 *       38
 *
 * La T3 (ONA, 5 capítulos, 2024) no entra: es una obra aparte.
 */
export const EPISODIOS_TOTAL = 37;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la serie completa, con subtítulos en castellano.
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco capítulos del 6 de octubre de 2009 al 30 de marzo de 2010, en Production I.G ' +
      'para NTV. Sawako llega a la clase, nadie se le acerca, y Kazehaya la trata como a una ' +
      'persona. De aquí salen la amistad con Chizuru y Ayane, el malentendido con Kurumi, el ' +
      'festival deportivo, la Navidad y la primera nieve.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '2nd Season',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Trece capítulos del 5 de enero al 30 de marzo de 2011. Sawako y Kazehaya siguen sin ' +
      'aclararse, y cada malentendido los aleja. El San Valentín, el cambio de curso, el ' +
      'festival y la confesión final cierran la historia principal.',
    capitulos: 'T2',
  },
];
