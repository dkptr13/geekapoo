// PERSONAJES - Akame ga Kill!
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// `temporada`:
//
//   ''      = sale en las dos temporadas (la de television y la de ONA).
//   1       = solo en la de television.
//
// OJO con la trampa de la temporada 2: son 24 cortos de un minuto y no
// todos los personajes salen en ellos. De los 35 de esta lista, solo se
// marca '' (las dos) a los que se puede ver en algun corto. Casi todos
// los enemigos del Imperio son '1', porque ningun corto es suyo salvo
// los seis que llevan su nombre en el titulo.
//
// `voz` es el seiyuu japones. El campo del proyecto es `voiceActor` y no
// lleva pais, asi que se deja el nombre japones tal cual.
//
// ── DE DONDE VIENEN ───────────────────────────────────────
//
// Nombre japones y seiyuu: la ficha de personajes de Wikipedia en
// ingles (que cita la web oficial de la serie) y la de la wikipedia en
// espanol. Cuando las dos no coinciden, manda la inglesa, que es la que
// esta completa: la seiyuu de Kurome sale en las dos como "Ayaka
// Ohashi" y como "Ayaka Oyashi", y la correcta es la primera.
//
// Los nombres van en el orden japones (apellido primero), que es como
// los escribe la fuente: タツミ es "Tatsumi". Aqui se pone el orden que
// usa la ficha en ingles.
//
// ── EL REPARTO ────────────────────────────────────────────
//
// Treinta y cinco. Los que tienen peso en el anime. Se quedan fuera
// varios que estan en el manga y casi no se ven en el anime (los
// miembros de la Wild Hunt con nombre propio, la escuadra Zero), porque
// meterlos haria que la wiki los enseara en capitulos donde no salen.
//
// Los Jaeger y los rakshasa van como antagonistas aunque a veces luchen
// al lado de Night Raid: son del bando del Imperio y se nota. Lo mismo
// con Wave y Run, que se acaban pasando.

const TODAS = '';

export const PERSONAJES = [
  ['Tatsumi', TODAS, 'main', 'タツミ', 'Sōma Saitō',
   'El unico chico del grupo y el unico que entro sin saber en que se metia. Va a la capital a hacer dinero rapido y se encuentra con que la mitad de sus planes eran una trampa. Porte bien las armas y peor los entumecimientos de muerte ajenos.'],
  ['Akame', TODAS, 'main', 'アカメ', 'Sora Amamiya',
   'La protagonista. La tercera prueba del Imperio que llega a Night Raid cuando ya es tarde.'],
  ['Mine', TODAS, 'main', 'マイン', 'Yukari Tamura',
   'La francotiradora. Medio extranjera en un mundo que la desprecia por eso, y de las nueve de Night Raid la mas fria.'],
  ['Leone', TODAS, 'main', 'レオーネ', 'Yū Asakawa',
   'La que roba a Tatsumi en el primer capitulo y la que lo convence de quedarse. Tranquila, habladora y con una fuerza que no parece de su tamaño.'],
  ['Najenda', TODAS, 'supporting', 'ナジェンダ', 'Risa Mizuno',
   'La jefa. General del Imperio hasta que vio lo que hacia Esdeath y se fue con un brazo y un ojo menos. Ahora dirige desde un escondite y calcula más de lo que habla.'],
  ['Bulat', '1', 'supporting', 'ブラート', 'Katsuyuki Konishi',
   'El que cocina y el que mide la situacion. Se fue del Imperio cuando entendio que alli no servia el merito, y muere envenenado despues de ganar su pelea y de regalar su armadura a Tatsumi.'],
  ['Sheele', '1', 'supporting', 'シェーレ', 'Mamiko Noto',
   'Torpe para todo lo que no sea matar, que es justo lo que hace mejor. Muere en el capitulo sexto para que Mine pueda huir, y sigue apareciendole despues a lo loco.'],
  ['Lubbock', TODAS, 'supporting', 'ラバック', 'Yoshitsugu Matsuoka',
   'El del pelo verde que va de bromista, con una tienda de libros de tapadera y un amor platonico a Najenda. Se pasa la serie usando sus hilos para cosas para las que no fueron hechos.'],
  ['Chelsea', TODAS, 'supporting', 'チェルシー', 'Kaori Nazuka',
   'Llega tarde y con muy mal caracter, y va por la ciudad cambiando de cara con una caja de cosméticos. Matona de las ocho, y el chiste es que lo suyo no es pelear sino clavar una aguja donde toque.'],
  ['Susanoo', TODAS, 'supporting', 'スサノオ', 'Shintarō Asanuma',
   'Un Teigu con forma de persona: alto, con dos cuernos, serio y con modales. Pela, cocina, arregla y calla, en ese orden de importancia para el grupo.'],
  ['General Esdeath', TODAS, 'antagonist', 'エスデス', 'Satomi Akesaka',
   'La mejor general del Imperio y la unica que acerca de verdad. Se crio con la idea de que el mundo es de los fuertes y convertio el norte en un congelador para demostrarlo. Se quiere casar con Tatsumi y no acepta un no.'],
  ['Prime Minister Honest', '1', 'antagonist', 'オネスト', 'Kōji Ishii',
   'El primer ministro y el verdadero jefe del Imperio, porque el Emperador es un nino y el lo maneja como a un juguete. Enfraquece el pais para que nadie se atreva, asesina a su propio antecesor y se pasa la serie comiendo.'],
  ['Emperor Makoto', '1', 'antagonist', '誠', 'Yō Taichi',
   'El nino del trono. No sabe que su padre y su madre los mato el primer ministro, y su ultima razon de ser es un Teigu del tamaño de un rascacielos.'],
  ['Seryu Ubiquitous', TODAS, 'antagonist', '星流・ユビキタス', 'Kana Hanazawa',
   'La policia que cree fanaticamente en la justicia del Imperio y se la aplica a todos los que ve por delante. Lleva un perro con el que se come a la gente y una bomba en la cabeza que no puede quitarse.'],
  ['Dr. Stylish', TODAS, 'antagonist', 'Dr.スタイリッシュ', 'Ken Narita',
   'El que le pone apendices a la gente: brazos, ojos, pistolas. Se come a sus propios subordinados cuando quiere subir de nivel y acaba transformsandose en la bestia más grande de la serie.'],
  ['Wave', TODAS, 'antagonist', 'ウェイブ', 'Yoshimasa Hosoya',
   'El Jaeger que mas se parece a Tatsumi y el primero que se pasa al otro bando. Va a por las mismas bestias que ellos y acaba ayudandoles cuando le piden ayuda.'],
  ['Kurome', TODAS, 'antagonist', 'クロメ', 'Ayaka Ohashi',
   'La hermana menor de Akame, la que se quedo con las otras Guijas y con las drogas experimentales. Maneja muertos y lleva una moneda de dulce en la boca desde los siete años.'],
  ['Run', TODAS, 'supporting', 'ラン', 'Junji Majima',
   'El mayordomo de Esdeath, que antes era un maestro de pueblo y que entro en el Imperio para arreglarlo desde dentro. El unico Jaeger de los que nadie odia, y el que se lleva la corona al final.'],
  ['Bols', TODAS, 'supporting', 'ボルス', 'Eiji Takemoto',
   'Va con mascara de gas y straps de cuero y parece lo peor de la serie, y es el único de los Jaeger que tiene familia y cocina.'],
  ['Captain Ogre', '1', 'antagonist', 'オーガ', 'Tsuyoshi Koyama',
   'Capitan de la policia, segun todos el mejor espadachin de su turno. Se le mata en el segundo capitulo y con su muerte empieza lo de Seryu.'],
  ['Zank', '1', 'antagonist', '首斬りザンク', 'Satoshi Tsuruoka',
   'Fue verdugo del Imperio y luego empezo a decapitar por gusto, hasta que las voces de los que habia matado le salieron por dentro. Akame lo libera de eso y el le da las gracias.'],
  ['Daidara', '1', 'antagonist', 'ダイダラ', 'Anri Katsu',
   'Una de las Tres Bestias de Esdeath. Musculoso, bruto y con la mania de comentar su propia pelea como si fuera un juego.'],
  ['Nyau', '1', 'antagonist', 'にゃう', 'Hitomi Nabatame',
   'La segunda de las Tres Bestias. Cara de niño buena y sadismo de manual: les arranca la cara a sus victimas y las guarda en una coleccion.'],
  ['Liver', '1', 'antagonist', 'リヴァ', 'Jouji Nakata',
   'El jefe de las Tres Bestias y el que las une en una sola pelea. Pelea con un anillo que maneja el agua y, cuando ve que va a perder, se envenena para que su muerte sirva de algo.'],
  ['Bolic', '1', 'antagonist', 'ボリック', 'Masami Iwasaki',
   'El segundo de la secta pacifista y, en realidad, un chulo de la secta y del Imperio. Droga a los suyos con la excusa de que les cura y los usa como se usan a lasBestias.'],
  ['Great General Budo', '1', 'antagonist', 'ブドー大将軍', 'Hozumi Gôda',
   'El general mas famoso del Imperio y el unico que le discute la cara a Esdeath. Sus guanteletes echaban chispas y se los cargo Mine cuando fue a rescatarle a Tatsumi.'],
  ['Syura', '1', 'antagonist', 'シュラ', 'Ryohei Kimura',
   'El hijo del primer ministro. Teletransporta gente con un colgante y tiene una unidad entera de Elite que todavia no lo sabe. Lubbock lo mata y cae con el.'],
  ['Gozuki', '1', 'antagonist', 'ゴズキ', 'Rintarō Nishi',
   'El hombre que se llevo a Akame y a Kurome de casa. Las formo desde pequenas y a la que quedaba fuera la dejo fuera a proposito. En la serie solo sale el nombre.'],
  ['Holimaca', '1', 'antagonist', 'ホリマカ', 'Kouhei Sugesawa',
   'El guardaespaldas de Bolic, que lleva un arma de las raras sin saber lo que puede hacer. Akame lo mata tan rapido que no llega a enterarse de que era eso.'],
  ['Aria', '1', 'antagonist', 'アリア', 'Kanami Satō',
   'La heredera de la casa donde se separan los tres chicos del campo. Lo que hacia en casa de sus invitados no tiene nombre, pero Sayo por las evidencias.'],
  ['Sayo', '1', 'antagonist', 'サヨ', 'Mikako Komatsu',
   'Amiga de la infancia de Tatsumi. La que murio en el capitulo uno y es la razon de que se meta en Night Raid.'],
  ['Ieyasu', '1', 'supporting', 'イエヤス', 'Koji Takahashi',
   'El otro amigo del campo. Ve como torturan a Sayo, se infecta y muere en brazos de Tatsumi unas horas despues. Le pide que se vaya como un heroe.'],
  ['Ibara', TODAS, 'antagonist', 'イバラ', 'Satoshi Hino',
   'Uno de los cuatro rakshasa del templo de puños. Saca la lengua al reirse y le roba la espada a Akame, que es justo lo que ella queria.'],
  ['Sten', TODAS, 'antagonist', 'ステン', 'Kenji Nomura',
   'Segundo rakshasa. Cree que matar a alguien le libera el alma y se lo explica a Lubbock antes de morir por el.'],
  ['Mez', TODAS, 'antagonist', 'メース', 'Aina Suzuki',
   'Tercera rakshasa. Pelea sudando, porque el sudor moja los hilos de Lubbock y no hay manera de cortarla con ellos.'],
  ['Suzuka', TODAS, 'antagonist', '鈴鹿', 'Eriko Matsui',
   'La cuarta rakshasa. Aguanta mas de lo que parece y sale del combate debajo de los escombros de un edificio.'],
];