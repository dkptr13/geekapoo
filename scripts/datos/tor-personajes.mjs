// PERSONAJES - Toradora!
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Veinticinco, que es lo que lista AniList para la serie y la OVA juntas.
// Del manga hay mas (Yuu Aisaka, Nanako, los personajes de la ONA y del
// juego), pero aqui solo va lo que sale en pantalla en el anime.
//
// ── LOS SEIYUU ───────────────────────────────────────────────────
//
// De la seccion de reparto de la wikipedia en japones, que lista los
// veintiuno. Los cuatro que faltan son Inko-chan (el loro), Stalker Otoko,
// Ryuuji-kun, que es el apodo del protagonista, y Yuu Aisaka, el hermano
// de Taiga, que sale en pantalla en la OVA.
//
// ── LAS TEMPORADAS ────────────────────────────────────────────────
//
// De la lista de personajes de cada uno de los dos titulos de AniList.
// Casi todos salen en los dos; la diferencia son los que ya no aparecen
// en la graduacion, que son la familia de Taiga y el presidente del
// consejo.
//
// Ojo con la trampa de las temporadas: casi todo el reparto va con ''
// (todas), que es lo correcto aqui porque son dos titulos y no hay
// season_

export const PERSONAJES = [
  ['Ryuuji Takasu', '', 'main', '高須竜児', 'Junji Majima',
    'El presidente del consejo estudiantil de un instituto normal. Su vida esta perfectamente en orden y por eso mismo no se queja de nada. Le pega una paliza a Taiga sin saber quien es y a partir de ahi lleva tres años mintiendo por ella. El capitolo 6 es el suyo: cuenta por que no habla con su padre, y es la razon de que el final de la serie duela mas de lo que parece.'],
  ['Taiga Aisaka', '', 'main', '逢坂大河', 'Rie Kugimiya',
    'La Tiger. Su casa esta en bancarrota, su madre se esta muriendo y su hermano mas pequeno le ha criado a golpes y le ha costado el indice. Amenaza a Ryuuji con matarle al padre y al hermano, y al final acaba usando a Ryuuji de escudo, justo lo contrario. Es la que miente primero y la que peor lo lleva.'],
  ['Ami Kawashima', '', 'main', '川嶋亜美', 'Eri Kitamura',
    'La que parece la rival y no lo es. Es la mas lista de la clase, se le da bien todo lo que se le da bien a una persona y lo que no se le da bien no lo hace. Tiene un problema con Taiga que no tiene nada que ver con el que tiene su familia, y lo cuenta mejor que ella misma. Sale en los dos titulos.'],
  ['Minori Kushieda', '', 'main', '櫛枝実乃梨', 'Yu Horie',
    'La unica que ve el conjunto desde el principio, y la que esta en el centro de ese chiringuito desde antes de que llegase Taiga. Es la que mas hace y la que peor se lo pasa, y su relacion con Taiga se rompe en el capitolo 24.'],
  ['Yūsaku Kitamura', '', 'main', '北村祐作', 'Yūji Noguchi',
    'El que sostiene el grupo. Es el que mas pone a prueba el acuerdo de los dos y el que mas se rompe cuando se entera, y despues es el que se levanta y vuelve a sostenerlo todo. Es de los pocos de la serie que no cambia de bando nunca.'],
  ['Kōji Haruta', '', 'supporting', '春田浩次', 'Hiroyuki Yoshino',
    'El del pelo largo y la cara de no estimar a nadie. Se le ve de simple desde el primer capitulo y sigue asi hasta el final. El que va delante cuando alguien se pone tonto.'],
  ['Hisamitsu Noto', '', 'supporting', '能登久光', 'Kazuyuki Okitsu',
    'El de las gafas, que es el que mas parece saber lo que pasa y el que mas se calla. Lleva desde el principio apuntando a algo que no quiere decir.'],
  ['Maya Kihara', '', 'supporting', '木原麻耶', 'Ai Nonaka',
    'La del grupo que va de gyu. Se le ve el cambio con Taiga desde bastante antes que nadie y no lo cuenta, y el capitolo en el que por fin se le ve es uno de los que mas pesan en la serie.'],
  ['Yasuko Takasu', '', 'supporting', '高須泰子', 'Sayaka Ohara',
    'La madre de Ryuuji. Es quien le explica la situacion en el capitolo 6, que es el que explica por que el chaval es como es. Nunca dice lo que piensa y hace exactamente lo que tiene que hacer.'],
  ['Yuri Koigakubo', '', 'supporting', '恋ヶ窪ゆり', 'Rie Tanaka',
    'La profesora de lengua de 2-C. Es la que se da cuenta de que el acuerdo no funciona, y la que mas prueba de paciencia tiene con el grupo entero.'],
  ['Sumire Kanō', '', 'supporting', '狩野すみれ', 'Hiroko Mita',
    'La hermana mayor de Sakura. Va siempre en segundo plano y tiene el nombre de una flor, y cuando habla hay que hacer caso.'],
  ['Sakura Kanō', '', 'supporting', '狩野さくら', 'Kana Asumi',
    'La hermana pequeña. Es de las pocas del grupo que se le ve el cariño por Taiga sin hacerlo a proposito, y la escena de la OVA en la que la encuentran es de lo mejor que tiene el capitolo.'],
  ['Kōta Tomiie', '1', 'supporting', '富家幸太', 'Nobuhiko Okamoto',
    'El presidente del consejo estudiantil. Sale en la serie y no aparece en la OVA, y su unica gracia es ser la cabeza de la gente que no tiene ninguna.'],
  ['Kuroma', '1', 'supporting', '黒間', 'Nobunaga Shimazaki',
    'El profe de educacion fisica, que es el unico adulto que habla de usted al grupo. Sale en la serie y no en la OVA.'],
  ['Murase', '1', 'supporting', '村瀬', 'Takashi Ohara',
    'El de la clase. Sale en cuatro escenas y en tres se le ve sin saber que pasa.'],
  ['Inage', '1', 'supporting', '稲毛', 'Tsuyoshi Aoki',
    'El que va a casa de Taiga a comer. Es el unico personaje de la serie que come bien, y la serie entera se sostiene sobre un hecho: Taiga no tiene a nadie que le cocine.'],
  ['Rikurō Aisaka', '1', 'antagonist', '逢坂陸郎', 'Toru Furuya',
    'El padre de Taiga. Es el antagonista de verdad de la historia y no es un monstruo: es un tipo que sabe exactamente lo que hace con su hijo y lo hace todos los dias. Todo lo que Taiga es viene de el.'],
  ['Yū Aisaka', '1', 'antagonist', '逢坂ゆう', 'Risa Matsuda',
    'El hermano pequeno. Es el de la promesa y el del celos, y el que Ryuuji va a buscar al final de la serie. Es la unica razon por la que Taiga sigue ahi.'],
  ['Sonoko Takasu', '1', 'supporting', '高須園子', 'Mina Kobayashi',
    'La madre de verdad de Ryuuji. Sale poco y no habla casi nada, y la unica vez que tiene escena es una de las que explica el capitolo 6.'],
  ['Seiji Takasu', '1', 'supporting', '高須清児', 'Go Aoki',
    'El padre de verdad de Ryuuji. Sale en el capitolo 6 y en ninguno más, y por eso ese capitolo es el que es.'],
  ['Sena Hamada', '1', 'supporting', '濱田瀬奈', 'Saori Gotō',
    'La chica de tercero. Sale un rato, se casa con Minori y desaparece. Es la linea de la serie que va menos a ningun sitio y aun asi es del grupo.'],
  ['Yuriko Mitsui', '1', 'supporting', '光井百合子', 'Asami Fujita',
    'La del curso de al lado, que esta con el grupo cuando le viene bien. Sale en la serie y no en la OVA.'],
  ['Nanako Kashii', '', 'supporting', '香椎奈々子', 'Haruka Tomatsu',
    'La Fan Master. Viene de un club de otra clase, se une al grupo y se convierte en una de las suyas. Sale en la serie y en la OVA.'],
  ['Stalker Otoko', '', 'antagonist', 'ストーカー男', 'Takahiro Sakurai',
    'El que lleva la voz de la calle en la primera parte y va con muy buen pulso en una escena. Sale en la serie y en la OVA.'],
  ['Inko-chan', '', 'supporting', 'インコちゃん', 'Yōko Hikasa',
    'El loro. Es el miembro del grupo que no habla y el que mejor conecta a la gente, y es de los que mas se recuerdan al final de la serie.'],
];