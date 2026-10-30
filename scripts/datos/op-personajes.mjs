// PERSONAJES - One Piece
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// La columna de temporada dice en cuales sale el personaje:
//
//   ''      en todas (los cinco protagonistas)
//   '1'     solo en la primera
//   '1,2'   en la primera y la segunda
//   '2,3'   en la segunda y la tercera
//
// Vacio no es lo mismo que '1': vacio significa "compartido" y la wiki lo
// muestra en todas las temporadas (ver `seasonIdsDe` en seasonData.ts).
// Por eso los que solo salen en la primera llevan un 1 y no un vacio.
//
// Nombres, kanji y voces vienen de AniList (ficha 21). Los nombres van
// en el orden occidental que usa el catalogo ("Monkey D. Luffy"), no en
// el orden japones de AniList ("Luffy Monkey"). En los agentes de
// Baroque Works se usa el alias con el que se les conoce en la serie
// ("Mr. 3") y el kanji de su nombre real, que es lo que da AniList. Las
// descripciones son propias, en castellano.

export const PERSONAJES = [
  ['Monkey D. Luffy', '', 'main', 'モンキー・D・ルフィ', 'Mayumi Tanaka',
    'El protagonista. Un chico alegre y glotón que comió la Fruta de la Goma y quiere ser el Rey de los Piratas. Reúne su tripulación isla a isla y nunca abandona a un amigo.'],

  ['Roronoa Zoro', '', 'main', 'ロロノア・ゾロ', 'Kazuya Nakai',
    'El primer compañero de Luffy. Espadachín de tres espadas que quiere ser el mejor del mundo para cumplir una promesa de la infancia. Se pierde con facilidad y duerme a todas horas.'],

  ['Nami', '', 'main', 'ナミ', 'Akemi Okamura',
    'Navegante y cartógrafa de la tripulación. Se unió a los piratas de Arlong para salvar su aldea y luego huyó con Luffy. Le encanta el dinero y dibuja mapas como nadie.'],

  ['Usopp', '', 'main', 'ウソップ', 'Kappei Yamaguchi',
    'Tirador y mentiroso compulsivo. Su padre, Yasopp, navega con Shanks, y él quiere ser un pirata valiente. Sus historias exageradas alegran el ánimo de la tripulación.'],

  ['Sanji', '', 'main', 'サンジ', 'Hiroaki Hirata',
    'Cocinero del Going Merry. Pelea solo con las piernas porque necesita las manos para cocinar. Sueña con encontrar el All Blue, el mar donde se juntan todos los peces del mundo.'],

  ['Buggy', '1', 'supporting', 'バギー', 'Shigeru Chiba',
    'Pirata payaso que comió la Fruta de la Separación y puede dividir su cuerpo en trozos. Guarda un rencor enorme a Shanks y busca vengarse de Luffy.'],

  ['Alvida', '1', 'supporting', 'アルビダ', 'Youko Matsuoka',
    'Capitana pirata que esclavizó a Koby y se enfrentó a Luffy al principio del viaje. Su maza y su carácter la hacen temible, aunque acaba lanzada por los aires.'],

  ['Koby', '1,2', 'supporting', 'コビー', 'Mika Doi',
    'Chico tímido que era esclavo de Alvida. Ayuda a Luffy al principio del viaje y luego se alista en la Marina para cumplir su sueño de ser un soldado honrado.'],

  ['Helmeppo', '1,2', 'supporting', 'ヘルメッポ', 'Kouichi Nagano',
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

  ['Smoker', '1,2,3', 'supporting', 'スモーカー', 'Mahito Ooba',
    'Capitán de la Marina en Loguetown. Comió la Fruta del Humo y puede convertirse en niebla. Persigue a Luffy sin descanso porque nunca deja escapar a un pirata.'],

  ['Tashigi', '1', 'supporting', 'たしぎ', 'Junko Noda',
    'Sargento de la Marina y experta en katanas. Se parece muchísimo a Kuina, la amiga de la infancia de Zoro, y quiere recuperar las espadas famosas que están en malas manos.'],

  ['Shanks', '1', 'supporting', 'シャンクス', 'Shuuichi Ikeda',
    'Capitán de los Piratas Pelirrojos e ídolo de la infancia de Luffy. Le regaló su sombrero de paja y perdió un brazo para salvarlo de un rey marino.'],

  ['Dragon', '1', 'supporting', 'ドラゴン', 'Hidekatsu Shibata',
    'Hombre misterioso con capa verde que aparece en Loguetown y salva a Luffy de Smoker. Su verdadera identidad y sus planes son un enigma.'],

  ['Makino', '1', 'supporting', 'マキノ', 'Makiko Oomoto',
    'Dueña del bar de la aldea de Foosha. Cuida de Luffy cuando es niño y le sirve la comida en el local donde Shanks y su tripulación celebran.'],

  // ── TEMPORADA 2: Reverse Mountain, Whisky Peak y Little Garden ──────

  ['Crocus', '2', 'supporting', 'クロッカス', 'Gorou Naya',
    'Médico y farero de Reverse Mountain. Cuida de Laboon desde hace años y vive dentro de la ballena, donde ha pintado un cielo para que no esté sola. Fue médico de la tripulación de Gol D. Roger.'],

  ['Nefertari Vivi', '2,3', 'supporting', 'ネフェルタリ・ビビ', 'Misa Watanabe',
    'Princesa de Arabasta. Se infiltró en Baroque Works como Miss Wednesday para descubrir quién dirige la organización, y acaba viajando con los sombrero de paja para que la lleven de vuelta a su país.'],

  ['Igaram', '2', 'supporting', 'イガラム', 'Keiichi Sonobe',
    'Capitán de la guardia real de Arabasta. Se hace pasar por Mr. 8 para proteger a la princesa Vivi y lleva pistolas escondidas en el pelo. Se sacrifica para que ella pueda escapar de Whisky Peak.'],

  ['Karoo', '2,3', 'supporting', 'カルー', 'Hiroaki Hirata',
    'Pato veloz y compañero de Vivi. Corre más que un caballo y lleva a dos personas en la espalda. Sigue a la princesa a todas partes y ayuda a la tripulación en Little Garden.'],

  ['Mr. 9', '2', 'supporting', 'Mr.9', 'Yasuhiro Takato',
    'Agente fronterizo de Baroque Works emparejado con Miss Wednesday. Es presumido y algo torpe, y cuando descubre que Vivi es la princesa se pone de su parte para protegerla.'],

  ['Miss Monday', '2', 'supporting', 'ミス・マンデー', 'Makiko Oomoto',
    'Agente fronterizo de Baroque Works y pareja de Mr. 8. Tiene una fuerza descomunal y se enfrenta a Zoro en Whisky Peak, donde acaba derrotada como el resto de cazarrecompensas.'],

  ['Dorry', '2', 'supporting', 'ドリー', 'Daisuke Gouri',
    'Guerrero gigante de Elbaf. Lleva cien años batiéndose con Brogy en Little Garden, un duelo que se reanuda cada vez que entra en erupción el volcán de la isla.'],

  ['Brogy', '2', 'supporting', 'ブロギー', 'Tetsu Inada',
    'Guerrero gigante de Elbaf y rival de Dorry. Pelea con un hacha enorme y mantiene con su compatriota un duelo de cien años que los dos consideran un honor.'],

  ['Mr. 3', '2', 'supporting', 'ギャルディーノ', 'Nobuyuki Hiyama',
    'Agente de Baroque Works que comió la Fruta de la Cera. Es un estratega frío que prefiere las trampas al combate y que atrapa a Nami y a Zoro en un pedestal de cera en Little Garden.'],

  ['Miss Goldenweek', '2', 'supporting', 'マリアンヌ', 'Akiko Nakagawa',
    'Compañera de Mr. 3. Pinta símbolos con los colores de sus pinturas y controla las emociones de quien los mira. Es tranquila y casi nunca habla.'],

  ['Mr. 5', '2', 'supporting', 'ジェム', 'Masaya Takatsuka',
    'Agente de Baroque Works que comió la Fruta de la Explosión. Todo su cuerpo explota, incluso su aliento, y dispara desde un revólver que convierte en bombas lo que toca.'],

  ['Miss Valentine', '2', 'supporting', 'ミキータ', 'Fumiko Orikasa',
    'Compañera de Mr. 5. Comió la Fruta del Peso y cambia su peso a voluntad: puede flotar como una pluma o caer sobre su enemigo como una tonelada.'],

  ['Nico Robin', '2', 'supporting', 'ニコ・ロビン', 'Yuriko Yamaguchi',
    'Vicepresidenta de Baroque Works, conocida como Miss All Sunday. Aparece en el barco de los sombrero de paja, les ofrece un eternal pose y demuestra que sabe demasiado sobre ellos.'],

  // ── TEMPORADA 3: la isla de Drum y Tony Tony Chopper ───────────────

  ['Tony Tony Chopper', '3', 'main', 'トニートニー・チョッパー', 'Ikue Ootani',
    'Reno que comió la Fruta Humano-Humano y aprendió a hablar y a caminar como una persona. Quiere ser un médico capaz de curar cualquier enfermedad y se une a la tripulación en la isla de Drum.'],

  ['Kureha', '3', 'supporting', 'くれは', 'Masako Nozawa',
    'La doctora de la isla de Drum, conocida como la bruja. Tiene 139 años, vive en la cima del castillo y es la única persona capaz de curar la fiebre de Nami. Acoge a Chopper como aprendiz.'],

  ['Hiruluk', '3', 'supporting', 'ヒルルク', 'Shigeru Ushiyama',
    'Médico al que todos llamaban un matasanos. Cuidó de Chopper cuando era un reno rechazado y le enseñó que no hay enfermedad incurable. Su sueño eran los cerezos que florecen en la nieve.'],

  ['Wapol', '3', 'supporting', 'ワポル', 'Bin Shimada',
    'Antiguo rey de la isla de Drum. Comió la Fruta de la Comida y puede comerse cualquier cosa y unirla a su cuerpo. Huyó del reino cuando lo atacaron unos piratas y vuelve para recuperar el trono.'],

  ['Dalton', '3', 'supporting', 'ドルトン', 'Kenichi Ono',
    'Capitán de la guardia de Drum y hombre de confianza del pueblo. Comió la Fruta del Bisonte y se enfrenta a Wapol para proteger a los aldeanos cuando el rey vuelve a la isla.'],

  ['Chess', '3', 'supporting', 'チェス', 'Yuusuke Numata',
    'Uno de los dos sirvientes de Wapol. Lleva un arco y flechas y se enfrenta a los sombrero de paja junto a Kuromarimo, con quien se fusiona en un solo guerrero.'],

  ['Kuromarimo', '3', 'supporting', 'クロマーリモ', 'Kenji Nomura',
    'El otro sirviente de Wapol. Pelea con la electricidad estática que saca de su pelo y se une a Chess para formar Chessmarimo, el guerrero que se enfrenta a Chopper.'],
];
