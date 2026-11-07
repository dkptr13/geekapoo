// LA FICHA DEL ANIME - Don't Toy with Me, Miss Nagatoro
//
// Comedia romántica de Nanashi, en la Magazine Pocket de Kodansha de
// 2017 a 2024, con 20 tomos. Un dibujante tímido de segundo adoptado
// como juguete por una kohai de primero que lo pica, lo toca y lo
// quiere: sadismo con amor y deredere progresivo.
//
// Fichas de AniList: 120697 (T1, 2021) y 140596 (T2 2nd Attack, 2023).
// El Mini Anime de cortos no entra, como los Petit de otras series.
// Telecom Animation Film anima la primera con Hanai; OLM la segunda
// con Ushiro. Kishimoto escribe las dos y Gin pone la música.
//
// Los datos de la serie en IMDb son tt12635162: 7,1 con unos 6.800
// votos. En la T2 IMDb usa las fechas de Abema (una semana antes
// desde el segundo); aquí van las de televisión.

export const ANIME = {
  titulo: "Don't Toy with Me, Miss Nagatoro",

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'イジらないで、長瀞さん',

  // Base: la Wikipedia en inglés (serie y capítulos), la japonesa
  // (fechas y personal) y la web oficial (títulos exactos y argumentos
  // por capítulo). Picaresca de instituto que se vuelve romance a
  // fuerza de vergüenza ajena y propia.
  synopsis:
    'Naoto Hachiouji dibuja en la biblioteca cuando unas chicas encuentran su manga y se ríen. ' +
    'Una de ellas, Hayase Nagatoro, se le pega como juguete: lo pica en público, lo toca sin ' +
    'permiso y lo persigue a todas partes. Debajo del sadismo hay una novia en prácticas que se ' +
    'pone roja primero. Comedia romántica de piques que avanzan a besos.',

  anio: 2021,
  estado: 'finished',
  estudio: 'Telecom Animation Film',

  // Comedia romántica escolar, como Takagi y Makeine, que usan lo
  // mismo: romance y comedia por delante.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Comedia', 'Drama', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'don-t-toy-with-me-miss-nagatoro';

/**
 * Nota de la serie en IMDb (tt12635162): 7,1 con unos 6.800 votos.
 *
 * Los capítulos van del 6,6 al 8,2: lo más alto cierra cada temporada
 * (el concurso de la T1 y la cita del acuario de la T2).
 */
export const RATING_SERIE = 7.1;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   12  (abril - junio de 2021)
 *   T2   12  (enero - marzo de 2023, 2nd Attack)
 *   --
 *        24
 */
export const EPISODIOS_TOTAL = 24;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la lleva entera en España, con las dos
 *     temporadas en simulcast (fichas de crunchyroll.com/es y aviso
 *     de la segunda en 2023).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Telecom Animation Film',
    synopsis:
      'Doce capítulos del 11 de abril al 27 de junio de 2021, en Telecom Animation Film con ' +
      'Hanai dirigiendo. Senpai cae en manos de Nagatoro en la biblioteca: piques en el club, ' +
      'playa, festival y el duelo con la presidenta por el club de arte. Cierra con el ' +
      'festival cultural, el concurso ganado y un beso de verdad.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '2nd Attack',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'OLM',
    synopsis:
      'Doce capítulos del 8 de enero al 26 de marzo de 2023, en OLM con Ushiro dirigiendo. ' +
      'Resfriados cruzados, Navidades, esquí y el torneo de judo con Orihara de rival y beso ' +
      'en juego. Cierra con la cita del acuario, ya sin disimulos.',
    capitulos: 'T2',
  },
];
