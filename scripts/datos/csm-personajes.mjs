// PERSONAJES - Chainsaw Man
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// El campo de temporadas va vacio cuando el personaje sale en toda la
// serie, y con numeros separados por comas cuando no: "2" es el de la
// pelicula del arco Reze, y "1,2" es el que sale en las dos partes.
//
// ── DE DONDE SALEN LOS DATOS ──────────────────────────────────
//
// Nombre, nombre japones, voz e imagen vienen de AniList, y se
// comprobaron uno a uno contra la ficha de cada medio. Los titulos de
// los capitulos de la T1 se han contrastado con TVDB ademas, porque el
// emparejador de miniaturas empareja por ahi y no por el numero.
//
// Este fichero se genera con `generar-personajes.mjs`, que junta los
// lotes de `lotes/csm/`. Los lotes estan porque escribir un fichero de
// cuarenta descripciones de una vez las destrubre.
//
// ── LA REPARTO QUE SE HA PUESTO ─────────────────────────────────
//
// AniList devuelve 94 personajes para Chainsaw Man, entre las dos
// partes. 53 son de fondo y no se guardan: los policias de nombre "A",
// "B" y "C", los prisioneros de una celda, una fila entera del ejercito
// de zombis y las figurantes de la mafia.
//
// De los 41 que quedan se guardan 37. Cuatro quedan fuera y por que:
//
//   · Fushi (伏). Es el Diablo del Futuro ya transformado, el mismo
//     que figura tambien como Mirai no Akuma (未来の悪魔). Ponerlo dos
//     veces haria que el buscador devolviera al mismo demonio.
//
//   · Yakuza (ヤクザ). No es una persona: es un cargo. Los que matan a
//     Denji en el capitulo 1 son tres mafiosos distintos que ni
//     siquiera tienen nombre.
//
//   · Nyaako (ニャーコ) y Namako no Akuma (ナマコの悪魔). No tienen voz
//     en AniList y el validador no deja guardar a un personaje sin ella.
//     Antes que inventar un nombre, se quedan fuera. Volveran cuando
//     haya una fuente.
//
// ── LOS NOMBRES ────────────────────────────────────────────────
//
// Se dejan como los escribe la licencia, que es como los conoce todo
// el mundo: no hay traduccion posible para "Power" ni para "Reze" sin
// inventar un nombre que nadie usa. Los demonios van con el japones
// porque en espanol no tienen traduccion oficial, y "el diablo eterno"
// se entiende peor que "Eien no Akuma".
//
// ── UNA COSA DE LA TEMPORADA DE REZE ───────────────────────────
//
// AniList da a Reze como de la serie de television y de la pelicula.
// No sale en ninguno de los doce capitulos: el arco empieza en el
// capitulo 39 del manga y la serie adaptations hasta el 38. Por eso va
// solo en la temporada 2. Lo mismo con Nomo y con los demas que solo
// aparecen en el cine.
export const PERSONAJES = [
  ["Denji", "1,2", "main", "デンジ", "Kikunosuke Toya",
   "El chico que se suicida al rellenar mal un formulario de la policia y acaba cazando demonios para la mafia. No tiene poderes propios: lo que tiene es un demonio con una motosierra en la cabeza que respeta lo que el le pidio. Lo que quiere de la vida es tan pequeno que da pena decirlo, y por eso choca contra todos los que estan alrededor."],

  ["Power", "1,2", "main", "パワー", "Fairouz Ai",
   "Demonio de sangre que aparece en un callejon de Tokio y se vende como miembro de la cuarta division porque es donde se come mejor. Habla sin filtro, se burla de todo el mundo y guarda rencor con una memoria que no se borra."],

  ["Makima", "1,2", "main", "マキマ", "Tomori Kusunoki",
   "Supervisora de la cuarta division y la razon por la que Denji existe como cazador. Dice siempre la verdad y por eso todos le creen, y esa es justo la trampa: lo que promete es lo que va a hacer."],

  ["Aki Hayakawa", "1,2", "main", "早川アキ", "Shougo Sakata",
   "Demonio del futuro con un capote de siempre que hace su trabajo porque no sabe hacer otra cosa. Le ofrece su cabeza a otro demonio a cambio de no tener que matar. Es el unico de los tres que ve venir el final y no hay manera de avisar."],

  ["Reze", "2", "main", "レゼ", "Reina Ueda",
   "Trabajadora de un cafe y el secreto mejor guardado de la pelicula: es el Diablo de la Bomba y la enviaron a Japon para casarse con Chainsaw Man. Sabe lo que va a pasar y lo acepta, porque es la unica forma de salvar a Denji."],

  ["Kishibe", "1,2", "supporting", "岸辺", "Kenjirou Tsuda",
   "El hombre que enseño a los tres a usar un demonio contra otro demonio. Esta jubilado y entrena a Denji y a Power porque no le queda otra: ha visto lo que viene y sabe que la cuarta division no llega entera a Kioto."],

  ["Himeno", "1", "supporting", "姫野", "Mariya Ise",
   "Demonio de fantasma con siete años de antiguedad en la cuarta division y ninguno de ganas de seguir ahi. Se burla de Denji desde el primer dia y le dice lo que nadie mas le dice, y su muerte en el capitulo 10 es lo que separa a los tres para siempre."],

  ["Kobeni Higashiyama", "1,2", "supporting", "東山コベニ", "Karin Takahashi",
   "Oficial de la cuarta division que tiene el record de bajas mas alto del grupo y el caracter mas frio de todos. Sobrevive al capitolo 6 y a la pelicula, lo cual la convierte en uno de los pocos personajes que salen bien parado de casi todo."],

  ["Michiko Tendou", "1", "supporting", "天童ミチコ", "Hitomi Ueda",
   "La sunburnada de la oficina, la que no se calla nunca y la que repite que hay que jubilarse. Esta debajo de Masaki Andou desde mucho antes de entrar, y el secreto es lo que casi le cuesta el puesto."],

  ["Yuutarou Kurose", "1", "supporting", "黒瀬ユウタロウ", "Kengo Kawanishi",
   "Director del instituto donde Denji iba a clase antes de que lo echaran. Lo que quiere de verdad es una vida normalita con su familia, y cuando se lo piden no sabe decir ni que si ni que no."],

  ["Akane Sawatari", "1", "supporting", "沢渡アカネ", "You Taichi",
   "Companera de clase de Denji que escribia novelas en un cuaderno con sus amigos de clase. Uno de ellos es el Espadachin, y ella es la unica que llega a saber que es el. Lo que hace en el capitolo 12 le cambia la vida y no hay consolacion."],

  ["Hirokazu Arai", "1", "supporting", "荒井ヒロカズ", "Taku Yashiro",
   "Companero de clase de Denji y el que le puso en el formulario de la policia la palabra Chainsaw Man, sin saber lo que estaba escribiendo. No se da cuenta de lo que ha hecho hasta que ve el capitolo 12, y para entonces ya no hay nada que hacer."],

  ["Madoka", "1", "supporting", "円", "Tadashi Mutou",
   "Supervisora de la cuarta division y la que mas cerca estuvo de jubilarse. Todo el mundo le habla como si ya no estuviera, y manda a Denji, Aki y Power a Kioto sin avisarles de lo que hay ahi."],

  ["Pochita", "1,2", "supporting", "ポチタ", "Shiori Izawa",
   "El perro con una motosierra en la cabeza, un demonio que fue el monton de chamullos de un samurai. Le devuelve la vida a Denji muerto y a partir de ahi va siempre dentro de la chaqueta del chico, hablando en una voz que no se calla. Es la razon de que la historia siga existiendo."],

  ["Prinz", "1", "supporting", "プリンシ", "Saori Gotou",
   "El Diablo de la Arana, el primero que le cierra la boca al grupo entero. Un tercio de su poder se lo lleva Aki para poder pelear con mas fuerza y antes de tiempo, y por eso el final del capitulo 11 existe."],

  ["Beam", "1,2", "supporting", "ビーム", "Natsuki Hanae",
   "Demonio que se ofrece a morir por Chainsaw Man y sabe que por eso los demas lo quieren muerto. Sale del capitolo 11 hurtando un coche de policia para llorar a un hombre, y esa es toda la razon por la que ese capitolo existe."],

  ["Tenshi no Akuma", "1,2", "supporting", "天使の悪魔", "Maaya Uchida",
   "El Diablo Angel, el que tiene alas y no puede tocar el suelo. Se lleva a Denji de la oficina y obliga a los otros dos a perseguirlo por el bosque. No lo quiere muerto todavia: quiere algo peor, y de ahi viene el plan de Aki en el capitolo 8."],

  ["Bouryoku no Majin", "1,2", "supporting", "暴力の魔人", "Yuyuya Uchida",
   "El Diablo de la Memoria, un demonio que se come lo que uno piensa para que deje de molestarlo. Entra en el piso de la cuarta division por el espejo del bano en el capitolo 8, y lo que le hace a Power es lo que ese capitolo es."],

  ["Eien no Akuma", "1", "antagonist", "永遠の悪魔", "Hironori Kondou",
   "El Diablo Eterno: un demonio sin boca que hace lo que le dicen los humanos que le chanchan al oido. Es enorme, no distingue el bien del mal y sale en el capitolo 9, cuando ya no queda nadie en la oficina que pueda con el."],

  ["Samurai Sword", "1", "antagonist", "サムライソード", "Daiki Hamano",
   "El Espadachin, demonio con espada que se come a media ciudad de Kioto y deja a las victimas fusionadas en un solo cuerpo de muchos ojos. Es el antagonista del capitolo 12 y el ultimo enemigo de la temporada de television."],

  ["Noroi no Akuma", "1", "antagonist", "呪いの悪魔", "Yuko Ueda",
   "El Diablo de la Maldicion, el que no pega sino que manda: va de persona en persona y les quita la capacidad de mentir. Le hace la pregunta a Power en el capitolo 10, y por eso ese capitolo acaba como acaba."],

  ["Koumori no Akuma", "1", "antagonist", "コウモリの悪魔", "Kenichirou Matsuda",
   "El Diablo del Murcielago: un demonio sin rostro, con garras, que aparece en el tunel de un bar del campo donde esta Power en el capitolo 4. Es la primera vez que ella se encuentra con algo mas fuerte que ella."],

  ["Hiru no Akuma", "1", "antagonist", "ヒルの悪魔", "Uko Tachibana",
   "El Diablo Sanguijuela, el que se le mete a Denji por dentro en el capitolo 6 y le enseña lo que la gente piensa de el. Lo que le hace no lo cura: le deja las mismas ganas de morir que tenia antes."],

  ["Zombie no Akuma", "1", "antagonist", "ゾンビの悪魔", "Kouki Miyata",
   "El Diablo Zombi, el que tiene la boca llena de dientes y no habla con nadie. Sale en la parte final del capitolo 11 y es lo que obliga a Power a pelear de verdad, que es lo unico que ella queria de esa pelea."],

  ["Tomato no Akuma", "1", "antagonist", "トマトの悪魔", "Hinata Tadokoro",
   "El Diablo Tomate, uno de los mas debiles y el primero que se come en el capitolo 6. Es el que le da a Power su primera muerte de demonio dentro del hotel, y ella no lo cuenta porque le da verguenza."],

  ["Taiyou", "1", "antagonist", "タイヨウ", "Mana Nakatomi",
   "El Diablo Solar, el mas poderoso de los que salen en la primera temporada. Un demonio al que le han puesto el nombre de un dios del clima y por eso da miedo: es el que obliga a Aki a ofrecer su vida durante meses."],

  ["Mirai no Akuma", "1", "antagonist", "未来の悪魔", "Hiroki",
   "El Diablo del Futuro, un demonio con dos cabezas a las que ya les queda un dia de vida. Aki le ofrece una parte de la suya para usar su poder y asi pelear antes de tiempo, y por eso llega vivo a Kioto."],

  ["Yuurei no Akuma", "1", "antagonist", "幽霊の悪魔", "Hiroko Kiso",
   "El Diablo Fantasma, el que se acopla a los muertos y se adueña de ellos en el capitolo 10. Asi explica que la tercera tanda de la cuarta division no llegue nunca a Kioto."],

  ["Kitsune no Akuma", "1,2", "supporting", "狐の悪魔", "Yuko Kaida",
   "El Diablo Zorro, el mas antiguo de los que quedan vivos en la serie. Vive en su cueva con el pelo hecho un nudo de mil años, y cuando aparece en la pelicula es un aviso de que el mundo de la historia se acaba a marchar."],

  ["Nomo", "2", "supporting", "野茂", "Kenji Akabane",
   "La chica del cafe donde conoce a Reze y la unica persona de la pelicula que sabe que todos mienten. Se corta el pelo, se lo deja rapido y se queda quieta en un sitio hasta que ya no puede volver a el."],

  ["Katou", "2", "supporting", "加藤", "Kento Shiraishi",
   "Novio de Nomo y uno de los que no sabe que ella no es del todo lo que parece. Es simpatico, y por eso mismo es el que se queda en la cena cuando ya no deberia quedarse nadie."],

  ["Tanabe", "2", "supporting", "田辺", "Taro Kiuchi",
   "El que manda en la cena del bar y sabe que Nomo no es normal y lo deja estar. Sale poco, y por eso se le recuerda mucho despues: es de los pocos a los que el anime vuelve a nombrar."],

  ["Masaki Andou", "2", "supporting", "安藤マサキ", "Akihiro Mine",
   "El supervisor de la cena del bar, el que se fue de la cuarta division y ahora lleva las cuentas de un sitio de comida. Se le reconoce por el modo de andar que tiene."],

  ["Taifuu no Akuma", "2", "antagonist", "台風の悪魔", "Eri Kitamura",
   "El Diablo del Tifon, el ultimo demonio grande que sale antes de que se disuelva todo. Es el que justifica que la pelicula termine de otra forma que no sea con una pelea: la pelicula termina con agua."],

  ["Nazo no Otoko", "2", "supporting", "謎の男", "Kenji Nomura",
   "El hombre misterioso de la retirada, el que aparece cuando toca el Diablo del Tifon. Nadie sabe su nombre y por eso nadie pregunta, y es el hilo de dos mensajes distintos que el anime deja sueltos."],

  ["Fuku Taichou", "2", "supporting", "副隊長", "Hidenori Takahashi",
   "El capitan de la pelicula, el que reparte turnos en una cena de demonios. Sale poco y trabaja mas de lo que aparece, que es como se le reconoce."],

  ["Futamichi no Master", "2", "supporting", "二道のマスター", "Kenichi Ono",
   "El maestro de la segunda via, el que sabe de demonios por encima y vive en una casa que no tiene puerta. Sale en una escena de fondo y por eso es el unico que sabe lo que pasara despues."],
];
