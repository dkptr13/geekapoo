// META - Mob Psycho 100 (2016)
//
// TVDB 307375 (モブサイコ100, 2016, Ended) tiene 12 + 13 + 12
// episodios en las temporadas 1, 2 y 3. En la temporada 0 deja los seis
// mini-cortos, el OVA de Reigen y el especial "Primer viaje de Espíritus",
// que aqui van intercalados en su temporada, como en la wikipedia en
// espanol.
// AniList 21507 (primera), 101338 (segunda) y 140439 (tercera).
// IMDb tt5897304: 8,5 con unos 72.000 votos.
//
// Los titulos en castellano y las fechas salen de los anexos de
// temporada de la wikipedia en espanol; los titulos japoneses, de TVDB;
// las notas, de IMDb. Los resumenes son traduccion de los de la
// wikipedia en ingles.

export const ANIME = {
  titulo: 'Mob Psycho 100',

  japaneseTitle: 'モブサイコ100',

  synopsis:
    'Shigeo Kageyama, al que todos llaman Mob, es un chico de instituto que se esfuerza ' +
    'por no llamar la atencion. Lo que nadie sabe es que es un psychic muy poderoso, y que ' +
    'su poder se dispara cuando sus emociones se desbordan. Por eso lleva una vida sin ' +
    'sentimientos: el problema es que no puede seguir asi, y cada vez que alguien le importa ' +
    'un poco mas, el mundo se le descontrola un poco mas.',

  anio: 2016,
  estado: 'finished',
  estudio: 'Bones',

  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Comedia', 'Sobrenatural', 'Psicológico', 'Shōnen'],
};

export const ANIME_ID = 'mob-psycho-100';

/**
 * Titulos alternativos, para que la busqueda los encuentre.
 *
 * El japones ya esta en `japaneseTitle` y no hace falta repetirlo: el
 * segundo desambigua el año, que es como lo lista IMDb.
 */
export const ALIASES = [
  'Mob Psycho 100 (2016)',
];

/**
 * Nota de la serie en IMDb (tt5897304): 8,5 con unos 72.000 votos.
 */
export const RATING_SERIE = 8.5;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  13  (julio - septiembre de 2016, con el OVA de Reigen)
 *   T2  14  (enero - abril de 2019, con el especial del 13.5)
 *   T3  12  (octubre - diciembre de 2022)
 *   --
 *       39
 */
export const EPISODIOS_TOTAL = 39;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con doblaje en espanol.
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
    estudio: 'Bones',
    synopsis:
      'Doce episodios emitidos del 12 de julio al 27 de septiembre de 2016, con el OVA de ' +
      'Reigen intercalado. Mob intenta llevar una vida normal en el instituto y en el ' +
      'despacho de su madre, mientras la Escuela de Telepatia y los enemigos del poder se ' +
      'enfrentan a los monstruos que aparecen en la ciudad.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Mob Psycho 100 II',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Trece episodios emitidos del 7 de enero al 1 de abril de 2019, con el especial "Primer ' +
      'viaje de Espíritus" intercalado. Mob empieza a leer los pensamientos de los demas, y esa ' +
      'nueva capacidad le pone en el centro de una guerra entre la mafia que lo quiere y los ' +
      'heroes que lo protegen.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Mob Psycho 100 III',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Doce episodios emitidos del 6 de octubre al 22 de diciembre de 2022. Mob trabaja para ' +
      'la Asociacion de Heroes y descubre que el enemigo no es solo un monstruo: hay una ' +
      'organizacion que exploit sus poderes, y el arbol que se ha tragado a medio mundo le ' +
      'llama desde dentro.',
    capitulos: 'T3',
  },
];
