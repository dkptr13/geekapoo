// META - Kimi no Na wa.
//
// AniList 21519 (peli, 2016, 107 minutos).
// IMDb tt5311514.
// TVDB la tiene como peli suelta (movie 197), sin arte de
// episodio: el capitulo va sin miniatura.
//
// El titulo romanizado con punto es el oficial en todo el mundo
// ("Your Name." es la licencia en ingles).

export const ANIME = {
  titulo: 'Kimi no Na wa.',

  japaneseTitle: '君の名は。',

  synopsis:
    'Mitsuha, de pueblo, y Taki, de Tokio, despiertan cambiados de cuerpo sin conocerse de nada. ' +
    'Entre hilos rojos, sake de boca y un cometa que parte el cielo, se buscan para no olvidarse. ' +
    'Ciento siete minutos de Shinkai que reventaron la taquilla mundial.',

  anio: 2016,
  estado: 'finished',
  estudio: 'CoMix Wave',

  // Romance fantastico con viajes en el tiempo y desastre: amor y
  // fin del mundo. Son dos.
  categorias: ['Romance & Comedia', 'Fantasía & Aventura'],

  generos: ['Drama', 'Romance', 'Sobrenatural', 'Escolar'],
};

export const ANIME_ID = 'kimi-no-na-wa';

/**
 * Nota de la peli completa en IMDb, tt5311514: 8,4 con unos
 * 408.000 votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 8.4;

/**
 * Capitulos en total: la peli, del 26 de agosto de 2016.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Amazon Prime -> alquiler y compra en Prime Video España.
 */
export const STREAMING = [
  { name: 'Amazon Prime', url: 'https://www.amazon.es/prime-video', badgeColor: 'bg-sky-500/20 text-sky-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'CoMix Wave',
    synopsis:
      'Ciento siete minutos del 26 de agosto de 2016. ' +
      'Taki y Mitsuha cambiando de cuerpo entre Tokio y el pueblo, con cometa encima y olvido acechando. ' +
      'La peli anime mas grande de su decada, con Shinkai y RADWIMPS al frente.',
    capitulos: 'T1',
  },
];
