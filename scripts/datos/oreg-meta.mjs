// META - Oregairu
//
// TVDB 267435 "やはり俺の青春ラブコメはまちがっている。" (2013,
// Ended). Las tres series van en S1 a S3 y los tres OVAs en
// Specials (S0E1 a S0E3).
// AniList 14813 (T1, 2013, 13), 18753 (T2 OVA, 2013), 20698 (T3
// Zoku, 2015, 13), 21769 (T4 OVA, 2016), 108489 (T5 Kan, 2020,
// 12) y 128643 (T6 OVA, 2023).
// IMDb tt2703720 (los OVAs van dentro como S1E14, S2E14 y S3E13).
//
// El titulo romanizado es el de AniList, con su "Love Come"
// oficial y su punto final.

export const ANIME = {
  titulo: 'Yahari Ore no Seishun Love Come wa Machigatteiru.',

  japaneseTitle: 'やはり俺の青春ラブコメはまちがっている。',

  synopsis:
    'Hachiman es solo, cinico y orgulloso de serlo hasta que lo meten en el club de voluntariado con Yukino y Yui. ' +
    'Resolver encargos a su manera podrida funciona hasta que deja de funcionar: Zoku aprieta y Kan elige. ' +
    'Tres series y tres OVAs de juventud equivocada que acaba siendo la de verdad.',

  anio: 2013,
  estado: 'finished',
  estudio: "Brain's Base",

  // Comedia romantica escolar con drama que muerde: los dos
  // cajones de siempre, como Takagi pero con veneno.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Drama', 'Romance', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'yahari-ore-no-seishun-love-come-wa-machigatteiru';

/**
 * Nota de la serie completa en IMDb, serie tt2703720: 8,0 con unos
 * 14.300 votos. El T5 E11 es lo mejor con 9,6.
 */
export const RATING_SERIE = 8.0;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   13  (abril - junio de 2013, serie)
 *   T2    1  (septiembre de 2013, OVA con el juego)
 *   T3   13  (abril - junio de 2015, Zoku)
 *   T4    1  (octubre de 2016, OVA con el juego Zoku)
 *   T5   12  (julio - septiembre de 2020, Kan)
 *   T6    1  (abril de 2023, OVA con el juego Kan)
 *   --
 *        41
 */
export const EPISODIOS_TOTAL = 41;

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
    anio: 2013,
    estado: 'Finalizado',
    estudio: "Brain's Base",
    synopsis:
      'Trece capitulos entre el 5 de abril y el 28 de junio de 2013. ' +
      'Hachiman acaba en el club con Yukino y Yui, resuelve podrido y pide de verdad al final. ' +
      'Cierra con festival y el trio tocado.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'OVA',
    anio: 2013,
    estado: 'Finalizado',
    estudio: "Brain's Base",
    synopsis:
      'Un capitulo del 19 de septiembre de 2013, salido con el juego de la serie. ' +
      'Deseos de futuro para cada uno del club con Hachiman de testigo. ' +
      'Extra ligero entre la serie y Zoku.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Zoku',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'feel.',
    synopsis:
      'Trece capitulos entre el 3 de abril y el 26 de junio de 2015, ya en feel. ' +
      'Menos risas y mas filo: Iroha nueva, confesion de Yui y verdad a bocajarro en el 8. ' +
      'Cierra con promesa de respuesta para Kan.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Zoku OVA',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'feel.',
    synopsis:
      'Un capitulo del 27 de octubre de 2016, salido con el juego Zoku. ' +
      'Iroha con las chicas de paseo entre dulces y pullas, con el club de testigo lejano. ' +
      'Extra ligero entre Zoku y Kan.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Kan',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'feel.',
    synopsis:
      'Doce capitulos entre el 10 de julio y el 25 de septiembre de 2020. ' +
      'La recta final: Yui cede, Hachiman pide y la nieve responde en el 11 con 9,6. ' +
      'Cierra con el titulo entero y boda de nieve.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Kan OVA',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'feel.',
    synopsis:
      'Un capitulo del 27 de abril de 2023, salido con el juego Kan. ' +
      'Epilogo con el club despues del final: la adolescencia no acaba y la juventud sigue. ' +
      'Cierre de verdad de la juventud equivocada.',
    capitulos: 'T6',
  },
];
