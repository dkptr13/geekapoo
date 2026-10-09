// META - Saekano: How to Raise a Boring Girlfriend
//
// ── EL TITULO ─────────────────────────────────────────────────────
//
// En el catalogo va como "Saekano: How to Raise a Boring Girlfriend",
// que es el titulo que usan las fichas de fuera de Japon. El japones es
// 冴えない彼女の育てかた, sin dos puntos ni nada, tal cual.
//
// "Saekano" es la abreviacion de "冴えない" a secas: son las cuatro
// sílabas del principio. La frase entera es "como criar una heroine
// apagada", y el simbolo ♭ del segundo titulo viene aqui.
//
// ── DE DONDE VIENEN LAS NOTAS ─────────────────────────────────────
//
// IMDb:
//
//   tt3612626   las dos temporadas de television
//               6,9 con 2.187 votos
//   tt11203468  la pelicula
//               7,7 con   890 votos
//
// La media de los tres epigrafes da 6,9, y 6,9 es lo que se queda la
// serie, que es donde esta su nota real: la pelicula puntua mas alto
// pero pesa menos y no debe subir la media del conjunto.
//
// ── LAS TRES TEMPORADAS ───────────────────────────────────────────
//
//   T1  2015  13 capitulos   la serie
//   T2  2017  12 capitulos   el simbolo del bemol
//   T3  2019  1 capitulo     la pelicula
//
// ── LA NUMERACION DE CAPITULOS ────────────────────────────────────
//
// La oficial empieza en cero: 第0話, 第1話, ... El catalogo va del 1 en
// adelante porque el validador (`comprobar-datos.mjs`) exige que los
// capitulos enteros vayan del 1 al ultimo sin huecos y un 0 no lo
// cumple. El numero oficial va anotado en la cabecera de cada fila de
// los tres ficheros de capitulos.
//
// ── LA SEGUNDA TEMPORADA ──────────────────────────────────────────
//
// El titulo japones lleva un bemol, ♭. No es decoracion: en musica es
// el signo que baja un tono medio, y la serie usa la palabra de otra
// forma a lo largo de toda la trama. La segunda temporada es
// literalmente el capitulo en el que le bajan el tono a la propia serie
// para poder discutirla.
//
// En ingles sale como "Flat", que es el nombre del signo. Por eso se
// conoce como la "Flat".
//
// ── LO QUE NO SE GUARDA ──────────────────────────────────────────
//
// Las dos novelas visuales, que son el original, y la adaptacion a
// manga. AniList las tiene y no entran: el catalogo es de anime.
//
// ── LA SERIE ──────────────────────────────────────────────────────
//
// Tomoya Aki es un chico normal que hace una cosa normal: le gusta el
// computer y se le da bien. Su clase entera es de chicas guapas y el
// problema no es que no pueda hablar con ellas, es que no sabe de
// nada que hablar.
// Es el unico reparto del catalogo en el que el problema de la pareja no
// es de experiencia sino de lo contrario: la chica que le interesa de
// verdad es la unica que no encaja en el reparto, y las que encajan son
// las que compiten entre ellas.
//
// Y la segunda temporada lo entiende y lo arregla. La primera gastaba su
// presupuesto en capitulos de citas; la segunda gasta el mismo presupuesto
// en decidir.
// presupuesto en decidir.

export const ANIME = {
  titulo: 'Saekano: How to Raise a Boring Girlfriend',

  japaneseTitle: '冴えない彼女の育てかた',

  synopsis:
    'Tomoya Aki es un chico de segundo de instituto al que se le da bien una sola cosa, el computer, y cuyo ' +
    'problema no es que no sepa hablar con las chicas sino que no tiene nada de que hablar. Su clase entera ' +
    'parece un catalogo de portadas, y el acaba de perder la que le gustaba de verdad. Para volver a tocar las ' +
    'consolas tiene que montar un proyecto, y para eso le piden que haga una cosa que implicaba presentar ' +
    'candidatas. Empieza con cinco, cada una de un tipo: la que deberia ser la protagonista y no sabe estar ' +
    'en su propio papel, la que dibuja mejor que nadie y es la mas fria, la que dice lo que piensa por ' +
    'escrito, la que se supone que no compite y compite mas que todas, y una que no esta en la ' +
    'lista de nadie. El primer capitulo cuenta como las conoce; los doce siguientes cuentan como se ' +
    'confunden una por una las cosas que habian dado por buenas. Tomoya va ocho años atras, al mismo ' +
    'instituto y a las mismas clases, para entender por que la que eligio es la que eligio, y ese capitulo ' +
    'es el que explica por que el telefono aparece en su bolsillo desde el principio. La primera temporada ' +
    'termina con una eleccion y con cuatro personas fuera. La segunda, que lleva en el titulo un simbolo ' +
    'de bemol, se pasa los doce capitulos intentando deshacerla y termina sabiendo algo que no queria saber. ' +
    'La pelicula es lo que queda: la graduacion y el precio de todo lo anterior. Las tres obras juntas suman ' +
    'veintiseis capitulos, y la nota media sale de IMDb.',

  anio: 2015,
  estado: 'finished',
  estudio: 'CloverWorks',

  categorias: ['Romance', 'Comedia'],

  generos: ['Romance', 'Comedia', 'Recuentos de la vida', 'Escolar'],
};

export const ANIME_ID = 'saekano-how-to-raise-a-boring-girlfriend';

/**
 * Nota de la serie en IMDb: 6,9 con 2.187 votos.
 *
 * Las tres obras puntuan distinto y la media ponderada de los tres
 * identificadores sale tambien en 6,9:
 *
 *   tt3612626   las dos temporadas de television  6,9 con 2.187 votos
 *   tt11203468  la pelicula                      7,7 con   890 votos
 */
export const RATING_SERIE = 6.9;

/**
 * Capitulos en total.
 *
 *   T1  13  (enero - marzo de 2015)
 *   T2  12  (abril - junio de 2017)
 *   T3   1  (octubre de 2019, la pelicula)
 *   ---
 *       26
 *
 * La primera cuenta el capitulo cero, que va antes de que empiece la
 * serie. La segunda cuenta el suyo, que es una precuela. Los dos van
 * aqui porque en ambas temporadas son parte de la historia y no extras.
 */
export const EPISODIOS_TOTAL = 26;

/** Donde se emite, fuera de Japon. */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Tomoya pierde a la chica que le gusta el primer día y tiene que montar un proyecto de computer ' +
      'para poder seguir jugando. El proyecto le obliga a trabajar con cinco chicas de su clase, una por ' +
      'capitulo, y cada capitulo es el mismo esquema visto desde un lado distinto: el chico que lo tiene ' +
      'todo preparado y la chica que contesta algo que no estaba en el guion. El capitulo cero es el peor ' +
      'puntuado y el más citado, porque cumple su función y no funciona; el noveno es el mejor, y es el ' +
      'único que se ocupa del pasado en lugar del presente. Los capitulos 7 y 8 son los que dan el giro: ' +
      'el triangulo pasa de ser de dos a ser de tres y ya no se puede volver atrás. La ultima escena es ' +
      'una elección y cuatro personas que se quedan en la puerta, y por eso el final no cierra nada. ' +
      'Media de los trece capitulos: 6,9.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '♭',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'La segunda temporada lleva un bemol en el titulo y hace lo que el simbolo significa: bajarle el tono ' +
      'a la serie para poder discutirla. Empieza con una precuela de una tarde y sigue con el problema de ' +
      'verdad, que es que Tomoya quiere a cuatro personas y solo puede elegir una, y que lleva doce ' +
      'capitulos sin decirlo. El capitulo 2 es el que gira la temporada y el 7 el mejor de los veintiséis: ' +
      'por fin ocurren a la vez las dos cosas que llevaban doce capitulos esperando. Las notas van del 8,0 ' +
      'al 9,1 y la media es 8,7, casi dos puntos por encima de la primera temporada. Termina en el mismo ' +
      'sitio abierto en el que terminó la anterior, con la decisión tomada y sin decir de quién es.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Fine',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Ciento catorce minutos que son el final de verdad. Cuentan la graduación, lo que se decidió al final ' +
      'de la segunda temporada y lo que esa decisión cuesta cuando ya no se puede deshacer. Es el único ' +
      'capítulo de la serie que no es de Tomoya y Megumi por separado, y el único en el que el resto del ' +
      'reparto no compite por nada. La nota es 7,7, la más alta de las tres obras.',
    capitulos: 'T3',
  },
];