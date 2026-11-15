// META - Promare
//
// AniList 99425 (película, 2019, 111 minutos). IMDb tt9116358: 7,0 con
// unas 6.200 votos. JustWatch ES: tm437215. Disponible en AnimeBox
// Channel, Amazon (alquiler y compra) y Apple TV (alquiler y compra)
// en España.
//
// Trigger estrena la película el 24 de mayo de 2019. TVDB la guarda
// como película (101817). El título japonés es プロメア.

export const ANIME = {
  titulo: 'Promare',

  japaneseTitle: 'プロメア',

  synopsis:
    'Treinta años después de que una mutación provocara incendios en todo el mundo, una organización de bomberos ' +
    'llamada Burning Rescue protege la ciudad de Promepolis. Galo Thymos, un recluta impulsivo, se enfrenta a Lio ' +
    'Fotia y a los Mad Burnish, un grupo de mutados que no controla su capacidad de prender fuego. Cuando descubre ' +
    'que el gobierno oculta la verdad sobre los Burnish, Galo tendrá que elegir entre la obediencia y la justicia. ' +
    'Una película de acción y mechas con un ritmo desbordante.',

  anio: 2019,
  estado: 'finished',
  estudio: 'Trigger',

  categorias: ['Shonen & Acción', 'Ciencia Ficción & Cyberpunk'],

  generos: ['Acción', 'Ciencia ficción', 'Mecha', 'Aventura'],
};

export const ANIME_ID = 'promare';

export const ALIASES = ['Promare (película)', 'Promare 2019'];

export const RATING_SERIE = 7.0;

export const EPISODIOS_TOTAL = 1;

export const STREAMING = [
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
  { name: 'Amazon (alquiler y compra)', url: 'https://www.primevideo.com', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { name: 'Apple TV (alquiler y compra)', url: 'https://tv.apple.com/es', badgeColor: 'bg-zinc-500/20 text-zinc-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Trigger',
    synopsis:
      'La película se estrenó en Japón el 24 de mayo de 2019. Galo Thymos, el bombero más impulsivo de Promepolis, ' +
      'persigue a los Mad Burnish sin cuestionar las órdenes de Kray Foresight. Cuando conoce a Lio y descubre el ' +
      'origen de la mutación, la línea entre héroes y villanos se rompe. La cinta combina acción, mechas y un ' +
      'conflicto sobre el poder y la discriminación.',
    capitulos: 'T1',
  },
];
