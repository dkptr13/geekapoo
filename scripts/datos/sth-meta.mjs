// META - Sentenced to Be a Hero
//
// TVDB 437266 "勇者刑に処す 懲罰勇者9004隊刑務記録" (2026,
// Continuing; la S2 anunciada esta vacia y no entra).
// AniList 167152 (T1, 2026, 12 capitulos).
// IMDb tt32536168.
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Sentenced to Be a Hero',

  japaneseTitle: '勇者刑に処す 懲罰勇者9004隊刑務記録',

  synopsis:
    'Los criminales cumplen sentencia luchando contra el ejercito del rey demonio en la unidad penal 9004. ' +
    'Xylo y Teoritta por bandera, entre tuneles, fortalezas y puertos que evacuar. ' +
    'Doce capitulos de fantasia oscura militar con Studio KAI al frente.',

  anio: 2026,
  estado: 'finished',
  estudio: 'Studio KAI',

  // Fantasia oscura militar con unidad penal: bichos y castigo.
  // Son dos.
  categorias: ['Fantasía & Aventura', 'Seinen & Psicológico'],

  generos: ['Acción', 'Drama', 'Fantasía', 'Militar'],
};

export const ANIME_ID = 'sentenced-to-be-a-hero';

/**
 * Nota de la serie completa en IMDb, serie tt32536168: 7,9 con unos
 * 7.300 votos. El 12 es lo mejor con 9,3.
 */
export const RATING_SERIE = 7.9;

/**
 * Capitulos en total.
 *
 *   T1  12  (enero - marzo de 2026; la T2 anunciada no tiene fecha)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> temporada de invierno de 2026, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Studio KAI',
    synopsis:
      'Doce capitulos entre el 3 de enero y el 26 de marzo de 2026. ' +
      'La unidad 9004 entre tuneles, fortalezas y puertos: Xylo desatado y rescate final. ' +
      'Cierra con redencion a medias y sentencia que sigue.',
    capitulos: 'T1',
  },
];
