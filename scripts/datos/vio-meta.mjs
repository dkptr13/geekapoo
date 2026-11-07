// LA FICHA DEL ANIME - Violet Evergarden
//
// Trece capítulos del 11 de enero al 5 de abril de 2018, en Kyoto Animation
// para Tokyo MX y BS11. Una soldado que perdió los brazos en la guerra se
// convierte en "muñeca de memoria automática": escribe cartas para quien
// se las pide y aprende, letra a letra, qué significa el "te quiero".
//
// La OVA "Kitto Ai wo Shiru Hi ga Kuru no Darou" (julio de 2018) y la
// película "Eien to Jidou Shuki Ningyou" (septiembre de 2019) no entran en
// el catálogo: son obras aparte.
//
// Ficha de AniList: 21827. La OVA es 101432 y la película 103047.
// TVDB: serie 330139, con la temporada oficial 1 (los trece capítulos) y
// la 0, donde están la OVA y la película, que no entran.
// IMDb tt7078180: 8,4 con unos 43.800 votos.
//
// El título japonés es el nativo de AniList, con el punto medio.

export const ANIME = {
  titulo: 'Violet Evergarden',

  japaneseTitle: 'ヴァイオレット・エヴァーガーデン',

  // Base: la sinopsis de AniList y el argumento de los trece capítulos,
  // en castellano. Violet fue el arma más temida de su ejército y ahora
  // escribe con una letra que parece de una persona y no de un arma.
  synopsis:
    'Violet Evergarden fue la mejor soldado del ejército de Leidenschaftlich y perdió los ' +
    'brazos en el campo de batalla. Sobrevivió a un milagro y, con la guerra terminada, sin ' +
    'trabajo y sin saber vivir sin órdenes, entra en la compañía de correos como muñeca de ' +
    'memoria automática: escribe cartas para quien se las pide, con la letra más bella del ' +
    'mundo. Lo que empieza como un oficio se convierte en una búsqueda, la de entender qué ' +
    'significa el "te quiero" y qué le pasó a Gilbert, el oficial que la salvó y al que ella ' +
    'quería con toda su alma.',

  anio: 2018,
  estado: 'finished',
  estudio: 'Kyoto Animation',

  // Drama de veteranía con fondo de romance: no hay combate, hay duelo,
  // trabajo y cartas mal escritas.
  categorias: ['Josei & Drama', 'Seinen & Psicológico'],

  generos: ['Drama', 'Romance', 'Fantasía', 'Recuentos de la vida', 'Tragedia', 'Coming-of-age'],
};

export const ANIME_ID = 'violet-evergarden';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés con el año, el diminutivo y el título oficial en
// chino. Los escribe el agente que añade el anime, a mano, y se guardan
// en "alternativeTitles" del documento de Firestore, que es lo que la
// búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Violet Evergarden (2018)',
  'Violet',
  '紫罗兰永恒花园',
];

/**
 * Nota de la serie en IMDb (tt7078180): 8,4 con unos 43.800 votos.
 *
 * Los capítulos miden bien: el de la carta de la niña y su madre llega
 * al 9,8 y el de la obra de teatro, al 9,3. El capítulo 2, el de la
 * adaptación al trabajo de las muñecas, baja a un 7,8.
 */
export const RATING_SERIE = 8.4;

/**
 * Capítulos en total.
 *
 *   T1  13  (enero - abril de 2018)
 *   ---
 *       13
 *
 * La OVA y la película son obras aparte y no entran.
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la serie completa, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com', badgeColor: '#e50914', regions: ['WW'] },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Trece capítulos del 11 de enero al 5 de abril de 2018, en Kyoto Animation para Tokyo MX ' +
      'y BS11. Violet llega a la compañía de correos de la capital y aprende a escribir cartas ' +
      'que unen a la gente; entre la escuela de muñecas, el observatorio, una obra de teatro y ' +
      'un convoy de paz, descubre lo que el "te quiero" de Gilbert quería decir.',
    capitulos: 'T1',
  },
];
