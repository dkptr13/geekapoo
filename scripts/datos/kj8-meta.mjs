// META - Kaiju No. 8
//
// TVDB 423075 "怪獣8号" (2024, Continuing; la S3 vacia es la
// tercera anunciada sin fecha ni capitulos y no entra).
// AniList 153288 (T1, 2024, 12 capitulos) y 178754 (T2, 2025, 11).
// IMDb tt21975436. El recopilatorio y los especiales cortos van en
// S0 de TVDB y aqui no entran.
//
// El titulo mezcla letras y numero tal cual, en todo el mundo.

export const ANIME = {
  titulo: 'Kaiju No. 8',

  japaneseTitle: '怪獣８号',

  synopsis:
    'Kafka limpia restos de kaiju con Reno y sueña con las Fuerzas aunque ya no tiene edad. ' +
    'Un bicho lo mete dentro y despierta convertido en kaiju humanoide con numero propio. ' +
    'Escondiendo su forma entra en la Tercera con Mina, Hoshina y Kikoru, contra el nº 9 y oleadas sin fin.',

  anio: 2024,
  estado: 'emitiendo',
  estudio: 'Production I.G',

  // Accion de bichos gigantes con ciencia ficcion militar, y shonen
  // de superacion de manual. Son tres.
  categorias: ['Shonen & Acción', 'Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico'],

  generos: ['Acción', 'Ciencia ficción', 'Monstruos', 'Militar'],
};

export const ANIME_ID = 'kaiju-no-8';

/**
 * Nota de la serie completa en IMDb, serie tt21975436: 8,2 con unos
 * 34.000 votos. El T1 E10 es lo mejor con 9,4.
 */
export const RATING_SERIE = 8.2;

/**
 * Capitulos en total.
 *
 *   T1  12  (abril - junio de 2024)
 *   T2  11  (julio - septiembre de 2025)
 *   --
 *       23
 */
export const EPISODIOS_TOTAL = 23;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Doce capitulos entre el 13 de abril y el 29 de junio de 2024. ' +
      'Kafka se convierte, entra en la Tercera de tapadillo y debuta contra el nº 9. ' +
      'Al descubierto al final y juzgado por el alto mando.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Once capitulos entre el 19 de julio y el 27 de septiembre de 2025. ' +
      'Armas kaiju, Primera Division de Narumi, Shinomiya padre y oleadas con segunda encima. ' +
      'La guerra sigue abierta.',
    capitulos: 'T2',
  },
];
