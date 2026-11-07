// LA FICHA DEL ANIME - Black Lagoon
//
// Rokuro Okajima, un oficinista japonés, es secuestrado por la compañía
// Lagoon, un grupo de piratas que opera en Roanapur. Abandonado por su
// empresa, se une a ellos como Rock y aprende a moverse entre mafias,
// tríadas y asesinos a sueldo.
//
// Ficha de AniList: 889 (temporada 1), 1519 (temporada 2) y 4901 (OVA).
// IMDb tt0962826: 7,9 con unos 21.900 votos. Estudio: MADHOUSE.
//
// Los titulos de los capitulos son en ingles, tambien en Japon, asi que
// se quedan tal cual y se marca TITULOS_EN_INGLES.

export const TITULOS_EN_INGLES = true;

export const ANIME = {
  titulo: 'Black Lagoon',
  japaneseTitle: 'BLACK LAGOON',
  synopsis:
    'Rokuro Okajima es un oficinista japonés secuestrado por la compañía Lagoon, un grupo de ' +
    'piratas que trafica con todo lo que se mueve en el sudeste asiático. Abandonado por sus ' +
    'jefes, decide quedarse con ellos como Rock y aprender a sobrevivir en Roanapur, una ciudad ' +
    'donde la mafia rusa, las tríadas, los carteles y la Iglesia de la Violencia se reparten ' +
    'el poder. A su lado está Revy, una pistolera imprevisible que no le pone las cosas fáciles.',
  anio: 2006,
  estado: 'finished',
  estudio: 'MADHOUSE',
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio'],
  generos: ['Acción', 'Aventura', 'Drama', 'Thriller', 'Crimen', 'Seinen'],
};

export const ANIME_ID = 'black-lagoon';

export const ALIASES = [
  'Black Lagoon: The Second Barrage',
  "Black Lagoon: Roberta's Blood Trail",
  'ブラック・ラグーン',
];

export const RATING_SERIE = 7.9;

export const EPISODIOS_TOTAL = 29;

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Doce capítulos de abril a junio de 2006. Rock entra en la compañía Lagoon y descubre ' +
      'el negocio del contrabando en Roanapur, desde un disco robado hasta un cuadro nazi ' +
      'hundido en el fondo del mar y la venganza de una criada venezolana.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'The Second Barrage',
    anio: 2006,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Doce capítulos de octubre a diciembre de 2006. Los gemelos asesinos de Roanapur, una ' +
      'falsificadora en fuga y el ajuste de cuentas entre Balalaika y la yakuza Washimine ' +
      'ponen a prueba el papel de Rock como intermediario.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: "Roberta's Blood Trail",
    anio: 2010,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Cinco OVAs estrenadas entre 2010 y 2011. Roberta vuelve a Roanapur para vengar la muerte ' +
      'de Diego Lovelace, y García y Fabiola la persiguen mientras la ciudad entera se prepara ' +
      'para una guerra que nadie quiere detener.',
    capitulos: 'T3',
  },
];
