// META - Seishun Buta Yaro (Bunny Girl Senpai)
//
// TVDB 345596 "青春ブタ野郎はバニーガール先輩の夢を見ない" (2018).
// AniList 101291 (T1, 2018), 104157 (pelicula 2019), 154967 (pelicula
// junio 2023), 161474 (pelicula diciembre 2023), 171046 (TV 2025) y
// 199340 (pelicula octubre 2026, sin estrenar).
// IMDb tt8993398 (serie), tt9881586, tt27348312, tt28036417 y tt39927807.
//
// El titulo es el romanizado oficial de AniList, que es como se conoce
// la saga fuera de Japon. El ingles "Rascal Does Not Dream of Bunny
// Girl Senpai" es la licencia, pero el nombre corto que usa todo el
// mundo es Bunny Girl Senpai y el largo es este.
//
// ── EL ORDEN ────────────────────────────────────────────────
//
// Las temporadas van en orden cronologico, no en orden de escritura.
// La serie de la universidad (2025) se escribio la segunda pero pasa
// la quinta: entre medias van tres peliculas. TVDB guarda las pelis en
// "Specials" (S0E6 a S0E9) y la uni como S2; el catalogo numera por
// fecha, que es lo que ordena la wiki.

export const ANIME = {
  titulo: 'Seishun Buta Yaro wa Bunny Girl Senpai no Yume wo Minai',

  japaneseTitle: '青春ブタ野郎はバニーガール先輩の夢を見ない',

  synopsis:
    'Sakuta Azusagawa encuentra en la biblioteca a Mai Sakurajima, actriz famosa vestida de conejita a la que nadie mas ve. ' +
    'Es el sindrome de la pubertad: heridas de juventud que se vuelven reales y borran a la gente de la memoria ajena. ' +
    'Sakuta, que ya paso por algo parecido con su hermana Kaede, decide ayudar a Mai y despues a cada chica que aparece con un caso nuevo. ' +
    'Entre el instituto, tres peliculas, la universidad y una ultima amiga por llegar, la saga cuenta como sostener lo que se quiere sin negarlo.',

  anio: 2018,
  estado: 'finished',
  estudio: 'CloverWorks',

  // Romance por Sakuta y Mai, escolar por el instituto y la universidad,
  // y psicologico por el sindrome y lo que cada caso esconde. Son tres y
  // no una: la serie sale en las tres listas.
  categorias: ['Romance & Comedia', 'Shojo & Escolar', 'Seinen & Psicológico'],

  generos: ['Romance', 'Comedia', 'Drama', 'Misterio', 'Psicológico', 'Sobrenatural', 'Escolar'],
};

export const ANIME_ID = 'seishun-buta-yaro-wa-bunny-girl-senpai-no-yume-wo-minai';

/**
 * Un capitulo con titulo oficial en ingles.
 *
 * La T5 E9 se titula "I need you" tambien en Japon, tal como lo lista
 * TVDB S2E9. No es un dato perdido: es el subtitulo oficial del arco
 * universitario, en minusculas con mayuscula inicial.
 *
 * La bandera le dice a `comprobar-datos.mjs` que no exija kanji ni
 * kana en el campo japones. Los otros 29 si lo traen.
 */
export const TITULOS_EN_INGLES = true;

/**
 * Nota de la serie completa en IMDb, serie tt8993398: 8,1 con unos
 * 28.000 votos.
 *
 * Las peliculas puntuan aparte y no se mezclan: tt9881586 8,3,
 * tt27348312 7,3 y tt28036417 7,8. La T5 aun no tiene votos
 * suficientes en IMDb (los trece van a 0) y la T6 esta sin estrenar.
 */
export const RATING_SERIE = 8.1;

/**
 * Capitulos en total, en orden cronologico.
 *
 *   T1  13  (octubre - diciembre de 2018, serie de television)
 *   T2   1  (junio de 2019, pelicula Dreaming Girl)
 *   T3   1  (junio de 2023, pelicula Odekake Sister)
 *   T4   1  (diciembre de 2023, pelicula Randoseru Girl)
 *   T5  13  (julio - septiembre de 2025, serie Santa Claus)
 *   T6   1  (octubre de 2026, pelicula Dear Friend, sin estrenar)
 *   --
 *       30
 */
export const EPISODIOS_TOTAL = 30;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 *   · Netflix     -> la primera temporada y las peliculas, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Trece capitulos entre el 4 de octubre y el 27 de diciembre de 2018. ' +
      'Sakuta conoce a Mai con traje de conejita invisible para los demas y la ayuda a no borrarse del todo. ' +
      'Despues llegan Tomoe con su bucle, Rio duplicada, Nodoka cambiada de cuerpo con Mai y Kaede con su lista de metas antes de fin de ano. ' +
      'Cada arco son dos o tres capitulos con una chica y su sindrome, y el cierre deja a Sakuta y Mai juntos en la playa.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Yumemiru Shoujo',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Noventa minutos estrenados el 15 de junio de 2019. Sakuta vive dias tranquilos con Mai cuando reaparece Shouko, su primer amor de la infancia, y hay dos Shoukos a la vez. ' +
      'Ayudar a la mayor pone en peligro lo que tiene con Mai, y la pelicula cierra el arco de Shouko con la pareja mirando al mismo futuro. ' +
      'Primera de las cuatro peliculas y la mejor puntuada de todas.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'Odekake Sister',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Setenta y tres minutos estrenados el 23 de junio de 2023. Kaede, ya de vuelta al instituto tras recuperar la memoria, se propone salir fuera con su hermano. ' +
      'Sakuta la acompaña mientras Mai afronta la graduacion y el poco tiempo que les queda juntos. ' +
      'Segunda pelicula, sobre crecer y despedirse sin romperse.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Randoseru Girl',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Setenta y cinco minutos estrenados el 1 de diciembre de 2023. Sakuta espera a Mai en la playa para celebrar su graduacion cuando aparece una niña de primaria identica a Mai de pequeña actriz. ' +
      'La mochila nueva y los recuerdos de Mai se mezclan en la tercera pelicula, que mira a la infancia de Mai. ' +
      'Cierra la etapa del instituto antes de la universidad.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Santa Claus no Yume wo Minai',
    anio: 2025,
    estado: 'Finalizado',
    estudio: 'CloverWorks',
    synopsis:
      'Trece capitulos entre el 5 de julio y el 27 de septiembre de 2025. ' +
      'Sakuta y Mai ya estan en la universidad y la pubertad sigue con casos nuevos. ' +
      'Una joven vestida de Santa se cruza en su camino y el grupo se enreda con Nene, Ikumi, Sara y Touko entre clases, cantos y un festival de musica. ' +
      'El arco cierra con Touko cantando sin esconderse y la Santa despidiendose sin dejar heridas abiertas.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: 'Dear Friend',
    anio: 2026,
    estado: 'Próximamente',
    estudio: 'CloverWorks',
    synopsis:
      'Ciento dieciocho minutos previstos para el 16 de octubre de 2026. Sakuta sueña una escena exacta que dias despues se repite tal cual, con la cantante misteriosa diciendo ser Touko Kirishima. ' +
      'Miori, compañera de universidad, se vuelve el centro del caso y el arco universitario se cierra con la Santa despidiendose. ' +
      'Al escribirse esta ficha la pelicula aun no se ha estrenado: va sin nota hasta que haya votos.',
    capitulos: 'T6',
  },
];
