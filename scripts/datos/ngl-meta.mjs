// META - No Game No Life
//
// ── EL TITULO ─────────────────────────────────────────────────────
//
// El japones es ノゲームノライフ, sin puntos y todo seguido, que es como
// lo escribe Yuu Kamiya en la web y en la revista. En el catalogo de este
// sitio va con espacios, "No Game No Life", que es como lo escribe
// AniList y como aparece en las fichas de fuera.
//
// El titulo viene de la regla numero diez de este mundo: "El juego
// continua". No es un nombre, es una frase, y es tambien el lema de los
// dos protagonistas.
//
// ── DE DONDE VIENEN LAS NOTAS ─────────────────────────────────────
//
// IMDb:
//
//   tt3431758  la serie   7,5 con 22.795 votos
//   tt5914996  Zero       7,3 con 5.541 votos
//
// La media ponderada de los dos sale 7,46, que redondea a 7,5.
//
// ── LAS DOS TEMPORADAS ────────────────────────────────────────────
//
//   T1  2014  la serie de television, 12 capitulos
//   T2  2017  la pelicula Zero, 1 capitulo
//
// Zero va aparte porque es una precuela. Puesta dentro de la T1 haria que
// la serie pareciera de trece capitulos desordenados, porque lo que pasa
// en ella es anterior a la llegada de Sora y Shiro y lo que pasa despues
// es lo que la serie explica en su capitulo doce.
//
// ── LO QUE NO SE GUARDA ──────────────────────────────────────────
//
// "No Game No Life Mini OVAs" (2014, 6 capitulos). Son cortos de unos
// cinco minutos que salian de regalo con los volumenes en Blu-ray y DVD.
//
// Fuera por lo mismo que las mini-Ovas de Toradora y Petit Eva: no son
// capitulos de la historia, son material extra que va con el fisico. IMDb
// los tiene en un titulo aparte (tt7447044) con nota 5,6 y sin fecha de
// emision en ninguno de los seis.
//
// ── LA SERIE ──────────────────────────────────────────────────────
//
// Sora y Shiro llevan años sin salir de su cuarto. No es metáfora: no
// salen. Son hermanos de sangre por un lado y de hogar por otro, y entre
// los dos han ganado más de doscientos ochenta juegos sin perder uno
// nunca, incluyendo un ajedrez por red contra el dios que escribe las
// reglas de este mundo. . Eso es lo que los trae aqui.
//
// El reparto se divide de una manera que no cambia nunca: Shiro juega,
// Sora habla. Ella calcula; el negocia. Entre los dos son el condicion del
// mundo entero y ninguno de los dos sabe hacer por sí solo lo que hace el
// otro, y por eso la serie nunca los separa.
//
// Lo que hay debajo es una guerra de ochocientos años: Jibril, el dios del
// cielo, que perdió su magia en la guerra y le costó el título y
// casi le costó el mundo. La serie cuenta su versión de esa guerra, y la
// pelcula Zero cuenta la de los que estaban en el otro lado.

export const ANIME = {
  titulo: 'No Game No Life',

  japaneseTitle: 'ノゲームノライフ',

  synopsis:
'Sora y Shiro llevan años sin salir de su cuarto. Son hermanos, uno de sangre y otro de hogar, y entre ' +
    'los dos han ganado más de doscientos ochenta juegos sin perder ni uno: uno de ellos es un genio del ' +
    'cálculo y el otro es un negociador que no sabe ni hablar con la gente. Un día un dios les reta a una ' +
    'partida de ajedrez por red, que es lo que juegan, y ellos ganan. Eso es lo único que hace que los dos ' +
    'acaben en un mundo donde manda quien escribe las reglas, y es también su problema: de golpe tienen que ' +
    'relacionarse con gente de verdad. Lo primero que encuentran es a un dios caído que lleva ochocientos años ' +
    'siendo el peor del cielo y al que le están retirando el cargo, y acaban montando con él una alianza de ' +
    'quince reinos para jugar la partida contra el dios que conquistó el mundo ochocientos años atrás. Cada ' +
    'capítulo se llama como una casilla de ajedrez, y el séptimo se titula sacrificio justo antes de la ' +
    'partida, que es exactamente lo que toca: dejar que alguien pague. Shiro es quien juega y quien va ' +
    'perdiendo; Sora es quien habla y quien no sabe encajar un plan de ochocientos años dentro de una ' +
    'conversación de diez minutos. Los dos vuelven a su cuarto al final, y ya no son los mismos. La película ' +
    'cuenta lo que pasó antes, cuando esa misma familia perdía la guerra y tuvo que aprender a reagruparse.',
  
  anio: 2014,
  estado: 'finished',
  estudio: 'Madhouse',

  categorias: ['Fantasía & Aventura'],

  generos: ['Isekai', 'Aventura', 'Fantasía', 'Juego'],
};

export const ANIME_ID = 'no-game-no-life';

/**
 * Media ponderada de las dos obras en IMDb:
 *
 *   tt3431758  la serie   7,5 con 22.795 votos
 *   tt5914996  Zero       7,3 con  5.541 votos
 *
 * (7,5 x 22.795 + 7,3 x 5.541) / 28.336 = 7,46
 */
export const RATING_SERIE = 7.5;

/**
 * Capitulos en total.
 *
 *   T1  12  (abril - junio de 2014)
 *   T2   1  (julio de 2017, la pelicula)
 *   ---
 *       13
 */
export const EPISODIOS_TOTAL = 13;

/** Donde se emite, fuera de Japon. */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
'Doce capítulos que empiezan con dos hermanos que no han salido de su cuarto en años y terminan con ' +
      'la partida más importante del mundo. El reparto no cambia nunca: Shiro juega, Sora habla. A mitad ' +
      'se instalan en la ciudad de los que fracasaron; más adelante la serie se salta ochocientos años para ' +
      'contar la guerra que casi acaba con la humanidad; y después se vuelve al presente a montar una ' +
      'alianza de quince reinos. Los capítulos van numerados con los rangos del ajedrez. El mejor es el ' +
      'sexto, el que gana con una sola jugada, y el peor puntuado es el décimo, que es el único que ocurre ' +
      'entero dentro de una sala. La dirección es de Atsuko Ishizuka y el estudio es Madhouse.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Zero',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Una película de 102 minutos que va antes que la serie y que casi es el final de esta. Cuenta la ' +
      'familia Dola ochocientos años antes de la llegada de Sora y Shiro: los dos hermanos, la hermana ' +
      'pequeña que se queda al cuidado del otro, y un dios al que le retiran el título en plena guerra ' +
      'mientras la humanidad deja de existir casi por completo. Es la parte que la serie de televisión ' +
      'solo menciona, y el reparto solo coincide a medias: de los diecisiete personajes que AniList lista ' +
      'para la película, cinco son de aquí y no salen en la serie, y cuatro son de la serie y no salen ' +
      'aquí. Lo que se resuelve aquí es lo que explica por qué Jibril lleva ochocientos años intentando ' +
      'morirse, y por eso va después de la serie y no antes.',
    capitulos: 'T2',
  },
];