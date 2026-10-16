// LA FICHA DEL ANIME - Erased
//
// Misterio de Kei Sanbe, en la Young Ace de Kadokawa de 2012 a 2016,
// con 8 tomos. Un dibujante con revivals que le devuelven minutos
// salta 18 años para evitar que maten a su madre y a tres niños.
//
// Solo hay una temporada de 12 (2016), en A-1 Pictures para Noitamina
// con Itou dirigiendo y Kishimoto de guionista. Las versiones de
// imagen real (peli y drama) no entran.
//
// Los datos de la serie en IMDb son tt5249462: 8,4 con unos 76.000
// votos.

export const ANIME = {
  titulo: 'Erased',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: '僕だけがいない街',

  // Base: las Wikipedias en inglés (serie, con los argumentos) y en
  // japonés (fechas y personal) y la web oficial (argumentos por
  // capítulo). Volver a quinto para que nadie muera, y el maestro al
  // fondo de todo.
  synopsis:
    'Satoru, dibujante de 29 años, revive minutos para evitar desgracias hasta que halla a su ' +
    'madre muerta y salta a 1988, a quinto de primaria. Para salvarla a ella y a Kayo, Aya e ' +
    'Hiromi tiene que señalar al culpable entre los adultos que lo rodean, con su maestro ' +
    'Yashiro siempre cerca. Misterio de saltos con asesino escondido en la escuela.',

  anio: 2016,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  // Thriller de misterio escolar con carga psicológica, como Classroom
  // of the Elite, que junta las tres.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio', 'Shojo & Escolar'],

  generos: ['Drama', 'Psicológico', 'Misterio', 'Thriller'],
};

export const ANIME_ID = 'erased';

/**
 * Nota de la serie en IMDb (tt5249462): 8,4 con unos 76.000 votos.
 *
 * Los capítulos van del 8,2 al 9,1: lo más alto es el cuarto (9,1) y
 * el octavo (8,9). Serie corta y pareja.
 */
export const RATING_SERIE = 8.4;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   12  (enero - marzo de 2016)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

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
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Doce capítulos del 8 de enero al 25 de marzo de 2016, en A-1 Pictures para Noitamina ' +
      'con Itou dirigiendo. Satoru salta a 1988 a salvar a Kayo y vuelve con Yashiro de ' +
      'maestro: escondites, coma de 15 años y azotea final. Cierra con el tesoro a salvo.',
    capitulos: 'T1',
  },
];
