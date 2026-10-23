// META - I Parry Everything (2024)
//
// TVDB 441727 (俺は全てを【パリイ】する, 2024) tiene 12 capitulos en la
// temporada 1. La temporada 2 solo tiene un capitulo sin fecha, que es
// un anuncio: no entra.
//
// AniList 170695. IMDb tt32395862: 7,1 con unos 2.600 votos.
//
// Los titulos en castellano son traduccion de los titulos japoneses de
// TVDB, porque el anexo en espanol no existe y la wikipedia en espanol
// no trae la lista de capitulos; las fechas y los resumenes, de la
// wikipedia en ingles; las notas, de IMDb.
//
// Es la unica serie del catalogo con el titulo en ingles: en Espana se
// distribuye con ese nombre, y asi lo usan Prime Video y la wikipedia
// en espanol.

export const ANIME = {
  titulo: 'I Parry Everything',

  japaneseTitle: '俺は全てを【パリイ】する',

  synopsis:
    'Noor lleva más de una década entrenando en solitario en la montaña de su casa y por fin se ' +
    'atreve a bajar a la capital real para hacerse aventurero. El problema es que su única ' +
    'habilidad, la de parar espadas, no le sirve para nada: todas las academias lo suspenderán y ' +
    'la asociación de aventureros sólo lo admite de puertas para fuera con el rango más bajo. Lo ' +
    'que pasa es que Noor no sabe lo que es capaz, y cuando de verdad se pone a pelear se lleva ' +
    'por delante a un duende, a un ejército entero y hasta a un dragón. Lo que empieza como una ' +
    'pelea con una vaca se acaba convirtiendo en una guerra contra el Imperio Mágico.',

  anio: 2024,
  estado: 'finished',
  estudio: 'OLM',

  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Comedia', 'Magia'],
};

export const ANIME_ID = 'i-parry-everything';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo completo, el japones romanizado y el titulo de la novela
// original, que es como la pidio quien la busco. Solo titulos de ESTA
// obra: nada de lo que pertenezca a otra serie.
export const ALIASES = [
  'I Parry Everything (2024)',
  "I Parry Everything: What Do You Mean I'm the Strongest?",
  'Ore wa Subete wo Parry Suru',
  'Jidouhanbaiki ni Umarekawatta Ore wa Meikyu ni Samayo',
];

/**
 * Nota de la serie en IMDb (tt32395862): 7,1 con unos 2.600 votos.
 */
export const RATING_SERIE = 7.1;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  12  (julio - septiembre de 2024)
 *   --
 *       12
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en Espana.
 *
 *   · Amazon Prime Video -> la serie.
 */
export const STREAMING = [
  {
    name: 'Amazon Prime Video',
    url: 'https://www.primevideo.com',
    badgeColor: '#00a8e1',
  },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'OLM',
    synopsis:
      'Doce capitulos emitidos del 5 de julio al 20 de septiembre de 2024. Noor, un chico que ha ' +
      'entrenado diez años solo en la montaña, llega a la capital real para hacerse aventurero y ' +
      'sólo consigue el rango más bajo. Al salvar a una noble de un minotauro, y luego de un ' +
      'duende, un ejército y un dragón, se convierte sin querer en el hombre más fuerte del ' +
      'reino, aunque su idea de ser héroe siga siendo la de un aventurero más.',
    capitulos: 'T1',
  },
];
