// LA FICHA DEL ANIME - Makeine: Too Many Losing Heroines!
//
// Titulo oficial en ingles, que es como la conoce todo el mundo
// fuera de Japon (dentro es "Makeine" a secas).

export const ANIME = {
  titulo: 'Makeine: Too Many Losing Heroines!',

  // De TVDB, que lo trae de la ficha japonesa.
  japaneseTitle: '負けヒロインが多すぎる！',

  // Base: la ficha de la Wikipedia en ingles y los argumentos por
  // capitulo. Lo que tiene que quedar claro: no es un harem, es lo
  // contrario, la historia de las que pierden, y el protagonista es
  // un extra que se mete donde no lo llaman a base de dar pena y
  // buenos consejos.
  synopsis:
    'Kazuhiko Nukumizu se tiene por un personaje de fondo: lee novelas ligeras y no habla con ' +
    'nadie. Hasta que ve a Anna Yanami, la chica popular de clase, llorar porque su amigo de la ' +
    'infancia prefiere a otra. La etiqueta como heroina perdedora y sin querer se convierte en ' +
    'el paño de lagrimas de Anna, de Lemon la deportista y de Chika la timida del club de ' +
    'literatura. Tres chicas preciosas a las que nadie eligio, un chico al que nadie mira y una ' +
    'escuela entera de amores cruzados. Comedia romantica al reves: aqui nadie gana al chico, ' +
    'y aun asi nadie quiere perderse el siguiente capitulo.',
  anio: 2024,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  // Comedia romantica escolar de manual: los dos cajones del panel.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Romance', 'Recuentos de la vida', 'Escolar'],
};

export const ANIME_ID = 'makeine-too-many-losing-heroines';

/**
 * UNA SOLA TEMPORADA
 *
 * T1  12 capitulos  (julio-septiembre de 2024)
 *
 * Segunda temporada anunciada en abril de 2025, sin fecha. No entra
 * hasta emitirse: una temporada sin capitulos se guardaria vacia.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Nukumizu ve llorar a Anna y la apadrina sin querer; luego a Lemon, plantada por su ' +
      'amigo de la infancia, y a Chika, incapaz de confesarse. Entre playa, festival y ' +
      'club de literatura, las tres van superando sus rupturas mientras el sigue creyendo ' +
      'que es un extra. Cierra con cita falsa en el parque de atracciones y la sospecha de ' +
      'que el extra igual es protagonista.',
    capitulos: 'T1',
  },
];

/**
 * Nota de la serie en IMDb: 7,4 con unos 3.900 votos.
 *
 * La sostiene el arranque (el piloto tiene un 8 con mas de 400
 * votos) y no se cae nunca del 7 largo. Comedia romantica que
 * puntua como drama medio, que es lo que es por debajo.
 */
export const RATING_SERIE = 7.4;

/**
 * Capitulos en total: los 12 de la unica temporada, del 14 de julio
 * al 29 de septiembre de 2024.
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite: Crunchyroll la llevo en todo el mundo salvo Asia
 * (ficha de la Wikipedia en ingles), Espana incluida.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];
