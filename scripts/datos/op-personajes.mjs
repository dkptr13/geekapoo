// PERSONAJES - One Piece
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Todos salen en la primera temporada, que es la unica que hay cargada
// por ahora, asi que la columna de temporada lleva un 1.
//
// Nombres, kanji y voces vienen de AniList (ficha 21). Los nombres van
// en el orden occidental que usa el catalogo ("Monkey D. Luffy"), no en
// el orden japones de AniList ("Luffy Monkey"). Las descripciones son
// propias, en castellano.

export const PERSONAJES = [
  ['Monkey D. Luffy', '1', 'main', 'モンキー・D・ルフィ', 'Mayumi Tanaka',
    'El protagonista. Un chico alegre y glotón que comió la Fruta de la Goma y quiere ser el Rey de los Piratas. Reúne su tripulación isla a isla y nunca abandona a un amigo.'],

  ['Roronoa Zoro', '1', 'main', 'ロロノア・ゾロ', 'Kazuya Nakai',
    'El primer compañero de Luffy. Espadachín de tres espadas que quiere ser el mejor del mundo para cumplir una promesa de la infancia. Se pierde con facilidad y duerme a todas horas.'],

  ['Nami', '1', 'main', 'ナミ', 'Akemi Okamura',
    'Navegante y cartógrafa de la tripulación. Se unió a los piratas de Arlong para salvar su aldea y luego huyó con Luffy. Le encanta el dinero y dibuja mapas como nadie.'],

  ['Usopp', '1', 'main', 'ウソップ', 'Kappei Yamaguchi',
    'Tirador y mentiroso compulsivo. Su padre, Yasopp, navega con Shanks, y él quiere ser un pirata valiente. Sus historias exageradas alegran el ánimo de la tripulación.'],

  ['Sanji', '1', 'main', 'サンジ', 'Hiroaki Hirata',
    'Cocinero del Going Merry. Pelea solo con las piernas porque necesita las manos para cocinar. Sueña con encontrar el All Blue, el mar donde se juntan todos los peces del mundo.'],

  ['Buggy', '1', 'supporting', 'バギー', 'Shigeru Chiba',
    'Pirata payaso que comió la Fruta de la Separación y puede dividir su cuerpo en trozos. Guarda un rencor enorme a Shanks y busca vengarse de Luffy.'],

  ['Alvida', '1', 'supporting', 'アルビダ', 'Youko Matsuoka',
    'Capitana pirata que esclavizó a Koby y se enfrentó a Luffy al principio del viaje. Su maza y su carácter la hacen temible, aunque acaba lanzada por los aires.'],

  ['Koby', '1', 'supporting', 'コビー', 'Mika Doi',
    'Chico tímido que era esclavo de Alvida. Ayuda a Luffy al principio del viaje y luego se alista en la Marina para cumplir su sueño de ser un soldado honrado.'],

  ['Helmeppo', '1', 'supporting', 'ヘルメッポ', 'Kouichi Nagano',
    'Hijo del capitán Morgan. Es cobarde y presumido, y se aprovecha del cargo de su padre hasta que Luffy y Zoro le dan su merecido.'],

  ['Morgan', '1', 'supporting', 'モーガン', 'Banjou Ginga',
    'Capitán de la Marina en la isla de Shells. Gobierna con mano de hierro, se cree por encima de la ley y lleva un hacha en lugar de mano.'],

  ['Kuro', '1', 'supporting', 'クロ', 'Kouichi Hashimoto',
    'Mayordomo de la familia de Kaya bajo el nombre de Klahadore. En realidad es el capitán pirata de los Gatos Negros, que fingió su muerte para robar la fortuna de la joven.'],

  ['Jango', '1', 'supporting', 'ジャンゴ', 'Kazuki Yao',
    'Hipnotizador del capitán Kuro. Sus colgantes y su péndulo duermen a cualquiera, aunque a veces se hipnotiza a sí mismo por error.'],

  ['Dracule Mihawk', '1', 'supporting', 'ジュラキュール・ミホーク', 'Takeshi Aono',
    'El mejor espadachín del mundo, conocido como Ojos de Halcón. Derrota a Zoro sin esfuerzo y le deja vivo para que algún día vuelva a retarlo.'],

  ['Zeff', '1', 'supporting', 'ゼフ', 'Kouji Yada',
    'Cocinero y dueño del Baratie. Fue un pirata famoso, Pies Rojos, hasta que perdió una pierna para salvar a Sanji. Le enseñó a cocinar y a pelear.'],

  ['Don Krieg', '1', 'supporting', '首領・クリーク', 'Fumihiko Tachiki',
    'Almirante pirata que se cree invencible. Llega al Baratie con su flota destrozada y trata de quedarse con el restaurante y con las vidas de sus cocineros.'],

  ['Arlong', '1', 'supporting', 'アーロン', 'Juurouta Kosugi',
    'Pirata hombre pez que domina la aldea de Cocoyashi. Cobra un tributo mensual a los aldeanos y obligó a Nami a dibujar mapas para él durante ocho años.'],

  ['Hatchan', '1', 'supporting', 'はっちゃん', 'Toshiyuki Morikawa',
    'Hombre pez pulpo de seis brazos que lucha con tres pares de espadas. Forma parte de la tripulación de Arlong y se enfrenta a Zoro en Arlong Park.'],

  ['Nojiko', '1', 'supporting', 'ノジコ', 'Wakana Yamazaki',
    'Hermana mayor adoptiva de Nami. Cuida de los tangerinos de Bell-mère y cuenta a los sombrero de paja la verdad sobre el pasado de su hermana.'],

  ['Smoker', '1', 'supporting', 'スモーカー', 'Mahito Ooba',
    'Capitán de la Marina en Loguetown. Comió la Fruta del Humo y puede convertirse en niebla. Persigue a Luffy sin descanso porque nunca deja escapar a un pirata.'],

  ['Tashigi', '1', 'supporting', 'たしぎ', 'Junko Noda',
    'Sargento de la Marina y experta en katanas. Se parece muchísimo a Kuina, la amiga de la infancia de Zoro, y quiere recuperar las espadas famosas que están en malas manos.'],

  ['Shanks', '1', 'supporting', 'シャンクス', 'Shuuichi Ikeda',
    'Capitán de los Piratas Pelirrojos e ídolo de la infancia de Luffy. Le regaló su sombrero de paja y perdió un brazo para salvarlo de un rey marino.'],

  ['Dragon', '1', 'supporting', 'ドラゴン', 'Hidekatsu Shibata',
    'Hombre misterioso con capa verde que aparece en Loguetown y salva a Luffy de Smoker. Su verdadera identidad y sus planes son un enigma.'],

  ['Makino', '1', 'supporting', 'マキノ', 'Makiko Oomoto',
    'Dueña del bar de la aldea de Foosha. Cuida de Luffy cuando es niño y le sirve la comida en el local donde Shanks y su tripulación celebran.'],
];
