// META - One Punch Man (2015)
//
// TVDB 293088 (ワンパンマン, 2015) tiene 12 + 12 + 12 capítulos en las
// temporadas 1, 2 y 3, y en la temporada 0 deja los OVA, el especial
// Road to Hero y los recapitulares de cada temporada.
// AniList 21087 (serie), 97668 (segunda temporada), 153800 (tercera),
// 21416 y 108945 (los dos grupos de OVA) y 21386 (Road to Hero).
// IMDb tt4508902: 8,6 con unos 230.000 votos.
//
// Los titulos en castellano y las fechas salen de los anexos de
// temporada de la wikipedia en español; los titulos japoneses, de
// TVDB; las notas, de IMDb. Los OVA solo existen en la wikipedia con
// el titulo en inglés, así que aquí van traducidos. Los resumenes son
// traduccion de los de la wikipedia en inglés, salvo los de la tercera
// temporada, que en esa wikipedia aun no están y se han traducido de
// los que da TVDB en japoneses.

export const ANIME = {
  titulo: 'One Punch Man',

  japaneseTitle: 'ワンパンマン',

  synopsis:
    'Saitama se hizo héroe entrenando hasta el absurdo, y su nivel de proezas es tal que ' +
    'todo el mundo lo considera el más fuerte del mundo. El, en realidad, solo quiere ' +
    'vivir tranquilo comiendo ramen y viendo caricaturas. Cuando la Asociación de ' +
    'Monstruos manda a sus mejores hombres a por él, Genos, un cyborg que se convierte ' +
    'en su aprendiz, y los demás héroes de clase S, con un King que llega al combate ' +
    'siempre con retraso, se echan un lado a los doce problemas. Al otro lado está Garou, ' +
    'el monstruo que entrena para ser el héroe más fuerte del mundo.',

  anio: 2015,
  estado: 'finished',
  estudio: 'Madhouse',

  categorias: ['Shonen & Acción', 'Romance & Comedia'],

  generos: ['Acción', 'Comedia', 'Ciencia ficción', 'Harem', 'Monstruos', 'Shonen', 'Sobrenatural', 'Superhéroes', 'Parodia'],
};

export const ANIME_ID = 'one-punch-man';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles, el romanizado, el japones con otro criterio y
// los sinónimos que de verdad se usan. Los escribe el agente que anade
// el anime, a mano, y se guardan en "alternativeTitles" del documento de
// Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El guion entre "One" y "Punch" es habitual en portada.
export const ALIASES = [
  'One Punch Man (2015)',
];

/**
 * Nota de la serie en IMDb (tt4508902): 8,6 con unos 230.000 votos.
 */
export const RATING_SERIE = 8.6;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1  12  (octubre - diciembre de 2015)
 *   T2  13  (abril - julio de 2019, con el recapitular 12.5)
 *   T3  13  (octubre - diciembre de 2025, con el recapitular 24.5)
 *   T4   6  (los OVA de 2015 y 2016)
 *   T5   6  (los OVA de 2019 y 2020)
 *   T6   1  (Road to Hero, 2015)
 *   --
 *       51
 */
export const EPISODIOS_TOTAL = 51;

/**
 * Donde se emite en Espana.
 *
 *   · Crunchyroll -> la serie, con doblaje en español.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Doce episodios emitidos del 4 de octubre al 20 de diciembre de 2015. Saitama empezó ' +
      'a ser héroe un día cualquiera y se quedó calvo de un plumazo, y conoce a Genos, que ' +
      'insiste en hacerse su aprendiz. Mientras tanto, los héroes de clase S resuelven sus ' +
      'propios problemas en las calles y los monstruos empiezan a mirarles.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Road to Hero',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Especial de 24 de diciembre de 2015 que cuenta como Saitama aun no era héroe y ' +
      'aun llevaba el pelo. En el, un tendero le arregla el jersey a cambio de que le ' +
      'resuelva un problema de deudas.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'OVA',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    synopsis:
      'Los seis OVA originales, emitidos entre el 24 de diciembre de 2015 y el 27 de mayo ' +
      'de 2016. Episodios sueltos con el heroico Saitama y Genos de vacaciones, con ' +
      'Zombieman, Bang y los miembros de la Asociación de Héroes de reserva.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'One Punch Man 2',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Doce episodios emitidos del 9 de abril al 2 de julio de 2019, con un recapitular ' +
      'emitido el 3 de abril. Garou, el monstruo que se quiere hacer héroe, se convierte ' +
      'en el enemigo más peligroso del país, y los héroes de clase S tienen que plantar ' +
      'cara a Genius y recuperar a sus compañeros caídos.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'OVA 2',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Los seis OVA de la segunda tanda, emitidos entre el 25 de octubre de 2019 y el 27 de ' +
      'marzo de 2020. Saitama y Genos viven episodios sueltos de su vida diaria, con el ' +
      'Prisionero Puri Puri y el detective Zombieman de fondo.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'One Punch Man 3',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Doce episodios emitidos del 12 de octubre al 28 de diciembre de 2025, con un ' +
      'recapitular el 5 de octubre. La Asociación de Héroes y la Asociación de Monstruos ' +
      'se enfrentan, Saitama busca a Garou y la amenaza más grande de todas aparece en el ' +
      'mundo de los monstruos.',
    capitulos: 'T6',
  },
];
