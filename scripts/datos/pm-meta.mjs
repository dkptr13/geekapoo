// LA FICHA DEL ANIME - Plastic Memories
//
// Titulo oficial en ingles, que es como se conoce la serie en todos
// lados. En japones se escribe en katakana y se lee igual.

export const ANIME = {
  titulo: 'Plastic Memories',

  // De TVDB, que lo trae de la ficha japonesa.
  japaneseTitle: 'プラスティック・メモリーズ',

  // Base: la ficha de la serie en la Wikipedia en espanol y el
  // argumento verificado capitulo a capitulo. Lo que tiene que
  // quedar claro: no es una comedia romantica con robots de fondo,
  // es un drama sobre saber desde el primer dia cuando se acaba, y
  // la gracia amarga es que los dos protagonistas lo saben y siguen
  // adelante igual.
  synopsis:
    'Tsukasa Mizugaki tiene dieciocho anos y entra a trabajar en el Terminal Service de SAI Corp, ' +
    'la seccion que recupera a las Giftias, androides con sentimientos cuya vida dura 81920 horas, ' +
    'unos nueve anos, antes de romperse por dentro. Su companera es Isla, una Giftia veterana que ' +
    'lleva anos sirviendo tes y a la que le quedan menos de 2000 horas de vida. Juntos visitan a ' +
    'duenos que no quieren despedirse: ancianas con nietas de repuesto, ninos criados por hermanas ' +
    'de repuesto, mafiosos con guardaespaldas de repuesto. Tsukasa se enamora de Isla sabiendo que ' +
    'caducan a la vez el contrato y ella, y ella de el sabiendo que cada recuerdo que hacen juntos ' +
    'es uno menos de los que le quedan. Trece capitulos y un final anunciado desde el minuto uno, ' +
    'que aun asi duele como si no se supiera.',

  anio: 2015,
  estado: 'finished',
  estudio: 'Doga Kobo',

  // Wikipedia en espanol (ciencia ficcion, drama, romance, tragedia)
  // y AniList (Drama, Romance, Sci-Fi, Slice of Life). Dos categorias.
  categorias: ['Drama & Romance', 'Ciencia ficción'],

  generos: ['Drama', 'Romance', 'Ciencia ficción', 'Tragedia'],
};

export const ANIME_ID = 'plastic-memories';

/**
 * UNA SOLA TEMPORADA
 *
 * T1  13 capitulos  (abril-junio de 2015)
 *
 * Serie original sin continuacion: lo que hay es lo que se emitio
 * entre el 4 de abril y el 27 de junio de 2015. Las fechas son las
 * de TVDB (sabados); IMDb las trae con un dia de mas por el huso
 * horario en los capitulos 5 a 9.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Doga Kobo',
    synopsis:
      'Tsukasa entra al Terminal Service sin saber a que va y le toca de companera Isla, una ' +
      'Giftia que lleva apartada del campo anos y a la que le queda un mes de vida. Caso a caso ' +
      'aprenden el oficio: la anciana y Nina, Marcia y Souta con secuestro y persecucion de por ' +
      'medio, la cita, la confesion entre fuegos artificiales, la ruptura que ordena Kazuki y la ' +
      'reconciliacion. Noviazgo, tortilla con arroz y ultimos dias contados, hasta el anillo de ' +
      'desactivacion en la noria. Trece capitulos que van de menos a mas aunque se sepa el final.',
    capitulos: 'T1',
  },
];

/**
 * Nota de la serie en IMDb: 7,4 con unos 4.600 votos.
 *
 * La explica el ultimo capitulo: un 9,2 con casi 500 votos que
 * levanta la media el solo. Sin el seria una serie de notable bajo
 * con picos en el 8 y 8,2 (el 8, el 10 y el 12). La gente no puntua
 * la serie entera: puntua como llora al final.
 */
export const RATING_SERIE = 7.4;

/**
 * Capitulos en total: los 13 de la unica temporada, del 4 de abril
 * al 27 de junio de 2015.
 */
export const EPISODIOS_TOTAL = 13;

// Sin plataformas verificadas en Espana: JustWatch dice que en
// Espana no hay ninguna opcion y que Crunchyroll la lleva en
// Argentina y otros 24 paises, pero no aqui. Inventarse una seria
// peor que no poner ninguna, asi que se queda vacio y
// `anadir-plataformas.mjs` no toca nada hasta que haya dato.
export const STREAMING = [];
