// LA FICHA DEL ANIME - Charlotte
//
// Drama de superpoderes de Jun Maeda (el de Angel Beats y Clannad),
// en P.A. Works en 2015. Poderes de adolescencia que caducan: un
// tramposo que posee cuerpos acaba robándolos todos para salvarlos.
//
// Fichas de AniList: 20997 (T1, 2015) y 21339 (OVA, 2016). Sin más
// temporadas. Asai dirige y Maeda escribe, con Na-Ga de diseño.
//
// Los datos de la serie en IMDb son tt4574736: 7,5 con unos 11.000
// votos. En la T1 IMDb usa el día anterior desde el segundo; aquí van
// las fechas japonesas.

export const ANIME = {
  titulo: 'Charlotte',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'シャーロット',

  // Base: las Wikipedias en inglés (serie y capítulos, con los
  // argumentos) y en japonés (fechas y personal). Poderes que se
  // apagan al crecer, un hermano que salta en el tiempo y un atraco
  // final al mundo entero.
  synopsis:
    'Yuu Otosaka posee cuerpos 5 segundos y copia en exámenes hasta que Nao Tomori lo caza ' +
    'para el consejo de Hoshinoumi, escuela para chicos con poderes. Vigilan usuarios, pierden ' +
    'a Ayumi, descubren al hermano que salta en el tiempo y Yuu acaba robando los poderes del ' +
    'mundo entero para que nadie más los sufra. Drama de poderes que caducan.',

  anio: 2015,
  estado: 'finished',
  estudio: 'P.A. Works',

  // Drama escolar con poderes y carga psicológica, como Classroom of
  // the Elite, que junta las tres: psicológico, thriller y escolar.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio', 'Shojo & Escolar'],

  generos: ['Drama', 'Escolar', 'Sobrenatural', 'Romance', 'Comedia', 'Ciencia ficción'],
};

export const ANIME_ID = 'charlotte';

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

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
  'Charlotte (2015)',
];

/**
 * Nota de la serie en IMDb (tt4574736): 7,5 con unos 11.000 votos.
 *
 * Los capítulos van del 6,9 al 9,0: lo más alto es la huida con el
 * omurice (E7, 9,0) y el final por el mundo (E13, 8,7).
 */
export const RATING_SERIE = 7.5;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   13  (julio - septiembre de 2015)
 *   T2    1  (OVA, marzo de 2016, entre el 4 y el 5)
 *   --
 *        14
 */
export const EPISODIOS_TOTAL = 14;

/**
 * Donde se emite en España.
 *
 * Nada: JustWatch España no lista ninguna plataforma para Charlotte
 * (en otros países está en Crunchyroll). No se pone lo que no está,
 * como con la retirada de Zom 100.
 */

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'P.A. Works',
    synopsis:
      'Trece capítulos del 5 de julio al 27 de septiembre de 2015, en P.A. Works con Asai ' +
      'dirigiendo. Yuu cae en el consejo, pierden a Ayumi, aparece el hermano del tiempo y el ' +
      'mundo va a por ellos. Cierra con Yuu robando todos los poderes y volviendo sin memoria.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Tsuyoimono-tachi',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'P.A. Works',
    synopsis:
      'El especial del 30 de marzo de 2016 (volumen 7 del BD/DVD), entre el cuarto y el quinto. ' +
      'Iori lee mentes y las proyecta sin querer; Yuu y Nao la sacan al parque con Honoka, su ' +
      'amiga enferma, para demostrar que se puede convivir.',
    capitulos: 'T2',
  },
];
