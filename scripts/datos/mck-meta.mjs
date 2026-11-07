// LA FICHA DEL ANIME - Mieruko-chan
//
// Doce capitulos del 3 de octubre al 19 de diciembre de 2021, en Passione
// para AT-X. Una chica que ve fantasmas y finge no verlos para sobrevivir.
//
// Ficha de AniList: 131083.
// TVDB: serie 399121, con la temporada 1.
// IMDb tt14271890: 7,1 con unos 3.700 votos.

export const ANIME = {
  titulo: 'Mieruko-chan',

  japaneseTitle: '見える子ちゃん',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Miko ve fantasmas y finge no verlos.
  synopsis:
    'Miko Yotsuya es una estudiante normal que un día empieza a ver ' +
    'fantasmas. Para sobrevivir, finge no verlos, pero los espíritus ' +
    'se acercan cada vez más. Doce capítulos de horror y comedia, con ' +
    'una chica que sonríe mientras por dentro grita.',

  anio: 2021,
  estado: 'finished',
  estudio: 'Passione',

  // Horror y comedia con fondo de sobrenatural.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio'],

  generos: ['Terror', 'Comedia', 'Sobrenatural', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'mieruko-chan';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés con el año. Los escribe el agente que añade
// el anime, a mano, y se guardan en "alternativeTitles" del documento
// de Firestore, que es lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Mieruko-chan (2021)',
];

/**
 * Nota de la serie en IMDb (tt14271890): 7,1 con unos 3.700 votos.
 *
 * El capítulo 11 (She Looks) llega al 8,2. El 9 (Things She's Seen
 * Before) baja a un 6,9.
 */
export const RATING_SERIE = 7.1;

/**
 * Capítulos en total.
 *
 *   T1  12  (octubre - diciembre de 2021)
 *   ---
 *       12
 */
export const EPISODIOS_TOTAL = 12;

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
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Passione',
    synopsis:
      'Doce capítulos del 3 de octubre al 19 de diciembre de 2021, en Passione para AT-X. ' +
      'Miko ve fantasmas y finge no verlos. De aquí salen el encuentro con los espíritus, ' +
      'la amistad con Hana y Yulia, y el final.',
    capitulos: 'T1',
  },
];
