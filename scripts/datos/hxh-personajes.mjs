// PERSONAJES - Hunter x Hunter (2011)
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Nombres, nombres japoneses y voces salen de AniList (11061 para la
// serie y 13271/19951 para las dos peliculas). Los resumenes son
// propios, en castellano.
//
// La serie va entera en la T1. Las peliculas son la T2 (Phantom Rouge)
// y la T3 (La última misión). Gon, Killua, Kurapika, Leorio y Hisoka
// aparecen en las tres; Netero sale en la serie y en la segunda peli.
// El resto se queda en la T1 para no inventar apariciones.

export const PERSONAJES = [
  ["Gon Freecss", "1,2,3", "main", "ゴン＝フリークス", "Megumi Han",
   "Chico de doce años que vive en la Isla Ballena y descubre que su padre, Ging, sigue vivo. Es optimista hasta lo imprudente, terco y capaz de hacerse amigo de casi cualquiera. Su Nen de refuerzo convierte una piedra en un proyectil y su olfato en un radar."],

  ["Killua Zoldyck", "1,2,3", "main", "キルア=ゾルディック", "Mariya Ise",
   "Heredero de la familia de asesinos Zoldyck, criado entre venenos y electrocuciones. Huye de casa para vivir como un niño normal y se convierte en el mejor amigo de Gon. Es rápido, sarcástico y capaz de desconectar emocionalmente cuando la situación lo exige."],

  ["Kurapika", "1,2,3", "main", "クラピカ", "Miyuki Sawashiro",
   "Último superviviente del clan Kurta, masacrado por la Brigada Fantasma para robar sus ojos escarlata. Se hace Cazador para recuperarlos y vengarse. Sus cadenas de Nen tienen reglas tan estrictas que solo funcionan contra los miembros de la banda."],

  ["Leorio Paradinight", "1,2,3", "main", "レオリオ・パラディナイト", "Keiji Fujiwara",
   "Estudiante de medicina que se presenta al Examen de Cazador para pagarse la carrera. Parece un buscavidas gritón, pero es el primero que se preocupa por los demás. Su Nen le permite mover el aura a distancia y golpear con una fuerza sorprendente."],

  ["Hisoka Morow", "1,2,3", "main", "ヒソカ・モロウ", "Daisuke Namikawa",
   "Mago, asesino y el personaje más imprevisible de la serie. Solo vive para encontrar rivales que merezcan la pena, y Gon es su juguete favorito. Su Nen, Bungee Gum, convierte el aura en un chicle elástico que pega y estira lo que toca."],

  ["Ging Freecss", "1", "supporting", "ジン・フリークス", "Rikiya Koyama",
   "Padre de Gon y uno de los Cazadores más legendarios. Abandonó a su hijo para perseguir sus propios intereses y ni siquiera se molesta en disimularlo. Es un genio de la arqueología y del Nen, y su forma de ser explica buena parte de la personalidad de Gon."],

  ["Illumi Zoldyck", "1", "antagonist", "イルミ＝ゾルディック", "Masaya Matsukaze",
   "Hermano mayor de Killua y asesino profesional. Le implantó agujas en el cerebro para controlarlo y no duda en usarlas contra cualquiera. Su mirada vacía y su calma absoluta lo convierten en uno de los personajes más inquietantes de la familia."],

  ["Chrollo Lucilfer", "1,2", "antagonist", "クロロ・ルシルフル", "Mamoru Miyano",
   "Líder de la Brigada Fantasma y el hombre que ordenó la masacre del clan Kurta. Roba las habilidades de Nen de sus víctimas y las guarda en un libro. Es culto, tranquilo y completamente incapaz de sentir culpa por lo que ha hecho."],

  ["Uvogin", "1,2", "antagonist", "ウボォーギン", "Akio Ootsuka",
   "Miembro de la Brigada Fantasma especializado en refuerzo. Puede partir rocas con las manos y resistir balas sin inmutarse. Es leal a sus compañeros y disfruta de la pelea, pero se confía cuando cree que nadie puede hacerle daño."],

  ["Pakunoda", "1,2", "supporting", "パクノダ", "Romi Park",
   "Miembro de la Brigada Fantasma capaz de leer recuerdos al tocar a una persona. Es seria, directa y una de las pocas que intenta mantener la cabeza fría dentro de la banda. Su lealtad a Chrollo termina costándole muy caro."],

  ["Machi Komacine", "1,2", "supporting", "マチ゠コマチネ", "Rena Maeda",
   "Miembro de la Brigada Fantasma que usa hilos de Nen para coser heridas y cortar cabezas. Tiene un carácter seco y no soporta a Hisoka, aunque trabaja con él cuando conviene. Es una de las luchadoras más precisas de la banda."],

  ["Nobunaga Hazama", "1,2", "supporting", "ノブナガ＝ハザマ", "Naoya Uchida",
   "Espadachín de la Brigada Fantasma. Se emociona con facilidad y adopta a Gon como si fuera un hermano pequeño, lo que provoca más de un problema dentro del grupo. Su técnica de espada es rápida y letal en espacios cerrados."],

  ["Shizuku Murasaki", "1,2", "supporting", "シズク", "Miho Arakawa",
   "Miembro de la Brigada Fantasma que olvida todo lo que no le interesa. Su aspiradora de Nen, Blinky, borra la sangre y los rastros de sus víctimas. Es tranquila, eficaz y no muestra ninguna empatía por los humanos normales."],

  ["Feitan Portor", "1,2", "antagonist", "フェイタン", "Kappei Yamaguchi",
   "Miembro de la Brigada Fantasma especializado en tortura y velocidad. Habla poco y sonríe todavía menos. Su Nen, Rising Sun, convierte el dolor que recibe en un sol capaz de incinerar todo lo que lo rodea."],

  ["Kite", "1", "supporting", "カイト", "Shuuichi Ikeda",
   "Cazador y antiguo aprendiz de Ging. Es el primero que le habla a Gon del padre que nunca conoció y le enseña que un Cazador debe saber cuándo retirarse. Su Nen, Crazy Slots, elige un arma al azar y le obliga a usarla."],

  ["Isaac Netero", "1,3", "supporting", "アイザック・ネテロ", "Ichirou Nagai",
   "Presidente de la Asociación de Cazadores y el hombre más fuerte del mundo durante décadas. Detrás de su sonrisa de abuelo hay una voluntad de acero y una técnica de Nen que ha perfeccionado durante más de cincuenta años. Su pelea con Meruem es el corazón del arco final."],

  ["Biscuit Krueger", "1", "supporting", "ビスケット＝クルーガー", "Chisa Yokoyama",
   "Cazadora de dos estrellas y maestra de Nen que parece una niña pequeña. En realidad tiene más de cincuenta años y una fuerza monstruosa. Entrena a Gon y Killua en Greed Island y les enseña que el combate también es cuestión de cabeza."],

  ["Wing", "1", "supporting", "ウイング", "Toshihiko Seki",
   "Maestro de Nen que regenta una pequeña escuela en la Torre del Cielo. Es paciente, prudente y sabe cuándo detener a sus alumnos antes de que se hagan daño. Enseña a Gon y Killua los cuatro principios básicos del Nen."],

  ["Zushi", "1", "supporting", "ズシ", "Yuka Terasaki",
   "Niño que entrena en la Torre del Cielo y se convierte en compañero de Gon y Killua. Es humilde, trabajador y mucho más maduro de lo que aparenta. Su sueño es llegar a ser un gran luchador sin dejar de respetar a sus rivales."],

  ["Meruem", "1", "antagonist", "メルエム", "Kouki Uchiyama",
   "Rey de las hormigas quimera, nacido para gobernar y devorar a la humanidad. Su encuentro con Komugi le obliga a cuestionarse qué significa ser fuerte y qué valor tiene una vida. Es el antagonista más complejo de la serie y el centro del arco final."],

  ["Neferpitou", "1", "antagonist", "ネフェルピトウ", "Ayumi Fujimura",
   "Guardia Real de Meruem, con aspecto felino y una curiosidad cruel. Puede controlar a otros con hilos de Nen y detectar a cualquiera dentro de un radio enorme. Su pelea con Gon es uno de los momentos más duros de la serie."],

  ["Shaiapouf", "1", "antagonist", "シャウアプフ", "Wataru Hatano",
   "Guardia Real de Meruem y el más intelectual de los tres. Puede dividirse en clones y manipular a las personas con escamas de Nen. Está convencido de que el rey debe ser perfecto y hace todo lo posible por eliminar cualquier influencia humana."],

  ["Menthuthuyoupi", "1", "antagonist", "モントゥトゥユピー", "Fumihiko Tachiki",
   "El más joven de los Guardias Reales, enorme y con un temperamento explosivo. Puede transformar su cuerpo y liberar explosiones de aura devastadoras. Su arco lo lleva de la rabia ciega a entender, por primera vez, el valor de la lealtad."],

  ["Komugi", "1", "supporting", "コムギ", "Aya Endou",
   "Campeona mundial de Gungi, ciega y humilde hasta el extremo. Solo vive para jugar y se disculpa cada vez que gana. Su partida contra Meruem cambia al rey y se convierte en la relación más extraña y conmovedora de la serie."],

  ["Knuckle Bine", "1", "supporting", "ナックル゠バイン", "Wataru Takagi",
   "Cazador de bestias y miembro del escuadrón de exterminio. Es gruñón, impulsivo y se encariña de los animales con facilidad. Su Nen, A.P.R., presta aura y cobra intereses, una habilidad que parece absurda hasta que se enfrenta a un Guardia Real."],

  ["Shoot McMahon", "1", "supporting", "シュート＝マクマホン", "Yuuji Ueda",
   "Cazador que se esconde detrás de un abrigo y una máscara porque le aterra morir. Sus manos flotantes de Nen atacan desde cualquier ángulo. Su arco es el de un cobarde que decide seguir luchando aunque sepa que va a perder."],

  ["Morel Mackernasey", "1", "supporting", "モラウ=マッカーナーシ", "Taiten Kusunoki",
   "Cazador de dos estrellas y veterano del escuadrón de exterminio. Usa su pipa y su Nen, Deep Purple, para crear humo con forma de soldados y jaulas. Es el estratega del grupo y el adulto que mantiene la calma cuando todo se desmorona."],

  ["Knov", "1", "supporting", "ノヴ", "Shinichirou Miki",
   "Cazador especializado en infiltración. Su Nen le permite crear puertas y habitaciones ocultas entre espacios. Es meticuloso y valiente, pero el aura de los Guardias Reales le rompe algo por dentro que tarda mucho en recuperar."],

  ["Palm Siberia", "1", "supporting", "パーム＝シベリア", "Kikuko Inoue",
   "Vidente y alumna de Knov, obsesionada con Gon hasta límites incómodos. Su Nen le permite predecir el futuro con un vaso de agua y, más tarde, detectar a varias personas a la vez. Su transformación en hormiga quimera la obliga a reconstruirse."],

  ["Ikalgo", "1", "supporting", "イカルゴ", "Kenyuu Horiuchi",
   "Hormiga quimera con forma de pulpo que empieza como enemigo y acaba siendo uno de los mejores aliados de Killua. Es torpe, sensible y tiene un sentido del deber que sorprende a todos. Su habilidad le permite controlar cuerpos ajenos."],

  ["Alluka Zoldyck", "1", "supporting", "アルカ＝ゾルディック", "Maaya Uchida",
   "Hermana pequeña de Killua, encerrada en la mansión Zoldyck por un poder que la familia no comprende. Dentro de ella vive Nanika, una entidad capaz de conceder deseos a un precio terrible. Killua es la única persona que la trata como una niña."],

  ["Mito Freecss", "1", "supporting", "ミト・フリークス", "Keiko Han",
   "Tía de Gon y la mujer que lo crio en la Isla Ballena. Es estricta, protectora y no soporta que le digan que Gon se parece a Ging. Su mayor miedo es que el chico repita el camino de su padre, pero acaba dejándolo marchar."],
];
