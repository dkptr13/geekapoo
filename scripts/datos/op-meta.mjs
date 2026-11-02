// LA FICHA DEL ANIME - One Piece
//
// Serie de Toei Animation para Fuji TV, en emision desde el 20 de
// octubre de 1999. Luffy y su tripulacion buscan el tesoro del Rey de
// los Piratas, Gol D. Roger, en un mundo de islas y piratas.
//
// De momento el catalogo tiene las veintidos primeras temporadas:
//
//   T1   61 capitulos  (octubre de 1999 - marzo de 2001)
//   T2   16 capitulos  (marzo - agosto de 2001)
//   T3   14 capitulos  (agosto - diciembre de 2001)
//   T4   39 capitulos  (diciembre de 2001 - octubre de 2002)
//   T5   13 capitulos  (noviembre de 2002 - febrero de 2003)
//   T6   52 capitulos  (febrero de 2003 - junio de 2004)
//   T7   33 capitulos  (junio de 2004 - marzo de 2005)
//   T8   35 capitulos  (abril de 2005 - abril de 2006)
//   T9   73 capitulos  (mayo de 2006 - diciembre de 2007)
//   T10  45 capitulos  (enero - diciembre de 2008)
//   T11  26 capitulos  (diciembre de 2008 - junio de 2009)
//   T12  14 capitulos  (julio - octubre de 2009)
//   T13  35 capitulos  (octubre de 2009 - junio de 2010)
//   T14  60 capitulos  (julio de 2010 - septiembre de 2011)
//   T15  62 capitulos  (octubre de 2011 - diciembre de 2012)
//   T16  50 capitulos  (enero de 2013 - enero de 2014)
//   T17 118 capitulos  (enero de 2014 - junio de 2016)
//   T18  36 capitulos  (junio de 2016 - abril de 2017)
//   T19 109 capitulos  (abril de 2017 - junio de 2019)
//   T20 197 capitulos  (julio de 2019 - diciembre de 2023)
//   T21  67 capitulos  (enero de 2024 - diciembre de 2025)
//   T22  25 capitulos  (abril - septiembre de 2026)
//
// Las demas temporadas se iran anadiendo por tandas.
//
// Ficha de AniList: 21 (la serie entera, en emision, sin total de
// capitulos). TVDB: serie 81797, que reparte los capitulos por anos.
// IMDb tt0388629: 9,0 con unos 371.000 votos.

export const ANIME = {
  titulo: 'One Piece',

  japaneseTitle: 'ワンピース',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Luffy es un chico de goma que quiere ser el Rey de los
  // Piratas y sale al mar a buscar el tesoro de Roger.
  synopsis:
    'Monkey D. Luffy es un chico que comio la Fruta del Diablo y cuyo ' +
    'cuerpo se estiro como la goma, pero que perdio para siempre la ' +
    'capacidad de nadar. Con su sombrero de paja y una tripulacion que ' +
    'reune isla a isla, recorre los mares en busca del One Piece, el ' +
    'tesoro del Rey de los Piratas Gol D. Roger. Quien lo encuentre ' +
    'heredara su titulo. Aventura, humor y combates en una serie que ' +
    'sigue en emision desde 1999.',

  anio: 1999,
  estado: 'emitiendo',
  estudio: 'Toei Animation',

  // Aventura y accion con fondo de piratas y poderes sobrenaturales.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Comedia', 'Fantasía', 'Shonen'],
};

export const ANIME_ID = 'one-piece';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador: el
// titulo en ingles con el ano de la serie. El japones ya esta en
// japaneseTitle y no se repite.
export const ALIASES = [
  'One Piece (1999)',
  'One Piece (anime)',
];

/**
 * Nota de la serie en IMDb (tt0388629): 9,0 con unos 371.000 votos.
 */
export const RATING_SERIE = 9.0;

/**
 * Capitulos en total.
 *
 * De momento estan cargadas las veintidos primeras temporadas:
 *
 *   T1   61  (octubre de 1999 - marzo de 2001)
 *   T2   16  (marzo - agosto de 2001)
 *   T3   14  (agosto - diciembre de 2001)
 *   T4   39  (diciembre de 2001 - octubre de 2002)
 *   T5   13  (noviembre de 2002 - febrero de 2003)
 *   T6   52  (febrero de 2003 - junio de 2004)
 *   T7   33  (junio de 2004 - marzo de 2005)
 *   T8   35  (abril de 2005 - abril de 2006)
 *   T9   73  (mayo de 2006 - diciembre de 2007)
 *   T10  45  (enero - diciembre de 2008)
 *   T11  26  (diciembre de 2008 - junio de 2009)
 *   T12  14  (julio - octubre de 2009)
 *   T13  35  (octubre de 2009 - junio de 2010)
 *   T14  60  (julio de 2010 - septiembre de 2011)
 *   T15  62  (octubre de 2011 - diciembre de 2012)
 *   T16  50  (enero de 2013 - enero de 2014)
 *   T17 118  (enero de 2014 - junio de 2016)
 *   T18  36  (junio de 2016 - abril de 2017)
 *   T19 109  (abril de 2017 - junio de 2019)
 *   T20 197  (julio de 2019 - diciembre de 2023)
 *   T21  67  (enero de 2024 - diciembre de 2025)
 *   T22  25  (abril - septiembre de 2026)
 *
 * El resto de la serie se ira anadiendo por tandas. Las peliculas y los
 * especiales no entran.
 */
export const EPISODIOS_TOTAL = 1180;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie completa, con subtitulos en castellano.
 *   · Netflix     -> la primera temporada, con doblaje al castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com', badgeColor: '#e50914' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1999,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Sesenta y un capitulos del 20 de octubre de 1999 al 7 de marzo de 2001, en Toei Animation para Fuji TV. ' +
      'Es la saga del East Blue: Luffy sale de su aldea, conoce a Zoro, Nami, Usopp y Sanji y recorre el mar ' +
      'hasta la entrada de la Gran Ruta Maritima, donde le esperan Arlong y el recuerdo de Shanks.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2001,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Dieciseis capitulos del 21 de marzo al 19 de agosto de 2001, en Toei Animation para Fuji TV. ' +
      'La tripulacion entra en la Gran Ruta Maritima, conoce a la ballena Laboon y a Crocus, cruza Whisky ' +
      'Peak y Little Garden y se enfrenta a los agentes de Baroque Works, que persiguen a la princesa Vivi.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2001,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Catorce capitulos del 26 de agosto al 9 de diciembre de 2001, en Toei Animation para Fuji TV. ' +
      'Nami enferma y la tripulacion busca un medico en la isla de Drum, gobernada por el tirano Wapol. ' +
      'Alli conocen a la doctora Kureha y al reno Tony Tony Chopper, que acaba unido a la tripulacion.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: '',
    anio: 2002,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Treinta y nueve capitulos del 16 de diciembre de 2001 al 27 de octubre de 2002, en Toei Animation para Fuji TV. ' +
      'Es la saga de Arabasta: la tripulacion llega al reino desertico de Vivi y descubre que Crocodile y Baroque ' +
      'Works estan detras de la sequia y de la guerra civil. Para detener el golpe de estado se enfrenta a los ' +
      'agentes de elite, y Nico Robin acaba unida a la tripulacion.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: '',
    anio: 2002,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Trece capitulos del 3 de noviembre de 2002 al 2 de febrero de 2003, en Toei Animation para Fuji TV. ' +
      'Es la temporada mas corta de la serie y la unica enteramente de relleno: cinco historias sueltas sobre ' +
      'los suenos de la tripulacion, la isla del viejo prestamista Zenny y la Niebla Arcoiris con los Piratas ' +
      'Pumpkin.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: '',
    anio: 2003,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Cincuenta y dos capitulos del 9 de febrero de 2003 al 13 de junio de 2004, en Toei Animation para Fuji TV. ' +
      'Es la saga de la isla del cielo: la tripulacion llega a Jaya, sube a Skypiea por la Knock-Up Stream y ' +
      'queda atrapada en la guerra entre skypieanos y shandia y en el juego de supervivencia del dios Enel.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: '',
    anio: 2004,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Treinta y tres capitulos del 20 de junio de 2004 al 27 de marzo de 2005, en Toei Animation para Fuji TV. ' +
      'La temporada empieza con el relleno de la base naval G-8, sigue con el Davy Back Fight contra los piratas ' +
      'de Foxy y el relleno de los recuerdos robados, y acaba con la llegada del almirante Aokiji.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: '',
    anio: 2005,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Treinta y cinco capitulos del 17 de abril de 2005 al 30 de abril de 2006, en Toei Animation para Fuji TV. ' +
      'La tripulacion llega a Water Seven, la ciudad de los carpinteros: el Going Merry se declara irreparable, ' +
      'Usopp deja el grupo y CP9 se lleva a Robin tras revelarse como la organizacion del Gobierno Mundial.',
    capitulos: 'T8',
  },
  {
    numero: 9,
    titulo: '',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Setenta y tres capitulos del 21 de mayo de 2006 al 23 de diciembre de 2007, en Toei Animation para Fuji TV. ' +
      'La tripulacion asalta Enies Lobby para rescatar a Robin, se despide del Going Merry y estrena el Thousand ' +
      'Sunny con Franky a bordo. Despues llegan el relleno de los Piratas del Fenix y los especiales de Chopperman.',
    capitulos: 'T9',
  },
  {
    numero: 10,
    titulo: '',
    anio: 2008,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Cuarenta y cinco capitulos del 6 de enero al 14 de diciembre de 2008, en Toei Animation para Fuji TV. ' +
      'Es la saga de Thriller Bark: la tripulacion llega al barco-isla de Gecko Moria, pierde las sombras, ' +
      'conoce al esqueleto Brook y se enfrenta a los zombis, al gigante Oars y al tirano Kuma.',
    capitulos: 'T10',
  },
  {
    numero: 11,
    titulo: '',
    anio: 2008,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Veintiseis capitulos del 21 de diciembre de 2008 al 28 de junio de 2009, en Toei Animation para Fuji TV. ' +
      'Tras el relleno de Spa Island y Foxy, la tripulacion llega al archipielago Sabaody, conoce a Camie y a las ' +
      'Supernovas y se enfrenta a los Dragones Celestiales; Kizaru, Sentomaru y Kuma acaban dispersandola.',
    capitulos: 'T11',
  },
  {
    numero: 12,
    titulo: '',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Catorce capitulos del 5 de julio al 11 de octubre de 2009, en Toei Animation para Fuji TV. ' +
      'Es la saga de Amazon Lily: Luffy aparece solo en la isla de las mujeres, conoce a Boa Hancock y a las ' +
      'hermanas serpiente, y decide escapar para rescatar a Ace de Impel Down.',
    capitulos: 'T12',
  },
  {
    numero: 13,
    titulo: '',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Treinta y cinco capitulos del 18 de octubre de 2009 al 20 de junio de 2010, en Toei Animation para Fuji TV. ' +
      'Es la saga de Impel Down: Luffy se infiltra en la gran prision para rescatar a Ace, se reencuentra con ' +
      'Buggy, Mr. 2, Crocodile y Jimbei, y presencia la llegada de Barbanegra.',
    capitulos: 'T13',
  },
  {
    numero: 14,
    titulo: '',
    anio: 2010,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Sesenta capitulos del 18 de julio de 2010 al 25 de septiembre de 2011, en Toei Animation para Fuji TV. ' +
      'Es la guerra de Marineford: la ejecucion de Ace, la llegada de Barbablanca y de Shanks, la muerte de ' +
      'los dos y el reencuentro de Luffy con Jimbei y Rayleigh. La segunda mitad son los capitulos del ' +
      'paradero de la tripulacion y el flashback de Luffy, Ace y Sabo.',
    capitulos: 'T14',
  },
  {
    numero: 15,
    titulo: '',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Sesenta y dos capitulos del 2 de octubre de 2011 al 23 de diciembre de 2012, en Toei Animation para ' +
      'Fuji TV. Es la vuelta de la tripulacion tras dos anos de entrenamiento: el reencuentro en Sabaody, ' +
      'el descenso a la isla de los hombres pez, la lucha contra Hordy Jones y los Nuevos Piratas Hombre ' +
      'Pez, y el arco de Z\'s Ambition que anuncia la pelicula Film Z.',
    capitulos: 'T15',
  },
  {
    numero: 16,
    titulo: '',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Cincuenta capitulos del 6 de enero de 2013 al 12 de enero de 2014, en Toei Animation para Fuji TV. ' +
      'Es la saga de Punk Hazard: la isla envenenada donde Aokiji y Akainu se jugaron el puesto de almirante ' +
      'general, el laboratorio de Caesar Clown, los ninos gigantes y la alianza de Luffy con Trafalgar Law ' +
      'para derrotar a un emperador.',
    capitulos: 'T16',
  },
  {
    numero: 17,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Ciento dieciocho capitulos del 19 de enero de 2014 al 19 de junio de 2016, en Toei Animation para ' +
      'Fuji TV. Es la saga de Dressrosa: el coliseo Corrida, el torneo por la Fruta del Fuego, la familia ' +
      'Donquixote, los juguetes y los enanos de Tontatta, y la batalla final contra Doflamingo con la ' +
      'Cuarta Marcha de Luffy.',
    capitulos: 'T17',
  },
  {
    numero: 18,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Treinta y seis capitulos del 26 de junio de 2016 al 2 de abril de 2017, en Toei Animation para Fuji ' +
      'TV. Empieza con el relleno de la mina de plata, sigue con la llegada a Zou, el reino de los Mink y ' +
      'la alianza con los samurais de Wano, y termina con el relleno de la base marina de Fron antes de ' +
      'partir hacia Totto Land.',
    capitulos: 'T18',
  },
  {
    numero: 19,
    titulo: '',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Ciento nueve capitulos del 9 de abril de 2017 al 30 de junio de 2019, en Toei Animation para Fuji ' +
      'TV. Es la saga de Whole Cake Island: la boda de Sanji con Pudding, la familia Vinsmoke, la huida ' +
      'de Totto Land y el combate contra Katakuri. Al final entran el Levely y los primeros capitulos del ' +
      'mar de Wano.',
    capitulos: 'T19',
  },
  {
    numero: 20,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Ciento noventa y siete capitulos del 7 de julio de 2019 al 17 de diciembre de 2023, en Toei ' +
      'Animation para Fuji TV. Es la saga de Wano: la llegada al pais de los samurais, la alianza con ' +
      'Kin\'emon y los Akazaya, la ejecucion de Oden, la batalla de Onigashima y el combate contra Kaido ' +
      'y Big Mom. Los tres ultimos capitulos abren el arco final con la noticia del nuevo emperador y ' +
      'el sueno de Luffy.',
    capitulos: 'T20',
  },
  {
    numero: 21,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Sesenta y siete capitulos del 7 de enero de 2024 al 28 de diciembre de 2025, en Toei Animation ' +
      'para Fuji TV. Es la saga de Egghead: la isla del futuro, el doctor Vegapunk, el pasado de Kuma y ' +
      'Bonney, el asalto de los Cinco Ancianos y la llegada a Elbaph.',
    capitulos: 'T21',
  },
  {
    numero: 22,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Veinticinco capitulos del 5 de abril al 27 de septiembre de 2026, en Toei Animation para Fuji TV. ' +
      'Es la llegada a Elbaph: el pais de los gigantes, el encuentro con Loki, el reencuentro de Robin con ' +
      'Saul y el ataque de los Caballeros de Dios.',
    capitulos: 'T22',
  },
];
