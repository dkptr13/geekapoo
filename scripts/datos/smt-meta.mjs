// META - Shinmai Maou no Testament (2015)
//
// TVDB 284719 (新妹魔王の契約者, 2015) tiene 12 capitulos en la
// temporada 1 y 10 en la segunda. En la temporada 0 deja los dos OVA
// (el de Basara y el de Burst) y la peli Departures, que aqui van en
// su propia temporada por orden de publicacion.
//
// AniList 20678 (la primera), 21247 (el primer OVA), 21110 (Burst),
// 21489 (el segundo OVA) y 100451 (Departures).
// IMDb tt4219258: 6,5 con unos 5.000 votos; la peli Departures
// (tt10736506): 6,8.
//
// Los titulos en castellano, los japoneses, las fechas y los
// resumenes salen del anexo de la wikipedia en espanol. Las notas,
// de IMDb.

export const ANIME = {
  titulo: 'Shinmai Maou no Testament',

  japaneseTitle: '新妹魔王の契約者',

  synopsis:
    'Basara Tōjō es un estudiante de preparatoria que un día descubre que ' +
    'su padre se ha vuelto a casar y que va a tener dos hermanas menores: ' +
    'Mio Naruse, la hija del difunto Rey Demonio, y Maria Naruse, un súcubo. ' +
    'Tras el pacto de maestro y sirvienta que firma con Mio, Basara se ' +
    'convierte en su protector frente a los demonios y héroes que quieren ' +
    'hacerse con su poder, mientras lucha con su propio pasado como miembro ' +
    'del Clan Héroe.',

  anio: 2015,
  estado: 'finished',
  estudio: 'Production IMS',

  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Ecchi', 'Harem', 'Sobrenatural', 'Romance', 'Demonios'],
};

export const ANIME_ID = 'shinmai-maou-no-testament';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
export const ALIASES = [
  'The Testament of Sister New Devil',
  'Shinmai Maou no Testament (2015)',
];

/**
 * Nota de la serie en IMDb (tt4219258): 6,5 con unos 5.000 votos.
 */
export const RATING_SERIE = 6.5;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  12  (enero - marzo de 2015)
 *   T2   1  (junio de 2015, OVA)
 *   T3  10  (octubre - diciembre de 2015)
 *   T4   1  (enero de 2016, OVA)
 *   T5   1  (marzo de 2018, pelicula)
 *   --
 *       25
 */
export const EPISODIOS_TOTAL = 25;

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
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'Doce capitulos emitidos del 7 de enero al 25 de marzo de 2015. Basara ' +
      'Toujou, exiliado del Clan Heroe, acoge a Mio y a Maria Naruse como ' +
      'hermanas y acaba convertido en el protector de Mio frente a los ' +
      'demonios y heroes que quieren su poder.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Tōjō Basara no Hard Sweet na Nichijō',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'OVA de 24 minutos estrenado el 22 de junio de 2015. El dia a dia de ' +
      'Basara Toujou en su casa, entre las tareas domesticas y las ' +
      'provocaciones de Maria.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Shinmai Maō no Testament BURST',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'Diez capitulos emitidos del 9 de octubre al 11 de diciembre de 2015. ' +
      'La segunda temporada sigue la guerra entre demonios y heroes, con la ' +
      'llegada de Zolgear y el despertar del verdadero poder de Mio.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Tōjō Basara no shigoku heiwa na nichijō',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'OVA de 22 minutos estrenado el 26 de enero de 2016. El dia a dia de ' +
      'Basara Toujou en su casa, esta vez con la ayuda de las nuevas ' +
      'llegadas, y con un poco mas de tiempo para las hermanas y para las ' +
      'compañeras de clase que se han ido quedando en el camino.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Departures',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'Peli de 60 minutos estrenada el 28 de marzo de 2018. Basara y Mio ' +
      'viajan a un resort y se encuentran con una misteriosa chica, mientras ' +
      'los enemigos del pasado vuelven a aparecer.',
    capitulos: 'T5',
  },
];
