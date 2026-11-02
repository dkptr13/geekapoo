// Que temporada del catalogo es que temporada en TVDB.
//    TEMPORADA_TVDB[animeId][temporadaDelCatalogo] = temporadaEnTvdb
//
// ── POR QUE HACE FALTA ─────────────────────────────────────────────
//
// TVDB y el catalogo no numeran las temporadas igual, y esa diferencia no
// se puede deducir: depende de como la fuente haya separado las partes
// de una serie.
//
// Los tres casos que hay en el catalogo:
//
//   · Coinciden. La mayoria. Tokyo Revengers tiene las cuatro partes en
//     T1 a T4 en los dos sitios.
//
//   · La fuente mete la OVA con la serie. TVDB tiene la OVA de Toradora
//     —弁当の極意— en la temporada 0, como un capitulo suelto sin
//     numero de temporada real. En el catalogo es la temporada 2, que es
//     lo que tiene sentido: es una pelicula, no un capitulo 0 de la
//     serie.
//
//   · La fuente parte donde el catalogo no. Ataque a los Titanes esta
//     partido en siete en el catalogo y en menos en TVDB, y TVDB ademas
//     repite la lista de la primera parte en las demas, con los mismos
//     titulos. Esa ultima parte es la peligrosa: si se empareja por
//     titulo sin mirar la temporada, la imagen del capitulo 1 de la
//     segunda parte es la del capitulo 1 de la primera.
//
// Por eso `emparejar-capitulo.mjs` exige que las temporadas coincidan,
// y solo acepta otra cosa si esta tabla lo dice.
//
// ── COMO SE LENA ───────────────────────────────────────────────────
//
// Mirando la lista de capitulos de TVDB y buscando la serie. Por ejemplo,
// para la OVA de Toradora:
//
//   node scripts/tvdb-episodios.mjs 83277
//
// y se ve que 弁当の極意 esta en S0E5. Entonces:
//
//   toradora: { 2: 0 },
//
// La clave es el numero de temporada del catalogo y el valor el de TVDB.
//
// ── LO QUE NO SE HACE ──────────────────────────────────────────────
//
// Inventar una regla que lo resuelva solo. Las formas en que estos
// numeros pueden no coincidir son varias y no se distinguen sin mirar la
// serie una por una. Un anime que no esta en la tabla significa "las
// temporadas coinciden", que es lo que ocurre en la mayoria, y por eso
// no hace falta escribirlo.

import { limpiar } from './normalizar-titulo.mjs';

/** @type {Record<string, Record<number, number>>} */
export const TEMPORADA_TVDB = {
  // Blue Lock va en orden cronologico y mezcla serie, pelicula y
  // arco especial. TVDB guarda la pelicula en el cajon de la
  // temporada 0 (la de todo lo que no es serie de television) y el
  // arco de la U-20 en su temporada 2.
  //
  //   catalogo T1  la serie                      TVDB S1
  //   catalogo T2  la pelicula EPISODE Nagi      TVDB S0
  //   catalogo T3  el arco VS. U-20 JAPAN       TVDB S2
  'blue-lock': { 2: 0, 3: 2 },

  // Haikyuu va en orden cronologico: la serie, el especial de la
  // U-20 y los dos arcos de 2020. En TVDB la temporada 0 es el
  // cajon de las peliculas y los OVA, que en el catalogo van
  // aparte por orden de salida.
  //
  //   catalogo T1  la serie                          TVDB S1
  //   catalogo T2  la segunda temporada             TVDB S2
  //   catalogo T3  el especial Karasuno vs. Shiratorizawa  TVDB S3
  //   catalogo T4  los dos arcos de 2020            TVDB S4
  'haikyuu': { 2: 2, 3: 3, 4: 4 },

  // La OVA de Toradora esta en el cajon de la temporada 0 de TVDB y es
  // la temporada 2 del catalogo.
  toradora: { 2: 0 },

  // Chunibyo mezcla dos series de television con dos OVA y una pelicula.
  // TVDB guarda las tres piezas sueltas en la temporada 0 (S0E1, S0E2 y
  // S0E4) y las dos series en las temporadas 1 y 2.
  //
  //   catalogo T1  la primera serie                TVDB S1
  //   catalogo T2  la OVA de Navidad               TVDB S0E1
  //   catalogo T3  Ren                             TVDB S2
  //   catalogo T4  la OVA de Ren                   TVDB S0E2
  //   catalogo T5  la pelicula Take On Me          TVDB S0E4
  'love-chunibyo-and-other-delusions': { 2: 0, 4: 0, 5: 0 },

  // Lo mismo con la pelicula previa de No Game No Life. El catalogo la
  // cuenta como temporada 2, que es una pelicula y no un capitulo 0, y
  // TVDB la deja en el cajon como S0E8, junto con los siete cortos.
  'no-game-no-life': { 2: 0 },

  // Las peliculas de Evangelion. El catalogo las tiene repartidas en seis
  // temporadas —la segunda es "El fin de Evangelion" y "Air"— y TVDB las
  // tiene todas juntas en el cajon de la temporada 0, que es donde mete
  // todo lo que no es parte de la serie de television.
  //
  //   catalogo T2  "El fin de Evangelion"              TVDB S0E2
  //   catalogo T3  "1.0 You Are (Not) Alone"            TVDB S0E3
  //   catalogo T4  "2.0 You Can (Not) Advance"           TVDB S0E4
  //   catalogo T5  "3.0 You Can (Not) Redo"               TVDB S0E5
  //   catalogo T6  "3.0+1.0 Thrice Upon a Time"           TVDB S0E6
  //
  // La sexta de TVDB no sale y no debe: el capitulo 2 de la temporada 2
  // del catalogo es "Air", una reedicion de dos episodios de la serie que
  // TVDB no tiene. Es el unico capitulo que se queda sin imagen, y no
  // porque este mal el dato sino porque en esa fuente no existe.
  'neon-genesis-evangelion': { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },

  // Prisma Illya: TVDB (269319) tiene las cuatro temporadas de la
  // serie en S1 a S4, pero cada una es una ficha distinta en el
  // catalogo y todas empiezan en la temporada 1. Las peliculas van
  // aparte, en `PELICULA_TVDB`.
  //
  //   catalogo 2wei       T1 -> TVDB S2
  //   catalogo 2wei Herz  T1 -> TVDB S3
  //   catalogo 3rei       T1 -> TVDB S4
  'fate-kaleid-liner-prisma-illya-2wei': { 1: 2 },
  'fate-kaleid-liner-prisma-illya-2wei-herz': { 1: 3 },
  'fate-kaleid-liner-prisma-illya-3rei': { 1: 4 },

  // Gintama: TVDB (79895) parte la serie por años y el catalogo por
  // emision. La temporada 1 del catalogo son las cuatro primeras de
  // TVDB (49 + 50 + 51 + 51 = 201); el resto coincide una a una. El
  // reparto de la T1 esta en `TRAMO_TVDB`.
  //
  //   catalogo T1  (2006-2010)  TVDB S1..S4
  //   catalogo T2  (2011)       TVDB S5
  //   catalogo T3  (2012)       TVDB S6
  //   catalogo T4  (2015)       TVDB S7
  //   catalogo T5  (2017)       TVDB S8
  //   catalogo T6  (2017)       TVDB S9
  //   catalogo T7  (2018)       TVDB S10
  'gintama': { 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10 },

  // One Piece: la T1, la T2 y la T3 van a caballo entre varias temporadas
  // de TVDB y su reparto esta en `TRAMO_TVDB`. A partir de la T4 coinciden
  // una a una: Arabasta es la S7 (39 capitulos), el relleno la S8 (13) y
  // Skypiea la S9 (52). La T7 vuelve a partirse y esta en `TRAMO_TVDB`.
  //
  //   catalogo T4  (2001-2002)  TVDB S7
  //   catalogo T5  (2002-2003)  TVDB S8
  //   catalogo T6  (2003-2004)  TVDB S9
  'one-piece': { 4: 7, 5: 8, 6: 9 },

  // Seishun Buta Yaro va en orden cronologico: series y peliculas
  // mezcladas. TVDB guarda las cuatro pelis en el cajon de la
  // temporada 0 (S0E6 a S0E9) y la serie universitaria como S2.
  //
  //   catalogo T2  "Yumemiru Shoujo" (2019)          TVDB S0E6
  //   catalogo T3  "Odekake Sister" (jun 2023)       TVDB S0E7
  //   catalogo T4  "Randoseru Girl" (dic 2023)       TVDB S0E8
  //   catalogo T5  "Santa Claus" (TV 2025)           TVDB S2
  //   catalogo T6  "Dear Friend" (oct 2026)          TVDB S0E9
  'seishun-buta-yaro-wa-bunny-girl-senpai-no-yume-wo-minai': { 2: 0, 3: 0, 4: 0, 5: 2, 6: 0 },

  // La pelicula de Takagi va como T4 del catalogo y TVDB la guarda
  // en Specials. Las tres de television coinciden solas.
  'teasing-master-takagi-san': { 4: 0 },

  // Las Quintillizas va en orden cronologico: dos series, peli y dos
  // especiales. TVDB guarda peli y especiales en Specials (S0E1 a
  // S0E5); las dos series coinciden solas.
  //
  //   catalogo T3  pelicula (2022)               TVDB S0E1
  //   catalogo T4  especial de verano (2023)     TVDB S0E2+E3
  //   catalogo T5  luna de miel (2024)           TVDB S0E4+E5
  'las-quintillizas': { 3: 0, 4: 0, 5: 0 },

  // KonoSuba va en orden de emision: tres series, dos OVAs, la peli y
  // los dos BONUS STAGE. TVDB guarda las series en S1 a S3 y deja las
  // dos OVAs, la peli y los especiales en Specials (S0E3 a S0E7).
  // Bakuen va aparte: es otra serie en TVDB (420657) y sus miniaturas
  // se ponen a mano.
  //
  //   catalogo T1  serie 2016              TVDB S1
  //   catalogo T2  OVA del collar          TVDB S0E3
  //   catalogo T3  serie 2017              TVDB S2
  //   catalogo T4  OVA del retrato         TVDB S0E4
  //   catalogo T5  pelicula 2019           TVDB S0E5
  //   catalogo T6  Bakuen 2023             TVDB 420657
  //   catalogo T7  serie 2024              TVDB S3
  //   catalogo T8  BONUS STAGE 2025        TVDB S0E6 y S0E7
  'konosuba': { 2: 0, 4: 0, 5: 0, 7: 3, 8: 0 },

  // El especial #0.8 de Burn the Witch va como T2 y TVDB lo guarda
  // en Specials (S0E1). La serie ONA coincide sola.
  'burn-the-witch': { 2: 0 },

  // La OVA für die Liebe de Kämpfer va como T2 y TVDB la guarda en
  // Specials (el 13 como S0E9 y el 14 como S0E10). La serie
  // coincide sola.
  'kampfer': { 2: 0 },

  // El OVA de Masamune va como T2 y TVDB lo guarda en Specials
  // (S0E1). La R va como T3 y TVDB la guarda como S2. La serie
  // coincide sola.
  'masamune-kun-no-revenge': { 2: 0, 3: 2 },

  // Kimetsu va en orden cronologico: serie, pelis y arcos. TVDB
  // guarda las pelis en Specials (S0E2 el Tren, S0E16 el Castillo
  // 1) y numera los arcos uno por delante (la S2 de TVDB es la
  // version de tele del Tren, que aqui no entra).
  //
  //   catalogo T1  serie (2019)              TVDB S1
  //   catalogo T2  peli Tren (2020)          TVDB S0E2
  //   catalogo T3  Yuukaku                   TVDB S3
  //   catalogo T4  Herreros                  TVDB S4
  //   catalogo T5  Pilar                     TVDB S5
  //   catalogo T6  peli Castillo 1 (2025)    TVDB S0E16
  'kimetsu-no-yaiba': { 2: 0, 3: 3, 4: 4, 5: 5, 6: 0 },

  // Oregairu va en orden de emision: tres series y tres OVAs. TVDB
  // guarda las series en S1 a S3 y los OVAs en Specials (S0E1 a
  // S0E3).
  'yahari-ore-no-seishun-love-come-wa-machigatteiru': { 2: 0, 3: 2, 4: 0, 5: 3, 6: 0 },

  // Nisekoi va en orden de emision: dos series y dos OVAs. TVDB
  // guarda las series en S1 y S2 y los OVAs en Specials (S0E1 a
  // S0E3 los de 2014-2015 y S0E5 y S0E7 los de 2016).
  'nisekoi': { 2: 0, 3: 2, 4: 0 },

  // K-On! va en orden de emision: dos series, dos OVAs y la peli.
  // TVDB guarda las series en S1 y S2 y el resto en Specials
  // (S0E19 Live House, S0E17 Keikaku, S0E18 la peli). Los cortos
  // Ura-On no entran.
  'k-on': { 2: 0, 3: 2, 4: 0, 5: 0 },

  // Goblin Slayer va en orden de emision: dos series y la peli.
  // TVDB guarda las series en S1 y S2 y la peli en Specials
  // (S0E2). El resumen de S0E1 no entra.
  'goblin-slayer': { 2: 0, 3: 2 },

  // Mirai Nikki: serie en S1 y Redial en Specials (S0E2). El
  // piloto y los chibis no entran.
  'mirai-nikki': { 2: 0 },

  // Kabaneri: serie en S1 y peli Unato en Specials (S0E6 entera;
  // los S0E3 a S0E5 son su version partida). Los recopilatorios
  // no entran.
  'kabaneri-of-the-iron-fortress': { 2: 0 },

  // SPY×FAMILY va en orden cronologico: serie junta, peli y dos
  // temporadas. TVDB guarda la S1 junta (25), la peli en Specials
  // (S0E3) y las otras en S2 y S3. El cursillo, el anuncio y la
  // publi no entran.
  //
  //   catalogo T1  serie 2022 (dos partes)  TVDB S1
  //   catalogo T2  peli CODE: White (2023)  TVDB S0E3
  //   catalogo T3  Season 2                 TVDB S2
  //   catalogo T4  Season 3                 TVDB S3
  'spy-family': { 2: 0, 3: 2, 4: 3 },

  // Date A Live va en orden de emision: cinco series, dos OVAs y
  // tres pelis. TVDB guarda las series en S1 a S5 y el resto en
  // Specials (S0E1 DATE TO DATE, S0E2 Kurumi, S0E3 Mayuri, S0E4
  // Bullet 1, S0E5 Bullet 2).
  'date-a-live': { 2: 0, 3: 2, 4: 0, 5: 0, 6: 3, 7: 0, 8: 0, 9: 4, 10: 5 },

  // High School of the Dead: serie en S1 y OVA en Specials (S0E1).
  // El videoclip no entra.
  'high-school-of-the-dead': { 2: 0 },

  // To Love Ru va en orden de emision: cuatro series, cuatro OVAs
  // y los especiales. TVDB guarda las series en S1 a S4 y el resto
  // en Specials (S0E1 a S0E6 el OVA, S0E7 a S0E12 el OVA
  // Darkness, S0E13 a S0E15 el OVA 2nd, S0E16 Multiplication).
  // Los especiales van al final de la S4 (E13 y E14): eso lo dice
  // CAPITULO_TVDB. El archivo de Momo no entra.
  'to-love-ru': { 2: 0, 3: 2, 4: 3, 5: 0, 6: 4, 7: 4, 8: 0, 9: 0 },

  // La pelicula precuela Frozen Bond de Re:Zero va como T5 y TVDB
  // la guarda en Specials (S0E28). Las cuatro de television
  // coinciden solas. Memory Snow no necesita mapa: va como T1E26
  // y se empareja a mano por titulo.
  're-zero-comenzando-la-vida-en-otro-mundo': { 5: 0 },

  // Psycho-Pass guarda las pelis en Specials de su misma serie
  // (262090): la peli en S0E12, la trilogía Sinners en S0E13 a S0E15
  // y Providence en S0E20. La T5 del catálogo es la S3 de TVDB.
  // First Inspector va partida en tres (S0E16 a S0E18) y se pone a
  // mano con la primera parte.
  'psycho-pass': { 3: 0, 4: 0, 5: 3, 6: 0, 7: 0 },

  // La peli secuela de Abyss va como T2 y TVDB la guarda en Specials
  // (S0E3). La T3 del catálogo es la S2 de TVDB. Los resúmenes y
  // los cortos no entran.
  'made-in-abyss': { 2: 0, 3: 2 },

  // Las dos pelis de Madoka van como T2 y T3 y TVDB las guarda en
  // Specials (S0E3 y S0E4). La serie coincide sola. La de Walpurgis
  // aún no tiene imagen en TVDB y se queda sin miniatura.
  'puella-magi-madoka-magica': { 2: 0, 3: 0 },

  // El OVA de Charlotte va como T2 y TVDB lo guarda en Specials
  // (S0E2). La serie coincide sola.
  'charlotte': { 2: 0 },
  // La peli de Steins;Gate va como T2 y TVDB la guarda en Specials
  // (S0E2, mismo titulo japones). La T1 coincide sola. Zero va
  // aparte en TVDB (339268) y sus miniaturas se ponen a mano,
  // como Bakuen en KonoSuba (420657).
  'steins-gate': { 2: 0 },

  // Hunter x Hunter mete la serie entera en una sola temporada del
  // catalogo, pero TVDB la parte en tres bloques de produccion. El
  // emparejador no puede comparar numeros de temporada; usa el titulo
  // japones unico y el caso SIN_COMPROBAR_NUMERO. Las dos peliculas van
  // como T2 y T3 y TVDB las guarda en Specials (S0E1 y S0E2).
  'hunter-x-hunter': { 2: 0, 3: 0 },

  // Overlord: las cuatro temporadas de television coinciden con las de
  // TVDB (294002), pero van en orden de publicacion, con el OVA y las
  // peliculas intercalados. El OVA y las tres peliculas van en la
  // temporada 0, que es el cajon de todo lo que no es serie de
  // television.
  //
  //   catalogo T1  Overlord (2015)          TVDB S1
  //   catalogo T2  el OVA de 2016            TVDB S0
  //   catalogo T3  El rey muerto (2017)     TVDB S0
  //   catalogo T4  El heroe oscuro (2017)   TVDB S0
  //   catalogo T5  Overlord II (2018)       TVDB S2
  //   catalogo T6  Overlord III (2018)      TVDB S3
  //   catalogo T7  Overlord IV (2022)       TVDB S4
  //   catalogo T8  El reino sagrado (2024)  TVDB S0
  'overlord': { 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 0 },

  // Sword Art Online: en orden de publicacion. Las peliculas (el
  // especial Extra Edition, la Ordinal Scale y las dos de Progressive)
  // van en la temporada 0. Gun Gale Online es otra serie en TVDB
  // (335815) y sus miniaturas se ponen a mano, como Bakuen en
  // KonoSuba (420657).
  //
  //   catalogo T1  la serie (2012)              TVDB S1
  //   catalogo T2  Extra Edition (2013)          TVDB S0
  //   catalogo T3  SAO II (2014)                TVDB S2
  //   catalogo T4  Ordinal Scale (2017)          TVDB S0
  //   catalogo T5  Gun Gale Online (2018)        TVDB 335815
  //   catalogo T6  Alicization (2018)            TVDB S3
  //   catalogo T7  War of Underworld (2019)     TVDB S4
  //   catalogo T8  Progressive, Aria (2021)      TVDB S0
  //   catalogo T9  Progressive, Scherzo (2022)   TVDB S0
  //   catalogo T10 Gun Gale Online II (2024)     TVDB 335815
  //   catalogo T11 Unanswered//butterfly (2026) no esta en TVDB
  'sword-art-online': { 2: 0, 3: 2, 4: 0, 6: 3, 7: 4, 8: 0, 9: 0, 11: 0 },

  // One Punch Man: las tres temporadas de television coinciden con las
  // de TVDB (293088), con el especial y los OVA intercalados por fecha
  // de publicacion. El especial y los dos grupos de OVA van en la
  // temporada 0.
  //
  //   catalogo T1  la serie (2015)          TVDB S1
  //   catalogo T2  Road to Hero (2015)      TVDB S0
  //   catalogo T3  los OVA (2015-2016)      TVDB S0
  //   catalogo T4  One Punch Man 2 (2019)   TVDB S2
  //   catalogo T5  los OVA 2 (2019-2020)    TVDB S0
  //   catalogo T6  One Punch Man 3 (2025)   TVDB S3
  'one-punch-man': { 2: 0, 3: 0, 4: 2, 5: 0, 6: 3 },

  // Mob Psycho 100 y Vinland Saga no necesitan mapa: sus temporadas de
  // television coinciden con las de TVDB (307375 y 359274). Los capitulos
  // intercalados (el OVA de Reigen, el especial de Mob Psycho 100 II y
  // los dos de Vinland Saga) estan en la temporada 0 de TVDB y sus
  // miniaturas se ponen a mano.

  // Tensei Shitara Slime Datta Ken va en orden de publicacion, con las
  // pelis y los capitulos originales en DVD intercalados. TVDB (352408)
  // mete en la temporada 0 todo lo que no es serie de television: los
  // cinco capitulos en DVD, la peli Scarlet Bond y el ONA de Coleus.
  //
  //   catalogo T1  la serie (2018)             TVDB S1
  //   catalogo T2  los capitulos en DVD (2019)  TVDB S0
  //   catalogo T3  la segunda (2021)            TVDB S2
  //   catalogo T4  Scarlet Bond (2022)          TVDB S0
  //   catalogo T5  Coleus no Yume (2023)        TVDB S0
  //   catalogo T6  la tercera (2024)            TVDB S3
  //   catalogo T7  Lágrimas del mar azul (2026) TVDB S0 (no esta aun)
  //   catalogo T8  la cuarta (2026)             TVDB S4
  'tensei-shitara-slime-datta-ken': { 2: 0, 3: 2, 4: 0, 5: 0, 6: 3, 7: 0, 8: 4 },

  // Shinmai Maou no Testament va en orden de publicacion, con los dos
  // OVA y la peli Departures intercalados. TVDB (284719) mete en la
  // temporada 0 todo lo que no es serie de television.
  //
  //   catalogo T1  la primera serie (2015)     TVDB S1
  //   catalogo T2  el primer OVA (2015)        TVDB S0
  //   catalogo T3  Burst (2015)                TVDB S2
  //   catalogo T4  el segundo OVA (2016)       TVDB S0
  //   catalogo T5  Departures (2018)           TVDB S0
  'shinmai-maou-no-testament': { 2: 0, 3: 2, 4: 0, 5: 0 },
};
/**
 * Que capitulo de TVDB es el capitulo N de una temporada del catalogo.
 *
 * Esto es distinto de `TEMPORADA_TVDB`, y hace falta por un caso concreto.
 * Ataque a los Titanes esta partido en siete temporadas en el catalogo y
 * en cuatro en TVDB, porque TVDB junta la tercera y la cuarta parte, y
 * mete la sexta y la séptima al final de la misma. No es que los numeros
 * no cuadren: es que una temporada del catalogo es un trozo de una de
 * TVDB.
 *
 * El mapa se ha sacado comparando las fechas de emision y los titulos,
 * que en los dos sitios son los mismos expresados en otro idioma. Por
 * ejemplo:
 *
 *   catalogo T4 E1   "La ciudad donde empezó todo"   2019-04-29
 *   TVDB   S3E13     はじまりの街                       2019-04-29
 *
 * Misma fecha, mismo titulo. Asi que la cuarta temporada del catalogo es
 * la trece de la tercera de TVDB.
 *
 *   catalogo T1 -> TVDB S1E1..25
 *   catalogo T2 -> TVDB S2E1..12
 *   catalogo T3 -> TVDB S3E1..12
 *   catalogo T4 -> TVDB S3E13..22
 *   catalogo T5 -> TVDB S4E1..16
 *   catalogo T6 -> TVDB S4E17..28
 *   catalogo T7 -> TVDB S4E29..30
 *
 * ── POR QUE NO SE DEDUCE ────────────────────────────────────────────
 *
 * Se podria intentar calcularlo: "la temporada 4 empieza donde acaba la
 * 3, luego son los ultimos capitulos de la de TVDB". Y seria falso en
 * cuanto TVDB metiese un capitulo suelto en medio, que es justo lo que
 * hace con los espining offs: la temporada 0 tiene cincuenta y uno, con
 * capitulos de 2018, 2019, 2020 y 2024 mezclados. Un numero no dice
 * cuando se emitio.
 *
 * Con las fechas si funciona, porque un capitulo se emitio un dia
 * concreto. Por eso la comprobacion de la fecha es la que se usa para
 * validar el mapa, y no al reves.
 *
 * @type {Record<string, Record<number, {temporada: number, desde: number}>>}
 */
export const CAPITULO_TVDB = {
  // Fate/Zero va partido en dos temporadas en el catalogo (13 + 12) y
  // TVDB (275798) tiene los 25 capitulos seguidos en la S1. El primer
  // capitulo de la segunda parte es el 14 de TVDB.
  //
  //   catalogo T1 -> TVDB S1E1..13
  //   catalogo T2 -> TVDB S1E14..25
  'fate-zero': {
    1: { temporada: 1, desde: 1 },
    2: { temporada: 1, desde: 14 },
  },
  // Unlimited Blade Works va igual: 12 + 13 en el catalogo y los 25 en
  // la S1 de TVDB (278626). La segunda parte arranca en el 13.
  //
  //   catalogo T1 -> TVDB S1E1..12
  //   catalogo T2 -> TVDB S1E13..25
  'fate-stay-night-unlimited-blade-works': {
    1: { temporada: 1, desde: 1 },
    2: { temporada: 1, desde: 13 },
  },
  'ataque-a-los-titanes': {
    1: { temporada: 1, desde: 1 },
    2: { temporada: 2, desde: 1 },
    3: { temporada: 3, desde: 1 },
    4: { temporada: 3, desde: 13 },
    5: { temporada: 4, desde: 1 },
    6: { temporada: 4, desde: 17 },
    7: { temporada: 4, desde: 29 },
  },
  // Los especiales de Darkness 2nd van al final de la S4 de TVDB
  // (E13 y E14), no en Specials. Sin esto, el capitulo 1 de la T7
  // buscaria el S0E1, que es del OVA de 2009.
  'to-love-ru': {
    7: { temporada: 4, desde: 13 },
  },
};

/**
 * Temporadas del catalogo repartidas en varios tramos de TVDB.
 *    TRAMO_TVDB[animeId][temporadaDelCatalogo] = [ {temporada, desde, hasta}, ... ]
 *
 * ── POR QUE NO BASTA `CAPITULO_TVDB` ────────────────────────────────
 *
 * `CAPITULO_TVDB` dice "esta temporada empieza en el episodio N de
 * aquella", y sirve cuando la temporada del catalogo es un trozo de una
 * sola temporada de TVDB. Gintama es el otro caso: su primera temporada
 * en el catalogo son 201 episodios seguidos, y TVDB los reparte en
 * cuatro temporadas por año (49, 50, 51 y 51).
 *
 * El numero de cada tramo es el del episodio de TVDB (desde y hasta
 * incluidos). Los tramos van en orden: el episodio siguiente al ultimo
 * del primero es el primero del segundo.
 *
 * ── COMO SE COMPRUEBA ───────────────────────────────────────────────
 *
 * La suma de los tramos tiene que dar el numero de episodios de la
 * temporada del catalogo, y las fechas tienen que cuadrar. En Gintama
 * cuadran 366 de los 367: 331 el mismo dia y 35 con un dia de
 * diferencia, que es como IMDb y TVDB escriben la misma emision en
 * husos distintos. El que queda (T1E85) tiene la fecha repetida en el
 * catalogo por un error de IMDb; TVDB lo tiene una semana despues y el
 * titulo confirma que es el mismo episodio.
 *
 * @type {Record<string, Record<number, Array<{temporada: number, desde: number, hasta: number}>>>}
 */
export const TRAMO_TVDB = {
  gintama: {
    1: [
      { temporada: 1, desde: 1, hasta: 49 },
      { temporada: 2, desde: 1, hasta: 50 },
      { temporada: 3, desde: 1, hasta: 51 },
      { temporada: 4, desde: 1, hasta: 51 },
    ],
  },
  // One Piece: TVDB (81797) parte la serie por anos y el catalogo por
  // sagas. La primera temporada del catalogo son 61 capitulos seguidos
  // (el East Blue), que en TVDB son las temporadas 1 a 4 enteras y el
  // primer capitulo de la 5.
  //
  //   catalogo T1  (1999-2001)  TVDB S1 (8) + S2 (22) + S3 (17) + S4 (13) + S5E1
  'one-piece': {
    1: [
      { temporada: 1, desde: 1, hasta: 8 },
      { temporada: 2, desde: 1, hasta: 22 },
      { temporada: 3, desde: 1, hasta: 17 },
      { temporada: 4, desde: 1, hasta: 13 },
      { temporada: 5, desde: 1, hasta: 1 },
    ],
    // La T2 son los 16 capitulos del 62 al 77. TVDB los tiene a caballo
    // entre la temporada 5 (le quedan ocho huecos despues del 61) y la
    // 6. La T3 son los 14 del 78 al 91, todos seguidos en la 6.
    //
    //   catalogo T2  (62-77)  TVDB S5E2..S5E9 + S6E1..S6E8
    //   catalogo T3  (78-91)  TVDB S6E9..S6E22
    //
    // El 92, que abre la S7 de TVDB, es el especial de Arabasta y va con
    // la cuarta temporada del catalogo.
    2: [
      { temporada: 5, desde: 2, hasta: 9 },
      { temporada: 6, desde: 1, hasta: 8 },
    ],
    3: [{ temporada: 6, desde: 9, hasta: 22 }],
    // La T7 son los 33 capitulos del 196 al 228. TVDB mete los treinta y
    // uno primeros en su temporada 10 y los dos ultimos (la llegada de
    // Aokiji) abren la temporada 11.
    //
    //   catalogo T7  (196-226)  TVDB S10E1..S10E31
    //   catalogo T7  (227-228)  TVDB S11E1..S11E2
    7: [
      { temporada: 10, desde: 1, hasta: 31 },
      { temporada: 11, desde: 1, hasta: 2 },
    ],
    // La T8 son los 35 capitulos del 229 al 263, que en TVDB son los
    // siguientes de la temporada 11 (detras de los dos de Aokiji).
    //
    //   catalogo T8  (229-263)  TVDB S11E3..S11E37
    8: [{ temporada: 11, desde: 3, hasta: 37 }],
    // La T9 son los 73 capitulos del 264 al 336. TVDB mete los 62
    // primeros al final de la temporada 11 y los 11 ultimos (los Piratas
    // del Fenix y Chopperman) al principio de la 12.
    //
    //   catalogo T9  (264-325)  TVDB S11E38..S11E99
    //   catalogo T9  (326-336)  TVDB S12E1..S12E11
    9: [
      { temporada: 11, desde: 38, hasta: 99 },
      { temporada: 12, desde: 1, hasta: 11 },
    ],
    // La T10 son los 45 capitulos del 337 al 381, que en TVDB son el resto
    // de la temporada 12 (detras de los once de la T9).
    //
    //   catalogo T10  (337-381)  TVDB S12E12..S12E56
    10: [{ temporada: 12, desde: 12, hasta: 56 }],
    // La T11 son los 26 capitulos del 382 al 407, los primeros de la
    // temporada 13 de TVDB (Sabaody y el principio de Amazon Lily).
    //
    //   catalogo T11  (382-407)  TVDB S13E1..S13E26
    11: [{ temporada: 13, desde: 1, hasta: 26 }],
    // La T12 son los 14 capitulos del 408 al 421, que en TVDB son los
    // siguientes de la temporada 13 (Amazon Lily).
    //
    //   catalogo T12  (408-421)  TVDB S13E27..S13E40
    12: [{ temporada: 13, desde: 27, hasta: 40 }],
    // La T13 son los 35 capitulos del 422 al 456, todos seguidos en la
    // temporada 13 de TVDB (Impel Down y el especial de Strong World).
    //
    //   catalogo T13  (422-456)  TVDB S13E41..S13E75
    13: [{ temporada: 13, desde: 41, hasta: 75 }],
    // La T14 son los 60 capitulos del 457 al 516. TVDB cierra con ellos su
    // temporada 13 (hasta la muerte de Barbablanca) y abre la 14 con el
    // resto, que llega hasta el entrenamiento de Luffy.
    //
    //   catalogo T14  (457-481)  TVDB S13E76..S13E100
    //   catalogo T14  (482-516)  TVDB S14E1..S14E35
    14: [
      { temporada: 13, desde: 76, hasta: 100 },
      { temporada: 14, desde: 1, hasta: 35 },
    ],
    // La T15 son los 62 capitulos del 517 al 578, todos en la temporada 15
    // de TVDB (la vuelta a Sabaody, la isla de los hombres pez y Z's
    // Ambition).
    //
    //   catalogo T15  (517-578)  TVDB S15E1..S15E62
    15: [{ temporada: 15, desde: 1, hasta: 62 }],
    // La T16 son los 50 capitulos del 579 al 628. TVDB tiene los primeros
    // once en su temporada 16, el crossover con Toriko y Dragon Ball (590)
    // lo guarda como especial en la temporada 0, y el resto sigue en la 16.
    //
    //   catalogo T16  (579-589)  TVDB S16E1..S16E11
    //   catalogo T16  (590)      TVDB S0E39 (especial crossover)
    //   catalogo T16  (591-628)  TVDB S16E12..S16E49
    16: [
      { temporada: 16, desde: 1, hasta: 11 },
      { temporada: 0, desde: 39, hasta: 39 },
      { temporada: 16, desde: 12, hasta: 49 },
    ],
    // La T17 son los 118 capitulos del 629 al 746, todos seguidos en la
    // temporada 17 de TVDB (Dressrosa).
    //
    //   catalogo T17  (629-746)  TVDB S17E1..S17E118
    17: [{ temporada: 17, desde: 1, hasta: 118 }],
  },
};

/**
 * La temporada de TVDB y el numero dentro de ella para un capitulo del
 * catalogo.
 *
 * @param {string} animeId
 * @param {number} temporada
 * @param {number} numero
 * @returns {{temporada: number, numero: number}}
 */
export function capituloEnTvdb(animeId, temporada, numero) {
  // Un capitulo con numero decimal —el 0.5 de Ataque a los Titanes, el
  // 15.5 de Mushoku— va intercalado en la serie: no es de una temporada
  // concreta. TVDB deja esos capitulos en el cajon de la temporada 0,
  // junto con los OVAs, los cortos y los espining offs.
  //
  // La comprobacion va antes que el mapa porque el mapa solo existe para
  // los capitulos enteros: un 16.5 de Ataque no es "el 16.5 de la
  // temporada 1" translated a S1E17, es otra cosa.
  if (numero % 1 !== 0) {
    return { temporada: 0, numero };
  }

  // Una temporada del catalogo que son varios tramos de TVDB. Va antes
  // que los otros mapas porque los tramos ya dicen temporada y numero.
  const tramos = TRAMO_TVDB[animeId]?.[temporada];

  if (tramos) {
    let base = 0;

    for (const tramo of tramos) {
      const largo = tramo.hasta - tramo.desde + 1;

      if (numero <= base + largo) {
        return {
          temporada: tramo.temporada,
          numero: tramo.desde + (numero - base - 1),
        };
      }

      base += largo;
    }

    // Un episodio fuera de los tramos no deberia existir: el catalogo
    // tiene que tener tantos como la suma. Se devuelve una posicion que
    // no existe para que la comprobacion de posicion lo rechace.
    const ultimo = tramos.at(-1);

    return { temporada: ultimo.temporada, numero: ultimo.hasta + 1 };
  }

  const mapa = CAPITULO_TVDB[animeId]?.[temporada];

  if (!mapa) {
    return {
      temporada: temporadaEnTvdb(animeId, temporada),
      numero,
    };
  }

  return {
    temporada: mapa.temporada,
    numero: mapa.desde + (numero - 1),
  };
}

/**
 * Series en las que TVDB no numera los capitulos como el catalogo.
 *
 * En estas series el emparejado se hace por titulo y se acepta lo que
 * TVDB tenga, sin comprobar el numero. Sigue siendo seguro porque el
 * titulo japones es unico dentro de la serie, que es justo lo que
 * comprueba `emparejar-capitulo.mjs`.
 *
 * ── POR QUE HACE FALTA Y POR QUE NO SE RESUELVE SOLO ──────────────
 *
 * El caso es Saekano. Su numeracion oficial empieza en cero: el primer
 * capitulo emitido es el 0 y el segundo es el 1. TVDB respeta eso y los
 * deja en la temporada 0, luego arranca la temporada 1 en el tercero. El
 * catalogo va de 1 a 13 sin hueco, que es como los cuenta la fandom.
 *
 * Cada capitulo del catalogo esta pues un numero por delante del que le
 * toca en TVDB:
 *
 *   catalogo 1  "愛と青春のサービス回"   TVDB S0E1
 *   catalogo 2  "恋と純情のサービス回"   TVDB S0E2
 *   catalogo 3  "間違いだらけのプロローグ"  TVDB S1E1
 *   catalogo 4  "フラグの立たない彼女"       TVDB S1E2
 *
 * Un desfase fijo no serviria: no es constante ni por temporada ni por
 * numero, asi que no se puede sumar nada. Y tampoco serviria copiar el
 * numero del catalogo al de TVDB.
 *
 * Lo que si funciona es emparejar por titulo, y como los titulos
 * japoneses no se repiten dentro de la serie, no hay ambiguedad. Eso es
 * exactamente lo que ya hacia `emparejar-capitulo.mjs` cuando no
 * encontraba el numero: coje el unico candidato. Aqui lo que cambia es
 * que se le deja hacerlo tambien cuando la temporada si existe.
 *
 * Que la serie figure en esta lista es una decision, no una deduccion: se
 * ha comprobado una por una. Por eso la lista es corta.
 *
 * @type {Set<string>}
 */
export const SIN_COMPROBAR_NUMERO = new Set([
  'saekano-how-to-raise-a-boring-girlfriend',
  // TVDB reparte los 148 episodios en bloques de 58, 78 y 12, que no
  // son temporadas. El titulo japones de cada episodio es unico, asi
  // que el emparejador puede buscar por titulo sin comparar el numero
  // de temporada.
  'hunter-x-hunter',
]);

/**
 * Series cuyos ficheros de datos no traen el titulo japones.
 *
 * ── POR QUE EXISTE ESTA LISTA ──────────────────────────────────────
 *
 * El emparejador busca por titulo japones porque es el dato que no se
 * puede confundir. Gintama se dio de alta con los titulos traducidos y
 * las fechas de IMDb, y la tercera columna de los ficheros (el japones)
 * esta vacia en los 367 episodios. Sin titulo no hay nada que comparar,
 * y el anime se quedaba sin miniaturas aunque TVDB las tuviera.
 *
 * ── QUE SE HACE EN SU LUGAR ────────────────────────────────────────
 *
 * Se usa la temporada y el numero, que estan mapeados a mano en
 * `TEMPORADA_TVDB` y `TRAMO_TVDB`, y que en Gintama cuadran con TVDB
 * episodio a episodio. No es una regla automatica que valga para
 * cualquier serie: aqui se ha comprobado que el reparto es el mismo
 * (49 + 50 + 51 + 51 = 201 episodios en la T1, y el resto temporada a
 * temporada) y que las fechas coinciden.
 *
 * Si algun dia se rellenan los titulos japoneses de Gintama, esta lista
 * deja de hacer falta: el emparejador usa el titulo en cuanto lo hay.
 *
 * @type {Set<string>}
 */
export const SIN_TITULO_JAPONES = new Set(['gintama']);

/**
 * Las fichas del catalogo que son una pelicula suelta y su id en TVDB.
 *
 * ── POR QUE NO LAS ENCUENTRA LA BUSQUEDA NORMAL ────────────────────
 *
 * El emparejador busca series (`type=series`) y compara los titulos
 * japoneses de los capitulos. Una pelicula no es una serie: TVDB la
 * guarda como `movie`, sin lista de capitulos, y el titulo japones del
 * fichero de datos es solo un trozo del titulo de la pelicula ("雪下の
 * 誓い" frente a "劇場版 Fate/kaleid liner プリズマ☆イリヤ 雪下の誓い").
 *
 * Por eso aqui se guarda el id a mano, comprobado uno por uno con
 *
 *   node scripts/buscar-tvdb.mjs "Fate/stay night Heaven's Feel" --peliculas
 *
 * y la imagen se coge del fondo de la pelicula (1920x1080), que es lo
 * que se ve bien en una lista de capitulos. Si no tuviera fondo se usa
 * el poster.
 *
 * @type {Record<string, number>}
 */
export const PELICULA_TVDB = {
  // Heaven's Feel I, II y III.
  'fate-stay-night-heaven-s-feel-i-presage-flower': 8668,
  'fate-stay-night-heaven-s-feel-ii-lost-butterfly': 41,
  'fate-stay-night-heaven-s-feel-iii-spring-song': 5327,

  // Grand Order: First Order, Camelot (las dos) y Solomon.
  'fate-grand-order-first-order': 64203,
  'fate-grand-order-camelot-wandering-agateram': 134463,
  'fate-grand-order-camelot-paladin-agateram': 136396,
  'fate-grand-order-solomon': 175793,

  // El OVA de Prototype, que TVDB tambien tiene como pelicula.
  'fate-prototype': 105028,

  // Las dos de Prisma Illya.
  'fate-kaleid-liner-prisma-illya-sekka-no-chikai': 32293,
  'fate-kaleid-liner-prisma-illya-licht-namae-no-nai-shoujo': 199664,
};

/**
 * Titulos que TVDB escribe de otra forma.
 *    TITULO_TVDB[animeId][tituloDelCatalogo] = tituloEnTvdb
 *
 * ── POR QUE HACE FALTA ─────────────────────────────────────────────
 *
 * El emparejado se hace por titulo japones porque es el dato mas fiable,
 * pero no siempre los dos sitios escriben lo mismo. Las diferencias que
 * hay en Fate son de tres tipos:
 *
 *   · La misma frase en otro alfabeto. TVDB escribe "SEIHAI GRANDPRIX" y
 *     el catalogo "セイハイグランプリ", o "Kaleidoscope" y
 *     "カレイドスコープ". No es que falte el dato: es que la fuente
 *     tradujo el titulo y el fichero conservo el japones.
 *
 *   · Una palabra distinta para el mismo episodio. "十二の試煉" frente a
 *     "十二の試練", "観察者" frente a "監視者".
 *
 *   · Un trozo de mas o de menos. "魔眼蒐集列車1/6 旅立ちの汽笛と第一の
 *     殺人" frente a "魔眼蒐集列車1/6 汽笛と第一の殺人".
 *
 * ── POR QUE ES SEGURO ──────────────────────────────────────────────
 *
 * Cada pareja esta comprobada una por una mirando la temporada y el
 * numero: el episodio esta donde toca y solo cambia como se llama. No se
 * usa para saltarse la comprobacion de posicion, que sigue haciendo
 * `emparejar-capitulo.mjs`: el titulo traducido se busca en la misma
 * temporada y el mismo numero que antes.
 *
 * No se puede resolver con normalizacion porque no es ruido: son
 * palabras distintas. Por eso la lista es corta y explicita.
 *
 * @type {Record<string, Record<string, string>>}
 */
export const TITULO_TVDB = {
  'carnival-phantasm': {
    '働くセイバー': 'はたらくセイバー',
    'セイハイグランプリ': 'SEIHAI GRANDPRIX',
    'ファイナルデッドランサー': 'FINAL DEAD LANCER',
  },
  'fate-apocrypha': {
    '生の代償、死の償い': '生の代償、死の贖い',
    'アポクリファ': 'Apocrypha',
  },
  'fate-extra-last-encore': {
    '無限の残骸 -アンリミテッド / レイズ・デッド-':
      '無限の――― ―アンリミテッド／レイズ・デッド―',
  },
  'fate-grand-order-absolute-demonic-front-babylonia': {
    'グランドオーダー': 'Grand Order',
  },
  'fate-kaleid-liner-prisma-illya': {
    'カレイドスコープ': 'Kaleidoscope',
  },
  'fate-kaleid-liner-prisma-illya-2wei-herz': {
    'ブルーグラスムーン': 'Blue glass moon',
    '観察者': '監視者',
  },
  'fate-stay-night': {
    '十二の試煉': '十二の試練',
  },
  'fate-stay-night-unlimited-blade-works': {
    '理想の末路 [こたえ]': '理想の末路',
    'アンリミテッド・ブレイドワークス': 'Unlimited Blade Works.',
    'アンサー': 'answer',
  },
  'fate-zero': {
    'フェイト/ゼロ': '第二十五話「Fate/Zero」',
  },
  'lord-el-melloi-ii-sei-no-jikenbo-rail-zeppelin-grace-note': {
    '魔眼蒐集列車1/6 旅立ちの汽笛と第一の殺人': '魔眼蒐集列車1/6 汽笛と第一の殺人',
  },
  // One Piece: TVDB (81797) escribe quince titulos con otra puntuacion
  // (signos de ancho completo, "vs" en mayusculas o en minusculas, el
  // punto medio distinto) y con cuatro erratas claras: 非常 por 非情 en
  // el 27, 死闘 por 決闘 en el 29, 終り por 終わり en el 43 y el 48, y
  // あぁ por ああ en el 47. En el 55 se ha comido el primer kanji
  // (跡の生物 en vez de 奇跡の生物). Las fechas de los quince coinciden
  // con las del catalogo, asi que son el mismo capitulo.
  'one-piece': {
    'モーガンVSルフィ!謎の美少女は誰?': 'モーガンVSルフィ！謎の美少女は誰？？',
    '壮絶決闘!剣豪ゾロvs曲芸のカバジ!': '壮絶決闘！ 剣豪ゾロVS曲芸のカバジ！',
    '冷徹非情の鬼人·海賊艦隊総隊長ギン': '冷徹非常の鬼人・海賊艦隊総隊長ギン',
    '決闘の決着!腹にくくった1本の槍!': '死闘の決着！腹にくくった一本の槍！',
    '東の海最悪の男!魚人海賊アーロン!': '東の海最悪の男！魚人海賊アーロン',
    'ウソップ死す!?ルフィ上陸はまだ?': 'ウソップ死す?!ルフィ上陸はまだ？',
    'ルフィ立つ!裏切られた約束の結末': 'ルフィ立つ！裏切られた約束の結末！',
    'ルフィ大ピンチ!魚人VSルフィ海賊団': 'ルフィ大ピンチ！魚人vsルフィ海賊団',
    'ルフィ水没!ゾロVSタコのはっちゃん': 'ルフィ水没！ゾロvsタコのはっちゃん',
    '魚人帝国の終り!ナミは俺の仲間だ!': '魚人帝国の終わり！ナミは俺の仲間だ！',
    'お待ちかね!ああ復活のバギー船長': 'お待ちかね！あぁ復活のバギー船長！',
    '始まりと終わりの町·ローグタウン上陸': '始まりと終りの町・ローグタウン上陸',
    '奇跡の生物!アピスの秘密と伝説の島': '跡の生物！アピスの秘密と伝説の島',
    '廃虚の決闘!緊迫のゾロVSエリック': '廃墟の決闘！緊迫のゾロ対エリック！',
    '大空を舞うもの!甦る千年の伝説': '大空を舞うもの！蘇る千年の伝説！',
    // El 73 es el unico de la T2 y la T3 que TVDB escribe distinto: pone
    // ブロキー donde el catalogo pone ブロギー. Es el mismo capitulo (la
    // fecha y el numero coinciden), solo cambia una letra del nombre.
    'ブロギー勝利の号泣! エルバフの決着': 'ブロキー勝利の号泣！エルバフの決着',
    // La T4 y la T5 anaden dos diferencias mas, las dos erratas de TVDB:
    // pone una "の" de mas en el 96 y escribe スパイダース por スパイダーズ
    // en el 103. Las fechas y el orden coinciden, asi que son los mismos
    // capitulos.
    '緑の町エルマルとクンフージュゴン!': '緑の町のエルマルとクンフージュゴン！',
    'スパイダーズカフェに8時敵幹部集合': 'スパイダースカフェに8時敵幹部集合',
    // La T6 anade once diferencias mas. TVDB alarga los titulos del 158 y
    // el 165 con un signo de exclamacion que no esta en el original,
    // escribe 心網 por 心綱 en el 160, desarrolla la lectura ゴッド de 神
    // en el 167 y el 182, anade la lectura de 巨大豆蔓 en el 176, 191 y
    // 194, y el subtitulo del 168, y escribe 捨て身 por 捨身 en el 169 y
    // "vs" en minusculas en el 171. Las fechas y el orden coinciden.
    'ラブリー通りの罠!全能なる神エネル': 'ラブリー通りの罠！全能なる神エネル！',
    '生存率10%!心綱使いの神官サトリ!': '生存率10％！心網使いの神官サトリ！',
    '天空の黄金郷ジャヤ!目指せ神の社': '天空の黄金郷ジャヤ！目指せ神の社！',
    '神·エネル登場!!生き残りへの夜明曲': '神ゴッド・エネル登場！！生き残りへの夜明曲',
    '牙むく大蛇!遂に始まる生き残り合戦': '牙むく大蛇！遂に始まる生き残り合戦(サバイバルゲーム)',
    '捨身の排撃!!「戦鬼」ワイパーの覚悟': '捨て身の排撃リジェクト！「戦鬼」ワイパーの覚悟',
    '唸る燃焼砲!!ルフィVS戦鬼ワイパー': '唸る燃焼砲！！ルフィvs戦鬼ワイパー',
    '"巨大豆蔓"を登れ!!上層遺跡の死闘': '“巨大豆蔓”(ジィアントジャック)を登れ！！上層遺跡の死闘',
    '遂に激突!海賊ルフィVS神·エネル!!': '遂に激突！海賊ルフィVS神ゴッド・エネル！！',
    '巨大豆蔓を倒せ!脱出への最後の望み': '巨大豆蔓ジャイアントジャックを倒せ！脱出への最後の望み',
    '我ここに至る!歴史の本文が紡ぐもの': '我ここに至る！歴史の本文ポーネグリフが紡ぐもの',
    // La T8 y la T9 anaden veintidos mas. TVDB alarga con un signo de
    // exclamacion los titulos de la T8 (9) y de la T9 (23, 27, 35, 40,
    // 44, 47, 56, 59, 60 y 62), desarrolla lecturas (18, 10, 41, 46 y
    // 52), escribe en minusculas "vs" (7 y 71), "オレたち" por "オレ達"
    // (15), "五人のナミ" por "5人のナミ" (32), "餅真まき" por "餅まき"
    // (29), "TV局" por "ＴＶ局" (73) y pierde la "ル" del 2. Son las
    // mismas fechas y el mismo orden.
    '激震水の都!狙われたアイスバーグ': '激震水の都！狙われたアイスバーグ！',
    '麦わら海賊団全滅?モデル豹の脅威!': '麦わら海賊団全滅？モデル豹（レオパルド）の脅威！',
    'ルフィ快進撃! 司法の島で大決戦!!': 'フィ快進撃！司法の島で大決戦！！',
    'ロビンを返せ! ルフィvsブルーノ!': 'ロビンを返せ！ルフィVSブルーノ！',
    '全ては仲間を守る為に! ギア2発動!': '全ては仲間を守る為に！ギア２（セカンド）発動！',
    '生きたいと言え! オレ達は仲間だ!!': '生きたいと言え！オレたちは仲間だ！！',
    '悪魔の実の力! カクとジャブラ大変身!': '悪魔の実の力！カクとジャブラ大変身',
    '制御不能! チョッパー禁断のランブル': '制御不能！チョッパー禁断のランブル！',
    'お城で餅まき大レース! 赤い鼻の陰謀': 'お城で餅真まき大レース！赤い鼻の陰謀',
    '5人のナミ? 反撃は蜃気楼とともに!': '五人のナミ？反撃は蜃気楼とともに！',
    '灼熱の蹴り! サンジ足技のフルコース!': '灼熱の蹴り！サンジ足技のフルコース',
    '犯人はルフィ親分? 消えた大桜を追え!': '犯人はルフィ親分？消えた大桜を追え',
    '勝てなきゃ誰も守れない! ギア3始動': '勝てなきゃ誰も守れない！ギア3サード始動',
    '砲火に沈む島! フランキー無念の叫び!': '砲火に沈む島！フランキー無念の叫び',
    '拳に込めた想い! ルフィ渾身の銃乱打': '拳に込めた想い！ルフィ渾身の銃乱打(ガトリング)',
    '友, 海より来る! 麦わら一味最強の絆!': '友、海より来る！麦わら一味最強の絆',
    'その名は新世界! 偉大なる航路の行方!': 'その名は新世界！偉大なる航路グランドラインの行方',
    'サンジ衝撃! 謎の爺さんと激ウマ料理!': 'サンジ衝撃！謎の爺さんと激ウマ料理',
    'さらば愛しき子分達! フランキー発つ!': 'さらば愛しき子分達！フランキー発つ',
    '出港水の都! 男ウソップ決闘のケジメ!': '出港水の都！男ウソップ決闘のケジメ',
    '最凶の能力! エースを襲う黒ひげの闇!': '最凶の能力！エースを襲う黒ひげの闇',
    'アツアツ超決戦! ルフィvs灼熱のドン': 'アツアツ超決戦！ルフィVS灼熱のドン',
    '出動チョッパーマン！守れ渚のＴＶ局': '出動チョッパーマン！守れ渚のTV局',
    // La T10 y la T11 anaden catorce mas. TVDB desarrolla lecturas (8),
    // cambia palabras (9, 20, 22 y 25), escribe 現われた (10), mete なら
    // (20), 怒り (22) y と (44), se come una "さ" en el 22 de la T11 y
    // una "暴" en el 10, y alterna signos y espacios en el resto. Las
    // fechas y el orden coinciden.
    'ゾンビ歌の饗宴! 夜討ちの鐘は闇の音': 'ゾンビ歌（ソング）の饗宴！夜討ちの鐘は闇の音',
    '動物いっぱい? ペローナの不思議の庭': '動物いっぱい？ペローナの不思議な庭',
    '消える麦わら一味! 現れた謎の剣士!': '消える麦わら一味!　現われた謎の剣士！',
    'ウソップ最強? ネガティブは任せとけ': 'ウソップ最強？ネガティブなら任せとけ',
    '炎の騎士サンジ!! 蹴り潰せ偽りの挙式': '炎の騎士サンジ！！蹴り潰せ怒りの挙式',
    '屋根に舞う斬撃!! 決着ゾロVSリューマ': '屋根に舞う斬撃！決着ゾロVSリューマ',
    '敵はルフィ!! 最強ゾンビ対麦わらの一味': '敵はルフィ！！最強ゾンビ対麦わら一味',
    'ビンクスの酒 過去と現在をつなぐ唄': 'ビンクスの酒　過去と現在とをつなぐ唄',
    'お宝大争奪戦! 崩壊! スパアイランド号': 'お宝大争奪戦　崩壊！スパアイランド号',
    '魚人島を目指して上陸 シャボンディ諸島': '魚人島目指して上陸　シャボンディ諸島',
    '暴虐! シャボンディの支配者天竜人': '虐！シャボンディの支配者・天竜人',
    'さらなる強敵現る! 鉞かついだ戦桃丸': 'らなる強敵現る！鉞かついだ戦桃丸',
    '大将黄猿の猛攻 麦わら一味絶体絶命!': '大将黄猿の猛攻　麦わら一味絶体絶命',
    '時代劇特別編 ルフィ親分再び見参': '時代劇特別編　ルフィ親分ふたたび見参',
    // La T12 y la T13 anaden catorce mas. TVDB mete "たち" en los titulos
    // de los compañeros (2, 12, 13, 14 de la T12), escribe 忌わしき (8),
    // separa 毒人間・マゼラン (4), cambia "vs" por "VS" y ひげ por ヒゲ
    // (8 y 26 de la T13), alterna LV y signos (10, 17, 18, 21, 23 y 29) y
    // escribe 巨大な (35). Son las mismas fechas y el mismo orden.
    '急げ! 仲間のもとへ 女ヶ島の冒険': '急げ！仲間たちのもとへ　女ヶ島の冒険',
    'ハンコックの告白 姉妹の忌まわしき過去': 'ハンコックの告白　姉妹の忌わしき過去',
    '仲間達の行方 巨鳥の島と桃色の楽園!': '仲間たちの行方　巨鳥の島と桃色の楽園！',
    '仲間達の行方 島をつなぐ橋と食人植物': '仲間たちの行方　島をつなぐ橋と食人植物',
    '仲間達の行方 ネガティブ王女と悪魔王': '仲間たちの行方　ネガティブ王女と悪魔王',
    '監獄最強の男! 毒人間マゼラン登場': '監獄最強の男！毒人間・マゼラン登場',
    '映画連動特別編 決戦! ルフィVSラルゴ': '映画連動特別編 決戦！ルフィvsラルゴ',
    '牢番長サルデスの罠　LV.3飢餓地獄': '牢番長サルデスの罠 LV3・飢餓地獄',
    '地獄に楽園! インペルダウン LV5.5': '地獄に楽園 インペルダウンLV5.5',
    'ルフィ治療開始! イワさん奇跡の能力': 'ルフィ治療開始 イワさん奇跡の能力!!',
    'エース護送開始 最下層ＬＶ６の攻防!': 'エース護送開始 最下層LV6の攻防！',
    'さらなる混乱! 黒ひげ・ティーチ襲来!': 'さらなる混乱！黒ひげ・ティーチ襲来',
    '怒りのJETピストル　ルフィvs黒ヒゲ': '怒りのJETピストル ルフィVS黒ひげ',
    '脱獄チーム絶体絶命 禁じ手"毒の巨兵"': '脱獄チーム絶体絶命 禁じ手“毒の巨兵”',
    // La T14 y la T15 anaden diez mas: TVDB escribe 焼き尽す por 焼き尽くす
    // (463), 指令 por 命令 (474) y くま por クマ (469), cambia los signos
    // (465, 550 y 551) y alterna 蘇る y 甦る (539), 絶対絶命 y 絶体絶命
    // (559), 戦闘 y 激闘 (560) y ビッグマム y ビッグ・マム (571). Son las
    // mismas fechas y el mismo orden.
    'すべてを焼き尽くす!! 大将赤犬の能力!': 'すべてを焼き尽す!!大将赤犬の能力!',
    '勝者だけが正義 発動! センゴクの作戦': '勝者だけが正義 発動！センゴクの作戦！',
    'クマに起きた異変　イワさん怒りの一撃': 'くまに起きた異変 イワさん怒りの一撃',
    '処刑執行命令下る 包囲壁を突破せよ!': '処刑執行指令下る 包囲壁を突破せよ！',
    '蘇る因縁! ナミと魚人海賊団!': '甦る因縁！ナミと魚人海賊団！',
    'ホーディの異変! 凶薬の真の力': 'ホーディの異変 凶薬の真の力！',
    '決戦始まる ギョンコルド広場': '決戦始まる ギョンコルド広場！',
    '急げルフィ! しらほし絶対絶命': '急げルフィ！しらほし絶体絶命',
    '戦闘開始! ルフィVSホーディ!': '激闘開始！ルフィVSホーディ！',
    'お菓子好き! 四皇ビッグマム': 'お菓子好き！四皇ビッグ・マム',
    // La T16 y la T17 anaden treinta y cinco mas. Casi todas son la misma
    // frase con los signos de ancho completo, espacios distintos o el
    // parentesis de lectura (M(マスター), 灰熊銃(グリズリー・マグナム)).
    // Hay ademas cuatro erratas de TVDB: マンシュリー por マンシェリー
    // (693), 最後 por 最期 (706), 台地 por 大地 (718) y 荒狂う por
    // 荒れ狂う (746); y tres palabras cambiadas sin cambiar el sentido:
    // 子供たち por 子供達 (583), ルフィ、ロー脱出 por ルフィ・ロー大脱出
    // (603) y セニョール por セニュール (715). Las fechas y el orden
    // coinciden. El 590 es el crossover con Toriko y Dragon Ball, que
    // TVDB guarda en la temporada 0 con el titulo largo.
    '子供達を救え! 一味戦闘開始': '子供たちを救え！一味戦闘開始',
    '史上最強コラボVS海の大食漢': 'トリコ×ONE PIECE×ドラゴンボールZ 超コラボスペシャル!! 史上最強コラボVS海の大食漢',
    'Mを捉えろ 海賊同盟作戦開始!': 'M(マスター)を捉えろ 海賊同盟作戦開始',
    '炎切り裂く侍! 狐火の錦えもん!': '炎切り裂く侍！狐火の錦えもん',
    '反撃開始! ルフィ·ロー大脱出': '反撃開始！ルフィ、ロー脱出',
    'めざせR棟! 海賊同盟快進撃!': 'めざせR棟！海賊同盟快進撃',
    'たしぎの涙 G5決死の突破作戦': 'たしぎの涙 G-5決死の突破作戦',
    '闇の黒幕! ドフラミンゴ動く!': '闇の黒幕！ドフラミンゴ動く',
    '小さなドラゴン! モモの助現る': '小さなドラゴン！モモの助現る！',
    'シーザー撃破! 最強の灰熊銃': 'シーザー撃破！最強の灰熊銃(グリズリー・マグナム)！',
    '海賊貴公子 キャベンディッシュ': '海賊貴公子　キャべンディッシュ',
    '世紀の謀略 ドフラミンゴ動く': '世紀の謀略　ドフラミンゴ動く！',
    '決戦！ジョーラVS麦わらの一味': '決戦！ジョーラＶＳ麦わらの一味',
    '美剣! 白馬のキャベンディッシュ': '美剣！白馬のキャベンディッシュ！',
    '七武海対決！ ローVSドフラミンゴ': '七武海対決　ローVSドフラミンゴ',
    'SOP作戦開始　ウソランド突撃': 'ＳＯＰ作戦開始　ウソランド突撃',
    '動く城! 最高幹部ピーカ出現': '動く城!　最高幹部ピーカ出現！',
    '敵陣突破 ルフィ・ゾロ反撃開始!': '敵陣突破　ルフィ・ゾロ反撃開始',
    '小人の姫　囚われのマンシェリー': '小人の姫、囚われのマンシュリー',
    '涙の再会 レベッカとキュロス': '涙の再会　レベッカとキュロス！',
    '一撃必殺！ ドレスローザを救う男': '一撃必殺　ドレスローザを救う男',
    '時迫る オペオペの実を奪え！': '時迫る！オペオペの実を奪え！',
    '行けロー 優しき男最期の戦い！': '行けロー　優しき男　最後の戦い！',
    '愛の決戦 新棟梁サイVSベビー5': '愛の決戦　新棟梁サイＶＳベビー５',
    '男の意地 ベラミー最期の突撃!': '男の意地　ベラミー最後の突撃！',
    '疾風怒濤 ハクバVSデリンジャー': '疾風怒濤　ハクバＶＳデリンジャー',
    '男の決闘　セニュール愛の挽歌': '男の決闘　セニョール愛の挽歌',
    '雷の破壊剣！キュロス怒りの一撃！': '雷の破壊剣！　キュロス怒りの一撃',
    '大地横断 巨像ピーカ奇襲作戦!': '台地横断　巨像ピーカ奇襲作戦！',
    'ギア4！ 驚異のバウンドマン！': 'ギア４！驚異のバウンドマン！',
    'ルフィ！ 渾身の獅子バズーカ！': 'ルフィ！渾身の獅子バズーカ',
    '伝説誕生、革命戦士サボの冒険！': '伝説誕生 革命戦士サボの冒険！',
    '藤虎動く麦わら一味完全包囲網': '藤虎動く　麦わらの一味完全包囲網',
    '男の意地ルフィVS藤虎真向勝負!': '男の意地　ルフィVS藤虎真向勝負 2',
    '群雄割拠荒れ狂う新世界の怪物達': '群雄割拠　荒狂う新世界の怪物達',
  },
};

// Las claves y los valores se comparan ya limpios, para que una
// diferencia de espacios o de parentesis no deje la pareja sin efecto.
const TITULOS_LIMPIOS = new Map(
  Object.entries(TITULO_TVDB).map(([animeId, mapa]) => [
    animeId,
    new Map(Object.entries(mapa).map(([a, b]) => [limpiar(a), limpiar(b)])),
  ]),
);

/**
 * El titulo que TVDB usa para un capitulo, si esta en la lista.
 *
 * @param {string} animeId
 * @param {string | null | undefined} japones
 * @returns {string | null} ya limpio, o null si no hay traduccion
 */
export function tituloEnTvdb(animeId, japones) {
  const mapa = TITULOS_LIMPIOS.get(animeId);

  if (!mapa) return null;

  return mapa.get(limpiar(japones)) ?? null;
}

/**
 * La temporada de TVDB para una temporada del catalogo.
 *
 * @param {string} animeId
 * @param {number} temporada
 * @returns {number}
 */
export function temporadaEnTvdb(animeId, temporada) {
  return TEMPORADA_TVDB[animeId]?.[temporada] ?? temporada;
}