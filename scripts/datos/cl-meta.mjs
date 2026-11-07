// LA FICHA DEL ANIME - Clannad
//
// Tomoya Okazaki, un estudiante desencantado, conoce a Nagisa Furukawa,
// una chica que quiere reabrir el club de teatro. La serie va de octubre
// de 2007 a marzo de 2009, en Kyoto Animation, y adapta la novela visual
// de Key.
//
// Fichas de AniList: 2167 y 4181. IMDb tt1118804: 8,2 con unos 18.000
// votos. La segunda temporada es After Story.

export const ANIME = {
  titulo: 'Clannad',
  japaneseTitle: 'ＣＬＡＮＮＡＤ -クラナド-',
  synopsis:
    'Tomoya Okazaki es un estudiante de instituto que arrastra una relación tensa con su padre y ' +
    'ha perdido el interés por casi todo. Un día conoce en la colina de la escuela a Nagisa ' +
    'Furukawa, una chica enfermiza que repite curso y sueña con reabrir el club de teatro. Poco a ' +
    'poco, Tomoya ayuda a sus nuevos amigos a resolver sus problemas familiares mientras intenta ' +
    'recomponer su propia vida.',
  anio: 2007,
  estado: 'finished',
  estudio: 'Kyoto Animation',
  categorias: ['Drama & Recuerdos', 'Romance & Comedia'],
  generos: ['Drama', 'Romance', 'Recuentos de la vida', 'Escolar', 'Sobrenatural', 'Comedia', 'Coming-of-age'],
};

export const ANIME_ID = 'clannad';

export const ALIASES = ['Clannad: After Story'];

export const RATING_SERIE = 8.2;

export const EPISODIOS_TOTAL = 47;

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2007,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Veintitrés capítulos del 4 de octubre de 2007 al 27 de marzo de 2008, en Kyoto Animation. ' +
      'Tomoya conoce a Nagisa y, entre clases, trabajos y problemas familiares, reúne a un grupo ' +
      'de amigos para intentar salvar el club de teatro.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'After Story',
    anio: 2008,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Veinticuatro capítulos del 3 de octubre de 2008 al 26 de marzo de 2009, en Kyoto Animation. ' +
      'Tomoya y Nagisa dejan atrás el instituto y afrontan la vida adulta, el trabajo y la familia, ' +
      'mientras el pasado de la ciudad y un milagro antiguo vuelven a cruzarse en su camino.',
    capitulos: 'T2',
  },
];
