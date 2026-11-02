// LA FICHA DEL ANIME - Haikyuu!!: La batalla del basurero
//
// El Nacional de Primavera llega a su momento clave: Karasuno se
// enfrenta por fin a Nekoma, el equipo con el que lleva años cruzando
// amistosos. Es el partido del basurero, el duelo entre cuervos y
// gatos que ambos entrenadores llevan esperando desde su juventud.
//
// Pelicula de 2024 dirigida por Susumu Mitsunaka y animada por
// Production I.G. Dura 85 minutos y se estreno en Japon el 16 de
// febrero de 2024.
//
// Ficha de AniList: 153658. IMDb tt30476486: 7,8 con unos 8.800
// votos.

export const ANIME = {
  titulo: 'Haikyuu!!: La batalla del basurero',

  // La grafia oficial japonesa, de AniList.
  japaneseTitle: 'ハイキュー!! ゴミ捨て場の決戦',

  // Base: la sinopsis de AniList (153658), en castellano.
  synopsis:
    'El Nacional de Primavera llega a su momento clave: Karasuno se enfrenta por fin a Nekoma, ' +
    'el equipo con el que lleva años cruzando amistosos. Es el partido del basurero, el duelo ' +
    'entre cuervos y gatos que ambos entrenadores llevan esperando desde su juventud. Hinata y ' +
    'Kenma, dos jugadores que ven el voleibol de forma opuesta, se juegan el pase a la siguiente ' +
    'ronda en un partido que decide mucho más que un billete en el torneo.',

  anio: 2024,
  estado: 'finished',
  estudio: 'Production I.G',

  // La misma familia que la serie: competicion de instituto,
  // personajes muy marcados y drama deportivo.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Deportes', 'Voleibol', 'Equipo', 'Amistad', 'Competencia'],
};

export const ANIME_ID = 'haikyuu-la-batalla-del-basurero';

// Nombres con los que se busca la pelicula en otras fuentes.
export const ALIASES = [
  'Haikyuu!!: The Dumpster Battle',
  'Haikyuu!!: Gomi Suteba no Kessen',
  'Haikyuu!!: La batalla en el basurero',
];

/**
 * Nota de la pelicula en IMDb (tt30476486): 7,8 con unos 8.800 votos.
 */
export const RATING_SERIE = 7.8;

/**
 * La pelicula es un solo capitulo.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en Espana.
 *
 *   - Crunchyroll -> la pelicula esta en su catalogo.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'Pelicula de 85 minutos estrenada en Japon el 16 de febrero de 2024. Karasuno y Nekoma ' +
      'se enfrentan en el Nacional de Primavera, el esperado duelo del basurero que decide ' +
      'quien sigue vivo en el torneo.',
    capitulos: 'T1',
  },
];
