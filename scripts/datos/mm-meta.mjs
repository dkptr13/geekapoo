// META - Masamune-kun no Revenge
//
// TVDB 318860 "政宗くんのリベンジ" (2017, Ended; el OVA va en
// Specials como S0E1 y la R como S2).
// AniList 21857 (T1, 2017, 12 capitulos), 101213 (T2 OVA, 2018)
// y 146953 (T3 R, 2023, 12 capitulos).
// IMDb tt6402190 (serie con OVA dentro como S1E13, y R como S2).
//
// El titulo romanizado es el oficial fuera de Japon
// ("Masamune-kun's Revenge" es la licencia en ingles).

export const ANIME = {
  titulo: 'Masamune-kun no Revenge',

  japaneseTitle: '政宗くんのリベンジ',

  synopsis:
    'De niño, Aki lo llamo pata de cerdo y lo dejo compuesto. Masamune vuelve delgado, guapo y con otro apellido para enamorarla y dejarla igual. ' +
    'Pero la princesa cruel tiene su parte blanda, la criada Yoshino mueve los hilos y la venganza se tuerce capitulo a capitulo.',

  anio: 2017,
  estado: 'finished',
  estudio: 'SILVER LINK.',

  // Comedia romantica escolar de manual: los dos cajones de
  // siempre, como Takagi.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Romance', 'Escolar', 'Recuentos de la vida', 'Venganza'],
};

export const ANIME_ID = 'masamune-kun-no-revenge';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * El T3 E12 se titula "Dead or love？" hasta en TVDB y en Japon:
 * es el oficial y no hay version en japones. La bandera le dice a
 * `comprobar-datos.mjs` que no exija kanji ni kana, igual que
 * Tokyo Revengers y Burn the Witch.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt6402190: 6,6 con unos
 * 5.500 votos. El T3 E12 es lo mejor con 8,2 y el T1 E10 lo peor
 * con 6,2.
 */
export const RATING_SERIE = 6.6;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   12  (enero - marzo de 2017, serie de television)
 *   T2    1  (julio de 2018, OVA con el tomo 10)
 *   T3   12  (julio - septiembre de 2023, R)
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
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'SILVER LINK.',
    synopsis:
      'Doce capitulos entre el 5 de enero y el 23 de marzo de 2017. ' +
      'Masamune vuelve guapo a por Aki con plan de venganza, Neko dice ser su prometida y Yoshino lo sabe todo. ' +
      'Cierra con la venganza a medias y el corazon desobedeciendo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'OVA',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'SILVER LINK.',
    synopsis:
      'Un capitulo del 27 de julio de 2018, salido con el tomo 10 del manga. ' +
      'Tres historias cortas con el reparto de tapadillo: madres fisgonas, vuelta a la isla Tsunade y Cenicienta pasada la medianoche. ' +
      'Extra ligero entre la serie y R, sin el no se pierde nada de la trama.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'R',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'SILVER LINK.',
    synopsis:
      'Doce capitulos entre el 3 de julio y el 18 de septiembre de 2023. ' +
      'Viaje a Paris con Muriel nueva, pareja hecha, Kanetsugu de vuelta y San Valentin por medio. ' +
      'Cierra con muerte o amor respondido y la venganza cumplida del todo.',
    capitulos: 'T3',
  },
];
