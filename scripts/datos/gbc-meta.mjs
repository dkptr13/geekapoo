// META - Girls Band Cry
//
// TVDB 434127 "ガールズバンドクライ" (2024, Ended). Los
// videoclips y las dos compis van en S0 sin imagen y no entran:
// videos y resumenes, y aqui eso no entra.
// AniList 164212 (T1, 2024, 13 capitulos). Las dos compis de
// 2025 (186714 y 199154) son recopilatorios y no entran; la peli
// nueva (199152) no tiene fecha y no entra hasta estrenarse.
// IMDb tt31250134.
//
// El titulo en mayusculas es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Girls Band Cry',

  japaneseTitle: 'ガールズバンドクライ',

  synopsis:
    'Nina deja el instituto y se planta en Tokio a lo loco. Con Momoka, Subaru, Tomo y Rupa por bandera monta Togenashi Togeari entre curros basura y locales cutres. ' +
    'Gritos, lagrimas y contratos con letra pequeña: el rock de las que no encajan.',

  anio: 2024,
  estado: 'finished',
  estudio: 'Toei Animation',

  // Drama juvenil de banda con mala leche laboral y familiar:
  // drama adulto joven e intensidad. Son dos.
  categorias: ['Josei & Drama', 'Seinen & Psicológico'],

  generos: ['Drama', 'Música', 'Recuentos de la vida'],
};

export const ANIME_ID = 'girls-band-cry';

/**
 * Nota de la serie completa en IMDb, serie tt31250134: 7,7 con unos
 * 850 votos. El 10 es lo mejor con 8,9.
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total.
 *
 *   T1  13  (abril - junio de 2024)
 *   --
 *        13
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Trece capitulos entre el 6 de abril y el 29 de junio de 2024. ' +
      'Nina fuga a Tokio y monta banda con Momoka, Subaru, Tomo y Rupa: curros, bolos y discusion por dinero y futuro. ' +
      'Cierra independientes con el rock sin parar.',
    capitulos: 'T1',
  },
];
