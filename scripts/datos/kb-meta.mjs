// META - Kubo-san wa Mob wo Yurusanai
//
// TVDB 420084 "久保さんは僕を許さない" (2023, Ended).
// AniList 148969 (T1, 2023, 12 capitulos).
// IMDb tt21844614.
//
// El titulo romanizado es el oficial fuera de Japon ("Kubo Won't
// Let Me Be Invisible" es la licencia en ingles).

export const ANIME = {
  titulo: 'Kubo-san wa Mob wo Yurusanai',

  japaneseTitle: '久保さんは僕を許さない',

  synopsis:
    'Shiraishi es tan invisible que ni cuentan con el en clase. Kubo si lo ve, y lo convierte en su juguete favorito desde el primer dia. ' +
    'Entre San Valentin, enfermeria, hanami y cine, la heroina y el fondo se van queriendo plano a plano.',

  anio: 2023,
  estado: 'finished',
  estudio: 'PINE JAM',

  // Comedia romantica escolar de manual: los dos cajones de
  // siempre, como Takagi.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Comedia', 'Recuentos de la vida', 'Escolar'],
};

export const ANIME_ID = 'kubo-san-wa-mob-wo-yurusanai';

/**
 * Nota de la serie completa en IMDb: 8,4 de media ponderada de los
 * 12 capitulos (tt21844614, unos 1.000 votos entre todos). El 11 es
 * lo mejor con 9,1.
 */
export const RATING_SERIE = 8.4;

/**
 * Capitulos en total.
 *
 *   T1  12  (enero - junio de 2023, con paron entre febrero y mayo)
 *   --
 *       12
 */
export const EPISODIOS_TOTAL = 12;

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
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'PINE JAM',
    synopsis:
      'Doce capitulos entre el 10 de enero y el 20 de junio de 2023, con paron en primavera. ' +
      'Kubo encuentra al invisible Shiraishi y no lo suelta: regalos, cine, hanami y curso nuevo. ' +
      'Cierra con el de fondo de protagonista por fin.',
    capitulos: 'T1',
  },
];
