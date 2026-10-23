// LA FICHA DEL ANIME - Blue Lock
//
// Programa de entrenamiento de la federacion japonesa para
// encontrar el delantero que marque el gol de la victoria en el
// Mundial. Encierra a trescientos delanteros de instituto en
// una isla-prision y solo uno sale con el puesto.
//
// La serie va de octubre de 2022 a marzo de 2023, en 8bit, y
// termina con el partido contra la seleccion de Japon U-20. El
// manga de Muneyuki Kaneshiro salio entre 2018 y 2021.
//
// Los datos de la serie en IMDb son tt15222080: 8,1 con unos
// 35.000 votos. Los capitulos van del 7,4 al 9,2: lo mas alto
// es el decimo (9,2) y el séptimo (8,8).

export const ANIME = {
  titulo: 'Blue Lock',

  // La grafia oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'ブルーロック',

  // Base: la sinopsis de AniList (137822) y el argumento de la
  // temporada, en castellano.
  synopsis:
    'Japón quiere volver a ganar el Mundial y la federacion sale con un metodo ' +
    'brutal: encerrar a trescientos delanteros de instituto en una isla-prision para que se ' +
    'descugren entre ellos hasta que quede uno. Yoichi Isagi entra en ese programa sin ser ' +
    'nadie: ni velocidad, ni fuerza, ni talento. Lo que tiene es una vista del campo que le ' +
    'enseña la jugada antes de que ocurra, y con ella descubre que para marcar el gol que ' +
    'cuenta no hace falta ser el mejor, sino usar a todos los demas.',
  anio: 2022,
  estado: 'finished',
  estudio: '8bit',

  // Competitivo de instituto con superpoderes: la
  // categoria de accion y la de slice of life que tiene de fondo
  // el programa.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Deportes', 'Fútbol', 'Competencia', 'Supervivencia', 'Ekstasis'],
};

export const ANIME_ID = 'blue-lock';

/**
 * Nota de la serie en IMDb (tt15222080): 8,1 con unos 35.000 votos.
 */
export const RATING_SERIE = 8.1;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   24  (octubre 2022 - marzo 2023)
 *   T2    1  (abril 2024, pelicula EPISODE Nagi)
 *   T3   14  (octubre - diciembre 2024, arco U-20)
 *   --
 *        39
 */
export const EPISODIOS_TOTAL = 39;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie (ficha de crunchyroll.com).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: '8bit',
    synopsis:
      'Veinticuatro capitulos del 8 de octubre de 2022 al 26 de marzo de 2023, en 8bit. ' +
      'Isagi entra en Blue Lock sin talento y sale con el puesto de delantero de Japon: ' +
      'Zero le ensena que solo vale el gol de la victoria, Bachira le ensena que el regate ' +
      'es un arma, y Shidou le ensena que hay depredadores mas grandes que el. ' +
      'Cierra con el cuatro a tres contra la seleccion de Japon U-20.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Blue Lock: EPISODE Nagi',
    anio: 2024,
    estado: 'Finalizado',
    estudio: '8bit',
    synopsis:
      'La pelicula cuenta como temporada: es una obra por si misma, con su fecha y su nota ' +
      'propias. Shouyou Itoshi, el hermano mayor de Rin, se abre paso entre los defenses ' +
      'de la seleccion de Japon para llegar a la final de la U-20, donde espera encontrarse ' +
      'con su hermano. Blue Lock lo sigue en silencio, con Nagi.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Blue Lock VS. U-20 JAPAN',
    anio: 2024,
    estado: 'Finalizado',
    estudio: '8bit',
    synopsis:
      'Catorce capitulos del 5 de octubre al 28 de diciembre de 2024. Blue Lock se mide con ' +
      'la seleccion de Japon U-20, donde aparece Sae Itoshi, el mejor delantero del pais. ' +
      'Isagi aprende que su vista sola no basta: contra ese rival hacen falta unos demas ' +
      'que confien en el, y el chico tiene que jugar con la cabeza del equipo.',
    capitulos: 'T3',
  },
];
