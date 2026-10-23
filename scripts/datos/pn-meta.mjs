// META - The Promised Neverland (2019)
//
// TVDB 348002 (約束のネバーランド, 2019, Ended) tiene 12 capítulos en la
// temporada 1 y 11 en la 2. En la temporada 0 deja el especial
// 特別編「道標」, que la serie emitio entre los capítulos 5 y 6 de la
// segunda temporada y que aquí va intercalado como el 5.5.
// AniList 101759 (serie, 12 capítulos) y 108725 (segunda temporada, 11).
// IMDb tt8788458: 8,1 con unos 60.000 votos.
//
// Esta serie no titula sus capítulos con un nombre propio: en la
// primera temporada los titulos son los codigos numéricos que usa la
// serie (121045, 131045...) y en la segunda, "Episode 1" a "Episode 11".
// Los titulos en castellano y las fechas salen de los anexos de
// temporada de la wikipedia en español; los titulos japoneses, de
// TVDB; las notas, de IMDb. Los resumenes de la primera temporada son
// los de la wikipedia en español y los de la segunda, traduccion de
// los de la wikipedia en inglés.

export const ANIME = {
  titulo: 'The Promised Neverland',

  japaneseTitle: '約束のネバーランド',

  synopsis:
    'En el orfanato Grace Field, treinta y ocho niños llevan una vida feliz y sin ' +
    'sospechas, criados por una mujer a la que llaman mamá. Hasta que la noche en que ' +
    'Conny no vuelve de su viaje de adopción, Emma, Norman y Ray descubren que el ' +
    'orfanato es en realidad una granja de ganado humano. Los tres deciden escapar, pero ' +
    'por el camino descubren que la amistad de sus compañeros no siempre es lo que ' +
    'parece, y que el bosque que rodea Grace Field guarda algo mucho peor que los ' +
    'demonios que se comen a los niños.',

  anio: 2019,
  estado: 'finished',
  estudio: 'CloverWorks',

  categorias: ['Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Acción', 'Terror', 'Misterio', 'Supervivencia', 'Psicológico'],
};

export const ANIME_ID = 'the-promised-neverland';

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
export const ALIASES = [
  'Yakusoku no Neverland',
  'The Promised Neverland (2019)',
];

/**
 * Un capitulo con titulo oficial que no esta en japones.
 *
 * Esta serie no titula sus capitulos: en la primera temporada los
 * titulos son los codigos numericos que usa la serie (121045,
 * 131045...) y en la segunda, "EPISODE1" a "EPISODE11". La bandera le
 * dice a `comprobar-datos.mjs` que no exija kanji ni kana en el campo
 * japones, que es lo que corresponde cuando el titulo oficial no
 * existe en japones.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie en IMDb (tt8788458): 8,1 con unos 60.000 votos.
 */
export const RATING_SERIE = 8.1;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  12  (enero - marzo de 2019)
 *   T2  12  (enero - marzo de 2021, con el especial 5.5)
 *   --
 *       24
 */
export const EPISODIOS_TOTAL = 24;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con subtitulos en castellano.
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
    estudio: 'CloverWorks',
    synopsis:
      'Doce episodios emitidos del 11 de enero al 29 de marzo de 2019. Emma, Norman y Ray ' +
      'descubren que Grace Field es una granja humana y ponen en marcha una fuga en la que ' +
      'tienen que poner a prueba su propia madurez y descubrir hasta dónde llega la ' +
      'mentira de los adultos que los crie.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'The Promised Neverland 2',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Once episodios emitidos del 8 de enero al 26 de marzo de 2021, con el especial ' +
      '「道標」 entre los capítulos 5 y 6. La huida lleva a los niños hasta el límite de ' +
      'Neverland, donde Norman descubre el precio de la traicion y Emma se enfrenta a la ' +
      'verdad sobre la muerte de su hermana.',
    capitulos: 'T2',
  },
];
