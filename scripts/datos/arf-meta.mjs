// LA FICHA DEL ANIME - Arifureta: From Commonplace to World's Strongest
//
// Cuarenta y un capitulos del 8 de julio de 2019 al 17 de febrero de
// 2025, en asread. y White Fox/Studio Mother para AT-X. Un otaku
// invocado a otro mundo que se convierte en el mas fuerte.
//
//   T1  13 capitulos  (julio - octubre de 2019)
//   T2  12 capitulos  (enero - marzo de 2022)
//   T3  16 capitulos  (octubre de 2024 - febrero de 2025)
//
// Ficha de AniList: 100668 (T1), 112323 (T2) y 154473 (T3).
// TVDB: serie 357019, con las temporadas 0, 1, 2 y 3.
// IMDb tt10431290: 7,0 con unos 7.000 votos.

export const ANIME = {
  titulo: 'Arifureta: From Commonplace to World\'s Strongest',

  japaneseTitle: 'ありふれた職業で世界最強',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Hajime Nagumo es un otaku normal que es invocado a
  // otro mundo y se convierte en el mas fuerte.
  synopsis:
    'Hajime Nagumo es un otaku normal que es invocado a otro mundo ' +
    'junto con su clase. En el abismo, sobrevive solo y se convierte ' +
    'en un monstruo. Tres temporadas de venganza, romance y un harem ' +
    'que crece cada temporada. Hajime busca venganza contra los que lo ' +
    'traicionaron y protege a los suyos.',

  anio: 2019,
  estado: 'finished',
  estudio: 'asread.',

  // Isekai de accion con fondo de romance y venganza.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Isekai', 'Acción', 'Fantasía', 'Aventura', 'Romance', 'Harem', 'Psicológico', 'Magia', 'Mazmorras'],
};

export const ANIME_ID = 'arifureta-from-commonplace-to-world-s-strongest';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el titulo en ingles, el romanizado y los sinonimos que de verdad se
// usan. Los escribe el agente que anade el anime, a mano, y se
// guardan en "alternativeTitles" del documento de Firestore, que es
// lo que la busqueda inteligente ya lee.
//
// Solo titulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los titulos, asi que dos
// alias que se leen igual sobran.
//
// El japones ya esta en japaneseTitle, asi que no se repite aqui.
export const ALIASES = [
  'Arifureta',
  'Arifureta: From Commonplace to World\'s Strongest (2019)',
  'Arifureta Shokugyou de Sekai Saikyou',
];

/**
 * Nota de la serie en IMDb (tt10431290): 7,0 con unos 7.000 votos.
 *
 * La primera temporada se queda en un 7,0 de media. La segunda sube
 * un poco, con el capitulo 11 en un 8,1.
 */
export const RATING_SERIE = 7.0;

/**
 * Capitulos en total.
 *
 *   T1  13  (julio - octubre de 2019)
 *   T2  12  (enero - marzo de 2022)
 *   T3  16  (octubre de 2024 - febrero de 2025)
 *   ---
 *       41
 *
 * Los OVA y los especiales no entran.
 */
export const EPISODIOS_TOTAL = 41;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> las tres temporadas, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'asread.',
    synopsis:
      'Trece capitulos del 8 de julio al 7 de octubre de 2019, en asread. y White Fox para AT-X. ' +
      'Hajime Nagumo es invocado a otro mundo con su clase. En el abismo, sobrevive solo y se ' +
      'convierte en un monstruo. De aqui salen la caja de Pandora, la princesa vampiro Yue y ' +
      'la guarida del maverick.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '2nd Season',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'asread.',
    synopsis:
      'Doce capitulos del 13 de enero al 31 de marzo de 2022, en asread. y Studio Mother para AT-X. ' +
      'Hajime regresa a la capital y se reencuentra con sus compañeros. De aqui salen la invasión ' +
      'de la capital, el apóstol de Dios y la traición.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '3rd Season',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'asread.',
    synopsis:
      'Dieciseis capitulos del 14 de octubre de 2024 al 17 de febrero de 2025, en asread. y Studio Mother para AT-X. ' +
      'Hajime y sus compañeros se enfrentan al imperio. De aqui salen el laberinto de Haltina, ' +
      'la prueba diabólica y la gran batalla del conejo divino.',
    capitulos: 'T3',
  },
];
