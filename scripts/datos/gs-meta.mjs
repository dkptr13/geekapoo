// META - Goblin Slayer
//
// TVDB 350166 "ゴブリンスレイヤー" (2018, Ended). Las dos series
// van en S1 y S2 y la peli en Specials (S0E2). El resumen de S0E1
// no entra.
// AniList 101165 (T1, 2018, 12), 108623 (T2 peli Crown, 2020) y
// 129188 (T3 II, 2023, 12).
// IMDb tt8690728 (series) y tt11151982 (peli).
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Goblin Slayer',

  japaneseTitle: 'ゴブリンスレイヤー',

  synopsis:
    'Un tipo con casco solo caza goblins con metodos guarros y una sacerdotisa novata se le pega. ' +
    'Con elfa, enano y lagarto por bandera limpia nidos donde nadie quiere bajar. ' +
    'Dos series y peli de fantasia sucia sin heroes de postal.',

  anio: 2018,
  estado: 'finished',
  estudio: 'WHITE FOX',

  // Fantasia oscura de mazmorras con accion de nidos: bichos y
  // espadas. Son dos.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Mazmorras'],
};

export const ANIME_ID = 'goblin-slayer';

/**
 * Nota de la serie completa en IMDb, serie tt8690728: 7,3 con unos
 * 13.700 votos. El T1 E7 y E12 son lo mejor con 8,4.
 */
export const RATING_SERIE = 7.3;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   12  (octubre - diciembre de 2018, serie)
 *   T2    1  (febrero de 2020, peli Crown)
 *   T3   12  (octubre - diciembre de 2023, II)
 *   --
 *        25
 */
export const EPISODIOS_TOTAL = 25;

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
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'WHITE FOX',
    synopsis:
      'Doce capitulos entre el 7 de octubre y el 30 de diciembre de 2018. ' +
      'El casco rescata a la sacerdotisa y monta grupo: nidos, agua y asedio a la granja. ' +
      'Cierra con el gremio entero contra el señor.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: "Goblin's Crown",
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'WHITE FOX',
    synopsis:
      'Sesenta minutos del 1 de febrero de 2020. ' +
      'Nieve y fortaleza enana con la espadachina noble de tapadillo y rey goblin de jefe. ' +
      'Peli de puente entre series.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'II',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'LIDENFILMS',
    synopsis:
      'Doce capitulos entre el 6 de octubre y el 22 de diciembre de 2023, ya en LIDENFILMS. ' +
      'Mismo casco con novatos, elfos y princesa: entrenar, explorar y rezar. ' +
      'Cierra pidiendo al cielo que escuche.',
    capitulos: 'T3',
  },
];
