// LA FICHA DEL ANIME - Puella Magi Madoka Magica
//
// Magical girls de Urobuchi con Shinbo dirigiendo para Shaft, idea de
// Magica Quartet, en 2011. Contrato por un deseo, alma en la gema y
// brujas al desesperar: el género dado la vuelta con Kajiura de fondo.
//
// Fichas de AniList: 9756 (T1, 2011), 11981 (Rebellion, 2013) y 133007
// (Walpurgisnacht: Rising, 2026). Las dos primeras pelis son resúmenes
// y Magia Record es otra serie: no entran. El corto conceptual, los
// discos drama y la edición de tele tampoco.
//
// Los datos de la serie en IMDb son tt1773185: 8,2 con unos 15.000
// votos. En la T1 IMDb usa el día anterior desde el segundo; aquí van
// las fechas japonesas (los dos últimos, juntos por el terremoto).

export const ANIME = {
  titulo: 'Puella Magi Madoka Magica',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: '魔法少女まどか☆マギカ',

  // Base: las Wikipedias en inglés (serie, capítulos y pelis, con los
  // argumentos) y en japonés (fechas y personal). Niñas que piden un
  // deseo y pagan con el alma, y la amiga que rebobina el mundo por
  // salvar a una.
  synopsis:
    'Madoka sueña con una chica y al día siguiente aparece en clase: Homura le advierte que no ' +
    'cambie. Kyubey ofrece un deseo a cambio de cazar brujas como magical girl, y Mami, Sayaka ' +
    'y Kyoko enseñan el precio: el alma vive en la gema y la desesperación vuelve bruja. Homura ' +
    'rebobina líneas enteras por Madoka, que pide borrar a las brujas y se vuelve Ley. Tragedia ' +
    'mágica que rompió el género.',

  anio: 2011,
  estado: 'finished',
  estudio: 'Shaft',

  // Magical girls oscuras para adultos, con el thriller conspiranoico
  // de Urobuchi. Son dos, como Oshi no Ko, que junta psicológico con
  // thriller y misterio.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio'],

  generos: ['Drama', 'Psicológico', 'Thriller', 'Fantasía'],
};

export const ANIME_ID = 'puella-magi-madoka-magica';

/**
 * Nota de la serie en IMDb (tt1773185): 8,2 con unos 15.000 votos.
 *
 * Los capítulos van del 7,4 al 9,5: lo más alto es el bucle de Homura
 * (E10, 9,5) y el final (E12, 9,2). Las pelis van por 7,9 y 7,6.
 */
export const RATING_SERIE = 8.2;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   12  (enero - abril de 2011, final doble por el terremoto)
 *   T2    1  (Rebellion, octubre de 2013)
 *   T3    1  (Walpurgisnacht: Rising, agosto de 2026)
 *   --
 *        14
 */
export const EPISODIOS_TOTAL = 14;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la serie está en Netflix (ficha de netflix.com en
 *     castellano). La trilogía llega a Crunchyroll en noviembre de
 *     2026 y a Netflix en enero de 2027: aún no están.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Doce capítulos del 7 de enero al 22 de abril de 2011, en Shaft con Shinbo dirigiendo ' +
      'y Urobuchi de guionista (los dos últimos juntos por el terremoto). Madoka duda, Mami ' +
      'muere, Sayaka cae, Kyoko se inmola y Homura muestra sus bucles. Cierra con Madoka ' +
      'volviéndose Ley de los Ciclos.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Rebellion',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'La película del 26 de octubre de 2013 (116 minutos), en Shaft con Shinbo de director ' +
      'general. Mitakihara feliz con pesadillas: Homura descubre que es bruja aislada por los ' +
      'incubadores. Madoka baja a salvarla y Homura le roba el poder y reescribe el mundo.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Walpurgisnacht: Rising',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'La película del 28 de agosto de 2026 (120 minutos), en Shaft con Shinbo de director ' +
      'general y ayuda de Doroinu. Paz bajo la demonio Homura con móviles que dan magia, y ' +
      'Wasu resulta ser la primera bruja. Homura y Madoka hacen las paces y Madoka vuelve a ' +
      'la Ley.',
    capitulos: 'T3',
  },
];
