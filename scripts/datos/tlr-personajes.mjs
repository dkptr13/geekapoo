// PERSONAJES - To Love Ru
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las nueve entregas. Los numeros siguen el orden de
// emision: 1 (serie 2008), 2 (OVA 2009), 3 (Motto 2010), 4
// (Darkness 2012), 5 (OVA Darkness 2012-2015), 6 (Darkness 2nd
// 2015), 7 (Specials), 8 (OVA 2nd 2016) y 9 (Multiplication
// 2017).
//
// Sin voz no hay ficha (Pikary, Sayaka Arai, Koyomi Shirayuri);
// los BACKGROUND no entran.
//
// Nombres, japones y voces vienen de AniList (3455, 5667, 9181,
// 13663, 13851, 20995, 21852, 21853 y 100659) y se comprobaron
// contra TVDB 81831. Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Rito Yuuki", "", "main", "結城リト", "Akeno Watanabe",
   "Caen chicas del cielo y el pone la cara. Accidentes con intenciones puras desde 2008."],

  ["Lala Deviluke", "", "main", "ララ・サタリン・デビルーク", "Haruka Tomatsu",
   "Princesa alienigena que se compromete sola con Rito. Inventos, colas y desparpajo."],

  ["Haruna Sairenji", "", "main", "西連寺春菜", "Sayuri Yahagi",
   "Amor timido de Rito con gafas de sol y pudor. Querer en bajito desde clase."],

  ["Konjiki no Yami", "", "main", "金色の闇", "Misato Fukuen",
   "Asesina dorada que acaba en el grupo. De matar a Rito a cenar con el."],

  ["Momo Deviluke", "2,3,4,5,6,7,8,9", "main", "モモ・ベリア・デビルーク", "Aki Toyosaki",
   "Hermanita que monta el haren de Rito en serio. Sale en todo menos en la serie."],

  ["Mea Kurosaki", "4,5,6,7,9", "main", "黒咲芽亜", "Yuka Iguchi",
   "Pequeña oscura con Némesis dentro. Sale en Darkness y secuelas."],

  ["Mikan Yuuki", "", "main", "結城美柑", "Kana Hanazawa",
   "Hermana pequeña que aguanta el lio con temple. La unica cuerda de la casa."],

  ["Yui Kotegawa", "1,2,3,4,5,6,7,9", "main", "古手川唯", "Kaori Nazuka",
   "Moral con regla que se ablanda con Rito. Sale en todo menos en el OVA de 2016."],

  ["Nana Deviluke", "2,3,4,5,6,7,9", "main", "ナナ・アスタ・デビルーク", "Kanae Itou",
   "Gemela que odia el pervertido con Rito delante. Sale en todo menos en serie y OVA."],

  ["Run Elsie Jewelria", "1,2,3,4,6,9", "main", "ルン・エルシ・ジュエリア", "Fuyuka Ooura",
   "Idol que cambia de sexo y de bando por amor. Sale en serie, OVAs y secuelas."],

  ["Saki Tenjouin", "1,2,3,4,6,9", "main", "天条院沙姫", "Ayako Kawasumi",
   "Reina del insti con corte de aduladoras. Sale en serie, OVAs y secuelas."],

  ["Rin Kujou", "1,2,4,6,9", "main", "九条凛", "Mai Hashimoto",
   "Espada de Saki, seria y leal. Sale en serie, OVA, Darkness y secuelas."],

  ["Aya Fujisaki", "1,2,3,4,6,9", "main", "藤崎綾", "Kaori Mizuhashi",
   "Amiga de Haruna con gafas y calma. Sale en serie, OVAs y secuelas."],

  ["Nemesis", "4,6,7,8,9", "main", "ネメシス", "Rina Hidaka",
   "Oscuridad con cuerpo de niña y juego sucio. Jefa final de la saga oscura."],

  ["Gid Lucion Deviluke", "1,3", "supporting", "ギド・ルシオン・デビルーク", "Hidetoshi Nakamura",
   "Rey diablo y padre de broma pesada. Sale en serie y Motto."],

  ["Zastin", "1,3,4,6", "supporting", "ザスティン", "Takehito Koyasu",
   "Guardaespaldas con espada y bigote. Sale en serie, Motto y Darkness."],

  ["Taizou Motemitsu", "1,2,6", "supporting", "弄光泰三", "Daisuke Namikawa",
   "Presumido del insti con Saki. Sale en serie, OVA y 2nd."],

  ["Peke", "1,2,3,4,5,6", "supporting", "ペケ", "Satomi Arai",
   "Robot de Lala con mil formas. Sale hasta 2nd."],

  ["Ryouko Mikado", "1,2,3", "supporting", "御門涼子", "Masako Jou",
   "Enfermera alienigena del insti. Sale en serie, OVA y Motto."],

  ["Kenichi Saruyama", "1,2,3,4,6,9", "supporting", "猿山健一", "Hiroyuki Yoshino",
   "Pervertido amigo de Rito con sueños de haren. Sale en serie, OVAs y secuelas."],

  ["Risa Momioka", "1,2,3,4,5,6,7", "supporting", "籾岡里紗", "Ryouka Yuzuki",
   "Amiga guarra de Haruna sin filtro. Sale en todo menos en OVA y multi."],

  ["Mio Sawada", "1,2,3,4,6", "supporting", "沢田未央", "Chiemi Chiba",
   "Amiga de Haruna con gafas y calma. Sale en serie, OVAs y Darkness."],

  ["Shizu Murasame", "1,2,3,4,5,6", "supporting", "村雨静", "Mamiko Noto",
   "Fantasma del insti viejo con Oshizu. Sale hasta 2nd."],

  ["Principal", "1,2,3,4,6", "supporting", "校长", "Kenichi Ogata",
   "Director con estatua y discursos. Sale en serie, OVAs y Darkness."],

  ["Akiho Sairenji", "1,2,3,6", "supporting", "西連寺秋穂", "Mikako Takahashi",
   "Hermana mayor de Haruna que bebe y liga. Sale en serie, OVAs y 2nd."],

  ["Kyouko Kirisaki", "1,2,3", "supporting", "霧崎恭子", "Chiemi Chiba",
   "Idol magical con Rito de fan. Sale en serie, OVA y Motto."],

  ["Honekawa", "1,3,6", "supporting", "骨川", "Tomohisa Asou",
   "Esqueleto del insti con huesos fuera. Sale en serie, Motto y 2nd."],

  ["Lacospo", "1", "antagonist", "ラコスポ", "Kappei Yamaguchi",
   "Alienigena de pasada. Sale en la serie."],

  ["Ren Elsie Jewelria", "1,3,4,6", "supporting", "レン・エルシ・ジュエリア", "Fuyuka Ooura",
   "Chico Run cuando toca ser chico. Sale en serie, Motto y Darkness."],

  ["Buwatts", "1,3,6", "supporting", "ブワッツ", "Daisuke Matsuo",
   "Alienigena de pasada. Sale en serie, Motto y 2nd."],

  ["Maul", "1,3,6", "antagonist", "マウル", "Jun Konno",
   "Alienigena de pasada. Sale en serie, Motto y 2nd."],

  ["Marron", "1,3,4,6", "supporting", "マロン", "Hiroyuki Yoshino",
   "Perro alienigena con voz de persona. Sale en serie, Motto y Darkness."],

  ["Stella", "1", "supporting", "ステラ", "Rikako Aikawa",
   "Alienigena de pasada. Sale en la serie."],

  ["Celine", "2,3,4,5,6,7", "supporting", "セリーヌ", "Ryouka Yuzuki",
   "Planta gigante que escupe a Rito. Sale en todo menos en serie, OVA y multi."],

  ["Mami Nogiwa", "2,3,4,6", "supporting", "野際 真美", "Sayuri Yahagi",
   "Amiga de Haruna con caracter. Sale en OVA, Motto y Darkness."],

  ["Sachie Kogure", "2,3,4,6", "supporting", "小暮 幸恵", "Misato Fukuen",
   "Amiga de Haruna con gafas. Sale en OVA, Motto y Darkness."],

  ["Ringo Yuuki", "3", "supporting", "結城 林檎", "Sayaka Oohara",
   "Madre de Rito y Mikan, editora manga. Sale en Motto."],

  ["Saibai Yuuki", "3,6", "supporting", "結城 才培", "Keiji Fujiwara",
   "Padre de Rito, mangaka ausente. Sale en Motto y 2nd."],

  ["Yuu Kotegawa", "3,4,5,6", "supporting", "古手川 遊", "Atsushi Abe",
   "Hermano pequeño de Yui. Sale en Motto, Darkness y secuelas."],

  ["Haruko Nitta", "3,4", "supporting", "新田晴子", "Tomoko Nakamura",
   "Profe del insti. Sale en Motto y Darkness."],

  ["Tearju Lunatique", "4,6", "supporting", "ティアーユ・ルナティーク", "Misato Fukuen",
   "Cientifica madre de Yami y Mea. Sale en Darkness y 2nd."],

  ["Azenda", "4,6", "supporting", "アゼンダ", "Risa Hayamizu",
   "Del mercado negro alienigena. Sale en Darkness y 2nd."],

  ["Nakajima", "4,6", "supporting", "中島", "Yoshitsugu Matsuoka",
   "Compañero de clase. Sale en Darkness y 2nd."],

  ["Sephie Michaela Deviluke", "8", "supporting", "セフィ・ミカエラ・デビルーク", "Kikuko Inoue",
   "Reina devilukiana, madre de las tres. Sale en el OVA de 2016."],
];
