// META - K-On!
//
// TVDB 87501 "けいおん！" (2009, Ended). Las dos series van en S1
// y S2; los OVAs y la peli en Specials (S0E19 Live House, S0E17
// Keikaku, S0E18 la peli). Los cortos Ura-On no entran: chibis,
// y aqui eso no entra.
// AniList 5680 (T1, 2009, 13), 6862 (T2 OVA Live House, 2010),
// 7791 (T3 K-On!!, 2010, 26), 9734 (T4 OVA Keikaku, 2011) y 9617
// (T5 peli, 2011).
// IMDb tt1410218 (los OVAs van dentro como S1E14 y S2E27) y
// tt1909796 (peli).
//
// El titulo corto con exclamacion es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'K-On!',

  japaneseTitle: 'けいおん!',

  synopsis:
    'Yui no sabe tocar nada y acaba en el club de musica ligera con Mio, Ritsu y Mugi por bandera. ' +
    'Entre te, festivales y Azusa poniendo orden, las cinco hacen ruido hasta graduarse. ' +
    'Dos series, dos OVAs y viaje a Londres con Kyoto Animation al frente.',

  anio: 2009,
  estado: 'finished',
  estudio: 'Kyoto Animation',

  // Comedia escolar de banda de chicas: risas y musica ligera.
  // Son dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Música', 'Recuentos de la vida', 'Escolar'],
};

export const ANIME_ID = 'k-on';

/**
 * Nota de la serie completa en IMDb, serie tt1410218: 7,9 con unos
 * 6.000 votos. El T3 E24 es lo mejor con 9,4.
 */
export const RATING_SERIE = 7.9;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   13  (abril - junio de 2009, serie)
 *   T2    1  (enero de 2010, OVA Live House)
 *   T3   26  (abril - septiembre de 2010, K-On!!)
 *   T4    1  (marzo de 2011, OVA Keikaku)
 *   T5    1  (diciembre de 2011, peli)
 *   --
 *        42
 */
export const EPISODIOS_TOTAL = 42;

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
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Trece capitulos entre el 3 de abril y el 26 de junio de 2009. ' +
      'Yui entra sin saber tocar y el club despega: festivales, campamentos y Azusa de novata. ' +
      'Cierra nevado con el club en marcha.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Live House!',
    anio: 2010,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Un capitulo del 20 de enero de 2010, salido con el tomo 7 del manga. ' +
      'Debut en sala de verdad con publico de verdad: el local se queda pequeño. ' +
      'Extra entre series.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'K-On!!',
    anio: 2010,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Veintiseis capitulos entre el 7 de abril y el 29 de septiembre de 2010. ' +
      'Ultimo curso con Azusa dentro: festivales, examenes y graduacion con cancion dedicada. ' +
      'Cierra con Azusa al mando del club.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Keikaku!',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Un capitulo del 16 de marzo de 2011, salido con el tomo 8 del manga. ' +
      'Planear el futuro del club sin las mayores entre ideas locas. ' +
      'Extra entre la serie y la peli.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Movie',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Ciento diez minutos del 3 de diciembre de 2011. ' +
      'Viaje a Londres con concierto y turismo para despedir a las mayores. ' +
      'Despedida grande de la banda antes de la uni.',
    capitulos: 'T5',
  },
];
