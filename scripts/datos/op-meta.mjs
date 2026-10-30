// LA FICHA DEL ANIME - One Piece
//
// Serie de Toei Animation para Fuji TV, en emision desde el 20 de
// octubre de 1999. Luffy y su tripulacion buscan el tesoro del Rey de
// los Piratas, Gol D. Roger, en un mundo de islas y piratas.
//
// De momento el catalogo tiene las tres primeras temporadas:
//
//   T1   61 capitulos  (octubre de 1999 - marzo de 2001)
//   T2   16 capitulos  (marzo - agosto de 2001)
//   T3   14 capitulos  (agosto - diciembre de 2001)
//
// Las demas temporadas se iran anadiendo por tandas.
//
// Ficha de AniList: 21 (la serie entera, en emision, sin total de
// capitulos). TVDB: serie 81797, que reparte los capitulos por anos.
// IMDb tt0388629: 9,0 con unos 371.000 votos.

export const ANIME = {
  titulo: 'One Piece',

  japaneseTitle: 'ワンピース',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Luffy es un chico de goma que quiere ser el Rey de los
  // Piratas y sale al mar a buscar el tesoro de Roger.
  synopsis:
    'Monkey D. Luffy es un chico que comio la Fruta del Diablo y cuyo ' +
    'cuerpo se estiro como la goma, pero que perdio para siempre la ' +
    'capacidad de nadar. Con su sombrero de paja y una tripulacion que ' +
    'reune isla a isla, recorre los mares en busca del One Piece, el ' +
    'tesoro del Rey de los Piratas Gol D. Roger. Quien lo encuentre ' +
    'heredara su titulo. Aventura, humor y combates en una serie que ' +
    'sigue en emision desde 1999.',

  anio: 1999,
  estado: 'emitiendo',
  estudio: 'Toei Animation',

  // Aventura y accion con fondo de piratas y poderes sobrenaturales.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Comedia', 'Fantasía', 'Shonen'],
};

export const ANIME_ID = 'one-piece';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador: el
// titulo en ingles con el ano de la serie. El japones ya esta en
// japaneseTitle y no se repite.
export const ALIASES = [
  'One Piece (1999)',
  'One Piece (anime)',
];

/**
 * Nota de la serie en IMDb (tt0388629): 9,0 con unos 371.000 votos.
 */
export const RATING_SERIE = 9.0;

/**
 * Capitulos en total.
 *
 * De momento estan cargadas las tres primeras temporadas:
 *
 *   T1   61  (octubre de 1999 - marzo de 2001)
 *   T2   16  (marzo - agosto de 2001)
 *   T3   14  (agosto - diciembre de 2001)
 *
 * El resto de la serie se ira anadiendo por tandas. Las peliculas y los
 * especiales no entran.
 */
export const EPISODIOS_TOTAL = 91;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie completa, con subtitulos en castellano.
 *   · Netflix     -> la primera temporada, con doblaje al castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com', badgeColor: '#e50914' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1999,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Sesenta y un capitulos del 20 de octubre de 1999 al 7 de marzo de 2001, en Toei Animation para Fuji TV. ' +
      'Es la saga del East Blue: Luffy sale de su aldea, conoce a Zoro, Nami, Usopp y Sanji y recorre el mar ' +
      'hasta la entrada de la Gran Ruta Maritima, donde le esperan Arlong y el recuerdo de Shanks.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2001,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Dieciseis capitulos del 21 de marzo al 19 de agosto de 2001, en Toei Animation para Fuji TV. ' +
      'La tripulacion entra en la Gran Ruta Maritima, conoce a la ballena Laboon y a Crocus, cruza Whisky ' +
      'Peak y Little Garden y se enfrenta a los agentes de Baroque Works, que persiguen a la princesa Vivi.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2001,
    estado: 'Finalizado',
    estudio: 'Toei Animation',
    synopsis:
      'Catorce capitulos del 26 de agosto al 9 de diciembre de 2001, en Toei Animation para Fuji TV. ' +
      'Nami enferma y la tripulacion busca un medico en la isla de Drum, gobernada por el tirano Wapol. ' +
      'Alli conocen a la doctora Kureha y al reno Tony Tony Chopper, que acaba unido a la tripulacion.',
    capitulos: 'T3',
  },
];
