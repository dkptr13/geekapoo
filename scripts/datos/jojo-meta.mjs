// LA FICHA DEL ANIME - JoJo's Bizarre Adventure
//
// Veintiséis capitulos de octubre de 2012 a abril de 2013, en David Production
// para Tokyo MX. Jonathan y Joseph Joestar se enfrentan a Dio y a los hombres
// del pilar.
//
// Ficha de AniList: 14719.
// TVDB: serie 262954, con la temporada 1.
// IMDb tt2359704: 8,6 con unos 63.000 votos.

export const ANIME = {
  titulo: "JoJo's Bizarre Adventure",

  japaneseTitle: 'ジョジョの奇妙な冒険',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Jonathan y Joseph Joestar se enfrentan a Dio.
  synopsis:
    'Jonathan Joestar se enfrenta a su hermano adoptivo Dio Brando, ' +
    'que se ha convertido en vampiro. Años después, su nieto Joseph ' +
    'lucha contra los hombres del pilar. Veintiséis capítulos de ' +
    'acción, aventura y poderes sobrenaturales.',

  anio: 2012,
  estado: 'finished',
  estudio: 'David Production',

  // Acción y aventura con fondo de sobrenatural.
  categorias: ['Shonen & Acción', 'Fantasía & Magia'],

  generos: ['Acción', 'Aventura', 'Sobrenatural', 'Shonen'],
};

export const ANIME_ID = 'jojo-s-bizarre-adventure';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en japonés romanizado y los sinónimos que de verdad se
// usan. Los escribe el agente que añade el anime, a mano, y se
// guardan en "alternativeTitles" del documento de Firestore, que es
// lo que la búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'JoJo no Kimyou na Bouken',
  "JoJo's Bizarre Adventure (2012)",
];

/**
 * Nota de la serie en IMDb (tt2359704): 8,6 con unos 63.000 votos.
 *
 * El capítulo 26 (Kami to natta otoko) llega al 9,2.
 */
export const RATING_SERIE = 8.6;

/**
 * Capítulos en total.
 *
 *   T1  26  (octubre de 2012 - abril de 2013)
 *   ---
 *       26
 */
export const EPISODIOS_TOTAL = 26;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> la serie, con subtítulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'David Production',
    synopsis:
      'Veintiséis capítulos de octubre de 2012 a abril de 2013, en David Production para Tokyo MX. ' +
      'Jonathan y Joseph Joestar se enfrentan a Dio y a los hombres del pilar. De aquí salen ' +
      'las aventuras y el final.',
    capitulos: 'T1',
  },
];
