// PERSONAJES - Haikyuu!!
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// La columna de temporada dice en cuales sale el personaje:
//
//   '1,2'   en la primera y la segunda
//   '2,3,4' en las tres ultimas
//
// Nombres, kanji y voces vienen de AniList (20464, 20992, 21698,
// 106625 y 113538). Los resumenes son propios, en castellano.
//
// Solo van los protagonistas y los secundarios con peso de las cuatro
// temporadas. En Haikyuu no hay villanos: los rivales de otros
// institutos son adversarios deportivos, no antagonistas, asi que todos
// llevan rol 'supporting'.

export const PERSONAJES = [
  ['Shouyou Hinata', '1,2,3,4', 'main', '日向翔陽', 'Ayumu Murase',
   'El protagonista. Bajo para el voleibol, pero salta como nadie y contagia unas ganas que arrastran a todo Karasuno. Sueña con llegar a lo más alto.'],

  ['Tobio Kageyama', '1,2,3,4', 'main', '影山飛雄', 'Kaito Ishikawa',
   'El colocador prodigio de Karasuno. Técnicamente perfecto, pero su carácter rígido le cuesta amigos; aprende a confiar en Hinata y en el resto.'],

  ['Daichi Sawamura', '1,2,3,4', 'supporting', '澤村大地', 'Satoshi Hino',
   'El capitán de Karasuno. Defensa sólida, voz firme y paciencia para mantener unido a un equipo lleno de caracteres difíciles.'],

  ['Koushi Sugawara', '1,2,3,4', 'supporting', '菅原孝支', 'Miyu Irino',
   'El otro colocador y vicecapitán. Acepta perder la titularidad ante Kageyama y sigue empujando desde el banquillo; cuando entra, aporta calma y experiencia.'],

  ['Asahi Azumane', '1,2,3,4', 'supporting', '東峰旭', 'Yoshimasa Hosoya',
   'El as de Karasuno. Potencia y altura, pero también dudas; su vuelta al equipo es una de las claves de la temporada.'],

  ['Ryuunosuke Tanaka', '1,2,3,4', 'supporting', '田中龍之介', 'Yuu Hayashi',
   'El lateral más ruidoso de Karasuno. Impulsivo, leal y valiente; anima a todos y no se achanta ante ningún rival.'],

  ['Yuu Nishinoya', '1,2,3,4', 'supporting', '西谷夕', 'Nobuhiko Okamoto',
   'El líbero de Karasuno. Pequeño y explosivo, se lanza a por cualquier balón; su presencia cambia por completo la defensa.'],

  ['Kei Tsukishima', '1,2,3,4', 'supporting', '月島蛍', 'Kouki Uchiyama',
   'Central alto e inteligente. Frío y sarcástico, esconde su inseguridad detrás de la lógica hasta que aprende a disfrutar del juego.'],

  ['Tadashi Yamaguchi', '1,2,3,4', 'supporting', '山口忠', 'Souma Saitou',
   'Central reserva de Karasuno. Empieza inseguro, pero se hace fuerte con el saque en salto y se convierte en el sacador de emergencia.'],

  ['Chikara Ennoshita', '1,2,3,4', 'supporting', '縁下力', 'Toshiki Masuda',
   'Reserva de Karasuno. Callado y responsable; cuando Daichi se lesiona, asume el papel de capitán con más miedo que confianza.'],

  ['Kazuhito Narita', '1,2,3,4', 'supporting', '成田一仁', 'Koutarou Nishiyama',
   'Central reserva. Serio y constante, cumple siempre que le toca entrar.'],

  ['Hisashi Kinoshita', '1,2,3,4', 'supporting', '木下久志', 'Nobuyori Sagara',
   'Lateral reserva. Su saque flotante y su energía lo hacen útil desde el banquillo.'],

  ['Kiyoko Shimizu', '1,2,3,4', 'supporting', '清水潔子', 'Kaori Nazuka',
   'La mánager de Karasuno. Serena y observadora; lleva las estadísticas y mantiene al equipo centrado.'],

  ['Hitoka Yachi', '2,3,4', 'supporting', '谷地仁花', 'Sumire Morohoshi',
   'Mánager que se incorpora en la segunda temporada. Nerviosa al principio, acaba siendo tan importante para el equipo como cualquier jugador.'],

  ['Keishin Ukai', '1,2,3,4', 'supporting', '烏養繋心', 'Kazunari Tanaka',
   'El entrenador de Karasuno. Joven, exigente y con métodos poco ortodoxos; devuelve al equipo la ambición de ganar.'],

  ['Ittetsu Takeda', '1,2,3,4', 'supporting', '武田一鉄', 'Hiroshi Kamiya',
   'El profesor asesor del club. Sin experiencia deportiva, consigue apoyos y amistosos, y ayuda a que Karasuno llegue más lejos de lo que nadie esperaba.'],

  ['Ikkei Ukai', '1,2,3,4', 'supporting', '烏養一繋', 'Hiroshi Naka',
   'El antiguo entrenador de Karasuno y abuelo de Keishin. Su experiencia y su carácter duro sirven de contrapeso al equipo.'],

  ['Saeko Tanaka', '1,2,3,4', 'supporting', '田中冴子', 'Yuka Komatsu',
   'Hermana mayor de Tanaka. Alborotadora y protectora, aparece en los partidos para animar a Karasuno.'],

  ['Makoto Shimada', '1,2,3,4', 'supporting', '嶋田誠', 'Tomoaki Maeno',
   'Antiguo jugador de Karasuno. Entrena a Hinata y Kageyama en el saque y les da consejos desde fuera.'],

  ['Yuusuke Takinoue', '1,2,3,4', 'supporting', '滝ノ上祐輔', 'Shuuhei Sakaguchi',
   'Antiguo compañero de Shimada. Sigue al equipo y aporta su experiencia con buen humor.'],

  ['Akiteru Tsukishima', '2,3,4', 'supporting', '月島明光', 'Takahiro Sakurai',
   'Hermano mayor de Tsukishima. Fue jugador de Karasuno y su sombra pesa sobre Kei; también es quien le ayuda a reconciliarse con el voleibol.'],

  ['Tetsurou Kuroo', '2,3,4', 'supporting', '黒尾鉄朗', 'Yuuichi Nakamura',
   'Capitán de Nekoma. Central astuto y provocador; su lectura del juego y su amistad con Daichi hacen especial el duelo contra Karasuno.'],

  ['Kenma Kozume', '2,3,4', 'supporting', '孤爪研磨', 'Yuuki Kaji',
   'Colocador de Nekoma. Introvertido y adicto a los videojuegos; piensa el partido como un tablero y desarma a los rivales con calma.'],

  ['Morisuke Yaku', '2,3,4', 'supporting', '夜久衛輔', 'Shinnosuke Tachibana',
   'El líbero de Nekoma. Pequeño, gritón y muy técnico; sostiene la defensa del equipo.'],

  ['Lev Haiba', '2,3,4', 'supporting', '灰羽リエーフ', 'Mark Ishii',
   'Central de Nekoma, alto y novato. Torpe pero entusiasta; su altura impone y su falta de experiencia se nota.'],

  ['Taketora Yamamoto', '2,3,4', 'supporting', '山本猛虎', 'Seigo Yokota',
   'El as de Nekoma. Impulsivo y ruidoso, choca con Lev pero se esfuerza por ser el referente ofensivo.'],

  ['Sou Inuoka', '2,3,4', 'supporting', '犬岡走', 'Kyousuke Ikeda',
   'Lateral de Nekoma. Rápido y alegre; su elasticidad le permite llegar a balones imposibles.'],

  ['Nobuyuki Kai', '2,3,4', 'supporting', '海信行', 'Takanori Hoshino',
   'Vicecapitán de Nekoma. Serio y fiable, equilibra el carácter de Kuroo y sostiene al equipo.'],

  ['Shouhei Fukunaga', '2,3,4', 'supporting', '福永招平', 'Shouta Chounan',
   'Lateral de Nekoma. Callado y con cara de sueño, pero letal cuando encuentra el hueco.'],

  ['Yuuki Shibayama', '2,3,4', 'supporting', '芝山優生', 'Takumi Watanabe',
   'Reserva de Nekoma. Pequeño y trabajador; aprende de Yaku para ser el siguiente líbero.'],

  ['Yasufumi Nekomata', '2,3,4', 'supporting', '猫又育史', 'Nobuaki Fukuda',
   'El entrenador de Nekoma. Veterano y tranquilo, construye un equipo pensado para ganar a Karasuno.'],

  ['Tooru Oikawa', '1,2,3,4', 'supporting', '及川徹', 'Daisuke Namikawa',
   'Capitán y colocador del Aoba Johsai. El mejor del instituto: saca, coloca y lee el juego como nadie. Su rivalidad con Kageyama es personal.'],

  ['Hajime Iwaizumi', '1,2,3,4', 'supporting', '岩泉一', 'Hiroyuki Yoshino',
   'El as del Aoba Johsai y mano derecha de Oikawa. Directo y exigente; le baja los humos cuando hace falta.'],

  ['Issei Matsukawa', '1,2,3,4', 'supporting', '松川一静', 'Isamu Yuusen',
   'Central del Aoba Johsai. Frialdad y bloqueo; forma con Hanamaki una pareja difícil de leer.'],

  ['Takahiro Hanamaki', '1,2,3,4', 'supporting', '花巻貴大', 'Tooru Sakurai',
   'Lateral del Aoba Johsai. Sereno y con recursos, complementa a Matsukawa en ataque y bloqueo.'],

  ['Yuutarou Kindaichi', '1,2,3,4', 'supporting', '金田一勇太郎', 'Makoto Furukawa',
   'Central del Aoba Johsai. Antiguo compañero de Kageyama; su bloqueo crece a base de trabajo.'],

  ['Akira Kunimi', '1,2,3,4', 'supporting', '国見英', 'Atsushi Tamaru',
   'Lateral del Aoba Johsai. Apático en apariencia, pero listo y eficaz cuando el partido lo exige.'],

  ['Shigeru Yahaba', '1,2,3,4', 'supporting', '矢巾秀', 'Kengo Kawanishi',
   'Colocador suplente del Aoba Johsai. Orgulloso y competitivo; quiere demostrar que puede llevar al equipo.'],

  ['Shinji Watari', '1,2,3,4', 'supporting', '渡親治', 'Arthur Lounsbery',
   'El líbero del Aoba Johsai. Discreto y seguro, sostiene la recepción para que Oikawa pueda atacar.'],

  ['Kentarou Kyoutani', '2,3', 'supporting', '京谷賢太郎', 'Shunsuke Takeuchi',
   'El as salvaje del Aoba Johsai. Potencia bruta y poca paciencia; su entrada cambia el ritmo del partido, para bien o para mal.'],

  ['Nobuteru Irihata', '1,2,3,4', 'supporting', '入畑伸照', 'Mitsuaki Hoshino',
   'El entrenador del Aoba Johsai. Serio y exigente, deja que Oikawa lleve el peso del equipo.'],

  ['Sadayuki Mizoguchi', '1,2,3,4', 'supporting', '溝口貞幸', 'Seirou Ogino',
   'El ayudante del Aoba Johsai. Analiza a los rivales y apoya a Irihata desde la banda.'],

  ['Kouji Sekimukai', '3', 'supporting', '関向幸治', 'Seigo Yokota',
   'Reserva del Aoba Johsai. Apenas juega, pero forma parte del banquillo que empuja al equipo desde fuera.'],

  ['Yukitaka Izumi', '3', 'supporting', '泉行高', 'Kyousuke Ikeda',
   'Reserva del Aoba Johsai. Trabaja en silencio y espera su oportunidad para ayudar al equipo.'],

  ['Takanobu Aone', '1,2,4', 'supporting', '青根高伸', 'Hiroki Matsukawa',
   'El central de Date Tech. Su bloqueo es un muro; habla poco y mete miedo con solo estar en la red.'],

  ['Kenji Futakuchi', '1,2,4', 'supporting', '二口堅治', 'Masatomo Nakazawa',
   'Capitán de Date Tech. Provocador y sonriente, dirige el bloqueo más temido de la prefectura.'],

  ['Kanji Koganegawa', '2,4', 'supporting', '黄金川貫至', 'Masayuki Shouji',
   'Colocador de Date Tech. Altísimo y novato; aprende a marchas forzadas y su entusiasmo contagia.'],

  ['Yasushi Kamasaki', '1,2,4', 'supporting', '鎌先靖志', 'Takuya Satou',
   'Central veterano de Date Tech. Fuerte y directo, forma parte del muro que frenó a Karasuno.'],

  ['Takeharu Futamata', '2', 'supporting', '二岐丈春', 'Junta Terashima',
   'Lateral de Date Tech. Rápido y con buen saque; uno de los apoyos del equipo.'],

  ['Wakatoshi Ushijima', '2,3,4', 'supporting', '牛島若利', 'Ryouta Takeuchi',
   'El as de Shiratorizawa. Zurdo, potente y casi imparable; su remate es la referencia de toda la prefectura.'],

  ['Satori Tendou', '3,4', 'supporting', '天童覚', 'Subaru Kimura',
   'Central de Shiratorizawa. Imprevisible y provocador; su bloqueo adivina las trayectorias y desespera a los rivales.'],

  ['Kenjirou Shirabu', '3,4', 'supporting', '白布賢二郎', 'Toshiyuki Toyonaga',
   'Colocador de Shiratorizawa. Metódico y frío; su precisión es la base del ataque de Ushijima.'],

  ['Eita Semi', '3,4', 'supporting', '瀬見英太', 'Takuma Terashima',
   'Colocador suplente de Shiratorizawa. Con carácter y buen saque, entra para cambiar el ritmo.'],

  ['Tsutomu Goshiki', '3,4', 'supporting', '五色工', 'Shinba Tsuchiya',
   'Lateral de Shiratorizawa. Joven y ambicioso; quiere ser el próximo as del equipo.'],

  ['Taichi Kawanishi', '3', 'supporting', '川西太一', 'Daiki Oomori',
   'Central de Shiratorizawa. Callado y seguro; su bloqueo acompaña a Tendou.'],

  ['Reon Ouhira', '3,4', 'supporting', '大平獅音', 'Teruyuki Tanzawa',
   'Lateral de Shiratorizawa. Fuerte y constante, aporta equilibrio al ataque.'],

  ['Hayato Yamagata', '3,4', 'supporting', '山形隼人', 'Kenji Fukuda',
   'Líbero de Shiratorizawa. Rápido y agresivo; su recepción sostiene el juego del equipo.'],

  ['Tanji Washijou', '3,4', 'supporting', '鷲匠鍛治', 'Ryuusei Nakao',
   'El entrenador de Shiratorizawa. Duro y de la vieja escuela; exige a sus jugadores una resistencia sin excusas.'],

  ['Koutarou Bokuto', '2,3,4', 'supporting', '木兎光太郎', 'Ryouhei Kimura',
   'El as de Fukurodani. Poderoso y excéntrico; cuando entra en racha es imparable, y cuando se viene abajo necesita a Akaashi.'],

  ['Keiji Akaashi', '2,3,4', 'supporting', '赤葦京治', 'Ryouta Oosaka',
   'Colocador de Fukurodani. Sereno y preciso; sabe exactamente cómo sacar lo mejor de Bokuto.'],

  ['Yamato Sarukui', '2,3,4', 'supporting', '猿杙大和', 'Juunji Tachibana',
   'Lateral de Fukurodani. Fiable y tranquilo, sostiene al equipo cuando Bokuto falla.'],

  ['Akinori Konoha', '2,3,4', 'supporting', '木葉秋紀', 'Taishi Murata',
   'Lateral de Fukurodani. Versátil y listo; puede jugar en varias posiciones.'],

  ['Tatsuki Washio', '2,3,4', 'supporting', '鷲尾辰生', 'Akira Koga',
   'Central de Fukurodani. Bloqueo sólido y carácter serio.'],

  ['Haruki Komi', '2,3,4', 'supporting', '小見春樹', 'Yukitoshi Kikuchi',
   'Líbero de Fukurodani. Rápido y hablador; pone energía en la defensa.'],

  ['Yuuji Terushima', '2', 'supporting', '照島遊児', 'Takuya Eguchi',
   'Capitán de Johzenji. Descarado y creativo; juega por instinto y contagia un estilo caótico.'],

  ['Hana Misaki', '2', 'supporting', '三咲華', 'Ayumi Fujimura',
   'Mánager de Johzenji. La voz que pone orden en un equipo impulsivo; su charla cambia al grupo.'],

  ['Atsumu Miya', '4', 'supporting', '宮侑', 'Mamoru Miyano',
   'Colocador de Inarizaki. El mejor de su generación; su saque y su precisión son una amenaza constante.'],

  ['Osamu Miya', '4', 'supporting', '宮治', 'Hideaki Kabumoto',
   'Lateral de Inarizaki y gemelo de Atsumu. Tan bueno como su hermano, pero con un carácter más tranquilo.'],

  ['Rintarou Suna', '4', 'supporting', '角名倫太郎', 'Nobunaga Shimazaki',
   'Central de Inarizaki. Frío y sarcástico; bloquea y ataca con una calma que desespera.'],

  ['Shinsuke Kita', '4', 'supporting', '北信介', 'Kenji Nojima',
   'Capitán de Inarizaki. Disciplinado y silencioso; su entrada ordena al equipo y su ejemplo arrastra.'],

  ['Aran Ojiro', '4', 'supporting', '尾白アラン', 'Jun Kasama',
   'El as de Inarizaki. Potencia y experiencia; el remate que sostiene al equipo en los momentos duros.'],

  ['Yuudai Hyakuzawa', '2,4', 'supporting', '百沢雄大', 'Shouta Yamamoto',
   'Central de Kakugawa. Mide más de dos metros y su altura impone; todavía está aprendiendo a jugar.'],

  ['Takeru Nakashima', '2', 'supporting', '中島猛', 'Atsushi Abe',
   'Capitán de Wakutani. Pequeño y tenaz; su juego de defensa y contraataque pone en apuros a Karasuno.'],

  ['Suguru Daishou', '4', 'supporting', '大将優', 'Kazuyuki Okitsu',
   'Capitán de Nohebi. Astuto y provocador; su equipo juega con la paciencia del rival.'],

  ['Kanoka Amanai', '4', 'supporting', '天内叶歌', 'Saori Oonishi',
   'Mánager de Nekoma. Tranquila y observadora; conoce bien al equipo y comparte la rivalidad con Karasuno.'],

  ['Kourai Hoshiumi', '4', 'supporting', '星海光来', 'Natsuki Hanae',
   'Lateral de Kamomedai. Pequeño pero explosivo; su salto y su ambición lo convierten en un rival temible.'],

  ['Kiyoomi Sakusa', '4', 'supporting', '佐久早聖臣', 'Kousuke Toriumi',
   'Lateral de Itachiyama. El mejor receptor de su generación; su precisión y su carácter exigente lo hacen temible.'],

  ['Motoya Komori', '4', 'supporting', '古森元也', 'Yuuto Uemura',
   'Líbero de Itachiyama. Defensa de élite y compañero de Sakusa.'],

  ['Sachirou Hirugami', '4', 'supporting', '昼神幸郎', 'Yuu Miyazaki',
   'Central de Kamomedai. Bloqueador inteligente y tranquilo; su lectura del juego es su mejor arma.'],

  ['Fuki Hibarida', '4', 'supporting', '雲雀田吹', 'Hiroshi Yanaka',
   'Entrenador del equipo nacional juvenil. Metódico y exigente; dirige el campamento donde coinciden los mejores jugadores.'],

  ['Yui Michimiya', '1,2', 'supporting', '道宮結', 'Asami Seto',
   'Capitana del equipo femenino de Karasuno. Amiga de Daichi; anima al equipo y aporta otra perspectiva.'],
];
