// META - Mirai, mi hermana pequeña
//
// AniList 100749 (película, 2018, 103 minutos).
// IMDb tt6900448: 7,0.
// JustWatch ES: tm362881. Disponible en Prime Video, Filmin, Acontra
// Plus, Apple TV y Rakuten TV en España.
//
// Studio Chizu produce la película, dirigida por Mamoru Hosoda y
// estrenada en Japón el 20 de julio de 2018.

export const ANIME = {
  titulo: 'Mirai, mi hermana pequeña',

  japaneseTitle: '未来のミライ',

  synopsis:
    'Kun, un niño de cuatro años, recibe la noticia de que va a tener una hermana. ' +
    'Los celos y la rabia lo empujan a un jardín mágico donde conoce a Mirai, la versión adolescente de su hermana, y a otros familiares del pasado. ' +
    'Un viaje sobre crecer, compartir y aceptar que el amor no se reparte, se multiplica.',

  anio: 2018,
  estado: 'finished',
  estudio: 'Studio Chizu',

  // Película familiar con fantasía cotidiana: los dos cajones que
  // mejor encajan con el tono de la obra.
  categorias: ['Kodomo & Familiar', 'Fantasía & Aventura'],

  generos: ['Aventura', 'Comedia', 'Drama', 'Fantasía', 'Recuentos de la vida'],
};

export const ANIME_ID = 'mirai-mi-hermana-pequena';

export const ALIASES = ['Mirai no Mirai', 'Mirai of the Future'];

export const RATING_SERIE = 7.0;

export const EPISODIOS_TOTAL = 1;

/**
 * Donde se ve en España.
 *
 *   · Prime Video   -> incluida en el catálogo.
 *   · Filmin        -> catálogo por suscripción.
 *   · Acontra Plus  -> catálogo y alquiler.
 *   · Apple TV      -> alquiler y compra.
 *   · Rakuten TV    -> alquiler y compra.
 */
export const STREAMING = [
  { name: 'Prime Video', url: 'https://www.primevideo.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'Filmin', url: 'https://www.filmin.es', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { name: 'Acontra Plus', url: 'https://ver.acontraplus.com', badgeColor: 'bg-orange-500/20 text-orange-300' },
  { name: 'Apple TV', url: 'https://tv.apple.com', badgeColor: 'bg-neutral-500/20 text-neutral-300' },
  { name: 'Rakuten TV', url: 'https://www.rakuten.tv', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Studio Chizu',
    synopsis:
      'Película estrenada en Japón el 20 de julio de 2018. Kun recibe a su nueva hermana con celos y confusión. ' +
      'Un jardín mágico lo lleva a conocer a Mirai de mayor y a los miembros de su familia que ya no están, y a entender que su lugar en la casa no desaparece.',
    capitulos: 'T1',
  },
];
