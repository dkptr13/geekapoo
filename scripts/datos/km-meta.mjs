// META - Kämpfer
//
// TVDB 115991 "けんぷファー" (2009, Ended; la S0 trae los 8 picture
// dramas sin titulo y los dos de für die Liebe como S0E9 y S0E10).
// AniList 6205 (T1, 2009, 12 capitulos) y 10076 (T2 für die Liebe,
// 2011, 2 capitulos). IMDb tt1516239 (serie) y tt3420978 (OVA).
// El picture drama suelto (7782) no entra: corto sin numero.
//
// El titulo en aleman es el oficial en todo el mundo ("Luchador").

export const ANIME = {
  titulo: 'Kämpfer',

  japaneseTitle: 'けんぷファー',

  synopsis:
    'Natsuru es un chico normal de instituto hasta que un tigre de peluche le dice que lo han elegido Kämpfer. ' +
    'El truco: para pelear tiene que ser chica, y despierta en cuerpo de mujer. ' +
    'Con pistola, espada o magia se mide a otras Kämpfer entre mensajeros viscerales, pulseras de colores y lios de instituto.',

  anio: 2009,
  estado: 'finished',
  estudio: 'Nomad',

  // Comedia romantica con batallas de chicas magicas y harem
  // escolar de propina. Son dos.
  categorias: ['Romance & Comedia', 'Shonen & Acción'],

  generos: ['Acción', 'Comedia', 'Romance', 'Ecchi', 'Escolar', 'Harem'],
};

export const ANIME_ID = 'kampfer';

/**
 * Nota de la serie completa en IMDb: 6,0 de media ponderada de las
 * dos entregas (tt1516239: 6,0 con 570 votos; tt3420978: 6,3 con
 * 54). El T1 E5 es lo mejor con 8,1.
 */
export const RATING_SERIE = 6.0;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   12  (octubre - diciembre de 2009, serie de television)
 *   T2    2  (abril - mayo de 2011, OVA für die Liebe, episodios 13 y 14)
 *   --
 *        14
 */
export const EPISODIOS_TOTAL = 14;

/**
 * Donde se emite en España.
 *
 *   · Amazon Prime -> la ficha española de Prime Video la sirve con el
 *     canal HIDIVE, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Amazon Prime', url: 'https://www.amazon.es/prime-video', badgeColor: 'bg-sky-500/20 text-sky-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Nomad',
    synopsis:
      'Doce capitulos entre el 1 de octubre y el 17 de diciembre de 2009. ' +
      'Natsuru despierta convertido en chica y reparte entre instituto y batallas con Akane, Shizuku, Mikoto y Kaede por medio. ' +
      'Pulseras azules contra rojas, mensajeros viscerales dando ordenes y el mejor capitulo en el quinto.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'für die Liebe',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Nomad',
    synopsis:
      'Dos capitulos entre el 8 de abril y el 25 de mayo de 2011. ' +
      'Secuela directa como episodios 13 y 14: la faccion blanca intenta partir al grupo con hipnosis y Natsuru busca curro de medio tiempo para sujetar lo suyo. ' +
      'Cierra la serie sin dejar cabos.',
    capitulos: 'T2',
  },
];
