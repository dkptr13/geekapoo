// LA FICHA DEL ANIME - Kill la Kill
//
// Veinticuatro capitulos del 4 de octubre de 2013 al 28 de marzo de 2014,
// en Trigger para MBS. Una chica con un uniforme de sangre que busca al
// asesino de su padre en una academia dirigida por una estudiante tirana.
//
// Ficha de AniList: 18679.
// TVDB: serie 272074, con las temporadas 0 y 1.
// IMDb tt3114390: 7,8 con unos 20.000 votos.

export const ANIME = {
  titulo: 'Kill la Kill',

  japaneseTitle: 'キルラキル',

  // Base: la sinopsis de AniList y el argumento de Wikipedia, en
  // castellano. Ryuko busca al asesino de su padre y se enfrenta a
  // Satsuki Kiryuin en la academia Honnouji.
  synopsis:
    'Ryuko Matoi llega a la academia Honnouji con la mitad de unas ' +
    'tijeras gigantes, el arma que mató a su padre. Allí la espera ' +
    'Satsuki Kiryuin, la presidenta del consejo estudiantil, que gobierna ' +
    'la academia con puño de hierro y uniformes que dan superpoderes. ' +
    'Ryuko encuentra a Senketsu, un uniforme de sangre que se alimenta ' +
    'de su sangre, y con él se enfrenta a los clubes, a Satsuki y al ' +
    'secreto de su padre. Acción desbocada, humor absurdo y un final ' +
    'que no se olvida.',

  anio: 2013,
  estado: 'finished',
  estudio: 'Trigger',

  // Acción y comedia con fondo de ciencia ficción y venganza.
  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Comedia', 'Ciencia ficción', 'Ecchi', 'Shonen', 'Venganza', 'Distopía', 'Parodia'],
};

export const ANIME_ID = 'kill-la-kill';

// ── TITULOS ALTERNATIVOS ──────────────────────────────────────
//
// Lo que la gente escribe para encontrar esta obra en el buscador:
// el título en inglés con el año y las abreviaturas. Los escribe el
// agente que añade el anime, a mano, y se guardan en
// "alternativeTitles" del documento de Firestore, que es lo que la
// búsqueda inteligente ya lee.
//
// Solo títulos de ESTA obra: nada de lo que pertenezca a otra serie.
// Y sin repeticiones: el buscador normaliza los títulos, así que dos
// alias que se leen igual sobran.
//
// El japonés ya está en japaneseTitle, así que no se repite aquí.
export const ALIASES = [
  'Kill la Kill (2013)',
  'KLK',
];

/**
 * Nota de la serie en IMDb (tt3114390): 7,8 con unos 20.000 votos.
 *
 * El capítulo 18 (Yoru e isogu hito) llega al 8,9. El 2 (Kizetsu
 * suru hodo nayamashî) baja a un 7,5.
 */
export const RATING_SERIE = 7.8;

/**
 * Capítulos en total.
 *
 *   T1  24  (octubre de 2013 - marzo de 2014)
 *   ---
 *       24
 *
 * El OVA "GOODBYE AGAIN" no entra: es una obra aparte.
 */
export const EPISODIOS_TOTAL = 24;

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
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'Trigger',
    synopsis:
      'Veinticuatro capítulos del 4 de octubre de 2013 al 28 de marzo de 2014, en Trigger ' +
      'para MBS. Ryuko llega a Honnouji con la mitad de las tijeras gigantes y se enfrenta ' +
      'a Satsuki Kiryuin. De aquí salen los clubes, la campaña de la conquista, la ' +
      'revelación de Senketsu y el combate final contra Ragyo.',
    capitulos: 'T1',
  },
];
