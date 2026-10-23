// LA FICHA DEL ANIME - Haikyuu!!
//
// Shouyou Hinata ve en television a un jugador al que apodan el
// Gigante y decide montar un club de voley en su instituto. La
// serie va de abril a septiembre de 2014, en Production I.G, y
// termina con la final del torneo de primavera.
//
// El manga de Haruichi Furudate salio entre 2011 y 2014 en la
// Weekly Shonen Jump. La serie tiene cuatro temporadas y una
// pelicula aparte, que no entran aqui.
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
    'Shouyou Hinata, de un metro cincuenta y pico, revive el club de voley de su instituto ' +
    'despues de ver al Gigante jugar. Recluta a un chico que juega solo, a un lateral que ' +
    'come sin parar y a un central que se pelea con todos. El equipo, formado por gente que ' +
    'nunca habia jugado, llega a la final del torneo de primavera y se encuentra de frente al ' +
    'mejor equipo del Japon. Lo que se juega en la pista no es solo el tanto: es lo que cada ' +
    'uno esta dispuesto a sacrificar por el resto.',
  anio: 2014,
  estado: 'finished',
  estudio: 'Production I.G',

  // Competitivo de instituto con el caracter de sus personajes y
  // el peso de la amistad: accion y drama psicologico.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Deportes', 'Voleibol', 'Equipo', 'Amistad', 'Competencia'],
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
 *   --
 *        25
 */
export const EPISODIOS_TOTAL = 25;

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
      'Hinata monta el club de voley de su instituto con un equipo que no tiene nada, y de ' +
      'paso por la mira a Kageyama, el mejor jugador que ha visto, que juega solo y no sabe ' +
      'hacer otra cosa. Contra Date Tech y Shiratorizawa, Karasuno aprende a jugar con el ' +
      'toque de Hinata y a no rendirse. Cierra con la final del torneo y con un equipo que ' +
      'ya no es el mismo.',
    capitulos: 'T1',
  },
];
