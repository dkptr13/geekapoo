// LA FICHA DEL ANIME - Naruto
//
// Doscientos veinte capítulos del 3 de octubre de 2002 al 8 de febrero de
// 2007, en Pierrot para TV Tokyo. La primera serie de ninjas de Konoha,
// con un crío rechazado que se hace ninja para que lo respeten.
//
//   T1  220 capítulos  (octubre de 2002 - febrero de 2007)
//
// Ficha de AniList: 20.
// TVDB: serie 78857, con las temporadas oficiales 1 a 5 (los cinco
// bloques de la serie) y la 0 con las OVAs y las películas, que no entran en
// el catálogo.
// IMDb tt0409591: 8,4 con unos 176.000 votos.
//
// El título japonés es ナルト, "Naruto".

export const ANIME = {
  titulo: 'Naruto',

  japaneseTitle: 'ナルト',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano.
  synopsis:
    'Naruto Uzumaki es un huérfano rechazado por toda la aldea de Konoha que se convierte en ' +
    'ninja para que la gente deje de burlarse de él. A su lado, Sasuke, el último de los ' +
    'Uchiha, y Sakura, que lo quiere con una fe ciega. Con Kakashi como maestro y el zorro de ' +
    'nueve colas dormido dentro, pasan de la academia al examen chūnin, la Tierra de las Olas, ' +
    'la invasión de la aldea, la guerra civil y la muerte de Jiraiya. Todo empieza con un crío ' +
    'al que nadie quiere y termina con un hombre que decide proteger a los suyos.',

  anio: 2002,
  estado: 'finished',
  estudio: 'Pierrot',

  // Shonen de acción con la mitad de su peso en la amistad y el duelo:
  // no es solo pelea, es gente que se quiere y se pierde.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Drama', 'Ninja', 'Comedia', 'Sobrenatural', 'Shonen', 'Coming-of-age', 'Artes marciales'],
};

export const ANIME_ID = 'naruto';

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
// No tiene otros nombres de uso habitual: "Shippuden" y "Boruto" son series distintas y no deben entrar aqui. El japones ya esta en japaneseTitle.
export const ALIASES = [

];

/**
 * Nota de la serie en IMDb (tt0409591): 8,4 con unos 176.000 votos.
 *
 * Los capítulos más valorados son los del arranque: el 19 (el final de
 * la Tierra de las Olas) llega al 9,1, y los del duelo con Sasuke se
 * quedan en el 9 o más. Los capítulos de relleno de la última parte
 * bajan a un 5 o así.
 */
export const RATING_SERIE = 8.4;

/**
 * Capítulos en total.
 *
 *   T1  220  (octubre de 2002 - febrero de 2007)
 *   ---
 *       220
 *
 * Las OVAs, las películas y los especiales van en la temporada 0 de TVDB y
 * no entran: no son capítulos de la serie.
 */
export const EPISODIOS_TOTAL = 220;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japón, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2002,
    estado: 'Finalizado',
    estudio: 'Pierrot',
    synopsis:
      'Doscientos veinte capítulos del 3 de octubre de 2002 al 8 de febrero de 2007, en Pierrot para ' +
      'TV Tokyo. Naruto, Sakura y Sasuke pasan de la academia al examen chūnin, la Tierra de las ' +
      'Olas, la invasión de Konoha, la guerra civil y la muerte del maestro Jiraiya. Todo ' +
      'empieza con un crío al que nadie quiere y termina con un hombre que protege a los suyos.',
    capitulos: 'T1',
  },
];
