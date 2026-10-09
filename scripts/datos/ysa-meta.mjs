// ──────────────────────────────────────────────────────────
// LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────
//
// Los datos que van al documento `animes/{id}`, que es lo que escribe
// `crear-anime.mjs`. Van aqui y no en ese script porque ese script
// tambien lleva la ficha de los otros animes del catalogo.

export const ANIME = {
  // El titulo NO se traduce. El japones, 四月は君の嘘, se queda como
  // `japaneseTitle`, que es donde lo busca la wiki.
  //
  // MyAnimeList lo da como titulo alternativo en espanol tambien
  // "Your Lie in April", y Selecta Vision (que lo licencio para
  // Espana) lo Doblo con ese nombre. Traducirlo seria inventar un
  // titulo que nadie usa.
  titulo: 'Your Lie in April',
  japaneseTitle: '四月は君の嘘',

  // Sinopsis de la Wikipedia en espanol, del primer parrafo de la
  // entrada. No esta escrita por mi.
  //
  // Se pudo haber usado la del distribuidor (Crunchyroll tiene la
  // suya en castellano), pero llega TRUNCADA de origen: termina en
  // "Se conformaba..." a mitad de una frase, tal cual esta en su
  // pagina. Ponerla en la ficha seria guardar media sinopsis y
  // un texto cortado, que es peor que ninguna.
  synopsis:
    'La historia sigue a un joven pianista llamado Kōsei Arima, que alcanzó la fama durante su ' +
    'infancia al ganar numerosos concursos musicales gracias a su gran talento. Sin embargo, la ' +
    'muerte de su madre le impidió seguir tocando el piano. Dos años después, Kaori Miyazono ' +
    'entra en su vida y lo impulsa a regresar al mundo de la música, mostrándole que debe ' +
    'interpretar las melodías con libertad y sin restricciones, en contraste con la forma rígida y ' +
    'estructurada con la que él solía tocar.',

  anio: 2014,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  categorias: ['Seinen & Psicológico'],
  // Los generos que la propia pagina de Crunchyroll en espanol lista
  // para esta serie: Comedia, Drama, Musical, Romance, Shounen.
  //
  // "Comedia" y "Shounen" se han dejado fuera a proposito, porque en
  // este catalogo "Comedia" leeria como la categoria "Romance &
  // Comedia" y esta serie no es una comedia. "Shounen" es la
  // demografia del manga original, no el tono del anime.
  generos: ['Romance', 'Drama', 'Musical'],
};

export const ANIME_ID = 'your-lie-in-april';

/**
 * Nota de la serie completa en IMDb, ponderada: 8,6 sobre unos 50 mil
 * votos.
 *
 * Es la serie con el reparto de notas mas disparado de las tres que
 * hay en el catalogo: va del 7,7 del primer capitulo al 9,8 del
 * ultimo, y los tres ultimos estan por encima de 9,1. La media de la
 * serie (8,6) queda claramente por debajo de como acaba, que es lo
 * que le pasa a casi todo el que la ve.
 *
 * La de Ataque a los Titanes (9,1) tiene el caso inverso: la media
 * sube mucho por una tercera parte que esta por encima de 9,5
 * capitulo a capitulo. Las dos cosas conviene recordarlas al mirar
 * un numero de esta pagina.
 */
export const RATING_SERIE = 8.6;

/**
 * Capitulos en total: 22 emitidos por television y 1 OVA.
 *
 * El OVA "Moments" va como capitulo 23 con numero ENTERO, no
 * fraccionado como los extras de Ataque a los Titanes. El numero lo
 * pone la web oficial de la serie (kimiuso.jp, que lo lista como
 * "#23 MOMENTS"), no este catalogo. Aqui no hay ningun hueco entre
 * enteros que rellenar: la serie es una sola temporada de 22
 * capitulos, y renumerarla para dejar sitio a un unico extra habria
 * roto los 22 que ya estan.
 *
 * En su tabla, Wikipedia lo etiqueta "OVA" en vez de numerarlo.
 *
 * Lo que si es un precuela: su historia ocurre unos años antes del
 * primer capitulo. Eso va contado en su resumen, que es donde le
 * toca, y no en el numero.
 *
 * Hay otros dos capitulos numerados de forma distinta en las fuentes
 * y que aqui NO entran: la novela ligera "6-nin no Etude" no es anime,
 * y el manga "Coda" tampoco.
 */
export const EPISODIOS_TOTAL = 23;

// ──────────────────────────────────────────────────────────
// LAS TEMPORADAS
// ──────────────────────────────────────────────────────────
//
// Una sola, y no es que se haya combinado nada: la serie se emitio
// seguida de principio a fin. `titulo` va vacio porque la temporada
// no tiene subtitulo oficial: la de Ataque a los Titanes lo tienen
// ("The Final Season"), y por eso hay dos anime con temporada con
// nombre y dos sin el.
//
// El nota de la temporada no se escribe aqui: `cargar-anime.mjs` la
// calcula como la media de los capitulos que tienen nota. En una
// sola temporada eso da un numero que no significa nada (es la media
// de la serie, otra vez) pero el campo existe para todas las
// temporadas y vaciarlo dejaria la ficha incompleta.

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis: `Un chico que era prodigio del piano dejó de oír el sonido de su propio instrumento el día que su madre murió en el público. Dos años después, una violinista que toca como le da la gana lo devuelve al escenario, y lo que empieza como un encargo de acompañamiento se convierte en una amistad que ninguno de los dos sabe cómo decirse. Lo que ninguno de los dos dice es que ella está muriendo, y que él lleva dos años sin poder despedirse sin romperse. La música es el pretexto de todo: lo que de verdad se cuenta es a dos personas aprendiendo a tocar hasta el final.`,
    capitulos: 'T1',
  },
];
/**
 * Donde se emite.
 *
 * La lista va en el fichero de datos y no en Firestore a mano, porque
 * `crear-anime.mjs` deja el campo `streaming` vacio a proposito y lo
 * escribe `anadir-plataformas.mjs`. Un anime con la lista en la base
 * pero no en el fichero se pierde en cuanto se vuelve a crear el
 * anime en otra base de pruebas: el fichero es la fuente.
 *
 * Lo que hay en la base es lo de aqui: Crunchyroll y Netflix.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];
