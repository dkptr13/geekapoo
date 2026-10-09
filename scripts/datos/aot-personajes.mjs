// PERSONAJES - Ataque a los Titanes
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// `temporada`:
//
//   ''  = COMPARTIDO. Sale en todas las temporadas y el array se
//         deja vacio, que es como lo lee la wiki (`seasonIdsDe`):
//         lista vacia significa "esta en todas".
//   1,7 = solo en esas. Los numeros son los del CATALOGO, que no
//         coinciden con los de la serie: la 1 es la primera
//         temporada de 2013, la 3 es la primera parte de la tercera
//         de 2018, y la 5 es "The Final Season".
//
// Que un personaje no salga en una parte es lo que hace que la ficha
// no lo muestre en capitulos donde no aparece, asi que la lista
// importa: un array vacio puesto por descuido lo enseña en las siete.
//
// `voz` es el seiyuu japones. El campo del proyecto es `voiceActor`
// y no lleva pais, asi que se deja el nombre japones tal cual.
//
// ── EL REPARTO ────────────────────────────────────────────
//
// Sale de la lista de personajes de Wikipedia, que da el seiyuu
// japones de cada uno. No estan TODOS los de la serie: se han
// descartado los que no tienen voz (el padre de Historia, los nobles
// sin hablar y los titánes puros) y los que solo aparecen en un
// fotograma.
//
// El rol sigue los tres valores del panel: `main` para quien sostiene
// la trama, `supporting` para el resto de los que tienen nombre, y
// `antagonist` para quien se opone de verdad. Reiner y Zeke acaban
// siendo `main` y no `antagonist` porque pasan mas de media serie
// como parte del grupo principal.

const TODAS = '';

// ── Compartidos: salen en las siete temporadas ────────────
const COMPARTIDOS = [
  ['Eren Yeager', '', 'main', 'エレン・イェーガー', 'Yuki Kaji',
   'El protagonista. Ve morir a su madre en la boca de un titán a los diez años y se pasa el resto de su vida intentando arreglar eso. Termina siendo el villano.'],
  ['Mikasa Ackerman', '', 'main', 'ミカサ・アッカーマン', 'Yui Ishikawa',
   'La mejor soldado del cuerpo. Es la más fuerte del elenco y la que más cuesta matar, porque lo que sabe de sí misma la ata al mundo más de lo que la ata a él.'],
  ['Armin Arlert', '', 'main', 'アルミン・アルレルト', 'Marina Inoue',
   'El que piensa. Sin fuerza para pelear, gana la guerra con estrategia, y hacia el final acaba siendo el más bueno de todos.'],
  ['Levi Ackerman', '', 'main', 'リヴァイ・アッカーマン', 'Hiroshi Kamiya',
   'El soldado más fuerte de la historia de la serie. Limpio, tranquilo y completamente inutil para cualquier conversación.'],
  ['Reiner Braun', '', 'main', 'ライナー・ブラウン', 'Yoshimasa Hosoya',
   'Titán acorazado de Marley infiltrado en el cuerpo de exploración. Antagonista durante tres temporadas y uno de los más buenos al final.'],
  ['Jean Kirstein', '', 'main', 'ジャン・キルシュタイン', 'Kishō Taniyama',
   'El que siempre dice lo que piensa. Quería vivir una vida tranquila en el interior y se pasa la serie entera decidiendo que no puede.'],
  ['Connie Springer', '', 'main', 'コニー・スプリンガー', 'Hiro Shimono',
   'El más bromista del grupo 104. Termina el último y se reencuentra con su madre, que creyó muerto desde niño.'],
  ['Sasha Blouse', '', 'main', 'サシャ・ブラウス', 'Yū Kobayashi',
   'Cazadora y la mejor tiradora del grupo. Muere probablemente en una barca al otro lado del mar, y su muerte es lo que saca a la gente del formalismo.'],
  ['Annie Leonhart', '1,4,5,6,7', 'main', 'アニ・レオンハート', 'Yū Shimamura',
   'Titán hembra y tercera de su clase en la del 104. De las cuatro infiltradas, la que peor lleva ser la única que no se arrepiente.'],
  ['Historia Reiss', '', 'main', 'ヒストリア・レイス', 'Shiori Mikami',
   'La heredera del trono de Eldia que no lo sabía hasta que se lo dijeron. Reina desde los diecisiete y el personaje que mas cargar se le echa encima.'],
  ['Ymir', '1,2,4', 'supporting', 'ユミル', 'Saki Fujita',
   'Del grupo 104, la que siempre va por detrás. Es la causa de que Historia pueda reír, y su propia historia es de las peores de la serie.'],
  ['Bertholdt Hoover', '', 'supporting', 'ベルトルト・フーバー', 'Tomohisa Hashizume',
   'Titán colosal. El más callado de los cuatro infiltrados y el que peor lo lleva, porque los otros tres no paran de hablar de él.'],
  ['Pieck Finger', '4,5,6,7', 'main', 'ピーク・フィンガー', 'Manami Numakura',
   'Titán carro de Marley. Lista y pragmática hasta el último momento, y la última superviviente de su país.'],
  ['Zeke Yeager', '2,3,4,5,6,7', 'main', 'ジーク・イェーガー', 'Takehito Koyasu',
   'Titán bestia, hermano mayor de Eren y jefe de los guerreros de Marley. Quiere salvar al mundo de una forma que nadie le pidió.'],
  ['Floch Forster', '1,3,4,5,6,7', 'supporting', 'フロック・フォルスター', 'Kenshō Ono',
   'Del grupo 104, el que peor lleva que el mundo de fuera exista. Se convierte en el más peligroso de Paradis sin quererlo.'],
  ['Hange Zoë', '', 'main', 'ハンジ・ゾエ', 'Romi Park',
   'La científica del cuerpo. Se pasa media serie con los ojos puestos en un titán que quiere capturar vivo, y después lleva el país entero.'],
  ['Keith Shadis', '1,2,3,4,5,6', 'supporting', 'キース・シャーディス', 'Tsuguo Mogami',
   'El instructor del grupo 104, y el único que de verdad era militar de carrera. Muere sin decir nada en un bosque, con un grupo de críos que ni lo querían.'],
  ['Erwin Smith', '1,2,3,4,6,7', 'main', 'エルヴィン・スミス', 'Daisuke Ono',
   'El comandante del cuerpo de exploración. Apuesta la vida de sus hombres sin pestañear y saca un golpe de estado con ello.'],
];

// ── Segunda temporada ─────────────────────────────────────
const SOLO_S2 = [
  ['Rod Reiss', '3', 'antagonist', 'ロッド・レイス', 'Yusaku Yara',
   'El verdadero rey de los muros, escondido detrás de un títere coronado. Es el que de verdad mueve los hilos durante toda la serie.'],
  ['Darius Zackly', '1,2,3,5', 'supporting', 'ダリス・ザックレー', 'Hideaki Tezuka',
   'El mando militar del país. El único que se atreve a decir en voz alta lo que todo el mundo sabe del rey.'],
  ['Kenny Ackerman', '2', 'supporting', 'ケニー・アッカーマン', 'Kazuhiro Yamaji',
   'El tío de Levi y uno de los hombres más fuertes del mundo. Trabaja para la familia real y va por su cuenta.'],
  ['Traute Carven', '3', 'supporting', 'トラウテ・カーフェン', 'Saori Terai',
   'La mano derecha de Kenny, y la única que se atendía a él de verdad.'],
  ['Nile Dok', '1,2,3,6', 'supporting', 'ナイル・ドーク', 'Anri Katsu',
   'Jefe de la policía militar. Pide que maten a Eren en el juicio y acaba siendo uno de los que sostienen el golpe de estado.'],
  ['Marlowe Freudenberg', '1,2,3,4,6', 'supporting', 'マルロ・フロイデンベルク', 'Tomokazu Sugita',
   'Policía militar joven y con las ideas en su sitio. Se pasa al cuerpo de exploración y muere en Shiganshina sin entender por qué.'],
  ['Hitch Dreyse', '', 'supporting', 'ヒッチ・ドリス', 'Akeno Watanabe',
   'La compañera de piso de Annie, la que la molesta y la que la ayuda. Todo el mundo cree que no le importa y le importa mucho.'],
  ['Boris Feulner', '2', 'supporting', 'ボリス・フォイルナー', 'Yūichi Karasuma',
   'El único de su escuadra que trata a Annie como a una igual. Le cuenta de paso lo poco que sabe de los demás.'],
  ['Minister Nick', '2', 'supporting', 'ニック司祭', 'Tomohisa Asō',
   'El sacerdote que sabe qué hay dentro de los muros y se niega a decirlo. Lo torturan hasta matarlo por eso.'],
];

// ── Primera y segunda ─────────────────────────────────────
const S1_Y_S2 = [
  ['Marco Bott', '1', 'supporting', 'マルコ・ボット', 'Ryōta Ōsaka',
   'Séptimo de su clase y el que más quería una vida tranquila. Lo matan por ver algo que no debía ver, y su muerte le cambia la vida a media clase.'],
  ['Petra Ral', '1', 'supporting', 'ペトラ・ラル', 'Natsuki Aikawa',
   'De la escuadra de Levi, y una de las cuatro que mueren en el bosque sin llegar a saber lo que viene después.'],
  ['Eld Jinn', '1', 'supporting', 'エルド・ジン', 'Susumu Chiba',
   'El segundo de Levi, con el mejor historial de la escuadra. Muere primero y en silencio, como el resto.'],
  ['Oluo Bozado', '1', 'supporting', 'オルオ・ボザド', 'Shinji Kawada',
   'El que más presume de la escuadra, y el que más se burla de sí mismo al hacerlo.'],
  ['Günther Schultz', '1', 'supporting', 'グンタ・シュルツ', 'Kozo Mito',
   'El callado de la escuadra de Levi. Muere en el bosque de manos de alguien que llevaba meses hablando con su grupo.'],
  ['Rico Brzenska', '1', 'supporting', 'リコ・ブレツェンスカ', 'Michiko Kaiden',
   'La capitana que había dejado a medio grupo muerto en Trost para poder seguir mandando.'],
  ['Ilse Langnar', '1', 'supporting', 'イルゼ・ラングナー', 'Sachi Kokuryu',
   'La soldado cuyo cuaderno aparece dentro de un árbol en el OAD. Es la primera prueba de que un titán puede hablar.'],
  ['Hannes', '1,2', 'supporting', 'ハンネス', 'Keiji Fujiwara',
   'El sargento de la guarnición que le salvó la vida a Eren siendo niño. Muere cubriendo la retirada de Shiganshina, que es lo que le pide.'],
  ['Dot Pixis', '1,2,3,5,6', 'supporting', 'ドット・ピクシス', 'Masahiko Tanaka',
   'El comandante más raro del ejército: calvo, con bigote y pésimas ideas. Es el que monta el golpe de estado junto con Zackly.'],
  ['Mike Zacharias', '1,2,7', 'supporting', 'ミケ・ザカリアス', 'Kenta Miyake',
   'El jefe de escuadra que se huele a la gente. Se ofrece como señuelo y se lo comen mientras los demás escapan.'],
  ['Moblit Berner', '1,2,4,7', 'supporting', 'モブリット・バーナー', 'Rintarō Nishi',
   'El que evita que Hange se mate, que es literalmente su trabajo. Muere cubriendo a Hange en Shiganshina.'],
  ['Nanaba', '1,2', 'supporting', 'ナナバ', 'Asami Shimoda',
   'Soldado del cuerpo que sobrevive a la 57.ª expedición y muere en Utgard protegiendo a un grupo de reclutas.'],
  ['Carla Yeager', '1,6,7', 'supporting', 'カルラ・イェーガー', 'Yoshino Takamori',
   'La madre de Eren, que muere entre los escombros de su casa suplicándole que no se meta en el cuerpo.'],
  ['Louise', '1,5,6', 'supporting', 'ルイーゼ', 'Mariko Nagai',
   'La niña de Trost a la que Mikasa le habla durante el asedio. Se hace soldado y muere por liberar a su ídolo.'],
];

// ── Cuarta a sexta: el sótano y sus consecuencias ─────────
const S4_A_S6 = [
  ['Grisha Yeager', '1,3,4,5,6,7', 'supporting', 'グリシャ・イェーガー', 'Hiroshi Tsuchida',
   'El padre de Eren y el hombre más misterioso de la serie. Durante tres temporadas el público cree que es un médico cobarde, y después se entiende por qué hacía lo que hacía.'],
  ['Eren Kruger', '4,5,6,7', 'supporting', 'エレン・クルーガー', 'Yasunori Matsumoto',
   'Titán de ataque antes que Grisha, y uno de los pocos que sabía lo que pasaba en el mundo de verdad.'],
  ['Dina Yeager', '1,2,4,5,6,7', 'supporting', 'ダイナ・イェーガー', 'Nozomi Kishimoto',
   'La primera esposa de Grisha y la madre de Zeke. Se come a Carla sin saberlo, y eso es lo que enciende todo.'],
  ['Marcel Galliard', '5,6,7', 'supporting', 'マルセル・ガリアード', 'Masamichi Kitada',
   'El jefe de los cuatro guerreros de Marley, y el hermano mayor de Porco. Lo comió Ymur sin haber hecho nada malo, y ese es el origen de casi todo.'],
  ['Frieda Reiss', '3,6', 'supporting', 'フリーダ・レイス', 'Yōko Hikasa',
   'La portadora de la Coordenada. Se refugia en una iglesia el día que cae el muro y de ahí no sale con vida.'],
  ['Ymir Fritz', '6,7', 'supporting', 'ユミル・フリッツ', 'Chiyuki Miura',
   'La primera portadora del poder de los titanes, que lleva dos mil años atrapada en los Caminos. Es la única de la serie que puede decir que no.'],
];

// ── Quinta a séptima: Marley, la alianza y el final ────────
const S5_A_S7 = [
  ['Theo Magath', '5,6,7', 'supporting', 'テオ・マガト', 'Jiro Saito',
   'El mando de la unidad eldiana de Marley. Es racista como todos los de allí y aun así es el primero en pedir la paz cuando ya no queda otra.'],
  ['Yelena', '2,3,4,5,6,7', 'supporting', 'イェレナ', 'Mitsuki Saiga',
   'Fanática de Zeke hasta el punto de matar a su propio comandante. Es la que explica la guerra a Paradis y la que no se arrepiente de nada.'],
  ['Gabi Braun', '5,6,7', 'supporting', 'ガビ・ブラウン', 'Ayane Sakura',
   'La candidata a guerrera más celosa de su generación y la prima de Reiner. Empieza como la enemiga más fanática y termina siendo quien negocia la paz.'],
  ['Falco Grice', '5,6,7', 'supporting', 'ファルコ・グライス', 'Natsuki Hanae',
   'Candidato a guerrero tímido y buen chaval. Hereda el poder de Porco muriendo él, y es el último de Marley en desertar.'],
  ['Onyankopon', '5,6,7', 'supporting', 'オニャンコポン', 'Kouji Hiwatari',
   'Voluntario antimarleyano que enseña la tecnología de Marley a Paradis. Construye el barco con el que acaba huyendo medio mundo.'],
  ['Porco Galliard', '5,6,7', 'supporting', 'ポルコ・ガリアード', 'Toshiki Masuda',
   'Titán mandíbula y hermano de Marcel. Odia a Reiner desde el principio y muere para salvarlo, que es lo único que lo redime.'],
  ['Colt Grice', '5,6', 'supporting', 'コルト・グライス', 'Masaya Matsukaze',
   'El hermano mayor de Falco, y el que de verdad quería ser guerrero. Muere en el mar antes de llegar a Marley.'],
  ['Willy Tybur', '5,6', 'supporting', 'ヴィリー・タイバー', 'Kazuhiko Inoue',
   'El heredero de la familia que gobierna Marley desde dentro. Anuncia la guerra a Paradis en un teatro lleno de gente, y Eren lo mata desde la asistencia.'],
  ['Lara Tybur', '5', 'supporting', 'ラーラ・タイバー', 'Mamiko Noto',
   'La que de verdad tenía el titán martillo de guerra, y la hermana pequeña de Willy. Se la come Eren delante de todo el mar.'],
  ['Calvi', '5', 'supporting', 'カルヴィ', 'Kiyomitsu Mizuuchi',
   'El mariscal de Marley, y la persona con más autoridad cuando estalla el festival. Muere el primero, y su muerte es lo que hace caer la cadena de mando.'],
  ['Kiyomi Azumabito', '5,6,7', 'supporting', 'キヨミ・アズマビト', 'Kiri Yoshizawa',
   'La embajadora de Hizuru que lleva a Mikasa el asunto del destino de la isla. Es la razón por la que Historia acepta el trato de Zeke.'],
  ['Nicolo', '5,6', 'supporting', 'ニコロ', 'Eiji Hanawa',
   'El cocinero marleyano que el cuerpo de exploración captura y que acaba siendo el mejor amigo de Sasha.'],
  ['Tom Ksaver', '5,6,7', 'supporting', 'トム・クサヴァー', 'Kenji Hamada',
   'El investigador de Marley que descubrió lo que se puede hacer con la Coordinate. Murió haciendo el favor que le pidió Zeke, y Zeke no lo olvidó.'],
  ['Kaya', '2,5,6,7', 'supporting', 'カヤ', 'Nana Hamasaki',
   'La huérfana a la que Sasha adopta. Encontró a Gabi y Falco fugitivos y los llevó a su casa, y por eso casi los mata.'],
];

export const PERSONAJES = [
  ...COMPARTIDOS,
  ...SOLO_S2,
  ...S1_Y_S2,
  ...S4_A_S6,
  ...S5_A_S7,
];
