// PERSONAJES - Kimetsu no Yaiba
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las seis entregas. Los numeros siguen el orden de
// emision: 1 (serie 2019), 2 (peli Tren 2020), 3 (Yuukaku),
// 4 (Harreros), 5 (Pilar) y 6 (peli Castillo 2025).
//
// La version de tele del Tren (7 capitulos, 6 remontados) no
// cuenta como entrega: es recap. Por eso Rengoku y Enmu no llevan
// numero de esa version.
//
// Quedan fuera los BACKGROUND (Teoni, Ruka, Amane, la familia
// Shinazugawa al completo...), los sin voz (Female Kakushi,
// Chachamaru, Satoko) y el sin japones (Asakusa Oni). Nakime,
// Kanata, Kiriya y Tengen salen en entregas sin voz listada pero
// tienen voz propia y entran con ella.
//
// Nombres, japones y voces vienen de AniList (101922, 112151,
// 142329, 145139, 166240 y 178788) y se comprobaron contra TVDB
// 348545. Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Tanjirou Kamado", "", "main", "竈門炭治郎", "Natsuki Hanae",
   "Carbonero de buen olfato que pierde a su familia y carga con Nezuko en la caja. Entra en el cuerpo para curarla y no suelta a nadie."],

  ["Nezuko Kamado", "", "main", "竈門禰豆子", "Akari Kitou",
   "Hermana convertida en demonio que duerme en la caja y pelea dormida. Muerde bambu y protege a los humanos."],

  ["Inosuke Hashibira", "", "main", "嘴平伊之助", "Yoshitsugu Matsuoka",
   "Jabali de dos espadas criado en el monte. Embiste primero y pregunta despues, si pregunta."],

  ["Zenitsu Agatsuma", "", "main", "我妻善逸", "Hiro Shimono",
   "Lloron del trueno que solo pelea dormido. Despierto tiembla; dormido no falla un corte."],

  ["Kyoujurou Rengoku", "1,2,3", "main", "煉獄杏寿郎", "Satoshi Hino",
   "Pilar de la llama que grita de alegria y arde hasta el final. Su puesto en el tren no lo llena nadie."],

  ["Tengen Uzui", "1,3,5,6", "main", "宇髄天元", "Katsuyuki Konishi",
   "Pilar del sonido, espectacular hasta para sangrar. Manda en el barrio con tres esposas y un ojo menos."],

  ["Muichirou Tokitou", "1,3,4,5,6", "main", "時透無一郎", "Kengo Kawanishi",
   "Pilar de la niebla, despistado y letal. Recupera la memoria a golpes y madura de golpe en la aldea."],

  ["Mitsuri Kanroji", "1,3,4,5,6", "main", "甘露寺蜜璃", "Kana Hanazawa",
   "Pilar del amor con espada flexible y apetito flexible. Llega tarde a todo menos al combate."],

  ["Genya Shinazugawa", "1,4,5,6", "main", "不死川玄弥", "Nobuhiko Okamoto",
   "Come demonios para pelear como ellos y su hermano lo niega. Rudo por fuera y roto por dentro."],

  ["Giyuu Tomioka", "1,3,5,6", "main", "冨岡義勇", "Takahiro Sakurai",
   "Pilar del agua, serio y callado, el primero que perdono a Nezuko. Carga con la culpa de Sabito."],

  ["Shinobu Kochou", "1,3,5,6", "main", "胡蝶しのぶ", "Saori Hayami",
   "Pilar insecto que sonrie siempre y envenena sin dejar de sonreir. Su hermana muerta manda en su espada."],

  ["Muzan Kibutsuji", "1,3,4,5,6", "antagonist", "鬼舞辻無惨", "Toshihiko Seki",
   "Rey de los demonios con traje y familia de tapadera. Llevo mil años huyendo del sol y de Yoriichi."],

  ["Sakonji Urokodaki", "1,6", "supporting", "鱗滝左近次", "Houchuu Ootsuka",
   "Maestro de la mascara tengu que entreno a medio cuerpo. Llora por cada alumno que pierde."],

  ["Sanemi Shinazugawa", "1,3,4,5,6", "supporting", "不死川実弥", "Tomokazu Seki",
   "Pilar del viento con cicatrices y mala leche. Pincha a Nezuko para probar y pega a su hermano por querer."],

  ["Jigorou Kuwajima", "1,6", "supporting", "桑島慈悟郎", "Shigeru Chiba",
   "Abuelo y maestro de Zenitsu, lisiado y cascarrabias. Lo lloro hasta despues de muerto."],

  ["Obanai Iguro", "1,3,4,5,6", "supporting", "伊黒小芭内", "Kenichi Suzumura",
   "Pilar serpiente con la cara tapada y Kaburamaru al cuello. Rigido con todos menos con Mitsuri."],

  ["Gyoumei Himejima", "1,3,5,6", "supporting", "悲鳴嶼行冥", "Tomokazu Sugita",
   "Pilar de la roca, ciego y gigante, que reza llorando. El mas fuerte del cuerpo segun todos."],

  ["Makomo", "1", "supporting", "真菰", "Ai Kakuma",
   "Niña enmascarada que entreno a Tanjiro en sueños. Sale en la primera."],

  ["Kagaya Ubuyashiki", "1,3,4,5,6", "supporting", "産屋敷耀哉", "Toshiyuki Morikawa",
   "Patron ciego y enfermo que manda con calma total. Su muerte abre la guerra final."],

  ["Sabito", "1,5", "supporting", "錆兎", "Yuuki Kaji",
   "El del zorro que partio la roca antes que Tanjiro. Sale en la primera y en el entrenamiento."],

  ["Matsuemon Tennouji", "1,3,4,5,6", "supporting", "天王寺松右衛門", "Takumi Yamazaki",
   "Cuervo mensajero del cuerpo. Sale en cinco entregas dando partes a gritos."],

  ["Susamaru", "1", "supporting", "朱紗丸", "Mikako Komatsu",
   "Demonio de los temaris con brazos de mas. Sale en la primera."],

  ["Yahaba", "1", "supporting", "矢琶羽", "Jun Fukuyama",
   "Demonio de las flechas que dirige lo que toca. Sale en la primera."],

  ["Numa Oni", "1", "supporting", "沼鬼", "Ryouhei Kimura",
   "Demonio del pantano que traga chicas. Sale en la primera."],

  ["Yushirou", "1,4,5,6", "supporting", "愈史郎", "Daiki Yamashita",
   "Chico demonio de Tamayo, celoso y de mal genio. Su vista vende cara la ayuda."],

  ["Tamayo", "1,4,5,6", "supporting", "珠世", "Maaya Sakamoto",
   "Demonio medico que quiere matar a Muzan con ciencia. Estudia la sangre que otros derraman."],

  ["Hotaru Haganezuka", "1,3,4,5", "supporting", "鋼鐵塚蛍", "Daisuke Namikawa",
   "Herrero enmascarado que persigue a Tanjiro por romper espadas. Afila enfadado y cobra en rabietas."],

  ["Kanao Tsuyuri", "1,3,4,5,6", "supporting", "栗花落カナヲ", "Reina Ueda",
   "Sucesora que decide con moneda. Aprende a querer por su cuenta entre mision y mision."],

  ["Kanae Kochou", "1,6", "supporting", "胡蝶カナエ", "Ai Kayano",
   "Hermana mayor de Shinobu, pilar flor muerta por Douma. Sale en la primera y en el castillo."],

  ["Kiriya Ubuyashiki", "1,4,5,6", "supporting", "産屋敷輝利哉", "Aoi Yuuki",
   "Hijo del patron que hereda el mando siendo un niño. Sale en cuatro entregas."],

  ["Kyougai", "1", "supporting", "響凱", "Junichi Suwabe",
   "Ex luna con tambores en el cuerpo y mansion giratoria. Sale en la primera."],

  ["Rui", "1", "antagonist", "累", "Kouki Uchiyama",
   "Luna Creciente Cinco con familia de arañas de pega. Quiere a Nezuko de hermana a la fuerza."],

  ["Kumo Oni Ani", "1", "supporting", "蜘蛛鬼「兄」", "Shoutarou Morikubo",
   "Hermano araña mayor de la familia de Rui. Sale en la primera."],

  ["Kumo Oni Ane", "1", "supporting", "蜘蛛鬼「姉」", "Ryouko Shiraishi",
   "Hermana araña de la familia de Rui. Sale en la primera."],

  ["Kumo Oni Haha", "1", "supporting", "蜘蛛鬼「母」", "Ami Koshimizu",
   "Madre araña de la familia de Rui. Sale en la primera."],

  ["Kumo Oni Chichi", "1", "supporting", "蜘蛛鬼「父」", "Tetsu Inada",
   "Padre araña de la familia de Rui. Sale en la primera."],

  ["Ukogi", "1,5", "supporting", "うこぎ", "Manaka Iwami",
   "Niña de la finca Mariposa. Sale en la primera y en el entrenamiento."],

  ["Naho Takada", "1,3,4,5", "supporting", "高田なほ", "Yuuki Kuwahara",
   "Niña de la finca Mariposa. Sale en cuatro entregas."],

  ["Kiyo Terauchi", "1,3,4,5", "supporting", "寺内きよ", "Nanami Yamashita",
   "Niña de la finca Mariposa. Sale en cuatro entregas."],

  ["Aoi Kanzaki", "1,3,4,5", "supporting", "神崎アオイ", "Yuri Ehara",
   "Ayudante de la finca Mariposa que no salio a cazar. Sale en cuatro entregas."],

  ["Sumi Nakahara", "1,3,4,5", "supporting", "中原すみ", "Ayumi Mano",
   "Niña de la finca Mariposa. Sale en cuatro entregas."],

  ["Kanata Ubuyashiki", "1,4,6", "supporting", "産屋敷かなた", "Shiori Izawa",
   "Hija del patron. Sale en la primera, en Herreros y en el castillo."],

  ["Nichika Ubuyashiki", "1,3,4", "supporting", "産屋敷 にちか", "Ari Ozawa",
   "Hija del patron. Sale en la primera, en Yuukaku y en Herreros."],

  ["Hinaki Ubuyashiki", "1,3,4", "supporting", "産屋敷 ひなき", "Yumiri Hanamori",
   "Hija del patron. Sale en la primera, en Yuukaku y en Herreros."],

  ["Murata", "1,3,5,6", "supporting", "村田", "Kouki Miyata",
   "Cazador raso que sobrevive a todo sin hacer ruido. Sale en cuatro entregas."],

  ["Kie Kamado", "1,2,3", "supporting", "竈門葵枝", "Houko Kuwashima",
   "Madre de Tanjiro. Sale en la primera, en el tren y en Yuukaku."],

  ["Shigeru Kamado", "1,2,3", "supporting", "竈門茂", "Kaede Hondo",
   "Hermano pequeño de Tanjiro. Sale en la primera, en el tren y en Yuukaku."],

  ["Takeo Kamado", "1,2,3", "supporting", "竈門竹雄", "You Taichi",
   "Hermano pequeño de Tanjiro. Sale en la primera, en el tren y en Yuukaku."],

  ["Hanako Kamado", "1,2,3", "supporting", "竈門花子", "Konomi Kohara",
   "Hermana pequeña de Tanjiro. Sale en la primera, en el tren y en Yuukaku."],

  ["Tanjurou Kamado", "1,2,3,6", "supporting", "竈門炭十郎", "Shinichirou Miki",
   "Padre de Tanjiro, bailarin del hinokami enfermo. Sale en cuatro entregas."],

  ["Rokuta Kamado", "1,2,3", "supporting", "竈門六太", "Aoi Koga",
   "El mas pequeño de los Kamado. Sale en la primera, en el tren y en Yuukaku."],

  ["Saburou", "1", "supporting", "三郎", "Masaki Terasoma",
   "Anciano del pueblo que avisa del peligro. Sale en la primera."],

  ["Hisa", "1", "supporting", "ひさ", "Ikuko Tani",
   "Anciana que da cobijo con caldo caliente. Sale en la primera."],

  ["Rei Kibutsuji", "1", "supporting", "きぶつじれい", "Yuuko Minaguchi",
   "Mujer humana de Muzan en Asakusa. Sale en la primera."],

  ["Kibutsuji no Musume", "1", "supporting", "鬼舞辻の娘", "Haruka Shiraishi",
   "Hija humana de Muzan en Asakusa. Sale en la primera."],

  ["Kozo Kanamori", "1,4,5", "supporting", "鉄穴森鋼蔵", "Eiji Takemoto",
   "Herrero que afila sin protestar tanto como Hotaru. Sale en tres entregas."],

  ["Gotou", "1,4,5", "supporting", "後藤", "Makoto Furukawa",
   "Kakushi de recogida que carga cuerpos. Sale en tres entregas."],

  ["Shoichi", "1", "supporting", "正一", "Mitsuhiro Ichiki",
   "Chico del pueblo de los tambores. Sale en la primera."],

  ["Teruko", "1", "supporting", "てる子", "Miho Okasaki",
   "Niña perdida en la mansion de los tambores. Sale en la primera."],

  ["Kiyoshi", "1", "supporting", "清", "Shunichi Toki",
   "Hermano raro de Teruko. Sale en la primera."],

  ["Tokie", "1", "supporting", "トキエ", "Misako Tomioka",
   "Madre de los niños de Asakusa. Sale en la primera."],

  ["Toyo", "1", "supporting", "豊", "Mitsuo Iwata",
   "Vendedor de udon en Asakusa. Sale en la primera."],

  ["Tsunojou Oni", "1", "supporting", "角状鬼", "Yoshihisa Kawahara",
   "Demonio cornudo de relleno. Sale en la primera."],

  ["Kamanue", "1", "supporting", "釜鵺", "KENN",
   "Luna Creciente Seis de una escena. Sale en la primera."],

  ["Mukago", "1", "supporting", "零余子", "Kana Ueda",
   "Luna Creciente Cuatro que Muzan fulmina por cobarde. Sale en la primera."],

  ["Shita Oni", "1", "supporting", "舌鬼", "Tarusuke Shingaki",
   "Demonio lengua de la seleccion. Sale en la primera."],

  ["Rokuro", "1", "supporting", "轆轤", "Taiten Kusunoki",
   "Luna Creciente Dos de una escena. Sale en la primera."],

  ["Ozaki", "1", "supporting", "尾崎", "Hisako Toujou",
   "Esposa poseida en Asakusa. Sale en la primera."],

  ["Kaigaku", "1,6", "antagonist", "獪岳", "Yoshimasa Hosoya",
   "Compañero de Zenitsu que se pasa al bando demonio. Luna nueva en el castillo."],

  ["Enmu", "1,2", "antagonist", "魘夢", "Daisuke Hirakawa",
   "Luna Creciente Uno que duerme trenes enteros. Jefe del tren infinito."],

  ["Akaza", "2,3,4,6", "antagonist", "猗窩座", "Akira Ishida",
   "Luna Creciente Tres que mato a Rengoku y vuelve en el castillo. Puños contra espadas."],

  ["Shinjurou Rengoku", "2,3,6", "supporting", "煉獄槇寿郎", "Rikiya Koyama",
   "Padre borracho de Rengoku, ex pilar de la llama. Sale en el tren, en Yuukaku y en el castillo."],

  ["Senjurou Rengoku", "2,3", "supporting", "煉獄千寿郎", "Junya Enoki",
   "Hermano pequeño de Rengoku. Sale en el tren y en Yuukaku."],

  ["Daki", "3", "antagonist", "堕姫", "Miyuki Sawashiro",
   "Luna Creciente Seis, oiran demonio de peinetas cortantes. Mitad del duo del barrio."],

  ["Gyuutarou", "3", "antagonist", "妓夫太郎", "Ryouta Oosaka",
   "Hermano de Daki con hoces envenenadas. La otra mitad del duo del barrio."],

  ["Douma", "3,4,6", "antagonist", "童磨", "Mamoru Miyano",
   "Luna Creciente Dos que sonrie mientras mata. Jefe final de Shinobu en el castillo."],

  ["Yoriichi Tsugikuni", "3,4", "supporting", "継国緑壱", "Kazuhiko Inoue",
   "El cazador original que casi mato a Muzan. Sale en recuerdos de Yuukaku y Herreros."],

  ["Ninju Mukimuki Nezumi", "3", "supporting", "忍にん獣ムキムキねずみ", "Subaru Kimura",
   "Raton ninja musculoso de Tengen. Sale en Yuukaku."],

  ["Makio", "3,5", "supporting", "まきを", "Shizuka Ishigami",
   "Esposa kunoichi de Tengen. Sale en Yuukaku y en el entrenamiento."],

  ["Suma", "3,5", "supporting", "須磨", "Nao Touyama",
   "Esposa llorona de Tengen. Sale en Yuukaku y en el entrenamiento."],

  ["Hinatsuru", "3,5", "supporting", "雛鶴", "Atsumi Tanezaki",
   "Esposa serena de Tengen. Sale en Yuukaku y en el entrenamiento."],

  ["Koinatsu", "3", "supporting", "鯉夏", "Chiwa Saitou",
   "Oiran de la casa Tokito. Sale en Yuukaku."],

  ["Daki no Obi no Oni", "3", "supporting", "堕姫の帯の鬼", "Shizuka Itou",
   "Demonio de la faja de Daki. Sale en Yuukaku."],

  ["Omitsu", "3", "supporting", "お三津", "Kaoru Katakai",
   "Encargada de la casa. Sale en Yuukaku."],

  ["Nakime", "4,5,6", "supporting", "鳴女", "Marina Inoue",
   "Demonio del biwa que mueve el castillo a cuerdas. Sale en Herreros, el entrenamiento y el castillo."],

  ["Kokushibo", "4,6", "antagonist", "黒死牟", "Ryoutarou Okiayu",
   "Luna Creciente Uno con seis ojos y pasado de cazador. El muro del castillo."],

  ["Kotetsu", "4", "supporting", "小鉄", "Ayumu Murase",
   "Niño de la aldea que cuida el muñeco Yoriichi Cero. Sale en Herreros."],

  ["Gyokko", "4", "antagonist", "玉壺", "Kousuke Toriumi",
   "Luna Creciente Cinco de los jarrones vivos. Artista del horror en la aldea."],

  ["Hantengu", "4", "antagonist", "半天狗", "Toshio Furukawa",
   "Luna Creciente Cuatro que se parte en pecados. Jefe de la aldea."],

  ["Yuuichirou Tokitou", "4", "supporting", "時透有一郎", "Kengo Kawanishi",
   "Gemelo de Muichirou, muerto de niño. Sale en Herreros."],

  ["Tecchin Tecchikawahara", "4", "supporting", "鉄地河原鉄珍", "Yuusaku Yara",
   "Jefe de la aldea de los herreros. Sale en Herreros."],

  ["Sumiyoshi", "4", "supporting", "炭吉", "Hirofumi Nojima",
   "Antepasado de Tanjiro que vio bailar a Yoriichi. Sale en Herreros."],

  ["Ginko", "4,5", "supporting", "銀子", "Rie Kugimiya",
   "Niña de la aldea de los herreros. Sale en Herreros y en el entrenamiento."],

  ["Shizu Shinazugawa", "4", "supporting", "不死川志津", "Ryouka Yuzuki",
   "Madre de Sanemi y Genya. Sale en Herreros."],

  ["Tokitou no Chichi", "4", "supporting", "時透の父", "Noriaki Sugiyama",
   "Padre de los gemelos Tokitou. Sale en Herreros."],

  ["Tokitou no Haha", "4", "supporting", "時透の母", "Manami Numakura",
   "Madre de los gemelos Tokitou. Sale en Herreros."],

  ["Tetsuido", "4", "supporting", "鉄井戸", "Atsushi Ono",
   "Herrero veterano de la aldea. Sale en Herreros."],

  ["Kanroji no Chichi", "4", "supporting", "甘露寺の父", "Kenji Nojima",
   "Padre de Mitsuri. Sale en Herreros."],

  ["Kanroji no Haha", "4", "supporting", "甘露寺の母", "Junko Minagawa",
   "Madre de Mitsuri. Sale en Herreros."],

  ["Kagaya no Kasugai Garasu", "5", "supporting", "耀哉の鎹鴉", "Shou Hayami",
   "Cuervo del patron. Sale en el entrenamiento."],

  ["Takeuchi", "5", "supporting", "竹内", "Shouya Chiba",
   "Cazador raso del entrenamiento. Sale en el entrenamiento."],

  ["Koyuki", "6", "supporting", "恋雪", "Lynn",
   "Prometida humana de Akaza en su pasado. Sale en el castillo."],

  ["Keizou", "6", "supporting", "慶蔵", "Yuuichi Nakamura",
   "Maestro de dojo y suegro frustrado de Akaza. Sale en el castillo."],
];
