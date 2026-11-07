// LA FICHA DEL ANIME - Psycho-Pass
//
// Thriller policial de ciencia ficción: en el Japón de 2112 el Sistema
// Sibyl mide la mente de cada ciudadano y decide quién puede ser un
// criminal antes de que actúe. Idea de Gen Urobuchi con Motohiro de
// supervisor, diseño de Akira Amano y música de Yugo Kanno.
//
// Fichas de AniList: 13601 (T1, 2012), 20513 (T2, 2014), 20514 (pelí,
// 2015), 102649, 104382 y 104990 (trilogía Sinners, 2019), 108307 (T3,
// 2019), 113917 (First Inspector, 2020, como ONA) y 153687 (Providence,
// 2023). Las pelis van como temporadas, como las de Konosuba o Kaguya;
// la trilogía va junta en una de tres, como los especiales de las
// Quintillizas.
//
// Production I.G anima todo menos la T2, que es de Tatsunoko con
// composición de Tow Ubukata. Shiotani dirige siempre; Urobuchi escribe
// la primera y supervisa la segunda.
//
// OJO con la portada de la T5: el emparejador no distingue
// "PSYCHO-PASS 3" de "…Sinners of the System Case 3" (mismo año,
// mismas palabras, mismo dígito) y el desempate por id se la da al
// Case 3. La T5 lleva puesta a mano la de la ficha 108307; si se
// relanza el enlazador con --forzar hay que reponerla.
//
// Los datos de la serie en IMDb son tt2379308 (8,1 con unos 26.400
// votos; el tt2371349 que circula es una peli del oeste de 1981). Las
// pelis llevan su tt propio en cada fichero. La versión recortada de
// la T1 (Nuevo Montaje, 11 capítulos de 2014) no entra: es el mismo
// material reordenado.

export const ANIME = {
  titulo: 'Psycho-Pass',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'PSYCHO-PASS サイコパス',

  // Base: las Wikipedias en inglés (serie, temporadas y pelis) y en
  // japonés (títulos oficiales, personal y fechas), más Production I.G
  // para los resúmenes de la primera temporada. Policías contra el
  // crimen en una sociedad que lo mide antes de que ocurra, y la
  // pregunta de quién vigila al que mide.
  synopsis:
    'En el Japón de 2112 el Sistema Sibyl escanea la mente de cada ciudadano y le asigna un ' +
    'coeficiente criminal y un color: quien pasa del límite es criminal latente aunque no haya ' +
    'delinquido. Akane Tsunemori entra como inspectora en la División 1 de Seguridad Pública, al ' +
    'mando de ejecutores que son criminales útiles, entre ellos Shinya Kogami. La caza de Shogo ' +
    'Makishima, un asesino al que el sistema no ve, rompe sus certezas y la obliga a mirar dentro ' +
    'de Sibyl. Thriller policial sobre la justicia medida por una máquina.',

  anio: 2012,
  estado: 'finished',
  estudio: 'Production I.G',

  // Policial de ciencia ficción para adultos, con el thriller
  // conspiranoico de la segunda mitad. Son tres, como 86, que junta
  // cyberpunk con thriller y psicológico.
  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico', 'Thriller & Misterio'],

  generos: ['Acción', 'Ciencia ficción', 'Psicológico', 'Thriller', 'Crimen', 'Cyberpunk'],
};

export const ANIME_ID = 'psycho-pass';

/**
 * Nota de la serie en IMDb (tt2379308): 8,1 con unos 26.400 votos.
 *
 * Los capítulos van del 6,7 al 9,2: lo más alto son la cena del santo
 * (T1E11, 9,2) y la puerta del juicio (T1E16, 9,1). La tercera baja un
 * punto entero respecto a las dos primeras.
 */
export const RATING_SERIE = 8.1;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   22  (octubre de 2012 - marzo de 2013)
 *   T2   11  (octubre - diciembre de 2014)
 *   T3    1  (película, enero de 2015)
 *   T4    3  (trilogía Sinners, enero - marzo de 2019)
 *   T5    8  (octubre - diciembre de 2019, de 45 minutos)
 *   T6    1  (First Inspector, marzo de 2020)
 *   T7    1  (Providence, mayo de 2023)
 *   --
 *        47
 */
export const EPISODIOS_TOTAL = 47;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la lleva entera en España (serie y pelis),
 *     con ficha propia en crunchyroll.com/es y aviso de catálogo
 *     completo en 2025.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Veintidós capítulos del 12 de octubre de 2012 al 22 de marzo de 2013, en Production I.G ' +
      'para Noitamina, con historia de Gen Urobuchi. Akane debuta como inspectora con Kogami, ' +
      'Ginoza, Masaoka, Kagari y Kunizuka. Los casos sueltos dibujan una mano oculta: Shogo ' +
      'Makishima, inmune a Sibyl. El casco que ciega al sistema desata el caos en la calle y el ' +
      'final revela qué es Sibyl y a qué precio. Cierra con Kogami fuera de la ley y Akane al mando.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Psycho-Pass 2',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Tatsunoko Production',
    synopsis:
      'Once capítulos del 10 de octubre al 19 de diciembre de 2014, en Tatsunoko Production ' +
      'con composición de Tow Ubukata. Sin Kogami, Akane lidera con Mika y el ejecutor Togane. ' +
      'Kirito Kamui, invisible para Sibyl por ser muchos en uno, firma "¿de qué color?" y caza ' +
      'Dominators. La jefa Kasei guarda un secreto que parte la temporada en dos. Cierra con ' +
      'Sibyl reconociendo a Kamui y Akane deteniéndolo.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Psycho-Pass: The Movie',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'La película del 9 de enero de 2015 (113 minutos), en Production I.G con Urobuchi y ' +
      'Fukami de guionistas. Terroristas de la SEAUn atacan Japón y las imágenes señalan a ' +
      'Kogami, mercenario en su país. Akane viaja a Shambala Float, donde el coronel Wong ' +
      'sustituye el Dominator por collares. La revuelta, el Sibyl trucado y Han, un androide ' +
      'asintomático, cierran la conspiración que el propio sistema diseñó.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Psycho-Pass: Sinners of the System',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Tres mediometrajes de 2019 (60, 60 y 68 minutos) en Production I.G: historias de ' +
      'personajes entre la película y la tercera temporada. Ginoza y Mika investigan una ' +
      'prisión experimental que entierra residuos bajo los presos. Sugo revive su pasado ' +
      'militar y la muerte de su escuadrón. Kogami, mercenario en el Tíbet, protege a la ' +
      'joven Tenzing y vuelve a Japón con Frederica.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Psycho-Pass 3',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Ocho capítulos de 45 minutos del 24 de octubre al 12 de diciembre de 2019, en ' +
      'Production I.G con Ubukata. Los inspectores Arata Shindo, con su Trazo Mental, y Kei ' +
      'Ignatov heredan la División 1. Bifrost, una casa de apuestas criminal que mueve el mundo ' +
      'con su juego, pone en el tablero a la gobernadora Komiya y a Azusawa. Cierra con Shindo ' +
      'asintomático en el punto de mira de Sibyl.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Psycho-Pass 3: First Inspector',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'La película del 27 de marzo de 2020 (134 minutos) que cierra la tercera temporada, en ' +
      'Production I.G. Bifrost asalta la sede de Seguridad Pública con Azusawa al mando y los ' +
      'Peacebreakers Jackdaw y Vixen: edificio apagado, rehenes y la gobernadora en el punto de ' +
      'mira. Shindo, Kei, Kogami y Ginoza lo recuperan por dentro y por fuera. El plan de ' +
      'Azusawa para entrar en Sibyl se estrella: no es asintomático.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Psycho-Pass: Providence',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'La película del 12 de mayo de 2023 (120 minutos), precuela de la tercera temporada, en ' +
      'Production I.G. Los Peacebreakers asaltan un buque de Exteriores y matan a la profesora ' +
      'Stronskaya por sus papeles sobre el Coeficiente de Conflicto. La pista muere con Saiga y ' +
      'el pacto de Sibyl con los terroristas deja a Akane sola. Asalta su isla, borra a su dios ' +
      'máquina y dispara a la jefa Kasei.',
    capitulos: 'T7',
  },
];
