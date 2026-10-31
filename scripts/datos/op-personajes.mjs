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

  ['Buggy', '1,6,13', 'antagonist', 'バギー', 'Shigeru Chiba',
    'Pirata payaso que comió la Fruta de la Separación y puede dividir su cuerpo en trozos. Guarda un rencor enorme a Shanks y busca vengarse de Luffy.'],

  ['Alvida', '1,13', 'antagonist', 'アルビダ', 'Youko Matsuoka',
    'Capitana pirata que esclavizó a Koby y se enfrentó a Luffy al principio del viaje. Su maza y su carácter la hacen temible, aunque acaba lanzada por los aires.'],

  ['Koby', '1,2', 'supporting', 'コビー', 'Mika Doi',
    'Chico tímido que era esclavo de Alvida. Ayuda a Luffy al principio del viaje y luego se alista en la Marina para cumplir su sueño de ser un soldado honrado.'],

  ['Helmeppo', '1,2', 'supporting', 'ヘルメッポ', 'Kouichi Nagano',
    'Hijo del capitán Morgan. Es cobarde y presumido, y se aprovecha del cargo de su padre hasta que Luffy y Zoro le dan su merecido.'],

  ['Morgan', '1', 'antagonist', 'モーガン', 'Banjou Ginga',
    'Capitán de la Marina en la isla de Shells. Gobierna con mano de hierro, se cree por encima de la ley y lleva un hacha en lugar de mano.'],

  ['Kuro', '1', 'antagonist', 'クロ', 'Kouichi Hashimoto',
    'Mayordomo de la familia de Kaya bajo el nombre de Klahadore. En realidad es el capitán pirata de los Gatos Negros, que fingió su muerte para robar la fortuna de la joven.'],

  ['Jango', '1', 'supporting', 'ジャンゴ', 'Kazuki Yao',
    'Hipnotizador del capitán Kuro. Sus colgantes y su péndulo duermen a cualquiera, aunque a veces se hipnotiza a sí mismo por error.'],

  ['Dracule Mihawk', '1,6', 'supporting', 'ジュラキュール・ミホーク', 'Takeshi Aono',
    'El mejor espadachín del mundo, conocido como Ojos de Halcón. Derrota a Zoro sin esfuerzo y le deja vivo para que algún día vuelva a retarlo.'],

  ['Zeff', '1', 'supporting', 'ゼフ', 'Kouji Yada',
    'Cocinero y dueño del Baratie. Fue un pirata famoso, Pies Rojos, hasta que perdió una pierna para salvar a Sanji. Le enseñó a cocinar y a pelear.'],

  ['Don Krieg', '1', 'antagonist', '首領・クリーク', 'Fumihiko Tachiki',
    'Almirante pirata que se cree invencible. Llega al Baratie con su flota destrozada y trata de quedarse con el restaurante y con las vidas de sus cocineros.'],

  ['Arlong', '1', 'antagonist', 'アーロン', 'Juurouta Kosugi',
    'Pirata hombre pez que domina la aldea de Cocoyashi. Cobra un tributo mensual a los aldeanos y obligó a Nami a dibujar mapas para él durante ocho años.'],

  ['Hatchan', '1,11', 'supporting', 'はっちゃん', 'Toshiyuki Morikawa',
    'Hombre pez pulpo de seis brazos que lucha con tres pares de espadas. Forma parte de la tripulación de Arlong y se enfrenta a Zoro en Arlong Park.'],

  ['Nojiko', '1', 'supporting', 'ノジコ', 'Wakana Yamazaki',
    'Hermana mayor adoptiva de Nami. Cuida de los tangerinos de Bell-mère y cuenta a los sombrero de paja la verdad sobre el pasado de su hermana.'],

  ['Smoker', '1,2,3,4', 'supporting', 'スモーカー', 'Mahito Ooba',
    'Capitán de la Marina en Loguetown. Comió la Fruta del Humo y puede convertirse en niebla. Persigue a Luffy sin descanso porque nunca deja escapar a un pirata.'],

  ['Tashigi', '1,4', 'supporting', 'たしぎ', 'Junko Noda',
    'Sargento de la Marina y experta en katanas. Se parece muchísimo a Kuina, la amiga de la infancia de Zoro, y quiere recuperar las espadas famosas que están en malas manos.'],

  ['Shanks', '1,6', 'supporting', 'シャンクス', 'Shuuichi Ikeda',
    'Capitán de los Piratas Pelirrojos e ídolo de la infancia de Luffy. Le regaló su sombrero de paja y perdió un brazo para salvarlo de un rey marino.'],

  ['Dragon', '1', 'supporting', 'ドラゴン', 'Hidekatsu Shibata',
    'Hombre misterioso con capa verde que aparece en Loguetown y salva a Luffy de Smoker. Su verdadera identidad y sus planes son un enigma.'],

  ['Makino', '1', 'supporting', 'マキノ', 'Makiko Oomoto',
    'Dueña del bar de la aldea de Foosha. Cuida de Luffy cuando es niño y le sirve la comida en el local donde Shanks y su tripulación celebran.'],

  // ── TEMPORADA 2: Reverse Mountain, Whisky Peak y Little Garden ──────

  ['Crocus', '2', 'supporting', 'クロッカス', 'Gorou Naya',
    'Médico y farero de Reverse Mountain. Cuida de Laboon desde hace años y vive dentro de la ballena, donde ha pintado un cielo para que no esté sola. Fue médico de la tripulación de Gol D. Roger.'],

  ['Nefertari Vivi', '2,3,4', 'supporting', 'ネフェルタリ・ビビ', 'Misa Watanabe',
    'Princesa de Arabasta. Se infiltró en Baroque Works como Miss Wednesday para descubrir quién dirige la organización, y acaba viajando con los sombrero de paja para que la lleven de vuelta a su país.'],

  ['Igaram', '2,4', 'supporting', 'イガラム', 'Keiichi Sonobe',
    'Capitán de la guardia real de Arabasta. Se hace pasar por Mr. 8 para proteger a la princesa Vivi y lleva pistolas escondidas en el pelo. Se sacrifica para que ella pueda escapar de Whisky Peak.'],

  ['Karoo', '2,3,4', 'supporting', 'カルー', 'Hiroaki Hirata',
    'Pato veloz y compañero de Vivi. Corre más que un caballo y lleva a dos personas en la espalda. Sigue a la princesa a todas partes y ayuda a la tripulación en Little Garden.'],

  ['Mr. 9', '2', 'supporting', 'Mr.9', 'Yasuhiro Takato',
    'Agente fronterizo de Baroque Works emparejado con Miss Wednesday. Es presumido y algo torpe, y cuando descubre que Vivi es la princesa se pone de su parte para protegerla.'],

  ['Miss Monday', '2', 'supporting', 'ミス・マンデー', 'Makiko Oomoto',
    'Agente fronterizo de Baroque Works y pareja de Mr. 8. Tiene una fuerza descomunal y se enfrenta a Zoro en Whisky Peak, donde acaba derrotada como el resto de cazarrecompensas.'],

  ['Dorry', '2', 'supporting', 'ドリー', 'Daisuke Gouri',
    'Guerrero gigante de Elbaf. Lleva cien años batiéndose con Brogy en Little Garden, un duelo que se reanuda cada vez que entra en erupción el volcán de la isla.'],

  ['Brogy', '2', 'supporting', 'ブロギー', 'Tetsu Inada',
    'Guerrero gigante de Elbaf y rival de Dorry. Pelea con un hacha enorme y mantiene con su compatriota un duelo de cien años que los dos consideran un honor.'],

  ['Mr. 3', '2,4,13', 'supporting', 'ギャルディーノ', 'Nobuyuki Hiyama',
    'Agente de Baroque Works que comió la Fruta de la Cera. Es un estratega frío que prefiere las trampas al combate y que atrapa a Nami y a Zoro en un pedestal de cera en Little Garden.'],

  ['Miss Goldenweek', '2', 'supporting', 'マリアンヌ', 'Akiko Nakagawa',
    'Compañera de Mr. 3. Pinta símbolos con los colores de sus pinturas y controla las emociones de quien los mira. Es tranquila y casi nunca habla.'],

  ['Mr. 5', '2', 'supporting', 'ジェム', 'Masaya Takatsuka',
    'Agente de Baroque Works que comió la Fruta de la Explosión. Todo su cuerpo explota, incluso su aliento, y dispara desde un revólver que convierte en bombas lo que toca.'],

  ['Miss Valentine', '2', 'supporting', 'ミキータ', 'Fumiko Orikasa',
    'Compañera de Mr. 5. Comió la Fruta del Peso y cambia su peso a voluntad: puede flotar como una pluma o caer sobre su enemigo como una tonelada.'],

  ['Nico Robin', '2,4,5,6,7,8,9,10,11,12,13', 'supporting', 'ニコ・ロビン', 'Yuriko Yamaguchi',
    'Vicepresidenta de Baroque Works, conocida como Miss All Sunday. Aparece en el barco de los sombrero de paja, les ofrece un eternal pose y demuestra que sabe demasiado sobre ellos. Tras la caída de Crocodile en Arabasta, se une a la tripulación.'],

  // ── TEMPORADA 3: la isla de Drum y Tony Tony Chopper ───────────────

  ['Tony Tony Chopper', '3,4,5,6,7,8,9,10,11,12,13', 'main', 'トニートニー・チョッパー', 'Ikue Ootani',
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

  // ── TEMPORADA 4: Arabasta y Baroque Works ─────────────────────────

  ['Crocodile', '4,13', 'antagonist', 'クロコダイル', 'Ryuuzaburou Ootomo',
    'Uno de los Siete Señores del Mar y jefe secreto de Baroque Works, conocido como Mr. 0. Comió la Fruta de la Arena y puede secar cualquier cosa que toque. Quiere hacerse con el reino de Arabasta para encontrar el arma ancestral Pluton.'],

  ['Mr. 1', '4,13', 'supporting', 'ダズ・ボーネス', 'Tetsu Inada',
    'Agente de élite de Baroque Works y pareja de Miss Doublefinger. Comió la Fruta del Dado y puede convertir cualquier parte de su cuerpo en una cuchilla de acero. Es frío y silencioso, y se enfrenta a Zoro en Alubarna.'],

  ['Miss Doublefinger', '4', 'supporting', 'ザラ', 'Ako Mayama',
    'Agente de élite de Baroque Works y pareja de Mr. 1. Comió la Fruta de la Espina y puede sacar púas de todo el cuerpo. Se enfrenta a Nami, que estrena el Clima Táctil.'],

  ['Mr. 2', '3,4,13', 'supporting', 'ベンサム', 'Kazuki Yao',
    'Agente de Baroque Works que comió la Fruta de la Copia: toca una cara con la mano derecha y adopta el aspecto de esa persona. Es un bailarín extravagante que se hace amigo de Luffy y acaba ayudando a la tripulación a escapar de Arabasta.'],

  ['Mr. 4', '4', 'supporting', 'ベーブ', 'Masaya Takatsuka',
    'Agente de Baroque Works, lento y fortachón. Bate bolas explosivas con un bate de béisbol y su perro Lasso, que comió la Fruta del Perro, le sirve de bazuca. Pelea junto a Miss Merry Christmas contra Usopp y Chopper.'],

  ['Miss Merry Christmas', '4', 'supporting', 'ミス・メリークリスマス', 'Mami Kingetsu',
    'Agente de Baroque Works y pareja de Mr. 4. Comió la Fruta del Topo y cava túneles a gran velocidad. Es pequeña, habladora y muy dura, y se enfrenta a Usopp y Chopper en Alubarna.'],

  ['Pell', '4', 'supporting', 'ペル', 'Kenji Nojima',
    'Guerrero de la guardia real de Arabasta y uno de los dos guardianes del reino. Comió la Fruta del Halcón y puede volar. Se lleva la bomba de Crocodile al cielo para salvar Alubarna.'],

  ['Chaka', '4', 'supporting', 'チャカ', 'Kihachiro Uemura',
    'Guerrero de la guardia real de Arabasta y hermano de armas de Pell. Comió la Fruta del Chacal. Defiende el palacio de Alubarna y ayuda a Vivi a frenar a los rebeldes.'],

  ['Koza', '4', 'supporting', 'コーザ', 'Takeshi Kusao',
    'Líder del ejército rebelde de Arabasta y amigo de la infancia de Vivi. De niño fundó el Clan de la Arena; la sequía y las maniobras de Crocodile lo llevan a levantarse contra el rey.'],

  ['Nefertari Cobra', '4', 'supporting', 'ネフェルタリ・コブラ', 'Iemasa Kayumi',
    'Rey de Arabasta y padre de Vivi. Confía en su pueblo y se niega a usar el Polvo de Baile, aunque la sequía le cueste el trono. Crocodile lo secuestra para que su plan parezca obra del rey.'],

  ['Portgas D. Ace', '4,6', 'supporting', 'ポートガス・D・エース', 'Daisuke Sakaguchi',
    'Hermano mayor de Luffy y comandante de la segunda flota de los Piratas de Barbablanca. Comió la Fruta del Fuego. Busca a Barbanegra, que mató a un compañero suyo, y se cruza con la tripulación en Arabasta.'],

  ['Toto', '4', 'supporting', 'トト', 'Masaaki Tsukada',
    'Padre de Koza y anciano de Yuba. Se queda en el pueblo enterrado por la arena porque espera que vuelva a manar agua, y confía en que el rey no ha abandonado a su pueblo.'],

  // ── TEMPORADA 5: las historias originales ─────────────────────────

  ['Zenny', '5', 'supporting', 'ゼニィ', 'Osamu Saka',
    'Viejo prestamista que vive con sus cabras en una isla a la que solo se llega por corrientes peligrosas. Lleva veinte años construyendo un barco pirata en la montaña y dice que sus cabras son su verdadero tesoro.'],

  ['Henzo', '5', 'supporting', 'ヘンゾ', 'Choo',
    'Científico de la isla de Luluka que lleva cincuenta años buscando la Niebla Arcoíris. De joven formó parte de los Piratas Pumpkin y quiere rescatar a sus compañeros, atrapados en la niebla.'],

  ['Whetton', '5', 'supporting', 'ウェットン', 'Jouji Nakata',
    'Pirata que asaltó la isla de Luluka hace cincuenta años y provocó que los Piratas Pumpkin acabaran atrapados en la Niebla Arcoíris. Ahora vuelve a por el tesoro que se esconde dentro.'],

  // ── TEMPORADA 6: Jaya y Skypiea ───────────────────────────────────

  ['Enel', '6', 'antagonist', 'エネル', 'Toshiyuki Morikawa',
    'Dios de Skypiea. Comió la Fruta del Rayo y puede convertirse en electricidad, leer los pensamientos con el mantra y lanzar rayos. Quiere destruir las islas del cielo y marcharse a Fairy Vearth.'],

  ['Wyper', '6', 'supporting', 'ワイパー', 'Reiko Kiuchi',
    'Líder de los guerreros shandia. Pelea con una bazuca de fuego y un Reject Dial, y quiere recuperar Upper Yard, la tierra que su pueblo perdió hace cuatrocientos años.'],

  ['Conis', '6', 'supporting', 'コニス', 'Rieko Takahashi',
    'Joven skypieana que recibe a la tripulación con su padre Pagaya. Les enseña las costumbres del cielo y los diales, y acaba ayudándolos contra Enel.'],

  ['Pagaya', '6', 'supporting', 'パガヤ', 'Mahito Ooba',
    'Padre de Conis y experto en diales. Recibe a los sombrero de paja en su casa y les explica cómo funcionan los diales, los waver y el mar de nubes.'],

  ['Gan Fall', '6', 'supporting', 'ガン・フォール', 'Jouji Yanami',
    'Antiguo Dios de Skypiea, conocido como el Caballero del Cielo. Monta a Pierre, su pájaro, y protege a la tripulación de los sacerdotes de Enel.'],

  ['Aisa', '6', 'supporting', 'アイサ', 'Masami Suzuki',
    'Niña shandia que puede usar el mantra para sentir a las personas. Acompaña a Luffy en su lucha contra Enel y le ayuda a encontrar al dios.'],

  ['Ohm', '6', 'supporting', 'オーム', 'Eiji Takemoto',
    'Sacerdote de Enel y maestro del Juicio de Hierro. Pelea con una espada de nube y entrena a animales feroces; se enfrenta a Zoro, Wyper y Gan Fall.'],

  ['Satori', '6', 'supporting', 'サトリ', 'Yasuhiro Takato',
    'Sacerdote de Enel y guardián del Juicio de las Esferas. Usa el mantra para anticipar los ataques y las esferas sorpresa para atrapar a sus enemigos.'],

  ['Shura', '6', 'supporting', 'シュラ', 'Shinichirou Oota',
    'Sacerdote de Enel y guardián del Juicio de la Cuerda. Ataca con un pájaro de fuego y cuerdas invisibles, y se enfrenta a Chopper y Gan Fall.'],

  ['Gedatsu', '6', 'supporting', 'ゲダツ', 'Masaya Takatsuka',
    'Sacerdote de Enel y guardián del Juicio del Pantano. Es torpe y despistado, y Chopper acaba derrotándolo en el bosque.'],

  ['McKinley', '6', 'supporting', 'マッキンリー', 'Keiichi Sonobe',
    'Jefe de los Berets Blancos, la policía de Skypiea. Intenta detener a los sombrero de paja por no pagar la entrada y luego organiza la evacuación de Angel Island.'],

  ['Kamakiri', '6', 'supporting', 'カマキリ', 'Keisuke',
    'Guerrero shandia del equipo de Wyper. Pelea con lanzas y forma parte del ataque a Upper Yard.'],

  ['Braham', '6', 'supporting', 'ブラハム', 'Kenji Nomura',
    'Guerrero shandia que lucha con pistolas y se mueve a gran velocidad. Se enfrenta a Zoro en el bosque y acaba derrotado.'],

  ['Genbo', '6', 'supporting', 'ゲンボウ', 'Osamu Ryuutani',
    'Guerrero shandia fornido que dispara cañones. Se enfrenta a Yama y a los soldados divinos durante la invasión de Upper Yard.'],

  ['Raki', '6', 'supporting', 'ラキ', 'Michie Tomizawa',
    'Guerrera shandia y prima de Aisa. Es capturada por los sacerdotes y rescatada por sus compañeros durante el ataque a Upper Yard.'],

  ['Yama', '6', 'supporting', 'ヤマ', 'Hidenari Ugaki',
    'Jefe de los soldados divinos de Enel. Pelea con un hacha enorme y se enfrenta a Robin en las ruinas de Shandora.'],

  ['Mont Blanc Cricket', '6', 'supporting', 'モンブラン・クリケット', 'Takashi Taniguchi',
    'Descendiente de Noland el Mentiroso y líder de la Alianza Saruyama. Lleva años buscando la ciudad de oro y ayuda a la tripulación a llegar a Skypiea.'],

  ['Masira', '6', 'supporting', 'マシラ', 'Aruno Tahara',
    'Pirata salvamento con aspecto de mono y hermano de Shoujou. Se dedica a recuperar barcos hundidos y ayuda a Cricket a preparar el Going Merry.'],

  ['Shoujou', '6', 'supporting', 'ショウジョウ', 'Isamu Tanonaka',
    'Pirata salvamento orangután y hermano de Masira. Forma parte de la Alianza Saruyama y ayuda a Cricket en la búsqueda de la ciudad de oro.'],

  ['Bellamy', '6', 'antagonist', 'ベラミー', 'Wataru Takagi',
    'Pirata de Mock Town conocido como la Hiena. Comió la Fruta del Resorte y se burla de los sueños de los demás; Luffy lo derrota de un solo golpe.'],

  ['Sarquiss', '6', 'supporting', 'サーキース', 'Yuuji Ueda',
    'Primer oficial de Bellamy y su aliado más fiel. Pelea con una espada y participa en el ataque a la casa de Cricket.'],

  ['Marshall D. Teach', '6', 'antagonist', 'マーシャル・D・ティーチ', 'Akio Ootsuka',
    'Pirata conocido como Barbanegra. Se cruza con Luffy en Mock Town y le anima a no abandonar sus sueños; busca una presa importante para entrar en los Siete Señores del Mar.'],

  ['Van Augur', '6', 'supporting', 'ヴァン・オーガー', 'Masaya Takatsuka',
    'Francotirador de los piratas de Barbanegra. Aparece en Mock Town y demuestra una puntería imposible.'],

  ['Jesus Burgess', '6', 'supporting', 'ジーザス・バージェス', 'Tetsu Inada',
    'Luchador enorme de los piratas de Barbanegra. Acompaña a su capitán en Jaya y se ríe del sueño de Skypiea.'],

  ['Doc Q', '6', 'supporting', 'ドクQ', 'Naoya Uchida',
    'Médico de los piratas de Barbanegra. Va en un caballo flaco y reparte manzanas explosivas a los que se cruzan con él.'],

  ['Lafitte', '6', 'supporting', 'ラフィット', 'Taiki Matsuno',
    'Navegante de los piratas de Barbanegra. Entra sin permiso en la reunión de los Señores del Mar y propone a Barbanegra como sustituto de Crocodile.'],

  ['Mont Blanc Noland', '6', 'supporting', 'モンブラン・ノーランド', 'Houchuu Ootsuka',
    'Explorador del Reino de Lvneel y antepasado de Cricket. Contó que en Jaya había una ciudad de oro y pasó a la historia como el Mentiroso.'],

  ['Calgara', '6', 'supporting', 'カルガラ', 'Hidekatsu Shibata',
    'Gran guerrero shandia y amigo de Noland. Defiende Shandora y promete a su amigo que volverán a encontrarse.'],

  // ── TEMPORADA 7: G-8, Long Ring Long Land y Aokiji ────────────────

  ['Jonathan', '7', 'supporting', 'ジョナサン', 'Nobuo Tanaka',
    'Comandante de la base naval G-8. Es tranquilo y muy listo, y tiende trampas a la tripulación mientras intenta que no escape de Navarone.'],

  ['Jessica', '7', 'supporting', 'ジェシカ', 'Kazue Ikura',
    'Jefa de cocina de G-8 y esposa de Jonathan. Sanji se enamora de ella y le enseña a cocinar sin desperdiciar comida.'],

  ['Kobato', '7', 'supporting', 'コバト先生', 'Akiko Hiramatsu',
    'Médica pediátrica de G-8. No soporta la sangre, pero Chopper la ayuda a operar a los marines heridos.'],

  ['Mekao', '7', 'supporting', 'メカオ', 'Keiichi Sonobe',
    'Carpintero de G-8 y padre de Kobato. Reconoce el mal estado del Going Merry y ayuda a la tripulación a escapar.'],

  ['Shepherd', '7', 'supporting', 'シェパード', 'Keiichi Nanba',
    'Inspector de la Marina enviado a G-8. Acaba detenido por error y Usopp lo hace pasar por un compañero llamado Condoriano.'],

  ['Drake', '7', 'supporting', 'ドレイク', 'Eiji Takemoto',
    'Teniente de la base G-8 y hombre de confianza de Jonathan. Dirige las trampas contra los sombrero de paja.'],

  ['Foxy', '7,11', 'supporting', 'フォクシー', 'Bin Shimada',
    'Capitán de los piratas de Foxy, conocido como el Zorro Plateado. Comió la Fruta del Retraso y reta a Luffy a un Davy Back Fight.'],

  ['Porche', '7', 'supporting', 'ポルチェ', 'Sara Nakayama',
    'Navegante y compañera de Foxy. Participa en las pruebas del Davy Back Fight y ayuda a su capitán a hacer trampas.'],

  ['Hamburg', '7', 'supporting', 'ハンバーグ', 'Hirohiko Kakegawa',
    'Pirata forzudo de la tripulación de Foxy. Pelea en el Groggy Ring y en las demás pruebas del Davy Back.'],

  ['Big Pan', '7', 'supporting', 'ビッグパン', 'Mahito Ooba',
    'Pirata gigante con aspecto de pez de la banda de Foxy. Participa en el combate final contra los sombrero de paja.'],

  ['Capote', '7', 'supporting', 'カポーティ', 'Hiroshi Tsuchida',
    'Pirata de la banda de Foxy que pelea con una armadura de metal. Participa en las pruebas del Davy Back Fight.'],

  ['Tonjit', '7', 'supporting', 'トンジット', 'Naoki Tatsuta',
    'Nómada que vive en Long Ring Long Land con su caballo Sherry. Foxy y su banda lo atacan y la tripulación lo ayuda.'],

  ['Aokiji', '7', 'supporting', 'クザン', 'Takehito Koyasu',
    'Almirante de la Marina. Comió la Fruta del Hielo y puede congelar el mar y a sus enemigos; aparece al final de la temporada para advertir a la tripulación.'],

  // ── REPARTO QUE FALTABA DE LAS TEMPORADAS 1 A 7 ──────────────────

  ['Kuina', '1', 'supporting', 'くいな', 'Machiko Toyoshima',
    'Amiga de la infancia de Zoro y su rival en el dojo. Soñaba con ser la mejor espadachina del mundo, pero murió al caer por unas escaleras; Zoro heredó su espada y su promesa.'],

  ['Gin', '1', 'supporting', 'ギン', 'Kenichi Ono',
    'Comandante de la flota de Don Krieg, conocido como Gin el Demonio. Respeta a Sanji por haberle dado de comer y se rebela contra su capitán.'],

  ['Pearl', '1', 'supporting', 'パール', 'Hiroyuki Kawamoto',
    'Guerrero de la armadura de hierro de Don Krieg. Pelea con escudos metálicos y es famoso por su cobardía y su fuerza.'],

  ['Fullbody', '1', 'supporting', 'フルボディ', 'Hideo Ishikawa',
    'Sargento de la Marina que presume de su cargo y de su peinado. Se enfrenta a Sanji en el Baratie y acaba humillado.'],

  ['Johnny', '1', 'supporting', 'ジョニー', 'Masaya Takatsuka',
    'Cazarrecompensas y amigo de Yosaku. Acompaña a Zoro y a la tripulación durante un tiempo y admira al espadachín.'],

  ['Yosaku', '1', 'supporting', 'ヨサク', 'Yasuhiko Tokuyama',
    'Cazarrecompensas y compañero de Johnny. Se une un tiempo a la tripulación y ayuda a Zoro en su búsqueda.'],

  ['Genzo', '1', 'supporting', 'ゲンゾウ', 'Kouzou Shioya',
    'Policía de la aldea de Cocoyashi y amigo de Bell-mère. Cuida de Nami y Nojiko y guarda un gran cariño a las dos hermanas.'],

  ['Bell-mère', '1', 'supporting', 'ベルメール', 'Noriko Hidaka',
    'Madre adoptiva de Nami y Nojiko. Exmarine que las crió en Cocoyashi y murió defendiéndolas de Arlong.'],

  ['Nezumi', '1', 'supporting', 'ネズミ', 'Tamotsu Nishiwaki',
    'Capitán de la Marina en Cocoyashi, corrupto y aliado de Arlong. Traiciona a Nami y a su aldea.'],

  ['Mohji', '1', 'supporting', 'モージ', 'Shigenori Souya',
    'Domador de bestias de la tripulación de Buggy. Pelea junto a su león Richie y es uno de los primeros enemigos de Luffy.'],

  ['Cabaji', '1', 'supporting', 'カバジ', 'Moriya Endou',
    'Malabarista y espadachín de la tripulación de Buggy. Se enfrenta a Zoro en la aldea de Orange.'],

  ['Kaya', '1', 'supporting', 'カヤ', 'Mariko Kouda',
    'Joven rica de la aldea de Syrup y amiga de Usopp. Está enferma por culpa de Kuro, que planea matarla para heredar su fortuna.'],

  ['Sham', '1', 'supporting', 'シャム', 'Masaya Onosaka',
    'Hipnotizador de los Gatos Negros y hermano de Buchi. Pelea con guantes de acero y ayuda a Kuro en su plan.'],

  ['Buchi', '1', 'supporting', 'ブチ', 'Yasuhiro Takato',
    'Luchador de los Gatos Negros y hermano de Sham. Pelea con garras de acero y se enfrenta a Zoro.'],

  ['Kuroobi', '1', 'supporting', 'クロオビ', 'Hisao Egawa',
    'Oficial de los piratas de Arlong. Pelea con karate de hombre pez y se enfrenta a Sanji.'],

  ['Chew', '1', 'supporting', 'チュウ', 'Masaya Onosaka',
    'Oficial de los piratas de Arlong que dispara agua por la boca. Se enfrenta a Usopp.'],

  ['Boodle', '1', 'supporting', 'ブードル', 'Jouji Yanami',
    'Alcalde de la aldea de Orange. Defiende su pueblo de Buggy y ayuda a Luffy.'],

  ['Merry', '1', 'supporting', 'メリー', 'Jin Domon',
    'Mayordomo de la familia de Kaya y constructor del Going Merry. Murió antes de la historia y el barco lleva su nombre.'],

  ['Terracotta', '4', 'supporting', 'テラコッタ', 'Keiichi Sonobe',
    'Ama de llaves del palacio de Arabasta y esposa de Igaram. Cuida de Vivi y de la familia real durante la guerra.'],

  ['Mr. 7', '4', 'supporting', 'ミズター・セブン', 'Keisuke',
    'Agente de Baroque Works y pareja de Miss Father\'s Day. Custodia la bomba de Alubarna y se enfrenta a Vivi.'],

  ['Miss Father\'s Day', '4', 'supporting', 'ミス・ファーザーズデー', 'Tomoko Naka',
    'Agente de Baroque Works y pareja de Mr. 7. Ayuda a custodiar la bomba de la torre del reloj.'],

  ['Lapanui', '5', 'supporting', 'ラパヌイ・パスクア', 'Keiichi Sonobe',
    'Líder de los Piratas Pumpkin, atrapados en la Niebla Arcoíris desde hace cincuenta años. Desconfía de Henzo hasta que descubre la verdad.'],

  ['Ian', '5', 'supporting', 'イアン', 'Masaya Takatsuka',
    'Capitán de asalto de los piratas de Wetton. Quedó atrapado en la Niebla Arcoíris con los Piratas Pumpkin y escapa con vida para reunirse con su capitán.'],

  ['Hotori y Kotori', '6', 'supporting', 'ホトリとコトリ', 'Yasuhiro Takato',
    'Hermanos gemelos de Satori y tenientes de los soldados divinos de Enel. Usan diales y el mantra para vengar a su hermano, pero Nami y Gan Fall los derrotan.'],

  ['Baskerville', '9', 'supporting', 'バスカビル', 'Mahito Ooba',
    'Jefe de justicia de Enies Lobby, en realidad tres hombres que fingen ser un solo cuerpo de tres cabezas. Manda a los jurados y a la guardia contra los intrusos.'],

  ['Puzzle', '9', 'supporting', 'パズール', 'Kishou Taniyama',
    'Capitán de los Piratas del Fénix y viejo pirata del Nuevo Mundo. Está gravemente herido cuando la tripulación lo encuentra y recupera la confianza para luchar contra los Accino.'],

  ['Sengoku', '6', 'supporting', 'センゴク', 'Takkou Ishimori',
    'Almirante de flota de la Marina y estratega del Gobierno Mundial. Dirige la reunión de los Señores del Mar en la que se discute el sustituto de Crocodile.'],

  ['Tsuru', '6', 'supporting', 'つる中将', 'Minori Matsushima',
    'Vicealmirante de la Marina y vieja conocida de Garp y Sengoku. Participa en la reunión de los Señores del Mar.'],

  ['Bartholomew Kuma', '6,10,11', 'supporting', 'バーソロミュー・くま', 'Hideyuki Hori',
    'Uno de los Siete Señores del Mar, con aspecto de oso y poderes desconocidos. Asiste a la reunión de Mary Geoise.'],

  ['Donquixote Doflamingo', '6', 'antagonist', 'ドフラミンゴ・ドンキホーテ', 'Hideyuki Tanaka',
    'Uno de los Siete Señores del Mar, conocido como el Joker. Asiste a la reunión de Mary Geoise y se burla de la Marina.'],

  ['Edward Newgate', '6', 'supporting', 'エドワード・ニューゲート', 'Kinryuu Arimoto',
    'Capitán de los Piratas de Barbablanca y uno de los Cuatro Emperadores. Recibe a Shanks y se niega a detener a Ace.'],

  ['Marco', '6', 'supporting', 'マルコ', 'Masakazu Morita',
    'Comandante de la primera flota de Barbablanca. Tiene el pelo rubio y una fruta que le permite regenerarse.'],

  ['Jozu', '6', 'supporting', 'ジョズ', 'Takashi Nagasako',
    'Comandante de la tercera flota de Barbablanca. Es enorme y fuerte, y protege a su capitán.'],

  ['Rockstar', '6', 'supporting', 'ロックスター', 'Daisuke Gouri',
    'Pirata novato de los Piratas Pelirrojos. Lleva un mensaje de Shanks a Barbablanca y es rechazado.'],

  // ── TEMPORADA 8: Water Seven y CP9 ───────────────────────────────

  ['Franky', '8,9', 'main', 'フランキー', 'Kazuki Yao',
    'Cyborg y carpintero de Water Seven, antiguo aprendiz de Tom. Construye el Thousand Sunny y se une a la tripulación como carpintero.'],

  ['Iceberg', '8,9', 'supporting', 'アイスバーグ', 'Shinichirou Miki',
    'Alcalde de Water Seven y líder de Galley-La. Fue aprendiz de Tom y guarda los planos de Pluton.'],

  ['Paulie', '8,9', 'supporting', 'パウリ', 'Takahiro Yoshimizu',
    'Capataz de Galley-La y experto en cuerdas. Ayuda a la tripulación y se enfrenta a la Familia Franky.'],

  ['Kaku', '8,9', 'supporting', 'カク', 'Ryoutarou Okiayu',
    'Carpintero de Galley-La que en realidad es un agente de CP9. Comió la Fruta de la Jirafa y pelea con Zoro.'],

  ['Rob Lucci', '8,9', 'antagonist', 'ロブ・ルッチ', 'Tomokazu Seki',
    'Agente de CP9 y asesino del Gobierno. Comió la Fruta del Leopardo y es el rival final de Luffy en Enies Lobby.'],

  ['Kalifa', '8,9', 'supporting', 'カリファ', 'Naomi Shindou',
    'Agente de CP9 que se infiltra como secretaria de Iceberg. Comió la Fruta de la Burbuja y pelea con Nami.'],

  ['Blueno', '8,9', 'supporting', 'ブルーノ', 'Seiji Sasaki',
    'Agente de CP9 con la Fruta de la Puerta. Secuestra a Robin y se enfrenta a Luffy.'],

  ['Jabra', '8,9', 'supporting', 'ジャブラ', 'Masaya Takatsuka',
    'Agente de CP9 con la Fruta del Lobo. Pelea con Sanji y es el único que puede moverse usando el Iron Body.'],

  ['Kumadori', '8,9', 'supporting', 'クマドリ', 'Hiroaki Yoshida',
    'Agente de CP9 con el pelo largo y una técnica de control del cuerpo. Pelea con Chopper y es derrotado por su forma monstruosa.'],

  ['Fukurou', '8,9', 'supporting', 'フクロウ', 'Kumiko Watanabe',
    'Agente de CP9, delgado y hablador, con una boca que no puede cerrar. Pelea con Franky.'],

  ['Spandam', '8,9', 'antagonist', 'スパンダム', 'Masaya Onosaka',
    'Jefe de CP9 e hijo de Spandine. Ambicioso y cobarde, ordena el Buster Call sobre Enies Lobby.'],

  ['Tom', '8', 'supporting', 'トム', 'Yasuo Muramatsu',
    'Legendario carpintero de Water Seven y maestro de Franky e Iceberg. Construyó el tren marino y el barco de Gol D. Roger.'],

  ['Kokoro', '8,9', 'supporting', 'ココロ', 'Ako Mayama',
    'Jefa de la estación de Water Seven y abuela de Chimney. En realidad es una sirena y ayuda a la tripulación a escapar.'],

  ['Chimney', '8,9', 'supporting', 'チムニー', 'Chiwa Saitou',
    'Niña hiperactiva de Water Seven y nieta de Kokoro. Acompaña a la tripulación con su gato Gonbe.'],

  ['Gonbe', '8,9', 'supporting', 'ゴンベ', 'Akemi Okamura',
    'Gato con aspecto de conejo que acompaña a Chimney. Es un compañero fiel y algo glotón.'],

  ['Yokozuna', '8,9', 'supporting', 'ヨコヅナ', 'Masaya Takatsuka',
    'Rana gigante que entrena contra el tren marino. Ayuda a la tripulación a llegar a Enies Lobby.'],

  ['Tilestone', '8,9', 'supporting', 'タイルストン', 'Tetsu Inada',
    'Carpintero de Galley-La y maestro del hacha. Ayuda a la alianza en Enies Lobby.'],

  ['Peepley Lulu', '8,9', 'supporting', 'ピープリー･ルル', 'Shinichirou Oota',
    'Carpintero de Galley-La y experto en cuerdas. Participa en el asalto a Enies Lobby.'],

  ['Mozu', '8,9', 'supporting', 'モズ', 'Miki Fukui',
    'Carpintera de Galley-La y hermana de Kiwi. Pelea con un martillo y ayuda en Enies Lobby.'],

  ['Kiwi', '8,9', 'supporting', 'キウイ', 'Yuka Shioyama',
    'Carpintera de Galley-La y hermana de Mozu. Pelea con un martillo y ayuda en Enies Lobby.'],

  ['Zambai', '8,9', 'supporting', 'ザンバイ', 'Kouichi Nagano',
    'Líder de la Familia Franky y viejo amigo de Franky. Organiza a los suyos para ayudar a la tripulación.'],

  ['Nero', '8', 'supporting', 'ネロ', 'Hidenobu Kiuchi',
    'Agente de CP9 conocido como la Comadreja. Pelea con Franky en el tren marino.'],

  ['T-Bone', '8', 'supporting', 'Ｔボーン', 'Tomomichi Nishimura',
    'Capitán de la Marina conocido como el Cortabarcos. Se enfrenta a Zoro en el tren marino.'],

  ['Wanze', '8', 'supporting', 'ワンゼ', 'Yasuhiro Takato',
    'Agente del Gobierno y cocinero que pelea con Ramen Kenpo. Se enfrenta a Sanji en el tren marino.'],

  // ── TEMPORADA 9: Enies Lobby, Ohara y los Accino ─────────────────

  ['Oimo', '9', 'supporting', 'オイモ', 'Hiroshi Okamoto',
    'Gigante que custodia la segunda puerta de Enies Lobby. Cree que Dorry y Brogy están presos y se rebela al saber la verdad.'],

  ['Kashi', '9', 'supporting', 'カーシー', 'Kouhei Fukuhara',
    'Gigante que custodia la segunda puerta de Enies Lobby junto a Oimo. También se une a la alianza.'],

  ['Spandine', '9', 'supporting', 'スパンダイン', 'Masaya Onosaka',
    'Padre de Spandam y antiguo jefe de CP9. Ordenó el Buster Call sobre Ohara veinte años atrás.'],

  ['Jaguar D. Saul', '9', 'supporting', 'ハグワール･D･サウロ', 'Takeshi Kusao',
    'Vicealmirante gigante que abandonó la Marina y se hizo amigo de Robin en Ohara. Muere protegiéndola del Buster Call.'],

  ['Nico Olvia', '9', 'supporting', 'ニコ・オルビア', 'Yuriko Yamaguchi',
    'Arqueóloga de Ohara y madre de Robin. Vuelve a la isla para advertir a sus colegas del ataque del Gobierno.'],

  ['Clover', '9', 'supporting', 'クローバー', 'Kouichi Kitamura',
    'Profesor y líder de los arqueólogos de Ohara. Muere por investigar el siglo vacío.'],

  ['Don Accino', '9', 'supporting', 'ドン・アッチーノ', 'Tomomichi Nishimura',
    'Capitán de la familia Accino y usuario de la Fruta del Calor. Caza a los sombrero de paja para cobrar su recompensa.'],

  ['Hockera', '9', 'supporting', 'ホッケラ・アッチーノ', 'Takuma Suzuki',
    'Miembro de la familia Accino que usa un traje térmico. Pelea contra Franky en el mar helado.'],

  ['Salchow', '9', 'supporting', 'サルコー・アッチーノ', 'Katsuyuki Konishi',
    'Miembro de la familia Accino y esposo de Arbell. Pelea contra Sanji y Usopp.'],

  ['Brindo', '9', 'supporting', 'ブリンド・アッチーノ', 'Kouichi Toochika',
    'Miembro de la familia Accino que forma un imán con su hermano Canpacino. Pelea contra Luffy.'],

  ['Arbell', '9', 'supporting', 'アルベル・アッチーノ', 'Yuuko Nagashima',
    'Miembro de la familia Accino y hermana de Lil. Pelea con un látigo y ayuda a su familia.'],

  ['Lil', '9', 'supporting', 'リル・アッチーノ', 'Katsue Miwa',
    'Miembro de la familia Accino que controla peces voladores. Se hace amiga de Robin.'],

  ['Canpacino', '9', 'supporting', 'カンパチーノ・アッチーノ', 'Taiki Matsuno',
    'Miembro de la familia Accino y hermano de Brindo. Forma un imán con él y pelea contra Puzzle.'],

  ['Jiro', '9', 'supporting', 'ジロー', 'Miyu Irino',
    'Grumete de los Piratas del Fénix. Ayuda a Chopper a operar a Puzzle y se hace amigo de la tripulación.'],

  // ── TEMPORADA 10: Thriller Bark ──────────────────────────────────

  ['Brook', '10,11', 'main', 'ブルック', 'Choo',
    'Esqueleto músico que comió la Fruta de la Resurrección y perdió su sombra en Thriller Bark. Fue capitán de los Piratas Rumbar y quiere volver a ver a la ballena Laboon.'],

  ['Gecko Moria', '10', 'antagonist', 'ゲッコー・モリア', 'Katsuhisa Houki',
    'Uno de los Siete Señores del Mar y dueño de Thriller Bark. Comió la Fruta de la Sombra y roba las sombras de sus víctimas para animar zombis; quiere crear un ejército para el Nuevo Mundo.'],

  ['Perona', '10', 'supporting', 'ぺローナ', 'Kumiko Nishihara',
    'Princesa Fantasma de Thriller Bark y lugarteniente de Moria. Comió la Fruta del Fantasma y usa fantasmas negativos y explosivos; se enfrenta a Usopp.'],

  ['Absalom', '10', 'supporting', 'アブサロム', 'Hiroaki Miura',
    'Zombi invisible de Thriller Bark y lugarteniente de Moria. Comió la Fruta de la Transparencia y quiere casarse con Nami; Sanji lo derrota.'],

  ['Hogback', '10', 'supporting', 'ドクトル・ホグバック', 'Hiroshi Iwasaki',
    'Cirujano famoso de Thriller Bark que trabaja para Moria. Resucita cadáveres como zombis y experimenta con Victoria Cindry; Chopper lo detesta.'],

  ['Ryuma', '10', 'supporting', '霜月リューマ', 'Choo',
    'Samurái zombi de Thriller Bark que guarda la sombra de Brook. Pelea con Zoro y le entrega su espada Shusui al ser derrotado.'],

  ['Oars', '10', 'supporting', 'オーズ', 'Mayumi Tanaka',
    'Gigante legendario resucitado por Moria con la sombra de Luffy. Se comporta como Luffy y es el enemigo más fuerte de Thriller Bark.'],

  ['Victoria Cindry', '10', 'supporting', 'ビクトリア・シンドリー', 'Houko Kuwashima',
    'Actriz fallecida resucitada por Hogback como zombi. Sirve en su mansión y conserva un gesto de rebeldía contra su creador.'],

  ['Hildon', '10', 'supporting', 'ヒルドン', 'Taiki Matsuno',
    'Vampiro de Thriller Bark que guía a Nami, Usopp y Chopper hasta la mansión de Hogback. Es un servidor de Moria.'],

  ['Lola', '10', 'supporting', 'ローラ', 'Aya Hisakawa',
    'Capitana de los Piratas Rodantes y zombi con la sombra de una pirata. Se enamora de Absalom y ayuda a Nami y a Luffy contra Moria.'],

  // ── TEMPORADA 11: Sabaody y las Supernovas ───────────────────────

  ['Camie', '11', 'supporting', 'ケイミー', 'Haruna Ikezawa',
    'Sirena que la tripulación rescata en el mar. Trabaja en una tienda de takoyaki con Pappagu y Hatchan y sueña con ser diseñadora.'],

  ['Pappagu', '11', 'supporting', 'パッパグ', 'Kouzou Shioya',
    'Estrella de mar y compañero de Camie. Habla por ella y la ayuda en la tienda; es el encargado de presentar a los sombrero de paja Sabaody.'],

  ['Duval', '11', 'supporting', 'デュバル', 'Toshihiko Seki',
    'Antiguo bandido que odia a Sanji porque su cartel de recompensa le arruinó la cara. Tras la paliza de Sanji se vuelve guapo y ayuda a la tripulación con los Rosy Life Riders.'],

  ['Silvers Rayleigh', '11', 'supporting', 'シルバーズ・レイリー', 'Keiichi Sonobe',
    'Primer oficial de los Piratas de Roger y el mecánico que puede recubrir barcos en Sabaody. Es uno de los hombres más fuertes del mundo y ayuda a Luffy.'],

  ['Shakky', '11', 'supporting', 'シャクヤク', 'Hiromi Tsuru',
    'Dueña del bar de Sabaody y vieja conocida de Rayleigh. Informa a la tripulación de las Supernovas y de los peligros del archipiélago.'],

  ['Eustass Kid', '11', 'supporting', 'ユースタス・キッド', 'Daisuke Namikawa',
    'Capitán de los Piratas de Kid y una de las once Supernovas. Comió la Fruta del Imán y tiene una recompensa enorme; rival de Luffy.'],

  ['Killer', '11', 'supporting', 'キラー', 'Kenji Hamada',
    'Mano derecha de Eustass Kid y una de las Supernovas. Lleva una máscara y pelea con cuchillas giratorias.'],

  ['Trafalgar Law', '11', 'supporting', 'トラファルガー・ロー', 'Hiroshi Kamiya',
    'Capitán de los Piratas Heart y una de las Supernovas. Comió la Fruta de la Operación y se alía con Luffy en Sabaody.'],

  ['Jewelry Bonney', '11', 'supporting', 'ジュエリー・ボニー', 'Reiko Kiuchi',
    'Capitana de los Piratas de Bonney y una de las Supernovas. Comió la Fruta de la Edad y tiene un apetito enorme.'],

  ['X Drake', '11', 'supporting', 'Ｘ・ドレーク', 'Eiji Takemoto',
    'Capitán de los Piratas Drake y una de las Supernovas. Antiguo marine y usuario de una Fruta Zoan de dinosaurio.'],

  ['Basil Hawkins', '11', 'supporting', 'バジル・ホーキンス', 'Shigenori Souya',
    'Capitán de los Piratas de Hawkins y una de las Supernovas. Usa cartas y muñecos de paja para desviar el daño.'],

  ['Urouge', '11', 'supporting', 'ウルージ', 'Taiten Kusunoki',
    'Capitán de los Piratas del Monje y una de las Supernovas. Un gigante que convierte el daño recibido en fuerza.'],

  ['Capone Bege', '11', 'supporting', 'カポネ・ベッジ', 'Naoki Tatsuta',
    'Capitán de los Piratas de Fuego y una de las Supernovas. Comió la Fruta del Castillo y guarda un ejército dentro de su cuerpo.'],

  ['Scratchmen Apoo', '11', 'supporting', 'スクラッチメン・アプー', 'Mitsuaki Madono',
    'Capitán de los Piratas del Sonido y una de las Supernovas. Convierte su cuerpo en instrumentos y ataca con música.'],

  ['Kizaru', '11', 'antagonist', 'ボルサリーノ', 'Unshou Ishizuka',
    'Almirante de la Marina. Comió la Fruta de la Luz y se mueve a la velocidad de la luz; llega a Sabaody para detener a los sombrero de paja.'],

  ['Sentomaru', '11', 'supporting', '戦桃丸', 'Kazue Ikura',
    'Capitán de la unidad científica de la Marina y guardaespaldas de Vegapunk. Lleva un hacha enorme y dirige a los Pacifistas en Sabaody.'],

  ['Saint Charloss', '11', 'antagonist', 'チャルロス聖', 'Chafuurin',
    'Dragón Celestial y uno de los nobles de Mary Geoise. Dispara a un esclavo y a Hatchan, y Luffy lo golpea en la subasta.'],

  // ── TEMPORADA 12: Amazon Lily ───────────────────────────────────

  ['Boa Hancock', '12,13', 'supporting', 'ボア・ハンコック', 'Kotono Mitsuishi',
    'Emperatriz de Amazon Lily y una de los Siete Señores del Mar, conocida como la Princesa Serpiente. Comió la Fruta del Amor y convierte en piedra a quien se enamora de ella; ayuda a Luffy a llegar a Impel Down.'],

  ['Boa Sandersonia', '12', 'supporting', 'ボア・サンダーソニア', 'Chiwa Saitou',
    'Segunda de las hermanas Gorgona y gobernante de Amazon Lily. Comió la Fruta de la Serpiente y pelea con haki; fue esclava de los Dragones Celestiales.'],

  ['Boa Marigold', '12', 'supporting', 'ボア・マリーゴールド', 'Kimiko Saitou',
    'Tercera de las hermanas Gorgona. Comió la Fruta de la Serpiente y usa veneno y fuego; comparte con sus hermanas el pasado de esclavitud.'],

  ['Margaret', '12', 'supporting', 'マーガレット', 'Masumi Asano',
    'Guerrera de Amazon Lily que encuentra a Luffy y lo cuida. Es convertida en piedra por Hancock y luego liberada; se hace amiga de Luffy.'],

  ['Momonga', '12', 'supporting', 'モモンガ', 'Shinichirou Oota',
    'Vicealmirante de la Marina que va a Amazon Lily a llamar a Hancock. Es uno de los oficiales que participan en la guerra contra Barbablanca.'],

  // ── TEMPORADA 13: Impel Down ────────────────────────────────────

  ['Magellan', '13', 'antagonist', 'マゼラン', 'Mitsuaki Hoshino',
    'Alcaide de Impel Down. Comió la Fruta del Veneno y puede envenenar todo lo que toca; es el enemigo más peligroso de la prisión.'],

  ['Hannyabal', '13', 'antagonist', 'ハンニャバル', 'Tetsuo Gotou',
    'Vicealcaide de Impel Down, ambicioso y cómico. Sueña con ser alcaide y se enfrenta a Luffy para defender la prisión.'],

  ['Domino', '13', 'supporting', 'ドミノ', 'Naomi Shindou',
    'Guardia de Impel Down que registra a Hancock. Es petrificada por ella para que Luffy pueda escapar.'],

  ['Saldeath', '13', 'supporting', 'サルデス', 'Kazuya Nakai',
    'Jefe de los guardias de Impel Down. Usa una red de kairoseki y dirige a los Blugori contra Luffy.'],

  ['Sadie', '13', 'supporting', 'サディちゃん', 'Yuka Koyama',
    'Jefa de los guardias demonio de Impel Down. Pelea con un látigo y se enfrenta a Ivankov y a los presos.'],

  ['Shiryu', '13', 'antagonist', 'シリュウ', 'Takayuki Sugou',
    'Antiguo jefe de los guardias de Impel Down, encarcelado en el nivel 6. Magellan lo libera para detener a Barbanegra y acaba uniéndose a él.'],

  ['Inazuma', '13', 'supporting', 'イナズマ', 'Kenji Hamada',
    'Comandante del Ejército Revolucionario y mano derecha de Ivankov. Comió la Fruta de las Tijeras y puede cortar el suelo y el espacio.'],

  ['Emporio Ivankov', '13', 'supporting', 'エンポリオ・イワンコフ', 'Mitsuo Iwata',
    'Reina del Reino Kamabakka y comandante del Ejército Revolucionario. Comió la Fruta de las Hormonas y cura a Luffy en el nivel 5.5 de Impel Down.'],

  ['Jimbei', '13', 'supporting', 'ジンベエ', 'Daisuke Gouri',
    'Tiburón ballena y uno de los Siete Señores del Mar, conocido como el Caballero del Mar. Está preso en Impel Down por negarse a luchar contra Barbablanca y se une a Luffy.'],

  ['Shiki', '13', 'supporting', 'シキ', 'Naoto Takenaka',
    'El León Dorado, legendario pirata que escapó de Impel Down hace veinte años. Es el villano de la película Strong World y aparece en el especial de la temporada.'],

  ['Yoko', '13', 'supporting', 'ヨーコ', 'Mari Yaguchi',
    'Niña que vive en la isla del especial de Strong World y cuida del escarabajo Boss. Ayuda a los sombrero de paja contra los Piratas Amigo.'],
];
