// LA FICHA DEL ANIME - Hell's Paradise
//
// Veinticinco capitulos del 1 de abril de 2023 al 29 de marzo de 2026, en
// MAPPA para TV Tokyo. Un ninja condenado a muerte y una verduga van a una
// isla misteriosa a buscar el elixir de la vida, y alli se encuentran
// con criminales, monstruos y seres inmortales.
//
//   T1  13 capitulos  (abril - julio de 2023)
//   T2  12 capitulos  (enero - marzo de 2026)
//
// Ficha de AniList: 128893 (T1) y 166613 (T2).
// TVDB: serie 402474, con las temporadas 0 (especiales), 1 y 2.
// IMDb tt13911284: 8,1 con unos 34.000 votos.

export const ANIME = {
  titulo: "Hell's Paradise",

  japaneseTitle: '地獄楽',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Gabimaru quiere volver con su mujer y Sagiri quiere
  // probar que una mujer puede ser verduga.
  synopsis:
    "Gabimaru, el ninja más temido de Iwagakure, está condenado a muerte y acepta una " +
    "oferta del shogun: traer el elixir de la vida desde una isla misteriosa y será " +
    "perdonado. La verduga Yamada Asaemon Sagiri lo acompaña, y en la isla se encuentran " +
    "con otros condenados, con criaturas que no son humanas y con los seres inmortales " +
    "que gobiernan el lugar. Dos temporadas de peleas, traiciones y un elixir que nadie " +
    "sabe si existe.",

  anio: 2023,
  estado: 'finished',
  estudio: 'MAPPA',

  // Acción oscura con fondo de supervivencia y horror: no apta para
  // todos los públicos, pero con un corazón que late debajo.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Fantasía', 'Horror', 'Ninja', 'Supervivencia'],
};

export const ANIME_ID = 'hell-s-paradise';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés completo y el romanizado. Los escribe el agente
// que añade el anime, a mano, y se guardan en "alternativeTitles" del
// documento de Firestore, que es lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  "Hell's Paradise: Jigokuraku",
  'Jigokuraku',
  "Hell's Paradise (2023)",
];

/**
 * Nota de la serie en IMDb (tt13911284): 8,1 con unos 34.000 votos.
 *
 * La primera temporada se queda en un 8,2 de media; la segunda sube
 * al 8,7, con el capítulo 7 en un 9,2.
 */
export const RATING_SERIE = 8.1;

/**
 * Capítulos en total.
 *
 *   T1  13  (abril - julio de 2023)
 *   T2  12  (enero - marzo de 2026)
 *   ---
 *       25
 */
export const EPISODIOS_TOTAL = 25;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> las dos temporadas, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Trece capítulos del 1 de abril al 1 de julio de 2023, en MAPPA para TV Tokyo. ' +
      'Gabimaru llega a la isla con Sagiri y se topa con otros condenados, con criaturas ' +
      'que no son humanas y con los Tensen, seres inmortales que gobiernan el lugar. ' +
      'De aquí salen la pelea contra Rokurota, el encuentro con los Tensen y la ' +
      'revelación de que el elixir no es lo que parece.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'Doce capítulos del 11 de enero al 29 de marzo de 2026. La expedición de rescate ' +
      'llega a la isla con Shugen Yamada Asaemon al frente, y los supervivientes del ' +
      'primer grupo se enfrentan a los Tensen en el palacio de Horai. Cierra la historia ' +
      'con el combate final contra Ran y el regreso de los que quedan.',
    capitulos: 'T2',
  },
];
