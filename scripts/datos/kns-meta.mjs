// META - KonoSuba
//
// TVDB 303867 "この素晴らしい世界に祝福を！" (2016, Ended) para las
// tres series, las dos OVAs, la peli y los dos BONUS STAGE, y 420657
// "この素晴らしい世界に爆焔を！" (2023) para el spin-off.
// AniList 21202 (T1, 2016), 21574 (OVA 2016), 21699 (T2, 2017),
// 97996 (OVA 2017), 102976 (peli 2019), 150075 (Bakuen, 2023),
// 136804 (T3, 2024) y 181244 (BONUS STAGE, 2025).
// IMDb tt5370118 (serie), tt9239552 (peli) y tt27329086 (Bakuen).
//
// El titulo corto es el oficial en todo el mundo, incluido el
// castellano. Los alias largos ("Un mundo maravilloso") son
// traducciones sueltas, no el nombre de nadie.
//
// ── EL ORDEN ────────────────────────────────────────────────
//
// Por fecha de emision: dos series, sus dos OVAs intercaladas, la peli,
// la precuela de 2023 y los BONUS STAGE de 2025. Cada OVA, pelicula o
// especial va como temporada propia, que es como los cuenta el catalogo.
//
// TVDB guarda las dos OVAs, la peli y los BONUS STAGE en Specials
// (S0E3 a S0E7) y lleva Bakuen como serie aparte (420657): el
// emparejador de miniaturas trata todo eso a mano.

export const ANIME = {
  titulo: 'KonoSuba',

  japaneseTitle: 'この素晴らしい世界に祝福を！',

  synopsis:
    'Kazuma muere de risa y despierta ante Aqua, diosa inutil que le ofrece otro mundo con un don a elegir. ' +
    'El elige llevarsela a ella y acaban en Axel con Megumin, que solo sabe Explosion, y Darkness, cruzada masoquista. ' +
    'Entre deudas, generales del Rey Demonio, aldea carmesi y princesas, la panda mas inutil del isekai sobrevive a base de trampas.',

  anio: 2016,
  estado: 'finished',
  estudio: 'Studio DEEN',

  // Fantasia por el mundo de juego con gremio y magia, y comedia
  // porque la serie es una parodia del isekai de cabo a rabo. Son
  // dos y no una.
  categorias: ['Fantasía & Aventura', 'Romance & Comedia'],

  generos: ['Aventura', 'Comedia', 'Ecchi', 'Fantasía', 'Isekai', 'Parodia', 'Magia'],
};

export const ANIME_ID = 'konosuba';

/**
 * Nota de la serie completa en IMDb, serie tt5370118: 7,8 con unos
 * 23.000 votos.
 *
 * La peli (tt9239552, 7,8) y Bakuen (tt27329086, 6,8) puntuan aparte
 * y no se mezclan.
 */
export const RATING_SERIE = 7.8;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  10  (enero - marzo de 2016, serie)
 *   T2   1  (junio de 2016, OVA del collar)
 *   T3  10  (enero - marzo de 2017, serie)
 *   T4   1  (julio de 2017, OVA del retrato)
 *   T5   1  (agosto de 2019, pelicula)
 *   T6  12  (abril - junio de 2023, precuela Bakuen)
 *   T7  11  (abril - junio de 2024, serie)
 *   T8   2  (abril de 2025, BONUS STAGE)
 *   --
 *       48
 *
 * Los OVAs y los especiales van como temporada propia, en orden de
 * emision, con nota propia en IMDb.
 */
export const EPISODIOS_TOTAL = 48;

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
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Studio DEEN',
    synopsis:
      'Diez capitulos entre el 14 de enero y el 17 de marzo de 2016. ' +
      'Kazuma renace con Aqua de regalo, ficha a Megumin por barata y a Darkness por bulto, y el grupo debuta contra Beldia. ' +
      'Deudas, invierno y fortaleza final con victoria por los pelos.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'OVA',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Studio DEEN',
    synopsis:
      'Un solo OVA estrenado el 24 de junio de 2016, con el collar magico como excusa. ' +
      'Kazuma no puede quitarse lo que dice y el grupo prueba soluciones peores que el problema. ' +
      'Extra ligero entre la primera y la segunda serie.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Studio DEEN',
    synopsis:
      'Diez capitulos entre el 12 de enero y el 16 de marzo de 2017. ' +
      'Juicio injusto, laberinto con lich, boda concertada de Darkness, caballero enmascarado y termas mixtas. ' +
      'Cierra contra el general Hans con el pueblo en juego.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'OVA 2017',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Studio DEEN',
    synopsis:
      'Un solo OVA estrenado el 24 de julio de 2017, con un retrato magico de por medio. ' +
      'El grupo posa como puede, Aqua posa de mas y Kazuma paga los pinceles. ' +
      'Extra ligero entre la segunda serie y la pelicula.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Leyenda carmesí',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'J.C.STAFF',
    synopsis:
      'Noventa minutos estrenados el 30 de agosto de 2019. ' +
      'Carta de Yunyun y viaje a la aldea carmesi con la quimera Sylvia queriendo fusionarlo todo. ' +
      'Explosion grande para un final grande.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Bakuen',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Drive',
    synopsis:
      'Doce capitulos entre el 6 de abril y el 22 de junio de 2023. ' +
      'Precuela con Megumin niña en la academia carmesi: tabues, rivalidad con Yunyun y la primera explosion. ' +
      'Cuenta de donde sale la maga que luego pagara Kazuma.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Drive',
    synopsis:
      'Once capitulos entre el 10 de abril y el 19 de junio de 2024. ' +
      'Princesa Iris, castillo, lago tragico y boda de Darkness con boicot incluido. ' +
      'La temporada mas redonda, que cierra con el grupo igual de pobre que al principio.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'BONUS STAGE',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Drive',
    synopsis:
      'Dos especiales estrenados el 25 de abril de 2025. ' +
      'Megumin prueba el torrente rojo y un impostor se hace pasar por el grupo en Axel. ' +
      'Cierre ligero despues de la tercera serie, con la misma panda de siempre.',
    capitulos: 'T8',
  },
];
