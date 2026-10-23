// PERSONAJES - KonoSuba
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en todas las entregas. Los numeros siguen el orden de
// emision: 1 serie 2016, 2 OVA 2016, 3 serie 2017, 4 OVA 2017,
// 5 peli 2019, 6 Bakuen 2023, 7 serie 2024 y 8 BONUS STAGE 2025.
//
// Nombres, japones y voces vienen de AniList (21202, 21574, 21699,
// 97996, 102976, 150075, 136804 y 181244) y se comprobaron contra
// TVDB 303867 y 420657. Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Kazuma Satou", "1,2,3,4,5,7,8", "main", "佐藤和真", "Jun Fukushima",
   "Hiki encerrado que muere de risa y renace con una diosa de saldo. Ladron, pervertido y el unico con cerebro del grupo. Sobrevive a base de trampas."],

  ["Aqua", "1,2,3,4,5,7,8", "main", "アクア", "Sora Amamiya",
   "Diosa inutil del agua que lloro para que la llevaran a otro mundo. Fiestera, llorona y archisacerdote de milagros caros. Sin ella no hay grupo y con ella tampoco."],

  ["Megumin", "", "main", "めぐみん", "Rie Takahashi",
   "Archimaga carmesi de un solo hechizo: Explosion, una vez al dia y a dormir. Teatral hasta el ridiculo y la primera en cargar. Sale en todas las entregas."],

  ["Darkness", "1,2,3,4,5,7,8", "main", "ダクネス", "Ai Kayano",
   "Cruzada masoquista de gran familia que hace de muro humano. Disfruta recibiendo y pide mas. Noble de nacimiento y desastre de profesion."],

  ["Yunyun", "2,3,5,6,7,8", "main", "ゆんゆん", "Aki Toyosaki",
   "Rival autoproclamada y unica amiga de Megumin, tan carmesi como ella y tan sola como dice. Protagoniza Bakuen con ella."],

  ["Wiz", "1,2,3,5,7,8", "supporting", "ウィズ", "Yui Horie",
   "Lich arruinada que regenta la tienda magica de Axel. Teme a Vanir y a las deudas por igual. Socia del desastre desde la primera temporada."],

  ["Luna", "1,3,4,5,7,8", "supporting", "ルナ", "Sayuri Hara",
   "Recepcionista del gremio de Axel, amable y profesional. Aguanta al grupo sin perder la sonrisa."],

  ["Eris", "1,2,3,7", "supporting", "エリス", "Ayaka Suwa",
   "Diosa de la suerte, rival de Aqua y objeto de devocion de Kazuma. Roba bragas por costumbre divina."],

  ["Sena", "1,3", "supporting", "セナ", "Hitomi Nabatame",
   "Fiscal del reino que proceso a Kazuma por terrorismo. Seria y recta, sale en las dos primeras series."],

  ["Chomusuke", "3,4,5,6", "supporting", "ちょむすけ", "Hitomi Nabatame",
   "Gata negra de Megumin. La acompaña desde la segunda serie hasta Bakuen."],

  ["Vanir", "3,5,7", "supporting", "バニル", "Masakazu Nishida",
   "Demonio enmascarado de la mazmorra, socio de Wiz y hombre de negocios. Todo lo ve, todo lo cobra."],

  ["Dust", "1,3,7", "supporting", "ダスト", "Junji Majima",
   "Aventurero maleante y mala influencia oficial de Kazuma. Ladron de poca monta con buen fondo a ratos."],

  ["Keith", "1,3,7", "supporting", "キース", "Wataru Hatano",
   "Caballero secundario del gremio, de los que miran mas que pelean."],

  ["Kyouya Mitsurugi", "1,3,4,7", "supporting", "御剣響夜", "Takuya Eguchi",
   "Espadachin creido con espada maldita incluida. Rival de pacotilla de Kazuma."],

  ["Alderp Alexei Barnes", "3,7", "supporting", "アルダープ・アレクセイ・バーネス", "Takashi Nagasako",
   "Noble corrupto de Axel con ejercito propio. Antagonista de despacho mas que de campo."],

  ["Ignis Dustiness Ford", "3", "supporting", "イグニス ダスティネス フォード", "Kazuhiko Inoue",
   "Padre de Darkness. En la segunda serie, con la boda concertada de por medio."],

  ["Rin", "3,7", "supporting", "リーン", "Yumiri Hanamori",
   "Maga novata del gremio. Sale en la segunda y la tercera serie."],

  ["Claire", "7", "supporting", "クレア", "Sayuri Yahagi",
   "Caballera guardaespaldas de Iris, seria y leal. Sale en la tercera serie."],

  ["Rain", "7", "supporting", "レイン", "Reina Ueda",
   "Criada y escolta de Iris, dulce por fuera. Sale en la tercera serie."],

  ["Iris Belzerg", "7", "supporting", "ベルゼルグ・スタイリッシュ・ソード・アイリス", "Kanon Takao",
   "Princesa del reino y fan de Kazuma. Seria hasta lo imposible y centro de la tercera serie."],

  ["Komekko", "5,6", "supporting", "こめっこ", "Maria Naganawa",
   "Hermana pequeña de Megumin. Sale en la peli y en Bakuen."],

  ["Hyoizaburoo", "5,6", "supporting", "ひょいざぶろー", "Hiroki Takahashi",
   "Padre parado de Megumin. Sale en la peli y en Bakuen."],

  ["Yuiyui", "5,6", "supporting", "ゆいゆい", "Mamiko Noto",
   "Madre de Megumin. Sale en la peli y en Bakuen."],

  ["Cecily", "6", "supporting", "セシリー", "Fairouz Ai",
   "Monja del culto de Axis en la aldea. Sale en Bakuen."],

  ["Soketto", "5,6", "supporting", "ソケツト", "Miki Hase",
   "Chica carmesi del clan. Sale en la peli y en Bakuen."],

  ["Funifura", "5,6", "supporting", "ふにふら", "Miyu Tomita",
   "Chica carmesi del clan. Sale en la peli y en Bakuen."],

  ["Arue", "5,6", "supporting", "あるえ", "Kaori Nazuka",
   "Chica carmesi del clan. Sale en la peli y en Bakuen."],

  ["Dodonko", "5,6", "supporting", "どどんこ", "Sayumi Suzushiro",
   "Chica carmesi del clan. Sale en la peli y en Bakuen."],

  ["Beldia", "1", "antagonist", "ベルディア", "Hiroki Yasumoto",
   "Dullahan general del Rey Demonio. El primer muro de verdad del grupo. Sale solo en la primera serie."],

  ["Hans", "3", "antagonist", "ハンス", "Kenjirou Tsuda",
   "Slime venenoso general del Rey Demonio. Sale solo en la segunda serie."],

  ["Keele", "3", "antagonist", "キール", "Nobuo Tobita",
   "Lich del laberinto al que el grupo va a dar descanso. Sale solo en la segunda serie."],

  ["Sylvia", "5,7", "antagonist", "シルビア", "Akeno Watanabe",
   "Quimera general del Rey Demonio que quiere fusionarlo todo. Villana de la peli, con eco en la tercera serie."],
];
