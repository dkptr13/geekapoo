// LA FICHA DEL ANIME - Assassination Classroom
//
// Cuarenta y siete capitulos del 9 de enero de 2015 al 30 de junio de
// 2016, en Lerche para Fuji TV. Un profesor con tentaculos que amenaza
// con destruir la Tierra y que da clase a los alumnos que tienen que
// asesinarlo antes de graduarse.
//
//   T1  22 capitulos  (enero - junio de 2015)
//   T2  25 capitulos  (enero - junio de 2016)
//
// Ficha de AniList: 20755 (T1) y 21170 (T2).
// TVDB: serie 279602, con las temporadas 1 y 2.
// IMDb tt3837246: 7,9 con unos 30.000 votos.

export const ANIME = {
  titulo: 'Assassination Classroom',

  japaneseTitle: '暗殺教室',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Koro-sensei destruye la Luna y da clase a los alumnos
  // de la 3-E, que tienen un año para matarlo.
  synopsis:
    'Un ser con tentáculos destruye el 70% de la Luna y amenaza con ' +
    'hacer lo mismo con la Tierra en un año. Pero antes, enseña en la ' +
    'clase 3-E del instituto Kunugigaoka, una clase de marginados. Sus ' +
    'alumnos tienen un año para asesinarlo, y cada uno tiene una ' +
    'recompensa de mil millones de yenes. Dos temporadas de humor, ' +
    'acción y un profesor que enseña más sobre la vida que sobre el ' +
    'asesinato.',

  anio: 2015,
  estado: 'finished',
  estudio: 'Lerche',

  // Comedia y acción escolar con fondo de crecimiento personal.
  categorias: ['Shonen & Acción', 'Comedia'],

  generos: ['Acción', 'Comedia', 'Escolar', 'Shonen', 'Ciencia ficción'],
};

export const ANIME_ID = 'assassination-classroom';

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
  'Ansatsu Kyoushitsu',
  'AssClass',
  'Assassination Classroom (2015)',
];

/**
 * Nota de la serie en IMDb (tt3837246): 7,9 con unos 30.000 votos.
 *
 * La primera temporada se queda en un 7,8 de media. La segunda sube
 * al 8,1, con el capítulo 23 en un 8,6.
 */
export const RATING_SERIE = 7.9;

/**
 * Capítulos en total.
 *
 *   T1  22  (enero - junio de 2015)
 *   T2  25  (enero - junio de 2016)
 *   ---
 *       47
 *
 * El OVA "Meeting Time" y los especiales no entran.
 */
export const EPISODIOS_TOTAL = 47;

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
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Veintidós capítulos del 9 de enero al 19 de junio de 2015, en Lerche para Fuji TV. ' +
      'Koro-sensei llega a la clase 3-E y enseña a los alumnos a asesinarlo. De aquí salen ' +
      'el entrenamiento, la excursión a Kioto, la llegada de Karma y el torneo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '2nd Season',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Veinticinco capítulos del 7 de enero al 30 de junio de 2016. Koro-sensei enseña a ' +
      'los alumnos a asesinarlo. De aquí salen el festival, el pasado de Koro-sensei, la ' +
      'graduación y el final.',
    capitulos: 'T2',
  },
];
