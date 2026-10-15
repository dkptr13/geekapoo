// LA FICHA DEL ANIME - Rent-a-Girlfriend
//
// Título internacional, que es como se conoce fuera de Japón (allí lo
// abrevian "Kanokari", かのかり). El manga de Reiji Miyajima se
// publica en la Weekly Shonen Magazine de Kodansha desde julio de
// 2017 y va por el tomo 47.
//
// Fichas de AniList de las cinco temporadas: 113813 (T1, 2020),
// 124410 (T2, 2022), 154745 (T3, 2023), 179344 (T4, 2025) y 199029
// (T5, 2026). Con el final de la quinta se anunció la sexta, sin
// fecha todavía: no entra hasta emitirse, igual que la segunda de
// Makeine.
//
// TMS Entertainment la anima entera. Kazuomi Koga dirige la T1 y la
// T2 (con Studio Comet cooperando en la segunda), Shinya Une la T3,
// y Koga vuelve para la T4 y la T5. Música de Hyadain en las cinco.
//
// Los datos de la serie en IMDb son tt11448214: 60 capítulos en
// total; los de la T4 y la T5 van con el flujo de emisión japonés.

export const ANIME = {
  titulo: 'Rent-a-Girlfriend',

  // El kanji oficial de la serie, de AniList y de la web oficial.
  japaneseTitle: '彼女、お借りします',

  // Base: la ficha de la Wikipedia en inglés (serie y temporadas) y
  // los argumentos por capítulo. No es un harem al uso: es una novia
  // de alquiler, una mentira que crece y dos personas que se hacen
  // compañía sin saber pedírselo. El drama va por la familia (las dos
  // abuelas) y por el sueño de Chizuru.
  synopsis:
    'Kazuya Kinoshita es un universitario al que su novia, Mami, deja al mes de salir. Para no ' +
    'hundirse alquila una novia por aplicación: Chizuru Mizuhara, que resulta ser su vecina de ' +
    'rellano y compañera de facultad. La mentira se sostiene para no romperle el corazón a la ' +
    'abuela enferma de Kazuya, y crece: el alquiler por horas, una ex que vuelve, una novia ' +
    'provisional, una aprendiz tímida y el sueño de Chizuru de ser actriz. Entre playa, hospital, ' +
    'obras de teatro y una película por crowdfunding, los dos se van queriendo sin decírselo. ' +
    'Comedia romántica de las que aprietan: la mentira no adorna la historia, la sostiene.',

  anio: 2020,
  estado: 'finished',
  estudio: 'TMS Entertainment',

  // Comedia romántica con drama de verdad, y el reparto repartido
  // entre la facultad y los alquileres. Son dos, como Golden Time.
  categorias: ['Romance & Comedia', 'Josei & Drama'],

  generos: ['Romance', 'Comedia', 'Drama', 'Universitario'],
};

export const ANIME_ID = 'rent-a-girlfriend';

/**
 * Nota de la serie en IMDb (tt11448214): 6,6 con unos 13.300 votos.
 *
 * Los capítulos van del 6,5 al 7,9: la serie puntúa por debajo de
 * sus mejores noches (los finales de la T2 y la T3 son lo más alto).
 */
export const RATING_SERIE = 6.6;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   12  (julio - septiembre de 2020)
 *   T2   12  (julio - septiembre de 2022)
 *   T3   12  (julio - septiembre de 2023, con descanso el 26 de agosto)
 *   T4   12  (julio - septiembre de 2025)
 *   T5   12  (abril - junio de 2026)
 *   --
 *        60
 */
export const EPISODIOS_TOTAL = 60;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la lleva en todo el mundo fuera de Asia desde la
 *     primera temporada, España incluida (ficha de la Wikipedia en
 *     inglés). En la T5, DMM TV y Crunchyroll la sacaron tres días
 *     antes que la tele.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capítulos del 11 de julio al 26 de septiembre de 2020. Kazuya alquila a Chizuru y la ' +
      'mentira de la novia encaja con la abuela ingresada. Mami vuelve por la puerta grande y ' +
      'entra Ruka, la novia provisional. Cierra con la confesión a medias de Kazuya y Chizuru ' +
      'ya lanzada hacia la actuación.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capítulos del 2 de julio al 17 de septiembre de 2022. La obra de la princesa, el ' +
      'cumpleaños de Chizuru y la fiesta del grupo; Ruka aprieta con el anillo en la mesa. ' +
      'Sayuri empeora y Kazuya le propone a Chizuru rodar una película por crowdfunding. ' +
      'Cierra con Chizuru aceptando rodar para su abuela.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capítulos del 8 de julio al 30 de septiembre de 2023 (con descanso el 26 de agosto). ' +
      'Mini se muda al 202 y descubre la mentira; campaña, rodaje en Madarao y estreno. La ' +
      'despedida de Sayuri se lleva los mejores episodios de la serie. Cierra con la verdad ante ' +
      'el altar de los abuelos de Chizuru.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capítulos del 5 de julio al 20 de septiembre de 2025. Kazuya lo intenta y no hay ' +
      'manera de declararse; Ruka miente con el envoltorio y el viaje a Spa Resort Hawaiians ' +
      'junta a las dos familias. Mami se arrima a la abuela de Kazuya y el final la lía más que ' +
      'la deslía. Cierra con la jugada de Mami y Chizuru echando a correr.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capítulos del 11 de abril al 27 de junio de 2026. El pasado de Mami abre la temporada ' +
      'y su golpe de efecto pone la mentira patas arriba; el beso de Chizuru delante de todos la ' +
      'convierte en novia de verdad. Llegan el fantasma de tres meses, la vuelta y la casa de la ' +
      'abuela. Cierra con la mudanza a tres.',
    capitulos: 'T5',
  },
];
