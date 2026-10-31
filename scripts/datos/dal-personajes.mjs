// PERSONAJES - Date A Live
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las diez entregas. Los numeros siguen el orden de
// emision: 1 (serie 2013), 2 (OVA DATE TO DATE), 3 (II), 4 (OVA
// Kurumi), 5 (peli Mayuri), 6 (III), 7 (Bullet 1), 8 (Bullet 2),
// 9 (IV) y 10 (V).
//
// Nombres, japones y voces vienen de AniList (15583, 17641,
// 19163, 20767, 20741, 100722, 111852, 121034, 116605 y 151380)
// y se comprobaron contra TVDB 264663. Las descripciones son
// propias, en castellano.

export const PERSONAJES = [
  ["Shidou Itsuka", "", "main", "五河士道", "Nobunaga Shimazaki",
   "Liga espiritus para sellarlos con besos. El unico chico del harem que trabaja."],
  ["Tooka Yatogami", "", "main", "夜刀神十香", "Marina Inoue",
   "Primera espiritu con espada y hambre infinita. Come, pelea y quiere a Shido."],
  ["Origami Tobiichi", "1,3,5,6,9,10", "main", "鳶一折紙", "Misuzu Togashi",
   "Soldado del AST obsesionada con Shido. Dispara primero y liga despues."],
  ["Kotori Itsuka", "", "main", "五河琴里", "Ayana Taketatsu",
   "Hermana pequeña que manda la nave con chupachups. Dulce en casa, jefa fuera."],
  ["Kurumi Tokisaki", "", "main", "時崎狂三", "Asami Sanada",
   "Pesadilla de coletas con ejercito de sombras. La mas peligrosa y la mas popular."],
  ["Mayuri", "5", "main", "万由里", "Sora Amamiya",
   "Espiritu de la esfera en la peli. Sale en Mayuri Judgement."],
  ["Natsumi", "6,9,10", "main", "七罪", "Ayumi Mano",
   "Cambiaformas con verguenza de bruja verde. Sale en III, IV y V."],
  ["Miku Izayoi", "3,5,6,9,10", "main", "誘宵美九", "Minori Chihara",
   "Idol con voz que domina a quien la oye. Sale en II, peli, III, IV y V."],
  ["Kaguya Yamai", "3,5,6,9,10", "main", "八舞耶倶矢", "Maaya Uchida",
   "Gemela del viento que habla como reina. Sale en II, peli, III, IV y V."],
  ["Yuzuru Yamai", "3,5,6,9,10", "main", "八舞夕弦", "Sarah Emi Bridcutt",
   "Gemela callada que habla en tres palabras. Sale en II, peli, III, IV y V."],
  ["Nia Honjou", "9,10", "main", "本条二亜", "Hitomi Nabatame",
   "Otaku encerrada, segundo espiritu. Sale en IV y V."],
  ["Mukuro Hoshimiya", "9,10", "main", "星宮六喰", "Akari Kageyama",
   "Espíritu del espacio con llave de corazones. Sale en IV y V."],
  ["Reine Murasame", "1,2,3,5,6,9,10", "main", "村雨令音", "Aya Endou",
   "Analista dormida del Ratatoskr con secretos. Sale en casi todas."],
  ["Mio", "9,10", "main", "澪", "Aya Endou",
   "Espiritu del origen, madre de todo. Sale en IV y V."],
  ["Hibiki Higoromo", "7,8", "main", "緋衣響", "Kaede Hondo",
   "Cuasiespiritu blanca del juego vecino. Sale en las dos Bullet."],
  ["Shiro no Joou", "7,8", "main", "白の女王", "Saori Oonishi",
   "Reina Blanca que cierra el juego vecino. Sale en las dos Bullet."],

  ["Yoshino", "1,2,3,4,5,6,9,10", "supporting", "四糸乃", "Iori Nomizu",
   "Pequeña de la lluvia con conejo parlante. Sale en casi todas."],

  ["Narrator", "1,4,9", "supporting", "ナレーター", "Kotono Mitsuishi",
   "Voz que cuenta lo que pasa. Sale en serie, OVA Kurumi y IV."],

  ["Tamae Okamine", "1,2,3,5,6,9,10", "supporting", "岡峰珠恵", "Kaori Sadohara",
   "Profe llorona del instituto. Sale en casi todas."],

  ["Mana Takamiya", "1,2,3,5,6,9,10", "supporting", "崇宮真那", "Misato",
   "As del AST con poco tiempo de vida. Sale en casi todas."],

  ["Hiroto Tonomachi", "1,2,3,5,6,9,10", "supporting", "殿町広人", "Anri Katsu",
   "Amigo de Shido, pervertido de manual. Sale en casi todas."],

  ["Kyouhei Kannazuki", "1,2,3,5,6,9,10", "supporting", "神無月恭平", "Takehito Koyasu",
   "Segundo del Ratatoskr, masoca perdido. Sale en casi todas."],

  ["Kyouji Kawagoe", "1,3,5,9,10", "supporting", "川越恭次", "Gou Inoue",
   "Compañero de clase. Sale en serie, II, peli, IV y V."],

  ["Masaomi Mikimoto", "1,3,5,9,10", "supporting", "幹本雅臣", "Kentarou Tone",
   "Compañero de clase. Sale en serie, II, peli, IV y V."],

  ["Hinako Shiizaki", "1,3,9,10", "supporting", "椎崎雛子", "Satomi Akesaka",
   "Compañera de clase. Sale en serie, II, IV y V."],

  ["Munechika Nakatsugawa", "1,3,5,6,9,10", "supporting", "中津川宗近", "Tomohiru Masui",
   "Compañero de clase. Sale en casi todas."],

  ["Kozue Minowa", "1,3,6,9,10", "supporting", "箕輪梢", "Tomoko Usami",
   "Compañera de clase. Sale en serie, II, III, IV y V."],

  ["Ryouko Kusakabe", "1,3,6,9,10", "supporting", "日下部燎子", "Ao Takahashi",
   "Jefa del AST en la ciudad. Sale en serie, II, III, IV y V."],

  ["Ai Yamabuki", "1,3,5,6,9,10", "supporting", "山吹亜衣", "Risako Murai",
   "Trio de amigas de Tohka. Sale en casi todas."],

  ["Mai Hazakura", "1,3,5,6,9,10", "supporting", "葉桜麻衣", "Kayoko Tsumita",
   "Trio de amigas de Tohka. Sale en casi todas."],

  ["Mii Fujibakama", "1,3,5,6,9,10", "supporting", "藤袴美衣", "Midori Tsukimiya",
   "Trio de amigas de Tohka. Sale en casi todas."],

  ["Mikie Okamine", "3,5,10", "supporting", "岡峰美紀恵", "Kanami Satou",
   "Sobrina de la profe. Sale en II, peli y V."],

  ["Ellen Mira Mathers", "3,6,9,10", "antagonist", "エレン・ミラ・メイザース", "Shizuka Itou",
   "La mas fuerte del DEM con Westcott. Sale en II, III, IV y V."],

  ["Mildred F. Fujimura", "3,5,10", "supporting", "ミルドレッド・F・藤村", "Saki Ogasawara",
   "Del DEM con Ellen. Sale en II, peli y V."],

  ["Isaac Ray Peram Westcott", "3,6,9,10", "antagonist", "アイザック・レイ・ペラム・ウェストコット", "Ryoutarou Okiayu",
   "Jefe del DEM que quiere el poder. Sale en II, III, IV y V."],

  ["Elliot Baldwin Woodman", "3,6,9,10", "supporting", "エリオット・ボールドウィン・ウッドマン", "Jouji Nakata",
   "Fundador del Ratatoskr. Sale en II, III, IV y V."],

  ["Karen Nora Mathers", "6,9,10", "supporting", "カレン・ノーラ・メイザース", "Nozomi Nishida",
   "Hermana de Ellen en el DEM. Sale en III, IV y V."],

  ["Artemisia Bell Ashcroft", "9,10", "antagonist", "アルテミシア・ベル・アシュクロフト", "Eriko Matsui",
   "As del DEM en IV. Sale en IV y V."],

  ["Nibelcole", "9,10", "antagonist", "ニベルコル", "Yumiri Hanamori",
   "Muñecas del DEM en enjambre. Salen en IV y V."],

  ["MARIA", "9", "supporting", "マリア", "Suzuko Mimori",
   "IA de a bordo del Ratatoskr. Sale en IV."],

  ["Sawa Yamauchi", "9", "supporting", "山内紗和", "Saori Oonishi",
   "Compañera de clase. Sale en IV."],

  ["Isami Hijikata", "7,8", "supporting", "土方イサミ", "Natsumi Fujiwara",
   "Cuasiespiritu del juego vecino. Sale en las dos Bullet."],

  ["Yui Sagakure", "7,8", "supporting", "佐賀繰唯", "Asami Seto",
   "Cuasiespiritu del juego vecino. Sale en las dos Bullet."],

  ["Tsang", "7,8", "supporting", "蒼", "Mariya Ise",
   "Cuasiespiritu del juego vecino. Sale en las dos Bullet."],

  ["Panie Ibusuki", "7,8", "supporting", "指宿パニエ", "Rina Hidaka",
   "Cuasiespiritu del juego vecino. Sale en las dos Bullet."],
];
