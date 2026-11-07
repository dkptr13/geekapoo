// META - Koe no Katachi
//
// AniList 20954 (peli, 2016, 130 minutos).
// IMDb tt5323662.
// TVDB la tiene como peli suelta (movie 894), sin arte de
// episodio: el capitulo va sin miniatura.
//
// Del manga de Yoshitoki Oima en la Weekly Shonen Magazine, en
// Kyoto Animation con Yamada dirigiendo y Yoshida de guionista.
//
// El titulo romanizado es el oficial en todo el mundo
// ("A Silent Voice" es la licencia en ingles).

export const ANIME = {
  titulo: 'Koe no Katachi',

  japaneseTitle: '聲の形',

  synopsis:
    'Shouya, maton de primaria, atormenta a Shouko, la niña sorda de clase, hasta que la echa del ' +
    'colegio y la clase se vuelve contra el. Años despues, solo y arrepentido, aprende la lengua de ' +
    'signos para pedirle perdon. Ciento treinta minutos de Yamada sobre el acoso, la culpa y el ' +
    'reencuentro.',

  anio: 2016,
  estado: 'finished',
  estudio: 'Kyoto Animation',

  // Drama escolar de acoso y redencion, con instituto y
  // reencuentro. Son dos.
  categorias: ['Shojo & Escolar', 'Romance & Comedia'],

  generos: ['Drama', 'Romance', 'Escolar', 'Recuentos de la vida', 'Coming-of-age'],
};

export const ANIME_ID = 'koe-no-katachi';

/**
 * Nota de la peli completa en IMDb, tt5323662: 8,2 con unos
 * 152.000 votos. El capitulo unico lleva la misma.
 */
export const RATING_SERIE = 8.2;

/**
 * Capitulos en total: la peli, del 17 de septiembre de 2016.
 */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 *   · Netflix -> la ficha de la peli en Netflix
 *     (netflix.com/title/80223226).
 */
export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/title/80223226', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Kyoto Animation',
    synopsis:
      'Ciento treinta minutos del 17 de septiembre de 2016. ' +
      'Shouya, que de niño echo a Shouko del colegio por sorda, vuelve años despues con la lengua de ' +
      'signos aprendida para pedir perdon. Yamada y Kyoto Animation con el manga de Oima al frente.',
    capitulos: 'T1',
  },
];
