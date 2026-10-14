// META - Smoking Behind the Supermarket with You
//
// TVDB 483430 "スーパーの裏でヤニ吸うふたり" (2026, Ended; la
// 465973 esta vacia y es duplicada). Los minis de S0 no entran:
// cortos, y aqui eso no entra.
// AniList 196187 (T1, 2026, 12 capitulos).
// IMDb tt37614297.
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Smoking Behind the Supermarket with You',

  japaneseTitle: 'スーパーの裏でヤニ吸うふたり',

  synopsis:
    'Sasaki, currante quemado, fuma detras del super con Tayama para salvar los dias. ' +
    'Con Yamada la cajera mirando de lejos entre turnos y pitillos compartidos. ' +
    'Doce capitulos de Asahi Production con humo y descanso.',

  anio: 2026,
  estado: 'finished',
  estudio: 'Asahi Production',

  // Romance adulto de curro con pitillos: amor de descanso y
  // turnos. Son dos.
  categorias: ['Romance & Comedia', 'Seinen & Psicológico'],

  generos: ['Comedia', 'Romance', 'Recuentos de la vida', 'Curro'],
};

export const ANIME_ID = 'smoking-behind-the-supermarket-with-you';

/**
 * Nota de la serie completa en IMDb, serie tt37614297: 8,1 con unos
 * 3.800 votos. El 6 es lo mejor con 8,7.
 */
export const RATING_SERIE = 8.1;

/**
 * Capitulos en total.
 *
 *   T1  12  (julio - septiembre de 2026)
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
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Asahi Production',
    synopsis:
      'Doce capitulos entre el 9 de julio y el 24 de septiembre de 2026. ' +
      'Sasaki fuma con Tayama detras del super mientras Yamada aprende mirando. ' +
      'Cierre con pitillo y promesa de seguir mañana tambien.',
    capitulos: 'T1',
  },
];
