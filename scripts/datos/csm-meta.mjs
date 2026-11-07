// META - Chainsaw Man

export const ANIME = {
  // El titulo va en ingles porque es como lo escribe la licencia
  // (Crunchyroll, Disney+) y como aparece en las dos wikipedia. En
  // castellano se le dice "Chainsaw Man" igual, y el manga se llama
  // asi tambien: la traduccion del titulo japones seria "Hombre
  // Motosierra", que no es el nombre de nadie.
  titulo: 'Chainsaw Man',

  japaneseTitle: 'チェンソーマン',

  synopsis:
    'Denji es un adolescente que vive con lo que le deja el peso de su padre, una deuda que se ha repaidido a golpes y que no sabe como saldar. ' +
    'Su unico recurso es Pochita, un demonio con forma de perro que muerde con una motosierra en la cabeza, y con el que cobra por cazar demonios para los yakuza. ' +
    'La vida le sale mas cara de lo que entra: la mitad de lo que gana se lo lleva la yakuza, y la otra mitad se la gasta en comida. ' +
    'Lo que quiere de la vida es algo tan pequeno que duele decirlo: comer bien, vivir bajo un techo y que una chica lo quiera a el. ' +
    'En mitad de una de esas cacerias lo traicionan y lo matan, y entonces Pochita hace un contrato con el y Denji vuelve con su cuerpo y el alma de un demonio dentro. ' +
    'Asi acaba en la cuarta division del Departamento de Seguridad Publica, la cuarta division que hace limpieza de demonios en Japon, dirigida por una mujer llamada Makima que le promete todo lo que acaba de decir que quiere. ' +
    'Ahi conoce a Himeno, que lleva siete años haciendo un trabajo que no le gusta, a Aki, que es serio y tiene una deuda propia que callar, y a Power, que es un demonio de sangre con muy mal genio y muy buena memoria para odiar a alguien. ' +
    'La diferencia entre los tres es que Denji todavia cree que puede ganar. Los otros tres ya saben que esto se acaba mal, y por eso se pelean por el que se niega a verlo. ' +
     'La serie no cuenta como empieza algo, sino como se deshace: doce capitulos en los que Makima va desnudando el mundo por debajo de los pies de todos, un demonio al que se le puede matar con un pacto y no con un cuchillo, y un arbol de demonios que se llena con el numero de muertes que le cuelgan encima. ' +
     'Y la verdad sobre lo que es Chainsaw Man, que solo unos pocos saben al final y que explica por que Denji no era el que mandaba.',

  anio: 2022,
  estado: 'finished',
  estudio: 'MAPPA',

  // Terror y accion con cariz de fantasia oscura. No es un seinen de
  // misterio como los de la lista: aqui lo que da miedo es un telefono
  // que suena, y el telefono va a sonar todo el rato.
  categorias: ['Acción & Aventura'],

  generos: ['Acción', 'Aventura', 'Terror', 'Sobrenatural', 'Drama', 'Demonios', 'Tragedia'],
};

export const ANIME_ID = 'chainsaw-man';

/**
 * Media de los doce capitulos de television, con 91.089 votos.
 *
 * La media SIMPLE de los doce es 8,5 tambien, asi que aqui no
 * diferencia. Se deja la ponderada porque es la que tiene sentido
 * cuando los capitulos no tienen los mismos votos: el capitulo 8
 * ("Gunfire") tiene 10.116 y el 11 ("Mission Start") 5.873, y promediar
 * sin mas trataria igual un capitulo que casi nadie ha visto.
 *
 * La pelicula va aparte, como temporada 2, con su propia nota de 8,3
 * con 70.433 votos. No se mezcla con la de la serie: una pelicula no
 * es un capitulo mas, y IMDb las puntua por separado.
 */
export const RATING_SERIE = 8.5;

/**
 * Capitulos en total.
 *
 *   T1  12  capitulos  (octubre - diciembre de 2022)
 *   T2   1  la pelicula del arco Reze (septiembre de 2025)
 *   --
 *       13
 *
 * ── POR QUE T2 ES LA PELICULA ─────────────────────────────────────
 *
 * Porque el arco Reze no es una temporada: es "Chainsaw Man: The Movie:
 * Reze Arc, de 100 minutos, que salio en cines el 19 de septiembre de
  * 2025. No tiene capitulos numerados ni una lista de capitulos. AniList
 * lo tiene como MOVIE y TVDB lo esconde en "Specials".
 *
 * Va como T2 y no como capitulo 13 de la T1, que es lo que hizo el
 * proyecto con la OVA de Toradora: mezclarla haria que la serie de
 * television pareciera de trece capitulos, y no lo fue. Tiene fecha
 * propia, nota propia y una produccion aparte.
 *
 * ── LA TEMPORADA 3 QUE NO ESTA ───────────────────────────────────
 *
 * El 21 de diciembre de 2025, en el Jump Festa, MAPPA anuncio que esta
 * en produccion "Chainsaw Man: Assassins Arc" (チェンソーマン 刺客篇),
 * la continuacion del arco Reze. En septiembre de 2026 seffentaron
  * imagenes y un trailer de Advance trailer.
 *
 * No va aqui porque no tiene fecha ni capitulos, y una temporada sin
 * capitulos se queda vacia en la wiki: es lo que dice el mismo
 * `cargar-anime.mjs` al calcular los capitulos desde los ficheros.
 */
export const EPISODIOS_TOTAL = 13;
/**
 * Donde se emite.
 *
 * ── LAS DOS QUE QUEDAN, Y POR QUE ─────────────────────────────
 *
 * Crunchyroll tiene la licencia del anime entero fuera de Asia, asi
 * que para alguien que llega desde Espana es la via normal. Y
 * Crunchyroll opera en Espana: la ficha del anime ofrece audio y
 * subtitulos en Espanol (Espana).
 *
 * Netflix lo tiene en algunos paises, pero no aparece en el catalogo
 * de Espana, asi que no se pone.
 *
 * ── LO QUE SE HA QUITADO Y POR QUE ─────────────────────────────
 *
 * Amazon Prime Video, Disney+ y Hulu estaban en la lista. Las tres
 * son de donde se emitio en Japon: Prime Video en Japon fue el
 * primero del mundo, el mismo dia del estreno, y las otras dos
 * repartieron el reparto por el resto del mundo.
 *
 * Ponerlas era un error doble. El sitio es en espanol, y el enlace a
 * amazon.co.jp lleva a la tienda japonesa: mismo servicio, otro
 * dominio, y una pagina que en Espana no tiene estos titulos.
 *
 * Lo mismo se ha corregido en Tokyo Revengers, donde Disney+ era la
 * licencia de Japon, y en Witch Hat Atelier.
 *
 * ── LA PELICULA ────────────────────────────────────────────────
 *
 * La pelicula del arco Reze esta en Crunchyroll desde el 30 de abril
 * de 2026, con doblaje y subtitulos en Espanol de Espana. No hace
 * falta una linea aparte: la lista es de la serie, y la pelicula va
 * con ella.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
       'Doce capitulos que empiezan con un chico metido en una deuda y acaban ' +
       'con un hombre mirando un arbol de cuchillas. ' +
       'MAPPA monto la serie enteramente con su dinero, sin el comite de ' +
       'produccion de otras anime, y eso se nota: la musica de Kensuke Ushio, ' +
       'el color azul frio de casi todas las escenas, y una violencia que no ' +
       'disimula. ' +
       'El primer capitulo es casi todo campo: un chico, su perro con ' +
       'motosierra, y una deuda. A partir del tercero Denji ya esta en el ' +
       'Departamento de Seguridad Publica, con Himeno, Aki y Power, y Makima ' +
       'repartiendo destino desde una oficina con las paredes blancas. ' +
       'Aki mira un expediente porque no quiere que se lo asignen; Power ' +
       'escupe donde sea y aun asi se aguanta porque no tiene otro sitio. ' +
       'Los demonios van cayendo por su cuenta: primero el Angel, que tiene ' +
       'alas y no puede tocar el suelo, y detras el Espadachin, que es el que ' +
       'se lleva por delante a media oficina. ' +
       'El capitulo 8 es el que nadie se salta: el Diablo de la Fusil se le ' +
       'cuela a Power y no hay manera de pararle los pies. Lo que ocurre ' +
       'despues es lo que hace que todo el mundo hable de la serie. ' +
       'Aki, despues, no puede dejar de mirar lo que le queda de sus ' +
       'companeros, y Power aprende a la vez lo que es un duelo y lo que es ' +
       'no tener a nadie a quien volver. ' +
       'El final es una trampa: Denji recibe la noticia de que en Kioto hay ' +
       'un demonio esperando, y lo que pasa despues lo deja solo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Reze-hen',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
       'Cien minutos de pelicula, y no una temporada corta: la historia de ' +
       'Reze, que aparece por primera vez en el capitulo 39 del manga, justo ' +
       'por donde se quedo la serie. ' +
       'Reze trabaja en un cafe del barrio y no tiene nada raro, y Denji, que ' +
       'solo sabe estar con una chica cuando tiene algo que contar, cae ' +
       'rendido en dos semanas. ' +
       'Lo que no sabe, y quien si lo sabe es quien la manda, es que Reze es ' +
       'el Diablo de la Bomba, y que la enviaron a Japon a casarse con el ' +
       'objetivo mas codicioso del mundo: la tierra de Chainsaw Man. ' +
       'Es la mejor parte del manga puesta en pantalla y tambien la mas cruel: ' +
       'monta un colegio entero y luego lo borra, y lo borra del todo. ' +
       'Cambio el director, que ya no es Ryū Nakayama sino Tatsuya Yoshihara, ' +
       'y la pelicula canta distinto: la banda sonora de Ushio deja la masa ' +
       'de la serie para un momento, y las canciones van de "IRIS OUT" de ' +
       'Kenshi Yonezu a "JANE DOE" con Utada. ' +

       'estreno en el cine espanol el 28 de junio de 2026, con el premio de ' +
       'mejor direccion de los Atom Awards de 2026. Costo 10.830 millones de ' +
       'yenes y salio con la mejor critica del ano en Rotten Tomatoes.',
    capitulos: 'T2',
  },
];
