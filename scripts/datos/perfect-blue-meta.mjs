// META - Perfect Blue
//
// AniList 437 (peli, 1998, 82 minutos).
// IMDb tt0156887: 8,0.
// JustWatch ES: tm190768. Disponible en Acontra Plus, AnimeBox y
// Amazon (alquiler y compra) en España.
//
// El título español es el de JustWatch y el de la Wikipedia en
// español. La película es de Satoshi Kon y adapta la novela de
// Yoshikazu Takeuchi.

export const ANIME = {
  titulo: 'Perfect Blue',

  japaneseTitle: 'PERFECT BLUE',

  synopsis:
    'Mima Kirigoe es la cantante del trío de pop Cham. Cuando anuncia que deja la música para dedicarse a la actuación, sus seguidores más radicales se sienten traicionados. ' +
    'Mientras graba su primer papel, empieza a recibir mensajes de una página que dice ser ella misma, y los límites entre la realidad y la ficción se desmoronan.',

  anio: 1998,
  estado: 'finished',
  estudio: 'MADHOUSE',

  categorias: ['Seinen & Psicológico', 'Thriller & Misterio'],

  generos: ['Drama', 'Terror', 'Psicológico', 'Thriller'],
};

export const ANIME_ID = 'perfect-blue';

export const ALIASES = ['Pafekuto Buru', 'Perfect Blue (película)'];

// El rótulo japonés de la película es el mismo título en inglés, sin
// kanji ni kana, igual que en el estreno de 1998. Se activa la misma
// excepción que usa el catálogo para los títulos oficiales en inglés.
export const TITULOS_EN_INGLES = true;

export const RATING_SERIE = 8.0;

export const EPISODIOS_TOTAL = 1;

export const STREAMING = [
  { name: 'Acontra Plus', url: 'https://ver.acontraplus.com', badgeColor: 'bg-orange-500/20 text-orange-300' },
  { name: 'AnimeBox', url: 'https://www.animebox.es', badgeColor: 'bg-pink-500/20 text-pink-300' },
  { name: 'Amazon (alquiler y compra)', url: 'https://www.primevideo.com', badgeColor: 'bg-amber-500/20 text-amber-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1998,
    estado: 'Finalizado',
    estudio: 'MADHOUSE',
    synopsis:
      'La película se estrenó en Japón el 28 de febrero de 1998. Mima Kirigoe deja el grupo de pop Cham para ser actriz y, desde ese momento, una figura idéntica a ella empieza a aparecer en su vida. Una página escrita como si fuera su diario revela detalles íntimos y la presión de los seguidores la empuja hacia una espiral de violencia.',
    capitulos: 'T1',
  },
];
