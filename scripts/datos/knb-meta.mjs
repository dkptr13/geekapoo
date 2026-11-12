// META - Kuroko no Basket
// 
// AniList 11771 (serie, 2012).
// IMDb tt2348803: 8,2.
// JustWatch ES: ts22249. Disponible en Netflix y Amazon Prime en España.
// 
// Production I.G adapta el manga de Tadatoshi Fujimaki. Emitida entre 2012 y 2015 en tres temporadas de veinticinco episodios.

export const ANIME = {
  titulo: 'Kuroko no Basket',

  japaneseTitle: '黒子のバスケ',

  synopsis:
    'Kuroko fue el sexto hombre fantasma de la Generación de los Milagros, el equipo que dominó el baloncesto escolar japonés. Ahora entra en Seirin con Taiga Kagami, un alero criado en Estados Unidos, y juntos deciden derrotar a los cinco genios que marcaron su pasado. La serie combina partidos de instituto, rivalidades y la idea de que el trabajo en equipo puede vencer al talento individual.',

  anio: 2012,
  estado: 'finished',
  estudio: 'Production I.G',

  categorias: ['Shonen & Acción', 'Comedia & Slice of Life'],

  generos: ['Deportes', 'Comedia', 'Shonen'],
};

export const ANIME_ID = 'kuroko-no-basket';

export const ALIASES = ['Kuroko\'s Basketball', 'Kuroko no Basuke', 'The Basketball Which Kuroko Plays'];

export const RATING_SERIE = 8.2;

export const EPISODIOS_TOTAL = 75;

export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Amazon Prime', url: 'https://www.amazon.es/prime-video', badgeColor: 'bg-sky-500/20 text-sky-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco episodios emitidos entre abril y septiembre de 2012. Kuroko y Kagami entran en el equipo de Seirin y descubren que para ganar al resto de la Generación de los Milagros tendrán que combinar la luz y la sombra. La temporada cubre el torneo Interhigh y el primer choque contra Touou.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'La Copa de Invierno',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco episodios emitidos entre octubre de 2013 y marzo de 2014. Seirin se prepara para la Copa de Invierno y se enfrenta a Yousen, Shuutoku y Touou. La temporada presenta a Himuro, los Reyes sin Corona y la lesión de Kiyoshi, y cierra con la clasificación para el torneo final.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'La final de la Copa de Invierno',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco episodios emitidos entre enero y julio de 2015. Seirin llega a las semifinales de la Copa de Invierno y se mide a Kaijou y Rakuzan. La temporada revela el pasado de la Generación de los Milagros y cierra con la final contra Akashi y su Ojo del Emperador.',
    capitulos: 'T3',
  },
];
