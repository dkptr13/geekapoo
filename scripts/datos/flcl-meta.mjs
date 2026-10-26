// LA FICHA DEL ANIME - FLCL
//
// Seis capitulos de abril de 2000 a marzo de 2001, en Gainax/Production I.G
// para Adult Swim. Haruko llega a la ciudad y cambia la vida de Naota.
//
// Ficha de AniList: 227.
// TVDB: serie 78878, con la temporada 1.
// IMDb tt0279077: 8,0 con unos 22.000 votos.

export const ANIME = {
  titulo: 'FLCL',

  japaneseTitle: 'フリクリ',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Haruko llega a la ciudad y cambia la vida de Naota.
  synopsis:
    'Naota Nandaba es un niño de doce años que vive en una ciudad ' +
    'aburrida. Un día, Haruko Haruhara llega en su vespa y le golpea ' +
    'la cabeza con una guitarra. De la herida salen robots. Seis ' +
    'capítulos de ciencia ficción, comedia y coming-of-age, con una ' +
    'banda sonora del grupo Pillows.',

  anio: 2000,
  estado: 'finished',
  estudio: 'Gainax',

  // Ciencia ficción y comedia con fondo de coming-of-age.
  categorias: ['Ciencia Ficción & Futuro', 'Comedia & Slice of Life'],

  generos: ['Ciencia ficción', 'Comedia', 'Mecha', 'Coming-of-age', 'Seinen'],
};

export const ANIME_ID = 'flcl';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en japonés romanizado y los sinónimos que de verdad se
// usan. Los escribe el agente que añade el anime, a mano, y se
// guardan en "alternativeTitles" del documento de Firestore, que es
// lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Fooly Cooly',
  'FLCL (2000)',
];

/**
 * Nota de la serie en IMDb (tt0279077): 8,0 con unos 22.000 votos.
 *
 * El capítulo 6 (Furikura) llega al 8,6.
 */
export const RATING_SERIE = 8.0;

/**
 * Capítulos en total.
 *
 *   T1  6  (abril de 2000 - marzo de 2001)
 *   ---
 *       6
 */
export const EPISODIOS_TOTAL = 6;

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
    anio: 2000,
    estado: 'Finalizado',
    estudio: 'Gainax',
    synopsis:
      'Seis capítulos de abril de 2000 a marzo de 2001, en Gainax/Production I.G. ' +
      'Haruko llega a la ciudad y cambia la vida de Naota. De aquí salen los robots ' +
      'y el final.',
    capitulos: 'T1',
  },
];
