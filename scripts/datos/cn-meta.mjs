// META - Call of the Night
//
// TVDB 412374 "よふかしのうた" (2022, Ended). Las dos series van
// en S1 y S2; los minis de S0 no entran: cortos, y aqui eso no
// entra.
// AniList 141391 (T1, 2022, 13) y 175914 (T2, 2025, 12).
// IMDb tt15975122.
//
// El titulo en ingles es el oficial en España y Argentina.

export const ANIME = {
  titulo: 'Call of the Night',

  japaneseTitle: 'よふかしのうた',

  synopsis:
    'Kou, insomne, deja el instituto por la noche y Nazuna lo muerde por las buenas. ' +
    'Quiere ser vampiro, pero antes tiene que enamorarse de ella entre azoteas y edificios vacios. ' +
    'Dos temporadas de LIDENFILMS con la noche como casa.',

  anio: 2022,
  estado: 'finished',
  estudio: 'LIDENFILMS',

  // Comedia romantica sobrenatural con soledad de fondo: amor de
  // noche y existencialismo. Son dos.
  categorias: ['Romance & Comedia', 'Seinen & Psicológico'],

  generos: ['Comedia', 'Romance', 'Sobrenatural', 'Psicológico', 'Recuentos de la vida', 'Vampiros', 'Coming-of-age'],
};

export const ANIME_ID = 'call-of-the-night';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * El T2 E12 se titula "Call of the Night" hasta en TVDB y en
 * Japon: es el oficial y no hay version en japones. La bandera le
 * dice a `comprobar-datos.mjs` que no exija kanji ni kana, igual
 * que Masamune y Kage.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt15975122: 7,6 con unos
 * 8.400 votos. El T2 E8 y E10 son lo mejor con 9,3.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   13  (julio - septiembre de 2022, serie)
 *   T2   12  (julio - septiembre de 2025, Season 2)
 *   --
 *        25
 */
export const EPISODIOS_TOTAL = 25;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> las dos temporadas, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'LIDENFILMS',
    synopsis:
      'Trece capitulos entre el 8 de julio y el 30 de septiembre de 2022. ' +
      'Kou se hace nocturno con Nazuna y el grupo de vampiros por bandera. ' +
      'Cierra cantando la cancion de la serie.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'LIDENFILMS',
    synopsis:
      'Doce capitulos entre el 4 de julio y el 19 de septiembre de 2025. ' +
      'Anko al frente con Kiku y pasados que pesan, entre decisiones de humano o vampiro. ' +
      'Cierra con la llamada respondida.',
    capitulos: 'T2',
  },
];
