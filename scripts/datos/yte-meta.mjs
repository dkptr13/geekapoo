// LA FICHA DEL ANIME - To Your Eternity
//
// Fantasía vitalista de Yoshitoki Oima (la de A Silent Voice), en la
// Weekly Shonen Magazine de Kodansha de 2016 a 2025, con 25 tomos.
// Un orbe inmortal aprende a ser persona tomando la forma de quienes
// pierde, durante siglos y hasta la era actual.
//
// Fichas de AniList: 114535 (T1, 2021), 138565 (T2, 2022) y 162669
// (T3, 2025). Tres temporadas de televisión sin pelis ni especiales
// que entren: el resumen "El viaje de Fushi" no va numerado.
//
// Brain's Base anima la primera; Drive la segunda y la tercera (esta
// con Studio Massket), siempre con Fujita de guionista. Murata dirige
// la T1, Sayama la T2 y Yokote la T3 con Sayama de directora general.
// Música de Ryo Kawasaki en las tres.
//
// Los datos de la serie en IMDb son tt12063450: 8,2 con unos 13.400
// votos. Las fechas de IMDb no sirven (pone la T1E1 en mayo de 2021 y
// parte de la T3 en enero de 2025); aquí van las de emisión de la
// Wikipedia en inglés.

export const ANIME = {
  titulo: 'To Your Eternity',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: '不滅のあなたへ',

  // Base: las Wikipedias en inglés (serie y temporadas, con los
  // argumentos por capítulo) y en japonés (personal y fechas), la web
  // oficial para la tercera (cuyos resúmenes no trae la inglesa) y
  // TVDB para el japonés del primero de la T3. Un inmortal que se hace
  // persona a base de perderlas, y la pregunta de para qué vivir si no
  // te puedes morir.
  synopsis:
    'Un ser inmortal cae a la tierra como orbe blanco: roca, lobo y el chico que muere solo ' +
    'esperando a su tribu. Como Fushi (Inmo en el doblaje español) aprende a vivir tomando la ' +
    'forma de quienes pierde: March, Gugu, Parona y todos los que le enseñan a ser persona. Los ' +
    'nokkers, que roban cuerpos y recuerdos, lo obligan a crecer durante siglos hasta la era ' +
    'actual. Fantasía vitalista sobre la muerte y lo que deja.',

  anio: 2021,
  estado: 'finished',
  estudio: "Brain's Base",

  // Aventura fantástica juvenil con el drama por delante. Son dos,
  // como DanMachi, que junta fantasía y shonen.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Aventura', 'Drama', 'Fantasía', 'Sobrenatural', 'Psicológico', 'Coming-of-age', 'Tragedia'],
};

export const ANIME_ID = 'to-your-eternity';

/**
 * Nota de la serie en IMDb (tt12063450): 8,2 con unos 13.400 votos.
 *
 * Los capítulos van del 6,5 al 9,7: lo más alto es el despertar de la
 * T1 (E12, 9,7) y lo más bajo el cierre en falso de la T3 (E21, 6,5).
 * La primera está un punto por encima de las otras dos.
 */
export const RATING_SERIE = 8.2;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   20  (abril - agosto de 2021)
 *   T2   20  (octubre de 2022 - marzo de 2023)
 *   T3   22  (octubre de 2025 - marzo de 2026, con parón en febrero)
 *   --
 *        62
 */
export const EPISODIOS_TOTAL = 62;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la lleva entera en España, con la tercera en
 *     emisión semanal y doblaje propio (fichas de crunchyroll.com/es
 *     y aviso de la temporada 3 en 2025).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: "Brain's Base",
    synopsis:
      'Veinte capítulos del 12 de abril al 30 de agosto de 2021, en Brain’s Base para NHK ' +
      'Educativa, con Murata dirigiendo. El orbe se hace chico, conoce a March y la pierde, ' +
      'aprende a hablar con Pyoran, crece con Gugu y cae preso en Jananda con Tonari. Hayase lo ' +
      'caza por obsesión y la temporada cierra con la vejez de Pyoran. Cimiento de todo lo que viene.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Drive',
    synopsis:
      'Veinte capítulos del 23 de octubre de 2022 al 12 de marzo de 2023, en Drive con Sayama ' +
      'dirigiendo. Cuarenta años después, Hisame, reencarnación de Hayase, y el príncipe Bon ' +
      'meten a Fushi en la guerra contra la iglesia de Bennett. Renril resiste con los ' +
      'guardianes Kai, Hairo y Messar; Fushi aprende a resucitar y la era cambia.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Drive',
    synopsis:
      'Veintidós capítulos del 4 de octubre de 2025 al 28 de marzo de 2026 (con parón entre el ' +
      '31 de enero y el 28 de febrero), en Drive con Studio Massket para NHK General. Fushi ' +
      'despierta en la era actual con March adoptada y Mizuha, heredera de cazadores, en el ' +
      'centro. Los nokkers conviven y pelean desde dentro; la temporada cierra el círculo con ' +
      'el Observador.',
    capitulos: 'T3',
  },
];
