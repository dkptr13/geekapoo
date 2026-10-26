// LA FICHA DEL ANIME - Love, Chunibyo and Other Delusions
//
// Comedia romántica de Kyoto Animation sobre el síndrome de octavo
// grado: adolescentes que se inventan poderes, un ojo mágico y una
// organización secreta para no aceptar que están creciendo.
//
// La primera temporada va de octubre a diciembre de 2012; la segunda,
// "Ren", de enero a marzo de 2014. Entre las dos hay una OVA de
// Navidad y después otra de Rikka, y la película "Take On Me" cierra
// la historia en 2018.
//
// Fichas de AniList: 14741 (T1), 16934 (OVA de Navidad), 18671 (Ren),
// 20889 (OVA de Ren) y 98762 (película).
//
// Los datos de la serie en IMDb son tt2321542: 7,4 con unos 6.300
// votos. La película es tt6915208: 7,4 con unos 1.800 votos.

export const ANIME = {
  titulo: 'Love, Chunibyo and Other Delusions',

  // La grafía oficial japonesa, de AniList y de la web de Kyoto Animation.
  japaneseTitle: '中二病でも恋がしたい！',

  // Base: la sinopsis de AniList y los argumentos de las dos temporadas,
  // en castellano. Yūta quiere dejar atrás sus delirios; Rikka los ha
  // convertido en una forma de vivir y lo arrastra con ella.
  synopsis:
    'Yūta Togashi entra en el instituto decidido a dejar atrás el síndrome de octavo grado, esa ' +
    'costumbre de inventarse poderes y un ojo mágico. Su vecina Rikka Takanashi, que acaba de ' +
    'mudarse al piso de arriba, no solo sigue instalada en ese mundo: lo reconoce como su alma ' +
    'gemela y lo arrastra a su sociedad secreta. Entre gatos llamados quimeras, paraguas que son ' +
    'armas y una hermana mayor que reparte golpes, Yūta descubre que crecer no consiste en dejar ' +
    'de fingir, sino en decidir con quién finge.',

  anio: 2012,
  estado: 'finished',
  estudio: 'Kyoto Animation',

  // Comedia romántica escolar con un fondo de duelo familiar. Va con las
  // fichas de romance y de instituto, no con las de acción.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Romance', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'love-chunibyo-and-other-delusions';

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
//
// El titulo oficial en ingles lleva ampersand y exclamacion.
export const ALIASES = [
  'Love, Chunibyo & Other Delusions!',
  'Chuunibyou demo Koi ga Shitai!',
];

/**
 * Nota de la serie en IMDb (tt2321542): 7,4 con unos 6.300 votos.
 *
 * Los capítulos de la T1 van del 7,4 al 8,7: lo más alto es el final
 * (E12, 8,7) y la caja de Pandora (E10, 8,5). La T3 baja un poco, con
 * el capítulo de la playa en 6,8.
 */
export const RATING_SERIE = 7.4;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   12  (octubre - diciembre de 2012)
 *   T2    1  (OVA de Navidad, junio de 2013)
 *   T3   12  (Ren, enero - marzo de 2014)
 *   T4    1  (OVA de Ren, septiembre de 2014)
 *   T5    1  (película Take On Me, enero de 2018)
 *   --
 *        27
 */
export const EPISODIOS_TOTAL = 27;

/**
 * Donde se emite en España.
 *
 * Nada: JustWatch España no lista ninguna plataforma para la serie.
 * Crunchyroll la tiene en otros países, pero no se pone lo que no está
 * disponible aquí.
 */

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Doce capítulos del 4 de octubre al 20 de diciembre de 2012, en Kyoto Animation. Yūta ' +
      'intenta enterrar su pasado de octavo grado, pero Rikka lo recluta para su sociedad de ' +
      'magia; entre el aula, el festival escolar y la muerte del padre de Rikka, los dos aprenden ' +
      'a sostener sus mentiras.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Kirameki no... Slapstick Noel',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Especial de 25 minutos estrenado el 19 de junio de 2013 en el séptimo volumen de la ' +
      'edición doméstica. La pandilla celebra una fiesta de Navidad en la mansión de Sanae; el ' +
      'pastel con alcohol desata una batalla, un paseo en barco y una confesión que nadie esperaba.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Ren',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Doce capítulos del 8 de enero al 26 de marzo de 2014. Yūta y Rikka viven juntos mientras ' +
      'la familia de él está en Yakarta; Satone, la amiga de la infancia que le enseñó a fingir, ' +
      'vuelve al edificio y pone a prueba la relación. La temporada cierra con el contrato ' +
      'superior y un beso interrumpido.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Saisei no... Jaou Shingan Mokushiroku',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Especial de 25 minutos del 17 de septiembre de 2014, incluido con el séptimo volumen de ' +
      'la segunda temporada. Rikka sospecha de una memoria que Makoto le da a Yūta y la discusión ' +
      'por las fotos que contiene obliga a los dos a aprender a pedir perdón.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Take On Me',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Película de 2018 dirigida por Tatsuya Ishihara. Tōka quiere llevarse a Rikka a Italia y el ' +
      'grupo convence a la pareja de fugarse: un viaje por Kioto, Kobe, Tokio y Hokkaido que ' +
      'termina en una boda y en un beso. Cierra la historia principal.',
    capitulos: 'T5',
  },
];
