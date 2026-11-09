// META - Jujutsu Kaisen 0
//
// AniList 131573 (peli, 2021, 105 minutos).
// IMDb tt14331144: 7,8 con unos 68.400 votos.
// JustWatch ES: tm1040315. Disponible en Netflix, Amazon Prime Video,
// Disney+ y Crunchyroll en España.
//
// Precuela de la serie de 2020. La ficha va separada del anime de
// televisión porque la película cuenta el caso de Yuuta y Rika antes
// de que el grupo de Gojou se enfrente a Getou.

export const ANIME = {
  titulo: 'Jujutsu Kaisen 0',

  japaneseTitle: '呪術廻戦 0',

  synopsis:
    'Yuuta Okkotsu arrastra desde niño el espíritu de Rika, su amiga muerta, y no puede vivir con nadie sin ponerlo en peligro. ' +
    'Satoru Gojou lo recluta para el instituto de jujutsu de Tokio, donde aprende a combatir maldiciones junto a Maki, Toge y Panda. ' +
    'Mientras el grupo se prepara, Suguru Getou vuelve para quedarse con Rika y desatar algo mucho peor que una maldición: la culpa de un chico que no sabe soltar a quien quiere.',

  anio: 2021,
  estado: 'finished',
  estudio: 'MAPPA',

  categorias: ['Shonen & Acción', 'Fantasía & Magia'],

  generos: ['Acción', 'Sobrenatural', 'Fantasía Oscura', 'Drama', 'Escolar'],
};

export const ANIME_ID = 'jujutsu-kaisen-0';

export const ALIASES = ['Jujutsu Kaisen Zero', 'Gekijouban Jujutsu Kaisen 0'];

/**
 * Una sola película, un solo capítulo. La nota es la de IMDb para la
 * película completa, no una media de episodios.
 */
export const RATING_SERIE = 7.8;

export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España. Las filas buenas las escribe el importador
 * de JustWatch; esta lista es la ficha antigua de plataformas.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Amazon Prime Video', url: 'https://www.primevideo.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'Disney+', url: 'https://www.disneyplus.com/es-es', badgeColor: 'bg-blue-600/20 text-blue-300' },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis:
      'La película precuela, estrenada en Japón el 24 de diciembre de 2021. Yuuta llega al instituto con una maldición de grado especial pegada al cuerpo y descubre que el problema no es Rika, sino lo que está dispuesto a hacer para no perderla otra vez. Getou pone a prueba a los alumnos de primer año con una trampa que ocupa la segunda mitad del metraje.',
    capitulos: 'T1',
  },
];
