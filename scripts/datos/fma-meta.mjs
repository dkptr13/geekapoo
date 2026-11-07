// LA FICHA DEL ANIME - Fullmetal Alchemist: Brotherhood
//
// Cuarenta y cuatro capítulos... no: sesenta y cuatro, repartidos entre
// abril de 2009 y julio de 2010, en Bones para MBS y NHK. La versión de
// 2003 se quedó en la serie original; esta rehace el manga entero con
// otro ritmo, otro reparto y un final que cierra la guerra de Ishval y la
// promete del día.
//
//   T1  64 capítulos  (abril de 2009 - julio de 2010)
//
// Ficha de AniList: 5114.
// TVDB: serie 85249, con la temporada 1 (los 64 capítulos) y la 0
// (las OVAs, el 4-koma y las películas, que no entran en el catálogo).
// IMDb tt1355642: 9,1 con unos 260.000 votos.
//
// El título japonés completo es 鋼の錬金術師 FULLMETAL ALCHEMIST, que en
// inglés es Fullmetal Alchemist: Brotherhood.

export const ANIME = {
  titulo: 'Fullmetal Alchemist: Brotherhood',

  japaneseTitle: '鋼の錬金術師 FULLMETAL ALCHEMIST',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano.
  synopsis:
    'Edward y Alphonse Elric tratan de recuperar los cuerpos que perdieron al ' +
    'intentar resucitar a su madre con la alquimia prohibida. Dois años y un viaje ' +
    'después, los hermanos son alquimistas del Estado y sirven en el ejército, con ' +
    'Edward como héroe del escudo y Alphonse como su gran hermano de acero. ' +
    'Entre la guerra de Ishval, la conspiración de los homúnculos y la piedra ' +
    'filosófica, la historia llega hasta el Prometido Día y el precio de salvar el mundo.',

  anio: 2009,
  estado: 'finished',
  estudio: 'Bones',

  // Shonen de acción con un fondo de drama militar y de enigmas: la
  // trama tiene más de Seinen que de aventura ligera.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Fantasía', 'Drama', 'Aventura', 'Militar', 'Shonen'],
};

export const ANIME_ID = 'fullmetal-alchemist-brotherhood';

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
// Ojo: "Fullmetal Alchemist" a secas es la serie de 2003, que es otra obra. Aqui va siempre con lo de "Brotherhood".
export const ALIASES = [
  'Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST',
  'FMA:B',
  'FMAB',
  'Fullmetal Alchemist: Brotherhood (2009)',
];

/**
 * Nota de la serie en IMDb (tt1355642): 9,1 con unos 260.000 votos.
 *
 * Los últimos capítulos son los mejor valorados: el 62 y el 63 se quedan
 * en 9,7 y el 60 en 9,4. El más flojo es el 27, el episodio en formato
 * recapitulación, con un 6,5.
 */
export const RATING_SERIE = 9.1;

/**
 * Capítulos en total.
 *
 *   T1  64  (abril de 2009 - julio de 2010)
 *   --
 *       64
 *
 * Los cuatro OVAs, el 4-koma y las dos películas quedan fuera: son
 * material extra, no capítulos de la serie.
 */
export const EPISODIOS_TOTAL = 64;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japón, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2009,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Sesenta y cuatro capítulos del 5 de abril de 2009 al 4 de julio de 2010, en Bones para ' +
      'MBS y NHK. Edward y Alphonse Elric trabajan como alquimistas del Estado y persiguen al ' +
      'alquimista libre, se separan, se reencuentran con Maes Hughes y Riza Hawkeye, y acaban ' +
      'en la fortaleza de Briggs, donde les espera el Prometido Día y el hombre que se ' +
      'aproxima a un dios.',
    capitulos: 'T1',
  },
];
