// LA FICHA DEL ANIME - Ranma 1/2
//
// Ciento sesenta y un capitulos en siete temporadas (abril de 1989 a
// septiembre de 1992), en Studio Deen para Fuji TV. Ranma Saotome se
// transforma en chica cuando le cae agua fria.
//
// Ficha de AniList: 210 (T1) y 149939 (T2-T7).
// TVDB: serie 76932, con las temporadas 1 a 7.
// IMDb tt0096686 (T1, 8,0) y tt0096685 (T2-T7, 8,1).

export const ANIME = {
  titulo: 'Ranma 1/2',

  japaneseTitle: 'らんま1/2',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Ranma se transforma en chica con agua fria.
  synopsis:
    'Ranma Saotome es un joven artista marcial que, tras caer en una ' +
    'fuente maldita, se transforma en chica cuando le cae agua fría y ' +
    'vuelve a ser chico con agua caliente. Comprometido con Akane ' +
    'Tendo, Ranma vive mil aventuras. Ciento sesenta y un capítulos de ' +
    'comedia, acción y artes marciales.',

  anio: 1989,
  estado: 'finished',
  estudio: 'Studio Deen',

  // Comedia y acción con fondo de artes marciales.
  categorias: ['Comedia & Slice of Life', 'Shonen & Acción'],

  generos: ['Comedia', 'Acción', 'Artes marciales', 'Romance', 'Shonen', 'Ecchi', 'Recuentos de la vida', 'Harem'],
};

export const ANIME_ID = 'ranma-1-2';

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
  'Ranma ½',
  'Ranma 1/2 (1989)',
];

/**
 * Nota de la serie en IMDb: 8,1 con unos 2.300 votos (Nettou-hen).
 * La primera temporada tiene un 8,0.
 */
export const RATING_SERIE = 8.1;

/**
 * Capítulos en total.
 *
 *   T1  18  (abril - septiembre de 1989)
 *   T2  22  (octubre de 1989 - abril de 1990)
 *   T3  24  (abril - octubre de 1990)
 *   T4  24  (octubre de 1990 - abril de 1991)
 *   T5  24  (abril - septiembre de 1991)
 *   T6  24  (septiembre de 1991 - abril de 1992)
 *   T7  25  (abril - septiembre de 1992)
 *   ---
 *       161
 */
export const EPISODIOS_TOTAL = 161;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  { numero: 1, titulo: '', anio: 1989, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Dieciocho capítulos de abril a septiembre de 1989, en Studio Deen para Fuji TV. Ranma llega a la familia Tendo y se adapta a su nueva vida con Akane y sus hermanas.', capitulos: 'T1' },
  { numero: 2, titulo: '', anio: 1989, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Veintidós capítulos de octubre de 1989 a abril de 1990, en Studio Deen para Fuji TV. Ranma sigue adaptándose a su nueva vida con Akane y sus nuevos rivales.', capitulos: 'T2' },
  { numero: 3, titulo: '', anio: 1990, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Veinticuatro capítulos de abril a octubre de 1990, en Studio Deen para Fuji TV. Nuevos rivales y aventuras para Ranma y Akane en su día a día con más personajes.', capitulos: 'T3' },
  { numero: 4, titulo: '', anio: 1990, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Veinticuatro capítulos de octubre de 1990 a abril de 1991, en Studio Deen para Fuji TV. Ranma sigue con sus aventuras y rivalidades con nuevos personajes y situaciones.', capitulos: 'T4' },
  { numero: 5, titulo: '', anio: 1991, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Veinticuatro capítulos de abril a septiembre de 1991, en Studio Deen para Fuji TV. Nuevos personajes y aventuras para Ranma y sus amigos en la escuela.', capitulos: 'T5' },
  { numero: 6, titulo: '', anio: 1991, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Veinticuatro capítulos de septiembre de 1991 a abril de 1992, en Studio Deen para Fuji TV. Ranma sigue con sus aventuras y rivalidades diarias con más enemigos.', capitulos: 'T6' },
  { numero: 7, titulo: '', anio: 1992, estado: 'Finalizado', estudio: 'Studio Deen',
    synopsis: 'Veinticinco capítulos de abril a septiembre de 1992, en Studio Deen para Fuji TV. El final de la serie de Ranma y sus aventuras con todos sus amigos y rivales.', capitulos: 'T7' },
];
