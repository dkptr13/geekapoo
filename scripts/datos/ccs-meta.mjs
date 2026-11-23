// META - Cardcaptor Sakura
//
// Serie de television (1998-2000), 70 episodios en tres temporadas.
// Estudio: MADHOUSE. Nota de AniList: 81/100.
//
// Disponibilidad en Espana: Rakuten TV (con anuncios) y CanalSurMas
// (con anuncios), comprobada en JustWatch. CanalSurMas no esta en el
// mapeo del importador, asi que la fila que se escribe es la de Rakuten.
// Fechas de emision y titulos japoneses de TVDB; titulos en castellano de
// la Wikipedia en espanol y resumenes revisados.

export const ANIME = {
  titulo: 'Cardcaptor Sakura',

  japaneseTitle: 'カードキャプターさくら',

  synopsis:
    'Sakura Kinomoto es una alumna de cuarto de primaria que descubre en el sótano de su casa el libro del mago Clow y libera sin querer las Cartas Clow. Con la ayuda de Keroberos, el guardián del libro, y de su mejor amiga Tomoyo, Sakura se convierte en Cardcaptor y debe recuperar cada carta antes de que cause un desastre. En su camino aparecen Shaoran Li, heredero del clan Li, y su prima Meilin, y la rivalidad inicial se transforma en amistad y en algo más.',

  anio: 1998,
  estado: 'finished',
  estudio: 'MADHOUSE',

  categorias: ['Shojo & Romance', 'Fantasía & Magia'],

  generos: ['Chicas mágicas', 'Magia', 'Shojo', 'Romance', 'Fantasía', 'Aventura', 'Comedia', 'Sobrenatural'],
};

export const ANIME_ID = 'cardcaptor-sakura';

export const ALIASES = ['Sakura, cazadora de cartas', 'Card Captor Sakura', 'Sakura Card Captors', 'Cardcaptors'];

export const RATING_SERIE = 8.1;

export const EPISODIOS_TOTAL = 70;

export const STREAMING = [
  { name: 'Rakuten TV', url: 'https://www.rakuten.tv/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: 'Las Cartas Clow',
    anio: 1998,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Treinta y cinco episodios emitidos entre abril y diciembre de 1998. Sakura libera las Cartas Clow y aprende a sellarlas con la llave del libro y la ayuda de Kero y Tomoyo. Conoce a Shaoran Li, heredero del clan Li, que también aspira a quedarse con las cartas, y a su prima Meilin. Entre captura y captura, Sakura descubre los poderes de sus amigos y los secretos de su familia.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'El Juicio Final',
    anio: 1999,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Once episodios emitidos entre abril y junio de 1999. Sakura ya está en quinto de primaria y sigue capturando las últimas Cartas Clow. La llegada de la carta Tierra completa el mazo y despierta a Yue, el segundo guardián, que somete a Sakura al Juicio Final para decidir si merece ser la nueva dueña de las cartas.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Las Cartas Sakura',
    anio: 1999,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'Veinticuatro episodios emitidos entre septiembre de 1999 y marzo de 2000. Sakura transforma las Cartas Clow en Cartas Sakura con una nueva llave y un nuevo bastón. La llegada de Eriol Hiiragizawa, Nakuru y Spinel Sun pone a prueba su poder, mientras Shaoran y Meilin aclaran sus sentimientos y la ciudad se prepara para la última prueba del mago Clow.',
    capitulos: 'T3',
  },
];
