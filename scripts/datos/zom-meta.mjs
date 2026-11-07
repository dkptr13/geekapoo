// META - Zom 100: Bucket List of the Dead
//
// TVDB 429310 "ゾン100～ゾンビになるまでにしたい100のこと～"
// (2023, Ended). El especial previo y el recopilatorio de S0 no
// entran: programa y resumen, y aqui eso no entra.
// AniList 159831 (T1, 2023, 12 capitulos).
// IMDb tt25811262.
//
// El titulo en ingles es el oficial en todo el mundo (VIZ,
// Crunchyroll); el romanizado es larguisimo y nadie lo usa fuera
// de AniList.

export const ANIME = {
  titulo: 'Zom 100: Bucket List of the Dead',

  japaneseTitle: 'ゾン100～ゾンビになるまでにしたい100のこと～',

  synopsis:
    'Akira es oficinista explotado hasta que los zombis toman la ciudad: por fin no hay que currar. ' +
    'Con Kencho, Shizuka y Beatrix por bandera escribe 100 cosas que hacer antes de morir y va tachando. ' +
    'Entre sushi, termas y tiburon zombi, el fin del mundo es la primera fiesta de su vida.',

  anio: 2023,
  estado: 'finished',
  estudio: 'BUG FILMS',

  // Accion comica con zombis y satira de empresa negrera: accion
  // shonen y mala leche adulta. Son dos.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Comedia', 'Terror', 'Zombis', 'Aventura', 'Sobrenatural', 'Apocalipsis', 'Supervivencia'],
};

export const ANIME_ID = 'zom-100-bucket-list-of-the-dead';

/**
 * Nota de la serie completa en IMDb, serie tt25811262: 7,3 con unos
 * 14.000 votos. El 1 es lo mejor con 8,7.
 */
export const RATING_SERIE = 7.3;

/**
 * Capitulos en total.
 *
 *   T1  12  (julio - diciembre de 2023, con los tres ultimos
 *            retrasados a Navidad por problemas de produccion)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 *   Netflix la tuvo y la retiro en 2025: no se pone lo que ya no esta.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'BUG FILMS',
    synopsis:
      'Doce capitulos entre el 9 de julio y el 26 de diciembre de 2023, con los tres ultimos retrasados a Navidad. ' +
      'Akira celebra el apocalipsis con lista de 100 deseos: Kencho, Shizuka y Beatrix se apuntan entre sushi, termas y pueblo. ' +
      'Cierra con tiburon zombi y la lista sin terminar.',
    capitulos: 'T1',
  },
];
