// META - Mirai Nikki
//
// TVDB 249827 "未来日記" (2011, Ended). La serie va en S1 y
// Redial en Specials (S0E2). El piloto y los chibis no entran:
// avance y cortos, y aqui eso no entra.
// AniList 10620 (T1, 2011, 26) y 16762 (T2 Redial, 2013).
// IMDb tt2069441 (Redial dentro como S1E27).
//
// El titulo corto es el oficial en todo el mundo ("The Future
// Diary" es la licencia en ingles).

export const ANIME = {
  titulo: 'Mirai Nikki',

  japaneseTitle: '未来日記',

  synopsis:
    'Yuki escribe su diario en el movil y un dios aburrido lo convierte en diario del futuro. ' +
    'Doce dueños a matarse por ser dios con Yuno, la novia yandere, pegada a el. ' +
    'Serie y Redial de moviles que matan con asread al frente.',

  anio: 2011,
  estado: 'finished',
  estudio: 'asread',

  // Thriller de diarios asesinos con dios aburrido: muerte y
  // cabeza. Son dos.
  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Acción', 'Misterio', 'Psicológico', 'Sobrenatural', 'Terror', 'Thriller', 'Supervivencia'],
};

export const ANIME_ID = 'mirai-nikki';

/**
 * Nota de la serie completa en IMDb, serie tt2069441: 7,4 con unos
 * 24.300 votos. El T1 E22 es lo mejor con 8,6.
 */
export const RATING_SERIE = 7.4;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   26  (octubre de 2011 - abril de 2012, serie)
 *   T2    1  (junio de 2013, OVA Redial)
 *   --
 *        27
 */
export const EPISODIOS_TOTAL = 27;

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
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'asread',
    synopsis:
      'Veintiseis capitulos entre el 9 de octubre de 2011 y el 15 de abril de 2012. ' +
      'Doce diarios a matarse por ser dios con Yuno pegada a Yuki. ' +
      'Cierra inicializando el mundo con valores de fabrica.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Redial',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'asread',
    synopsis:
      'Un capitulo del 19 de junio de 2013, salido con el tomo 11. ' +
      'Epilogo con Yuno llamando a otro mundo para no perderse. ' +
      'Rellamada que cierra el juego de dioses.',
    capitulos: 'T2',
  },
];
