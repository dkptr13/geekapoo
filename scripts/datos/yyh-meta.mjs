// META - Yu Yu Hakusho
//
// Serie de television (1992-1995), 112 episodios en cuatro temporadas.
// Estudio: Studio Pierrot. IMDb: 8,5.
//
// Disponibilidad en Espana: AnimeBox (canal de Amazon), comprobada en
// JustWatch. Fechas de emision originales de Wikipedia japonesa; titulos
// japoneses y miniaturas de TVDB; notas de IMDb.

export const ANIME = {
  titulo: 'Yu Yu Hakusho',

  japaneseTitle: '幽☆遊☆白書',

  synopsis:
    'Yusuke Urameshi es un estudiante de catorce años, pendenciero y con malas notas, que muere atropellado al salvar a un niño. El Mundo Espiritual no contaba con su muerte y le ofrece una segunda oportunidad: resucitar y trabajar como detective encargado de los casos que relacionan a humanos y demonios. Con la ayuda de Botan, Koenma, Kuwabara, Kurama y Hiei, Yusuke se enfrenta a enemigos cada vez más poderosos.',

  anio: 1992,
  estado: 'finished',
  estudio: 'Studio Pierrot',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Sobrenatural', 'Comedia', 'Shonen', 'Artes marciales', 'Demonios'],
};

export const ANIME_ID = 'yu-yu-hakusho';

export const ALIASES = ['YuYu Hakusho', 'YYH', 'Detectives del Más Allá'];

export const RATING_SERIE = 8.5;

export const EPISODIOS_TOTAL = 112;

export const STREAMING = [
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: 'Saga del detective espiritual',
    anio: 1992,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Veinticinco episodios emitidos entre octubre de 1992 y abril de 1993. Yusuke muere al salvar a un niño, resucita y se convierte en detective del Mundo Espiritual. Sus primeros casos lo enfrentan a ladrones de objetos sagrados, a las cuatro bestias sagradas y a los hermanos Toguro.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Saga del Torneo Oscuro',
    anio: 1993,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Cuarenta y un episodios emitidos entre abril de 1993 y febrero de 1994. El equipo de Urameshi participa en el Torneo Oscuro, una competición brutal organizada por millonarios. Yusuke y sus amigos se enfrentan a rivales cada vez más fuertes hasta el duelo contra el joven Toguro.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Saga del Capítulo Negro',
    anio: 1994,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Veintiocho episodios emitidos entre febrero y agosto de 1994. Una brecha hacia el Mundo Demoníaco amenaza la ciudad y un antiguo detective espiritual, Sensui, planea abrirla del todo. Yusuke descubre el secreto de su origen mientras sus amigos intentan detenerlo.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Saga de los Tres Reyes',
    anio: 1994,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Dieciocho episodios emitidos entre agosto de 1994 y enero de 1995. Yusuke viaja al Mundo Demoníaco, donde los tres reyes se preparan para la guerra. Para evitar una masacre, propone un torneo que decida el nuevo gobernante, y todos los viejos rivales vuelven a combatir.',
    capitulos: 'T4',
  },
];
