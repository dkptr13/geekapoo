// META - Tenki no Ko
//
// AniList 106286 (peli, 2019, 115 minutos).
// IMDb tt9426210.
// TVDB la tiene como peli suelta (movie 131137), sin arte de
// episodio: el capitulo va sin miniatura.
//
// El titulo romanizado es el oficial en todo el mundo
// ("Weathering With You" es la licencia en ingles).

export const ANIME = {
  titulo: 'Tenki no Ko',

  japaneseTitle: '天気の子',

  synopsis:
    'Hodaka se fuga a un Tokio donde no deja de llover y conoce a Hina, que despeja el cielo rezando. ' +
    'Montan negocio de sol de alquiler entre revista oculta y polis detras. ' +
    'Ciento quince minutos de Shinkai pasado por agua con Tokio hundiendose.',

  anio: 2019,
  estado: 'finished',
  estudio: 'CoMix Wave',

  // Romance fantastico con lluvia eterna y sacrificio: amor y fin
  // del mundo. Son dos.
  categorias: ['Romance & Comedia', 'Fantasía & Aventura'],

  generos: ['Drama', 'Romance', 'Sobrenatural'],
};

export const ANIME_ID = 'tenki-no-ko';

/**
 * Nota de la peli completa en IMDb, tt9426210: 7,5 con unos
 * 73.000 votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 7.5;

/**
 * Capitulos en total: la peli, del 19 de julio de 2019.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la ficha de la enciclopedia de Anime News Network
 *     la lista en España.
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'CoMix Wave',
    synopsis:
      'Ciento quince minutos del 19 de julio de 2019. ' +
      'Hodaka fugado y Hina del sol con negocio de despejar cielos en un Tokio empapado. ' +
      'Shinkai con lluvia eterna, sacrificio y cameos de Tu nombre de propina.',
    capitulos: 'T1',
  },
];
