// META - Tensei Shitara Slime Datta Ken (2018)
//
// TVDB 352408 (転生したらスライムだった件, 2018) tiene 24 + 24 + 24 + 24
// capitulos en las temporadas 1 a 4. En la temporada 0 deja los cinco
// capitulos originales en DVD, la peli Scarlet Bond y el ONA de Coleus,
// mas los capitulos chibi, que no entran: son cortitos de humor, como
// los mini-shorts de Fire Force y los de "Ple Ple Pleiades" de Overlord.
// Tampoco entran "Tensura Nikki", el diario de Slime, que son doce
// capitulos de cuatro minutos, ni el ONA de Ramiris, que no tiene ficha
// en TVDB ni en IMDb.
//
// AniList 101280 (la primera), 108511 y 116742 (la segunda, en dos
// partes), 156822 (la tercera) y 182205 (la cuarta).
// IMDb tt9054364: 8,0 con unos 29.000 votos.
//
// Los titulos en castellano y las fechas salen de los anexos de
// temporada de la wikipedia en espanol; los titulos japoneses, de la
// wikipedia en ingles; las notas, de IMDb. Los resumenes son
// traduccion de los de la wikipedia en ingles.
//
// Las ocho temporadas van en orden de publicacion, con las pelis y los
// capitulos originales en DVD intercalados:
//
//   T1  la serie (2018)               25 capitulos
//   T2  los capitulos en DVD (2019)    5 capitulos
//   T3  la segunda (2021)             26 capitulos
//   T4  Scarlet Bond (2022)            1 capitulo
//   T5  Coleus no Yume (2023)          3 capitulos
//   T6  la tercera (2024)             26 capitulos
//   T7  Lágrimas del mar azul (2026)   1 capitulo
//   T8  la cuarta (2026)               24 capitulos

export const ANIME = {
  titulo: 'Tensei Shitara Slime Datta Ken',

  japaneseTitle: '転生したらスライムだった件',

  synopsis:
    'Rimuru Tempest era un oficinista de 37 años que murió apuñalado al ' +
    'sacar a un compañero de un atraco. Al despertar en otro mundo descubre ' +
    'que se ha reencarnado en un limo, y en seguida tiene dos aliados: el ' +
    'Gran Sabio, que vive dentro de él, y Veldora, el Dragón de la Tormenta, ' +
    'que le da el nombre. Con ellos, Rimuru reúne a los duendes y a los ' +
    'ogros de una aldea y la convierte en la nación de Tempest, un país de ' +
    'monstruos que crece entre diplomacias, guerras y tratados. Lo que ' +
    'empieza como un grupo de duendes acaba siendo un Estado con su ' +
    'moneda, su ejército y su diplomacia, y en medio de ese crecimiento ' +
    'aparecen los Reyes Demonio, la propia Milim y un enemigo mucho más ' +
    'viejo que el mundo, que lleva años moviendo los hilos desde las ' +
    'sombras.',

  anio: 2018,
  estado: 'finished',
  estudio: '8-Bit',

  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Comedia', 'Isekai', 'Magia'],
};

export const ANIME_ID = 'tensei-shitara-slime-datta-ken';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles, el japones con el ano, y el diminutivo que se
// usa en japon. Solo titulos de ESTA obra: nada de lo que pertenezca a
// otra serie.
export const ALIASES = [
  'That Time I Got Reincarnated as a Slime',
  'Tensei Shitara Slime Datta Ken (2018)',
  'TenSura',
];

/**
 * Nota de la serie en IMDb (tt9054364): 8,0 con unos 29.000 votos.
 */
export const RATING_SERIE = 8.0;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  25  (octubre de 2018 - marzo de 2019)
 *   T2   5  (julio de 2019 - noviembre de 2020)
 *   T3  26  (enero - septiembre de 2021)
 *   T4   1  (noviembre de 2022, pelicula)
 *   T5   3  (noviembre de 2023)
 *   T6  26  (marzo - septiembre de 2024)
 *   T7   1  (febrero de 2026, pelicula)
 *   T8  24  (abril - septiembre de 2026)
 *   --
 *       111
 */
export const EPISODIOS_TOTAL = 111;

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
    anio: 2018,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Veinticuatro episodios emitidos del 2 de octubre de 2018 al 19 de marzo de 2019, con el ' +
      'diario de Verudora intercalado al final. Un oficinista japones muere apuñalado y despierta ' +
      'reencarnado en un limo; con la ayuda del Gran Sabio y de Veldora, el Dragón de la Tormenta, ' +
      'levanta en la aldea de los duendes la primera base de lo que será Tempest.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Los capitulos originales en DVD',
    anio: 2019,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Los cinco capitulos originales en DVD, repartidos entre 2019 y 2020. En el primero, Rimuru ' +
      'enseña a los ciudadanos de Tempest la lucha de sumo; en el segundo, hace un cojín con su ' +
      'propia imagen para que Shion y Shuna dejen de pelarse; y en los tres últimos, sustituye a un ' +
      'profesor en la academia de Falmuth.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Tensei Shitara Slime Datta Ken II',
    anio: 2021,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Veinticuatro episodios emitidos del 5 de enero al 21 de septiembre de 2021, en dos partes, ' +
      'con dos digresiones intercaladas. La segunda temporada lleva a Rimuru a negociar con el reino ' +
      'de Eurazania, a preparar la fiesta de fundación de la nación y a la guerra de los Reyes ' +
      'Demonio, con el banquete de Walpurgis como episodio central.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Scarlet Bond',
    anio: 2022,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Peli estrenada el 25 de noviembre de 2022. Tras desertar del ejército de Clayman, un ogro ' +
      'anónimo sobrevive a una emboscada, es recogido por el reino de Raja y vuelve a su aldea ' +
      'destruida para vengar a los orcos. Al visitarla, Rimuru descubre que la reina Towa está ' +
      'envenenada y que un mercader ha escondido un sortilegio en un lago.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Coleus no Yume',
    anio: 2023,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'ONA de tres capitulos estrenado el 1 de noviembre de 2023. Rimuru manda a Yuuki al reino de ' +
      'Coleus para averiguar qué hay detrás de la disputa por la sucesión entre sus dos príncipes, ' +
      'y de paso se topa con un gran ladrón fantasma y con el médico de la corte, que es la raíz de ' +
      'todo.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Tensei Shitara Slime Datta Ken III',
    anio: 2024,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Veinticuatro episodios emitidos del 31 de marzo al 27 de septiembre de 2024, con dos ' +
      'digresiones intercaladas. La tercera temporada empieza con el banquete de Walpurgis, donde ' +
      'Clayman humilla a Rimuru delante de todos los Reyes Demonio, y sigue con la fiesta de ' +
      'fundación de Tempest, el torneo de artes marciales y la apertura de la mazmorra al mundo.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Lágrimas del mar azul',
    anio: 2026,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Segunda peli de la serie, estrenada el 27 de febrero de 2026. En el reino submarino de Kaien, ' +
      'una sacerdotisa roba la flauta mágica del Colmillo del Dragón y huye a la superficie; su ' +
      'regreso y las intrigas de un noble hacen que la ciudad submarina salga a la luz del día, y ' +
      'Rimuru tiene que desviar al dragón de agua antes de que arrase con la isla donde están de ' +
      'vacaciones.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'Tensei Shitara Slime Datta Ken IV',
    anio: 2026,
    estado: 'Finalizado',
    estudio: '8-Bit',
    synopsis:
      'Veinticuatro capitulos emitidos del 3 de abril al 25 de septiembre de 2026, repartidos en ' +
      'cinco partes. La cuarta temporada arranca con la evolución de la mazmorra de Tempest y con la ' +
      'llegada de los enemigos del oeste, y acaba con el enfrentamiento final contra Chronoa, que ' +
      'despierta cuando ya no queda nadie que la detenga.',
    capitulos: 'T8',
  },
];
