// META - Dr. Stone (2019)
//
// TVDB 355774 (Dr.STONE, 2019) tiene 24 + 11 + 22 + 37 capitulos en
// las temporadas 1 a 4, mas 3 capitulos sueltos en la temporada 0
// (el especial de Stone Wars, el OVA de Ryusui y un recap), que
// aquí van en su propia temporada por orden de publicacion.
//
// AniList 105333 (la primera), 113936 (Stone Wars), 142876 (Ryusui),
// 131518 y 162670 (New World, en dos partes), 172019, 189117 y
// 199221 (Science Future, en tres partes).
// IMDb tt9679542: 8,1 con unos 47.000 votos.
//
// Los titulos en castellano y las fechas salen de los anexos de
// temporada de la wikipedia en espanol; los titulos japoneses, de
// TVDB; las notas, de IMDb. Los resumenes son traduccion de los de
// la wikipedia en ingles.
//
// Las ocho temporadas van en orden de publicacion:
//
//   T1  la serie (2019)                24 capitulos
//   T2  Stone Wars (2021)               11 capitulos
//   T3  Ryusui (2022, OVA)               1 capitulo
//   T4  New World, parte 1 (2023)       11 capitulos
//   T5  New World, parte 2 (2023)       11 capitulos
//   T6  Science Future, parte 1 (2025)  12 capitulos
//   T7  Science Future, parte 2 (2025)  12 capitulos
//   T8  Science Future, parte 3 (2026)  13 capitulos
//   --
//                95

export const ANIME = {
  titulo: 'Dr. Stone',

  japaneseTitle: 'Dr.STONE',

  synopsis:
    'En el ano 5738, toda la humanidad ha sido petrificada por un rayo ' +
    'verde. Senku Ishigami, un genio de quince anos, despierta en un ' +
    'mundo tomado por la naturaleza y decide reconstruir la civilizacion ' +
    'desde cero usando la ciencia. Con la ayuda de su amigo Taiju, revive ' +
    'a mas personas y forman el Reino de la Ciencia, enfrentandose a ' +
    'Tsukasa, que quiere un mundo sin adultos, y a otros enemigos que ' +
    'amenazan su sueño de llevar a la humanidad de vuelta a la era ' +
    'espacial.',

  anio: 2019,
  estado: 'finished',
  estudio: 'TMS Entertainment',

  categorias: ['Shonen & Acción', 'Ciencia Ficción & Cyberpunk'],

  generos: ['Acción', 'Aventura', 'Ciencia ficción', 'Comedia'],
};

export const ANIME_ID = 'dr-stone';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
export const ALIASES = [
  'Dr. Stone (2019)',
  'ドクターストーン',
];

/**
 * Algunos capitulos de Science Future tienen el subtitulo oficial en
 * ingles (por ejemplo "GIANT STEP", "FIRE", "STONE TO SPACE"), tal como
 * lo lista TVDB. La bandera le dice a `comprobar-datos.mjs` que no exija
 * kanji ni kana en el campo japones de esos capitulos.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie en IMDb (tt9679542): 8,1 con unos 47.000 votos.
 */
export const RATING_SERIE = 8.1;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  24  (julio - diciembre de 2019)
 *   T2  11  (enero - marzo de 2021)
 *   T3   1  (julio de 2022, OVA)
 *   T4  11  (abril - junio de 2023)
 *   T5  11  (octubre - diciembre de 2023)
 *   T6  12  (enero - marzo de 2025)
 *   T7  12  (julio - septiembre de 2025)
 *   T8  13  (abril - junio de 2026)
 *   --
 *       95
 */
export const EPISODIOS_TOTAL = 95;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con doblaje en espanol.
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
    estudio: 'TMS Entertainment',
    synopsis:
      'Veinticuatro capitulos emitidos del 5 de julio al 13 de diciembre de 2019. Senku ' +
      'despierta en un mundo petrificado y, con Taiju y Yuzuriha, empieza a revivir a la ' +
      'humanidad usando la ciencia, formando el Reino de la Ciencia.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Stone Wars',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capitulos emitidos del 14 de enero al 25 de marzo de 2021 (incluyendo el especial ' +
      'e24.5). El Reino de la Ciencia ' +
      'se enfrenta al ejercito de Tsukasa en la Guerra de Piedra, y Senku tiene que decidir si ' +
      'destruye o salva al ejercito enemigo.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Ryusui',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'OVA emitido el 10 de julio de 2022. Senku revive a Ryusui Nanami, un marinero experto, ' +
      'para preparar el viaje a la isla donde esta el origen de la petrificacion.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'New World',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Once capitulos emitidos del 6 de abril al 15 de junio de 2023. El Reino de la Ciencia ' +
      'zarpa hacia la isla del origen de la petrificacion y se encuentra con una tribu ' +
      'primitiva liderada por un hombre de la era moderna.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'New World (segunda parte)',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Diez capitulos emitidos del 12 de octubre al 21 de diciembre de 2023. La segunda parte ' +
      'de New World lleva a Senku y a sus amigos a la batalla contra el Maestro, el lider de ' +
      'la isla, y a la revelacion del origen de la petrificacion.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Science Future',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capitulos emitidos del 9 de enero al 27 de marzo de 2025. La cuarta temporada ' +
      'arranca con el viaje a la luna para encontrar el origen de la petrificacion y la ' +
      'carrera espacial contra el enemigo.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Science Future (segunda parte)',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Doce capitulos emitidos del 10 de julio al 25 de septiembre de 2025. La segunda parte ' +
      'de Science Future lleva a Senku y a sus amigos a la batalla final contra el enemigo ' +
      'y a la revelacion del origen de la petrificacion.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'Science Future (tercera parte)',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Trece capitulos emitidos del 2 de abril al 25 de junio de 2026. La tercera parte de ' +
      'Science Future lleva a Senku y a sus amigos a la batalla final contra el enemigo y a ' +
      'la revelacion del origen de la petrificacion.',
    capitulos: 'T8',
  },
];
