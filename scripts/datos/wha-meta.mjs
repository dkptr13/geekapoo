// META - Witch Hat Atelier

export const ANIME = {
  // El titulo va en ingles porque es como lo escribe la licencia
  // (Crunchyroll), la web oficial y las dos paginas de wikipedia. En
  // castellano esta "Taller de Sombrero de Bruja", que es la traduccion
  // del manga y no el nombre del anime.
  titulo: 'Witch Hat Atelier',

  japaneseTitle: 'とんがり帽子のアトリエ',

  synopsis:
    'Coco es una chica de campo que ayuda en el taller de sastre de su madre y que siempre ' +
    'quiso ser bruja, aunque le han dicho mil veces que eso no es posible para alguien que no ' +
    'nacio con poder. Un dia aparece un brujo en el taller, le pide que no mire mientras ' +
    'arregla un carruaje con magia, y ella no puede Resistir: lo ve, y descubre que la magia se ' +
    'escribe con tinta. Recuerda entonces el cuento ilustrado que le vendio una bruja con ' +
    'mascara, y sin querer Monta un hechizo que convierte a su madre en piedra. El brujo ' +
    'tenia que borrar la memoria de todo el que hubiera visto el secreto, pero decide ' +
    'excepto con ella y la recoge como aprendiz. Lo que empieza asi termina siendo una ' +
    'temporada entera de aprender a dibujar hechizos, de perder la dignidad en las pruebas ' +
    'y de preguntarse si las reglas del mundo estan escritas para proteger a la gente o para ' +
    'proteger el secreto. Y al final alguien le revela que la bruja de la mascara lleva todo el ' +
    'rato encima, y que quiere enseñar.',

  anio: 2026,
  estado: 'finished',
  estudio: 'Bug Films',

  // Seinen de fantasia, no de aventura clasica: el riesgo no es un dragon
  // sino una institucion que borra lo que no le conviene.
  categorias: ['Fantasía & Aventura'],

  generos: ['Fantasía', 'Aventura', 'Drama', 'Magia'],
};

export const ANIME_ID = 'witch-hat-atelier';

// La media de los 13 capitulos en IMDb es 8,47. La ficha del anime decia 9,5,
// que no se sabe de donde salio; aqui va la media real de lo que hay.
export const RATING_SERIE = 8.5;

/**
 * Capitulos en total.
 *
 *   T1  13  capitulos  (abril-junio de 2026)
 *   --
 *      13
 *
 * Hay una segunda temporada anunciada desde el 29 de junio de 2026 y
 * Crunchyroll ya tiene los derechos, pero no hay fecha ni capitulos, asi que
 * no va aqui: `cargar-anime.mjs` calcula los capitulos desde `wha-t1.mjs` y
 * una temporada sin capitulos se guardaria vacia en la wiki.
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite.
 *
 *   · Crunchyroll -> fuera de Asia, desde el dia del estreno. Tambien tiene
 *                     los derechos de la segunda temporada.
 *                  Tambien en el catalogo japones de Prime Video, que no se
 *                  pone porque ese enlace lleva a una tienda de Japon.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Bug Films',
    synopsis:
      'Coco entra en el atelier de Qifrey con una capa que no se quitara y una madre de piedra que ' +
      'no sabe como devolver. Empieza con cinco pruebas para llegar a ser bruja de verdad, y la ' +
      'primera la hace sola, con herramientas prestadas y sin saber casi nada: rompe todo lo que ' +
      'tiene, improvisa un planeador con lo que le queda y trae la flor. Esa es la prueba que la ' +
      'define, y tambien la que hace que Agott, la otra aprendiz, la odie de verdad. Al lado de ' +
      'ella estan Tetia, que quiere hacer hechizos que hagan feliz a la gente, y Richeh, que dibuja ' +
      'circulos diminutos y no acepta usar magia que no sea suya; Qifrey explica que las reglas de ' +
      'la Gran Aula nacieron de que la gente hizo magie hasta el desastre, y que por eso quien lo ' +
      've tiene que perder la memoria. El capitulo 7 es donde se cruza la linea: un hechizo de ' +
      'Coco convierte un rio entero en arena, y los Caballeros Magos la detienen por usar magia ' +
      'prohibida, aunque fue un accidente. El final no cierra nada: los Sombrero de Ala aparecen, ' +
      'Euini se convierte en un lobo con escamas y Coco cae a un abismo con Qifrey y Tetia mientras ' +
      'los habitantes de oro de Romonon, una ciudad que murio por codiciosa, los esperan abajo.',
    capitulos: 'T1',
  },
];