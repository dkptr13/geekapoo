// META - Fire Force
//
// TVDB 355480 (炎炎ノ消防隊, 2019, Ended) tiene 24 + 24 + 25 episodios
// en las temporadas 1, 2 y 3. La temporada 3 se emitio en dos partes
// (12 episodios en 2025 y 13 en 2026), pero es una sola temporada
// oficial y el catalogo la cuenta igual: T3 con 25 episodios.
// AniList 105310 (T1, 2019), 114236 (T2, 2020), 149118 (T3 parte 1,
// 2025) y 179062 (T3 parte 2, 2026). IMDb tt9307686: 7,6 con unos
// 22.000 votos.
//
// La temporada 0 de TVDB son treinta mini-cortos de humor de 2021, no
// OVAs de la historia. No entran: no son episodios de la serie ni
// tienen nota de IMDb.
//
// Los titulos en castellano, las fechas y los titulos japoneses salen
// de las paginas de temporada de la Wikipedia en espanol; las notas,
// de IMDb. Los resumenes son propios, a partir de la trama de cada
// episodio.
//
// TVDB numera las tres temporadas igual que el catalogo. La pelea de
// la T3 con TVDB es directa porque el catalogo tambien la cuenta como
// una sola temporada de 25.

export const ANIME = {
  titulo: 'Fire Force',

  japaneseTitle: '炎炎ノ消防隊',

  synopsis:
    'Tokio, año 198 del Imperio. La combustión humana espontánea convierte a la gente en Infernales, ' +
    'monstruos de fuego que solo pueden ser destruidos. Shinra Kusakabe, un joven pirocinético de ' +
    'tercera generación apodado Huellas del Diablo, se alista en la Compañía 8 de las Fuerzas de Fuego ' +
    'Especiales para salvar vidas y descubrir por qué su familia ardió. Lo que empieza como un trabajo ' +
    'de bomberos termina destapando una conspiración que implica a la Iglesia, al Ejército y al Evangelista.',

  anio: 2019,
  estado: 'finished',
  estudio: 'David Production',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Fantasía', 'Sobrenatural', 'Ciencia ficción', 'Shōnen'],
};

export const ANIME_ID = 'fire-force';

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
// El romanizado japones usa el guion largo en "shoboutai".
export const ALIASES = [
  'Enen no Shōbōtai',
  'Fire Force (2019)',
];

/**
 * Nota de la serie en IMDb (tt9307686): 7,6 con unos 22.000 votos.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  24  (julio - diciembre de 2019)
 *   T2  24  (julio - diciembre de 2020)
 *   T3  25  (abril de 2025 - abril de 2026)
 *   --
 *       73
 */
export const EPISODIOS_TOTAL = 73;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> las tres temporadas, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'David Production',
    synopsis:
      'Veinticuatro episodios emitidos del 5 de julio al 27 de diciembre de 2019. Shinra Kusakabe se une ' +
      'a la Compañía 8 y descubre que los Infernales no son solo accidentes: alguien está provocando la ' +
      'combustión humana. La investigación lleva al grupo hasta la Compañía 5, Asakusa y los Caballeros ' +
      'de la Llama de Ceniza, con el reencuentro con su hermano Shou como cierre.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'David Production',
    synopsis:
      'Veinticuatro episodios del 3 de julio al 11 de diciembre de 2020. La Compañía 8 investiga el ' +
      'Templo del Sol Sagrado, el origen de Amaterasu y los experimentos con insectos de Adolla. Shinra ' +
      'viaja a Haijima, conoce a Nataku e Inca y se enfrenta a Charon y Haumea, mientras el Evangelista ' +
      'mueve sus piezas para el Gran Cataclismo.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'David Production',
    synopsis:
      'Veinticinco episodios emitidos del 5 de abril de 2025 al 4 de abril de 2026, en dos partes. El ' +
      'Imperio declara traidora a la Compañía 8, Burns cae y Shinra y sus amigos tienen que detener el ' +
      'Gran Cataclismo. La temporada cierra la historia con la batalla contra el Evangelista, el ' +
      'sacrificio de los pilares y un epílogo que abre la puerta a un nuevo mundo.',
    capitulos: 'T3',
  },
];
