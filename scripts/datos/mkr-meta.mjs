// META - Magic Knight Rayearth
//
// Serie de television (1994-1995), 49 episodios en dos temporadas.
// Estudio: TMS Entertainment. Nota de AniList: 71/100.
//
// Disponibilidad en Espana: Crunchyroll (incluido su canal de Amazon),
// comprobada en JustWatch el 26 de noviembre de 2026 (ficha ts25996,
// visible como "Luchadoras de leyenda").
// Fechas de emision y titulos japoneses de TVDB, corregidos con ANN y
// las wikipedias; titulos en castellano del anexo de la Wikipedia en
// espanol y resumenes revisados.
//
// La OVA de 1997 va en su propia ficha: magic-knight-rayearth-ova.

export const ANIME = {
  titulo: 'Magic Knight Rayearth',

  japaneseTitle: '魔法騎士レイアース',

  synopsis:
    'Hikaru Shidou, Umi Ryuuzaki y Fuu Hououji son tres alumnas de secundaria que, durante una excursión a la Torre de Tokio, son transportadas a Céfiro, un mundo en decadencia. Allí descubren que la princesa Emeraude, el Pilar que sostiene el reino con sus plegarias, ha sido encerrada por el sumo sacerdote Zagato. Guiadas por el mago Clef y por Mokona, las tres deberán convertirse en las Guerreras Mágicas, despertar a los dioses de las runas y salvar Céfiro antes de poder volver a casa.',

  anio: 1994,
  estado: 'finished',
  estudio: 'TMS Entertainment',

  categorias: ['Shojo & Romance', 'Fantasía & Aventura'],

  generos: ['Chicas mágicas', 'Fantasía', 'Aventura', 'Mecha', 'Shojo', 'Romance', 'Magia'],
};

export const ANIME_ID = 'magic-knight-rayearth';

export const ALIASES = ['Luchadoras de leyenda', 'Las Guerreras Mágicas', 'Rayearth', 'Majikku Naito Reiāsu'];

export const RATING_SERIE = 7.1;

export const EPISODIOS_TOTAL = 49;

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: 'La princesa Emeraude',
    anio: 1994,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Veinte episodios emitidos entre octubre de 1994 y marzo de 1995. Hikaru, Umi y Fuu llegan a Céfiro, reciben sus armas y buscan el mineral Escudo para forjar las armas con las que despertarán a los tres dioses de las runas. Por el camino se enfrentan a los secuaces de Zagato y descubren que la leyenda de las Guerreras Mágicas esconde una verdad terrible.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'El nuevo Pilar',
    anio: 1995,
    estado: 'Finalizado',
    estudio: 'TMS Entertainment',
    synopsis:
      'Veintinueve episodios emitidos entre abril y noviembre de 1995. Sin Pilar, Céfiro se desmorona y tres naciones vecinas lo invaden para hacerse con su poder. Las Guerreras Mágicas deben encontrar a la persona digna de portar la corona mientras Debonair, nacida del miedo de los habitantes, y su criatura Nova las empujan a la desesperación.',
    capitulos: 'T2',
  },
];
