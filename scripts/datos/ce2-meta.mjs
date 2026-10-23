// LA FICHA DEL ANIME - Cyberpunk: Edgerunners Season 2
//
// Diez capitulos estrenados el 20 de octubre de 2026 en Netflix, en
// Studio Trigger para CD Projekt Red. Una historia independiente en
// Night City: un ex legendario edgerunner sin cromo y un nomada que
// busca venganza.
//
//   T1  10 capitulos  (octubre de 2026)
//
// Ficha de AniList: 195539.
// IMDb tt12590266: 8,3 con unos 139.000 votos (serie completa).
// No está en TVDB todavía.

export const ANIME = {
  titulo: 'Cyberpunk: Edgerunners Season 2',

  japaneseTitle: 'サイバーパンク: エッジランナーズ2',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Weak es un ex legendario sin cromo y D es un nomada
  // que busca venganza.
  synopsis:
    'En Night City, Weak Kingsley es un ex legendario edgerunner que ' +
    'ahora vive sin cromo y busca un propósito en un mundo que lo ha ' +
    'dejado atrás. D, un nomada letal, busca venganza por la masacre ' +
    'de su clan. Sus caminos se cruzan cuando un datashard de Arasaka ' +
    'los pone en el punto de mira de las megacorporaciones. Diez ' +
    'capítulos de familia, obsesión y legado, con un final que no ' +
    'deja indiferente.',

  anio: 2026,
  estado: 'finished',
  estudio: 'Studio Trigger',

  // Ciencia ficción cyberpunk con fondo de tragedia y acción.
  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico'],

  generos: ['Cyberpunk', 'Acción', 'Sci-Fi', 'Tragedia', 'Drama'],
};

export const ANIME_ID = 'cyberpunk-edgerunners-season-2';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés, el romanizado y los sinónimos que de verdad se
// usan. Los escribe el agente que añade el anime, a mano, y se guardan
// en "alternativeTitles" del documento de Firestore, que es lo que la
// búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Cyberpunk: Edgerunners 2',
  'CE2',
];

/**
 * Nota de la serie en IMDb (tt12590266, temporada 2): 8,6 con unos
 * 139.000 votos (serie completa).
 *
 * El capítulo 8 (Serce) llega al 9,2 y el 10 al 9,1.
 */
export const RATING_SERIE = 8.6;

/**
 * Capítulos en total.
 *
 *   T1  10  (octubre de 2026)
 *   ---
 *       10
 */
export const EPISODIOS_TOTAL = 10;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> estreno mundial, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Studio Trigger',
    synopsis:
      'Diez capítulos estrenados el 20 de octubre de 2026 en Netflix, en Studio Trigger ' +
      'para CD Projekt Red. Weak Kingsley, un ex legendario edgerunner que vive sin cromo, ' +
      'y D, un nomada que busca venganza, se cruzan por un datashard de Arasaka. De aquí ' +
      'salen la masacre del clan Snake Nation, la posesión de Capri y el combate final ' +
      'contra las megacorporaciones.',
    capitulos: 'T1',
  },
];
