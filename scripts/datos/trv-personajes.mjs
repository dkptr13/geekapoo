// PERSONAJES - Tokyo Revengers
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Cuarenta y tres. No esta el reparto entero, que en la wiki de personajes
// se acerca a noventa entre vivos y muertos, sino los que tienen peso en
// pantalla: los que cambian la trama y los que se verian raro que no
// estuvieran.
//
// ── DE DONDE VIENEN LOS NOMBRES Y LAS VOCES ───────────────────────
//
// La tabla de personajes de la wikipedia en ingles, que son 34, da el
// nombre en latinocurso (que es el que va en la ficha, porque es como
// lo busca la gente), el japones y el seiyuu.
//
// De esos 34, la inglesa solo lista voz para 24: los que mueren en la
// historia no tienen entrada de voz ahi. Los otros 10 se han sacado de
// la seccion de personajes de la wikipedia en japones, que lista el
// reparto entero. Faltan dos, porque en japones el nombre lleva un
// espacio y el emparejamiento no era exacto: Kakei no, era Makoto
// Suzuki, el 鈴木 マコト.
//
// Los nueve que no estan en la wiki inglesa (Inui, Kokunoi, Kawaragi,
// Akashi, Imaushi, Arashi, Terano y Tachibana Masato) salen de la
// japanese, que los lista en su seccion de reparto y tienen voz.
//
// ── LAS TEMPORADAS ────────────────────────────────────────────────
//
// `''` = sale en todas. `1,2` = solo en esas.
//
// La translated de las temporadas de AniList a las del catalogo no es
// uno a uno. AniList numera cinco partes (la primera de television, la
// de chibi, las dos de 2023 y la de 2026) y el catalogo guarda cuatro,
// porque los capitulos de dos minutos de chibi no se guardan. El
// reparto de abajo viene de AniList con esa correccion.
//
// OJO con la trampa de siempre: con cuatro temporadas, dejar en '' a
// alguien que no sale en la cuarta lo hace aparecer tambien en ella.
// Emma sale en las tres primeras y no en la cuarta, asi que va con
// '1,2,3'; igual pasa con Kisaki y con Hayashida.
//
// ── POR QUE DR AKEN TIENE DOS VOCES ───────────────────────────────
//
// El seiyuu del protagonistico, Tatsuhisa Suzuki, dejo el puesto en
// 2021 por un escándalo. A partir de la segunda parte lo sustituye
// Masaya Fukunishi, y los Blu-ray de la primera se rehicieron con la
// voz nueva. En la ficha va el de la primera, que es el que se oye en
// la temporada 1.
//
// ── EL EJE DE LA SERIE ────────────────────────────────────────────
//
// Takemichi no pelea. Su poder es otro: cuando muere vuelve al pasado,
// y lo unico que sabe es cuando va a morir cada uno. Toda la serie va
// de intentar salvar a gente que no quiere ser salvada, y de lo que
// cuesta cada intento. Por eso casi todos los de la lista mueren, y
// por eso los antagonistas no suelen ser los mas duros sino los que
// tienen un motivo.

export const PERSONAJES = [
  ['Takemichi Hanagaki', '', 'main', '花垣 武道', 'Yuuki Shin',
    'El protagonista. Veintiseis anios sin hacer nada con su vida hasta que ve por television que Hinata y su hermano han muerto. Al tirarse a las vias del tren despierta en 2005, y ese don de volver al pasado le da una sola ventaja: saber lo que va a pasar. No sabe pelear. Solo quiere que nadie muera, y para salvar a alguien tiene que cambiar cosas de mas, y eso le cuesta la vida a alguien.'],

  ['Manjirō Sano', '', 'main', '佐野 万次郎', 'Yū Hayashi',
    'Mikey. El lider de los Tokyo Manji Gang en la epoca en que la historia empieza, y la persona mas fuerte que hay en ese mundo. Va siempre medio paso por delante de la realidad: se le ve la violencia en la cara desde pequeño y con razon. Es el contrapunto de Takemichi, porque a el le basta con golpear una vez y no tiene ningún motivo que se pueda discutir.'],

  ['Ken Ryūgūji', '', 'main', '龍宮寺 堅', 'Tatsuhisa Suzuki',
    'Draken. El numero dos de los Tokyo Manji Gang y el que lleva el grupo cuando Mikey no está. Su fachada de bruto se sostiene en que nunca le han visto fallar, y con razón: es el que decide de verdad. A partir de la segunda parte su voz es la de Masaya Fukunishi, porque Suzuki dejo el papel en 2021 y los Blu-ray de la primera parte se rehicieron con el sustituto.'],

  ['Hinata Tachibana', '', 'main', '橘 日向', 'Azumi Waki',
'La razon por la que todo empieza. Novia de Takemichi en el pasado, y una de las dos personas cuya muerte lo tira a las vías del tren. Es de las pocas a las que se le ve llorar siempre, y cuando se le ve es por trabajo. Se convierte en la razon por la que el tambien pelea, y acaba siendo el objetivo de la cuarta parte.'],

  ['Takashi Mitsuya', '', 'main', '三ツ谷 隆', 'Yoshitsugu Matsuoka',
    'Capitan de la segunda division de los Tokyo Manji Gang en el pasado. En esa epoca es uno de los que mas peso tienen, y en la historia actual es quien revela que el puede volver al pasado. Empieza la serie como alguien que va por su cuenta, matando por lo que le hicieron a Yashiro, y de ahi sale todo el arco de Kazutora.'],

  ['Hakkai Shiba', '', 'main', '柴 八戒', 'Tasuku Hatanaka',
    'El hermano mayor de Taiju. Uno de los que mas ha querido a su hermana Yuzuha y uno de los que peor lo lleva cuando descubre que la han metido en medio de todo. Pasa de no hablar con nadie a ser el que mas se ocupa de los suyos, y su peor error es querer proteger a su hermana y no decirselo a nadie.'],

  ['Shuji Hanma', '', 'antagonist', '半間 修二', 'Takuya Eguchi',
    'Lider de los Rengo. No es sádico por natura: lo que quiere es una guerra de verdad contra los Tokyo Manji Gang, y para llegar hasta donde está dispuesto a matar a quien este en medio aunque sea de los suyos. Es de los pocos antagonistas de la serie que se pueden razonar.'],

  ['Chifuyu Matsuno', '', 'main', '松野 千冬', 'Shō Karino',
    'Deleterio y subcapitán de la primera división. Es quien explica a Takemichi cómo funciona el don de los Hanagaki, sin saber que se lo esta explicando al hombre que lo tiene. Muere pronto y es la muerte que mas cuesta asimilar, porque en el fondo es la primera señal de que volver al pasado no sirve para arreglarlo todo.'],

  ['Izana Kurokawa', '2,3', 'antagonist', '黒川 イザナ', 'Nobunaga Shimazaki',
    'El leader de los Black Dragon. Es la primera persona de la serie que vuelve de entre los muertos y lo hace malísimo: lo que le importa no es ganar, es hacer daño y estar al mando. Sale muerto otra vez en el arco de Arashi y regresa con una energía bastante peor.'],

  ['Kanji Mochizuki', '2,3,4', 'antagonist', '望月 莞爾', 'Toru Inada',
    'Lider de las Jikagumi. El antagonista que tiene el motivo mas claro de todos: el odia los Tokyo Manji Gang porque le hicieron daño a alguien, y su forma de estar enojado es física. Pelea por los suyos y no pide permiso a nadie.'],

  ['Hajime Kokunoi', '', 'antagonist', '九井 一', 'Natsuki Hanae',
    'Kokonoi. Es quien tiene a Hinata fuera de su alcance durante la mayor parte de la historia, y lo hace sin theatricalidad: no amenaza, simplemente está ahí y lo que propone es mejor que lo que tienen. La cuarta parte le devuelve el papel que tenia al principio de la serie.'],

  ['Kakucho', '3,4', 'antagonist', '鶴蝶', 'Seiichiro Yamashita',
    'Kakucho. Va con un batido en la cara que parece de bruto pero la cabeza le funciona mejor que a la mayoría. Es de los antiguos de los Tokyo Manji Gang y de los que mas aguantan cuando el mundo se les cae encima.'],

  ['Ryōhei Hayashi', '', 'main', '林 良平', 'Yukihiro Nozuyama',
    'Capitan de la tercera division. De los que parecen de bulto y se colocan en el sitio clave cuando hace falta. Es la tercera pieza del grupo de los tres capitanes jovenes, junto a Hakkai y a Mitsuya.'],

  ['Kazutora Hanemiya', '1,2', 'main', '羽宮 一虎', 'Shun\'ichi Toki',
    'El que le explica a Takemichi como funciona el viaje en el tiempo. Amigo de Baji, acaba siendo el esqueleto del que cuelga el arco de Tenjiku: su cuerpo es donde viaja la consciencia de Takemichi cuando Andy lo destroza, y por eso sobrevive a cosas que a nadie sobreviven.'],

  ['Keisuke Baji', '1,2', 'main', '場地 圭介', 'Masaaki Mizunaka',
    'Uno de los que hacen funcionar la segunda division. En la segunda temporada se infiltra en los Rengo y lleva toda la parte central sufriendo por tener que traicionar a los suyos. Se arrodilla ante Seiya al final y acepta la muerte como la unica forma de que Hinata salga viva. Es el sacrificio que define la temporada.'],

  ['Taiju Shiba', '2,3', 'supporting', '柴 大寿', 'Tomokazu Sugita',
    'El hermano menor de Hakkai. Va de fuerte y de simple, que es exactamente el problema: no sabe medir la fuerza y acaba siempre en el peor sitio. Muere a manos de Hanma, y es la muerte que hace que Hakkai deje de mirar por otra cosa.'],

  ['Yuzuha Shiba', '2', 'supporting', '柴 柚葉', 'Mikako Komatsu',
    'La hermana pequena de Hakkai y Taiju. Todo el grupo esta alrededor de ella sin que ella lo sepa: es la razon de que Hakkai entre en la pandilla, la que mueve a Yashiro y la que explica buena parte de la primera temporada. Es la razon por la que mucho mas tarde se la puede acusar de casi todo.'],

  ['Atsushi Sendō', '', 'main', '千堂 敦', 'Takuma Terashima',
    'El cuartoDivision. Un tipo al que se le ve mucho el lavoro y poco mas, y que a base de estar siempre esta se acaba convirtiendo en una de las piezas que sostienen el grupo entero. Muere fighting por sus compañeros sin que la cosa parezca un sacrificio: se muere haciendo lo que sabe hacer.'],

  ['Kazushi Yamagishi', '', 'main', '山岸 一司', 'Shouta Hayama',
    'Otro de los capitanes jovenes del pasado. De los que estan siempre ahi, con los que no se habla mucho pero cuya ausencia se nota nada más se les ve. Se le reconoce por hacer las cosas sin que se le reconoce el trabajo.'],

  ['Takuya Yamamoto', '', 'main', '山本 タクヤ', 'Yūya Hirose',
    'El estrellon de la segunda division. Va siempre pegado a quien tiene al lado, y en el fondo la unica aspiration que tiene es estar en ese grupo. Es una de las piezas que hacen que la division parezca un grupo de personas y no un monton de luchadores.'],

  ['Nahoya Kawata', '', 'main', '河田 ナホヤ', 'Kengo Kawanishi',
    'Capitan de la cuarta division, uno de los gemelos. De los que parecen duros por fuera y lo son de verdad, y su unica duda de la serie es si se le puede pedir algo mas de lo que ya da. Se enfrenta a Sanzu en un duelo que es de lo mejor de la primera temporada.'],

  ['Souya Kawata', '', 'main', '河田 ソウヤ', 'Kengo Kawanishi',
    'El otro gemelo. Es el que se queda dos años y medio en la carcel por salvar a su hermano, y eso ya dice bastante de como es. De los que tienen una conviccion que no se les mueve.'],

  ['Haruchiyo Sanzu', '', 'main', '三途 春千夜', 'Nobuhiko Okamoto',
    'El que se encuentra a Yashiro. Es guapo, es del segundo grupo y esta entangled con Yashiro en todo lo que pasa en la division. La muerte de Yashiro lo parte en dos y de ahi sale una de las peleas que marcan la primera temporada.'],

  ['Masataka Kiyomizu', '1', 'antagonist', '清水 将貴', 'Satoshi Hino',
    'El que traiciona al grupo al que dice pertenecer. Es de los antagonistas menos heroicos de la serie y aun asi funciona, porque es el que explica que aqui no hay buena gente que nunca haga esas cosas. Aparece en la primera temporada y no vuelve.'],

  ['Nobutaka Osanai', '1,2', 'supporting', '長内 信高', 'Eiji Takeuchi',
    'Lider de los Amemiya Aishu. Su ambicion es verle el color al poder del barrio, y se mueve en esa linea mientras cuida de su gente. Se encuentra con Takemichi en el peor momento posible.'],

  ['Shinichirō Sano', '', 'main', '佐野 真一郎', 'Masaya Matsukaze',
    'Mano de Mikey y uno de los fundadores de los Black Dragon. El hermano mayor de Mikey y el que le va a encajar las cosas hasta que se le tuercen, que es exactamente lo que pasa.'],

  ['Emma Sano', '1,2,3', 'supporting', '佐野 エマ', 'Yumi Uchiyama',
    'La hermana pequena de Mikey y la unica de la familia que esta en el presente desde el principio. Es de las pocas que no sabe casi nada de lo que ocurre y por eso mismo es de las que mas duro se lleva cuando todo explota.'],

  ['Naoto Tachibana', '', 'main', '橘 直人', 'Ryōta Ōsaka',
    'El hermano de Hinata y el motivo por el que Takemichi se tira a las vias: lo apuñalaron delante de sus ojos y no pudo hacer nada. Toda la tension de la primera temporada esta en que Takemichi sabe que Hinata corre la misma suerte.'],

  ['Tetta Kisaki', '1,2,3', 'antagonist', '稀咲 鉄太', 'Showtaro Morikubo',
    'El que quiere unirse al Tokyo Manji Gang. Lo hace de cerca, haciendo que le caiga bien, y de lejos moviendo a gente desde la segunda division, y esa combinacion es lo que hace que sea peligroso de verdad. Sale del todo en la cuarta parte.'],

  ['Haruki Hayashida', '1,2', 'supporting', '林田 春樹', 'Subaru Kimura',
    'Capitan de la tercera division en el pasado y una de las piezas que hacen que ese grupo parezca una persona. Es uno de los que se Creer el mundo de Mikey sin dudar, y por eso mismo el mas facil de usar.'],

  ['Shion Madarame', '2,3,4', 'antagonist', '斑目 獅音', 'Koki Uchiyama',
    'Uno de los cuatro Tenjiku. Es el que va por delante y no mira atras, y eso le ' +
    'hace el mas peligroso de los cuatro. Cae fighting en el arco de Tenjiku.'],

  ['Ran Haitani', '1,2,3,4', 'antagonist', '灰谷 蘭', 'Daisuke Namikawa',
    'Uno de los cuatro Tenjiku. Va al grano y no hace preguntas, y eso le hace peligroso: no le importa el daño que deja mientras cumpla. Sale en la tercera temporada y es el que fija el nivel de lo que viene.'],

  ['Rindō Haitani', '1,2,3,4', 'antagonist', '灰谷 竜胆', 'Hiroshi Shimo',
    'El hermano de Ran y el otro de los cuatro Tenjiku. Es el más calculador de los dos y el que tiene la cabeza más fría. Cae fighting en el arco de Tenjiku.'],

  ['Seishū Inui', '', 'antagonist', '乾 青宗', 'Junya Enoki',
    'Inui. Va siempre con su hermana Akane delante y es el que la protege de verdad, por encima de todo lo demás. Es de los que ha elegido un bando y va a muerte con él.'],

  ['Akane Inui', '2,3', 'supporting', '乾 赤音', 'Reina Ueda',
    'La hermana de Seishu. Va por delante de él, que es lo contrario de lo que hace su hermano, y por eso chocan. Aparece en la parte de 2023 y es quien explica parte de lo que se sabe del grupo.'],

  ['Senju Kawaragi', '4', 'antagonist', '瓦城 千咒', 'Mariya Ise',
    'Lider de los Tenjiku en la cuarta parte. Es el que lleva la batuta de ese grupo y el que decide a quien se le escucha. Viene de una linea temporal distinta y pelean con reglas que el resto no conoce.'],

  ['Takeomi Akashi', '4', 'antagonist', '明司 武臣', 'Naoyuki Kondo',
    'El numero dos de los Tenjiku. Es el que hace el trabajo pesado del grupo y el que mas veces se encuentra con los de delante. Pelea con una calma que incomoda mas que la fuerza.'],

  ['Wakasa Imaushi', '4', 'antagonist', '今牛 若狭', 'Shinnosuke Tachibana',
    'Otro de los cuatro de la cuarta parte. Va con el grupo desde el principio y es de los que esta en todas las peleas sin ser el protagonista de ninguna.'],

  ['Keizō Arashi', '4', 'antagonist', '荒師 慶三', 'Takanori Hoshino',
    'Lider de la rebelion que da nombre a la cuarta parte. Es un antagonista de manual y aun asi funciona, porque sus razones se sostienen y el lector acaba entendiendo de donde viene.'],

  ['Minami Terano', '4', 'antagonist', '寺野 南', 'Hiroki Yasumoto',
    'El jefe de los Rengo. Viene del Brasil y de Rio, de un barrio pobre de donde no se sale fácil, y eso se le nota en como pelea. Va con el grupo de la rebelion desde el principio.'],

  ['Masato Tachibana', '2', 'supporting', '橘 正人', 'Ryōta Ōsaka',
    'El padre de Hinata y Naoto. Sale poco y por eso duele mas cuando aparece: es un hombre normal al que la serie le ha pasado por encima igual que a los demas. Comparte voz con Naoto porque los hermanos son gemelos.'],
];