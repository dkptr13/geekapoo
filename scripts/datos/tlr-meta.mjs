// META - To Love Ru
//
// TVDB 81831 "To LOVEる -とらぶる-" (2008, Ended). Las cuatro
// series van en S1 a S4 y el resto en Specials (S0E1 a S0E6 el
// OVA, S0E7 a S0E12 el OVA Darkness, S0E13 a S0E15 el OVA 2nd,
// S0E16 Multiplication). El archivo de Momo no entra.
// AniList 3455 (T1, 2008, 26), 5667 (T2 OVA, 2009, 6), 9181 (T3
// Motto, 2010, 12), 13663 (T4 Darkness, 2012, 12), 13851 (T5 OVA
// Darkness, 2012-2015, 6), 20995 (T6 Darkness 2nd, 2015, 12),
// 21852 (T7 Specials, 2015, 2), 21853 (T8 OVA 2nd, 2016, 3) y
// 100659 (T9 Multiplication, 2017).
// IMDb tt1216222 (serie y OVA), tt1743493 (Motto) y tt2341806
// (Darkness y resto).
//
// El titulo corto con guion es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'To Love Ru',

  japaneseTitle: 'To LOVEる -とらぶる-',

  synopsis:
    'Lala cae del cielo encima de Rito y se compromete sola con el ante su planeta. ' +
    'Entre Haruna, Yami, Momo con plan haren y Némesis final, el lio crece nueve entregas. ' +
    'Xebec entero con accidentes, colas y sentimientos.',

  anio: 2008,
  estado: 'finished',
  estudio: 'Xebec',

  // Harem ecchi escolar con alienigenas: risas y colas. Son dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Ecchi', 'Romance', 'Harem', 'Ciencia ficción', 'Escolar', 'Parodia'],
};

export const ANIME_ID = 'to-love-ru';

/**
 * Nota de la serie completa en IMDb: 6,7 de media ponderada por
 * capitulos de las tres entradas (tt1216222: 6,4 con 44, tt1743493:
 * 6,7 con 12, tt2341806: 7,0 con 36). El T6 E14 es lo mejor con
 * 8,5.
 */
export const RATING_SERIE = 6.7;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   26  (abril - septiembre de 2008, serie)
 *   T2    6  (abril de 2009 - abril de 2010, OVA con tomos)
 *   T3   12  (octubre - diciembre de 2010, Motto)
 *   T4   12  (octubre - diciembre de 2012, Darkness)
 *   T5    6  (julio de 2012 - abril de 2015, OVA Darkness)
 *   T6   12  (julio - septiembre de 2015, Darkness 2nd)
 *   T7    2  (octubre de 2015, Specials)
 *   T8    3  (enero - diciembre de 2016, OVA 2nd)
 *   T9    1  (noviembre de 2017, Multiplication)
 *   --
 *        80
 */
export const EPISODIOS_TOTAL = 80;

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
    anio: 2008,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Veintiseis capitulos entre el 4 de abril y el 26 de septiembre de 2008. ' +
      'Lala cae encima de Rito y el lio alienigena no para: Haruna, Yami y compromiso. ' +
      'Cierra con Lala eligiendo quedarse.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'OVA',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Seis capitulos entre abril de 2009 y abril de 2010, salidos con los tomos. ' +
      'Rito mujer, resort, mision y gemelas con el reparto de tapadillo. ' +
      'Extras entre serie y Motto.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Motto',
    anio: 2010,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Doce capitulos entre el 6 de octubre y el 22 de diciembre de 2010. ' +
      'Historias cortas por trios con baños en guerra y amor sonando. ' +
      'Cierra queriendo por triplicado.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Darkness',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Doce capitulos entre el 6 de octubre y el 29 de diciembre de 2012. ' +
      'Momo monta el haren con Yami sonriendo de verdad por primera vez. ' +
      'Cierra pensando en voz alta.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Darkness OVA',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Seis capitulos entre julio de 2012 y abril de 2015, salidos con los tomos. ' +
      'Prologo, nostalgia, intercambio y foto con el reparto oscuro. ' +
      'Extras entre Darkness y 2nd.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Darkness 2nd',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Doce capitulos entre el 7 de julio y el 29 de septiembre de 2015. ' +
      'Némesis entra con juego sucio y Yami se desborda al final. ' +
      'Cierre prediciendo lo imposible.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Darkness 2nd Specials',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Dos capitulos del 29 de octubre de 2015 al final de la S4 de TVDB. ' +
      'Poder contra poder y futuro brillante con Némesis delante. ' +
      'Extras que cierran 2nd por todo lo alto.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'Darkness 2nd OVA',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Tres capitulos entre enero y diciembre de 2016, salidos con los tomos. ' +
      'Fantasma, madre y primer accidente con Sephie de propina. ' +
      'Extras entre 2nd y Multiplication.',
    capitulos: 'T8',
  },
  {
    numero: 9,
    titulo: 'Multiplication',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Xebec',
    synopsis:
      'Doce minutos del 2 de noviembre de 2017, salidos con el tomo especial. ' +
      'Por delante y por detras con todas para cerrar la saga. ' +
      'Multiplicar el lio por ultima vez.',
    capitulos: 'T9',
  },
];
