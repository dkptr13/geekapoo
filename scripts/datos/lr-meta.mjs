// LA FICHA DEL ANIME - Lycoris Recoil
//
// Titulo oficial tal cual, en ingles porque asi se conoce la serie
// en todos lados. Original de A-1 Pictures, no adaptacion.

export const ANIME = {
  titulo: 'Lycoris Recoil',

  // De TVDB, que lo trae de la ficha japonesa.
  japaneseTitle: 'リコリス・リコイル',

  // Base: la lista de capitulos de la Wikipedia en ingles, con los
  // argumentos de cada uno. Lo que tiene que quedar claro: no es una
  // serie de accion sin mas, es una comedia de cafe con tiroteos
  // donde la mejor asesina del pais no mata a nadie por principio, y
  // la gracia y el drama salen de ahi.
  synopsis:
    'Japon presume de ser el pais mas seguro del mundo porque una organizacion secreta, DA, ' +
    'limpia el crimen con ninas huerfanas convertidas en asesinas: las Lycoris. Takina Inoue, ' +
    'seria y obediente, la expulsan por desobedecer una orden y la plantan en un cafe de barrio, ' +
    'el LycoReco, con Chisato Nishikigi, la mejor Lycoris de la historia, que se niega a matar. ' +
    'Entre cafe, hackers, un terrorista con oido fino y una conspiracion para destapar la paz ' +
    'falsa del pais, Takina aprende a vivir fuera de DA y Chisato esconde que su corazon ' +
    'artificial se apaga. Trece capitulos de tiros no letales y sobremesa que se vuelven ' +
    'oscuros justo al final.',

  anio: 2022,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  // La lista del panel no tiene cajon de accion con vida diaria:
  // Shonen y accion es lo honesto (tiros cada capitulo) y va sola.
  categorias: ['Shonen & Acción'],

  generos: ['Acción', 'Recuentos de la vida', 'Drama'],
};

export const ANIME_ID = 'lycoris-recoil';

/**
 * Los titulos "japoneses" estan en ingles a proposito.
 *
 * Es el caso Tokyo Revengers (`TITULOS_EN_INGLES` existe por el):
 * los subtitulos oficiales de los capitulos estan escritos en
 * ingles y no hay version en japones ni dentro de Japon ni fuera
 * ("Easy does it", "Opposites attract"...). Poner una traduccion
 * al japones seria inventarla, asi que el campo lleva el subtitulo
 * oficial tal cual, incluido el apostrofo curvo de "What’s done
 * is done".
 */
export const TITULOS_EN_INGLES = true;

/**
 * UNA SOLA TEMPORADA
 *
 * T1  13 capitulos  (julio-septiembre de 2022)
 *
 * TVDB trae una S2 con un capitulo TBA sin fecha: anunciada pero
 * sin emitir, asi que no entra (una temporada sin capitulos se
 * guardaria vacia). Los seis cortos de 2025 ("Friends are thieves
 * of time") van como T2 porque ya estan emitidos, con nota 0 por
 * capitulo al no haber dato IMDb verificado.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Takina cae del DA al cafe LycoReco y Chisato le ensena a vivir: hackers, terroristas ' +
      'y encargos raros entre cafe y uniformes. Por debajo corre lo serio: Majima quiere ' +
      'reventar la paz falsa del pais, el instituto Alan mueve a Chisato como pieza y su ' +
      'corazon artificial se apaga. Tiros, amistad y un final en la torre de radio con el ' +
      'tiempo prestado.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Friends are thieves of time',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Seis cortos de vida diaria en el cafe: fiestas, viajes, sustos caseros y pijamadas ' +
      'con las Lycoris fuera de servicio. Sin tiros serios, solo el grupo entero siendo ' +
      'el grupo entero. Cierra con el viaje a Hawaii que se prometio al final de la serie.',
    capitulos: 'T2',
  },
];

/**
 * Nota de la serie en IMDb: 7,6 con unos 4.600 votos.
 *
 * La explican el 12 y el 13 (8,3 los dos): el asalto a la torre y
 * el duelo final con el corazon fallando. El resto se mueve entre
 * el 7,4 y el 8,2 sin baches, que es lo propio de una serie que
 * no tiene capitulo de relleno.
 */
export const RATING_SERIE = 7.6;

/**
 * Capitulos en total: 13 de la serie mas 6 cortos = 19.
 */
export const EPISODIOS_TOTAL = 19;

/**
 * Donde se emite, verificado en JustWatch Espana: Crunchyroll.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];
