// META - Date A Live
//
// TVDB 264663 "デート・ア・ライブ" (2013, Continuing; la S6
// anunciada esta vacia y no entra). Las cinco series van en S1 a
// S5 y el resto en Specials (S0E1 DATE TO DATE, S0E2 Kurumi, S0E3
// Mayuri, S0E4 Bullet 1, S0E5 Bullet 2).
// AniList 15583 (T1, 2013, 12), 17641 (T2 OVA, 2013), 19163 (T3
// II, 2014, 10), 20767 (T4 OVA Kurumi, 2014), 20741 (T5 peli
// Mayuri, 2015), 100722 (T6 III, 2019, 12), 111852 (T7 Bullet 1,
// 2020), 121034 (T8 Bullet 2, 2020), 116605 (T9 IV, 2022, 12) y
// 151380 (T10 V, 2024, 12).
// IMDb tt2575684 (serie con OVAs dentro), tt5331768 (peli),
// tt12350118 y tt13308788 (bullets).
//
// El titulo en ingles es el oficial en todo el mundo.

export const ANIME = {
  titulo: 'Date A Live',

  japaneseTitle: 'デート・ア・ライブ',

  synopsis:
    'Shido liga espiritus para sellarlos con besos antes de que el AST las vuele. ' +
    'Con Tohka, Origami, Kurumi y siete mas por bandera, cada cita salva la ciudad. ' +
    'Cinco series, dos OVAs y tres pelis de citas que salvan mundos.',

  anio: 2013,
  estado: 'emitiendo',
  estudio: 'AIC Plus+',

  // Harem de espiritus con citas y mechas: amor y fin del mundo.
  // Son dos.
  categorias: ['Romance & Comedia', 'Shonen & Acción'],

  generos: ['Acción', 'Comedia', 'Romance', 'Harem'],
};

export const ANIME_ID = 'date-a-live';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * El OVA DATE TO DATE se titula "OVA「DATE TO DATE」" hasta en
 * TVDB y en Japon: es el oficial y no hay version en japones. La
 * bandera le dice a `comprobar-datos.mjs` que no exija kanji ni
 * kana, igual que el final de Masamune.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt2575684: 6,9 con unos
 * 5.500 votos. El T9 E12 es lo mejor con 9,2.
 */
export const RATING_SERIE = 6.9;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   12  (abril - junio de 2013, serie)
 *   T2    1  (diciembre de 2013, OVA DATE TO DATE)
 *   T3   10  (abril - junio de 2014, II)
 *   T4    1  (diciembre de 2014, OVA Kurumi)
 *   T5    1  (agosto de 2015, peli Mayuri)
 *   T6   12  (enero - marzo de 2019, III)
 *   T7    1  (agosto de 2020, Bullet 1)
 *   T8    1  (noviembre de 2020, Bullet 2)
 *   T9   12  (abril - junio de 2022, IV)
 *   T10  12  (abril - junio de 2024, V)
 *   --
 *        63
 */
export const EPISODIOS_TOTAL = 63;

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
    estudio: 'AIC Plus+',
    synopsis:
      'Doce capitulos entre el 6 de abril y el 22 de junio de 2013. ' +
      'Shido liga a Tohka, Yoshino y gemelas con el AST detras y Kurumi al acecho. ' +
      'Cierra con lo innegociable por bandera.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'DATE TO DATE',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'AIC Plus+',
    synopsis:
      'Un capitulo del 6 de diciembre de 2013, salido con el tomo 7. ' +
      'Cita de verdad con Tohka en el festival de otoño, sin espiritus ni AST por un dia. ' +
      'Extra entre series.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'II',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'Diez capitulos entre el 12 de abril y el 14 de junio de 2014, ya en Production IMS. ' +
      'Miku idol y gemelas con inversion final de Tohka. ' +
      'Cierra con el reverso ligando tambien.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Kurumi Star Festival',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'AIC Plus+',
    synopsis:
      'Un capitulo del 9 de diciembre de 2014, salido con el tomo 8. ' +
      'Festival de las estrellas con Kurumi de protagonista entre puestos y focos. ' +
      'Extra entre series.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Mayuri Judgement',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Production IMS',
    synopsis:
      'Setenta y dos minutos del 22 de agosto de 2015. ' +
      'Esfera gigante sobre la ciudad con Mayuri en medio y todas citadas a la vez. ' +
      'Peli de puente entre series con juicio final de propina.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'III',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'J.C.STAFF',
    synopsis:
      'Doce capitulos entre el 11 de enero y el 29 de marzo de 2019, ya en J.C.STAFF. ' +
      'Natsumi cambiaformas con rey demonio de cierre. ' +
      'Cierra ligando al conquistador.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Date A Bullet: Dead or Bullet',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'GEEKTOYS',
    synopsis:
      'Veinticinco minutos del 14 de agosto de 2020, en GEEKTOYS. ' +
      'Kurumi e Hibiki en el juego vecino de matar por un deseo, sin Shido a la vista. ' +
      'Primera de dos partes con cuasiespiritus por todas partes.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'Date A Bullet: Nightmare or Queen',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'GEEKTOYS',
    synopsis:
      'Veintinueve minutos del 13 de noviembre de 2020, en GEEKTOYS. ' +
      'Contra la Reina Blanca con Hibiki al lado para cerrar el juego vecino. ' +
      'Segunda de dos partes con pesadilla y corona en juego.',
    capitulos: 'T8',
  },
  {
    numero: 9,
    titulo: 'IV',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'GEEKTOYS',
    synopsis:
      'Doce capitulos entre el 8 de abril y el 24 de junio de 2022, ya en GEEKTOYS. ' +
      'Nia otaku y Mukuro espacial con rueda de salvacion final. ' +
      'Cierra girando con todas salvadas.',
    capitulos: 'T9',
  },
  {
    numero: 10,
    titulo: 'V',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'GEEKTOYS',
    synopsis:
      'Doce capitulos entre el 10 de abril y el 26 de junio de 2024. ' +
      'Guerra abierta con Mio, el origen, al frente y gatillo final. ' +
      'Cierra con Tohka eligiendo por todas.',
    capitulos: 'T10',
  },
];
