// LA FICHA DEL ANIME - Sakamoto Days
//
// Veintidos capitulos del 11 de enero al 23 de septiembre de 2025, en TMS
// Entertainment para TV Tokyo. Un ex asesino a sueldo convertido en
// tendero de barrio, obeso y pacifico, que vuelve a la accion cuando
// el pasado lo busca.
//
//   T1  22 capitulos  (enero - septiembre de 2025)
//
// Ficha de AniList: 177709 (Part 1) y 184237 (Part 2).
// TVDB: serie 423732, con las temporadas 1 y 2.
// IMDb tt17069148: 7,5 con unos 18.500 votos.

export const ANIME = {
  titulo: 'Sakamoto Days',

  japaneseTitle: 'SAKAMOTO DAYS',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Sakamoto era el mejor asesino del mundo y ahora vende
  // pasteles en una tienda de barrio. El pasado no se queda quieto.
  synopsis:
    'Taro Sakamoto era el asesino a sueldo más temido del hampa. Se retiró, se casó ' +
    'con Aoi, tuvo una hija y engordó hasta ser irreconocible. Abrió una tienda de ' +
    'barrio y vive en paz hasta que el gremio pone una recompensa de mil millones de ' +
    'yenes por su cabeza. Entonces vuelven los viejos compañeros, los asesinos ' +
    'amateurs y los laboratorios secretos, y Sakamoto tiene que proteger a su ' +
    'familia sin que su mujer se entere de nada. Acción y comedia en partes iguales.',

  anio: 2025,
  estado: 'finished',
  estudio: 'TMS Entertainment',

  // Acción y comedia con un protagonista que no quiere pelear pero
  // siempre acaba haciéndolo.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Comedia', 'Ninja', 'Asesinos'],
};

export const ANIME_ID = 'sakamoto-days';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el diminutivo y el título en inglés con el año. Los escribe el agente
// que añade el anime, a mano, y se guardan en "alternativeTitles" del
// documento de Firestore, que es lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Sakamoto',
  'Sakamoto Days (2025)',
];

/**
 * Nota de la serie en IMDb (tt17069148): 7,5 con unos 18.500 votos.
 *
 * El primer capítulo llega al 7,9. La segunda parte baja un poco, con
 * el 13 en un 7,3.
 */
export const RATING_SERIE = 7.5;

/**
 * Capítulos en total.
 *
 *   T1  22  (enero - septiembre de 2025)
 *   ---
 *       22
 */
export const EPISODIOS_TOTAL = 22;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la serie completa, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Veintidós capítulos del 11 de enero al 23 de septiembre de 2025, en TMS Entertainment ' +
      'para TV Tokyo. Sakamoto vive en paz con su tienda hasta que el gremio pone una ' +
      'recompensa por su cabeza. De aquí salen el laboratorio, el casino, la JAA y el ' +
      'examen de asesinos.',
    capitulos: 'T1',
  },
];
