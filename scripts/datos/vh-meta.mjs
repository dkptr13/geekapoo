// META - Viral Hit
//
// TVDB 445964 "喧嘩独学" (2024, Ended). La entrada 473231 es una
// segunda temporada de 2026 que en AniList no existe y aqui no
// entra hasta tener fuente.
// AniList 174653 (T1, 2024, 12 capitulos).
// IMDb tt31975855 (la tt39400589 es esa T2 de 2026).
//
// El titulo en ingles es el oficial en todo el mundo
// (Crunchyroll); el romanizado es el japones del webtoon coreano.

export const ANIME = {
  titulo: 'Viral Hit',

  japaneseTitle: '喧嘩独学',

  synopsis:
    'Hobin es flaco, pobre y acosado hasta que cuelga una pelea y se hace viral en NewTube. ' +
    'Con Ji-Hyeok grabando y un pollo enmascarado enseñando, convierte los matones en sueldo para el hospital de su madre. ' +
    'Peleas callejeras retransmitidas donde cada directo puede ser el ultimo.',

  anio: 2024,
  estado: 'finished',
  estudio: 'Slow Curve',

  // Peleas callejeras con comedia de directos y fondo de acoso y
  // dinero: accion shonen con mala leche adulta. Son dos.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Comedia', 'Escolar'],
};

export const ANIME_ID = 'viral-hit';

/**
 * Nota de la serie completa en IMDb, serie tt31975855: 7,1 con unos
 * 1.600 votos. El 8 es lo mejor con 8,8.
 */
export const RATING_SERIE = 7.1;

/**
 * Capitulos en total.
 *
 *   T1  12  (abril - junio de 2024)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

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
    estudio: 'Slow Curve',
    synopsis:
      'Doce capitulos entre el 11 de abril y el 27 de junio de 2024. ' +
      'Hobin pasa de acosado a viral a base de directos, con Ji-Hyeok de camara y Samdak de maestro enmascarado. ' +
      'Cierra con el canal en lo alto, Ga-Eul a salvo y la felicidad retransmitiendose.',
    capitulos: 'T1',
  },
];
