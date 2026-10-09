// META - Grand Blue
//
// ── EL TITULO ─────────────────────────────────────────────────────
//
// En japon y en ingles se llama Grand Blue, sin exclamacion y sin
// flechita: ぐらんぶる. Es el nombre del dive shop que Iori regenta con
// su tio, y el titulo viene de ahi, no al reves. En el catalogo de este
// sitio esta como "Grand Blue" y el nombre completo, Grand Blue
// Dreaming, es el que usan las fichas de fuera de Japon.
//
// ── DE DONDE VIENEN LAS NOTAS ─────────────────────────────────────
//
// IMDb, serie tt8086718: 7,9 con 7.875 votos. Es la nota de la serie
// entera; los 36 capitulos sueltos van del 7,5 al 8,9.
//
// ── LAS TRES TEMPORADAS ───────────────────────────────────────────
//
//   T1  2018  12 capitulos   la serie, Izu
//   T2  2025  12 capitulos   siete años despues
//   T3  2026  12 capitulos   el viaje a Palaos
//
// AniList tiene una cuarta parte mas, "Grand Blue Season 4", en estado
// NOT_YET_RELEASED y sin fecha. No va aqui: no hay ni un capitulo
// emitido y el resto del catalogo solo guarda lo que ya se ha visto.
//
// ── LA CUARTA, DICHO ──────────────────────────────────────────────
//
// Si aparece en la interfaz con este anime es porque AniList ya tiene
// la entrada. Es un aviso de que va a venir algo, no una temporada.
//
// ── LOS ESTUDIOS ──────────────────────────────────────────────────
//
// Zero-G firma las tres. En la segunda se suma Liber, segun el anuncio
// de produccion, y el resto del equipo (director, guion, diseno de
// personajes y musica) se mantiene. El cambio de estudio solo se nota
// en el color de las escenas de buceo.
//
// ── LO QUE ESTA SERIE ES ──────────────────────────────────────────
//
// La trama no es ninguna. Un chico de diecinueve anos se muda a
// un pueblo costero a hacer la universidad, vive encima de la tienda de
// buceo de su tio y acaba metido en el club de buceo, que funciona como
// club de fiesta con material de buceo. Eso es todo, y aguanta ocho
// capitulos, tres temporadas y ciento treinta y seis capitulos.
//
// Lo que hace que funcione es que la serie no tiene vergueza de lo que
// es. No intenta ser mas de lo que es, no hace chistes-meta sobre el
// genero y no se disculpa por el ritmo. Cuando el grupo se emborracha
// y sale desnudo a la calle, eso es un capitulo entero y se cuenta como
// algo que pasa, no como algo que hay que justificar. Y cuando hay algo
// de verdad en juego (el carnet de buceo, el trabajo, una madre que
// llega), baja el tono veinte segundos y lo cuenta con el mismo tono,
// que es lo que hace que lo raro funcione.

export const ANIME = {
  titulo: 'Grand Blue',

  japaneseTitle: 'ぐらんぶる',

  synopsis:
    'Iori Kitahara se muda a Izu para empezar la universidad y se instala en la tienda de buceo de su ' +
    'tio, que es tambien la casa de sus dos primas. Lo que quiere es una vida universitaria tranquila y ' +
    'lo que se encuentra es el club de buceo, que por dentro es un grupo de fiesta con material de ' +
    'buceo detras. A la primera noche ya esta desnudo en la calle, y a partir de ahi la serie se ' +
    'dedica a contar hasta donde se puede llegar con eso, temporada tras temporada, sin pedir perdon ' +
    'ninguna vez. Lo que hay debajo, sin embargo, esta todo: Iori vino a Izu por un motivo que no ' +
    'cuenta, su tio lleva una tienda que sobrevive de otra manera, Chisa esta casada con el buceo ' +
    'del club y su hermana Nanaka se ocupa de mantenerlo en pie con una fuerza fisica que no deberia estar ' +
    'en una chica tan pequeña. Aina esta en la misma carrera que Chisa y lleva dos años ' +
    'aguantando sola un sitio que le queda grande. Y el grupo de Iori, al otro lado, son cinco ' +
    'chicos que hacen lo que pueden con un trabajo, una carrera y una dignidad que se les cae a ' +
    'trozos de cada vez. Las tres temporadas pasan por Okinawa, por la universidad femenina y por ' +
    'Palaos, y ninguna de las tres cambia la pregunta que hizo el primer capitulo: cuanta gente ' +
    'hace falta para que un plan malo salga bien.',

  anio: 2018,
  estado: 'finished',
  estudio: 'Zero-G',

  categorias: ['Comedia'],

  generos: ['Comedia', 'Recuentos de la vida', 'Universidad', 'Buceo'],
};

export const ANIME_ID = 'grand-blue';

/** Nota de la serie en IMDb: 7,9 con 7.875 votos. */
export const RATING_SERIE = 7.9;

/**
 * Capitulos en total.
 *
 *   T1  12  (julio - septiembre de 2018)
 *   T2  12  (julio - septiembre de 2025)
 *   T3  12  (julio - septiembre de 2026)
 *   ---
 *       36
 *
 * No se cuenta una cuarta temporada que AniList anuncia pero que no ha
 * emitido ni un capitulo.
 */
export const EPISODIOS_TOTAL = 36;

/** Donde se emite, fuera de Japon. */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Zero-G',
    synopsis:
      'Iori llega a Izu para la universidad y se encuentra con que el sitio donde vive es la tienda de ' +
      'buceo de su tio y el club que se esta en ella. En el primer capitulo ya sale desnudo por la calle, ' +
      'y eso no es el fallo de la serie: es la premise. Los doce capitulos van de la prueba de entrada al ' +
      'curso de buceo en Okinawa, con el concurso de belleza del campus, los partidos de dobles en la ' +
      'playa, la primera vez que Aina se atreve a decir que no y un final que deja al grupo en la orilla ' +
      'decidiendo que hace el ano siguiente. La direccion es de Shinji Takamatsu, que firma los treinta y ' +
      'seis capitulos del catalogo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Zero-G',
    synopsis:
      'Siete años despues. Iori vuelve de Okinawa con la parte del curso de buceo hecha y una carta de su ' +
      'hermana pequeña, Shiori, que no es una carta de nada. La temporada se organiza en tres bloques: el ' +
      'festival de la universidad femenina, donde Aina y Chisa tienen un cafe de pasteles e Iori se disfraza ' +
      'y arruina la tarde; los experimentos y las excursiones con la clase, que son la parte en la que la ' +
      'serie se parece a una serie de college y no a una serie de fiesta; y el final, en una isla, donde ' +
      'Chisa cae al mar borracha. Los dos capitolos mejor puntuados de toda la serie, el 6 y el 9, son de ' +
      'esta temporada.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Season 3',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Zero-G',
    synopsis:
      'La temporada se va de Izu. Palaos, que es la primera vez que la serie sale de Japón, da el arranque y ' +
      'el buceo de verdad; despues un equipo de television llega a Grand Blue a contar el viaje con su ' +
      'propio Convencimiento, y de ahi sale la segunda mitad, con las citas a ciegas, la loteria y una madre ' +
      'que se presenta en el peor momento posible. Cierra con dos capitulos en Okinawa, el mismo sitio donde ' +
      'empezo todo en 2018, y con el capitolo con la mejor nota de las tres temporadas. La cuatro, que ' +
      'AniList tiene anunciada, no ha salido.',
    capitulos: 'T3',
  },
];