// META - Fate/stay night: Unlimited Blade Works
//
// AniList 19603 (T1, 2014, 13 entradas con el prologo) y 20792 (T2,
// 2015, 13). Estudio: ufotable. Adapta la ruta UBW de la novela.
//
// El prologo de Rin se emitio como episodio aparte y aqui no cuenta
// como capitulo: la ficha tiene los 25 de la emision regular, 12 en la
// primera temporada y 13 en la segunda.

export const ANIME = {
  titulo: 'Fate/stay night: Unlimited Blade Works',

  japaneseTitle: 'フェイト/ステイナイト アンリミテッドブレイドワークス',

  synopsis:
    'Shirou Emiya sobrevivió al incendio de Fuyuki y creció creyendo que debía salvar a todo el mundo. ' +
    'Cuando la quinta guerra del Grial empieza, invoca a Saber por accidente y se alía con Rin Tohsaka, ' +
    'la mejor maga de su clase, que no tiene ninguna intención de dejarle morir por un ideal. La ruta ' +
    'de Unlimited Blade Works es la que enfrenta a Shirou con su propio futuro: un sirviente que se ' +
    'llama Archer, que pelea igual que él y que ya sabe cómo acaba la historia de quien intenta salvar ' +
    'a todos.',

  anio: 2014,
  estado: 'finished',
  estudio: 'ufotable',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Fantasía', 'Sobrenatural'],
};

export const ANIME_ID = 'fate-stay-night-unlimited-blade-works';

/**
 * Nota de AniList: 80 y 82 sobre 100. Media de las dos temporadas:
 * 8,1.
 */
export const RATING_SERIE = 8.1;

/** Capitulos en total: 12 de la primera temporada y 13 de la segunda. */
export const EPISODIOS_TOTAL = 25;

/**
 * No hay oferta española verificada de la serie completa. Se deja vacio
 * en vez de heredar la plataforma de otra entrega.
 */
export const STREAMING = [];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Doce episodios emitidos del 12 de octubre al 28 de diciembre de 2014, sin contar el ' +
      'prólogo de Rin. Shirou ve pelear a dos sirvientes, Lancer le atraviesa el pecho y Saber ' +
      'le salva la vida. A partir de ahí la guerra se le mete en el instituto: Shinji, Rider, ' +
      'Illya y un Caster que se esconde entre los profesores. ufotable anima los combates con ' +
      'un despliegue que la serie de 2006 no tenía.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Trece episodios emitidos del 5 de abril al 28 de junio de 2015. Caster se lleva a Saber, ' +
      'Archer enseña su verdadera cara y Shirou tiene que decidir si su idea de la justicia ' +
      'aguanta el choque con alguien que ya la vivió hasta el final. La temporada cierra con el ' +
      'duelo de espadas y con Gilgamesh esperando en el templo.',
    capitulos: 'T2',
  },
];
