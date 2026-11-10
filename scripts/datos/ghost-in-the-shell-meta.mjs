// META - Ghost in the Shell
//
// AniList 43 (peli, 1995, 83 minutos).
// IMDb tt0113568: 7,9.
// JustWatch ES: tm9668. Disponible en Pluto TV (gratis con anuncios),
// Apple TV y Amazon (alquiler y compra) en España.
//
// El título español es el de JustWatch y el de la Wikipedia en
// español. La película es de Mamoru Oshii y adapta el manga de
// Masamune Shirow.

export const ANIME = {
  titulo: 'Ghost in the Shell',

  japaneseTitle: '攻殻機動隊',

  synopsis:
    'En un futuro donde la humanidad está conectada a redes y los cuerpos pueden ser mejorados, la mayor Motoko Kusanagi dirige una unidad de élite de la Sección 9. ' +
    'Su misión es detener a un hacker conocido como el Puppet Master, capaz de entrar en las mentes de las personas. ' +
    'La investigación la lleva a cuestionar los límites entre el cuerpo, la memoria y el alma.',

  anio: 1995,
  estado: 'finished',
  estudio: 'Production I.G',

  categorias: ['Ciencia Ficción & Cyberpunk', 'Seinen & Psicológico'],

  generos: ['Acción', 'Psicológico', 'Ciencia ficción'],
};

export const ANIME_ID = 'ghost-in-the-shell';

export const ALIASES = ['Koukaku Kidoutai', 'Ghost in the Shell (1995)'];

export const RATING_SERIE = 7.9;

export const EPISODIOS_TOTAL = 1;

export const STREAMING = [
  { name: 'Pluto TV (gratis con anuncios)', url: 'https://pluto.tv/es', badgeColor: 'bg-yellow-500/20 text-yellow-300' },
  { name: 'Apple TV (alquiler y compra)', url: 'https://tv.apple.com/es', badgeColor: 'bg-zinc-500/20 text-zinc-300' },
  { name: 'Amazon (alquiler y compra)', url: 'https://www.primevideo.com', badgeColor: 'bg-amber-500/20 text-amber-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1995,
    estado: 'Finalizado',
    estudio: 'Production I.G',
    synopsis:
      'La película se estrenó en Japón el 18 de noviembre de 1995. En una ciudad dominada por la tecnología, la mayor Motoko Kusanagi y la Sección 9 persiguen a un hacker que puede controlar mentes ajenas. Lo que empieza como una investigación criminal se convierte en una reflexión sobre la identidad y sobre lo que queda de humano en un cuerpo artificial.',
    capitulos: 'T1',
  },
];
