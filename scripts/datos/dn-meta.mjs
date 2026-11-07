// LA FICHA DEL ANIME - Death Note
//
// Thriller de Tsugumi Ohba y Takeshi Obata, en la Shonen Jump de
// Shueisha de 2003 a 2006, con 12 tomos. Un cuaderno que mata con
// nombre y cara cae en manos del mejor estudiante: lo usa para limpiar
// el mundo y el mejor detective va a por él.
//
// Solo hay una temporada de 37 (2006-2007), en Madhouse con Araki
// dirigiendo e Inoue de guionista. Los especiales Relight son
// resúmenes y las pelis de imagen real no entran.
//
// Los datos de la serie en IMDb son tt0877057: 8,9 con unos 503.000
// votos. En la T1 IMDb usa fechas americanas; aquí van las japonesas.

export const ANIME = {
  titulo: 'Death Note',

  // La grafía oficial japonesa, de AniList y de la serie.
  japaneseTitle: 'デスノート',

  // Base: las Wikipedias en inglés (serie y capítulos, con los
  // argumentos) y en japonés (fechas). Duelo de genios con libreta
  // mortal por medio: el que escribe gana si sabe el nombre y la cara.
  synopsis:
    'Light Yagami halla un cuaderno que mata con nombre y cara: lo prueba y es real. Ryuk, su ' +
    'shinigami, solo lo ve él. Como Kira limpia el mundo de criminales y L, el mejor detective, ' +
    'lo acorrala por turnos con Misa, Near y Mello de por medio. Thriller de ingenio donde cada ' +
    'nombre escrito es una jugada.',

  anio: 2006,
  estado: 'finished',
  estudio: 'Madhouse',

  // Thriller psicológico juvenil con misterio de por medio, como
  // Classroom of the Elite, que junta las tres.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio', 'Shojo & Escolar'],

  generos: ['Thriller', 'Psicológico', 'Misterio', 'Drama', 'Sobrenatural', 'Crimen'],
};

export const ANIME_ID = 'death-note';

/**
 * Nota de la serie en IMDb (tt0877057): 8,9 con unos 503.000 votos.
 *
 * Los capítulos van del 7,0 al 9,6: lo más alto es la muerte de L
 * (E25, 9,6) y la vuelta de Kira (E24, 9,4). La segunda mitad baja
 * casi un punto.
 */
export const RATING_SERIE = 8.9;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   37  (octubre de 2006 - junio de 2007, con parones en
 *             diciembre y enero)
 *   --
 *        37
 */
export const EPISODIOS_TOTAL = 37;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, en castellano (ficha de
 *     crunchyroll.com/es-es).
 *   · Netflix -> la serie también (JustWatch España).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Treinta y siete capítulos del 4 de octubre de 2006 al 27 de junio de 2007, en Madhouse ' +
      'con Araki dirigiendo. Light contra L hasta la azotea, Misa de por medio, Yotsuba, ' +
      'encierros y memoria perdida; luego Near y Mello contra un Kira con Mikami de mano. ' +
      'Cierra en el almacén con Ryuk escribiendo.',
    capitulos: 'T1',
  },
];
