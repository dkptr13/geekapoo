// META - Burn the Witch
//
// TVDB 389459 "BURN THE WITCH" (2020, Ended).
// AniList 116673 (T1 ONA, 2020, 3 capitulos) y 169362 (T2
// especial #0.8, 2023).
// IMDb tt12011442 (serie) y tt30761056 (#0.8).
//
// El titulo va en ingles hasta en Japon: es el oficial en todo el
// mundo, del universo Bleach de Tite Kubo.

export const ANIME = {
  titulo: 'Burn the Witch',

  japaneseTitle: 'BURN THE WITCH',

  synopsis:
    'En el Londres inverso, Wing Bind protege y gestiona a los dragones que nadie mas puede ver. ' +
    'Noel y Ninny, brujas de campo, cazan con Balgo y su perro Osushi por medio. ' +
    'Tres entregas y una precuela con Shelby nuevo: magia occidental con sello Kubo.',

  anio: 2020,
  estado: 'finished',
  estudio: 'Studio Colorido',

  // Fantasia de dragones con accion de caza: los dos cajones
  // claros. Son dos.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Fantasía', 'Magia', 'Dragones', 'Shonen'],
};

export const ANIME_ID = 'burn-the-witch';

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
// La serie corta se suele llamar asi, con el titulo en mayusculas.
export const ALIASES = [
  'Burn the Witch: Rōnin',
  'Burn the Witch (2020)',
];

/**
 * Unos titulos con titulo oficial en ingles.
 *
 * Hasta el japones es ingles aqui: TVDB lista los capitulos en
 * ingles y AniList tambien. La bandera le dice a
 * `comprobar-datos.mjs` que no exija kanji ni kana, igual que
 * Tokyo Revengers.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb: 7,7 de media ponderada de las
 * 4 entregas (tt12011442: 8,9, 8,7 y 9,1; tt30761056: 7,0).
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   3  (octubre de 2020, ONA)
 *   T2   1  (diciembre de 2023, especial #0.8)
 *   --
 *        4
 */
export const EPISODIOS_TOTAL = 4;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'Studio Colorido',
    synopsis:
      'Tres capitulos salidos en bloque el 2 de octubre de 2020. ' +
      'Noel y Ninny cazan dragones en el Londres inverso con Balgo de carabina. ' +
      'Cierra con el leon que habla y nadie entiende.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '#0.8',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Studio Colorido',
    synopsis:
      'Veintinueve minutos del 29 de diciembre de 2023. ' +
      'Precuela con Balgo haciendose draconido y Shelby nuevo en Wing Bind. ' +
      'Puerta de entrada sin necesitar lo anterior.',
    capitulos: 'T2',
  },
];
