// META - High School of the Dead
//
// TVDB 171591 "学園黙示録 HIGHSCHOOL OF THE DEAD" (2010, Ended).
// La serie va en S1 y el OVA en Specials (S0E1). El videoclip no
// entra.
// AniList 8074 (T1, 2010, 12) y 9515 (T2 OVA Drifters, 2011).
// IMDb tt1685401 (el OVA dentro como S1E13).
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'High School of the Dead',

  japaneseTitle: '学園黙示録HIGHSCHOOL OF THE DEAD',

  synopsis:
    'El instituto cae en un recreo y Takashi huye con Rei, Saeko, Saya, Kouta, Shizuka y Alice. ' +
    'Entre katanas, francotiradores y un profe con culto propio, el grupo sobrevive a mordiscos. ' +
    'Serie y OVA de MADHOUSE con zombis y ecchi sin verguenza.',

  anio: 2010,
  estado: 'finished',
  estudio: 'MADHOUSE',

  // Accion de zombis con instituto y ecchi: bichos y risas. Son
  // dos.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Terror', 'Zombis', 'Escolar', 'Drama', 'Ecchi', 'Romance', 'Sobrenatural', 'Supervivencia', 'Apocalipsis'],
};

export const ANIME_ID = 'high-school-of-the-dead';

/**
 * Unos titulos con titulo oficial en ingles.
 *
 * Hasta el japones es ingles aqui: TVDB lista los capitulos en
 * ingles y AniList tambien. La bandera le dice a
 * `comprobar-datos.mjs` que no exija kanji ni kana, igual que Burn
 * the Witch.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt1685401: 7,1 con unos
 * 18.800 votos. El T1 E7 es lo mejor con 7,4.
 */
export const RATING_SERIE = 7.1;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   12  (julio - septiembre de 2010, serie)
 *   T2    1  (abril de 2011, OVA Drifters)
 *   --
 *        13
 */
export const EPISODIOS_TOTAL = 13;

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
    anio: 2010,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Doce capitulos entre el 5 de julio y el 20 de septiembre de 2010. ' +
      'El grupo huye del instituto entre katanas, francotiradores y cultos de profe. ' +
      'Cierre con todos los muertos encima del refugio.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Drifters of the Dead',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Un capitulo del 26 de abril de 2011, salido con el tomo 7. ' +
      'Isla tropical con las chicas en bañador y muertos de propina. ' +
      'Extra ventilado entre serie y nada.',
    capitulos: 'T2',
  },
];
