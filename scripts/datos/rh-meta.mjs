// META - Redo of Healer
//
// TVDB 388575 "回復術士のやり直し" (2021, Ended).
// AniList 113425 (T1, 2021, 12 capitulos).
// IMDb tt13370404.
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Redo of Healer',

  japaneseTitle: '回復術士のやり直し',

  synopsis:
    'Keyaru, sanador abusado por heroes y princesas, rebobina cuatro años con su magia. ' +
    'Con Flare de esclava y Setsuna de loba por bandera, cobra ojo por ojo sin piedad. ' +
    'Doce capitulos de TNK con venganza sin freno.',

  anio: 2021,
  estado: 'finished',
  estudio: 'TNK',

  // Fantasia oscura de venganza con sanador: bichos y factura. Son
  // dos.
  categorias: ['Fantasía & Aventura', 'Seinen & Psicológico'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Venganza', 'Ecchi', 'Tragedia', 'Magia'],
};

export const ANIME_ID = 'redo-of-healer';

/**
 * Nota de la serie completa en IMDb, serie tt13370404: 6,4 con unos
 * 8.400 votos. El 2 es lo mejor con 7,1.
 */
export const RATING_SERIE = 6.4;

/**
 * Capitulos en total.
 *
 *   T1  12  (enero - marzo de 2021)
 *   --
 *        12
 */
export const EPISODIOS_TOTAL = 12;

/**
 * Donde se emite en España.
 *
 *   · HIDIVE -> licencia de Sentai fuera de Japon.
 */
export const STREAMING = [
  { name: 'HIDIVE', url: 'https://www.hidive.com', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'TNK',
    synopsis:
      'Doce capitulos entre el 13 de enero y el 31 de marzo de 2021. ' +
      'Keyaru rebobina y cobra con Flare, Setsuna y Kureha por bandera. ' +
      'Cierra saliendo de viaje con cuentas pendientes.',
    capitulos: 'T1',
  },
];
