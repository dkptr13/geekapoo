// PERSONAJES - SPY×FAMILY
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las cuatro entregas. Los numeros siguen el orden
// de emision: 1 (serie 2022, dos partes juntas), 2 (peli 2023), 3
// (Season 2) y 4 (Season 3). La publi de Street Fighter no cuenta
// como entrega.
//
// Quedan fuera los BACKGROUND y Demetrius (BACKGROUND sin voz en
// la segunda). Donovan solo es secundario en la segunda parte de
// la T1.
//
// Nombres, japones y voces vienen de AniList (140960, 142838,
// 158928, 158927 y 177937) y se comprobaron contra TVDB 405920.
// Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Anya Forger", "", "main", "アーニャ・フォージャー", "Atsumi Tanezaki",
   "Niña que lee mentes adoptada para la mision. Cacahuetes, caras raras y stellas a su manera."],

  ["Loid Forger", "", "main", "ロイド・フォージャー", "Takuya Eguchi",
   "Twilight, espia perfecto con familia de tapadera. Miente tan bien que se lo cree a ratos."],

  ["Yor Forger", "", "main", "ヨル・フォージャー", "Saori Hayami",
   "Asesina Princesa de Espinas con delantal. Mata de noche y quema la cena de dia."],

  ["Bond", "2,3,4", "main", "ボンド", "Kenichirou Matsuda",
   "Perro que ve el futuro adoptado tras el proyecto Manzana. Sale en peli y temporadas."],

  ["Becky Blackbell", "", "supporting", "ベッキー・ブラックベル", "Emiri Katou",
   "Mejor amiga rica de Anya con amor por Loid. Sale en las cuatro."],

  ["Damian Desmond", "", "supporting", "ダミアン・デズモンド", "Natsumi Fujiwara",
   "Segundo hijo del objetivo con orgullo fragil. Sale en las cuatro."],

  ["Yuuri Briar", "", "supporting", "ユーリ・ブライア", "Kenshou Ono",
   "Hermano de Yor en la policia secreta con complejo. Sale en las cuatro."],

  ["Sylvia Sherwood", "", "supporting", "シルヴィア・シャーウッド", "Yuuko Kaida",
   "Jefa de Loid que mueve hilos con te. Sale en las cuatro."],

  ["Franky Franklin", "", "supporting", "フランキー・フランクリン", "Hiroyuki Yoshino",
   "Informante que liga fatal y ayuda genial. Sale en las cuatro."],

  ["Henry Henderson", "", "supporting", "ヘンリー・ヘンダーソン", "Kazuhiro Yamaji",
   "Profe elegante de Eden con pasado. Sale en las cuatro."],

  ["Camilla", "", "supporting", "カミラ", "Umeka Shouji",
   "Compañera de Yor en el ayuntamiento. Sale en las cuatro."],

  ["Ewen Egeburg", "", "supporting", "ユーイン・エッジバーグ", "Haruka Okamura",
   "Amigo de Damian. Sale en las cuatro."],

  ["Emile Elman", "", "supporting", "エミールぅ・エルマン", "Hana Satou",
   "Amigo de Damian. Sale en las cuatro."],

  ["Millie", "", "supporting", "ミリー", "Manaka Iwami",
   "Compañera de Anya. Sale en las cuatro."],

  ["Sharon", "", "supporting", "シャロン", "Mirei Kumagai",
   "Compañera de Anya. Sale en las cuatro."],

  ["Chadwick Curtis", "", "supporting", "チャドウィック・カーティス", "Yasuyuki Kase",
   "Profe de Eden. Sale en las cuatro."],

  ["Fiona Frost", "", "supporting", "フィオナ・フロスト", "Ayane Sakura",
   "Nightfall, compañera de Loid enamorada en secreto. Sale en las cuatro."],

  ["Garden Tenchou", "1,3,4", "supporting", "〈ガーデン〉店長", "Junichi Suwabe",
   "Jefe de Yor en Garden. Sale en serie y temporadas."],

  ["WISE Kyokuchou", "1", "supporting", "〈WISE〉局長", "Akio Ootsuka",
   "Jefe de Loid en WISE. Sale en la serie."],

  ["Donovan Desmond", "1", "antagonist", "ドノバン・デズモンド", "Takaya Hashi",
   "El objetivo tras la guerra fria. Sale en la serie."],

  ["Edgar", "1", "supporting", "エドガー", "Atsushi Ono",
   "Detenido que canta en el interrogatorio. Sale en la serie."],

  ["Karen", "1", "supporting", "カレン", "Marie Ooi",
   "Del interrogatorio. Sale en la serie."],

  ["Murdoch Swan", "1", "supporting", "マードック・スワン", "Jin Urayama",
   "Director borde de la entrevista. Sale en la serie."],

  ["Walter Evans", "1", "supporting", "ウォルター・エバンス", "Hiroshi Yanaka",
   "Director de la entrevista. Sale en la serie."],

  ["Benedict Goodfellow", "1", "supporting", "ベネディクト・アイヴァン・グッドフェラー", "Youhei Tadano",
   "Colegial de Eden. Sale en la serie."],

  ["Jim Hayward", "1", "supporting", "ジム・ヘイワード", "Shinya Takahashi",
   "Colegial de Eden. Sale en la serie."],

  ["Roujo", "1", "supporting", "老女", "Yuko Sasaki",
   "Anciana del examen. Sale en la serie."],

  ["Kojiin no Shujin", "1", "supporting", "孤児院の主人", "Hiroki Gotou",
   "Dueño del orfanato de Anya. Sale en la serie."],

  ["Shitateya no Tenin", "1", "supporting", "仕立て屋の店員", "Emiko Takeuchi",
   "Dependienta de la sastreria. Sale en la serie."],

  ["Shitateya no Tenshu", "1", "supporting", "仕立て屋の店主", "Hana Satou",
   "Dueño de la sastreria. Sale en la serie."],

  ["Keith Kepler", "1", "antagonist", "キース・ケプラー", "Hiroki Takahashi",
   "Terrorista de los perros bomba. Sale en la serie."],

  ["Kris", "1", "supporting", "クリス", "Takaaki Torashima",
   "De la banda de Keith. Sale en la serie."],

  ["Kurt", "1", "supporting", "カート", "Masafumi Kobatake",
   "De la banda de Keith. Sale en la serie."],

  ["Monica McBride", "1", "supporting", "モニカ・マクブライド", "Akari Tadano",
   "De la banda de Keith. Sale en la serie."],

  ["Brantz Daijin", "1", "supporting", "ブランツ大臣", "Naoki Bandou",
   "Ministro objetivo del atentado. Sale en la serie."],

  ["Shinonome", "1", "supporting", "東雲", "Yuuichi Nakamura",
   "Asesino del amanecer. Sale en la serie."],

  ["George Glooman", "1", "supporting", "ジョージ・グルーマン", "Shun Horie",
   "Compañero que finge su ruina. Sale en la serie."],

  ["George no chichi", "1", "supporting", "ジョージの父", "Hiroki Gotou",
   "Padre de George. Sale en la serie, de la familia."],

  ["Kim Campbell", "1", "supporting", "キム・キャンベル", "Satsumi Matsuda",
   "Colegial de Eden. Sale en la serie."],

  ["Carrol Campbell", "1", "supporting", "キャロル・キャンベル", "Yuuki Shin",
   "Colegial de Eden. Sale en la serie."],

  ["Cavi Campbell", "1", "supporting", "キャビー・キャンベル", "Yuuji Ueda",
   "Colegial de Eden. Sale en la serie."],

  ["Erik Zacharis", "1", "supporting", "エリック・ザカリス", "Katsunori Okai",
   "Colegial de Eden. Sale en la serie."],

  ["Martha Marriott", "1", "supporting", "マーサ・マリオット", "Shouko Tsuda",
   "Sirvienta de Becky. Sale en la serie."],

  ["WISE Kikanin", "1,2,4", "supporting", "<WISE> 機関員", "Hiroki Gotou",
   "Agente de WISE. Sale en serie, peli y tercera."],

  ["Dmitri", "2", "supporting", "ドミトリ", "Tomoya Nakamura",
   "De la peli con el microfilm. Sale en la peli."],

  ["Luka", "2", "supporting", "ルカ", "Kento Kaku",
   "De la peli con el microfilm. Sale en la peli."],

  ["Type F", "2", "supporting", "タイプF", "Shunsuke Takeuchi",
   "Cyborg de la peli. Sale en la peli."],

  ["Sneijder", "2", "supporting", "スナイデル", "Banjou Ginga",
   "Militar de la peli. Sale en la peli."],

  ["Unko no Kami", "2", "supporting", "うんこの神", "Shigeru Chiba",
   "Dios de la caca que ve Anya. Sale en la peli."],

  ["Burns", "1,4", "supporting", "バーンズ", "Masafumi Kobatake",
   "De Eden. Sale en serie y tercera."],

  ["Bill Watkins", "1,4", "supporting", "ビル・ワトキンス", "Hiroki Yasumoto",
   "Tanquecito de Eden. Sale en serie y tercera."],

  ["Wyman Wilker", "1,4", "supporting", "ワイマン・ウィルカー", "Jirou Saitou",
   "De Eden. Sale en serie y tercera."],

  ["Green", "3", "supporting", "グリーン", "Hiroshi Shirokuma",
   "Del crucero. Sale en la segunda."],

  ["Franlin Perkin", "3", "supporting", "フランクリン・パーキン", "Hinata Tadokoro",
   "Del crucero. Sale en la segunda."],

  ["Conrad", "3", "supporting", "コンラッド", "Kousuke Kobayashi",
   "Del crucero. Sale en la segunda."],

  ["Franklin Perkin no Chichi", "3", "supporting", "フランクリン・パーキンの父", "Hiroshi Naka",
   "Padre de Franlin. Sale en la segunda, de la familia."],

  ["Casey", "3", "supporting", "ケイシー", "Marie Ooi",
   "Del crucero. Sale en la segunda."],

  ["Matthew McMahon", "3", "supporting", "マシュー・マクマホン", "Kenyuu Horiuchi",
   "Del crucero. Sale en la segunda."],

  ["Olka Gretcher", "3", "supporting", "オルカ・グレッチャー", "Aya Endou",
   "Madre que huye en el crucero. Sale en la segunda."],

  ["Zeb", "3", "supporting", "ゼブ", "Junta Terashima",
   "Del crucero. Sale en la segunda."],

  ["Gram Gretcher", "3", "supporting", "グラム・グレッチャー", "Marie Ooi",
   "Bebe del crucero. Sale en la segunda."],

  ["Heymann", "3", "supporting", "エイマン", "Takaaki Torashima",
   "Del crucero. Sale en la segunda."],

  ["Vides", "3", "supporting", "ビーデス", "Shoumaru Zouza",
   "Del crucero. Sale en la segunda."],

  ["Kikimimi-kun", "3", "supporting", "聞き耳ーくん", "Kazuyuki Okitsu",
   "Aparato de escucha con nombre. Sale en la segunda."],

  ["Kusarigama no Barnaby", "3", "supporting", "鎖鎌のバーナビー", "Masafumi Kobatake",
   "Asesino del crucero. Sale en la segunda."],

  ["Koroshiya no Leader-kaku", "3", "supporting", "殺し屋のリーダー格", "Kousuke Toriumi",
   "Jefe de los asesinos del crucero. Sale en la segunda."],

  ["Melinda Desmond", "4", "supporting", "メリンダ・デズモンド", "Kikuko Inoue",
   "Madre de Damian con sonrisas raras. Sale en la tercera."],

  ["Gerald Gorey", "4", "supporting", "ジェラルド・ゴーリー", "Takehito Koyasu",
   "Del arco del bus. Sale en la tercera."],

  ["Chloe", "4", "supporting", "クロエ", "Sayumi Suzushiro",
   "Del arco del bus. Sale en la tercera."],

  ["Billy Squire", "4", "supporting", "ビリー・スクワイア", "Takanori Hoshino",
   "Del arco del bus. Sale en la tercera."],

  ["Vadim", "4", "supporting", "バヅム", "Masafumi Kobatake",
   "Del arco del bus. Sale en la tercera."],

  ["Winston Wheeler", "4", "supporting", "ウィンストン・ウィーラー", "Daisuke Ono",
   "De las cloacas. Sale en la tercera."],

  ["Gascoigne", "4", "supporting", "ガスコイン", "Tsuguo Mogami",
   "De las cloacas. Sale en la tercera."],

  ["Becky no Chichi", "4", "supporting", "ベッキーの 父", "Shoumaru Zouza",
   "Padre de Becky. Sale en la tercera, de la familia."],
];
