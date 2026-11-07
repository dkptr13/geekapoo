// META - Solo Leveling
//
// TVDB 389597 "俺だけレベルアップな件" (2024, Continuing; el S0E5
// sin fecha es el trailer de lo siguiente y no entra).
// AniList 151807 (T1, 2024, 12 capitulos) y 176496 (T2, 2025, 13).
// IMDb tt21209876.
// La peli recopilatoria ReAwakening no entra: es un resumen.

export const ANIME = {
  titulo: 'Solo Leveling',

  japaneseTitle: '俺だけレベルアップな件',

  synopsis:
    'Jinwoo, el arma mas debil de la humanidad, sobrevive a una doble mazmorra que mata a casi todos. ' +
    'Despierta con un sistema solo para el que lo hace subir de nivel a escondidas. ' +
    'De porteador a monarca de las sombras entre gremios, islas y monarcas que vienen a por el.',

  anio: 2024,
  estado: 'finished',
  estudio: 'A-1 Pictures',

  // Accion de cazadores con fantasia de videojuego: shonen y
  // fantasia de manual. Son dos.
  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Mazmorras', 'Magia', 'Supervivencia'],
};

export const ANIME_ID = 'solo-leveling';

/**
 * Unos titulos con titulo oficial en ingles.
 *
 * TVDB lista los capitulos con sus titulos internacionales en
 * ingles, que son los oficiales fuera de Japon. La bandera le dice
 * a `comprobar-datos.mjs` que no exija kanji ni kana en el campo
 * japones, igual que Tokyo Revengers.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb: 8,9 de media ponderada de los
 * 25 capitulos (tt21209876, unos 321.000 votos entre todos). El S2
 * E12 es lo mejor con 9,6.
 */
export const RATING_SERIE = 8.9;

/**
 * Capitulos en total.
 *
 *   T1  12  (enero - marzo de 2024)
 *   T2  13  (enero - marzo de 2025)
 *   --
 *       25
 *
 * El resumen de S0 y la peli recopilatoria no entran.
 */
export const EPISODIOS_TOTAL = 25;

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
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Doce capitulos entre el 7 de enero y el 31 de marzo de 2024. ' +
      'Jinwoo sobrevive a la doble mazmorra y el sistema lo hace subir solo: misiones diarias, cambio de clase a nigromante y ejercito de sombras. ' +
      'Cierra eligiendo sombras.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Arise from the Shadow',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'A-1 Pictures',
    synopsis:
      'Trece capitulos entre el 5 de enero y el 30 de marzo de 2025. ' +
      'Isla de Jeju con equipo japones, rey hormiga Beru y monarcas moviendo ficha con Rakan al frente. ' +
      'El 12, con 9,6, es lo mejor de la serie.',
    capitulos: 'T2',
  },
];
