// LA FICHA DEL ANIME - Haikyuu!!
//
// Shouyou Hinata ve en television a un jugador al que apodan el
// Pequeño Gigante y decide montar un club de voleibol en su instituto.
// La primera temporada va de abril a septiembre de 2014, en Production
// I.G, y termina con la derrota de Karasuno en el Intercolegial.
//
// El manga de Haruichi Furudate salio entre 2012 y 2020 en la
// Weekly Shonen Jump. La serie tiene cuatro temporadas; las
// peliculas van en fichas aparte.
//
// Los datos de la serie en IMDb son tt3398540: 8,7 con unos
// 57.000 votos. Los capitulos van del 7,7 al 9,4: lo mas alto
// es el capitulo veinticuatro (9,4), el final de la final.

export const ANIME = {
  titulo: 'Haikyuu!!',

  // La grafia oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'ハイキュー!!',

  // Base: la sinopsis de AniList (20464) y el argumento de la
  // temporada, en castellano.
  synopsis:
    'Shouyou Hinata, de un metro cincuenta y pico, revive el club de voleibol de su instituto ' +
    'despues de ver al Pequeño Gigante jugar. Junto a Tobio Kageyama, un colocador prodigio con ' +
    'el que no sabe llevarse, y un equipo de veteranos y novatos, Karasuno intenta volver a las ' +
    'nacionales. Lo que se juega en la pista no es solo el tanto: es lo que cada uno esta ' +
    'dispuesto a sacrificar por el resto.',
  anio: 2014,
  estado: 'finished',
  estudio: 'Production I.G',

  // Competitivo de instituto con el caracter de sus personajes y
  // el peso de la amistad: accion y drama psicologico.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Deportes', 'Voleibol', 'Equipo', 'Amistad', 'Competencia', 'Comedia', 'Drama', 'Shonen'],
};

export const ANIME_ID = 'haikyuu';

/**
 * Nota de la serie en IMDb (tt3398540): 8,7 con unos 57.000 votos.
 */
export const RATING_SERIE = 8.7;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   25  (abril - septiembre de 2014)
 *   T2   25  (octubre de 2015 - marzo de 2016)
 *   T3   10  (octubre - diciembre de 2016)
 *   T4   25  (enero - diciembre de 2020)
 *   --
 *        85
 */
export const EPISODIOS_TOTAL = 85;

/**
 * El titulo japones del capitulo 3 de la tercera temporada es
 * "GUESS・MONSTER", tal cual lo publica la Wikipedia: el titulo
 * oficial no tiene kanji ni kana. Para no inventar una transcripcion,
 * se guarda el original y se salta la comprobacion de escritura, igual
 * que en Tokyo Revengers.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie (ficha de crunchyroll.com).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco capitulos del 5 de abril al 21 de septiembre de 2014, en Production I.G. ' +
      'Hinata monta el club de voleibol de Karasuno con un equipo que no tiene nada, y se cruza ' +
      'con Kageyama, el mejor jugador que ha visto, que juega solo y no sabe hacer otra cosa. ' +
      'Contra Date Tech y Aoba Johsai, Karasuno aprende a jugar con el toque de Hinata y a no ' +
      'rendirse. Cierra con la derrota en el Intercolegial y con un equipo que ya no es el mismo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco capitulos del 4 de octubre de 2015 al 27 de marzo de 2016, en Production I.G. ' +
      'Karasuno vuelve a la competicion tras la derrota contra Seijoh: campamento de Nekoma, ' +
      'la llegada de Yachi y el partido de primavera contra el mismo rival.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Diez capitulos del 8 de octubre al 10 de diciembre de 2016, en Production I.G. Es el ' +
      'especial de Shiratorizawa: Karasuno se juega el billete a las nacionales contra el ' +
      'equipo de Ushijima, el mejor atacante de la prefektura.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veinticinco capitulos del 11 de enero al 19 de diciembre de 2020, en Production I.G. ' +
      'Es la cuarta temporada: el torneo de primavera, la llegada de los nuevos jugadores, ' +
      'Inarizaki y el esperado partido contra Nekoma en el basurero.',
    capitulos: 'T4',
  },
];
