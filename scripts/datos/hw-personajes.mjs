// PERSONAJES - Hello World
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Pelicula unica: todos van con la temporada vacia. Hay dos
// Naomi Katagaki porque son la misma persona a dos edades, con
// distinto kanji y distinta voz en AniList (joven カタガキナオミ
// con Touri Matsuzaka, adulto 堅書直実 con Takumi Kitamura): si
// no se desdoblan, el segundo pisa al primero al cargar, que usa
// el nombre como id.
//
// Nombres, japones y voces vienen de AniList (106240). Las
// descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Naomi Katagaki", "", "main", "カタガキナオミ", "Touri Matsuzaka",
   "Tímido lector de Kioto al que su yo futuro pide salvar a Ruri. Tres meses para aprender a querer."],

  ["Ruri Ichigyou", "", "main", "一行瑠璃", "Minami Hamabe",
   "Compañera de Naomi con accidente marcado en el futuro. La que hay que salvar cueste lo que cueste."],

  ["Naomi Katagaki (adulto)", "", "main", "堅書直実", "Takumi Kitamura",
   "El Naomi de dentro de diez años, sensei del joven. Mueve el pasado para arreglar su futuro."],

  ["Karasu", "", "supporting", "カラス", "Rie Kugimiya",
   "Cuervo guia entre mundos. Sale en la peli."],

  ["Yiyi Xu", "", "supporting", "シュー・イーイー", "Minako Kotobuki",
   "Del equipo del futuro. Sale en la peli."],

  ["Tsunehisa Senko", "", "supporting", "千古恒久", "Takehito Koyasu",
   "Del equipo del futuro. Sale en la peli."],

  ["Misuzu Kadenokouji", "", "supporting", "勘解由小路美鈴", "Haruka Fukuhara",
   "Del equipo del futuro. Sale en la peli."],
];
