// META - Hello World
//
// AniList 106240 (peli, 2019, 98 minutos).
// IMDb tt9418812.
// TVDB la tiene como peli suelta (movie 133208), sin arte de
// episodio: el capitulo va sin miniatura.
//
// El titulo en ingles es el oficial en todo el mundo, hasta en
// Japon.

export const ANIME = {
  titulo: 'Hello World',

  japaneseTitle: 'HELLO WORLD',

  synopsis:
    'En el Kioto de 2027, Naomi conoce a su yo de dentro de diez años: Ruri morira en tres meses y hay que salvarla. ' +
    'Entre mundos simulados y manos que se tienden, el pasado se reescribe a base de querer. ' +
    'Noventa y ocho minutos de Graphinica con giros hasta el ultimo minuto.',

  anio: 2019,
  estado: 'finished',
  estudio: 'Graphinica',

  // Romance de ciencia ficcion con viajes y simulacion: futuro y
  // amor. Son dos.
  categorias: ['Ciencia Ficción & Cyberpunk', 'Romance & Comedia'],

  generos: ['Drama', 'Romance', 'Ciencia ficción'],
};

export const ANIME_ID = 'hello-world';

/**
 * Un titulo con titulo oficial en ingles.
 *
 * Hasta el japones es ingles aqui: AniList lista la peli en
 * ingles. La bandera le dice a `comprobar-datos.mjs` que no exija
 * kanji ni kana, igual que Burn the Witch.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la peli completa en IMDb, tt9418812: 6,7 con unos 5.400
 * votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 6.7;

/**
 * Capitulos en total: la peli, del 20 de septiembre de 2019.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Filmin -> ficha viva con compra en filmin.es.
 */
export const STREAMING = [
  { name: 'Filmin', url: 'https://www.filmin.es', badgeColor: 'bg-teal-500/20 text-teal-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Graphinica',
    synopsis:
      'Noventa y ocho minutos del 20 de septiembre de 2019. ' +
      'Naomi y su yo futuro contra el destino de Ruri en un Kioto simulado. ' +
      'Ito (Erased, SAO) con romance sci-fi y giros hasta el ultimo minuto.',
    capitulos: 'T1',
  },
];
