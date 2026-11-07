// META - My Dress-Up Darling
//
// TVDB 401233 "その着せ替え人形は恋をする" (2022, Ended).
// AniList 132405 (T1, 2022) y 154768 (T2, 2025).
// IMDb tt15765670, las dos temporadas en una sola ficha.
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'My Dress-Up Darling',

  japaneseTitle: 'その着せ替え人形は恋をする',

  synopsis:
    'Wakana Gojou cose muñecas hina en el taller de su abuelo y esconde su aficion por verguenza. ' +
    'Marin Kitagawa, la popular de clase, lo descubre y le encarga su traje de cosplay sin aceptar un no. ' +
    'Entre medidas, telas, eventos y hoteles del amor, el sastre timido y la modelo sin pudor se van queriendo costura a costura.',

  anio: 2022,
  estado: 'finished',
  estudio: 'CloverWorks',

  // Romance por Marin y Wakana, y escolar porque casi todo pasa
  // entre clase, eventos y casa. Los dos cajones de siempre.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Comedia', 'Recuentos de la vida', 'Escolar', 'Cosplay', 'Ecchi'],
};

export const ANIME_ID = 'my-dress-up-darling';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * La T2 E12 se titula "Dear My Dress-Up Darling" tambien en Japon,
 * tal como lo lista TVDB. La bandera le dice a
 * `comprobar-datos.mjs` que no exija kanji ni kana en el campo
 * japones. Los otros 23 si lo traen.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt15765670: 7,9 con unos
 * 30.000 votos. El 11 de la T1 (hotel del amor) tira para arriba
 * con 9,0 y el 9 con 7,4 para abajo.
 */
export const RATING_SERIE = 7.9;

/**
 * Capitulos en total.
 *
 *   T1  12  (enero - marzo de 2022)
 *   T2  12  (julio - septiembre de 2025)
 *   --
 *       24
 */
export const EPISODIOS_TOTAL = 24;

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
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Doce capitulos entre el 8 de enero y el 27 de marzo de 2022. ' +
      'Marin encarga su Shizuku a Wakana y el taller se vuelve vestuario: medidas, ropa interior, evento con Juju y sesion en hotel del amor. ' +
      'Cierra con desfile y promesa de seguir cosiendo juntos.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Doce capitulos entre el 5 de julio y el 20 de septiembre de 2025. ' +
      'Conejita con exigencias tecnicas, diario costumbrista, noche en vela antes del evento grande y final con todo encima. ' +
      'La pareja despega donde la primera lo dejo.',
    capitulos: 'T2',
  },
];
