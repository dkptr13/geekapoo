// LA FICHA DEL ANIME - Gintama
//
// Trescientos sesenta y siete capitulos del 4 de abril de 2006 al 7 de
// octubre de 2018, en Sunrise y BN Pictures para TV Tokyo. La comedia
// de ciencia ficcion de samurais en un Japon ocupado por alienigenas.
//
//   T1  201 capitulos  (abril de 2006 - marzo de 2010)
//   T2   51 capitulos  (abril de 2011 - marzo de 2012)
//   T3   13 capitulos  (octubre de 2012 - marzo de 2013)
//   T4   51 capitulos  (abril de 2015 - marzo de 2016)
//   T5   12 capitulos  (enero - marzo de 2017)
//   T6   13 capitulos  (octubre - diciembre de 2017)
//   T7   26 capitulos  (enero - octubre de 2018)
//
// Ficha de AniList: 918 (T1), 9969 (T2), 15417 (T3), 20996 (T4),
// 97889 (T5), 99714 (T6) y 97889 (T7).
// TVDB: serie 79895, con las temporadas 1 a 10.
// IMDb tt0988818: 8,7 con unos 23.000 votos.

export const ANIME = {
  titulo: 'Gintama',

  japaneseTitle: '銀魂',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Gintoki es un samurai en un Japon ocupado por
  // alienigenas que hace trabajos por dinero.
  synopsis:
    'En un Japon feudal ocupado por alienigenas (los amanto), los ' +
    'samurais han sido desarmados. Gintoki Sakata, un samurai vago y ' +
    'adicto al azucar, dirige una agencia de trabajos por encargo con ' +
    'Shinpachi Shimura y Kagura. Siete temporadas de comedia, accion, ' +
    'parodia y momentos que llegan al corazon. Gintoki lucha por ' +
    'mantener su orgullo de samurai en un mundo que ya no los necesita.',

  anio: 2006,
  estado: 'finished',
  estudio: 'Sunrise',

  // Comedia y accion con fondo de ciencia ficcion y parodia.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Comedia', 'Ciencia ficción', 'Histórico', 'Parodia', 'Shonen', 'Drama', 'Samuráis'],
};

export const ANIME_ID = 'gintama';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles con el año. Los escribe el agente que anade
// el anime, a mano, y se guardan en "alternativeTitles" del documento
// de Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El japones ya esta en japaneseTitle, asi que no se repite aqui.
export const ALIASES = [
  'Gintama (2006)',
];

/**
 * Nota de la serie en IMDb (tt0988818): 8,7 con unos 23.000 votos.
 *
 * La segunda temporada (Gintama') sube al 8,9. La tercera (Gintama°)
 * llega al 9,0.
 */
export const RATING_SERIE = 8.7;

/**
 * Capitulos en total.
 *
 *   T1  201  (abril de 2006 - marzo de 2010)
 *   T2   51  (abril de 2011 - marzo de 2012)
 *   T3   13  (octubre de 2012 - marzo de 2013)
 *   T4   51  (abril de 2015 - marzo de 2016)
 *   T5   12  (enero - marzo de 2017)
 *   T6   13  (octubre - diciembre de 2017)
 *   T7   26  (enero - octubre de 2018)
 *   ---
 *      367
 *
 * Las peliculas y los OVA no entran.
 */
export const EPISODIOS_TOTAL = 367;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie completa, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'Sunrise',
    synopsis:
      'Doscientos un capitulos del 4 de abril de 2006 al 25 de marzo de 2010, en Sunrise para TV Tokyo. ' +
      'Gintoki, Shinpachi y Kagura hacen trabajos por encargo mientras luchan contra los amanto. ' +
      'De aqui salen la saga del Yoshiwara, la del Shinsengumi y la del festival.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Gintama\'',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Sunrise',
    synopsis:
      'Cincuenta y un capitulos del 4 de abril de 2011 al 26 de marzo de 2012, en Sunrise para TV Tokyo. ' +
      'Gintoki y sus amigos siguen haciendo trabajos por encargo. De aqui salen la saga de la ' +
      'policia y la del festival.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Gintama\': Enchousen',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Sunrise',
    synopsis:
      'Trece capitulos del 4 de octubre de 2012 al 28 de marzo de 2013, en Sunrise para TV Tokyo. ' +
      'Gintoki y sus amigos siguen haciendo trabajos por encargo. De aqui sale la saga final de ' +
      'la primera parte.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Gintama°',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'BN Pictures',
    synopsis:
      'Cincuenta y un capitulos del 8 de abril de 2015 al 30 de marzo de 2016, en BN Pictures para TV Tokyo. ' +
      'Gintoki y sus amigos siguen haciendo trabajos por encargo. De aqui salen la saga de la ' +
      'policia y la del festival.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Gintama.',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'BN Pictures',
    synopsis:
      'Doce capitulos del 9 de enero al 27 de marzo de 2017, en BN Pictures para TV Tokyo. ' +
      'Gintoki y sus amigos siguen haciendo trabajos por encargo. De aqui sale la saga de ' +
      'la despedida.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Gintama.: Porori-hen',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'BN Pictures',
    synopsis:
      'Trece capitulos del 2 de octubre al 25 de diciembre de 2017, en BN Pictures para TV Tokyo. ' +
      'Gintoki y sus amigos siguen haciendo trabajos por encargo. De aqui sale la saga de ' +
      'la despedida.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Gintama. Shirogane no Tamashii-hen',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'BN Pictures',
    synopsis:
      'Veintiseis capitulos del 7 de enero al 7 de octubre de 2018, en BN Pictures para TV Tokyo. ' +
      'Gintoki y sus amigos siguen haciendo trabajos por encargo. De aqui sale la saga final.',
    capitulos: 'T7',
  },
];
