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

  ['Buggy', '1,6', 'supporting', 'バギー', 'Shigeru Chiba',
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

  ['Dracule Mihawk', '1,6', 'supporting', 'ジュラキュール・ミホーク', 'Takeshi Aono',
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

  ['Mr. 3', '2,4', 'supporting', 'ギャルディーノ', 'Nobuyuki Hiyama',
    'Agente de Baroque Works que comió la Fruta de la Cera. Es un estratega frío que prefiere las trampas al combate y que atrapa a Nami y a Zoro en un pedestal de cera en Little Garden.'],

  ['Miss Goldenweek', '2', 'supporting', 'マリアンヌ', 'Akiko Nakagawa',
    'Compañera de Mr. 3. Pinta símbolos con los colores de sus pinturas y controla las emociones de quien los mira. Es tranquila y casi nunca habla.'],

  ['Mr. 5', '2', 'supporting', 'ジェム', 'Masaya Takatsuka',
    'Agente de Baroque Works que comió la Fruta de la Explosión. Todo su cuerpo explota, incluso su aliento, y dispara desde un revólver que convierte en bombas lo que toca.'],

  ['Miss Valentine', '2', 'supporting', 'ミキータ', 'Fumiko Orikasa',
    'Compañera de Mr. 5. Comió la Fruta del Peso y cambia su peso a voluntad: puede flotar como una pluma o caer sobre su enemigo como una tonelada.'],

  ['Nico Robin', '2,4,5,6,7', 'supporting', 'ニコ・ロビン', 'Yuriko Yamaguchi',
    'Vicepresidenta de Baroque Works, conocida como Miss All Sunday. Aparece en el barco de los sombrero de paja, les ofrece un eternal pose y demuestra que sabe demasiado sobre ellos. Tras la caída de Crocodile en Arabasta, se une a la tripulación.'],

  // ── TEMPORADA 3: la isla de Drum y Tony Tony Chopper ───────────────

  ['Tony Tony Chopper', '3,4,5,6,7', 'main', 'トニートニー・チョッパー', 'Ikue Ootani',
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

  ['Crocodile', '4', 'supporting', 'クロコダイル', 'Ryuuzaburou Ootomo',
    'Uno de los Siete Señores del Mar y jefe secreto de Baroque Works, conocido como Mr. 0. Comió la Fruta de la Arena y puede secar cualquier cosa que toque. Quiere hacerse con el reino de Arabasta para encontrar el arma ancestral Pluton.'],

  ['Mr. 1', '4', 'supporting', 'ダズ・ボーネス', 'Tetsu Inada',
    'Agente de élite de Baroque Works y pareja de Miss Doublefinger. Comió la Fruta del Dado y puede convertir cualquier parte de su cuerpo en una cuchilla de acero. Es frío y silencioso, y se enfrenta a Zoro en Alubarna.'],

  ['Miss Doublefinger', '4', 'supporting', 'ザラ', 'Ako Mayama',
    'Agente de élite de Baroque Works y pareja de Mr. 1. Comió la Fruta de la Espina y puede sacar púas de todo el cuerpo. Se enfrenta a Nami, que estrena el Clima Táctil.'],

  ['Mr. 2', '3,4', 'supporting', 'ベンサム', 'Kazuki Yao',
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

  ['Enel', '6', 'supporting', 'エネル', 'Toshiyuki Morikawa',
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

  ['Bellamy', '6', 'supporting', 'ベラミー', 'Wataru Takagi',
    'Pirata de Mock Town conocido como la Hiena. Comió la Fruta del Resorte y se burla de los sueños de los demás; Luffy lo derrota de un solo golpe.'],

  ['Sarquiss', '6', 'supporting', 'サーキース', 'Yuuji Ueda',
    'Primer oficial de Bellamy y su aliado más fiel. Pelea con una espada y participa en el ataque a la casa de Cricket.'],

  ['Marshall D. Teach', '6', 'supporting', 'マーシャル・D・ティーチ', 'Akio Ootsuka',
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

  ['Foxy', '7', 'supporting', 'フォクシー', 'Bin Shimada',
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
];
