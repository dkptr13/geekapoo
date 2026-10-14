// META - Kabaneri of the Iron Fortress
//
// TVDB 305082 "甲鉄城のカバネリ" (2016, Ended). La serie va en S1
// y la peli en Specials (S0E6 entera; los S0E3 a S0E5 son su
// version partida y aqui no entran). Los recopilatorios no entran.
// AniList 21196 (T1, 2016, 12) y 97918 (T2 peli Unato, 2019).
// IMDb tt5556656 (serie) y tt10253816 (peli).
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Kabaneri of the Iron Fortress',

  japaneseTitle: '甲鉄城のカバネリ',

  synopsis:
    'Ikoma, herrero medio kabane, y Mumei, niña kabaneri con rifle, huyen en el tren Kotetsujo. ' +
    'Entre estaciones caidas, Biba con ejercito y Unato por retomar, el hierro viaja con hambre. ' +
    'Serie y peli de WIT con muertos vivientes de corazon acorazado.',

  anio: 2016,
  estado: 'finished',
  estudio: 'WIT STUDIO',

  // Fantasia de acero con zombis y trenes: bichos y vias. Son dos.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Drama', 'Fantasía', 'Zombis'],
};

export const ANIME_ID = 'kabaneri-of-the-iron-fortress';

/**
 * Nota de la serie completa en IMDb, serie tt5556656: 7,2 con unos
 * 8.300 votos. El T1 E2 es lo mejor con 8,1.
 */
export const RATING_SERIE = 7.2;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   12  (abril - julio de 2016, serie)
 *   T2    1  (mayo de 2019, peli Unato)
 *   --
 *        13
 */
export const EPISODIOS_TOTAL = 13;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 *   (JustWatch España solo confirma la recap 1; la serie va con Crunchyroll.)
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'WIT STUDIO',
    synopsis:
      'Doce capitulos entre el 8 de abril y el 1 de julio de 2016. ' +
      'Ikoma y Mumei huyen en el Kotetsujo entre estaciones caidas y Biba con ejercito. ' +
      'Cierre entrando en la fortaleza de hierro.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Unato',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'WIT STUDIO',
    synopsis:
      'Sesenta y ocho minutos del 10 de mayo de 2019. ' +
      'Unato por retomar con Mumei al frente y nido nuevo en la fortaleza caida. ' +
      'Peli de puente con el tren de por medio.',
    capitulos: 'T2',
  },
];
