// META - Blue Box
//
// TVDB 429934 (アオのハコ, 2024, Continuing) tiene las dos temporadas.
// AniList 170942 (T1, 2024, 25 capitulos) y 189123 (T2, 2026, en
// emision). IMDb tt32639706: 8,0 con unos 9.900 votos.
//
// La T1 se emitio del 3 de octubre de 2024 al 27 de marzo de 2025 en
// Telecom Animation Film. La T2 empezo el 4 de octubre de 2026 en
// Electric Circus y el 20 de octubre de 2026 llevaba tres capitulos
// emitidos de los doce anunciados. Los tres son los que entran: los
// nueve que faltan no tienen titulo, fecha ni nota, y meterlos seria
// inventarlos.
//
// Los titulos japoneses de los capitulos salen de TVDB; los titulos,
// las fechas y las notas, de IMDb. Los resumenes son propios.
//
// El titulo de la serie es el oficial en todo el mundo, tambien en
// Espana. No se traduce.

export const ANIME = {
  titulo: 'Blue Box',

  // La grafia oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'アオのハコ',

  // Base: la sinopsis de AniList (170942) y el arranque de la serie,
  // en castellano.
  synopsis:
    'Taiki Inomata se levanta cada mañana antes que nadie para entrenar bádminton y, de paso, ver a ' +
    'Chinatsu Kano, la estrella del equipo de baloncesto. Ella es un curso mayor, todo el mundo la ' +
    'admira y Taiki sabe que está fuera de su alcance. Cuando un cambio de planes hace que Chinatsu ' +
    'acabe viviendo en su casa, los dos empiezan a conocerse de verdad. Entre torneos, entrenamientos ' +
    'y una convivencia incómoda, Taiki tendrá que decidir si persigue sus metas y qué lugar ocupa ' +
    'Chinatsu en ellas.',
  anio: 2024,
  estado: 'emitiendo',
  estudio: 'Telecom Animation Film',

  // Romance de instituto con el deporte como telon de fondo: la
  // categoria romantica y la escolar.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Deportes', 'Bádminton', 'Baloncesto', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'blue-box';

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
// El titulo japones tambien se usa a solas.
export const ALIASES = [
  'Ao no Hako',
  'Blue Box (2024)',
];

/**
 * Nota de la serie en IMDb (tt32639706): 8,0 con unos 9.900 votos.
 */
export const RATING_SERIE = 8.0;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   25  (octubre 2024 - marzo 2025)
 *   T2    3  (octubre 2026, en emision)
 *   --
 *        28
 */
export const EPISODIOS_TOTAL = 28;

/**
 * Donde se emite en Espana.
 *
 *   · Netflix -> la serie, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Telecom Animation Film',
    synopsis:
      'Veinticinco episodios emitidos del 3 de octubre de 2024 al 27 de marzo de 2025. Taiki Inomata ' +
      'es un novato del club de bádminton que se ha enamorado de Chinatsu Kano, la estrella del equipo ' +
      'de baloncesto. Cuando ella acaba viviendo en su casa, el chico tendrá que compaginar los ' +
      'entrenamientos, los torneos y unos sentimientos que no sabe cómo confesar.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2026,
    estado: 'En emisión',
    estudio: 'Electric Circus',
    synopsis:
      'La segunda temporada empieza el 4 de octubre de 2026 y sigue en emisión. Taiki y Chinatsu viven ' +
      'una salida que parece una cita, pero la aparición de Kazuma Matsuoka y de Yumeka Gotou complica ' +
      'las cosas. Yumeka, la antigua compañera de Chinatsu, vuelve con una herida abierta y obliga a ' +
      'las dos a revisar su amistad. Taiki, mientras tanto, sigue persiguiendo los nacionales.',
    capitulos: 'T2',
  },
];
