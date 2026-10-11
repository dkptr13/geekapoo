// META - Kakegurui
//
// TVDB 327572 "賭ケグルイ" (2017, Ended) para las dos series y
// 412354 "賭ケグルイ双〈ツイン〉" (2022) para la precuela.
// AniList 98314 (T1, 2017), 100876 (T2 ××, 2019) y 141351 (Twin).
// IMDb tt7131720 (serie) y tt15912380 (Twin).
//
// El titulo corto es el oficial en todo el mundo.
//
// ── EL ORDEN ────────────────────────────────────────────────
//
// Por fecha de emision: dos series y precuela al final, aunque la
// precuela cuente el pasado. El catalogo numera por fecha, igual
// que en KonoSuba con Bakuen. Los tres Picture Drama van en S0 de
// TVDB y aqui no entran: son extras cortos.

export const ANIME = {
  titulo: 'Kakegurui',

  japaneseTitle: '賭ケグルイ',

  synopsis:
    'En la academia Hyakkaou todo se decide apostando: quien pierde acaba de mascota de quien gana. ' +
    'Yumeko Jabami llega trasladada y apuesta por placer, no por ganar, volviendo locos los juegos amañados. ' +
    'Con Mary y Ryouta al lado se mide al consejo, al clan Momobami en las elecciones y, en la precuela, Mary empieza sola.',

  anio: 2017,
  estado: 'finished',
  estudio: 'MAPPA',

  // Juego psicologico con misterio de quien amaña cada partida, y
  // escolar porque todo pasa por clases y consejo. Son tres.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio', 'Shojo & Escolar'],

  generos: ['Drama', 'Psicológico', 'Misterio', 'Juego', 'Escolar'],
};

export const ANIME_ID = 'kakegurui';

/**
 * Nota de la serie completa en IMDb, serie tt7131720: 7,1 con unos
 * 18.000 votos.
 */
export const RATING_SERIE = 7.1;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  12  (julio - septiembre de 2017, serie)
 *   T2  12  (enero - marzo de 2019, ××)
 *   T3   6  (agosto de 2022, precuela Twin, salida en bloque)
 *   --
 *       30
 */
export const EPISODIOS_TOTAL = 30;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 *   · Netflix -> las dos series y Twin en catalogo.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Doce capitulos entre el 1 de julio y el 23 de septiembre de 2017. ' +
      'Yumeko llega y desmonta los juegos del consejo uno a uno: Mary, Itsuki, Yuriko, Midari, Yumemi y Kaede caen o se rinden. ' +
      'Cierra contra Kirari con la academia en vilo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '××',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Doce capitulos entre el 9 de enero y el 27 de marzo de 2019. ' +
      'Elecciones del clan Momobami con catorce candidatos y una sola ganadora. ' +
      'Yumeko contra la familia entera, con la criada enmascarada repartiendo cartas.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Twin',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Seis capitulos salidos en bloque el 4 de agosto de 2022. ' +
      'Precuela con Mary de protagonista antes de Yumeko, con Yukimi y Tsuzura al lado. ' +
      'La academia antes de la tormenta.',
    capitulos: 'T3',
  },
];
