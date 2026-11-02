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

  ['Buggy', '1,6,13,14,17', 'antagonist', 'バギー', 'Shigeru Chiba',
    'Pirata payaso que comió la Fruta de la Separación y puede dividir su cuerpo en trozos. Guarda un rencor enorme a Shanks y busca vengarse de Luffy.'],

  ['Alvida', '1,13', 'antagonist', 'アルビダ', 'Youko Matsuoka',
    'Capitana pirata que esclavizó a Koby y se enfrentó a Luffy al principio del viaje. Su maza y su carácter la hacen temible, aunque acaba lanzada por los aires.'],

  ['Koby', '1,2,14', 'supporting', 'コビー', 'Mika Doi',
    'Chico tímido que era esclavo de Alvida. Ayuda a Luffy al principio del viaje y luego se alista en la Marina para cumplir su sueño de ser un soldado honrado.'],

  ['Helmeppo', '1,2,14', 'supporting', 'ヘルメッポ', 'Kouichi Nagano',
    'Hijo del capitán Morgan. Es cobarde y presumido, y se aprovecha del cargo de su padre hasta que Luffy y Zoro le dan su merecido.'],

  ['Morgan', '1', 'antagonist', 'モーガン', 'Banjou Ginga',
    'Capitán de la Marina en la isla de Shells. Gobierna con mano de hierro, se cree por encima de la ley y lleva un hacha en lugar de mano.'],

  ['Kuro', '1', 'antagonist', 'クロ', 'Kouichi Hashimoto',
    'Mayordomo de la familia de Kaya bajo el nombre de Klahadore. En realidad es el capitán pirata de los Gatos Negros, que fingió su muerte para robar la fortuna de la joven.'],

  ['Jango', '1', 'supporting', 'ジャンゴ', 'Kazuki Yao',
    'Hipnotizador del capitán Kuro. Sus colgantes y su péndulo duermen a cualquiera, aunque a veces se hipnotiza a sí mismo por error.'],

  ['Dracule Mihawk', '1,6,14', 'supporting', 'ジュラキュール・ミホーク', 'Takeshi Aono',
    'El mejor espadachín del mundo, conocido como Ojos de Halcón. Derrota a Zoro sin esfuerzo y le deja vivo para que algún día vuelva a retarlo.'],

  ['Zeff', '1', 'supporting', 'ゼフ', 'Kouji Yada',
    'Cocinero y dueño del Baratie. Fue un pirata famoso, Pies Rojos, hasta que perdió una pierna para salvar a Sanji. Le enseñó a cocinar y a pelear.'],

  ['Don Krieg', '1', 'antagonist', '首領・クリーク', 'Fumihiko Tachiki',
    'Almirante pirata que se cree invencible. Llega al Baratie con su flota destrozada y trata de quedarse con el restaurante y con las vidas de sus cocineros.'],

  ['Arlong', '1,15', 'antagonist', 'アーロン', 'Juurouta Kosugi',
    'Pirata hombre pez que domina la aldea de Cocoyashi. Cobra un tributo mensual a los aldeanos y obligó a Nami a dibujar mapas para él durante ocho años.'],

  ['Hatchan', '1,11,15', 'supporting', 'はっちゃん', 'Toshiyuki Morikawa',
    'Hombre pez pulpo de seis brazos que lucha con tres pares de espadas. Forma parte de la tripulación de Arlong y se enfrenta a Zoro en Arlong Park.'],

  ['Nojiko', '1', 'supporting', 'ノジコ', 'Wakana Yamazaki',
    'Hermana mayor adoptiva de Nami. Cuida de los tangerinos de Bell-mère y cuenta a los sombrero de paja la verdad sobre el pasado de su hermana.'],

  ['Smoker', '1,2,3,4,15,16', 'supporting', 'スモーカー', 'Mahito Ooba',
    'Capitán de la Marina en Loguetown. Comió la Fruta del Humo y puede convertirse en niebla. Persigue a Luffy sin descanso porque nunca deja escapar a un pirata.'],

  ['Tashigi', '1,4,15,16', 'supporting', 'たしぎ', 'Junko Noda',
    'Sargento de la Marina y experta en katanas. Se parece muchísimo a Kuina, la amiga de la infancia de Zoro, y quiere recuperar las espadas famosas que están en malas manos.'],

  ['Shanks', '1,6,14', 'supporting', 'シャンクス', 'Shuuichi Ikeda',
    'Capitán de los Piratas Pelirrojos e ídolo de la infancia de Luffy. Le regaló su sombrero de paja y perdió un brazo para salvarlo de un rey marino.'],

  ['Dragon', '1', 'supporting', 'ドラゴン', 'Hidekatsu Shibata',
    'Hombre misterioso con capa verde que aparece en Loguetown y salva a Luffy de Smoker. Su verdadera identidad y sus planes son un enigma.'],

  ['Makino', '1', 'supporting', 'マキノ', 'Makiko Oomoto',
    'Dueña del bar de la aldea de Foosha. Cuida de Luffy cuando es niño y le sirve la comida en el local donde Shanks y su tripulación celebran.'],

  // ── TEMPORADA 2: Reverse Mountain, Whisky Peak y Little Garden ──────

  ['Crocus', '2', 'supporting', 'クロッカス', 'Gorou Naya',
    'Médico y farero de Reverse Mountain. Cuida de Laboon desde hace años y vive dentro de la ballena, donde ha pintado un cielo para que no esté sola. Fue médico de la tripulación de Gol D. Roger.'],

  ['Nefertari Vivi', '2,3,4,19', 'supporting', 'ネフェルタリ・ビビ', 'Misa Watanabe',
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

  ['Mr. 3', '2,4,13,14', 'supporting', 'ギャルディーノ', 'Nobuyuki Hiyama',
    'Agente de Baroque Works que comió la Fruta de la Cera. Es un estratega frío que prefiere las trampas al combate y que atrapa a Nami y a Zoro en un pedestal de cera en Little Garden.'],

  ['Miss Goldenweek', '2', 'supporting', 'マリアンヌ', 'Akiko Nakagawa',
    'Compañera de Mr. 3. Pinta símbolos con los colores de sus pinturas y controla las emociones de quien los mira. Es tranquila y casi nunca habla.'],

  ['Mr. 5', '2', 'supporting', 'ジェム', 'Masaya Takatsuka',
    'Agente de Baroque Works que comió la Fruta de la Explosión. Todo su cuerpo explota, incluso su aliento, y dispara desde un revólver que convierte en bombas lo que toca.'],

  ['Miss Valentine', '2', 'supporting', 'ミキータ', 'Fumiko Orikasa',
    'Compañera de Mr. 5. Comió la Fruta del Peso y cambia su peso a voluntad: puede flotar como una pluma o caer sobre su enemigo como una tonelada.'],

  ['Nico Robin', '2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19', 'supporting', 'ニコ・ロビン', 'Yuriko Yamaguchi',
    'Vicepresidenta de Baroque Works, conocida como Miss All Sunday. Aparece en el barco de los sombrero de paja, les ofrece un eternal pose y demuestra que sabe demasiado sobre ellos. Tras la caída de Crocodile en Arabasta, se une a la tripulación.'],

  // ── TEMPORADA 3: la isla de Drum y Tony Tony Chopper ───────────────

  ['Tony Tony Chopper', '3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19', 'main', 'トニートニー・チョッパー', 'Ikue Ootani',
    'Reno que comió la Fruta Humano-Humano y aprendió a hablar y a caminar como una persona. Quiere ser un médico capaz de curar cualquier enfermedad y se une a la tripulación en la isla de Drum.'],

  ['Kureha', '3,19', 'supporting', 'くれは', 'Masako Nozawa',
    'La doctora de la isla de Drum, conocida como la bruja. Tiene 139 años, vive en la cima del castillo y es la única persona capaz de curar la fiebre de Nami. Acoge a Chopper como aprendiz.'],

  ['Hiruluk', '3', 'supporting', 'ヒルルク', 'Shigeru Ushiyama',
    'Médico al que todos llamaban un matasanos. Cuidó de Chopper cuando era un reno rechazado y le enseñó que no hay enfermedad incurable. Su sueño eran los cerezos que florecen en la nieve.'],

  ['Wapol', '3,19', 'supporting', 'ワポル', 'Bin Shimada',
    'Antiguo rey de la isla de Drum. Comió la Fruta de la Comida y puede comerse cualquier cosa y unirla a su cuerpo. Huyó del reino cuando lo atacaron unos piratas y vuelve para recuperar el trono.'],

  ['Dalton', '3,19', 'supporting', 'ドルトン', 'Kenichi Ono',
    'Capitán de la guardia de Drum y hombre de confianza del pueblo. Comió la Fruta del Bisonte y se enfrenta a Wapol para proteger a los aldeanos cuando el rey vuelve a la isla.'],

  ['Chess', '3', 'supporting', 'チェス', 'Yuusuke Numata',
    'Uno de los dos sirvientes de Wapol. Lleva un arco y flechas y se enfrenta a los sombrero de paja junto a Kuromarimo, con quien se fusiona en un solo guerrero.'],

  ['Kuromarimo', '3', 'supporting', 'クロマーリモ', 'Kenji Nomura',
    'El otro sirviente de Wapol. Pelea con la electricidad estática que saca de su pelo y se une a Chess para formar Chessmarimo, el guerrero que se enfrenta a Chopper.'],

  // ── TEMPORADA 4: Arabasta y Baroque Works ─────────────────────────

  ['Crocodile', '4,13,14', 'antagonist', 'クロコダイル', 'Ryuuzaburou Ootomo',
    'Uno de los Siete Señores del Mar y jefe secreto de Baroque Works, conocido como Mr. 0. Comió la Fruta de la Arena y puede secar cualquier cosa que toque. Quiere hacerse con el reino de Arabasta para encontrar el arma ancestral Pluton.'],

  ['Mr. 1', '4,13,14', 'supporting', 'ダズ・ボーネス', 'Tetsu Inada',
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

  ['Portgas D. Ace', '4,6,14', 'supporting', 'ポートガス・D・エース', 'Daisuke Sakaguchi',
    'Hermano mayor de Luffy y comandante de la segunda flota de los Piratas de Barbablanca. Comió la Fruta del Fuego. Busca a Barbanegra, que mató a un compañero suyo, y se cruza con la tripulación en Arabasta.'],

  ['Toto', '4', 'supporting', 'トト', 'Masaaki Tsukada',
    'Padre de Koza y anciano de Yuba. Se queda en el pueblo enterrado por la arena porque espera que vuelva a manar agua, y confía en que el rey no ha abandonado a su pueblo.'],

  // ── TEMPORADA 5: las historias originales ─────────────────────────

  ['Zenny', '5', 'supporting', 'ゼニィ', 'Osamu Saka',
    'Viejo prestamista que vive con sus cabras en una isla a la que solo se llega por corrientes peligrosas. Lleva veinte años construyendo un barco pirata en la montaña y dice que sus cabras son su verdadero tesoro.'],

  ['Henzo', '5', 'supporting', 'ヘンゾ', 'Choo',
    'Científico de la isla de Luluka que lleva cincuenta años buscando la Niebla Arcoíris. De joven formó parte de los Piratas Pumpkin y quiere rescatar a sus compañeros, atrapados en la niebla.'],

  ['Whetton', '5', 'antagonist', 'ウェットン', 'Jouji Nakata',
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

  ['Ohm', '6', 'antagonist', 'オーム', 'Eiji Takemoto',
    'Sacerdote de Enel y maestro del Juicio de Hierro. Pelea con una espada de nube y entrena a animales feroces; se enfrenta a Zoro, Wyper y Gan Fall.'],

  ['Satori', '6', 'supporting', 'サトリ', 'Yasuhiro Takato',
    'Sacerdote de Enel y guardián del Juicio de las Esferas. Usa el mantra para anticipar los ataques y las esferas sorpresa para atrapar a sus enemigos.'],

  ['Shura', '6', 'antagonist', 'シュラ', 'Shinichirou Oota',
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

  ['Yama', '6', 'antagonist', 'ヤマ', 'Hidenari Ugaki',
    'Jefe de los soldados divinos de Enel. Pelea con un hacha enorme y se enfrenta a Robin en las ruinas de Shandora.'],

  ['Mont Blanc Cricket', '6', 'supporting', 'モンブラン・クリケット', 'Takashi Taniguchi',
    'Descendiente de Noland el Mentiroso y líder de la Alianza Saruyama. Lleva años buscando la ciudad de oro y ayuda a la tripulación a llegar a Skypiea.'],

  ['Masira', '6', 'supporting', 'マシラ', 'Aruno Tahara',
    'Pirata salvamento con aspecto de mono y hermano de Shoujou. Se dedica a recuperar barcos hundidos y ayuda a Cricket a preparar el Going Merry.'],

  ['Shoujou', '6', 'supporting', 'ショウジョウ', 'Isamu Tanonaka',
    'Pirata salvamento orangután y hermano de Masira. Forma parte de la Alianza Saruyama y ayuda a Cricket en la búsqueda de la ciudad de oro.'],

  ['Bellamy', '6,17', 'antagonist', 'ベラミー', 'Wataru Takagi',
    'Pirata de Mock Town conocido como la Hiena. Comió la Fruta del Resorte y se burla de los sueños de los demás; Luffy lo derrota en Jaya y vuelve a enfrentarse a él en Dressrosa.'],

  ['Sarquiss', '6', 'supporting', 'サーキース', 'Yuuji Ueda',
    'Primer oficial de Bellamy y su aliado más fiel. Pelea con una espada y participa en el ataque a la casa de Cricket.'],

  ['Marshall D. Teach', '6,14', 'antagonist', 'マーシャル・D・ティーチ', 'Akio Ootsuka',
    'Pirata conocido como Barbanegra. Se cruza con Luffy en Mock Town y le anima a no abandonar sus sueños; busca una presa importante para entrar en los Siete Señores del Mar.'],

  ['Van Augur', '6', 'supporting', 'ヴァン・オーガー', 'Masaya Takatsuka',
    'Francotirador de los piratas de Barbanegra. Aparece en Mock Town y demuestra una puntería imposible.'],

  ['Jesus Burgess', '6,17', 'antagonist', 'ジーザス・バージェス', 'Tetsu Inada',
    'Luchador enorme de los piratas de Barbanegra. Acompaña a su capitán en Jaya y en Dressrosa participa en el Coliseo para hacerse con la Fruta del Fuego.'],

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

  ['Aokiji', '7,14,16', 'supporting', 'クザン', 'Takehito Koyasu',
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

  ['Sham', '1', 'antagonist', 'シャム', 'Masaya Onosaka',
    'Hipnotizador de los Gatos Negros y hermano de Buchi. Pelea con guantes de acero y ayuda a Kuro en su plan.'],

  ['Buchi', '1', 'antagonist', 'ブチ', 'Yasuhiro Takato',
    'Luchador de los Gatos Negros y hermano de Sham. Pelea con garras de acero y se enfrenta a Zoro.'],

  ['Kuroobi', '1', 'antagonist', 'クロオビ', 'Hisao Egawa',
    'Oficial de los piratas de Arlong. Pelea con karate de hombre pez y se enfrenta a Sanji.'],

  ['Chew', '1', 'antagonist', 'チュウ', 'Masaya Onosaka',
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

  ['Ian', '5', 'antagonist', 'イアン', 'Masaya Takatsuka',
    'Capitán de asalto de los piratas de Wetton. Quedó atrapado en la Niebla Arcoíris con los Piratas Pumpkin y escapa con vida para reunirse con su capitán.'],

  ['Hotori y Kotori', '6', 'antagonist', 'ホトリとコトリ', 'Yasuhiro Takato',
    'Hermanos gemelos de Satori y tenientes de los soldados divinos de Enel. Usan diales y el mantra para vengar a su hermano, pero Nami y Gan Fall los derrotan.'],

  ['Baskerville', '9', 'antagonist', 'バスカビル', 'Mahito Ooba',
    'Jefe de justicia de Enies Lobby, en realidad tres hombres que fingen ser un solo cuerpo de tres cabezas. Manda a los jurados y a la guardia contra los intrusos.'],

  ['Puzzle', '9', 'supporting', 'パズール', 'Kishou Taniyama',
    'Capitán de los Piratas del Fénix y viejo pirata del Nuevo Mundo. Está gravemente herido cuando la tripulación lo encuentra y recupera la confianza para luchar contra los Accino.'],

  ['Sengoku', '6,14,17,19', 'supporting', 'センゴク', 'Takkou Ishimori',
    'Almirante de flota de la Marina y estratega del Gobierno Mundial. Dirige la reunión de los Señores del Mar en la que se discute el sustituto de Crocodile.'],

  ['Tsuru', '6,14,17', 'supporting', 'つる中将', 'Minori Matsushima',
    'Vicealmirante de la Marina y vieja conocida de Garp y Sengoku. Participa en la reunión de los Señores del Mar.'],

  ['Bartholomew Kuma', '6,10,11,14', 'supporting', 'バーソロミュー・くま', 'Hideyuki Hori',
    'Uno de los Siete Señores del Mar, con aspecto de oso y poderes desconocidos. Asiste a la reunión de Mary Geoise.'],

  ['Donquixote Doflamingo', '6,14,16,17,19', 'antagonist', 'ドフラミンゴ・ドンキホーテ', 'Hideyuki Tanaka',
    'Uno de los Siete Señores del Mar, conocido como el Joker. Asiste a la reunión de Mary Geoise y se burla de la Marina.'],

  ['Edward Newgate', '6,14', 'supporting', 'エドワード・ニューゲート', 'Kinryuu Arimoto',
    'Capitán de los Piratas de Barbablanca y uno de los Cuatro Emperadores. Recibe a Shanks y se niega a detener a Ace.'],

  ['Marco', '6,14', 'supporting', 'マルコ', 'Masakazu Morita',
    'Comandante de la primera flota de Barbablanca. Tiene el pelo rubio y una fruta que le permite regenerarse.'],

  ['Jozu', '6,14', 'supporting', 'ジョズ', 'Takashi Nagasako',
    'Comandante de la tercera flota de Barbablanca. Es enorme y fuerte, y protege a su capitán.'],

  ['Rockstar', '6', 'supporting', 'ロックスター', 'Daisuke Gouri',
    'Pirata novato de los Piratas Pelirrojos. Lleva un mensaje de Shanks a Barbablanca y es rechazado.'],

  // ── TEMPORADA 8: Water Seven y CP9 ───────────────────────────────

  ['Franky', '8,9,14,15,16,17,18,19', 'main', 'フランキー', 'Kazuki Yao',
    'Cyborg y carpintero de Water Seven, antiguo aprendiz de Tom. Construye el Thousand Sunny y se une a la tripulación como carpintero.'],

  ['Iceberg', '8,9', 'supporting', 'アイスバーグ', 'Shinichirou Miki',
    'Alcalde de Water Seven y líder de Galley-La. Fue aprendiz de Tom y guarda los planos de Pluton.'],

  ['Paulie', '8,9', 'supporting', 'パウリ', 'Takahiro Yoshimizu',
    'Capataz de Galley-La y experto en cuerdas. Ayuda a la tripulación y se enfrenta a la Familia Franky.'],

  ['Kaku', '8,9', 'antagonist', 'カク', 'Ryoutarou Okiayu',
    'Carpintero de Galley-La que en realidad es un agente de CP9. Comió la Fruta de la Jirafa y pelea con Zoro.'],

  ['Rob Lucci', '8,9', 'antagonist', 'ロブ・ルッチ', 'Tomokazu Seki',
    'Agente de CP9 y asesino del Gobierno. Comió la Fruta del Leopardo y es el rival final de Luffy en Enies Lobby.'],

  ['Kalifa', '8,9', 'antagonist', 'カリファ', 'Naomi Shindou',
    'Agente de CP9 que se infiltra como secretaria de Iceberg. Comió la Fruta de la Burbuja y pelea con Nami.'],

  ['Blueno', '8,9', 'antagonist', 'ブルーノ', 'Seiji Sasaki',
    'Agente de CP9 con la Fruta de la Puerta. Secuestra a Robin y se enfrenta a Luffy.'],

  ['Jabra', '8,9', 'antagonist', 'ジャブラ', 'Masaya Takatsuka',
    'Agente de CP9 con la Fruta del Lobo. Pelea con Sanji y es el único que puede moverse usando el Iron Body.'],

  ['Kumadori', '8,9', 'antagonist', 'クマドリ', 'Hiroaki Yoshida',
    'Agente de CP9 con el pelo largo y una técnica de control del cuerpo. Pelea con Chopper y es derrotado por su forma monstruosa.'],

  ['Fukurou', '8,9', 'antagonist', 'フクロウ', 'Kumiko Watanabe',
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

  ['Nero', '8', 'antagonist', 'ネロ', 'Hidenobu Kiuchi',
    'Agente de CP9 conocido como la Comadreja. Pelea con Franky en el tren marino.'],

  ['T-Bone', '8', 'antagonist', 'Ｔボーン', 'Tomomichi Nishimura',
    'Capitán de la Marina conocido como el Cortabarcos. Se enfrenta a Zoro en el tren marino.'],

  ['Wanze', '8', 'antagonist', 'ワンゼ', 'Yasuhiro Takato',
    'Agente del Gobierno y cocinero que pelea con Ramen Kenpo. Se enfrenta a Sanji en el tren marino.'],

  // ── TEMPORADA 9: Enies Lobby, Ohara y los Accino ─────────────────

  ['Oimo', '9', 'supporting', 'オイモ', 'Hiroshi Okamoto',
    'Gigante que custodia la segunda puerta de Enies Lobby. Cree que Dorry y Brogy están presos y se rebela al saber la verdad.'],

  ['Kashi', '9', 'supporting', 'カーシー', 'Kouhei Fukuhara',
    'Gigante que custodia la segunda puerta de Enies Lobby junto a Oimo. También se une a la alianza.'],

  ['Spandine', '9', 'antagonist', 'スパンダイン', 'Masaya Onosaka',
    'Padre de Spandam y antiguo jefe de CP9. Ordenó el Buster Call sobre Ohara veinte años atrás.'],

  ['Jaguar D. Saul', '9', 'supporting', 'ハグワール･D･サウロ', 'Takeshi Kusao',
    'Vicealmirante gigante que abandonó la Marina y se hizo amigo de Robin en Ohara. Muere protegiéndola del Buster Call.'],

  ['Nico Olvia', '9', 'supporting', 'ニコ・オルビア', 'Yuriko Yamaguchi',
    'Arqueóloga de Ohara y madre de Robin. Vuelve a la isla para advertir a sus colegas del ataque del Gobierno.'],

  ['Clover', '9', 'supporting', 'クローバー', 'Kouichi Kitamura',
    'Profesor y líder de los arqueólogos de Ohara. Muere por investigar el siglo vacío.'],

  ['Don Accino', '9', 'antagonist', 'ドン・アッチーノ', 'Tomomichi Nishimura',
    'Capitán de la familia Accino y usuario de la Fruta del Calor. Caza a los sombrero de paja para cobrar su recompensa.'],

  ['Hockera', '9', 'antagonist', 'ホッケラ・アッチーノ', 'Takuma Suzuki',
    'Miembro de la familia Accino que usa un traje térmico. Pelea contra Franky en el mar helado.'],

  ['Salchow', '9', 'antagonist', 'サルコー・アッチーノ', 'Katsuyuki Konishi',
    'Miembro de la familia Accino y esposo de Arbell. Pelea contra Sanji y Usopp.'],

  ['Brindo', '9', 'antagonist', 'ブリンド・アッチーノ', 'Kouichi Toochika',
    'Miembro de la familia Accino que forma un imán con su hermano Canpacino. Pelea contra Luffy.'],

  ['Arbell', '9', 'antagonist', 'アルベル・アッチーノ', 'Yuuko Nagashima',
    'Miembro de la familia Accino y hermana de Lil. Pelea con un látigo y ayuda a su familia.'],

  ['Lil', '9', 'antagonist', 'リル・アッチーノ', 'Katsue Miwa',
    'Miembro de la familia Accino que controla peces voladores. Se hace amiga de Robin.'],

  ['Canpacino', '9', 'antagonist', 'カンパチーノ・アッチーノ', 'Taiki Matsuno',
    'Miembro de la familia Accino y hermano de Brindo. Forma un imán con él y pelea contra Puzzle.'],

  ['Jiro', '9', 'supporting', 'ジロー', 'Miyu Irino',
    'Grumete de los Piratas del Fénix. Ayuda a Chopper a operar a Puzzle y se hace amigo de la tripulación.'],

  // ── TEMPORADA 10: Thriller Bark ──────────────────────────────────

  ['Brook', '10,11,14,15,16,17,18,19', 'main', 'ブルック', 'Choo',
    'Esqueleto músico que comió la Fruta de la Resurrección y perdió su sombra en Thriller Bark. Fue capitán de los Piratas Rumbar y quiere volver a ver a la ballena Laboon.'],

  ['Gecko Moria', '10,14', 'antagonist', 'ゲッコー・モリア', 'Katsuhisa Houki',
    'Uno de los Siete Señores del Mar y dueño de Thriller Bark. Comió la Fruta de la Sombra y roba las sombras de sus víctimas para animar zombis; quiere crear un ejército para el Nuevo Mundo.'],

  ['Perona', '10,14', 'antagonist', 'ぺローナ', 'Kumiko Nishihara',
    'Princesa Fantasma de Thriller Bark y lugarteniente de Moria. Comió la Fruta del Fantasma y usa fantasmas negativos y explosivos; se enfrenta a Usopp.'],

  ['Absalom', '10', 'antagonist', 'アブサロム', 'Hiroaki Miura',
    'Zombi invisible de Thriller Bark y lugarteniente de Moria. Comió la Fruta de la Transparencia y quiere casarse con Nami; Sanji lo derrota.'],

  ['Hogback', '10', 'antagonist', 'ドクトル・ホグバック', 'Hiroshi Iwasaki',
    'Cirujano famoso de Thriller Bark que trabaja para Moria. Resucita cadáveres como zombis y experimenta con Victoria Cindry; Chopper lo detesta.'],

  ['Ryuma', '10', 'supporting', '霜月リューマ', 'Choo',
    'Samurái zombi de Thriller Bark que guarda la sombra de Brook. Pelea con Zoro y le entrega su espada Shusui al ser derrotado.'],

  ['Oars', '10', 'antagonist', 'オーズ', 'Mayumi Tanaka',
    'Gigante legendario resucitado por Moria con la sombra de Luffy. Se comporta como Luffy y es el enemigo más fuerte de Thriller Bark.'],

  ['Victoria Cindry', '10', 'supporting', 'ビクトリア・シンドリー', 'Houko Kuwashima',
    'Actriz fallecida resucitada por Hogback como zombi. Sirve en su mansión y conserva un gesto de rebeldía contra su creador.'],

  ['Hildon', '10', 'antagonist', 'ヒルドン', 'Taiki Matsuno',
    'Vampiro de Thriller Bark que guía a Nami, Usopp y Chopper hasta la mansión de Hogback. Es un servidor de Moria.'],

  ['Lola', '10', 'supporting', 'ローラ', 'Aya Hisakawa',
    'Capitana de los Piratas Rodantes y zombi con la sombra de una pirata. Se enamora de Absalom y ayuda a Nami y a Luffy contra Moria.'],

  // ── TEMPORADA 11: Sabaody y las Supernovas ───────────────────────

  ['Camie', '11,15', 'supporting', 'ケイミー', 'Haruna Ikezawa',
    'Sirena que la tripulación rescata en el mar. Trabaja en una tienda de takoyaki con Pappagu y Hatchan y sueña con ser diseñadora.'],

  ['Pappagu', '11,15', 'supporting', 'パッパグ', 'Kouzou Shioya',
    'Estrella de mar y compañero de Camie. Habla por ella y la ayuda en la tienda; es el encargado de presentar a los sombrero de paja Sabaody.'],

  ['Duval', '11,14', 'supporting', 'デュバル', 'Toshihiko Seki',
    'Antiguo bandido que odia a Sanji porque su cartel de recompensa le arruinó la cara. Tras la paliza de Sanji se vuelve guapo y ayuda a la tripulación con los Rosy Life Riders.'],

  ['Silvers Rayleigh', '11,14', 'supporting', 'シルバーズ・レイリー', 'Keiichi Sonobe',
    'Primer oficial de los Piratas de Roger y el mecánico que puede recubrir barcos en Sabaody. Es uno de los hombres más fuertes del mundo y ayuda a Luffy.'],

  ['Shakky', '11,14', 'supporting', 'シャクヤク', 'Hiromi Tsuru',
    'Dueña del bar de Sabaody y vieja conocida de Rayleigh. Informa a la tripulación de las Supernovas y de los peligros del archipiélago.'],

  ['Eustass Kid', '11,14,17,18', 'supporting', 'ユースタス・キッド', 'Daisuke Namikawa',
    'Capitán de los Piratas de Kid y una de las once Supernovas. Comió la Fruta del Imán y tiene una recompensa enorme; rival de Luffy.'],

  ['Killer', '11,14,17,18', 'supporting', 'キラー', 'Kenji Hamada',
    'Mano derecha de Eustass Kid y una de las Supernovas. Lleva una máscara y pelea con cuchillas giratorias.'],

  ['Trafalgar Law', '11,14,16,17,18', 'supporting', 'トラファルガー・ロー', 'Hiroshi Kamiya',
    'Capitán de los Piratas Heart y una de las Supernovas. Comió la Fruta de la Operación y se alía con Luffy en Sabaody.'],

  ['Jewelry Bonney', '11,14,19', 'supporting', 'ジュエリー・ボニー', 'Reiko Kiuchi',
    'Capitana de los Piratas de Bonney y una de las Supernovas. Comió la Fruta de la Edad y tiene un apetito enorme.'],

  ['X Drake', '11,14,17', 'supporting', 'Ｘ・ドレーク', 'Eiji Takemoto',
    'Capitán de los Piratas Drake y una de las Supernovas. Antiguo marine y usuario de una Fruta Zoan de dinosaurio.'],

  ['Basil Hawkins', '11,14,17,18', 'supporting', 'バジル・ホーキンス', 'Shigenori Souya',
    'Capitán de los Piratas de Hawkins y una de las Supernovas. Usa cartas y muñecos de paja para desviar el daño.'],

  ['Urouge', '11,14', 'supporting', 'ウルージ', 'Taiten Kusunoki',
    'Capitán de los Piratas del Monje y una de las Supernovas. Un gigante que convierte el daño recibido en fuerza.'],

  ['Capone Bege', '11,14,17,19', 'supporting', 'カポネ・ベッジ', 'Naoki Tatsuta',
    'Capitán de los Piratas de Fuego y una de las Supernovas. Comió la Fruta del Castillo y guarda un ejército dentro de su cuerpo.'],

  ['Scratchmen Apoo', '11,14,17,18', 'supporting', 'スクラッチメン・アプー', 'Mitsuaki Madono',
    'Capitán de los Piratas del Sonido y una de las Supernovas. Convierte su cuerpo en instrumentos y ataca con música.'],

  ['Kizaru', '11,14,15', 'antagonist', 'ボルサリーノ', 'Unshou Ishizuka',
    'Almirante de la Marina. Comió la Fruta de la Luz y se mueve a la velocidad de la luz; llega a Sabaody para detener a los sombrero de paja.'],

  ['Sentomaru', '11,14,15', 'supporting', '戦桃丸', 'Kazue Ikura',
    'Capitán de la unidad científica de la Marina y guardaespaldas de Vegapunk. Lleva un hacha enorme y dirige a los Pacifistas en Sabaody.'],

  ['Saint Charloss', '11', 'antagonist', 'チャルロス聖', 'Chafuurin',
    'Dragón Celestial y uno de los nobles de Mary Geoise. Dispara a un esclavo y a Hatchan, y Luffy lo golpea en la subasta.'],

  // ── TEMPORADA 12: Amazon Lily ───────────────────────────────────

  ['Boa Hancock', '12,13,14', 'supporting', 'ボア・ハンコック', 'Kotono Mitsuishi',
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

  ['Sadie', '13', 'antagonist', 'サディちゃん', 'Yuka Koyama',
    'Jefa de los guardias demonio de Impel Down. Pelea con un látigo y se enfrenta a Ivankov y a los presos.'],

  ['Shiryu', '13,14', 'antagonist', 'シリュウ', 'Takayuki Sugou',
    'Antiguo jefe de los guardias de Impel Down, encarcelado en el nivel 6. Magellan lo libera para detener a Barbanegra y acaba uniéndose a él.'],

  ['Inazuma', '13,14', 'supporting', 'イナズマ', 'Kenji Hamada',
    'Comandante del Ejército Revolucionario y mano derecha de Ivankov. Comió la Fruta de las Tijeras y puede cortar el suelo y el espacio.'],

  ['Emporio Ivankov', '13,14', 'supporting', 'エンポリオ・イワンコフ', 'Mitsuo Iwata',
    'Reina del Reino Kamabakka y comandante del Ejército Revolucionario. Comió la Fruta de las Hormonas y cura a Luffy en el nivel 5.5 de Impel Down.'],

  ['Jimbei', '13,14,15,19', 'supporting', 'ジンベエ', 'Daisuke Gouri',
    'Tiburón ballena y uno de los Siete Señores del Mar, conocido como el Caballero del Mar. Está preso en Impel Down por negarse a luchar contra Barbablanca y se une a Luffy.'],

  ['Shiki', '13', 'antagonist', 'シキ', 'Naoto Takenaka',
    'El León Dorado, legendario pirata que escapó de Impel Down hace veinte años. Es el villano de la película Strong World y aparece en el especial de la temporada.'],

  ['Yoko', '13', 'supporting', 'ヨーコ', 'Mari Yaguchi',
    'Niña que vive en la isla del especial de Strong World y cuida del escarabajo Boss. Ayuda a los sombrero de paja contra los Piratas Amigo.'],

  // ── TEMPORADA 14: Marineford ────────────────────────────────────

  ['Monkey D. Garp', '9,14,19', 'supporting', 'ガープ', 'Hiroshi Naka',
    'Vicealmirante de la Marina y abuelo de Luffy. Héroe de la Marina que persiguió a Roger y que ahora tiene que elegir entre su deber y su familia en Marineford.'],

  ['Akainu', '9,14,17,19', 'antagonist', 'サカズキ', 'Fumihiko Tachiki',
    'Almirante de la Marina, conocido como Akainu por su fruta de magma. Es el más implacable de los tres almirantes y persigue a Luffy y a Ace hasta el final de la guerra.'],

  ['Vista', '14', 'supporting', 'ビスタ', 'Masaya Takatsuka',
    'Comandante de la quinta división de los Piratas de Barbablanca. Espadachín con dos hojas que se enfrenta a Mihawk durante la guerra.'],

  ['Squard', '14', 'supporting', 'スクアード', 'Seiji Sasaki',
    'Capitán aliado de Barbablanca. Los marines le hacen creer que su capitán va a sacrificar a los suyos y acaba apuñalándolo en la plaza.'],

  ['Little Oars Jr.', '14', 'supporting', 'オーズJr.', 'Keiji Hirai',
    'Gigante descendiente de Oars y amigo de Ace. Entra solo en Marineford para abrir camino y cae bajo los ataques de Kuma, Doflamingo y Moria.'],

  ['Curly Dadan', '14', 'supporting', 'カーリー・ダダン', 'Noriko Uemura',
    'Jefa de los bandidos del monte Corvo, que crió a Ace y luego a Luffy. Se enfrenta a Bluejam para salvarlos y llora la muerte de Ace en silencio.'],

  ['Sabo', '14,17,19', 'supporting', 'サボ', 'Junko Takeuchi',
    'Hijo de un noble que se escapa al Terminal Gris y se hace hermano de Ace y Luffy. Muere de un disparo de un Dragón Celestial cuando se hace a la mar.'],

  ['Bluejam', '14', 'antagonist', 'ブルージャム', 'Akihiko Ishizumi',
    'Capitán de los Piratas de Bluejam. Trabaja para los nobles de Goa, quema el Terminal Gris y se enfrenta a los tres hermanos.'],

  // ── TEMPORADA 15: isla de los hombres pez ───────────────────────

  ['Shirahoshi', '15,19', 'supporting', 'しらほし', 'Yukana',
    'Princesa sirena de la isla de los hombres pez y única persona que puede hablar con los Reyes del Mar. Lleva diez años encerrada en la torre de concha.'],

  ['Neptune', '15', 'supporting', 'ネプチューン', 'Minoru Inaba',
    'Rey de la isla de los hombres pez y dios del mar. Gobierna el reino Ryugu y protege a su hija Shirahoshi de Vander Decken.'],

  ['Fukaboshi', '15', 'supporting', 'フカボシ', 'Kentarou Itou',
    'Primogénito de Neptuno y comandante de los príncipes. Intenta detener a Hordy y descubre el origen de su odio.'],

  ['Manboshi', '15', 'supporting', 'マンボシ', 'Kazunari Tanaka',
    'Segundo de los príncipes de la isla de los hombres pez. Alegre y algo despistado, ayuda a proteger a Shirahoshi.'],

  ['Ryuboshi', '15', 'supporting', 'リュウボシ', 'Yuusuke Numata',
    'Tercero de los príncipes de la isla de los hombres pez. Toca el violín y acompaña a sus hermanos en la defensa del reino.'],

  ['Otohime', '15', 'supporting', 'オトヒメ', 'Michiko Neya',
    'Reina de la isla de los hombres pez y madre de Shirahoshi. Luchó por la igualdad entre hombres y humanos y murió asesinada por el odio de la isla.'],

  ['Fisher Tiger', '15', 'supporting', 'フィッシャー・タイガー', 'Kouji Ishii',
    'Fundador de los Piratas del Sol y héroe que liberó a los esclavos de Mary Geoise. Fue esclavo y se negó a recibir sangre humana.'],

  ['Koala', '15,17,19', 'supporting', 'コアラ', 'Satsuki Yukino',
    'Niña rescatada por los Piratas del Sol. Tiger la devuelve a su madre y años después se une al Ejército Revolucionario.'],

  ['Hody Jones', '15', 'antagonist', 'ホーディ・ジョーンズ', 'Jouji Nakata',
    'Capitán de los Nuevos Piratas Hombre Pez. Su odio a los humanos no nace de ninguna experiencia, sino que lo heredó de la isla, y usa esteroides de energía para pelear.'],

  ['Vander Decken IX', '15', 'antagonist', 'バンダー・デッケン九世', 'Wataru Takagi',
    'Hombre pez que comió la Fruta de la Marca y puede lanzar cualquier objeto contra su objetivo. Obsesionado con Shirahoshi, estrella el Noah contra la isla.'],

  ['Caribou', '15', 'antagonist', 'カリブー', 'Masaki Terasoma',
    'Pirata con la Fruta del Pantano que se cuela en el Sunny. Es cruel, cobarde y solo piensa en secuestrar sirenas para venderlas.'],

  ['Pekoms', '15,18,19', 'supporting', 'ペコムズ', 'Nobuo Tobita',
    'Tripulante de Big Mom y usuario de una fruta Zoan de tortuga. Va a la isla de los hombres pez a cobrar el dulce mensual.'],

  ['Tamago', '15,19', 'supporting', 'タマゴ', 'Mugihito',
    'Barón y embajador de Big Mom. Acompaña a Pekoms a cobrar el tributo de dulces y negocia con Luffy.'],

  ['Charlotte Linlin', '15,19', 'antagonist', 'シャーロット・リンリン', 'Toshiko Fujita',
    'Big Mom, una de los Cuatro Emperadores. Protege la isla de los hombres pez a cambio de dulces y amenaza con destruirla si dejan de pagar.'],

  ['Wadatsumi', '15', 'antagonist', 'ワダツミ', 'Kouki Miyata',
    'Hombre pez gigante al servicio de Decken y después de Hordy. Pelea a puñetazos y acaba derrotado por Jimbei y Sanji.'],

  ['Hyouzou', '15', 'antagonist', 'ヒョウゾウ', 'Tetsuo Sakaguchi',
    'Espadachín pulpo de los Nuevos Piratas Hombre Pez. Usa ocho espadas envenenadas y se enfrenta a Zoro.'],

  ['Zeo', '15', 'antagonist', 'ゼオ', 'Shintarou Asanuma',
    'Oficial de los Nuevos Piratas Hombre Pez. Puede camuflarse y dirige a los demás oficiales durante la batalla.'],

  ['Daruma', '15', 'antagonist', 'ダルマ', 'Hisayoshi Suganuma',
    'Oficial de los Nuevos Piratas Hombre Pez con aspecto de topo. Excava túneles y destruye la fábrica de dulces.'],

  ['Dosun', '15', 'antagonist', 'ドスン', 'Takahiro Yoshimizu',
    'Oficial de los Nuevos Piratas Hombre Pez, enorme y brutal. Se enfrenta a Chopper en la plaza Gyoncorde.'],

  ['Ikaros Much', '15', 'antagonist', 'イカロス・ムッヒ', 'Keiji Hirai',
    'Oficial de los Nuevos Piratas Hombre Pez con aspecto de calamar. Pelea con lanzas y se enfrenta a Franky.'],

  ['Shirley', '15', 'supporting', 'シャーリー', 'Romi Park',
    'Madame Shirley, dueña del café de las sirenas y vidente. Predice que Luffy destruirá la isla de los hombres pez.'],

  ['Den', '15', 'supporting', 'デン', 'Bin Shimada',
    'Hermano de Tom y carpintero de la isla de los hombres pez. Ayuda a Franky a recubrir el Sunny.'],

  ['Lily', '15', 'supporting', 'リリー', 'Yuuko Sumitomo',
    'Gigante que comió la Fruta Mini Mini y puede encogerse. Se cuela en el Sunny y pide ayuda para rescatar a su padre, Panz Fry.'],

  ['Panz Fry', '15', 'supporting', 'パンズフライ', 'Tomomichi Nishimura',
    'Cocinero gigante y padre de Lily. Los Neo Marines lo capturan y la tripulación lo rescata en el arco de Z\'s Ambition.'],

  ['Shuzo', '15', 'antagonist', 'シューゾ', 'Kousei Hirota',
    'Comodoro expulsado de la Marina y comandante de los Neo Marines. Es el antagonista del arco de Z\'s Ambition y quiere recuperar su puesto.'],

  ['Ain', '15', 'antagonist', 'アイン', 'Ryouko Shinohara',
    'Oficial de los Neo Marines y segunda de Zephyr. Comió la Fruta de la Regresión y puede rejuvenecer a quien toca.'],

  // ── TEMPORADA 16: Punk Hazard ───────────────────────────────────

  ['Caesar Clown', '16,17,19', 'antagonist', 'シーザー・クラウン', 'Ryuusei Nakao',
    'Científico loco que experimenta con niños y gases venenosos en Punk Hazard. Comió la Fruta del Gas y trabaja para Doflamingo fabricando SMILE.'],

  ['Monet', '16', 'antagonist', 'モネ', 'Naoko Matsui',
    'Arpía de nieve que vigila el laboratorio de Caesar. Comió la Fruta de la Nieve y se enfrenta a Zoro y a Tashigi.'],

  ['Vergo', '16', 'antagonist', 'ヴェルゴ', 'Junichi Suwabe',
    'Comandante de la base del G-5 y agente doble de Doflamingo. Usa haki y un bambú para enfrentarse a Law y a Smoker.'],

  ['Brownbeard', '16', 'supporting', '茶ひげ', 'Yasuhiko Tokuyama',
    'Capitán pirata con cuerpo de cocodrilo que trabaja para Caesar. Ayuda a los Sombrero de Paja tras descubrir que su tripulación murió por el gas.'],

  ['Kin\'emon', '16,17,18', 'supporting', '錦えもん', 'Kenyuu Horiuchi',
    'Samurái de Wano que corta el fuego con su espada. Busca a su hijo Momonosuke y se une a la tripulación en Punk Hazard.'],

  ['Momonosuke', '16,17,18', 'supporting', '光月モモの助', 'Ai Orikasa',
    'Hijo de Kin\'emon y heredero del clan Kozuki. Comió una fruta artificial que lo convirtió en dragón y viaja con los Sombrero de Paja.'],

  ['Baby 5', '16,17', 'antagonist', 'ベビー5', 'Rina Satou',
    'Oficial de los Piratas Donquixote que se transforma en armas. Necesita sentirse útil y acaba enamorada de Sai.'],

  ['Buffalo', '16,17', 'antagonist', 'バッファロー', 'Yasuhiro Takato',
    'Oficial de los Donquixote con la Fruta de la Rotación, que convierte su cuerpo en hélice. Acompaña a Baby 5 en sus misiones.'],

  ['Mocha', '16', 'supporting', 'モチャ', 'Akemi Kanda',
    'Niña gigante encerrada en Punk Hazard. Se sacrifica para que sus amigos no coman los caramelos droga de Caesar.'],

  ['Breed', '16', 'antagonist', 'ブリード', 'Kazuya Ichijō',
    'Pirata del arco de relleno de la recuperación de Caesar. Su Fruta de la Mascota le permite controlar a los animales con collares.'],

  ['Kung Fu Dugong', '16', 'supporting', 'クンフージュゴン', 'Kazuya Nakai',
    'Dugong que aprendió kung fu de Luffy en Arabasta. Se hace pirata y ayuda a rescatarlo de Breed.'],

  // ── TEMPORADA 17: Dressrosa ─────────────────────────────────────

  ['Rebecca', '17,19', 'supporting', 'レベッカ', 'Megumi Hayashibara',
    'Gladiadora del Coliseo y nieta del rey Riku. Pelea sin herir a nadie para recuperar la Fruta del Fuego y vengar a su madre.'],

  ['Kyros', '17', 'supporting', 'キュロス', 'Rikiya Koyama',
    'Legendario gladiador de Dressrosa convertido en soldado de juguete. Es el padre de Rebecca y protege la rebelión contra Doflamingo.'],

  ['Riku Doldo III', '17,19', 'supporting', 'リク・ドルド3世', 'Masashi Hirose',
    'Antiguo rey de Dressrosa, derrocado por Doflamingo. Su familia y sus ciudadanos sufren el engaño que lo hizo pasar por tirano.'],

  ['Viola', '17', 'supporting', 'ヴァイオレット', 'Mie Sonozaki',
    'Princesa de Dressrosa y bailarina del palacio. Comió la Fruta del Ojo y trabaja para Doflamingo para salvar a su padre.'],

  ['Diamante', '17', 'antagonist', 'ディアマンテ', 'Hideyuki Umezu',
    'Ejecutivo de los Donquixote y campeón del Coliseo. Comió la Fruta de la Onda y asesinó a la madre de Rebecca.'],

  ['Trebol', '17', 'antagonist', 'トレーボル', 'Taiki Matsuno',
    'Ejecutivo de los Donquixote y mano derecha de Doflamingo. Su moco pegajoso esconde un cuerpo diminuto y una lealtad absoluta.'],

  ['Pica', '17', 'antagonist', 'ピーカ', 'Yuuji Mitsuya',
    'Ejecutivo de los Donquixote que se funde con la piedra. Su voz aguda contradice su cuerpo gigantesco.'],

  ['Sugar', '17', 'antagonist', 'シュガー', 'Rie Kugimiya',
    'Niña de la Fruta del Juguete que convierte a las personas en juguetes. Mantiene a Dressrosa olvidando a sus víctimas.'],

  ['Lao G', '17', 'antagonist', 'ラオG', 'Tetsuo Gotō',
    'Anciano oficial de los Donquixote experto en artes marciales. Recupera su juventud durante la batalla contra Sai.'],

  ['Gladius', '17', 'antagonist', 'グラディウス', 'Isshin Chiba',
    'Oficial de los Donquixote que hace explotar todo lo que toca. Se enfrenta a Franky y a Bartolomeo.'],

  ['Señor Pink', '17', 'antagonist', 'セニョール・ピンク', 'Kazuhiro Yamaji',
    'Oficial de los Donquixote vestido de bebé. Su historia con su mujer conmueve incluso a Franky.'],

  ['Machvise', '17', 'antagonist', 'マッハバイス', 'Naomi Kusumi',
    'Oficial de los Donquixote con la Fruta del Peso. Aumenta su peso hasta las diez mil toneladas para aplastar a Hajrudin.'],

  ['Dellinger', '17', 'antagonist', 'デリンジャー', 'Kouki Miyata',
    'Oficial de los Donquixote medio hombre pez. Pelea con patadas y derrota a varios gladiadores.'],

  ['Bartolomeo', '17', 'supporting', 'バルトロメオ', 'Shoutarou Morikubo',
    'Supernova y fan declarado de Luffy. Su Fruta de la Barrera lo hace casi invulnerable y funda la flota de los Sombrero de Paja.'],

  ['Cavendish', '17', 'supporting', 'キャベンディッシュ', 'Akira Ishida',
    'Pirata noble y espadachín bellísimo. Su otra personalidad, Hakuba, lo convierte en un asesino velocísimo.'],

  ['Fujitora', '17,19', 'supporting', 'イッショウ', 'Ikuya Sawaki',
    'Almirante de la Marina ciego que controla la gravedad. Llega a Dressrosa para detener a Luffy y acaba enfrentándose a Doflamingo.'],

  ['Bastille', '17', 'supporting', 'バスティーユ', 'Tsuyoshi Koyama',
    'Vicealmirante de la Marina con una máscara. Se enfrenta a Sabo durante la batalla de Dressrosa.'],

  ['Maynard', '17', 'supporting', 'メイナード', 'Hikaru Hanada',
    'Vicealmirante de la Marina que se infiltra en el Coliseo. Es derrotado por Burgess.'],

  ['Chinjao', '17', 'supporting', 'チンジャオ', 'Shin Aomori',
    'Líder de la Marina Happo y abuelo de Sai. Antiguo rival de Garp, recupera su cabeza de taladro gracias a Luffy.'],

  ['Sai', '17,19', 'supporting', 'サイ', 'Kouichi Hashimoto',
    'Nuevo líder de la Marina Happo y nieto de Chinjao. Se enamora de Baby 5 y la convierte en su esposa.'],

  ['Ideo', '17', 'supporting', 'イデオ', 'Masaki Aizawa',
    'Boxeador del Coliseo y capitán de la flota de los Sombrero de Paja. Pelea con puños explosivos.'],

  ['Hajrudin', '17', 'supporting', 'ハイルディン', 'Tsuyoshi Koyama',
    'Gigante de Elbaf que participa en el Coliseo. Derrota a Machvise y funda los Nuevos Piratas Gigantes.'],

  ['Orlumbus', '17', 'supporting', 'オオロンブス', 'Jirou Saitou',
    'Capitán de una flota de 56 barcos. Se une a Luffy y ayuda a lanzar a Zoro contra Pica.'],

  ['Suleiman', '17', 'supporting', 'スレイマン', 'Ken Narita',
    'Antiguo verdugo que participa en el Coliseo. Se une a la flota de Cavendish.'],

  ['Elizabello II', '17', 'supporting', 'エリザベローII世', 'Katsumi Chō',
    'Rey de Prodence y luchador del Coliseo. Su Puñetazo del Rey puede destruir una fortaleza.'],

  ['Mansherry', '17', 'supporting', 'マンシェリー', 'Ai Nonaka',
    'Princesa de los enanos de Tontatta. Sus lágrimas curan heridas y ayudan a los heridos de Dressrosa.'],

  ['Leo', '17,19', 'supporting', 'レオ', 'Kurumi Mamiya',
    'Líder de los enanos de Tontatta. Comió la Fruta de la Costura y cose a sus enemigos al suelo.'],

  ['Kabu', '17', 'supporting', 'カブ', 'Masami Kikuchi',
    'Guerrero enano de Tontatta que ayuda a rescatar a Mansherry. Se mueve a gran velocidad.'],

  ['Scarlett', '17', 'supporting', 'スカーレット', 'Wakana Yamazaki',
    'Hija mayor del rey Riku y madre de Rebecca. Muere a manos de Diamante durante la toma de Dressrosa.'],

  ['Corazon', '17', 'supporting', 'ドンキホーテ・ロシナンテ', 'Kouichi Yamadera',
    'Hermano pequeño de Doflamingo y oficial de los Donquixote. Salvó a Law y murió por él.'],

  ['Kaido', '17,19', 'antagonist', 'カイドウ', 'Tesshou Genda',
    'Uno de los Cuatro Emperadores y la criatura más fuerte del mundo. Compra las frutas SMILE para crear un ejército.'],

  ['Jack', '17,18', 'antagonist', 'ジャック', 'Kenji Nomura',
    'Comandante de los Piratas de las Bestias. Ataca el convoy que lleva a Doflamingo a Impel Down.'],

  ['Sheepshead', '17,18', 'antagonist', 'シープスヘッド', 'Katsuyuki Konishi',
    'Pirata de las Bestias que ataca a la tripulación en Zou. Puede transformar sus brazos en cuernos de carnero.'],

  ['Ginrummy', '17,18', 'antagonist', 'ジンラミー', 'Sakiko Uran',
    'Pirata de las Bestias que acompaña a Sheepshead. Busca a los samuráis en la isla.'],

  ['Kanjuro', '17,18', 'supporting', 'カン十郎', 'Takumi Yamazaki',
    'Samurái de Wano y compañero de Kin\'emon. Dibuja seres que cobran vida con su fruta.'],

  ['Hack', '17', 'supporting', 'ハック', 'Kousei Hirota',
    'Hombre pez y maestro de karate gyojin del Ejército Revolucionario. Ayuda a Sabo y a Koala en Dressrosa.'],

  // ── TEMPORADA 18: Zou y la mina de plata ────────────────────────

  ['Carrot', '18,19', 'supporting', 'キャロット', 'Kanae Itou',
    'Coneja Mink de Zou que se une al equipo de rescate de Sanji. Puede activar el Sulong con la luna llena y pelea con electricidad.'],

  ['Pedro', '18,19', 'supporting', 'ペドロ', 'Shinichirou Miki',
    'Jaguar Mink y capitán de los guardianes de Zou. Acompaña a Luffy a Totto Land y se sacrifica para salvar a la tripulación.'],

  ['Wanda', '18', 'supporting', 'ワンダ', 'Fumiko Orikasa',
    'Perra Mink que guía a los Sombrero de Paja por Zou. Cuida de los heridos y explica la historia del ducado.'],

  ['Inuarashi', '18', 'supporting', 'イヌアラシ', 'Takaya Hashi',
    'Duque de Mokomo y rey del día de Zou. Uno de los dos gobernantes Mink que defendieron la isla de Jack.'],

  ['Nekomamushi', '18', 'supporting', 'ネコマムシ', 'Masaru Ikeda',
    'Maestro Cat Viper y rey de la noche de Zou. Comparte el gobierno con Inuarashi y ayuda a la alianza contra Kaido.'],

  ['Raizo', '18', 'supporting', '雷ぞう', 'Masashi Ebara',
    'Ninja del clan Kozuki y tercer samurái de Wano. Los Mink lo escondieron de Jack durante semanas.'],

  ['Edward Weevil', '18', 'antagonist', 'エドワード・ウィーブル', 'Kōzō Shioya',
    'Nuevo Señor del Mar que dice ser hijo biológico de Barbablanca. Ataca a los antiguos aliados de su padre buscando su tesoro.'],

  ['Bakkin', '18', 'supporting', 'バッキン', 'Reiko Suzuki',
    'Madre de Edward Weevil y antigua compañera de Barbablanca. Maneja a su hijo para hacerse con la herencia del emperador.'],

  ['Grount', '18', 'antagonist', 'オールハント・グラント', 'Natsuki Hanae',
    'Capitán de la Marina del arco de relleno de Fron. Tiene un brazo zoan de gorila que aprendió a controlar con Aokiji.'],

  ['Bill', '18', 'antagonist', 'ビル', 'Hiroki Takahashi',
    'Líder de la Alianza Pirata de Plata y antagonista del relleno de la mina. Comió la Fruta de la Fundición y crea armas con mineral.'],

  ['Desire', '18', 'supporting', 'デザイア', 'Yuki Kaida',
    'Pirata amiga de la infancia de Bartolomeo. Bill destruyó su tripulación y ella ayuda a Luffy a escapar de la mina.'],

  // ── TEMPORADA 19: Whole Cake Island y el Levely ─────────────────

  ['Vinsmoke Judge', '19', 'antagonist', 'ヴィンスモーク・ジャッジ', 'Hideyuki Hori',
    'Rey del reino de Germa y padre de Sanji. Creó un ejército de clones con Vegapunk y desprecia a su hijo por no tener poderes.'],

  ['Vinsmoke Reiju', '19', 'supporting', 'ヴィンスモーク・レイジュ', 'Michiko Neya',
    'Princesa de Germa y hermana mayor de Sanji. Le salvó la vida de niño y le ayuda a escapar de la boda.'],

  ['Vinsmoke Ichiji', '19', 'antagonist', 'ヴィンスモーク・イチジ', 'Noriaki Sugiyama',
    'Primer hijo de Judge y hermano de Sanji. Tiene fuerza y velocidad sobrehumanas y trata a Sanji como un fracaso.'],

  ['Vinsmoke Niji', '19', 'antagonist', 'ヴィンスモーク・ニジ', 'Atsushi Miyauchi',
    'Segundo hijo de Judge y hermano de Sanji. Es cruel y golpea a los sirvientes; Sanji se enfrenta a él en Germa.'],

  ['Vinsmoke Yonji', '19', 'antagonist', 'ヴィンスモーク・ヨンジ', 'Kenjirou Tsuda',
    'Cuarto hijo de Judge y hermano de Sanji. Se burla de él y lo provoca en su primer reencuentro.'],

  ['Vinsmoke Sora', '19', 'supporting', 'ヴィンスモーク・ソラ', 'Yuriko Yamamoto',
    'Madre de Sanji y esposa de Judge. Tomó un fármaco para que sus hijos conservaran los sentimientos y murió por ello.'],

  ['Charlotte Pudding', '19', 'supporting', 'シャーロット・プリン', 'Miyuki Sawashiro',
    'Hija de Big Mom y prometida de Sanji. Tiene un tercer ojo y al principio conspira para matarlo, pero acaba enamorada de él.'],

  ['Charlotte Katakuri', '19', 'antagonist', 'シャーロット・カタクリ', 'Tomokazu Sugita',
    'General Dulce de Big Mom y el hombre de los mil millones. Ve el futuro con su haki y se enfrenta a Luffy en el mundo de los espejos.'],

  ['Charlotte Perospero', '19', 'antagonist', 'シャーロット・ペロスペロー', 'Yuuya Uchida',
    'Primer hijo de Big Mom y ministro de Totto Land. Su Fruta del Lamiido le permite crear caramelos y atrapar a sus enemigos.'],

  ['Charlotte Oven', '19', 'antagonist', 'シャーロット・オーブン', 'Masafumi Kimura',
    'Hijo de Big Mom con la Fruta del Calor. Persigue a los Sombrero de Paja en Cacao y ataca a Pound.'],

  ['Charlotte Daifuku', '19', 'antagonist', 'シャーロット・ダイフク', 'Shunsuke Sakuya',
    'Hijo de Big Mom con la Fruta del Genio. Su genio lucha con una lanza y se enfrenta a Sanji.'],

  ['Charlotte Smoothie', '19', 'antagonist', 'シャーロット・スムージー', 'Masako Katsuki',
    'General Dulce de Big Mom y ministra de jugos. Puede exprimir a sus enemigos con su fruta.'],

  ['Charlotte Cracker', '19', 'antagonist', 'シャーロット・クラッカー', 'Takuya Kirimoto',
    'General Dulce de Big Mom y usuario de la Fruta de la Galleta. Crea soldados de galleta y se enfrenta a Luffy.'],

  ['Charlotte Brûlée', '19', 'antagonist', 'シャーロット・ブリュレ', 'Yuuko Iguchi',
    'Hija de Big Mom con la Fruta del Espejo. Atrapa a Carrot y a Chopper y ayuda a Luffy a moverse por Totto Land.'],

  ['Charlotte Chiffon', '19', 'supporting', 'シャーロット・シフォン', 'Aya Hisakawa',
    'Hija de Big Mom y hermana gemela de Lola. Se rebela contra su madre y ayuda a Sanji a llevar el pastel.'],

  ['Charlotte Amande', '19', 'antagonist', 'シャーロット・アマンド', 'Wasabi Mizuta',
    'Hija de Big Mom y ministra de frutas. Pelea con una espada y ejecuta a King Baum.'],

  ['Charlotte Galette', '19', 'antagonist', 'シャーロット・ガレット', 'Ai Maeda',
    'Hija de Big Mom y ministra de mantequilla. Usa su fruta para inmovilizar a Nami.'],

  ['Charlotte Mont-d\'Or', '19', 'antagonist', 'シャーロット・モンドール', 'Atsushi Imaruoka',
    'Hijo de Big Mom con la Fruta del Libro. Encierra a Luffy y Nami en un libro y controla a los prisioneros.'],

  ['Charlotte Opera', '19', 'antagonist', 'シャーロット・オペラ', 'Yoshihisa Kawahara',
    'Hijo de Big Mom y ministro de azúcar. Tortura a Nami para que revele el paradero de Lola.'],

  ['Charlotte Flampe', '19', 'antagonist', 'シャーロット・フランペ', 'Chiwa Saitou',
    'Hija de Big Mom y hermana pequeña de Katakuri. Interfiere en su pelea con Luffy y lo hiere.'],

  ['Pound', '19', 'supporting', 'パウンド', 'Masami Kikuchi',
    'Padre de Chiffon y Lola y antiguo marido de Big Mom. Protege a sus hijas y muere a manos de Oven.'],

  ['Streusen', '19', 'supporting', 'シュトロイゼン', 'Haruhiko Jo',
    'Cocinero y fundador de Totto Land junto a Big Mom. Convierte el castillo en pastel para salvar a la tripulación.'],

  ['Carmel', '19', 'supporting', 'カルメル', 'Fumi Hirano',
    'Monja que acogió a Big Mom en Elbaf y dirigía el orfanato Casa de las Ovejas. Era traficante de niños.'],

  ['Aladine', '19', 'supporting', 'アラディン', 'Takashi Nagasako',
    'Hombre pez y médico de los Piratas del Sol. Ayuda a Jinbe y a la tripulación a escapar de Totto Land.'],

  ['Mjosgard', '19', 'supporting', 'ミョスガルド聖', 'Tetsuo Gotou',
    'Dragón Celestial que cambió gracias a Otohime. Defiende a Shirahoshi de Charlos en el Levely.'],

  ['Ryokugyu', '19', 'supporting', 'アラマキ', 'Keiji Fujiwara',
    'Almirante de la Marina con poderes de planta. Habla con Fujitora sobre el invento de Vegapunk.'],

  ['Gion', '19', 'supporting', 'ギオン', 'Yuka Komatsu',
    'Vicealmirante de la Marina y vieja conocida de Garp. Comenta con él las acciones de Luffy.'],

  ['Stelly', '19', 'supporting', 'ステリー', 'Chika Sakamoto',
    'Hermano adoptivo de Sabo y rey del reino de Goa. Es vanidoso y cobarde, y sueña con sentarse en el Trono Vacío.'],
];
