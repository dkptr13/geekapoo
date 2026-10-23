// LA FICHA DEL ANIME - Cosmic Princess Kaguya!
//
// Pelicula de 2 horas y 22 minutos estrenada el 22 de enero de 2026 en
// Netflix. Una reimaginacion moderna del cuento de la princesa Kaguya
// (El cuento del cortador de bambu) ambientada en el mundo virtual
// Tsukuyomi, con musica y animacion 3D.
//
// Ficha de AniList: 201903.
// IMDb tt38872297: 7,1 con unos 3.400 votos.

export const ANIME = {
  titulo: 'Cosmic Princess Kaguya!',

  japaneseTitle: '超かぐや姫！',

  // Base: la sinopsis de AniList y el argumento de Netflix, en
  // castellano. Una chica del mundo virtual aparece en la vida de una
  // estudiante y juntas forman un grupo musical.
  synopsis:
    'Iroha Sakayori, una estudiante de secundaria que vive sola y se ' +
    'refugia en el mundo virtual Tsukuyomi, encuentra a una chica ' +
    'misteriosa llamada Kaguya. Juntas forman un grupo musical y ' +
    'participan en un concurso virtual. Pero Kaguya esconde un secreto: ' +
    'es una princesa de la Luna que ha venido a la Tierra. Una ' +
    'reimaginacion moderna del cuento de la princesa Kaguya, con ' +
    'musica, fantasia y animacion 3D.',

  anio: 2026,
  estado: 'finished',
  estudio: 'Studio Colorido',

  // Fantasia musical con fondo de ciencia ficcion y romance.
  categorias: ['Fantasía & Aventura', 'Romance & Comedia'],

  generos: ['Fantasía', 'Música', 'Ciencia ficción', 'Romance'],
};

export const ANIME_ID = 'cosmic-princess-kaguya';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en japones romanizado y los sinonimos que de verdad se
// usan. Los escribe el agente que anade el anime, a mano, y se
// guardan en "alternativeTitles" del documento de Firestore, que es
// lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El japones ya esta en japaneseTitle, asi que no se repite aqui.
export const ALIASES = [
  'Chou Kaguya-hime!',
  'CPK',
  'La princesa Kaguya del cosmos',
];

/**
 * Nota de la pelicula en IMDb (tt38872297): 7,1 con unos 3.400 votos.
 */
export const RATING_SERIE = 7.1;

/**
 * Capitulos en total.
 *
 *   T1  1  (pelicula, enero de 2026)
 *   ---
 *       1
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> estreno mundial, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Studio Colorido',
    synopsis:
      'Pelicula de 2 horas y 22 minutos estrenada el 22 de enero de 2026 en Netflix. Iroha ' +
      'Sakayori encuentra a una chica misteriosa llamada Kaguya en el mundo virtual Tsukuyomi. ' +
      'Juntas forman un grupo musical y participan en un concurso virtual. Pero Kaguya esconde ' +
      'un secreto: es una princesa de la Luna que ha venido a la Tierra.',
    capitulos: 'T1',
  },
];
