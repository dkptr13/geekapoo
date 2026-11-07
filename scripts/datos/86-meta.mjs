// META - 86: Eighty Six
//
// TVDB 378609 "８６―エイティシックス―" (2021, Ended).
// AniList 116589 (Parte 1, 2021) y 131586 (Parte 2, 2021).
// IMDb tt13718450, 23 capitulos en una sola temporada.
//
// El titulo es el romanizado oficial. TVDB guarda los veintitres en
// una sola temporada (S1E1 a S1E23) y el catalogo hace lo mismo: una
// T1, igual que la T2 de Re:Zero junto sus dos partes. Los cuatro de
// S0 son resumentes y comentarios y no entran, como los chibis de
// Tokyo Revengers.

export const ANIME = {
  titulo: '86: Eighty Six',

  japaneseTitle: '86―エイティシックス―',

  synopsis:
    'La Republica de San Magnolia dice luchar con maquinas sin piloto contra la Legion del Imperio. ' +
    'La verdad es que los aparatos los pilotan los 86, carne de cañon deshumanizada que muere lejos de las murallas. ' +
    'La comandante Lena dirige al escuadron Spearhead por radio y su procesador estrella, Shin, entierra a cada caido y oye sus voces. ' +
    'Guerra, discriminacion y redencion entre dos cursos que se miran sin verse.',

  anio: 2021,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  // Ciencia ficcion por la guerra de maquinas contra la Legion, y
  // psicologico por la culpa de Lena y la muerte buscada de Shin.
  // Son dos y no una: la serie sale en las dos listas.
  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico'],

  generos: ['Acción', 'Drama', 'Mecha', 'Ciencia ficción', 'Militar', 'Distopía', 'Supervivencia'],
};

export const ANIME_ID = '86-eighty-six';

/**
 * Nota de la serie completa en IMDb, serie tt13718450: 8,3 con unos
 * 17.000 votos.
 *
 * Los capitulos van del 7,6 al 9,7: el 22 y el 23 (Shin y Handler
 * One) son lo mejor y el 1 y el 15 lo peor. El resumen de junio de
 * 2021 no puntua como capitulo y no entra.
 */
export const RATING_SERIE = 8.3;

/**
 * Capitulos en total.
 *
 *   T1  23  (abril de 2021 - marzo de 2022, las dos partes juntas)
 *   --
 *       23
 *
 * AniList los parte en dos fichas (11 + 12) y TVDB los junta en su
 * S1 (E1 a E23): manda TVDB, que es lo que ordena el emparejador de
 * miniaturas.
 */
export const EPISODIOS_TOTAL = 23;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Veintitres capitulos entre el 11 de abril de 2021 y el 20 de marzo de 2022. ' +
      'Lena dirige al escuadron Spearhead desde la capital mientras Shin entierra a los suyos uno a uno, hasta la marcha sin retorno. ' +
      'Los que sobreviven despiertan en la Federacion de Giad, donde Ernst los acoge y Frederica los espera, y la guerra sigue con Morpho. ' +
      'Cierra con Lena cruzando el campo a pie hasta Shin.',
    capitulos: 'T1',
  },
];
