// META - Fate/stay night (2006)
//
// AniList 356 (TV, 2006, 24 episodios).
// Estudio: Studio Deen. Adapta la ruta Fate de la novela visual.
//
// Es la primera adaptacion animada de la obra de Nasu y la unica que
// sigue la ruta Fate hasta el final. Las otras dos rutas llegarian
// despues con Unlimited Blade Works y Heaven's Feel.

export const ANIME = {
  titulo: 'Fate/stay night',

  japaneseTitle: 'フェイト/ステイナイト',

  synopsis:
    'Shirou Emiya era un niño cuando el incendio de Fuyuki se llevo a sus padres y a media ciudad. ' +
    'Diez años despues vive con Taiga, arregla aparatos y se cree un mago mediocre, hasta que la ' +
    'guerra por el Santo Grial vuelve a empezar y él invoca a Saber sin saber cómo. Siete magos, ' +
    'siete sirvientes y un deseo capaz de reescribir el mundo: Shirou entra en la guerra convencido ' +
    'de que puede salvar a todo el mundo, y la serie se encarga de explicarle que salvar a alguien ' +
    'siempre significa elegir a quién dejar atrás.',

  anio: 2006,
  estado: 'finished',
  estudio: 'Studio Deen',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Fantasía', 'Sobrenatural', 'Romance', 'Magia'],
};

export const ANIME_ID = 'fate-stay-night';

/**
 * Nota de AniList: 70 sobre 100, que es un 7,0.
 *
 * La ficha de IMDb de la serie existe (tt0877057), pero aqui se usa la
 * nota de AniList porque es la unica que se puede consultar por API sin
 * clave y con votos suficientes para esta ficha.
 */
export const RATING_SERIE = 7.0;

/** Capitulos en total: los 24 de la unica temporada. */
export const EPISODIOS_TOTAL = 24;

/**
 * Donde se emite en España.
 *
 * No hay oferta española verificada de la serie de 2006. Se deja vacio
 * en vez de heredar la plataforma de otra entrega de la saga.
 */
export const STREAMING = [];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'Studio Deen',
    synopsis:
      'La adaptacion de Studio Deen de la ruta Fate, la primera que se animo. Shirou invoca a Saber ' +
      'por accidente, se alía con Rin y Archer y descubre que el Grial de Fuyuki es una trampa: el ' +
      'incendio que mato a su familia fue el final de la guerra anterior. La serie se toma su tiempo ' +
      'con la vida diaria de Shirou y Sakura antes de enseñar las reglas, y termina con un final ' +
      'propio que no sigue el de ninguna otra ruta.',
    capitulos: 'T1',
  },
];
