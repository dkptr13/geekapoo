// META - Re:Zero
//
// TVDB 305089 "Re：ゼロから始める異世界生活" (2016, Continuing).
// AniList 21355 (T1), 108632 + 119661 (T2 partida), 163134 (T3), 189046 (T4).
// IMDb tt5607616, 85 capitulos en total.
//
// El titulo en castellano es el de la licencia en España:
// "Re:Zero - Comenzando la vida en otro mundo", que es como lo
// anuncian Crunchyroll y Netflix. El japones es el nativo de AniList.

export const ANIME = {
  titulo: 'Re:Zero - Comenzando la vida en otro mundo',

  japaneseTitle: 'Re:ゼロから始める異世界生活',

  synopsis:
    'Subaru Natsuki sale de una tienda y aparece en un mundo de fantasia sin saber como ha llegado. ' +
    'Lo rescata Emilia, una media elfa de pelo plateado que busca una insignia robada, y al ayudarla muere con ella en una casa de cambio. ' +
    'Al despertar descubre que puede volver atras al morir, y usa ese don para proteger a Emilia, a las gemelas Rem y Ram y a la gente de la mansion de Roswaal. ' +
    'Entre la seleccion real, el culto de la Bruja y la ballena blanca, cada bucle le cuesta una parte de si mismo.',

  anio: 2016,
  estado: 'emitiendo',
  estudio: 'WHITE FOX',

  // Fantasia por el mundo y la magia, misterio por los bucles y el culto,
  // y psicologico por el desgaste de morir una y otra vez. Son tres y no
  // una: la serie encaja en las tres listas y la wiki la enseña en las tres.
  categorias: ['Fantasía & Aventura', 'Thriller & Misterio', 'Seinen & Psicológico'],

  generos: ['Acción', 'Aventura', 'Drama', 'Fantasía', 'Psicológico', 'Romance', 'Thriller'],
};

export const ANIME_ID = 're-zero-comenzando-la-vida-en-otro-mundo';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * La T2 E14 se titula "STRAIGHT BET" tambien en Japon, tal como lo
 * lista TVDB S2E14 y la wikipedia en japones. No es un dato perdido:
 * es el subtitulo oficial, en mayusculas, del primer capitulo de la
 * segunda parte de la T2.
 *
 * La bandera le dice a `comprobar-datos.mjs` que no exija kanji ni
 * kana en el campo japones. El resto de los 84 capitulos si lo traen,
 * y ahi si se comprueba: un titulo japones que no es japones no sirve.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt5607616.
 *
 * La media ponderada de los 85 capitulos da 9,0 con mas de dos millones
 * de votos entre todos, pero la de la serie es 8,5: la ficha de la serie
 * la vota quien vio algo suelto y la del capitulo quien lo vio entero.
 * Se deja 8,5, que es la de la serie y no la de los capitulos.
 */
export const RATING_SERIE = 8.5;

/**
 * Capitulos en total.
 *
 *   T1  25  (abril - septiembre de 2016)
 *   T2  25  (julio 2020 - marzo 2021, en dos partes)
 *   T3  16  (octubre 2024 - marzo 2025, en dos partes)
 *   T4  19  (abril - septiembre de 2026, en dos partes)
 *   --
 *       85
 *
 * Coincide con TVDB S1-S4 y con IMDb, que declara 85.
 */
export const EPISODIOS_TOTAL = 85;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con doblaje y subtitulos en castellano.
 *   · Netflix     -> la serie completa hasta la T3, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'WHITE FOX',
    synopsis:
      'Veinticinco capitulos entre el 4 de abril y el 19 de septiembre de 2016. ' +
      'Subaru llega a otro mundo, muere junto a Emilia y descubre que vuelve atras al morir. ' +
      'Sirve en la mansion de Roswaal con Rem, Ram y Beatrice, se mete en la seleccion real como caballero autoproclamado de Emilia y cierra con la ballena blanca y el arzobispo de la pereza. ' +
      'La temporada del bucle, la mansion y la primera muerte de Rem.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'WHITE FOX',
    synopsis:
      'Veinticinco capitulos en dos partes, del 8 de julio de 2020 al 24 de marzo de 2021. ' +
      'Tras vencer a la ballena, nadie recuerda a Rem y Crusch ha perdido la memoria por la gula. ' +
      'El grupo se encierra en el santuario, donde Emilia debe superar las pruebas de la tumba y Subaru encara a Echidna, a Roswaal y a su propio pasado en Japon. ' +
      'La temporada del santuario, las brujas y el contrato con Beatrice.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'WHITE FOX',
    synopsis:
      'Dieciseis capitulos en dos partes, del 2 de octubre de 2024 al 26 de marzo de 2025. ' +
      'El grupo viaja a Pristella, la ciudad del agua, donde cuatro cabecillas del pecado toman las calles. ' +
      'Rem despierta sin recuerdos, Liliana canta contra la ira y la lucha se cierra con la caida de la codicia y el duelo de Wilhelm. ' +
      'La temporada de Pristella y la cuenta de caidos.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'WHITE FOX',
    synopsis:
      'Diecinueve capitulos en dos partes, del 8 de abril al 30 de septiembre de 2026. ' +
      'El grupo sube a la torre Pleyades para dar con Shaula y con el ultimo resto de la gula. ' +
      'Julius pierde su nombre, Meili cambia de lado y Ram encara al dios del rayo en lo alto. ' +
      'La temporada de la torre, la perdida y la vuelta con Shaula como heroina.',
    capitulos: 'T4',
  },
];
