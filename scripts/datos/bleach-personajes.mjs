// PERSONAJES - Bleach
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// La columna de temporada dice en cuales sale el personaje. Nombres,
// kanji y voces vienen de AniList. Los resumenes son propios, en castellano.

export const PERSONAJES = [
  ['Ichigo Kurosaki', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'main', '黒崎一護', 'Masakazu Morita',
   'El protagonista. Un adolescente que puede ver espíritus y hereda los poderes de Rukia. Impulsivo y protector, lucha primero por su familia y luego por toda la Sociedad de Almas.'],

  ['Rukia Kuchiki', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'main', '朽木ルキア', 'Fumiko Orikasa',
   'Shinigami de la Sociedad de Almas. Le traspasa sus poderes a Ichigo para salvar a su familia y se queda en Karakura como mentora y amiga.'],

  ['Orihime Inoue', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'main', '井上織姫', 'Yuki Matsuoka',
   'Compañera de clase de Ichigo. Tiene poderes de rechazo y curación, y su valentía crece a medida que la guerra la pone a prueba.'],

  ['Uryu Ishida', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'main', '石田雨竜', 'Noriaki Sugiyama',
   'El último Quincy de Karakura. Orgulloso y metódico, empieza como rival de Ichigo y acaba siendo uno de sus aliados más importantes.'],

  ['Yasutora Sado', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'main', '茶渡泰虎', 'Hiroki Yasumoto',
   'Amigo de Ichigo, conocido como Chad. Su fuerza física y su brazo derecho despiertan poderes hollow; habla poco y protege a los suyos sin dudar.'],

  ['Renji Abarai', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'main', '阿散井恋次', 'Kentarou Itou',
   'Teniente del Sexto Escuadrón. Rival de Ichigo al principio, se convierte en uno de sus aliados más fiables y en pareja de Rukia.'],

  ['Kisuke Urahara', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '浦原喜助', 'Shinichirou Miki',
   'El tendero de Karakura. Antiguo capitán del Duodécimo Escuadrón y creador de inventos shinigami; mueve los hilos desde la sombra.'],

  ['Yoruichi Shihoin', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '四楓院夜一', 'Satsuki Yukino',
   'Antigua capitana de la Segunda División. Se transforma en gato y entrena a Ichigo; rápida, sarcástica y decisiva.'],

  ['Isshin Kurosaki', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '黒崎一心', 'Toshiyuki Morikawa',
   'El padre de Ichigo. Esconde su pasado como capitán shinigami y vuelve a la lucha cuando su familia está en peligro.'],

  ['Kon', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', 'コン', 'Mitsuaki Madono',
   'Un alma modificada que acaba en un peluche. Presume, se queja y pone el humor en los momentos más tensos.'],

  ['Tatsuki Arisawa', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '有沢竜貴', 'Junko Noda',
   'Amiga de la infancia de Ichigo. No tiene poderes, pero no se aparta cuando sus amigos están en peligro.'],

  ['Keigo Asano', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '浅野啓吾', 'Katsuyuki Konishi',
   'Compañero de clase de Ichigo. Hablador y exagerado, aporta algo de normalidad a una vida llena de hollows.'],

  ['Yuzu Kurosaki', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '黒崎遊子', 'Ayumi Sena',
   'Hermana pequeña de Ichigo. Cuida la casa y cocina para la familia; sufre en silencio la ausencia de su madre.'],

  ['Karin Kurosaki', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '黒崎夏梨', 'Rie Kugimiya',
   'Hermana de Ichigo. Puede ver espíritus y tiene más carácter que su gemela; practica fútbol y no se deja intimidar.'],

  ['Byakuya Kuchiki', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '朽木白哉', 'Ryoutarou Okiayu',
   'Capitán del Sexto Escuadrón. Frío y orgulloso, cumple la ley por encima de todo hasta que Ichigo le obliga a replantearse sus prioridades.'],

  ['Toshiro Hitsugaya', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '日番谷冬獅郎', 'Romi Park',
   'Capitán del Décimo Escuadrón. Un prodigio con Hyourinmaru; serio y responsable, aunque pierde la calma con Matsumoto.'],

  ['Rangiku Matsumoto', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '松本乱菊', 'Kaya Matsutani',
   'Teniente del Décimo Escuadrón. Alegre y despreocupada en apariencia, es una combatiente experimentada y leal a Hitsugaya.'],

  ['Soi Fon', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '砕蜂', 'Houko Kuwashima',
   'Capitana de la Segunda División y jefa de los asesinos. Rápida y orgullosa, entrena con Yoruichi y no perdona una traición.'],

  ['Kenpachi Zaraki', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '更木剣八', 'Fumihiko Tachiki',
   'Capitán del Undécimo Escuadrón. Busca peleas fuertes y no recuerda el nombre de su zanpakuto; su poder bruto es aterrador.'],

  ['Yachiru Kusajishi', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '草鹿八千流', 'Hisayo Mochizuki',
   'Teniente del Undécimo Escuadrón. Una niña alegre que sigue a Kenpachi y esconde un poder que nadie espera.'],

  ['Genryusai Yamamoto', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '山本元柳斎重國', 'Masaaki Tsukada',
   'Capitán comandante del Gotei 13. El shinigami más antiguo y poderoso; su autoridad sostiene la Sociedad de Almas.'],

  ['Retsu Unohana', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '卯ノ花烈', 'Aya Hisakawa',
   'Capitana del Cuarto Escuadrón. La mejor sanadora y, en secreto, una de las guerreras más peligrosas del Gotei.'],

  ['Mayuri Kurotsuchi', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '涅マユリ', 'Ryuusei Nakao',
   'Capitán del Duodécimo Escuadrón. Científico sin escrúpulos, capaz de todo con tal de experimentar y ganar.'],

  ['Nemu', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '涅ネム', 'Rie Kugimiya',
   'Teniente de Mayuri y su creación. Obediente y silenciosa, demuestra una humanidad que su creador no espera.'],

  ['Jushiro Ukitake', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '浮竹十四郎', 'Hideo Ishikawa',
   'Capitán del Decimotercer Escuadrón. Enfermizo y amable, sostiene a sus subordinados y comparte el peso del Gotei con Kyouraku.'],

  ['Shunsui Kyoraku', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '京楽次郎総蔵佐春水', 'Akio Ootsuka',
   'Capitán del Octavo Escuadrón. Pereza y talento a partes iguales; juego, mujer y sake, pero letal cuando toca.'],

  ['Nanao Ise', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '伊勢七緒', 'Hitomi Nabatame',
   'Teniente de Kyouraku. Seria y organizada, pone orden en el caos de su capitán y domina el kido.'],

  ['Sajin Komamura', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '狛村左陣', 'Tetsu Inada',
   'Capitán del Séptimo Escuadrón. Un hombre lobo leal a Yamamoto; su sentido del honor choca con la crueldad de la guerra.'],

  ['Shuhei Hisagi', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '檜佐木修兵', 'Katsuyuki Konishi',
   'Teniente del Noveno Escuadrón. Serio y marcado por el miedo, empuña Kazeshini y busca su propio camino como shinigami.'],

  ['Izuru Kira', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '吉良イズル', 'Takahiro Sakurai',
   'Teniente del Tercer Escuadrón. Callado y melancólico, sirve a Gin y luego a Rose; su zanpakuto castiga con el peso de la culpa.'],

  ['Momo Hinamori', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '雛森桃', 'Kumi Sakuma',
   'Teniente del Quinto Escuadrón. Leal a Aizen hasta el dolor; su confianza se rompe cuando descubre la traición.'],

  ['Ikkaku Madarame', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '斑目一角', 'Nobuyuki Hiyama',
   'Tercer asiento del Undécimo Escuadrón. Calvo, ruidoso y orgulloso de su bankai; vive para pelear.'],

  ['Yumichika Ayasegawa', '2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '綾瀬川弓親', 'Jun Fukuyama',
   'Quinto asiento del Undécimo. Obsesionado con la belleza, esconde el verdadero poder de su zanpakuto.'],

  ['Hanataro Yamada', '2,3', 'supporting', '山田花太郎', 'Kouki Miyata',
   'Shinigami del Cuarto Escuadrón. Tímido y torpe, pero valiente cuando hay que curar a alguien.'],

  ['Ganju Shiba', '2,3,4,5,16', 'supporting', '志波岩鷲', 'Wataru Takagi',
   'Hermano de Kukaku y enemigo inicial de Ichigo. Impulsivo y leal, ayuda a entrar en el Seireitei.'],

  ['Kukaku Shiba', '2,3,4,5,16', 'supporting', '志波空鶴', 'Akiko Hiramatsu',
   'Hermana de Ganju. Pirotécnica y dura, prepara el cañón que lanza a Ichigo al Seireitei.'],

  ['Ryuken Ishida', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '石田竜弦', 'Ken Narita',
   'El padre de Uryu. Médico y Quincy, frío con su hijo pero consciente del legado que comparten.'],

  ['Tessai Tsukabishi', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'supporting', '握菱テッサイ', 'Kiyoyuki Yanada',
   'Antiguo capitán del Kido y mano derecha de Urahara. Silencioso y enorme, protege la tienda y a los niños.'],

  ['Sosuke Aizen', '2,3,4,5,6,7,8,9,10,11,12,13,14', 'antagonist', '藍染惣右介', 'Shou Hayami',
   'Capitán del Quinto Escuadrón y cerebro de la traición. Su ilusión y su ambición ponen en jaque a toda la Sociedad de Almas.'],

  ['Gin Ichimaru', '2,3,4,5,6,7,8,9,10,11,12,13,14', 'antagonist', '市丸ギン', 'Kouji Yusa',
   'Capitán del Tercer Escuadrón. Sonríe siempre y oculta sus intenciones; su lealtad es tan peligrosa como su zanpakuto.'],

  ['Kaname Tosen', '2,3,4,5,6,7,8,9,10,11,12,13,14', 'antagonist', '東仙要', 'Toshiyuki Morikawa',
   'Capitán del Noveno Escuadrón. Ciego y obsesionado con la justicia, sigue a Aizen por su propia idea de un mundo mejor.'],

  ['Shinji Hirako', '6,7,8,9,10,11,12,13,14,15,16', 'supporting', '平子真子', 'Masaya Onosaka',
   'Antiguo capitán del Quinto Escuadrón. Líder de los Visored, sarcástico y capaz de invertir los sentidos con su zanpakuto.'],

  ['Hiyori Sarugaki', '6,7,8,9,10,11,12,13,14,15,16', 'supporting', '猿柿ひよ里', 'Reiko Takagi',
   'Visored y antigua teniente de Urahara. Pequeña, grosera y con una patada rápida; no aguanta a Shinji.'],

  ['Kensei Muguruma', '6,7,8,9,10,11,12,13,14,15,16', 'supporting', '六車拳西', 'Tomokazu Sugita',
   'Visored y antiguo capitán del Noveno. Serio y directo, usa Tekken Tachikaze para golpear con puños.'],

  ['Mashiro Kuna', '6,7,8,9,10,11,12,13,14,15,16', 'supporting', '久南白', 'Akemi Kanda',
   'Visored y antigua teniente de Kensei. Alegre y flexible, lucha con patadas y una energía interminable.'],

  ['Lisa Yadomaru', '6,7,8,9,10,11,12,13,14,15,16', 'supporting', '矢胴丸リサ', 'Kanako Hattori',
   'Visored y antigua teniente de Kyouraku. Lee, observa y mantiene la cabeza fría; su zanpakuto es un bastón.'],

  ['Hachigen Ushoda', '6,7,8,9,10,11,12,13,14,15,16', 'supporting', '有昭田鉢玄', 'Takashi Nagasako',
   'Visored y antiguo teniente del Kido. Corpulento y amable, domina barreras y sellos.'],

  ['Grimmjow Jaegerjaquez', '6,7,8,10,11,12,14', 'supporting', 'グリムジョー・ジャガージャック', 'Junichi Suwabe',
   'Sexto Espada. Felino, orgulloso y violento; solo quiere pelear contra Ichigo y demostrar quién manda.'],

  ['Ulquiorra Cifer', '6,7,8,9,10,11,12', 'supporting', 'ウルキオラ・シファ', 'Daisuke Namikawa',
   'Cuarto Espada. Frío y nihilista, estudia a Ichigo y a Orihime mientras busca entender el corazón humano.'],

  ['Nnoitra Gilga', '7,8,10,11', 'antagonist', 'ノイトラ・ジルガ', 'Nobutoshi Kanna',
   'Quinto Espada. Busca la muerte en combate y desprecia a los débiles; su fuerza es tan grande como su desesperación.'],

  ['Szayel Aporro Grantz', '7,8,10,11,12', 'antagonist', 'ザエルアポロ・グランツ', 'Kousuke Toriumi',
   'Octavo Espada. Científico y sádico, disfruta experimentando con sus rivales y con sus propias fracciones.'],

  ['Coyote Stark', '10,11,12,14', 'supporting', 'コヨーテ・スターク', 'Rikiya Koyama',
   'Primer Espada. Perezoso y solitario, prefiere no pelear; su poder dispara ceros con una facilidad abrumadora.'],

  ['Tier Harribel', '10,11,12,14', 'supporting', 'ティア・ハリベル', 'Megumi Ogata',
   'Tercera Espada. Seria y protectora con sus fracciones, lucha por un mundo donde los débiles no sean devorados.'],

  ['Baraggan Louisenbairn', '10,11,12,14', 'antagonist', 'バラガン・ルイゼンバーン', 'Shouzou Iizuka',
   'Segundo Espada. El rey del Hueco Mundo, viejo y arrogante; su poder acelera el tiempo hasta la muerte.'],

  ['Yammy Llargo', '6,7,8,9,10,11,12,14', 'antagonist', 'ヤミー・リヤルゴ', 'Kenji Nomura',
   'Décimo Espada. Grande, ruidoso y más fuerte cuando se enfada; su tamaño esconde una fuerza monstruosa.'],

  ['Nelliel', '7,8,10,11,12,14', 'supporting', 'ネリエル・トゥ・オーデルシュヴァンク', 'Tomoko Kaneda',
   'Antigua Tercera Espada. Vuelve convertida en niña y recupera su forma adulta para proteger a Ichigo.'],

  ['Pesche Guatiche', '7,8,10,11,12', 'supporting', 'ペッシェ・ガティーシェ', 'Takehito Koyasu',
   'Arrancar y compañero de Nelliel. Cómico y leal, ayuda a Ichigo en Hueco Mundo.'],

  ['Jin Kariya', '4,5', 'antagonist', 'ジン・カリヤ', 'Tooru Ookawa',
   'Líder de los Bount. Carismático y vengativo, quiere destruir la Sociedad de Almas para que su pueblo deje de esconderse.'],

  ['Koga', '4,5', 'supporting', '古賀 剛', 'Tooru Furusawa',
   'Bount y hermano de Kariya. Más tranquilo, pero igual de peligroso cuando lucha por los suyos.'],

  ['Yoshino', '4,5', 'supporting', '相馬芳野', 'Masako Katsuki',
   'Bount y aliada de Kariya. Su relación con los humanos y con su propio pasado la vuelve ambigua.'],

  ['Shusuke Amagai', '9', 'supporting', 'あまがい体調', 'Kenyuu Horiuchi',
   'Nuevo capitán del Tercer Escuadrón. Llega como un desconocido y esconde un plan propio contra la Sociedad de Almas.'],

  ['Rurichiyo Kasumiouji', '9', 'supporting', '霞大路瑠璃千代', 'Reiko Takagi',
   'Princesa de la casa Kasumiouji. Su vida en Karakura y su herencia la ponen en el centro del arco.'],

  ['Muramasa', '13', 'antagonist', '村正', 'Yuuichi Nakamura',
   'Zanpakuto rebelde. Puede controlar otras zanpakuto y desata la rebelión contra los shinigamis.'],

  ['Sode no Shirayuki', '13', 'supporting', '袖白雪', 'Mie Sonozaki',
   'Zanpakuto de Rukia. Elegante y fría, se materializa durante la rebelión y pone a prueba a su dueña.'],

  ['Senbonzakura', '13', 'supporting', '千本桜', 'Daisuke Hirakawa',
   'Zanpakuto de Byakuya. Se materializa como un samurái y lucha contra su propio dueño por lealtad a Muramasa.'],

  ['Kugo Ginjo', '16', 'antagonist', '銀城空吾', 'Hiroki Touchi',
   'Líder de Xcution. Exshinigami sustituto que enseña a Ichigo el fullbring y esconde sus propias cuentas pendientes.'],

  ['Shukuro Tsukishima', '16', 'antagonist', '月島秀九郎', 'Daisuke Ono',
   'Miembro de Xcution. Su fullbring inserta recuerdos falsos y convierte a los amigos de Ichigo en extraños.'],

  ['Riruka Dokugamine', '16', 'supporting', '毒ヶ峰リルカ', 'Megumi Toyoguchi',
   'Miembro de Xcution. Su fullbring mete objetos y personas dentro de lo que le gusta; caprichosa y peligrosa.'],

  ['Yukio Hans Vorarlberna', '16', 'supporting', '雪绪･ハンス･フォラルルベルナ', 'Mitsuhiro Ichiki',
   'Miembro de Xcution. Un niño genio que controla un mundo digital con su consola.'],

  ['Jackie Tristan', '16', 'supporting', 'ジャッキー・トリスタン', 'Atsuko Yuya',
   'Miembro de Xcution. Su fullbring endurece la suciedad y la convierte en armadura; lucha por dignidad.'],
];
