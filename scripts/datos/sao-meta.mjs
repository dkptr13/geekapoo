// META - Sword Art Online (2012)
//
// TVDB 259640 (ソードアート・オンライン, 2012, Ended) tiene 25 + 24 + 24 +
// 23 episodios en las temporadas 1, 2, 3 y 4, que son la serie, la
// segunda, Alicization y War of Underworld. En la temporada 0 deja los
// "Sword Art Offline" y demás cortitos, que no entran, y las tres
// películas, que si.
// Gun Gale Online va aparte: TVDB 335815 (12 + 12 episodios en 2018 y
// 2024).
// AniList 11757 (serie), 100182 (Alicization), 100183 (Gun Gale Online).
// IMDb tt2250192: 7,5 con unos 65.000 votos; tt7978710: 6,8 con unos
// 3.400 votos.
//
// Los títulos en castellano y las fechas salen de los anexos de
// temporada de la Wikipedia en español; los títulos japoneses, de TVDB;
// las notas, de IMDb. Los títulos de Gun Gale Online son traduccion
// propia de los títulos oficiales en inglés. Los resumenes son propios,
// a partir del resumen en inglés de cada episodio.

export const ANIME = {
  titulo: 'Sword Art Online',

  japaneseTitle: 'ソードアート・オンライン',

  synopsis:
    'En noviembre de 2022 se celebra el estreno de un reality show con miles de jugadores ' +
    'conectados a un visor de realidad virtual. Un chico llamado Kirito, que lleva anos dentro ' +
    'de los juegos, se encuentra con una colega, Asuna, y entre los dos aprovechan el ultimo ' +
    'piso de la mazmorra de Aincrad antes de que el primer VRMMORPG del mundo se cierre. Pero el ' +
    'día del estreno, los diez mil jugadores descubren que no pueden salir: mientras su vida ' +
    'siga atada a la del juego, moriran en el. Kirito y Asuna tendrán que subir los cien pisos ' +
    'de la mazmorra para liberarlos, y a partir de ahi vendran las guerras, los juegos de muerte ' +
    'y los otros mundos de la realidad virtual.',

  anio: 2012,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  categorias: ['Shonen & Acción', 'Shojo & Romance'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Romance', 'Ciencia ficción', 'Isekai', 'Juego'],
};

export const ANIME_ID = 'sword-art-online';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles, el romanizado, el japones con otro criterio y
// los sinónimos que de verdad se usan. Los escribe el agente que anade
// el anime, a mano, y se guardan en "alternativeTitles" del documento de
// Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// Las siglas son de uso corriente.
export const ALIASES = [
  'SAO',
  'Sword Art Online (2012)',
];

/**
 * Nota de la serie en IMDb (tt2250192): 7,5 con unos 65.000 votos.
 */
export const RATING_SERIE = 7.5;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  25  (julio - diciembre de 2012)
 *   T2  24  (julio - diciembre de 2014)
 *   T3  24  (octubre de 2018 - marzo de 2019, Alicization)
 *   T4  23  (octubre de 2019 - septiembre de 2020, War of Underworld)
 *   T5  12  (abril - julio de 2018, Gun Gale Online)
 *   T6  12  (octubre - diciembre de 2024, Gun Gale Online II)
 *   T7   1  (diciembre de 2013, especial Extra Edition)
 *   T8   1  (febrero de 2017, película Ordinal Scale)
 *   T9   1  (octubre de 2021, película Progressive)
 *   T10  1  (octubre de 2022, película Progressive)
 *   T11  1  (julio de 2026, película Unanswered//butterfly)
 *   --
 *       125
 */
export const EPISODIOS_TOTAL = 125;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie y el especial Extra Edition.
 *   · Amazon Prime Video -> la serie, con doblaje en español.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  {
    name: 'Amazon Prime Video',
    url: 'https://www.primevideo.com',
    badgeColor: '#00a8e1',
  },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Veinticinco episodios emitidos del 7 de julio al 22 de diciembre de 2012. Kirito y ' +
      'Asuna se conocen en la mazmorra de Aincrad y descubren que los diez mil jugadores están ' +
      'atrapados en el juego. El arco cubre los pisos de Aincrad y el bosque de Fairy Dance, y ' +
      'acaba con el duelo contra Kayaba y el comienzo de la huida de los sobrevivientes.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Extra Edition',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Especial de fin de ano estrenado el 31 de diciembre de 2013. Repasa la primera temporada ' +
      'de Sword Art Online y añade escenas nuevas con Asuna y Leafa comentando la aventura con ' +
      'Kirito como narrador. En los creditos finales se anuncia la segunda temporada.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Sword Art Online II',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Veinticuatro episodios del 5 de julio al 20 de diciembre de 2014. El juego de-online ' +
      'Gun Gale Online atrae a Kirito, donde lo espera la francotiradora Sinon y el asesino ' +
      'Death Gun. Los arcos de Phantom Bullet, Calibur y Mother\'s Rosario llevan a la saga hasta ' +
      'el piso 74 y el comienzo de la guerra de GGO.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Ordinal Scale',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Película estrenada el 18 de febrero de 2017, como parte del festival de anime de Japón. ' +
      'Kirito y Asuna se encuentran en un nuevo juego de realidad aumentada con el que una ' +
      'empresa prueba su prototipo, mientras la inteligencia artificial del juego empieza a ' +
      'moverse sola y a amenazar el mundo real.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Gun Gale Online',
    anio: 2018,
    estado: 'Finalizado',
    estudio: '3Hz',
    synopsis:
      'Doce episodios del 8 de abril al 1 de julio de 2018, en el juego de disparos en primera ' +
      'persona Gun Gale Online. La artista marcial LLENN llega desde la vida real y se convierte ' +
      'en la estrella del equipo SHINC, con Pitohui como referencia y un enemigo con muy buena ' +
      'punteria detras.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Alicization',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Veinticuatro episodios del 7 de octubre de 2018 al 31 de marzo de 2019. Kirito aparece en ' +
      'Underworld, un mundo de realidad virtual que guarda los recuerdos de la gente, donde lo ' +
      'espera una ciudad construida con la memoria de las hojas. El arco pasa por la academia de ' +
      'esgrima, la Catedral Central y el duelo con Bercouli.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'War of Underworld',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Veintitres episodios del 13 de octubre de 2019 al 20 de septiembre de 2020. El ' +
      'Territorio Oscuro declara la guerra al Imperio Humano, Kirito despierta de su coma y ' +
      'Asuna baja al inframundo con el resto de sus amigos. El arco cierra con el asalto a la ' +
      'Tortuga Oceanica y la creacion de los dos mil quinientos mundos nuevos.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'Progressive: Aria de una noche sin estrellas',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Película estrenada el 30 de octubre de 2021, que adapta el primer volumen de la novela ' +
      'Progressive. Cuenta los primeros compases de Kirito y Argo camino del primer piso de ' +
      'Aincrad, donde un jefe terrible les espera, con una Asuna que todavia no conoce a nadie ' +
      'del grupo.',
    capitulos: 'T8',
  },
  {
    numero: 9,
    titulo: 'Progressive: Scherzo de la noche oscura',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Película estrenada el 22 de octubre de 2022, que adapta el cuarto volumen de la novela ' +
      'Progressive. Kirito y Argo siguen limpiando pisos de Aincrad con la ayuda de una Asuna que ' +
      'aun no sabe quien es el, hasta que el arco llega a su punto más oscuro con la salud de ' +
      'Argo en juego.',
    capitulos: 'T9',
  },
  {
    numero: 10,
    titulo: 'Gun Gale Online II',
    anio: 2024,
    estado: 'Finalizado',
    estudio: '3Hz',
    synopsis:
      'Doce episodios del 5 de octubre al 21 de diciembre de 2024. El Tercer Squad Jam se juega ' +
      'en una isla que se hunde con el agua al alza, con una regla especial que elige un ' +
      'traidor en cada equipo. LLENN y los suyos tienen que sobrevivir a la alianza, al cambio ' +
      'de bando y al duelo final.',
    capitulos: 'T10',
  },
  {
    numero: 11,
    titulo: 'Unanswered//butterfly',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Polygon Pictures',
    synopsis:
      'Película estrenada el 10 de julio de 2026, como promocion de la edicion limitada del ' +
      'juego "Sword Art Online: Echoes of Aincrad". Emirun y Rex, dos jugadores que ya se ' +
      'conocian fuera del juego, se reencuentran en Aincrad y su grupo de exploracion es ' +
      'destruido por el Espadachin Negro, un asesino de jugadores que nadie sabe quien es.',
    capitulos: 'T11',
  },
];
