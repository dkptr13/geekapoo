// META - El Diario de la Boticaria / The Apothecary Diaries (2023)
//
// TVDB 431162 (薬屋のひとりごと, 2023) tiene 24 + 24 + 24 episodios en
// las temporadas 1 a 3 (la tercera aún en emisión).
// AniList 161645 (primera), 176301 (segunda), 195516 (tercera).
// IMDb tt26743760: 8.6 con unos 13.000 votos.
//
// Los titulos en castellano son traduccion de los titulos en ingles de la
// wikipedia en ingles; los titulos japoneses, de TVDB; las fechas, de la
// wikipedia en ingles; las notas, de IMDb. Los resumenes son traduccion
// de la wikipedia en ingles.
//
// Las tres temporadas van en orden de publicacion:
//
//   T1  la serie (2023)               24 capitulos
//   T2  la serie, parte 2 (2025)      24 capitulos
//   T3  la serie, parte 3 (2026)       3 capitulos (emitidos hasta ahora)
//   --
//                51

export const ANIME = {
  titulo: 'El Diario de la Boticaria',

  japaneseTitle: '薬屋のひとりごと',

  synopsis:
    'Maomao es una joven farmacóloga que es secuestrada y vendida como sirvienta ' +
    'en el palacio imperial. Su curiosidad y su conocimiento de las venenos y las ' +
    'medicinas la llevan a resolver misterios que suceden en el harén imperial, ' +
    'llamando la atención del eunuco Jinshi. Juntos resuelven casos de envenenamiento, ' +
    'enfermedades misteriosas y conspiraciones palaciegas en la China imperial.',
  // basados en la sinopsis general de la serie

  anio: 2023,
  estado: 'En emisión',
  estudio: 'Toho Animation Studio',

  categorias: ['Seinen & Psicológico', 'Misterio & Misterio'],

  generos: ['Misterio', 'Drama', 'Histórico', 'Palacio'],
};

export const ANIME_ID = 'el-diario-de-la-boticaria';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
export const ALIASES = [
  'The Apothecary Diaries (2023)',
];

/**
 * Nota de la serie en IMDb (tt26743760): 8.6 con unos 13.000 votos.
 */
export const RATING_SERIE = 8.6;

/**
 * Capitulos en total, en orden de emision (solo los emitidos hasta ahora).
 *
 *   T1  24  (octubre de 2023 - marzo de 2024)
 *   T2  24  (enero - julio de 2025)
 *   T3   3  (octubre de 2026 en adelante, en emision)
 *   --
 *       51
 */
export const EPISODIOS_TOTAL = 51;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con doblaje en espanol.
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
    estudio: 'Toho Animation Studio',
    synopsis:
      'Veinticuatro capitulos emitidos del 22 de octubre de 2023 al 24 de marzo de 2024. ' +
      'Maomao, una joven farmacóloga secuestrada y vendida como sirvienta en el palacio ' +
      'imperial, usa sus conocimientos de venenos y medicinas para resolver misterios ' +
      'que ocurren en el harén imperial, llamando la atención del eunuco Jinshi.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Toho Animation Studio',
    synopsis:
      'Veinticuatro capitulos emitidos del 10 de enero al 4 de julio de 2025. Maomao ' +
      'continúa resolviendo misterios en el palacio imperial, enfrentando nuevos venenos, ' +
      'enfermedades y conspiraciones mientras su relación con Jinshi se complica.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2026,
    estado: 'En emisión',
    estudio: 'Toho Animation Studio',
    synopsis:
      'Tres capitulos emitidos desde el 2 de octubre de 2026 (tercera temporada en ' +
      'curso). Maomao y Jinshi siguen enfrentando intrigas y misterios en el palacio ' +
      'imperial mientras la historia avanza hacia su resolución.',
    capitulos: 'T3',
  },
];
