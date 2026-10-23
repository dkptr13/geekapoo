// LA FICHA DEL ANIME - My Hero Academia
//
// Ciento setenta capitulos del 3 de abril de 2016 al 13 de diciembre
// de 2025, en Bones para MBS y YTV. Un chico sin poderes en un mundo
// donde todos los tienen, que hereda el poder del heroe mas grande y
// entra en la academia de heroes.
//
//   T1  13 capitulos  (abril - junio de 2016)
//   T2  25 capitulos  (abril - septiembre de 2017)
//   T3  25 capitulos  (abril - septiembre de 2018)
//   T4  25 capitulos  (octubre de 2019 - abril de 2020)
//   T5  25 capitulos  (marzo - septiembre de 2021)
//   T6  25 capitulos  (octubre de 2022 - marzo de 2023)
//   T7  21 capitulos  (mayo - octubre de 2024)
//   T8  11 capitulos  (octubre - diciembre de 2025)
//
// Ficha de AniList: 21459 (T1), 21856 (T2), 100166 (T3), 104276 (T4),
// 117193 (T5), 139630 (T6), 163139 (T7) y 182896 (T8).
// TVDB: serie 305074, con las temporadas 1 a 8.
// IMDb tt5626028: 8,2 con unos 128.000 votos.

export const ANIME = {
  titulo: 'My Hero Academia',

  japaneseTitle: '僕のヒーローアカデミア',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Deku nace sin poder en un mundo donde todos los tienen,
  // hereda el One For All de All Might y entra en la academia U.A.
  synopsis:
    'En un mundo donde el 80% de la humanidad tiene un "quirk" (un ' +
    'superpoder), Izuku Midoriya nace sin ninguno. Aun asi, suena con ' +
    'ser heroe. All Might, el heroe numero uno, le transfiere su ' +
    'poder, el One For All, y Deku entra en la academia U.A. Alli se ' +
    'enfrenta al examen de ingreso, a los villanos, al torneo deportivo, ' +
    'a la Liga de Villanos y a la guerra final. Ocho temporadas de ' +
    'superheroes, amistad y el peso de heredar un poder que puede ' +
    'matar a quien lo lleva.',

  anio: 2016,
  estado: 'finished',
  estudio: 'Bones',

  // Shonen de accion con fondo de superheroes y crecimiento.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Superhéroes', 'Escolar', 'Shonen', 'Comedia'],
};

export const ANIME_ID = 'my-hero-academia';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en japones romanizado, las abreviaturas y el titulo en
// ingles con el año. Los escribe el agente que anade el anime, a
// mano, y se guardan en "alternativeTitles" del documento de
// Firestore, que es lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El japones ya esta en japaneseTitle, asi que no se repite aqui.
export const ALIASES = [
  'Boku no Hero Academia',
  'MHA',
  'BnHA',
  'My Hero Academia (2016)',
];

/**
 * Nota de la serie en IMDb (tt5626028): 8,2 con unos 128.000 votos.
 *
 * El capitulo 12 de la T1 llega al 9,0. La segunda temporada se
 * queda en un 8,1 de media.
 */
export const RATING_SERIE = 8.2;

/**
 * Capitulos en total.
 *
 *   T1  13  (abril - junio de 2016)
 *   T2  25  (abril - septiembre de 2017)
 *   T3  25  (abril - septiembre de 2018)
 *   T4  25  (octubre de 2019 - abril de 2020)
 *   T5  25  (marzo - septiembre de 2021)
 *   T6  25  (octubre de 2022 - marzo de 2023)
 *   T7  21  (mayo - octubre de 2024)
 *   T8  11  (octubre - diciembre de 2025)
 *   --
 *      170
 *
 * Las peliculas y los OVA no entran.
 */
export const EPISODIOS_TOTAL = 170;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> las ocho temporadas, con subtítulos en castellano.
 *   · Netflix -> las ocho temporadas, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Trece capitulos del 3 de abril al 26 de junio de 2016, en Bones para MBS y YTV. ' +
      'Deku nace sin poder y hereda el One For All de All Might. De aqui salen el examen ' +
      'de ingreso, el festival deportivo, el ataque de la Liga de Villanos y la pelea ' +
      'entre Deku y Bakugo.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Season 2',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Veinticinco capitulos del 1 de abril al 30 de septiembre de 2017. El festival ' +
      'deportivo, el examen final, la pasantia con Gran Torino y el ataque a la base de ' +
      'la Liga de Villanos.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Season 3',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Veinticinco capitulos del 7 de abril al 29 de septiembre de 2018. El campamento de ' +
      'verano, el rescate de Bakugo y la pelea entre All Might y All For One.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Season 4',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Veinticinco capitulos del 12 de octubre de 2019 al 4 de abril de 2020. La pasantia ' +
      'con Endeavor, el festival cultural y la guerra contra la Liga de Villanos.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Season 5',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Veinticinco capitulos del 27 de marzo al 25 de septiembre de 2021. El entrenamiento ' +
      'conjunto con la clase B, el festival de la escuela y la aparicion de Hawks.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Season 6',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Veinticinco capitulos del 1 de octubre de 2022 al 25 de marzo de 2023. La guerra ' +
      'paranormal, el ataque a la Liga de Villanos y el despertar de Shigaraki.',
    capitulos: 'T6',
  },
  {
    numero: 7,
    titulo: 'Season 7',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Veintiun capitulos del 4 de mayo al 12 de octubre de 2024. La guerra final y el ' +
      'combate entre Deku y Shigaraki. La clase 1-A se reune para la batalla final contra ' +
      'la Liga de Villanos y All For One.',
    capitulos: 'T7',
  },
  {
    numero: 8,
    titulo: 'Final Season',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'Bones',
    synopsis:
      'Once capitulos del 4 de octubre al 13 de diciembre de 2025. El final de la historia ' +
      'y el legado de All Might. Deku se enfrenta a Shigaraki en el combate final y el ' +
      'mundo cambia para siempre.',
    capitulos: 'T8',
  },
];
