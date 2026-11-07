// ──────────────────────────────────────────────────────────
// LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────

export const ANIME = {
  // El titulo NO se traduce. "Akame ga Kill!" es el nombre oficial en
  // ingles, el que sale en el logotipo de la serie y el que usan
  // Crunchyroll, Sentai Filmworks, Selecta Vision y la entrada de la
  // Wikipedia en todos los idiomas que la tienen. Traducirlo seria
  // inventar un titulo que nadie escribe.
  titulo: 'Akame ga Kill!',

  // El signo es de exclamacion y no el de apertura, que es como lo
  // escriben la web oficial (akame.tv) y la revista.
  japaneseTitle: 'アカメが斬る！',

  // Base: el parrafo de "Argumento" de la Wikipedia en espanol, que
  // explica bien la premisa (un chico del campo que va a la capital y
  // se topa con la corrupcion) y el giro que lo mete en Night Raid.
  //
  // Se amplia con la ficha de personajes en ingles, que es la que
  // explica que es un Teigu y quienes son Esdeath y los Jaegers: sin
  // eso la sinopsis deja sin nombrar la mitad de lo que pasa.
  //
  // Va partido en trozos con `+` y no en una sola linea porque, escrito
  // de un tirón, lo que se comprueba despues es que no haya quedado una
  // frase partida por la mitad sin querer. Asi cada trozo se puede
  // leer solo.
  //
  // "Teigu" va sin tilde, que es como lo escribe la Wikipedia en
  // espanol. En ingles lo transliteran "Imperial Arms"; aqui se deja
  // la forma corta, que es la que usa el fandom.
  synopsis:
    'El Imperio lleva mil años existiendo y en mil años no ha hecho nada bueno. El campo paga ' +
    'impuestos que no puede pagar y la capital es una ciudad donde el único que no mata a nadie ' +
    'es el único que no tiene permiso para hacerlo. Tatsumi es un chico del campo que va a la ' +
    'capital con dos amigos alistarse en el ejército, ganar dinero rápido y sacar a los suyos de ' +
    'la hambruna. Lo que se encuentra al llegar es una aristocracia que se aburre viendo sufrir ' +
    'a la gente y una policía que cobra por mirar hacia otro lado. Después de ver morir a Sayo y a ' +
    'Ieyasu entra en Night Raid, un grupo de asesinos del Ejército Revolucionario que matan a ' +
    'quien se lo merece y no a quien manda. Cada uno lleva encima un Teigu, un arma capaz de ' +
    'arrasar una ciudad, y cada uno decide usarlo para lo que cree justo. Al otro lado está ' +
    'Esdeath, la general que convirtió el norte en un congelador, y el Emperador, un niño de mano ' +
    'ajena al que el primer ministro usa como figura. Y en medio de los dos bandos, el chico que ' +
    'solo queria ganar dinero acaba siendo el motivo por el que un general del Imperio quiera ' +
    'casarse con él, y esa es la manera más incómoda que tiene esta historia de matar a alguien.',

  anio: 2014,
  estado: 'finished',
  estudio: 'White Fox',

  // Shonen es la demografia del manga (lo dice la ficha de la wiki en
  // espanol) y la accion es media serie, asi que la primera categoria no
  // puede faltar. La segunda esta porque el tono no es de shonen alegre:
  // la mitad de los capitulos son ejecuciones, y la serie existe para
  // contar como se rompe a alguien que cree que matar es el oficio.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  // Los generos de la ficha de la wiki en espanol (accion, aventura,
  // drama, fantasia oscura, romance, tragedia). "Romance" y "Tragedia"
  // se quedan fuera a proposito: hay romance de verdad (el triangulo con
  // Esdeath), pero ponerlo en la sinopsis haria leer la serie como una
  // historia de amor con cuchillos, que no es lo que hace.
  generos: ['Acción', 'Aventura', 'Fantasía Oscura', 'Drama', 'Psicológico', 'Fantasía', 'Terror', 'Thriller', 'Asesinos', 'Shonen', 'Crimen'],
};

export const ANIME_ID = 'akame-ga-kill';

/**
 * Nota de la serie en IMDb: 7,7 sobre unos 40.000 votos.
 *
 * Es el unico anime del catalogo con una sola ficha en IMDb y con nota
 * de serie de verdad, asi que aqui no hay nada que ponderar ni que
 * decidir: se copia lo que pone IMDb. Solo se deja constancia de que la
 * media NO ponderada es un 7,8, porque IMDb muestra las dos y no es lo
 * mismo (ver `comprobar-datos.mjs`, que no acepta dos decimales).
 *
 * El reparto de notas explica por que la serie puntua como puntua: los
 * capitulos 6, 17 y 24 (la muerte de Sheele, la de Chelsea y el final)
 * estan por encima de 8,4, y en cambio el 12 y el 13, que son los de
 * presentacion de Chelsea y de los bichos de Stylish, son los mas
 * bajos, con un 7,1 y un 7,3.
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total, contando la temporada de television y los ONA.
 *
 *   T1  24  capitulos de television
 *   T2  24  capitulos de ONA
 *   --
 *      48
 *
 * ── LOS 24 ONA ────────────────────────────────────────────
 *
 * "AkaKill! Gekijou" (Akame ga Kill! Theater) son 24 cortos de un
 * minuto que C-Station subio a la web oficial de la serie, uno cada
 * semana, entre el 6 de julio y el 14 de diciembre de 2014: uno por
 * capitulo de television y el ultimo el dia antes del final. Son de
 * slapstick, en plan Howl y el perro de Lucia.
 *
 * Van como TEMPORADA 2 y no como capitulos extra de la primera porque
 * tienen ficha propia en MyAnimeList y estudio propio (C-Station, no
 * White Fox), que es el mismo criterio que se uso con los OVA de Tokyo
 * Ghoul.
 *
 * NO tienen nota. En IMDb no son una serie: son capitulos extra de la
 * propia tt3742982, con el prefijo "Theater:" delante, y ningun extra
 * puntua. Sus 24 notas van a 0, que en la wiki se ve como "sin nota" y
 * es exactamente lo que son.
 */
export const EPISODIOS_TOTAL = 48;

/**
 * Donde se emite, de la ficha de la Wikipedia en espanol.
 *
 *   · Crunchyroll  -> la pagina en ingles dice que la emitio en su web
 *                     desde el dia del estreno.
 *   · Netflix      -> la ficha de espanol dice que se licenció para
 *                     Estados Unidos e Hispanoamerica para distribuirla
 *                     por Netflix.
 *   · Selecta Vision-> el doblaje al espanol, como en Tokyo Ghoul.
 *
 * Sentai Filmworks (el doblaje de Americas) y Hanabee (Australia) se
 * quedan fuera porque no son plataformas donde ver la serie.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Selecta Vision', url: 'https://www.selectavision.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
];

// ──────────────────────────────────────────────────────────
// LAS TEMPORADAS
// ──────────────────────────────────────────────────────────

/**
 * Una de television y una de ONA.
 *
 * ── EL FINAL DEL ANIME NO ES EL DEL MANGA ────────────────
 *
 * Esto no lo dice la sinopsis pero va en la ficha de la temporada,
 * porque es lo primero que le pasa a quien viene del manga: los cinco
 * ultimos capitulos del anime (del 20 al 24) son un arco original que
 * no sale en el manga y que tiene un final distinto. En el anime
 * Tatsumi muere y Akame se va; en el manga sobrevive mutilado, se casa
 * con Mine y tiene hijos. Quien lo lea despues notara que el anime
 * "cambia" al final de golpe, y la razon es esa.
 *
 * ── LA NOTA DE CADA TEMPORADA ────────────────────────────
 *
 * La calcula `cargar-anime.mjs` como la media de las notas de sus
 * capitulos. En la T1 salen las 24 notas reales de IMDb. En la T2 no
 * sale ninguna, porque los ONA no las tienen: la media queda a 0, que
 * es "sin nota" y no un error.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'White Fox',
    synopsis:
      'Un chico del campo llega a la capital con dos amigos y se encuentra con una aristocracia ' +
      'que juega con la vida de la gente por aburrimiento. En el primer capitulo descubre que sus ' +
      'dos compañeros han muerto en casa de una heredera y mata a quien los mato. Eso lo mete en ' +
      'Night Raid, un grupo de asesinos del Ejercito Revolucionario, y de ahi en adelante cada ' +
      'capitulo es una muerte distinta: el capitan Ogre, un verdugo al que oyen las voces de sus ' +
      'condenados, las Tres Bestias de Esdeath, un cientifico que se come a sus propios ' +
      'subordinados para subir de nivel. Lo que une a los capitulos no es un villano sino una ' +
      'idea: que matar esta bien hecho o esta mal hecho, y que casi todos piensan que lo saben. ' +
      'Por en medio aparece Esdeath, la mejor general del Imperio, que se quiere casar con el ' +
      'protagonista. Cuando por fin toca atacar la capital, resulta que el chico lleva la razón desde el ' +
      'primer capitulo y que por llevar la razón se va a morir. Y ese es el asunto de la serie: ' +
      'no que mata bien, sino que descubrir que matar es justo le arruina la vida igual.',
    capitulos: 'A1',
  },
  {
    numero: 2,
    titulo: 'ONA',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'C-Station',
    synopsis:
      'Veinticuatro cortos de un minuto que se subian a la web oficial de la serie, uno por semana, ' +
      'justo antes de cada capitulo de television. No tienen nada que ver con la trama: son ' +
      'chistes de situacion con el reparto haciendo de si mismo, del estilo de una season corta de ' +
      'manga. Salen casi todos los de Night Raid y la mitad de los Jaeger, y hay dos que no tienen ' +
      'nada que ver con nadie: el nuevo Teigu de Tatsumi y una entrevista de trabajo. El capitulo ' +
      '24 es una fiesta de despedida que se emite la vispera del final.',
    capitulos: 'A2',
  },
];