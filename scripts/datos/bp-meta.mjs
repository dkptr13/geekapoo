// LA FICHA DEL ANIME - Blood+
//
// Cincuenta capitulos en cuatro temporadas (octubre de 2005 a septiembre
// de 2006), en Production I.G para MBS. Saya Otonashi lucha contra los
// quimeras con su espada.
//
// Ficha de AniList: 150.
// TVDB: serie 78960, con las temporadas 1 a 4.
// IMDb tt0482855: 7,5 con unos 5.300 votos.

export const ANIME = {
  titulo: 'Blood+',

  japaneseTitle: 'BLOOD+',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Saya lucha contra los quimeras.
  synopsis:
    'Saya Otonashi es una chica normal que un día descubre que es la ' +
    'única capaz de derrotar a los quimeras, monstruos que se alimentan ' +
    'de sangre humana. Junto a su familia adoptiva y Haji, lucha por ' +
    'salvar el mundo. Cincuenta capítulos de acción, horror y drama.',

  anio: 2005,
  estado: 'finished',
  estudio: 'Production I.G',

  // Acción y horror con fondo de drama.
  categorias: ['Shonen & Acción', 'Thriller & Misterio'],

  generos: ['Acción', 'Terror', 'Drama', 'Vampiros', 'Shonen', 'Misterio', 'Sobrenatural', 'Demonios'],
};

export const ANIME_ID = 'blood';

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
  'Blood+ (2005)',
];

/**
 * Nota de la serie en IMDb (tt0482855): 7,5 con unos 5.300 votos.
 */
export const RATING_SERIE = 7.5;

/**
 * Capítulos en total.
 *
 *   T1  13  (octubre de 2005 - enero de 2006)
 *   T2  12  (enero - abril de 2006)
 *   T3  13  (abril - julio de 2006)
 *   T4  12  (julio - septiembre de 2006)
 *   ---
 *       50
 */
export const EPISODIOS_TOTAL = 50;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  { numero: 1, titulo: '', anio: 2005, estado: 'Finalizado', estudio: 'Production I.G',
    synopsis: 'Trece capítulos de octubre de 2005 a enero de 2006, en Production I.G para MBS. Saya descubre su verdadera naturaleza y comienza a luchar contra los quimeras.', capitulos: 'T1' },
  { numero: 2, titulo: '', anio: 2006, estado: 'Finalizado', estudio: 'Production I.G',
    synopsis: 'Doce capítulos de enero a abril de 2006, en Production I.G para MBS. Saya sigue luchando contra los quimeras y descubre más sobre su pasado y su familia.', capitulos: 'T2' },
  { numero: 3, titulo: '', anio: 2006, estado: 'Finalizado', estudio: 'Production I.G',
    synopsis: 'Trece capítulos de abril a julio de 2006, en Production I.G para MBS. La batalla se intensifica y el final se acerca para Saya y todos sus amigos y aliados.', capitulos: 'T3' },
  { numero: 4, titulo: '', anio: 2006, estado: 'Finalizado', estudio: 'Production I.G',
    synopsis: 'Doce capítulos de julio a septiembre de 2006, en Production I.G para MBS. El final de Blood+ y la batalla final de Saya contra Diva y todos los quimeras.', capitulos: 'T4' },
];
