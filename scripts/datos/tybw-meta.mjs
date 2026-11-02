// LA FICHA DEL ANIME - Bleach: La guerra sangrienta de los mil años
//
// Secuela directa de Bleach que adapta el arco final del manga.
// Yhwach y el Imperio Quincy declaran la guerra a la Sociedad de
// Almas. La serie empezo en octubre de 2022 y termino en octubre de
// 2026, en Studio Pierrot.
//
// Ficha de AniList: 116674. IMDb tt14986406: 9,0 con unos 118.000 votos.

export const ANIME = {
  titulo: 'Bleach: La guerra sangrienta de los mil años',
  japaneseTitle: 'BLEACH 千年血戦篇',
  synopsis:
    'La guerra entre shinigamis y Quincy llega a su punto final. Yhwach, el rey Quincy, declara ' +
    'la guerra a la Sociedad de Almas para destruirla y reescribir el mundo. Ichigo, Uryū y los ' +
    'capitanes del Gotei 13 tendrán que unirse para frenar un ejército que puede robar bankai y ' +
    'doblegar el futuro.',
  anio: 2022,
  estado: 'finished',
  estudio: 'Studio Pierrot',
  categorias: ['Shonen & Acción', 'Fantasía & Magia'],
  generos: ['Acción', 'Aventura', 'Fantasía', 'Sobrenatural', 'Shonen'],
};

export const ANIME_ID = 'bleach-la-guerra-sangrienta-de-los-mil-anos';

export const ALIASES = [
  'Bleach: Thousand-Year Blood War',
  'Bleach: Sennen Kessen-hen',
];

export const RATING_SERIE = 9.0;

export const EPISODIOS_TOTAL = 50;

/**
 * Los titulos oficiales de los capitulos estan en ingles y no tienen
 * una version japonesa publicada. Se guardan tal cual y se salta la
 * comprobacion de escritura, igual que en Tokyo Revengers.
 */
export const TITULOS_EN_INGLES = true;

export const STREAMING = [
  { name: 'Disney+', url: 'https://www.disneyplus.com/es-es', badgeColor: 'bg-blue-500/20 text-blue-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: 'Parte 1: The Blood Warfare',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Trece capítulos del 11 de octubre al 27 de diciembre de 2022, en Studio Pierrot. Yhwach y el Imperio Quincy declaran la guerra a la Sociedad de Almas; Ichigo vuelve al combate tras recuperar sus poderes.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Parte 2: The Separation',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Trece capítulos del 8 de julio al 30 de septiembre de 2023, en Studio Pierrot. La segunda invasión Quincy arrasa el Seireitei y los capitanes intentan recuperar sus bankai robados.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Parte 3: The Conflict',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Catorce capítulos del 5 de octubre al 28 de diciembre de 2024, en Studio Pierrot. La batalla se traslada al Palacio del Rey de las Almas y Ichigo se enfrenta a Yhwach y a sus Sternritter.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Parte 4: The Calamity',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Studio Pierrot',
    synopsis:
      'Diez capítulos del 25 de julio al 27 de octubre de 2026, en Studio Pierrot. El enfrentamiento final contra Yhwach decide el futuro de la Sociedad de Almas, con Ichigo y Uryū en el centro.',
    capitulos: 'T4',
  },
];

