// META - Mashle: Magic and Muscles
//
// AniList 151801 (serie, 2023, 12 capítulos de 24 minutos).
// IMDb tt21209804: 7,5.
// JustWatch ES: ts360407. Disponible en Crunchyroll en España.
//
// A-1 Pictures adapta el manga de Hajime Komoto. Emitida del 8 de abril
// al 1 de julio de 2023.

export const ANIME = {
  titulo: 'Mashle: Magic and Muscles',

  japaneseTitle: 'マッシュル-MASHLE-',

  synopsis:
    'En un mundo donde la magia lo decide todo, Mash Burnedead nace sin una gota de poder mágico. ' +
    'Para sobrevivir y proteger a su padre, se matricula en la Academia Mágica de Easton y compensa cada hechizo con músculo, entrenamiento y una fuerza absurda. ' +
    'Su meta: convertirse en Visionario Divino sin usar magia.',

  anio: 2023,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  // Comedia de academia mágica con peleas de shonen: los dos cajones
  // que mejor describen la serie.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Comedia', 'Fantasía', 'Escolar'],
};

export const ANIME_ID = 'mashle-magic-and-muscles';

export const ALIASES = ['Mashle'];

/**
 * Nota de la serie completa en IMDb, tt21209804: 7,5. El episodio 12
 * es lo mejor con 8,3.
 */
export const RATING_SERIE = 7.5;

/**
 * Capítulos en total.
 *
 *   T1  12  (abril - julio de 2023)
 *   T2  12  (enero - marzo de 2024)
 *   --
 *        24
 */
export const EPISODIOS_TOTAL = 24;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia completa, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Doce episodios emitidos entre abril y julio de 2023. Mash entra en la Academia Mágica de Easton sin poder usar magia y se enfrenta a las pruebas de admisión, a los duelos entre casas y a los Siete Colmillos. ' +
      'La temporada cierra con la batalla contra Abel Walker y la primera gran amenaza de Innocent Zero.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Examen de selección de Visionario Divino',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Doce episodios emitidos entre enero y marzo de 2024. Mash y sus amigos se enfrentan al examen para convertirse en Visionarios Divinos mientras Innocent Zero mueve sus piezas. ' +
      'La temporada presenta a los candidatos de las tres casas y cierra con la batalla contra Macaron, Cell War y el propio Innocent Zero.',
    capitulos: 'T2',
  },
];
