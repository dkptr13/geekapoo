// META - Overlord (2015)
//
// TVDB 294002 (オーバーロード, 2015, Ended) tiene 13 + 13 + 13 episodios
// en las temporadas 1, 2 y 3. En la temporada 0 deja las películas
// recopilatorias, el OVA de 2016 y los capítulos chibi de "Ple Ple
// Pleiades", que no entran: son cortitos de humor, como los
// mini-shorts de Fire Force.
// AniList 20832 (serie, 13 episodios). IMDb tt4869896: 7,6 con unos
// 20.000 votos.
//
// Los títulos en castellano y las fechas salen de los anexos de
// temporada de la Wikipedia en español; los títulos japoneses, de TVDB;
// las notas, de IMDb. Los resumenes son propios, a partir del resumen
// en inglés de cada episodio.

export const ANIME = {
  titulo: 'Overlord',

  japaneseTitle: 'オーバーロード',

  synopsis:
    'Yggdrasil era el juego de rol más popular del mundo hasta que su servidor cerro de golpe. ' +
    'Momonga, el jefe de la guild Ainz Ooal Gown, se quedo dormido en el Gran Tumba de Nazarick y ' +
    'despertio en un mundo real donde sus companeros ya no estaban y sus personajes no jugadores, ' +
    'creados con una magia imposible, lo rodeaban como si llevaran siglos esperandole. Con un ' +
    'ejercito de muertos vivientes a sus ordenes, Ainz sale a explorar un continente que no ' +
    'conoce, tres reglas se imponen: no revelar su origen, no mostrar todo su poder y no fiarse ' +
    'de nadie. La aparicion de un héroe, Shalltear, pondra a prueba la primera de las tres.',

  anio: 2015,
  estado: 'finished',
  estudio: 'Madhouse',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Ciencia ficción', 'Sobrenatural'],
};

export const ANIME_ID = 'overlord';

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
export const ALIASES = [
  'Overlord (2015)',
];

/**
 * Nota de la serie en IMDb (tt4869896): 7,6 con unos 20.000 votos.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  13  (julio - septiembre de 2015)
 *   T2  13  (enero - abril de 2018)
 *   T3  13  (julio - octubre de 2018)
 *   T4  13  (julio - septiembre de 2022)
 *   T5   1  (septiembre de 2024, película)
 *   T6   1  (febrero de 2017, película)
 *   T7   1  (marzo de 2017, película)
 *   T8   1  (septiembre de 2016, OVA)
 *   --
 *       56
 */
export const EPISODIOS_TOTAL = 56;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con doblaje en español latino.
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
    estudio: 'Madhouse',
    synopsis:
      'Trece episodios emitidos del 7 de julio al 29 de septiembre de 2015. Ainz despierta solo en ' +
      'el Gran Tumba de Nazarick, cambia sus ajustes de personaje y sale al mundo real como el ' +
      'aventurero Momon. En la Villa Carne ve como una aldea entera es masacrada y decide ' +
      'intervenir, y la serie acaba con su primer duelo contra la vampira Shalltear.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Ple Ple Pleiades: La crisis más grande de Nazarick',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'OVA de 30 minutos estrenado el 30 de septiembre de 2016. Ainz reúne a los guardianes de ' +
      'Nazarick y al cuerpo de maids para probar el objeto Total Maniac-Modified, que altera la ' +
      'personalidad de quien lo toca, hasta que Pandora lo neutraliza.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'El rey muerto',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Película de compilación estrenada el 25 de febrero de 2017, con material nuevo de la ' +
      'primera temporada. Ainz despierta en el Gran Tumba de Nazarick, descubre que sus ' +
      'personajes no jugadores tienen vida propia y sale al mundo real como Momon.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'El héroe oscuro',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Película de compilación estrenada el 11 de marzo de 2017, con material nuevo de la ' +
      'segunda temporada. Cuenta la campaña de Ainz como aventurero en la region de E-Rantel y su ' +
      'primer choque con la vampira Shalltear, a la que da por muerta sin saber que sigue viva.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Overlord II',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Trece episodios del 9 de enero al 3 de abril de 2018. La guerra entre el Reino de ' +
      'Re-Estize y el Imperio de Baharuth se solapa con la rebelión de los hombres lagarto, que ' +
      'piden ayuda a Ainz. En E-Rantel, el demonio Jaldabaoth llega de la mano de la Iglesia y ' +
      'obliga a Momon a defenderse en público.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Overlord III',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Trece episodios del 10 de julio al 2 de octubre de 2018. El arco del Reino Sagrado: la ' +
      'villa Carne se convierte en objetivo del Gigante del Este y de la Serpiente Demonio del ' +
      'Oeste, mientras Ainz se enfrenta a Gazef Stronoff en un duelo de honor que acaba con la ' +
      'muerte del héroe del reino.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Overlord IV',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Trece episodios del 5 de julio al 27 de septiembre de 2022. Ainz pasa de guerrero ' +
      'solitario a gobernante: vence al Imperio de Baharuth, se alia con el Reino de los Enanos y con los ' +
      'señores dragón, y termina declarando la guerra a Re-Estize cuando el rey le niega una ' +
      'cabeza que ofrece como disculpa.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'El reino sagrado',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Película de compilación estrenada el 20 de septiembre de 2024, con escenas nuevas del ' +
      'arco del Reino Sagrado. Recoge el choque final entre el reino de Ainz y el Imperio de ' +
      'Baharuth y el duelo entre el hechicero Ainz Ooal Gown y el emperador Jircniv.',
    capitulos: 'T8',
  },
];
