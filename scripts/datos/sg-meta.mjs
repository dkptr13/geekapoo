// LA FICHA DEL ANIME - Steins;Gate
//
// Ciencia ficción de la visual novel de 5pb. y Nitroplus (2009),
// segunda de Science Adventure. Un microondas que manda mails al
// pasado, líneas de universo que convergen y un loco que solo él
// recuerda lo que cambia.
//
// Fichas de AniList: 9253 (T1, 2011), 11577 (peli, 2013) y 21127 (T3
// Zero, 2018). Los extras (Poriomania, 23β alternativo, promos de IBM
// y San Valentín) no entran: el primero es comedia y el segundo, otra
// versión del 23.
//
// White Fox anima con Hamasaki y Satou en la T1, Hamasaki en la peli
// y Kawamura en Zero; Hanada escribe las tres, con Hayashi y Matsubara
// supervisando.
//
// Los datos de la serie en IMDb son tt1910272: 8,8 con unos 97.600
// votos. La T3 va en su tt propio (tt5514358, 8,4).

export const ANIME = {
  titulo: 'Steins;Gate',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'シュタインズ・ゲート',

  // Base: las Wikipedias en inglés (serie, temporadas y peli, con los
  // argumentos) y en japonés (fechas y personal). Un mail al pasado lo
  // cambia todo menos al que lo mandó, y salvar a una mata a la otra
  // hasta dar con la línea que las salva a las dos.
  synopsis:
    'Okabe, científico loco de mentira, descubre con Kurisu que su microondas manda mails al ' +
    'pasado y solo él recuerda los cambios. Cada D-mail mueve la línea: salvan a unos, condenan ' +
    'a otros, y SERN acecha. Para alcanzar la Steins Gate hay que engañar al destino sin perder ' +
    'a Mayuri ni a Kurisu. Thriller de viajes en el tiempo por líneas que convergen.',

  anio: 2011,
  estado: 'finished',
  estudio: 'White Fox',

  // Ciencia ficción con thriller conspiranoico, como Psycho-Pass, que
  // junta cyberpunk con thriller y psicológico.
  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico', 'Thriller & Misterio'],

  generos: ['Ciencia ficción', 'Thriller', 'Drama', 'Misterio', 'Psicológico'],
};

export const ANIME_ID = 'steins-gate';

/**
 * Nota de la serie en IMDb (tt1910272): 8,8 con unos 97.600 votos.
 *
 * Los capítulos van del 7,2 al 9,7: lo más alto son los dos finales
 * (E22 y E24 de la T1, 9,7) y el sacrificio de la T1 (E16, 9,4). La
 * peli va por 7,8 y Zero por 8,4 de media.
 */
export const RATING_SERIE = 8.8;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   24  (abril - septiembre de 2011)
 *   T2    1  (película, abril de 2013)
 *   T3   23  (abril - septiembre de 2018, Zero)
 *   --
 *        48
 */
export const EPISODIOS_TOTAL = 48;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, en castellano (ficha de
 *     crunchyroll.com/es-es).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'White Fox',
    synopsis:
      'Veinticuatro capítulos del 6 de abril al 14 de septiembre de 2011, en White Fox con ' +
      'Hamasaki y Satou dirigiendo. El PhoneWave manda mails al pasado y cada D-mail mueve la ' +
      'línea: Mayuri muere siempre hasta engañar al destino con Kurisu viva. Cierra en la ' +
      'Steins Gate.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Load Region of Déjà Vu',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'White Fox',
    synopsis:
      'La película del 20 de abril de 2013 (90 minutos), en White Fox con Hamasaki ' +
      'dirigiendo. Un año después, Okabe parpadea entre líneas y Kurisu vuelve de América. ' +
      'Él se desvanece por recuerdos en conflicto y solo ella con Suzuha puede traerlo: ' +
      'Operación Skuld al pasado.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Steins;Gate 0',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'White Fox',
    synopsis:
      'Veintitrés capítulos del 12 de abril al 27 de septiembre de 2018 (con parones en ' +
      'julio y agosto), en White Fox con Kawamura dirigiendo. Sin Kurisu, Okabe entierra al ' +
      'loco y prueba a Amadeus, su IA. Kagari, Leskinen y la guerra del 2036 lo devuelven a ' +
      'la lucha por la Steins Gate.',
    capitulos: 'T3',
  },
];
