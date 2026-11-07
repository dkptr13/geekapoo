// META - The Tunnel to Summer, the Exit of Goodbyes
//
// AniList 142769 (peli, 2022, 83 minutos).
// IMDb tt17382524.
// TVDB la tiene como peli suelta (movie 339405), sin arte de
// episodio: el capitulo va sin miniatura.
//
// El titulo ingles es el oficial en todo el mundo; en Espana se
// estreno como "El tunel de los deseos", pero el catalogo usa el
// nombre internacional.

export const ANIME = {
  titulo: 'The Tunnel to Summer, the Exit of Goodbyes',

  japaneseTitle: '夏へのトンネル、さよならの出口',

  synopsis:
    'Kaoru y Anzu descubren el tunel de Urashima, un pasadizo abandonado que concede cualquier deseo a cambio de un precio. ' +
    'El chico busca a su hermana desaparecida y la chica quiere una vida distinta. ' +
    'Juntos lo exploran durante un verano que no volvera.',

  anio: 2022,
  estado: 'finished',
  estudio: 'CLAP',

  // Romance fantastico con tunel que concede deseos: amor y precio
  // por cada uno. Son dos.
  categorias: ['Romance & Comedia', 'Fantasía & Aventura'],

  generos: ['Drama', 'Romance', 'Sobrenatural', 'Fantasía', 'Coming-of-age'],
};

export const ANIME_ID = 'the-tunnel-to-summer-the-exit-of-goodbyes';

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

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
export const ALIASES = [
  'Natsu e no Tonneru, Sayonara no Deguchi',
  'The Tunnel to Summer (2022)',
];

/**
 * Nota de la peli completa en IMDb, tt17382524: 7,2 con unos
 * 8.200 votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 7.2;

/**
 * Capitulos en total: la peli, del 9 de septiembre de 2022.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en Espana.
 *
 * Nada: JustWatch Espana no lista ninguna plataforma para la peli.
 * Hubo alquiler y compra digital, pero ahora mismo no esta en
 * streaming, asi que no se pone lo que no hay.
 */

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'CLAP',
    synopsis:
      'Ochenta y tres minutos del 9 de septiembre de 2022. ' +
      'Kaoru y Anzu entran en el tunel de Urashima buscando lo que les falta: la vuelta de una hermana y una salida de casa. ' +
      'Cada deseo tiene un precio y el verano se acaba.',
    capitulos: 'T1',
  },
];
