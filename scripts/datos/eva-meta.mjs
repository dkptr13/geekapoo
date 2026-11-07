// META - Neon Genesis Evangelion
//
// ── EL TITULO ─────────────────────────────────────────────────────
//
// El titulo en ingles es el que aparece en la ficha de la serie, que es
// como lo escriben la propia produccion y el catalogo de official de
// los derechos. El japones es "Shin Seiki Evangelion" y no lleva el
// "Neon Genesis": ese se lo pusieron en ingles para que se entendiera
// fuera, y en Japon la peli se llama a secas Evangelion.
//
// ── POR QUE HAY SEIS TEMPORADAS ──────────────────────────────────
//
// La serie son 26 capitulos. Lo demas son peliculas, y se guardan como
// temporadas cada una porque cada una se lanzo por separado y muchas
// tienen su propia fecha y su propia nota:
//
//   T1  1995  la serie de television, 26 capitulos
//   T2  1997  la doble funcion de julio, 2 peliculas
//   T3  2007  1.0
//   T4  2009  2.0
//   T5  2012  3.0
//   T6  2021  3.0+1.0
//
// Entre T3 y T6 pasan catorce anos. Meter las cuatro peliculas en una
// sola "temporada" de 2007 ocultaria que la ultima es de 2021, asi que
// van separadas.
//
// T2 si son dos peliculas en una, y eso no es una decision de
// comodidad: "Shi to Shinsei" y "Air / Magokoro wo, Kimi ni" salieron
// el MISMO dia en Japon, como funcion doble y en el mismo doble DVD. Es
// tambien como las agrupa IMDb, en "Death & Rebirth".
//
// ── LO QUE NO SE GUARDA ──────────────────────────────────────────
//
//   · Petit Eva: Evangelion@School (2007, 24 capitulos de 3 minutos).
//     Son capitulos chibi con los mismos personajes. Recapitulaciones,
//     no capitulos de la historia.
//   · Evangelion × Attack ZERO (2020) y el anuncio de KATE (2020). Un
//     minuto cada uno, y son anuncios.
//   · 3.0+1.0 (-46h) (2023). OVA ambientado antes de la invasion, de un
//     personaje que no es ninguno de los pilots. Es una historia aparte
//     con su propio reparto.
//   · La serie nueva que se|anno en 2026 ("Shinsaku Series"), que no
//     tiene fecha ni capitulos.
//
// ── LA ADVERTENCIA DE 3.0 ────────────────────────────────────────
//
// Esta en la ficha de T5 y hay que decirla aqui tambien, porque es el
// fallo que mas se le echa en cara a este anime: 3.0 no continua donde
// termino 2.0. Entre las dos hay ocho anos, y en el medio cai la invasion
// de los Angeles sobre la Tierra. No es un error del catalogo; es que
// la pelicula empieza en otro sitio.

export const ANIME = {
  titulo: 'Neon Genesis Evangelion',

  japaneseTitle: '新世紀エヴァンゲリオン',

  synopsis:
    'El 14 de marzo del 2015 llega un dia en que todos los-adjustados de la Tierra ' +
    'desaparecen de golpe. No mueren: se borran, en un tachon. El mundo no entiende lo ' +
    'que ha pasado y sigue adelante como si no. Dos años después aparece una entidad ' +
    'llamada Adam que ataca la ciudad de Tokio-3, y contra él aparece un robot gigante ' +
    'que un niño de catorce años tiene que pilotar porque es lo unico que hay. A partir de ' +
    'ahi la historia de la serie es la de once de esos niños, y de lo poco que les queda ' +
    'de ser niños. Shinji Ikari es el primero y el que peor lo lleva: no quiere estar ahi, ' +
    'le tiene miedo a la maquina que conduce, y su unica motivacion es no hacer nada. El ' +
    'resto de la serie va de como va averiguando que el enemigo de verdad no esta fuera, ' +
    'y de que el precio de la guerra se lo cobran siempre a los mismos. Los capitulos 18 ' +
    'en adelante dejan de ser una historia de accion para ser otra cosa: pasan a ser sobre ' +
    'la soledad, el odio y lo que uno le hace a la gente que quiere. Los Angeles se derrotan ' +
    'al final, pero no por el camino que nadie esperaba, y lo que queda despues no es un ' +
    'mundo arreglado sino un monton de gente rota que sigue ahi. Despues hay peliculas, y ' +
    'las peliculas cuentan la historia desde el otro lado: lo que paso cuando la guerra se ' +
    'termino de verdad. Una tetralogia que cambia el mundo entero de la serie y que, cuando ' +
    'empezaron a hacerla, ya no era la historia de once ninos y unos robots.',

  anio: 1995,
  estado: 'finished',
  estudio: 'Gainax',

  categorias: [
    'Ciencia Ficción & Cyberpunk',
    'Seinen & Psicológico',
    'Fantasía & Aventura',
  ],

  generos: ['Acción', 'Drama', 'Psicológico', 'Mecha', 'Sobrenatural', 'Misterio', 'Ciencia ficción', 'Coming-of-age', 'Distopía', 'Apocalipsis', 'Monstruos'],
};

export const ANIME_ID = 'neon-genesis-evangelion';

// Media de los 26 capitulos en IMDb (tt0112159): 8,5 con 115.843 votos.
export const RATING_SERIE = 8.5;

/**
 * Capitulos en total.
 *
 *   T1  26  (1995, la serie de television)
 *   T2   2  (1997, la doble funcion de julio)
 *   T3   1  (2007, 1.0)
 *   T4   1  (2009, 2.0)
 *   T5   1  (2012, 3.0)
 *   T6   1  (2021, 3.0+1.0)
 *   --
 *       32
 *
 * Los 32 son cosas que salen en pantalla y que se pueden ver. Las
 * peliculas cuentan como capitulo porque son peliculas y la ficha las
 * guarda asi, igual que Kaguya guarda la suya.
 */
export const EPISODIOS_TOTAL = 32;

/**
 * Donde se emite.
 *
 *   · Netflix     -> el catalogo de Espana lo tiene; es la unica via.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1995,
    estado: 'Finalizado',
    estudio: 'Gainax',
    synopsis:
      'Un dia todos los humanos desaparecen de la Tierra y a los quince años vuelven como si ' +
      'nada. Tres años después aparece Adam y con él la guerra. Lo que hay debajo de la ' +
      'guerra es lo que importa: Shinji no quiere pelear, su padre lo utiliza, su madre está ' +
      'más perdida que él, y todos los demás tienen su propia versión de por qué están ahí. ' +
      'Los doce primeros capítulos son la historia del grupo del colegio y de quién se ' +
      'apega a quién. A partir del decimotercero se acaba esa estructura: Shinji ve cosas que ' +
      'no debería ver, se pelea con Misato, y en el episodio decimoctavo Misato muere y vuelve ' +
      'a aparecer con un traje de rescate puesto, sin que nadie diga por qué. Los últimos ' +
      'episodios son una caída: la red de ADN, la madre de Shinji, la '+
      'tardía en la que Shinji ahoga a la persona que más quería en el mundo. Acaba pidiendo un ' +
      'tren.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Death and Rebirth',
    anio: 1997,
    estado: 'Finalizado',
    estudio: 'Gainax',
    synopsis:
      'La doble funcion de julio de 1997, que hace lo que el final de la serie no se atrevió a ' +
      'hacer. Una representación del mundo entero en el que todos los pilotos han ' +
      'Eva, Shinji al despertar en un Dylan minúsculo que parece suyo, y una tercera ' +
      'presencia dentro del Unit-01 que se parece a él y que los dos acaban ' +
      'la segunda pelicula, el ambiente pasa a ser un lugar sin personas, con un ucero que ' +
      'recita un mantra y con Shinji, Asuka y Rei que aceptan cada uno lo que les toca. Es el ' +
      'final real de la historia original y de la NERV como institución.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '1.0 You Are (Not) Alone',
    anio: 2007,
    estado: 'Finalizado',
    estudio: 'Khara',
    synopsis:
      'Primera pelicula del Rebuild, catorce años después. La NERV ya no es la NERV: hay una ' +
      'clase de niños que llevan su vida entera sin haber oído hablar de Ángeles, y el mundo ha ' +
      'seguido sin ellos. Shinji llega a la ciudad y todo está preparado para él, incluidos ' +
      'dos de sus antiguos compañeros de clase. La pelicula tiene el tono de un reencuentro y ' +
      'se siente como uno, hasta que deja de serlo.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: '2.0 You Can (Not) Advance',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Khara',
    synopsis:
      'Segunda pelicula del Rebuild. Mari está en el Number Six y Shinji sigue en el Number ' +
      'Uno esperando a Rei. Todo lo que le preguntan en su casa tiene una respuesta telefónica ' +
      'al otro lado del mundo, y Shinji la usa para todo menos para lo que debería. Asuka ' +
      'vuelve de donde ha estado distinta, y Ritsuko tiene que decidir si miente o no.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: '3.0 You Can (Not) Redo',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Khara',
    synopsis:
      'Tercera pelicula del Rebuild, y la que peor ha salido en IMDb. Ojo: NO continua donde ' +
      'terminó la anterior. Entre 2.0 y 3.0 hay ocho años, y en el medio cayeron los Ángeles ' +
      'sobre la Tierra y con ellos todo lo que se sabía de la serie. Cuenta cómo se pierde, y ' +
      'después cómo se empieza otra vez. Quien la vea sin saber lo de los ocho años va a pensar ' +
      'que algo está mal en los datos, y no es así: es la pelicula.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: '3.0+1.0 Thrice Upon a Time',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Khara',
    synopsis:
      'Cuarta y ultima pelicula del Rebuild. Son dos peliculas en una, que en Japón salieron ' +
      'juntas como doble función. La vuelta de Shinji, a los catorce años, a un mundo que se le ' +
      'parece mucho al suyo pero en el que no ha pasado nada de lo que pasó. La pelicula trata ' +
      'esa posibilidad con una seriedad casi cómica, y termina donde tiene que terminar: con ' +
      'una pregunta al otro lado de la pantalla.',
    capitulos: 'T6',
  },
];