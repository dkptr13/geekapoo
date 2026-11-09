// META - Pompoko
//
// AniList 1030 (peli, 1994, 111 minutos).
// IMDb tt0110008: 7,2 con unas 40.000 votos.
// JustWatch ES: tm120341. Disponible en Netflix y en Apple TV
// (compra) en España.
//
// El título español es el de JustWatch y el de la Wikipedia en español.
// La película es de Isao Takahata. AniList data el estreno el 13 de
// junio de 1994, pero la Wikipedia y el propio estudio lo sitúan el
// 16 de julio de 1994; se usa esta última fecha.

export const ANIME = {
  titulo: 'Pompoko',

  japaneseTitle: '平成狸合戦ぽんぽこ',

  synopsis:
    'Los tanukis de las colinas de Tama ven cómo las excavadoras destruyen su bosque para construir viviendas. ' +
    'Para defender su hogar recurren a su antiguo arte de la transformación: espantan a los obreros, imitan espíritus y organizan una guerra de ilusiones contra los humanos. ' +
    'Los tanukis envían mensajeros a otras regiones en busca de los ancianos maestros, mientras la comunidad se divide entre resistir y aceptar el avance de la ciudad.',

  anio: 1994,
  estado: 'finished',
  estudio: 'Studio Ghibli',

  categorias: ['Fantasía & Aventura', 'Kodomo & Familiar'],

  generos: ['Comedia', 'Drama', 'Fantasía', 'Familiar'],
};

export const ANIME_ID = 'pompoko';

export const ALIASES = ['Pom Poko', 'Heisei Tanuki Gassen Ponpoko'];

export const RATING_SERIE = 7.2;

export const EPISODIOS_TOTAL = 1;

export const STREAMING = [
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Apple TV (alquiler y compra)', url: 'https://tv.apple.com/es', badgeColor: 'bg-zinc-500/20 text-zinc-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 1994,
    estado: 'Finalizado',
    estudio: 'Studio Ghibli',
    synopsis:
      'La película se estrenó en Japón el 16 de julio de 1994. Los tanukis que viven en las colinas de Tama ven cómo las obras de urbanización acaban con su territorio. Para defenderlo recuperan el arte de la transformación y organizan una resistencia cada vez más desesperada, mientras Tamasaburou busca a los grandes maestros de Shikoku.',
    capitulos: 'T1',
  },
];
