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

/** @type {Record<string, Record<number, number>>} */
export const TEMPORADA_TVDB = {
  // La OVA de Toradora esta en el cajon de la temporada 0 de TVDB y es
  // la temporada 2 del catalogo.
  toradora: { 2: 0 },

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

  // La peli de KonoSuba va como T3 y TVDB la guarda en Specials
  // (S0E5). La T5 es la S3 de TVDB. Bakuen va aparte: es otra serie
  // en TVDB (420657) y sus miniaturas se ponen a mano.
  'konosuba': { 3: 0, 5: 3 },

  // El especial #0.8 de Burn the Witch va como T2 y TVDB lo guarda
  // en Specials (S0E1). La serie ONA coincide sola.
  'burn-the-witch': { 2: 0 },

  // La pelicula precuela Frozen Bond de Re:Zero va como T5 y TVDB
  // la guarda en Specials (S0E28). Las cuatro de television
  // coinciden solas. Memory Snow no necesita mapa: va como T1E26
  // y se empareja a mano por titulo.
  're-zero-comenzando-la-vida-en-otro-mundo': { 5: 0 },
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
  'ataque-a-los-titanes': {
    1: { temporada: 1, desde: 1 },
    2: { temporada: 2, desde: 1 },
    3: { temporada: 3, desde: 1 },
    4: { temporada: 3, desde: 13 },
    5: { temporada: 4, desde: 1 },
    6: { temporada: 4, desde: 17 },
    7: { temporada: 4, desde: 29 },
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
]);

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