// LA FICHA DEL ANIME - Naruto Shippuden
//
// Quinientos capitulos del 15 de febrero de 2007 al 23 de marzo de 2017, en
// Pierrot para TV Tokyo. La segunda parte de Naruto: la guerra entre las
// cinco grandes naciones, la muerte de Jiraiya, el regreso de Sasuke y la
// caida de Madara.
//
//   T1  500 capitulos  (febrero de 2007 - marzo de 2017)
//
// Ficha de AniList: 1735.
// TVDB: serie 79824, con las temporadas oficiales 0 a 22. La 0 tiene las
// OVAs, las peliculas y los especiales, que no entran en el catalogo; las
// 1 a 22 son los capitulos de la serie.
// IMDb tt0988824: 8,7 con unos 233.000 votos.
//
// El titulo japones es el nativo de AniList: NARUTO -ナルト- 疾風伝.

export const ANIME = {
  titulo: 'Naruto Shippuden',

  japaneseTitle: 'NARUTO -ナルト- 疾風伝',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Es la segunda mitad de la saga: sietecientos veinte
  // capitulos contando los de la serie de 2002.
  synopsis:
    'Naruto Shippuden son los quinientos capitulos de la segunda parte de Naruto, la que va ' +
    'de 2007 a 2017: la guerra entre las cinco grandes naciones, la muerte de Jiraiya, el ' +
    'regreso de Sasuke y la caida de Madara. Empieza con un crio que vuelve a su aldea tras ' +
    'dos años y medio de entrenamiento con un maestro que no sabe callar un secreto, y ' +
    'termina con una boda y con el final de la guerra. Es la historia de un muchacho que ' +
    'empezo buscando que lo quisieran y acabo protegiendo a los suyos.',

  anio: 2007,
  estado: 'finished',
  estudio: 'Pierrot',

  // Shonen de accion con la mitad de su peso en la guerra, la familia y
  // el duelo: no es solo pelea, es gente que se quiere y se pierde.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Drama', 'Ninja', 'Militar'],
};

export const ANIME_ID = 'naruto-shippuden';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el diminutivo y el titulo en ingles con el año. Los escribe el agente
// que anade el anime, a mano, y se guardan en "alternativeTitles" del
// documento de Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El japones ya esta en japaneseTitle, asi que no se repite aqui.
export const ALIASES = [
  'Shippuden',
  'Naruto Shippuden (2007)',
  '火影忍者 疾风伝',
];

/**
 * Nota de la serie en IMDb (tt0988824): 8,7 con unos 233.000 votos.
 *
 * Sube desde el principio: el arranque de la invasion de Pain y el
 * final de la guerra están en el 9 o mas. Los capitulos de relleno
 * del tramo de la conquista de Konoha bajan a un 5 o 6, que es lo
 * habitual en una serie de este tamaño.
 */
export const RATING_SERIE = 8.7;

/**
 * Capitulos en total.
 *
 *   T1  500  (febrero de 2007 - marzo de 2017)
 *   ---
 *       500
 *
 * Las OVAs, las peliculas y los especiales van en la temporada 0 de TVDB
 * y no entran: no son capitulos de la serie.
 */
export const EPISODIOS_TOTAL = 500;

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
    anio: 2007,
    estado: 'Finalizado',
    estudio: 'Pierrot',
    synopsis:
      'Quinientos capitulos del 15 de febrero de 2007 al 23 de marzo de 2017, en Pierrot para ' +
      'TV Tokyo. Naruto vuelve de dos años y medio de entrenamiento con Jiraiya y se topa con ' +
      'una aldea que ya no es la que dejo: Gaara es Kazekage, los Akatsuki se mueven y ' +
      'Sasuke no vuelve. De aqui salen la invasion de Pain, la guerra de las cinco naciones, ' +
      'la muerte del maestro, el regreso de Sasuke y el combate final contra Madara.',
    capitulos: 'T1',
  },
];
