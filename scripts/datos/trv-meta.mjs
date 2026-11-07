// META - Tokyo Revengers
//
// ── EL TITULO ─────────────────────────────────────────────────────
//
// "Tokyo Revengers" es el nombre en ingles, que es como lo/licencia la
// editorial y como aparece en la web oficial y en las dos wikipedia.
// El japones lleva el caracter 卍 entre las dos palabras de "Tokyo" y
// "Revengers", que es el símbolo de la pandilla.
//
// ── LO QUE ES ESTA SERIE ─────────────────────────────────────────
//
// Un chico insignificante de veintiseis años se tira a las vias del tren
// y despierta en 2005. Puede volver al pasado, pero solo al morir, y solo
// al instante exacto. La gracia esta en que no es un poder de combate: es
// un poder de informacion. Takemichi no pelea mejor que nadie, y loses
// justamente por eso. Lo que sabe es cuando va a pasar cada cosa, y esa
// es la unica ventaja que tiene.
//
// ── EL PLOT TWIST ─────────────────────────────────────────────────
//
// El arco de Tenjiku (la temporada 3) mete a Kazutora Hanemiya dentro del
// cuerpo de Takemichi. Cuando Andy lo destroza, el que sobrevive no es
// Takemichi sino Kazutora, cuya consciencia aguanta porque es la que
// esta ahi. Toda la serie esta construida para llegar a esa escena.
//
// ── POR QUE NO SE GUARDAN LOS CORTOMETRAJES ──────────────────────
//
// Hay dos series de capitulos muy cortos que salen con la principal: "Tokyo
// Revengers: Chibi Reve" (24 capitulos de dos minutos, 2021) y "Douwa
// Revengers" (18 de tres, 2024). Son recapitulaciones en formato chibi, no
// capitulos de la historia, y no van en `trv-t1.mjs` ni en ningun otro. Van
// en su propia entrada de AniList, que es donde estan si alguna vez hacen
// falta.

export const ANIME = {
  titulo: 'Tokyo Revengers',

  japaneseTitle: '東京卍リベンジャーズ',

  synopsis:
    'Takemichi Hanagaki tiene veintiseis años, no estudio, no trabaja y va perdona ' +
    'todo lo que le pasa con cara de no estar alli. Un dia ve en las noticias que su ' +
    'antigua novia, Hinata, y su hermano han muerto por una rivalidad entre pandillas, ' +
    'y sin poder mas se tira a las vías del tren. Al despertar esta en 2005, el dia en ' +
    'que conhecio a Hinata por primera vez. Y lo que viene despues es la unica noticia ' +
    'buena que tiene: cuando muere, vuelve al pasado, en ese instante exacto. Asi que ' +
    'tiene una idea: volver una y otra vez, colocarse al lado de todos los que van a ' +
    'morir, y lo unico que sabe hacer es eso: evitar un suicidio. Pero ' +
    'volver al pasado no es viajar a un sitio, es reescribir la vida de gente que ya ' +
    'ha vivido, y cada vez que cambia algo, alguien pierde la vida que tenia. ' +
    'La historia que sigue es la de un hombre que sabe exactamente como va a morir todo ' +
    'el mundo y que, aun asi, no puede evitarlo. Takemichi no es un heroe: es el mas ' +
    'normal de todos, y por eso el unico al que el destino no se le da bien. Cada ' +
    'regreso al pasado le cuesta un poco mas, y hay una pelea que lleva años dandole ' +
    'vueltas sin que nadie sepa todavia quien la gana.',

  anio: 2021,
  estado: 'finished',
  estudio: 'Liden Films',

  categorias: ['Shonen & Acción', 'Thriller & Misterio'],

  generos: ['Acción', 'Drama', 'Sobrenatural', 'Crimen', 'Romance', 'Venganza'],
};

/**
 * Este anime NO tiene version en japones de los titulos de sus capitulos.
 *
 * Los subtitulos oficiales estan escritos en ingles y se emiten asi en
 * Japon: los veinticuatro de la primera temporada empiezan todos por
 * "Re-" (Reborn, Resist, Resolve, Return, Releap, Regret, Revive,
 * Rechange, Revolt, Rerise, Respect, Revenge) y los de las siguientes
 * son frases hechas ("One for All", "Brave heart", "Meet his fate"). No
 * hay titulo japones ni dentro del pais ni fuera.
 *
 * Asi que el campo `titulo japones` de cada capitulo lleva el subtitulo
 * oficial tal cual, que es como lo lista la tabla de capitulos de la
 * wikipedia en japones, y esta bandera le dice a `comprobar-datos.mjs` que
 * no exija kanji ni kana ahi.
 *
 * El resto de los animes del catalogo no la tienen puesta, y ahi si se
 * comprueba: un "titulo japones" que no es japones no sirve de nada.
 */
export const TITULOS_EN_INGLES = true;

/**
 * El id del documento. Es el slug, y a diferencia de los animes que se
 * suben por el panel, este lo lleva un fichero de datos: `cargar-anime.mjs`
 * lo crea a partir de `ANIME_ID` y de los nombres de los personajes.
 */
export const ANIME_ID = 'tokyo-revengers';

// Media de los 51 capitulos emitidos en IMDb (tt13196080): 7,7 con 34.945
// votos. No es la media de la serie entera, sino la de los capitulos que
// tienen capitulo, y es lo unico comparable con las notas por capitulo que
// se guardan.
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total.
 *
 *   T1  24  capitulos  (abril-septiembre de 2021)
 *   T2  13  capitulos  (enero-abril de 2023)
 *   T3  13  capitulos  (octubre-diciembre de 2023)
 *   T4   1  capitulo   (octubre de 2026, en emision)
 *   --
 *       51
 *
 * Las partes van por trece, asi que T4 deberia acabar en trece. Lo que hay
 * aqui es lo emitido: el 3 de octubre de 2026 solo ha salido el primero.
 *
 * Lo de "en emision" no es una excusa para dejarlo a medias sin querer:
 * AniList lo da como RELEASING con 13 capitulos previstos.
 */
export const EPISODIOS_TOTAL = 51;

/**
 * Donde se emite.
 *
 * La serie va por Japon, television y streaming a la vez:
 *
 *   · Crunchyroll -> fuera de Asia, desde el dia del estreno.
 *   · Disney+     -> la licencia de Japon. No se pone: no llega a Espana.
 *   · Netflix     -> fuera de Japon, desde el dia del estreno.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Disney+', url: 'https://www.disneyplus.com/es', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Liden Films',
    synopsis:
      'Takemichi se tira a las vias del tren y despierta en 2005, el dia en que conoce a ' +
      'Hinata. Lo descubre todo por television: ella y su hermano han muerto por una ' +
      'rivalidad de pandillas que el ni sabe que existe. Y entonces pasa lo imposible: ' +
      'despierta otra vez en el mismo dia. Takemichi entiende que el viaje al pasado es ' +
      'real, pero tambien que solo funciona cuando el muere y solo hasta el instante ' +
      'exacto. Su plan es simple y terrible: colocarse al lado de todos los que van a ' +
      'morir para que no mueran. Empieza por sus compañeros del colegio, que sin saberlo ' +
      'son los miembros de los Tokyo Manji Gang, y por entrar en su segunda division. ' +
      'Ahi conoce a los que seran su familia durante unos meses, entre ellos a los ' +
      'hermanos Shiba, y se da cuenta de que la persona que quiere proteger es la misma ' +
      'que va a perder. Lo que sale de aqui no es un heroe acabada: es alguien que ' +
      'pierde a la gente aun sabiendo como va a morir. Y el arco de Arashi, el del final, ' +
      'rompe la cosa entera desde dentro.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Seiya Kessen-hen',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Liden Films',
    synopsis:
      'La guerra entre los Tokyo Manji Gang y los Rengo, que habia empezado el arco de ' +
      'Arashi, llega a su punto mas alto. En medio estan Baji, que esta infiltrado en el ' +
      'bando contrario y lleva tiempo sin poder decir nada, y Hanma, que ha decidido que ' +
      'la unica manera de llegar hasta donde quiere es matar. Los Shiba y los gemelos ' +
      'Kawata acaban enfrentandose, y Souya salva a Nahoya pagando con su vida. Takemichi ' +
      'vuelve a usar el viaje al pasado, cada vez con menos margen, y descubre que puede ' +
      'llegar hasta donde ya no queda otra: volver a ver a Hinata y no contarle nada, ' +
      'porque el Hinata que no sabe es el unico que puede salvar. Al final del arco, ' +
      'Seiya busca a Takemichi a traves de Hinata, Baji lo sabe y se entrega, y Takemichi ' +
      'llega demasiado tarde a la herida. La temporada se cierra con el duelo entre los ' +
      'dos hermanos empezando.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Tenjiku-hen',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Liden Films',
    synopsis:
      'Aparecen los Tenjiku, y con ellos Andy, el luchador al que no se le conoce una ' +
      'sola derrota. No son una pandilla mas: vienen de otra linea temporal, y los dos ' +
      'bandos que llevaban una temporada peleando se unen contra ellos. Los dos bandos, ' +
      'que entre ellos habian matado a medio grupo, van ahora hombro con hombro. Y entonces Andy destroza a ' +
      'Takemichi de una forma que no deberia sobrevivir. La serie da la vuelta aqui: no ' +
      'es Takemichi el que aguanta dentro del cuerpo de Kazutora Hanemiya, al contrario. ' +
      'La consciencia que resiste es la de Kazutora, y Takemichi lo ve desde fuera sin ' +
      'poder hacer nada. Ese es el capitulo peor puntuado de la temporada y el que define ' +
      'la serie entera. Lo que sigue es un duelo contra Andy que no se resuelve y un final ' +
      'oscuro: Andy se lleva a Hinata y el grupo se queda sin nada con que negociar.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Santen Sensou-hen',
    anio: 2026,
    estado: 'En emisión',
    estudio: 'Liden Films',
    synopsis:
      'Cuarta parte, la que sigue al arco de Tenjiku. Empezo el 3 de octubre de 2026 y va ' +
      'por el primer capitulo, de los trece que tiene la parte. Los grupos vuelven a ' +
      'romperse y la guerra sigue abierta. Va con el resumen mas corto de todos a ' +
      'proposito: el arco acaba de empezar y lo unico que se sabe con seguridad es que es ' +
      'la continuacion de donde dejo Tenjiku. Cualquier detalle mas seria suponerlo.',
    capitulos: 'T4',
  },
];