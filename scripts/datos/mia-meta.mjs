// LA FICHA DEL ANIME - Made in Abyss
//
// Fantasía de Akihito Tsukushi, en la Web Comic Gamma de Takeshobo
// desde 2012. Un hoyo de monstruos y reliquias baja por capas que
// maldicen al subir: una huérfana y un robot bajan a buscar a su
// madre entre silbatos blancos.
//
// Fichas de AniList: 97986 (T1, 2017), 100643 (película 3, 2020) y
// 114745 (T2, 2022). Las dos primeras pelis son resúmenes y los cortos
// de Marulk y el especial de papás no entran. La trilogía nueva que
// empieza en octubre de 2026 no entra hasta emitirse.
//
// Kinema Citrus anima todo con Kojima dirigiendo y Kurata de guionista,
// música de Kevin Penkin.
//
// Los títulos de temporada son los oficiales en el idioma que pide el
// emparejador de AniList: la peli en inglés y la T2 en romaji, porque
// AniList la lista así ("Retsujitsu no Ougonkyou") y con el inglés no
// puntúa.
//
// Los datos de la serie en IMDb son tt7222086: 8,3 con unos 22.500
// votos. En la T1 IMDb usa fechas americanas desde el segundo; aquí
// van las japonesas.

export const ANIME = {
  titulo: 'Made in Abyss',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: 'メイドインアビス',

  // Base: las Wikipedias en inglés (serie y capítulos, con los
  // argumentos) y en japonés (fechas y personal). Bajar es fácil;
  // subir te mata o te cambia. Aventura con horror corporal y
  // maldiciones por capa.
  synopsis:
    'En Orth, junto a un abismo de monstruos y reliquias, la huérfana Riko encuentra un niño ' +
    'robot y lo llama Reg. Con el silbato blanco de su madre Lyza y una nota que la espera al ' +
    'fondo, bajan por capas que maldicen al que sube: campamentos, soberanas, huecos que fueron ' +
    'personas y señores del amanecer. Fantasía de aventura donde cada capa cuesta un trozo.',

  anio: 2017,
  estado: 'finished',
  estudio: 'Kinema Citrus',

  // Fantasía de aventura juvenil con el drama por delante, como
  // DanMachi: hoyo, reliquias y expedición.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Aventura', 'Drama', 'Fantasía', 'Misterio'],
};

export const ANIME_ID = 'made-in-abyss';

/**
 * Nota de la serie en IMDb (tt7222086): 8,3 con unos 22.500 votos.
 *
 * Los capítulos van del 7,5 al 9,6: lo más alto es el final de la T1
 * (E13, 9,6) y el veneno de la T1 (E10, 9,2). La peli va por 8,0.
 */
export const RATING_SERIE = 8.3;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   13  (julio - septiembre de 2017)
 *   T2    1  (película 3, enero de 2020)
 *   T3   12  (julio - septiembre de 2022)
 *   --
 *        26
 */
export const EPISODIOS_TOTAL = 26;

/**
 * Donde se emite en España.
 *
 *   · Amazon Prime -> la primera temporada está en Prime Video España
 *     (ficha de primevideo.com con locale español).
 */
export const STREAMING = [
  { name: 'Amazon Prime', url: 'https://www.amazon.es/prime-video', badgeColor: 'bg-sky-500/20 text-sky-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'Trece capítulos del 7 de julio al 29 de septiembre de 2017, en Kinema Citrus. Riko y ' +
      'Reg bajan del orfanato al campamento de Ozen, sobreviven al bosque y la falla, y Nanachi ' +
      'se une tras lo de Mitty. Cierra con Bondrewd mirando y la quinta capa esperando.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Dawn of the Deep Soul',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'La película del 17 de enero de 2020 (105 minutos), en Kinema Citrus. Ido Front recibe ' +
      'al trío con Bondrewd y Prushka. Los cartuchos esconden un horror y el combate quema ' +
      'todo: Prushka se vuelve el silbato blanco de Riko.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Retsujitsu no Ougonkyou',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Kinema Citrus',
    synopsis:
      'Doce capítulos del 6 de julio al 28 de septiembre de 2022, en Kinema Citrus. La sexta ' +
      'capa y la aldea de huecos que funciona por valor: Ganja en el pasado, Faputa en el ' +
      'presente e Irumyuui debajo de todo. Cierra con la aldea destruida y Vueko en paz.',
    capitulos: 'T3',
  },
];
