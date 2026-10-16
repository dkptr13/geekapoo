// LA FICHA DEL ANIME - Dragon Raja
//
// Fantasía de acción china (donghua) de las novelas de Jiang Nan
// (2009-...), con Tencent Penguin Pictures produciendo. Un pringado
// de instituto entra en la academia Cassell, que caza a los mestizos
// de dragón, y acaba en el centro de la guerra por los reyes.
//
// Fichas de AniList: 122511 (T1, 17 capítulos de 2022) y 157692 (T2,
// 24 de 2025). La tercera (205375) está anunciada sin emitir y no
// entra hasta emitirse, igual que la segunda de Makeine.
//
// Garden Culture anima con Wang Xin dirigiendo. La versión japonesa
// (龍族 -The Blazing Dawn- y 龍族Ⅱ -The Mourner's Eyes-, por Aniplex)
// va dos años por detrás; aquí van las fechas del estreno chino, que
// es el original.
//
// Los datos de la serie en IMDb son tt27442011: 7,0 con unos 600
// votos. Las notas por capítulo salen del script contra IMDb, que
// numera la T1 de 0 a 16 como la wiki japonesa; donde IMDb no trae
// nota van a cero.

export const ANIME = {
  titulo: 'Dragon Raja',

  // La grafía japonesa, de AniList y de la web oficial japonesa. En
  // chino es 龙族.
  japaneseTitle: '龍族',

  // Base: las Wikipedias en inglés (novelas), en japonés (títulos y
  // fechas de emisión japonesa) y en chino (emisión original), TVDB
  // (títulos chinos y argumentos oficiales) e IMDb (notas). Sangre de
  // dragón, academia secreta y un pringado con un diablo dentro.
  synopsis:
    'Lu Mingfei, un pringado de instituto sin nada especial, recibe una carta de la universidad ' +
    'Cassell de Chicago. La academia resulta ser una escuela para cazar mestizos de dragón, y él ' +
    'acaba en el centro de la guerra por los reyes: Norton el de bronce y fuego, Odín entre ' +
    'sombras, con un niño diablo ofreciéndole poder a cambio de un precio. Fantasía de acción ' +
    'con academia secreta.',

  anio: 2022,
  estado: 'finished',
  estudio: 'Garden Culture',

  // Fantasía de acción juvenil, como DanMachi, que junta fantasía y
  // shonen: dragones, academia y misiones.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Drama'],
};

export const ANIME_ID = 'dragon-raja';

/**
 * Nota de la serie en IMDb (tt27442011): 7,0 con unos 600 votos.
 *
 * Los capítulos con nota van del 6,8 al 9,2: lo más alto son la cruz
 * de hueso (T2E13) y el nombre verdadero (T2E19). Quince capítulos de
 * la T2 no traen nota en IMDb y van a cero.
 */
export const RATING_SERIE = 7.0;

/**
 * Capítulos en total, en orden de emisión china.
 *
 *   T1   17  (agosto - noviembre de 2022; oficiales 0-16)
 *   T2   24  (julio - diciembre de 2025)
 *   --
 *        41
 */
export const EPISODIOS_TOTAL = 41;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la lleva en España (ficha de crunchyroll.com/es
 *     con las dos temporadas y títulos en castellano).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: 'Long Zu',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Garden Culture',
    synopsis:
      'Diecisiete capítulos del 19 de agosto al 25 de noviembre de 2022 (oficiales 0 a 16, ' +
      'aquí del 1 al 17), en Garden Culture para Tencent Video. Mingfei entra en Cassell, ' +
      'pasa el examen 3E y baja al palacio del rey de bronce y fuego. Norton cae y el pacto ' +
      'con el niño diablo queda firmado.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Long Zu 2',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Garden Culture',
    synopsis:
      'Veinticuatro capítulos del 18 de julio al 12 de diciembre de 2025, en Garden Culture ' +
      'para Tencent Video. La era del Luto: Odín mueve desde la sombra, el puerto del Cisne ' +
      'Negro esconde a Zero y Jörmungandr reclama la tierra. Cierra con el veredicto del rey.',
    capitulos: 'T2',
  },
];
