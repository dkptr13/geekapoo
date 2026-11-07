// LA FICHA DEL ANIME - The Shiunji Family Children
//
// Comedia romántica de Reiji Miyajima (el de Rent-a-Girlfriend, aquí
// con Reiji Yukino de apoyo), en la Young Animal de Hakusensha desde
// 2022. Siete hermanos guapos descubren que no hay sangre entre ellos
// y las cinco hermanas empiezan a mirar al mayor de otra forma.
//
// Ficha de AniList: 174802 (T1, 2025). Solo hay una temporada: la
// segunda no está ni anunciada. Doga Kobo anima con Kamitsubo
// dirigiendo y Kimura de compositor.
//
// Los datos de la serie en IMDb son tt35331428: 6,8 con unos 1.700
// votos. Crunchyroll la emite en todo el mundo con doblaje propio.

export const ANIME = {
  titulo: 'The Shiunji Family Children',

  // La grafía oficial japonesa, de AniList y de la web oficial.
  japaneseTitle: '紫雲寺家の子供たち',

  // Base: las Wikipedias en inglés (serie) y en japonés (fechas y
  // personal) y la web oficial (argumentos por capítulo). Misma casa
  // que Rent-a-Girlfriend por parte de autor, pero aquí el enredo es
  // de familia: hermanos que no lo son.
  synopsis:
    'Los siete hermanos Shiunji, guapos famosos de Setagaya, viven juntos hasta que su padre ' +
    'revela que no hay sangre entre ellos. Arata, el mayor, pasa a ser el centro de cinco ' +
    'hermanas que se le declaran por turnos: Kotono la primera, Ouka en el Fuji, Minami tras ' +
    'la final... Comedia romántica de hermanos que no lo son.',

  anio: 2025,
  estado: 'finished',
  estudio: 'Doga Kobo',

  // Comedia romántica escolar, como las Quintillizas, que usan lo
  // mismo: romance y comedia por delante.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Comedia', 'Drama', 'Escolar', 'Harem'],
};

export const ANIME_ID = 'the-shiunji-family-children';

/**
 * Nota de la serie en IMDb (tt35331428): 6,8 con unos 1.700 votos.
 *
 * Los capítulos van del 7,2 al 8,4: lo más alto son el séptimo y el
 * décimo, los dos de giro (Minami y el Fuji).
 */
export const RATING_SERIE = 6.8;

/**
 * Capítulos en total, en orden de emisión.
 *
 *   T1   12  (abril - junio de 2025)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la emite en todo el mundo con doblaje propio
 *     (fichas de crunchyroll.com y aviso de simulcast en 2025).
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Doga Kobo',
    synopsis:
      'Doce capítulos del 8 de abril al 24 de junio de 2025, en Doga Kobo con Kamitsubo ' +
      'dirigiendo. El cumple de Kotono trae la bomba: sin sangre entre hermanos. Confesiones, ' +
      'parque, pesas con Minami, el Fuji de Ouka y Karuizawa cierran una temporada que deja a ' +
      'todas mirando a Arata.',
    capitulos: 'T1',
  },
];
