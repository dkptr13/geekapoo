// META - Classroom of the Elite
//
// TVDB 329822 "ようこそ実力至上主義の教室へ" (2017, Continuing).
// AniList 98659 (T1, 2017), 145545 (T2, 2022), 146066 (T3, 2024) y
// 180745 (T4 segundo curso, 2026).
// IMDb tt7263328, las cuatro temporadas en una sola ficha.
//
// El titulo en ingles es el oficial en todo el mundo. El japones
// completo lleva el curso: la T4 es "2年生編1学期".
//
// La quinta (213477, sin fecha ni capitulos) no entra hasta
// emitirse: una temporada sin capitulos se guardaria vacia.

export const ANIME = {
  titulo: 'Classroom of the Elite',

  japaneseTitle: 'ようこそ実力至上主義の教室へ',

  synopsis:
    'El instituto Koudo Ikusei forma a la elite con puntos que lo compran todo y examenes que expulsan. ' +
    'Ayanokouji esconde un pasado de laboratorio y un talento que no quiere enseñar, y mueve a Horikita, Karuizawa y Ryuuen como piezas. ' +
    'Islas, festivales, votos de expulsion y cacerias con recompensa: aprobar aqui es sobrevivir.',

  anio: 2017,
  estado: 'emitiendo',
  estudio: 'Lerche',

  // Psicologico por Ayanokouji y la Habitacion Blanca, misterio por
  // quien mueve cada examen, y escolar porque todo pasa por puntos
  // y clases. Son tres.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio', 'Shojo & Escolar'],

  generos: ['Drama', 'Psicológico', 'Misterio', 'Escolar', 'Supervivencia'],
};

export const ANIME_ID = 'classroom-of-the-elite';

/**
 * Nota de la serie completa en IMDb, serie tt7263328: 7,7 con unos
 * 28.000 votos. Los finales de curso tiran para arriba (9,1, 9,6 y
 * 9,4) y los arranques para abajo.
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total.
 *
 *   T1  12  (julio - septiembre de 2017)
 *   T2  13  (julio - septiembre de 2022)
 *   T3  13  (enero - marzo de 2024)
 *   T4  16  (abril - junio de 2026, segundo curso)
 *   --
 *       54
 */
export const EPISODIOS_TOTAL = 54;

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
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Doce capitulos entre el 12 de julio y el 27 de septiembre de 2017. ' +
      'Presentacion del sistema de puntos, examen en la isla, juicio a Sudou y pulso final contra Ryuuen en la azotea. ' +
      'Ayanokouji enseña un minuto lo que es y la clase respira.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Trece capitulos entre el 4 de julio y el 26 de septiembre de 2022. ' +
      'Crucero con examen, pasado de Karuizawa, voto de unanimidad y revancha a puños contra Ryuuen. ' +
      'El 12, con 9,6, es de lo mejor de toda la serie.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Trece capitulos entre el 3 de enero y el 27 de marzo de 2024. ' +
      'Campamento mixto, voto de expulsion con Kushida expuesta y la Habitacion Blanca asomando con Tsukishiro. ' +
      'Cierra mirando ya al segundo curso.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Segundo curso, primer trimestre',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Dieciseis capitulos entre el 1 de abril y el 24 de junio de 2026, los cuatro primeros el mismo dia. ' +
      'Asesino de la Habitacion Blanca, caceria de veinte millones por expulsar a Ayanokouji y primer trimestre del segundo curso. ' +
      'Cierra con el futuro ya en marcha.',
    capitulos: 'T4',
  },
];
