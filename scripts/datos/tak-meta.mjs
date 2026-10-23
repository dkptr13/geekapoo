// META - Takopi's Original Sin

export const ANIME = {
  // El titulo va en ingles porque es como lo escribe Netflix, que es la
  // licencia, y como aparece en las dos wikipedia. En japones el
  // romanizado oficial es "Takopii no Genzai", con dos i, que es como
  // lo escribe AniList.
  titulo: "Takopi's Original Sin",

  japaneseTitle: 'タコピーの原罪',

  synopsis:
    'Takopi baja del Planeta Feliz a la Tierra con un solo encargo: repartir felicidad. ' +
    'Es un pulpo de otro mundo, habla raro y trae una bolsa derowing de objetos que ' +
    'cumplen lo que uno pide. ' +
    'Lo primero que ve es a Shizuka, una chica de su edad a la que en el instituto ' +
    'no paran de humillar y en casa no la esperan: el padre tiene otra familia y la ' +
    'madre no esta. ' +
    'Takopi la salva de una situacion concreta y, sin querer, monta un lio de libre ' +
    'modulo. Lo que viene despues no lo arregla ni el mejor de los objetos: ' +
    'Takopi entiende mal a los humanos y no sabe que hay cosas que no se piden. ' +
    'La historia no es el cuento del alien que ayuda a la gente, que es como la ' +
    'cuenta la presentacion, sino la de como se rompe una red de adultos que se ' +
    'tapan entre ellos. ' +
    'Los seis capitulos se emiten por internet, sin television, y no hay ni una ' +
    'escena de accion: lo que hay es bullying, una muerte y las decisiones que ' +
    'toman unos criños que ya no tienen a quien preguntar. ' +
    'Termina con el capitulo sexto, que es el que explica de donde viene todo y por ' +
    'que el principio del 1 era un cuento distinto del que creias.',

  anio: 2025,
  estado: 'finished',
  estudio: 'ENISHIYA',

  // Es un web anime de seis capitulos, sin television: se subio a internet
  // por partes y cada capitulo el mismo dia en todos los paises donde
  // salio. No ha estado nunca en un canal, asi que no hay "temporadas" de
  // verdad, solo una entrega.
  categorias: ['Thriller & Misterio', 'Ciencia Ficción & Cyberpunk'],

  generos: ['Drama', 'Psicológico', 'Ciencia ficción'],
};

/**
 * Media de los seis capitulos en IMDb, ponderada por votos: 9,4 con
 * 62.079 votos. La simple da 9,400 y la ponderada 9,404, asi que aqui
 * no hay diferencia, pero se deja la ponderada por lo mismo que en el
 * resto del catalogo: el capitulo 5 tiene 10.465 votos y el 4 tiene
 * 9.156, y promediar sin mas trataria igual un capitulo que casi nadie
 * ha visto.
 */
export const RATING_SERIE = 9.4;

export const ANIME_ID = 'takopi-s-original-sin';

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
  'Takopi no Original Sin',
  'Takopi\'s Original Sin (2025)',
];

/**
 * Capitulos en total.
 *
 *   T1   6  capitulos  (junio - agosto de 2025)
 *   --
 *        6
 *
 * ── LA PELICULA NO VA AQUI ─────────────────────────────────────
 *
 * En mayo de 2026 se anuncio una pelicula, "Takopi's Original Sin
 * -Arigato, Mata Ashita-", que es el web anime reeditado con escenas
 * nuevas, y se ha confirmado en cines el 27 de noviembre de 2026.
 *
 * No se guarda por dos razones, y las dos son de los datos y no de la
 * mania. La primera es que cuando se escriba esta ficha la pelicula
 * aun no se ha buscado en ningun sitio: no hay duracion, no hay nota y no
 * hay plataforma donde verla. La segunda es que no es una temporada
 * nueva: son los mismos seis capitulos otra vez, como la pelicula del
 * arco Reze de Chainsaw Man pero al reves, porque aquella era material
 * nuevo y esta es una reedicion.
 *
 * Cuando la pelicula se haya repartido habra que anadirla con su capitulo,
 * su fecha y su nota, y entonces si sera una temporada 2.
 */
export const EPISODIOS_TOTAL = 6;

/**
 * Donde se emite.
 *
 *   · Netflix       -> de origen, en todo el mundo.
 *   · Crunchyroll   -> fuera de Japon, con doblaje al ingles.
 *   · Prime Video   -> junto con Netflix en varios paises.
 *   · U-NEXT        -> en Japon, la plataforma de TBS, que es quien produce
 *                      el anime.
 *
 * La version en DVD y Blu-ray salio en Japon el 19 de diciembre de
 * 2025, con los seis capitulos en una caja.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Amazon Prime', url: 'https://www.amazon.es/prime-video', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'U-NEXT', url: 'https://video.unext.jp', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'ENISHIYA',
    synopsis:
      'Seis capitulos publicados por internet entre el 28 de junio y el 2 de ' +
      'agosto de 2025, uno cada viernes, sin pasar por television. ' +
      'ENISHIYA, un estudio pequeno, y una direccion de Iino Shinya, que venia ' +
      'de Dr. STONE: el contraste es el de una obra de thriller con un pulso ' +
      'muy de thriller, en una serie donde no hay ni una pelea. ' +
      'El primer capitulo es el que mas se parece a lo que anuncia la premisa, ' +
      'con la chica huyendo y el alien resolviendo. A partir del tercero ya no ' +
      'se parece en nada: lo que se cuenta es lo que hacen los adultos que ' +
      'saben y no dicen, y que la tiene cerca de los quince. ' +
      'Los titulos van por anos, el 2016 y el 2022, y esa es la pista de que el ' +
      'final no es un cierre sino el otro principio. ' +
      'Es ademas el unico anime del catalogo que se ha estrenado en ' +
      'estrenado en internet y no en television.',
    capitulos: 'T1',
  },
];