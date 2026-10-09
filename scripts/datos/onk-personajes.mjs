// PERSONAJES - Oshi no Ko
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// `temporada`:
//
//   '1,2,3' = sale en esas temporadas. Un array de temporada NO es lo
//             mismo que uno vacio: ver `seasonIdsDe` en `seasonData.ts`.
//
// Con tres temporadas, el error tipico es dejar vacio un personaje que no
// sale en todas. Ichigo aparece en la 1 y en la 3 pero no en la 2: si se
// deja vacio aparece en Tokyo Blade, que es justo donde no sale.
//
// QUE HAY EN ESTA FICHA
//
// Veintiocho. No esta el reparto entero, sino los que tienen peso: los
// que cambian la trama y los que se verian raro que no estuvieran.
//
// DE DONDE VIENEN LOS KANJI Y LAS VOCES
//
// De la tabla de personajes de la wikipedia en ingles, que la saca de la
// pagina de casting de la propia serie. Los que no venian ahi se han
// buscado en la ficha de personajes en japones.
//
// El nombre va en el orden japones (apellido primero), que es como lo
// escribe la fuente: 星野アイ es "Hoshino Ai". Aqui se pone "Ai
// Hoshino", que es como lo escribe la ficha en ingles y como lo busca
// quien busca.
//
// ── AQUA Y GOROU SON LA MISMA PERSONA ─────────────────────
//
// Gorou Amamiya es el chico muerto que entra en el cuerpo de Aqua. Es el
// giro de la temporada 3 y el que sostiene toda la serie, pero es el mismo
// ser, asi que va en la ficha de Aqua y no duplicado. Es lo mismo que se
// hizo con Kaneki y Haise en Tokyo Ghoul: el wiki no debe enseñar dos
// caras para un solo cuerpo.

export const PERSONAJES = [
  ['Ai Hoshino', '1,2,3', 'main', '星野アイ', 'Rie Takahashi',
   'La idol madre de los gemelos. En publico era la mujer mas feliz del pais y en privado llevaba dos anos asumiendo que se estaba muriendo. Nunca se lo dijo a nadie, ni a sus hijos. Es el personaje que toda la serie va buscando.'],

  ['Aqua Hoshino', '1,2,3', 'main', '星野愛久愛海', 'Takeo Ōtsuka',
   'El hermano gemelo. Es el fan que va a buscar a quien mato a su madre y lleva tres temporadas haciendolo en silencio, mintiendole a todo el mundo para proteger a Ruby. Al final del arco se descubre que es Gorou Amamiya, el medico que la cuidaba.'],

  ['Ruby Hoshino', '1,2,3', 'main', '星野瑠美衣', 'Yurie Igoma',
     'La hermana gemela. Quiere ser idol igual que su madre, y no por la carrera sino porque es la unica forma que ve de estar donde ella estaba. Es tan manipuladora como su hermano, pero por el otro motivo: el suyo es el de proteger.'],

  ['Kana Arima', '1,2,3', 'main', '有馬かな', 'Megumi Han',
     'La actriz que hizo de Ai en el drama y la unica de todo el grupo que se atreve a decir en voz alta lo que las demas solo piensan. Empieza odiando a Ruby y termina siendo su unica aliada de verdad.'],

  ['Akane Kurokawa', '1,2,3', 'main', '黒川あかね', 'Manaka Iwami',
   'La personalidad canonica de B-Komachi, que hoy es la actriz que hace de la hermana de Ai. Todo el mundo la toma por una tonta hasta el capitulo 6, cuando se ve que lleva doce anos cargando con la misma tragedia que el resto.'],

  ['Mem-cho', '1,2,3', 'supporting', 'MEMちょ', 'Rumi Okubo',
     'La que va con las relaciones publicas y dice lo que nadie mas dice delante de la camara. Es la unica que ve venir la mania y aun asi sigue ahi, y por eso termina siendo la voz de Ruby.'],

  ['Ichigo Saitō', '1,2,3', 'supporting', '斎藤壱護', 'Hisao Egawa',
   'El amigo de la escuela de Ruby, que salio corriendo de su fansim cuando se le fue de las manos con la idol. Doce anos desaparece, y cuando Ruby lo encuentra resulta que tambien estaba buscando al asesino.'],

  ['Miyako Saitō', '1,2,3', 'supporting', '斎藤ミヤコ', 'Lynn',
   'La madre de Ichigo, la que le dijo a Ruby en el peor momento que su hijo se fue porque un fan la estaba acosando. Es la adulta que hace bien su trabajo y a quien nadie hizo caso. Reaparece al final de la tercera temporada.'],

  ['Pieyon', '1,2,3', 'supporting', 'ぴえヨン', 'Taishi Murata',
     'El manager de Ruby. El menos cualificado del grupo y el que mas aguanta: se equivoca en todo lo tecnico y es el que esta ahi cuando todo se complica. Es el que hace de comic relief de la serie.'],

  ['Taishi Gotanda', '1,2,3', 'antagonist', '五反田泰志', 'Yasuyuki Kase',
   'El productor que dejo a Ai en la calle para que no le arruinara la carrera. Lleva tres temporadas siendo el hombre prudente que solo quiere que nadie hable de lo que paso. Es el antagonista mas humano de la serie.'],


  ['Taiki Himekawa', '1,2,3', 'antagonist', '姫川大輝', 'Koki Uchiyama',
     'El hombre que dirigio la gira a la que Ruby se apunta sin saberlo y que lleva el proceso de Tokyo Blade por intereses propios. Es la pieza burocratica de la temporada 2: legal, educado y sin escrupulos.'],

  ['Sakuya Kamoshida', '1,2,3', 'supporting', '鴨志田朔夜', 'Yūsuke Kobayashi',
   'El que dirige Tokyo Blade en la practica. Tiene una reputacion intachable y un ego de estrella de cine, y es el primero que entiende que Ruby puede llegar a donde el quiere.'],

  ['Toshirou Kindaichi', '2,3', 'supporting', '金田一敏郎', 'Takahiro Sakurai',
   'El director de Tokyo Blade. El unico del sector que no manipula a nadie: exige que se repitan las tomas porque puede, no porque le convenga. Es la razon por la que la pelicula se queda bien.'],

  ['Masanori Shima', '3', 'antagonist', '島正則', 'Takashi Ōno',
     'El productor rival que lleva la competencia y no sabe de donde salio el material que le esta quitando. Es la amenaza directa de la segunda temporada y la que mueve la trama por fuera.'],

  ['Yoriko Kichijouji', '1,2', 'supporting', '吉祥寺頼子', 'Shizuka Itō',
   'La directora de la agencia que representa a Ruby. Es practicamente la unica persona en toda la serie que trabaja para ella sin tener un motivo propio, y esa es tambien su tragedia.'],

  ['Abiko Samejima', '1,2,3', 'supporting', '鮫島アビ子', 'Ayane Sakura',
   'La que lleva las cuentas en la produccion. Tiene la mania de que el presupuesto manda, pero cuando Ruby propone lo de interpretarse a su madre es la primera que dice que sale caro y la primera que lo aprueba.'],

  ['GOA', '1,2', 'supporting', 'GOA', 'Daisuke Ono',
   'El marca del sello discografico que Ruby firma en la segunda temporada. No es un personaje humano y aun asi se le trata como si lo fuera: lleva el peso del contrato en casi todos los capitulos.'],

  ['Sumiaki Raida', '1,2', 'antagonist', '雷田澄彰', 'Kenichi Suzumura',
     'El ejecutivo de la agencia de la competencia, el que lleva la guerra desde el despacho. Es el antagonista corporativo de la temporada 2: no hace nada ilegal, simplemente hace mas ruido y mejor.'],

  ['Hikaru Kamiki', '2,3', 'antagonist', '神木輝', 'Mamoru Miyano',
     'El hombre del que nadie habia oido hablar y que aparece en la tercera temporada para tener el control de lo que viene. Es el villano mas discreto de la serie.'],

  ['Minami Kotobuki', '1,2,3', 'supporting', '寿みなみ', 'Hina Yōmiya',
     'La fan numero uno de Ruby en el colegio, la que crecio con ella viéndola en la television. Es la fan de verdad, la que quiere a Ruby por Ruby y no por la industria.'],

  ['Yuki Sumi', '1,2,3', 'supporting', '鷲見ゆき', 'Saori Ōnishi',
     'La fan que organizo la campana contra Ai en el colegio. No es mala persona: es la que mas sufria con la presion de la idol y la que acabo tomando el camino equivocado.'],

  ['Nobuyuki Kumano', '1,2,3', 'supporting', '熊野ノブユキ', 'Tomohiro Ohno',
     'El que monto la campana en el colegio para que se acabara el fenomeno Ai. Es el que mas se acerca a Ruby en la primera temporada y el que se lleva el peor final.'],

  ['Kengo Morimoto', '1,2,3', 'supporting', '森本ケンゴ', 'Taito Ban',
   'El compañero de clase que organizaba la cacería de brujas sin saber lo que estaba haciendo. Sale poco y por eso se le reconoce: es de los que hacen cosas que no entienden.'],

  ['Matsuri Narushima', '1,2,3', 'supporting', '鳴嶋メルト', 'Seiji Maeda',
   'El chico que sale con Ai en el show de television del primer capitulo, cuando la idol todavia no sabe que se esta muriendo. Es la prueba de que ella lo perdio todo el dia que se lo dijeron.'],

  ['Frill Shiranui', '1,2,3', 'supporting', '不知火フリル', 'Asami Seto',
     'La fan de Ruby en la escuela que cambio de postura en cuanto la idol dejo de ir. Es la advertencia de la serie sobre el fanatismo cuando hay premio de por medio.'],

  ['Ryūnosuke Sugano', '1,2', 'supporting', '菅野良介', 'Atsushi Tamaru',
     'El provocador. El que se pasa de la raya en el show de Ai y el que deja en manos de Ruby el telefono con lo de la muerte de su madre. Es el hilo suelto mas importante de la primera temporada.'],

  ['Miyu', '2,3', 'supporting', 'ミユ', 'Kana Hanazawa',
   'La administradora de B-Komachi que se ocupa de que todo el mundo mantenga la fachada. Es quien decide que se dice en los entrevistas y que se calla, y por eso es la primera en caer cuando algo se sale de su control.'],

  ['Tsukuyomi', '3', 'supporting', 'つくよみ', 'Hina Kino',
   'La chica de pelo blanco que aparece al final de la segunda temporada y trae toda la informacion del final. Nadie de la serie la conoce y es quien tiene la razon del giro final.'],
];
