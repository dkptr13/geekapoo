// TEMPORADA 7 - The Final Chapters (2023, MAPPA)
//
// Formato de cada fila:
//   [numero, titulo, titulo japones, fecha, nota de IMDb, resumen]
//
// Son las E88 a E94 de la numeracion continua de Crunchyroll, y el
// final de la serie.
//
// ── POR QUE LOS SIETE VAN SIN NOTA ────────────────────────
//
// Es lo unico de estos datos que no es una copia literal de una
// fuente, y conviene decir por que.
//
// Los DOS ultimos capitulos de la serie se emitieron en Japon el 4 de
// marzo y el 5 de noviembre de 2023 como dos especiales de una hora y
// media cada uno, sin cortes publicitarios. IMDb los lista como DOS
// capitulos, con nota 9,5 y 9,0. Para el streaming se repartieron en
// SIETE capitulos de veinte minutos, que es como los ve casi todo el
// mundo, y es la version que Wikipedia documenta con los titulos que
// llevan aqui.
//
// Aqui estan los siete. Las dos notas de IMDb (9,5 y 9,0) se quedan
// escritas aqui en vez de repartirse entre los siete capitulos, porque
// poner 9,5 en los tres primeros y 9,0 en los cuatro ultimos seria
// inventar un dato: IMDb no los puntua por separado, solo el bloque.
//
// La lectura en crudo, con los titulos y las fechas, esta en
// `datos/_imdb-ataque-titanes.json`.
//
// ── LAS FECHAS ────────────────────────────────────────────
//
// Las de streaming, no las de emisión. Los tres primeros chapters
// seineron el 5 de noviembre de 2023, que es cuando se repartieron
// en capitulos; los cuatro ultimos, el 19 del mismo mes.
//
// La fecha de emisión de verdad de los dos ultimos (4 de marzo y 5
// de noviembre de 2023) esta en el comentario del meta del anime.

export const A7 = [
  [1, 'El Retumbar', '地鳴らし', '2023-11-05', 0,
   'Eren libera los millones de titanes encerrados en los muros y Marley tiene cuatro dias.'],
  [2, 'Las alas de la libertad', '自由の翼', '2023-11-05', 0,
   'La alianza embarca y Mikasa llega a Marley por el aire, con un plan que no explica a nadie.'],
  [3, 'En lo profundo de la desesperación', '絶望の淵にて', '2023-11-05', 0,
   'Armin se queda atrapado en la nuca de un titán y tiene que negociar desde dentro con Zeke.'],
  [4, 'La batalla del cielo y la tierra', '天と地の戦い', '2023-11-19', 0,
   'Reiner y Annie cruzan la línea para pelear contra Eren, y el campo de batalla cambia de forma.'],
  [5, 'Dedica tu corazón', '心臓を捧げよ', '2023-11-19', 0,
   'Los últimos que quedan se baten contra la horda, y Hange se niega a soltar su escopeta.'],
  [6, 'Un sueño largo', '長い夢', '2023-11-19', 0,
   'Eren le explica a Armin en los Caminos por qué lo hizo, y le pide que se lleve el recuerdo.'],
  [7, 'Hacia el árbol de esa colina', 'あの丘の木に向かって', '2023-11-19', 0,
   'Mikasa elige, y después lleva la cabeza de Eren a Shiganshina.'],
];
