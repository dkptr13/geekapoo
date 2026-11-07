// META - Kage no Jitsuryokusha ni Naritakute!
//
// TVDB 407520 "陰の実力者になりたくて!" (2022, Ended). Las dos
// series van en S1 y S2; los chibis de S0 no entran: cortos, y
// aqui eso no entra. La peli Zankyou-hen no tiene fecha y no
// entra hasta estrenarse.
// AniList 130298 (T1, 2022, 20) y 161964 (T2, 2023, 12).
// IMDb tt14115938.
//
// El titulo romanizado es el oficial en todo el mundo ("The
// Eminence in Shadow" es la licencia en ingles).

export const ANIME = {
  titulo: 'Kage no Jitsuryokusha ni Naritakute!',

  japaneseTitle: '陰の実力者になりたくて！',

  synopsis:
    'Cid quiso ser eminencia en la sombra y murio atropellado intentandolo. Renace en otro mundo y monta Shadow Garden de mentira. ' +
    'El problema: el culto existe de verdad y su teatro cuela demasiado bien. ' +
    'Dos temporadas de chuuni con presupuesto entre academia, torneo y ciudad sin ley.',

  anio: 2022,
  estado: 'finished',
  estudio: 'Nexus',

  // Isekai de chuuni con accion y comedia de poses: accion shonen
  // y fantasia oscura. Son dos.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Comedia', 'Fantasía', 'Isekai', 'Parodia', 'Magia'],
};

export const ANIME_ID = 'kage-no-jitsuryokusha-ni-naritakute';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * El T2 E12 se titula "HIGHEST" hasta en TVDB y en Japon: es el
 * oficial y no hay version en japones. La bandera le dice a
 * `comprobar-datos.mjs` que no exija kanji ni kana, igual que
 * Tokyo Revengers y Masamune.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt14115938: 7,7 con unos
 * 16.800 votos. El T1 E20 es lo mejor con 9,1.
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   20  (octubre de 2022 - febrero de 2023, serie)
 *   T2   12  (octubre - diciembre de 2023, 2nd season)
 *   --
 *        32
 */
export const EPISODIOS_TOTAL = 32;

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
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Nexus',
    synopsis:
      'Veinte capitulos entre el 5 de octubre de 2022 y el 15 de febrero de 2023. ' +
      'Cid monta Shadow Garden de mentira contra un culto de verdad: academia, torneo y poses. ' +
      'Cierra con "I am atomic" y el E20 como lo mejor con 9,1.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '2nd season',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Nexus',
    synopsis:
      'Doce capitulos entre el 4 de octubre y el 20 de diciembre de 2023. ' +
      'Ciudad sin ley con Yukime, vampiros y John Smith de por medio. ' +
      'Cierra a lo alto con HIGHEST y el E12 como lo mejor con 8,8.',
    capitulos: 'T2',
  },
];
