// META - Kimetsu no Yaiba
//
// TVDB 348545 "鬼滅の刃" (2019, Ended). La S1 es la serie (26),
// la S2 la version de tele del Tren (7, remontada: no entra), la
// S3 Yuukaku (11), la S4 Herreros (11) y la S5 Pilar (8). Las
// pelis van en Specials (S0E2 el Tren, S0E16 el Castillo 1); los
// recopilatorios y los chibis de S0 no entran.
// AniList 101922 (T1, 2019, 26), 112151 (T2 peli Tren, 2020),
// 142329 (T3 Yuukaku, 2021-2022, 11), 145139 (T4 Herreros, 2023,
// 11), 166240 (T5 Pilar, 2024, 8) y 178788 (T6 peli Castillo 1,
// 2025).
// IMDb tt9335498 (serie: S1 la serie, S2 tele del Tren + Yuukaku,
// S3 Herreros, S4 Pilar), tt11032374 (peli Tren) y tt32820897
// (peli Castillo 1). Las partes 2 y 3 del Castillo no tienen fecha
// y no entran hasta estrenarse.
//
// El titulo romanizado es el oficial en todo el mundo ("Demon
// Slayer" es la licencia en ingles).

export const ANIME = {
  titulo: 'Kimetsu no Yaiba',

  japaneseTitle: '鬼滅の刃',

  synopsis:
    'Tanjiro vuelve del pueblo con carbon y encuentra a su familia muerta: solo Nezuko respira, convertida en demonio. ' +
    'Entra en el cuerpo de cazadores con ella en la caja para curarla y matar a Muzan. ' +
    'Tren infinito, barrio del placer, aldea de herreros, entrenamiento pilar y castillo infinito con ufotable al frente.',

  anio: 2019,
  estado: 'emitiendo',
  estudio: 'ufotable',

  // Shonen de cazadores con fantasia oscura de demonios: los dos
  // cajones claros. Son dos.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Drama', 'Fantasía', 'Sobrenatural'],
};

export const ANIME_ID = 'kimetsu-no-yaiba';

/**
 * Nota de la serie completa en IMDb, serie tt9335498: 8,5 con unos
 * 239.000 votos. El T1 E19 es lo mejor con 9,7.
 */
export const RATING_SERIE = 8.5;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   26  (abril - septiembre de 2019, serie)
 *   T2    1  (octubre de 2020, peli Tren Infinito)
 *   T3   11  (diciembre de 2021 - febrero de 2022, Yuukaku)
 *   T4   11  (abril - junio de 2023, Herreros)
 *   T5    8  (mayo - junio de 2024, Pilar)
 *   T6    1  (julio de 2025, peli Castillo 1)
 *   --
 *        58
 */
export const EPISODIOS_TOTAL = 58;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 *   · Netflix -> la serie completa y las pelis, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Veintiseis capitulos entre el 6 de abril y el 28 de septiembre de 2019. ' +
      'Tanjiro entra en el cuerpo con Nezuko en la caja, junta a Zenitsu e Inosuke y sube hasta Rui en Natagumo. ' +
      'Cierra con juicio, pilares y mision al tren infinito.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Tren Infinito',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Ciento diecisiete minutos del 16 de octubre de 2020. ' +
      'El tren de los sueños con Rengoku al frente, Enmu durmiendo al pasaje y Akaza esperando al final. ' +
      'La peli que batio records en Japon y la mas taquillera del anime hasta la fecha.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Barrio del Placer',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Once capitulos entre el 5 de diciembre de 2021 y el 13 de febrero de 2022. ' +
      'Tengen mete al trio de cortesanas en el barrio contra Daki y Gyuutarou. ' +
      'Cierra con dos cuellos a la vez, retirada de Tengen y el 10 como lo mejor con 9,8.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Aldea de los Herreros',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Once capitulos entre el 9 de abril y el 18 de junio de 2023. ' +
      'Muichirou y Mitsuri al frente en la aldea contra Hantengu y Gyokko, con Genya comiendo demonios. ' +
      'Cierra con Nezuko al sol hablando por fin.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Entrenamiento Pilar',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Ocho capitulos entre el 12 de mayo y el 30 de junio de 2024. ' +
      'Todos los pilares entrenan al cuerpo antes de la guerra, con Giyuu sacado del pozo a base de soba. ' +
      'Cierra con Muzan reventando la casa del patron y el castillo tragando a todos.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Castillo Infinito 1',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Ciento cincuenta y cinco minutos del 18 de julio de 2025. ' +
      'Caida al castillo infinito: Tanjiro y Giyuu contra Akaza, Shinobu contra Douma y Zenitsu contra su pasado. ' +
      'Primera de tres partes; las otras dos no tienen fecha.',
    capitulos: 'T6',
  },
];
