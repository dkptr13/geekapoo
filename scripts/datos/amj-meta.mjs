// META - BanG Dream! Ave Mujica
//
// TVDB 439765 "BanG Dream! Ave Mujica" (2025, Ended). La serie son
// trece capitulos, del 2 de enero al 27 de marzo de 2025. El especial
// S0E1 "BanG Dream! Ave Mujica prima aurora" (2026) es una pelicula
// posterior y no entra.
// AniList 169295 (T1, 2025, 13 capitulos).
// IMDb tt29135397.
//
// El titulo internacional de Crunchyroll es "Ave Mujica - The Die is
// Cast -", pero el catalogo usa el nombre de la franquicia.

export const ANIME = {
  titulo: 'BanG Dream! Ave Mujica',

  japaneseTitle: 'BanG Dream! Ave Mujica',

  synopsis:
    'Sakiko Togawa lo perdio todo en una sola noche y decide montar Ave Mujica, una banda de mascaras que convierte el dolor en espectaculo. ' +
    'Con Uika, Mutsumi, Umiri y Nyamu sobre el escenario, el grupo triunfa mientras cada una arrastra sus propias grietas.',

  anio: 2025,
  estado: 'finished',
  estudio: 'SANZIGEN',

  // Drama musical con mascaras, secretos y traumas: drama adulto joven
  // e intensidad psicologica. Son dos.
  categorias: ['Josei & Drama', 'Seinen & Psicológico'],

  generos: ['Drama', 'Música', 'Psicológico'],
};

/**
 * Los titulos de los capitulos son latinos y son los oficiales.
 *
 * No hay version japonesa: TVDB, Crunchyroll y la web de la serie los
 * listan tal cual ("Sub rosa.", "Exitus acta probat.", "Acta est
 * fabula."). Poner una traduccion al japones seria inventarla, asi que
 * el campo `titulo japones` lleva el titulo oficial y esta bandera le
 * dice a `comprobar-datos.mjs` que no exija kanji ni kana ahi.
 */
export const TITULOS_EN_INGLES = true;

export const ANIME_ID = 'bang-dream-ave-mujica';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles, el romanizado, el japones con otro criterio y
// los sinónimos que de verdad se usan. Los escribe el agente que anade
// el anime, a mano, y se guardan en "alternativeTitles" del documento de
// Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// La banda y la obra tienen distinto nombre: el grupo es Ave Mujica.
export const ALIASES = [
  'Ave Mujica',
  'BanG Dream! Ave Mujica -NEW-',
  'アヴェ・ムジカ',
];

/**
 * Nota de la serie completa en IMDb, tt29135397: 6,8 con unos
 * 350 votos. Los capitulos van del 7,9 al 8,9.
 */
export const RATING_SERIE = 6.8;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  13  (enero - marzo de 2025)
 *   --
 *       13
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite en Espana.
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
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'SANZIGEN',
    synopsis:
      'Trece capitulos del 2 de enero al 27 de marzo de 2025. ' +
      'Sakiko funda Ave Mujica tras perderlo todo y convierte el escenario en una mascara perfecta; Uika, Mutsumi, Umiri y Nyamu se suman a un juego donde cada deseo tiene un precio. ' +
      'La banda triunfa y las grietas empiezan a sonar.',
    capitulos: 'T1',
  },
];
