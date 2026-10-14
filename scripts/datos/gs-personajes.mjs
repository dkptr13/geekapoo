// PERSONAJES - Goblin Slayer
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las tres entregas. Los numeros siguen el orden de
// emision: 1 (serie 2018), 2 (peli Crown 2020) y 3 (II 2023). Sin
// japones no hay ficha (Ogre, Taishou); los BACKGROUND no entran.
//
// Los nombres son los de AniList tal cual, que aqui son el oficio
// (nadie tiene nombre propio salvo Reijou y cuatro mas).
// Nombres, japones y voces vienen de AniList (101165, 108623 y
// 129188) y se comprobaron contra TVDB 350166. Las descripciones
// son propias, en castellano.

export const PERSONAJES = [
  ["Goblin Slayer", "", "main", "ゴブリンスレイヤー", "Yuuichirou Umehara",
   "El del casco que solo caza goblins con metodos guarros. Traumatizado de niño, eficaz de mayor."],

  ["Onna Shinkan", "", "main", "女神官", "Yui Ogura",
   "Sacerdotisa novata que crece mision a mision. Reza, cura y aprende a no temblar."],

  ["Yousei Yunde", "", "supporting", "妖精弓手", "Nao Touyama",
   "Elfa arquera de dos mil años con caracter de veinte. Sale en las tres."],

  ["Ushikai Musume", "", "supporting", "牛飼娘", "Yuka Iguchi",
   "Vaquera amiga de la infancia que lo espera en la granja. Sale en las tres."],

  ["Uketsuke-jou", "", "supporting", "受付嬢", "Maaya Uchida",
   "Recepcionista del gremio que adora al casco en secreto. Sale en las tres."],

  ["Majo", "", "supporting", "魔女", "Youko Hikasa",
   "Bruja que habla a tirones y lo sabe todo. Sale en las tres."],

  ["Tokage Souryo", "", "supporting", "蜥蜴僧侶", "Tomokazu Sugita",
   "Hombre lagarto monje con apetito de queso. Sale en las tres."],

  ["Yaritsukai", "", "supporting", "槍使い", "Yoshitsugu Matsuoka",
   "Lancero gallito que se pica con el casco. Sale en las tres."],

  ["Kouhito Doushi", "", "supporting", "鉱人道士", "Yuuichi Nakamura",
   "Enano chaman con jarra siempre llena. Sale en las tres."],

  ["Tsurugi no Otome", "1,3", "supporting", "剣の乙女", "Aya Endou",
   "Doncella de la espada ciega que pide ayuda. Sale en serie y en II."],

  ["Minarai Seishokusha", "1,3", "supporting", "見習い聖職者", "Ayasa Itou",
   "Aprendiza de cleriga con el grupo. Sale en serie y en II."],

  ["Omoi Kenshi", "1,3", "supporting", "重い剣士", "Daiki Hamano",
   "Guerrero pesado del grupo. Sale en serie y en II."],

  ["Onna Kishi", "1,3", "supporting", "女騎士", "Yukiyo Fujii",
   "Caballera del grupo. Sale en serie y en II."],

  ["Shoshinsha Senshi", "1,3", "supporting", "初心者戦士", "Seiji Maeda",
   "Guerrero novato que aprende a base de palos. Sale en serie y en II."],

  ["Shoujo Fujutsushi", "1,3", "supporting", "少女巫術師", "Sayaka Harada",
   "Brujita novata del grupo. Sale en serie y en II."],

  ["Kantoku-kan", "1,3", "supporting", "監督官", "Natsumi Hioka",
   "Supervisora del gremio. Sale en serie y en II."],

  ["Goblins", "1,3", "supporting", "ゴブリン", "Kaito Takeda",
   "Los de siempre: verdes, muchos y sin piedad. Salen en serie y en II."],

  ["Kajiya", "1", "supporting", "鍛冶屋", "Shinya Takahashi",
   "Herrero del gremio. Sale en la serie."],

  ["Yuusha", "1", "supporting", "勇者", "Miyuri Shimabukuro",
   "Heroina legendaria de pasada. Sale en la serie."],

  ["Rhea Sekkou", "1", "supporting", "圃人斥候", "Mutsuki Iwanaka",
   "Exploradora rhema del grupo. Sale en la serie."],

  ["Ushikai Musume no Oji", "1", "supporting", "牛飼い娘の叔父", "Daichi Hayashi",
   "Tio de la vaquera. Sale en la serie."],

  ["Senshi", "1", "supporting", "戦士", "Yasuaki Takumi",
   "Guerrero del grupo. Sale en la serie."],

  ["Butouka", "1", "supporting", "武闘家", "Shizuka Ishigami",
   "Luchadora del grupo. Sale en la serie."],

  ["Hitojichi Yousei Teisatsu", "1", "supporting", "人質妖精偵察", "Ikumi Hasegawa",
   "Exploradora elfa capturada. Sale en la serie."],

  ["Mahoutsukai", "1", "supporting", "魔法使い", "Kotori Koiwai",
   "Maga del grupo. Sale en la serie."],

  ["Goblin Slayer no Ane", "1", "supporting", "ゴブリンスレイヤーの姉", "Reina Ueda",
   "Hermana mayor muerta en el pasado. Sale en la serie."],

  ["Goblin Lord", "1", "antagonist", "ゴブリンロード", "Kazuhiko Inoue",
   "Señor goblin que asedia la granja. Jefe de la serie."],

  ["Goblin Champion", "1", "antagonist", "ゴブリンチャンピオン", "Masashi Yamane",
   "Campeon de las ruinas con espadon. Jefe del arco de en medio."],

  ["Reijou Kenshi", "2,3", "supporting", "令嬢剣士", "Sumire Uesaka",
   "Espadachina noble de tapadillo en la nieve. Sale en la peli y en II."],

  ["Itoko no Onna Majutsushi", "3", "supporting", "従姉の女魔術師", "Mao Ichimichi",
   "Prima maga del grupo. Sale en II."],

  ["Onna no Senshi", "3", "supporting", "女戦士", "Ikumi Hayama",
   "Guerrera del grupo. Sale en II."],

  ["Myrmidon Souryo", "3", "supporting", "蟲人僧侶", "Shunsuke Takeuchi",
   "Monje insecto del grupo. Sale en II."],

  ["Half-Elf no Sekkou", "3", "supporting", "半森人の斥候", "Jun Fukushima",
   "Explorador medio elfo. Sale en II."],

  ["Oumai", "3", "supporting", "王妹", "Rina Hidaka",
   "Hermana del rey con escolta pedida. Sale en II."],

  ["Kokuou", "3", "supporting", "国王", "Shinichirou Miki",
   "Rey del reino que pide escolta al grupo. Sale en II."],

  ["Shounen Majutsushi", "3", "supporting", "少年魔術師", "Mariya Ise",
   "Aprendiz pelirrojo con potencial. Sale en II."],
];
