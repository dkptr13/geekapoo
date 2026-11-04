// PERSONAJES - Bungo Stray Dogs
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Nombres, kanji y voces vienen de AniList (fichas 21311, 21679,
// 103223, 141249 y 163263). Los resumenes son traducciones de las
// descripciones de AniList, en castellano, con algunas entradas
// escritas a mano para los personajes con ficha muy corta. Se omiten
// los personajes sin imagen o sin voz y los papeles sin entidad.

export const PERSONAJES = [
  ['Atsushi Nakajima', '1,2,3,4,5', 'main', '中島敦', 'Yuuto Uemura',
   'Habilidad: Bestia bajo la luz de la luna. Llegó a Yokohama tras ser expulsado de un orfanato pobre que fue atacado por un tigre devorador de hombres. Al borde de la inanición conoce a Dazai y consigue trabajo en la Agencia de Detectives Armados. Como nunca ha tenido amigos ni familia y siempre le llamaron «inútil», le falta confianza en sí mismo.'],

  ['Osamu Dazai', '1,2,3,4,5', 'main', '太宰治', 'Mamoru Miyano',
   'Habilidad: Ya no es humano. Miembro de la Agencia de Detectives Armados y entusiasta del suicidio que busca un lugar donde morir, aunque no soporta el dolor y fantasea con hacerlo junto a una mujer hermosa. Es esquivo, indiferente y suele bromear, pero cuando habla en serio demuestra una inteligencia y una perspicacia fuera de lo común.'],

  ['Doppo Kunikida', '1,2,3,4,5', 'main', '国木田独歩', 'Yoshimasa Hosoya',
   'Habilidad: El poeta incomparable. Miembro de la Agencia de Detectives Armados. Lleva una libreta con la palabra «Ideal» en la portada y, dentro, apunta las normas con las que quiere vivir. Tiene una personalidad estricta y nada le irrita más que un horario que se rompe. Como socio del imprevisible Dazai, sus problemas no terminan nunca.'],

  ['Ranpo Edogawa', '1,2,3,4,5', 'main', '江戸川乱歩', 'Hiroshi Kamiya',
   'El gran detective de la Agencia de Detectives Armados. Tiene una capacidad de observación extraordinaria, reconocida por sus compañeros, y resuelve casos difíciles a petición de la policía. Su confianza en sí mismo lo hace hablar con descaro y como un niño. Su lema es «¡Si me aceptas, todo saldrá bien!». Le gustan la lógica y los relatos fantásticos.'],

  ['Yukichi Fukuzawa', '1,2,3,4,5', 'main', '福沢諭吉', 'Rikiya Koyama',
   'Habilidad: Todos los hombres son iguales. Presidente de la Agencia de Detectives Armados, que mantiene a raya a un grupo de excéntricos. Aunque no suele salir de la oficina, en los momentos críticos toma el mando con autoridad. Su dignidad y su presencia bastan para que incluso el caprichoso Ranpo obedezca.'],

  ['Chuuya Nakahara', '1,2,3,4,5', 'main', '中原中也', 'Kishou Taniyama',
   'Chuuya es un miembro de la Port Mafia que detesta a Osamu Dazai por traicionar a la mafia y unirse a la Agencia de Detectives Armados. Dazai se burla de él constantemente, lo que alimenta aún más su odio. Chuuya es bajo pero rápido, y pelea con una fuerza descomunal.'],

  ['Ryuunosuke Akutagawa', '1,2,3,5', 'main', '芥川龍之介', 'Kenshou Ono',
   'Habilidad: Rashomon. Miembro de la Port Mafia que opera en el puerto. Tiene una visión del mundo en blanco y negro basada en la supervivencia del más fuerte, y sostiene que los débiles deben morir para dejar paso a los demás. Le gustan las antigüedades, el té y los higos; no soporta los bonsáis, los perros ni los baños.'],

  ['Fyodor Dostoyevsky', '2,3,4,5', 'antagonist', 'フョードル・ドストエフスキー', 'Akira Ishida',
   'Habilidad: Crimen y castigo. Jefe de la organización clandestina Ratas en la Casa de los Muertos y parte de la organización terrorista Decadencia de los Ángeles. Mantiene una personalidad tranquila, confiada y arrogante, pero educada con los demás, y ha demostrado ser extremadamente inteligente, astuto y siniestro.'],

  ['Oochi Fukuchi', '4,5', 'antagonist', '福地桜痴', 'Akio Ootsuka',
   'Habilidad: León de espejo. Es el comandante de las unidades especiales de los Perros de Caza. En realidad dirige la organización terrorista Decadencia de los Ángeles bajo el alias de Kamui.'],

  ['Akiko Yosano', '1,2,3,4,5', 'supporting', '与謝野晶子', 'Yuu Shimamura',
   'Habilidad: No morirás. Es una mujer de melena corta y miembro de la Agencia de Detectives Armados. Aunque es una doctora excelente e indispensable para la agencia, todos sus compañeros temen pasar por su consulta. No conviene usar expresiones machistas delante de ella.'],

  ['Junichirou Tanizaki', '1,2,3,4,5', 'supporting', '谷崎潤一郎', 'Toshiyuki Toyonaga',
   'Habilidad: Nieve ligera. Es miembro de la Agencia de Detectives Armados y hermano mayor de Naomi. Su habilidad le permite proyectar ilusiones y cambiar la apariencia de las cosas.'],

  ['Kenji Miyazawa', '1,2,3,4,5', 'supporting', '宮沢賢治', 'Hiroyuki Kagura',
   'Habilidad: Invicto por la lluvia. Miembro de la Agencia de Detectives Armados. Antes de ser descubierto vivía en una zona rural sin electricidad. No conoce la desconfianza y se muestra comprensivo y considerado con cualquiera. Tiene muchos amigos que lo llaman «Ken-chan». Le gustan la música, la tempura soba y la sidra Mitsuya.'],

  ['Kyouka Izumi', '1,2,3,4,5', 'supporting', '泉鏡花', 'Sumire Morohoshi',
   'Es una joven dócil que viste un kimono, pero también pertenece a la Port Mafia. La organización la encontró por su capacidad para matar y la crió como asesina. Su habilidad, Demonio de nieve, le permite invocar un espíritu con el que combate.'],

  ['Naomi Tanizaki', '1,2,3', 'supporting', '谷崎ナオミ', 'Chiaki Omigawa',
   'Naomi Tanizaki es miembro de la Agencia de Detectives Armados y hermana menor de Junichirou. Se muestra abiertamente cariñosa con su hermano, hasta el punto de incomodar a los demás.'],

  ['Michizou Tachihara', '1,2,3,4,5', 'supporting', '立原道造', 'Yuu Hayashi',
   'Habilidad: Recuerdo de pleno invierno. Es comandante de los Lagartos Negros, el escuadrón de sicarios de la Port Mafia. Aunque se muestra duro y violento, se preocupa profundamente por sus amigos. Es un artillero muy hábil, sobre todo cuando usa dos armas.'],

  ['Ryuurou Hirotsu', '1,2,3,4,5', 'supporting', '広津柳浪', 'Atsushi Ono',
   'Habilidad: Camelia que cae. Miembro de la Port Mafia y capitán de la unidad de asalto Lagartos Negros. Su habilidad hace que las cosas que toca salgan despedidas hacia atrás con una fuerza inmensa.'],

  ['Gin Akutagawa', '1,2,3,4', 'supporting', '芥川銀', 'Shiina Natsukawa',
   'Hermana menor de Ryuunosuke y miembro de la unidad de asalto Lagartos Negros. Parece llevarse bien con Dazai. Se mueve con rapidez y casi nunca muestra el rostro.'],

  ['Ougai Mori', '1,2,3,4,5', 'supporting', '森鷗外', 'Mitsuru Miyamoto',
   'Habilidad: Vita Sexualis. Ougai Mori es el jefe de la Port Mafia. Es analítico y táctico, y aunque a menudo actúa de forma demasiado dramática, rara vez pierde la compostura. Se ha mostrado despiadado e inquebrantable cuando hay violencia de por medio, pero sin disfrutar especialmente de matar: su crueldad nace de su pragmatismo.'],

  ['Elise', '1,2,3,4', 'supporting', 'エリス', 'Sora Amamiya',
   'Niña que suele acompañar a Ougai Mori. En realidad es la manifestación de su habilidad, Vita Sexualis, y cambia de aspecto y de edad según lo que Mori necesite.'],

  ['Kouyou Ozaki', '2,3', 'supporting', '尾崎紅葉', 'Ami Koshimizu',
   'Habilidad: Demonio dorado (金色夜叉, Konjiki Yasha). Es miembro ejecutiva de la Port Mafia y una de las personas de mayor confianza de Mori. Protege a Kyouka y trata de devolverla a la organización.'],

  ['Motojirou Kajii', '1,2,3', 'supporting', '梶井基次郎', 'Wataru Hatano',
   'Miembro de la Port Mafia. Es el atacante buscado por la explosión del edificio Maruzen. Se considera un científico entusiasta y se jacta de que la «muerte» es el «experimento definitivo».'],

  ['Ichiyou Higuchi', '1,2,3', 'supporting', '樋口一葉', 'Asami Seto',
   'Es una mujer bella e inteligente que viste pantalones. Pertenece a una unidad de mando que responde ante el líder de la Port Mafia y tiene autoridad sobre el grupo militar Lagartos Negros. Adora a Akutagawa y lo llama «senpai».'],

  ['Kirako Haruno', '2', 'supporting', '春野綺羅子', 'Mina Kasai',
   'Kirako Haruno es la recepcionista de la Agencia de Detectives Armados. Se ocupa de los clientes y del papeleo, y es una de las pocas personas que mantiene la oficina en orden.'],

  ['Katai Tayama', '3,5', 'supporting', '田山花袋', 'Kenichi Suzumura',
   'Habilidad: Futón. Es un intermediario de información para la Agencia de Detectives Armados. Solía ser miembro de la agencia y conoce a Kunikida desde hace diez años.'],

  ['Minoura', '1,2,4,5', 'supporting', '箕浦', 'Hiroshi Shirokuma',
   'Miembro de la policía japonesa. Sucesor de Yasui, con quien Ranpo había trabajado anteriormente en varios casos.'],

  ['Edgar Poe', '2,3,4,5', 'supporting', 'エドガー・アラン・ポオ', 'Toshiyuki Morikawa',
   'Habilidad: Gato negro en la Rue Morgue. Es un miembro del Gremio al que rara vez se le ve sin su mapache, Karl. Su habilidad puede transportar a alguien al interior de una historia que esté leyendo. Poe es tímido pero decidido, y pasó seis años tramando cómo derrotar a Ranpo.'],

  ['Lucy Montgomery', '1,2,3,4,5', 'supporting', 'ルーシー・モード・モンゴメリ', 'Kana Hanazawa',
   'Es miembro del Gremio. Su habilidad se conoce como Ana del Rojo Abisal y le permite arrastrar a sus enemigos a una habitación de la que no pueden escapar.'],

  ['Francis Fitzgerald', '1,2,3,4', 'supporting', 'フランシス・スコット・キー・フィッツジェラルド', 'Takahiro Sakurai',
   'Habilidad: El Gran Fitzgerald. Se hace pasar por el líder de una sociedad secreta estadounidense, el Gremio, compuesta por individuos ricos y notorios con una influencia poderosa en Estados Unidos. Su habilidad convierte el dinero en fuerza.'],

  ['Nathaniel Hawthorne', '2,3,4', 'supporting', 'ナサニエル・ホーソーン', 'Tarusuke Shingaki',
   'Habilidad: La letra escarlata. Convierte su propia sangre en palabras sagradas y las controla. Es un hombre profundamente religioso que odia el diablo y la herejía.'],

  ['Howard Lovecraft', '2', 'supporting', 'ハワード・フィリップス・ラヴクラフト', 'Shunsuke Takeuchi',
   'Habilidad: Los Primigenios. Es un miembro del Gremio. Su nombre es una referencia a H. P. Lovecraft, el autor estadounidense que alcanzó la fama póstuma con sus influyentes relatos de terror.'],

  ['Louisa May Alcott', '2,3,4', 'supporting', 'ルイーザ・メイ・オルコット', 'Hikaru Ueda',
   'Habilidad: Mujercitas. Es la estratega del Gremio y su habilidad le permite reducir el tiempo a 1/8000 de la velocidad normal, aunque solo funciona cuando está sola en su habitación privada.'],

  ['Mark Twain', '2', 'supporting', 'マーク・トウェイン', 'Hiroyuki Yoshino',
   'Mark Twain es un miembro del Gremio que ataca a la agencia con su habilidad de disparar a distancia. Es impulsivo y confía ciegamente en su puntería.'],

  ['John Steinbeck', '2', 'supporting', 'ジョン・スタインベック', 'Kengo Kawanishi',
   'John Steinbeck es un miembro del Gremio con la habilidad de controlar plantas. Su lealtad a Fitzgerald lo lleva a pelear contra la agencia.'],

  ['Herman Melville', '2', 'supporting', 'ハーマン・メルビル', 'Takayuki Sugou',
   'Es un miembro veterano del Gremio y su habilidad es Moby-Dick.'],

  ['Margaret Mitchell', '2', 'supporting', 'マーガレット・ミッチェル', 'Kaori Nazuka',
   'Aprendiz del Gremio. Habilidad: Lo que el viento se llevó, que le permite erosionar y descomponer materiales con el viento. Le gustan ella misma, el amor y el mañana; odia la guerra y la traición.'],

  ['Andre Gide', '2', 'supporting', 'アンドレ・ジッド', 'Shinichirou Miki',
   'Líder de Mimic, una organización criminal europea. Sus actos durante La época oscura lo convierten en uno de los principales enemigos de la Port Mafia y de Dazai.'],

  ['Kyuusaku Yumeno', '2', 'supporting', '夢野久作', 'Haruka Kudou',
   'Habilidad: Dogra Magra. Es miembro de la Port Mafia. Su habilidad maldice a sus objetivos destrozando su conciencia con alucinaciones, hasta hacerles atacar a todo el que tienen delante.'],

  ['Ango Sakaguchi', '2,3,4,5', 'supporting', '坂口安吾', 'Jun Fukuyama',
   'Habilidad: Discurso sobre la decadencia. Antiguo informante exclusivo de la Port Mafia, ahora trabaja como consejero asistente en el Departamento de Habilidades Especiales del Ministerio del Interior. Es un joven tranquilo y sereno, con más moderación que Dazai y más disciplina que Oda, aunque valora a ambos como amigos de verdad.'],

  ['Sakunosuke Oda', '2,4', 'supporting', '織田作之助', 'Junichi Suwabe',
   'Habilidad: Impecable. Era miembro de la Port Mafia. Dazai lo describía como un hombre amable a pesar de trabajar para la mafia. Tenía un lado muy perspicaz que le permitió comprender a Dazai, a quien llamaba «su querido amigo, cansado del mundo y esperando simplemente morir».'],

  ['Arthur Rimbaud', '3', 'supporting', 'アーサー・ランボー', 'Yuuya Uchida',
   'Habilidad: Iluminaciones. Junto con su compañero Paul Verlaine, vino de Europa para infiltrarse en el ejército japonés y espiar y robar el misterioso proyecto Arahabaki.'],

  ['Ace', '3', 'supporting', 'エース', 'Daisuke Ono',
   'Ace es un ejecutivo de la Port Mafia que dirige una casa de subastas de habilidades. Su ambición y su crueldad lo convierten en uno de los enemigos más peligrosos del arco de Kyouka.'],

  ['Karma', '3', 'supporting', 'カルマ', 'Miyu Irino',
   'Karma es un miembro de la Port Mafia con una habilidad basada en el juego. Aparece en el pasado de Kyouka y en los enfrentamientos entre la agencia y la mafia.'],

  ['Ivan Goncharov', '3', 'supporting', 'イバンゴンチャロフ', 'Kousuke Toriumi',
   'Ivan es un subordinado de Fyodor Dostoyevsky. Su habilidad le permite controlar la gravedad y lo convierte en una pieza clave de los planes del villano.'],

  ['Shirase Buichirou', '3', 'supporting', '白瀬撫一郎', 'Masaaki Mizunaka',
   'Shirase fue el líder de los niños que crecieron con Kyouka en la Port Mafia. Su intento de huir con ella marcó el pasado de ambos y vuelve a cruzarse en su camino.'],

  ['Yamagiwa', '1', 'supporting', '山際', 'Yumi Uchiyama',
   'Era una oficial de policía asesinada cuyo cuerpo apareció flotando en el río. Ranpo Edogawa, junto con Atsushi y Dazai, investigó su caso para la Agencia de Detectives Armados.'],

  ['Rokuzou Taguchi', '1', 'supporting', '田口六蔵', 'Kaito Ishikawa',
   'Rokuzou Taguchi es un joven que colabora con el bombardero del primer caso de la agencia. Su admiración por Dazai lo pone en una situación imposible.'],

  ['Nobuko Sasaki', '1', 'supporting', '佐々城信子', 'Sanae Kobayashi',
   'Nobuko Sasaki es una mujer que aparece en el caso del mensajero azul. Su relación con un antiguo miembro de la agencia revela el origen de una venganza que pone en peligro a Yokohama.'],

  ['Nikolai Gogol', '4,5', 'supporting', 'ニコライ・ゴーゴリ', 'Takehito Koyasu',
   'Habilidad: El abrigo. Nikolai Gogol es miembro de la Decadencia de los Ángeles. Es un sádico al que le gusta montar un espectáculo con sus palabras: extraño, vigoroso, impenitente y bastante enigmático. Él mismo sugiere que su peculiar imagen puede ser real o no.'],

  ['Sigma', '4,5', 'supporting', 'シグマ', 'Shouya Chiba',
   'Sigma es miembro de la organización terrorista Decadencia de los Ángeles y propietario del Sky Casino. Su habilidad es desconocida, pero Fyodor afirma que es el más débil de los Ángeles. Puede que esté más orientado al apoyo que al combate. Se muestra muy amable con sus clientes y siente un gran orgullo por su casino.'],

  ['Mushitarou Oguri', '4', 'supporting', '小栗虫太郎', 'Takeshi Kusao',
   'Habilidad: El crimen perfecto. Es miembro de las Ratas en la Casa de los Muertos y altera las escenas de sus crímenes para que parezcan imposibles de resolver. Su pasado lo conecta con Ranpo y con Fyodor.'],

  ['Tecchou Suehiro', '4,5', 'supporting', '末広鉄腸', 'Youhei Azakami',
   'Habilidad: Flores de ciruelo en la nieve. Tecchou Suehiro es miembro de la unidad especial Perros de Caza. Tiene un comportamiento mucho más serio que sus compañeros, pero sigue siendo un bicho raro por sus extrañas preferencias gastronómicas. Se toma su deber muy en serio y posee un profundo sentido de la justicia; detesta la tortura.'],

  ['Saigiku Jouno', '4,5', 'supporting', '条野採菊', 'Yuuki Kaji',
   'Habilidad: Lágrimas sin precio. Saigiku Jouno es uno de los miembros más letales de los Perros de Caza. Su oído sobrehumano y su gusto por el castigo lo enfrentan directamente a la agencia.'],

  ['Teruko Ookura', '4,5', 'supporting', '大倉燁子', 'Makoto Koichi',
   'Habilidad: Suspiro del alma. Teruko Ookura es la vicecomandante de las unidades especiales de los Perros de Caza. Sirve a Fukuchi con lealtad absoluta y su habilidad le permite manipular la edad de cualquiera que toque.'],

  ['Tokio Murakami', '4', 'supporting', '村上時雄', 'Hiro Shimono',
   'Tokio Murakami es el actor principal de la obra «El mundo vivo es un sueño, el sueño nocturno es la realidad», representada en el Theatrum Mundi.'],

  ['Aya Koda', '5', 'supporting', '幸田文', 'Minako Kotobuki',
   'Aya Koda es una niña que ayuda a Kunikida con un caso y que termina admirando a Bram Stoker. Su valentía y su capacidad para hablar con Bram cambian el rumbo de la guerra contra la Decadencia de los Ángeles.'],

  ['Bram Stoker', '5', 'supporting', 'ブラム・ストーカー', 'Kenjirou Tsuda',
   'Bram Stoker es un vampiro y miembro vital de la Decadencia de los Ángeles. Su habilidad, sin nombre, convierte en vampiros no muertos a quienes muerde, incluso si están al borde de la muerte. Su relación con Aya lo lleva a rebelarse contra sus captores.'],
];
