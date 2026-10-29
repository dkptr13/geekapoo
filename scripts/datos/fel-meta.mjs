// META - Fate/EXTRA Last Encore
//
// AniList 21717 (TV, 2018, 13 episodios). Estudio: Shaft, con Nasu en
// el guion. Adapta (libremente) el juego Fate/EXTRA.
//
// La ficha separa los diez episodios de la serie y los tres especiales
// "Illustrias" que se emitieron juntos el 29 de julio de 2018.
//
// La nota de AniList es 61 sobre 100, que es un 6,1.

export const ANIME = {
  titulo: 'Fate/EXTRA Last Encore',

  japaneseTitle: 'フェイト/エクストラ ラストアンコール',

  synopsis:
    'En un futuro donde la Tierra ya no es habitable, la humanidad sobrevive en una ciudad de la Luna ' +
    'llamada SE.RA.PH. Allí se celebra una guerra del Grial con ciento veintiocho maestros y un solo ' +
    'ganador. Hakuno Kishinami despierta sin recordar nada, con una espada en la mano y con Nero, una ' +
    'emperatriz romana que insiste en llamarle maestro. Cada piso de la torre es un rival, una ciudad y ' +
    'una versión distinta de la guerra, y Hakuno tiene que decidir si merece la pena seguir subiendo.',

  anio: 2018,
  estado: 'finished',
  estudio: 'Shaft',

  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico'],

  generos: ['Acción', 'Fantasía', 'Psicológico'],
};

export const ANIME_ID = 'fate-extra-last-encore';

/** Nota de AniList: 61 sobre 100. */
export const RATING_SERIE = 6.1;

/** 13 episodios: los diez de la serie y los tres especiales. */
export const EPISODIOS_TOTAL = 13;

/** Sin oferta española verificada de la serie. */
export const STREAMING = [];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Diez episodios emitidos del 28 de enero al 1 de abril de 2018. Hakuno sube los pisos de la torre ' +
      'con Nero, se enfrenta a maestros que ya han perdido la guerra y descubre que el torneo no es lo ' +
      'que le contaron. Shaft lo anima con escenarios vacíos y silencios largos, más cerca del misterio ' +
      'que de la pelea constante.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Illustrias',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Tres especiales emitidos juntos el 29 de julio de 2018 como cierre de la serie. Continúan el ' +
      'recorrido de Hakuno y Nero por los últimos pisos y explican qué hay detrás de la guerra y de la ' +
      'propia existencia de Hakuno. Se pueden ver como los episodios 11, 12 y 13.',
    capitulos: 'T2',
  },
];
