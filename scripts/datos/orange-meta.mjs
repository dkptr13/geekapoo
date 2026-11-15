// META - Orange
//
// AniList 21647 (serie, 2016). IMDb tt5839732: 7,7 con unas 6.600
// votos. JustWatch ES: ts41846. En España solo hay oferta a través de
// Crunchyroll Amazon Channel, no de Crunchyroll por separado.
//
// Telecom Animation Film adapta el manga de Ichigo Takano. Trece
// episodios emitidos entre julio y septiembre de 2016. Las fechas y
// los títulos japoneses de los episodios salen de TVDB (307868); los
// títulos oficiales de los episodios son LETTER01...LAST LETTER, sin
// kanji ni kana, y por eso se activa TITULOS_EN_INGLES. Las notas son
// las de IMDb.
//
// La película Orange: Mirai va en su propia ficha.

export const ANIME = {
  titulo: 'Orange',

  japaneseTitle: 'orange',

  synopsis:
    'Naho Takamiya es una estudiante de segundo de instituto en Matsumoto. Un día recibe una carta escrita por ' +
    'ella misma diez años en el futuro en la que se describen los acontecimientos que están a punto de ocurrir: ' +
    'la llegada de Kakeru Naruse, un compañero transferido de Tokio, y la muerte del chico al final del invierno. ' +
    'La carta pide a Naho que no repita los errores que ella cometió y que cuide de Kakeru. Con la ayuda de sus ' +
    'amigos, Naho intentará cambiar un destino que parece escrito de antemano.',

  anio: 2016,
  estado: 'finished',
  estudio: 'Telecom Animation Film',

  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Drama', 'Escolar', 'Recuentos de la vida', 'Coming-of-age'],
};

export const ANIME_ID = 'orange';

export const ALIASES = ['Orange 2016', 'Orange (serie)'];

export const RATING_SERIE = 7.7;

export const EPISODIOS_TOTAL = 13;

// Los subtítulos oficiales de los episodios están en inglés y no
// tienen versión japonesa publicada. Se guardan tal cual.
export const TITULOS_EN_INGLES = true;

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Telecom Animation Film',
    synopsis:
      'Trece episodios emitidos entre julio y septiembre de 2016. Naho recibe una carta de su yo del futuro y, ' +
      'junto a Suwa, Takako, Azusa y Hagita, intenta evitar la muerte de Kakeru. La serie combina el romance ' +
      'escolar con el peso de la culpa y la depresión, y convierte cada pequeña decisión en una oportunidad para ' +
      'cambiar el futuro.',
    capitulos: 'T1',
  },
];
