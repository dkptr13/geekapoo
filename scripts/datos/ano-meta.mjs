// LA FICHA DEL ANIME - Another
//
// Doce capitulos del 10 de enero al 27 de marzo de 2012, en P.A. Works
// para Tokyo MX. Un chico que se muda a un pueblo maldito y que
// descubre que su clase esconde un secreto mortal.
//
// Ficha de AniList: 11111.
// TVDB: serie 254349, con las temporadas 0 (especiales) y 1.
// IMDb tt2176165: 7,5 con unos 23.000 votos.

export const ANIME = {
  titulo: 'Another',

  japaneseTitle: 'アナザー',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Kouichi llega a Yomiyama y se topa con una maldicion
  // que mata a los alumnos de la clase 3-3.
  synopsis:
    'Kouichi Sakakibara se muda a Yomiyama, el pueblo donde nació, y ' +
    'entra en la clase 3-3 del instituto. Allí conoce a Mei Misaki, una ' +
    'chica con un parche en el ojo que todos los demás ignoran. Poco a ' +
    'poco descubre que su clase está maldita: cada año muere un alumno ' +
    'o un familiar, y la única forma de pararlo es encontrar al "extra", ' +
    'el muerto que se hace pasar por vivo. Doce capítulos de terror ' +
    'psicológico, muertes violentas y un secreto que nadie quiere contar.',

  anio: 2012,
  estado: 'finished',
  estudio: 'P.A. Works',

  // Thriller y misterio con fondo de horror psicológico.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Terror', 'Misterio', 'Psicológico', 'Sobrenatural', 'Escolar', 'Thriller', 'Tragedia', 'Supervivencia'],
};

export const ANIME_ID = 'another';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés con el año. Los escribe el agente que añade
// el anime, a mano, y se guardan en "alternativeTitles" del documento
// de Firestore, que es lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Another (2012)',
];

/**
 * Nota de la serie en IMDb (tt2176165): 7,5 con unos 23.000 votos.
 *
 * El capítulo 11 (Makeup) llega al 7,9. El 8 (Konpeki) baja a un 6,9.
 */
export const RATING_SERIE = 7.5;

/**
 * Capítulos en total.
 *
 *   T1  12  (enero - marzo de 2012)
 *   ---
 *       12
 *
 * El OVA "The Other - Inga" no entra: es una obra aparte.
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'P.A. Works',
    synopsis:
      'Doce capítulos del 10 de enero al 27 de marzo de 2012, en P.A. Works para Tokyo MX. ' +
      'Kouichi llega a Yomiyama y se topa con una maldición que mata a los alumnos de la ' +
      'clase 3-3. De aquí salen el encuentro con Mei, el descubrimiento del "extra", el ' +
      'viaje a la posada y el final en la biblioteca.',
    capitulos: 'T1',
  },
];
