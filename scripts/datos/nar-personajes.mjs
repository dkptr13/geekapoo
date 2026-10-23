// PERSONAJES - Naruto
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en toda la serie; el resto lleva la lista de las temporadas en
// las que aparece. Como aquí solo hay una temporada, los que se van en el
// primer arco llevan un 1.
//
// Nombres, kanji y voces vienen de AniList (ficha 20) y de las fichas
// japonesas de la serie. Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ['Naruto Uzumaki', '', 'main', 'うずまきナルト', 'Junko Takeuchi',
    'El crío rechazado por toda Konoha que se hace ninja para que la gente deje de burlarse de él. Ruidoso, necio y con una lealtad que no entiende de límites; acaba siendo Hokage y padre.'],

  ['Sasuke Uchiha', '', 'main', 'うちはサスケ', 'Noriaki Sugiyama',
    'El último de los Uchiha y el rival de Naruto. Todo lo que hace, desde abandonar la aldea hasta matar a su hermano, es por un mismo rencor.'],

  ['Sakura Haruno', '', 'main', '春野サクラ', 'Chie Nakamura',
    'La compañera de equipo que admira a Sasuke sin saberlo y que se enamora de verdad de Naruto. Crece de la niña que ciertas humillaciones hasta manejar la medicina en la guerra.'],

  ['Kakashi Hatake', '', 'main', 'はたけカカシ', 'Kazuhiko Inoue',
    'El sensei del equipo 7, que cobra por enseñar y no enseña todo. Su Sharingan y su pasado lo convierten en el nin que carga con lo que nadie más quiere.'],

  ['Itachi Uchiha', '', 'antagonist', 'うちはイタチ', 'Hideo Ishikawa',
    'El hermano mayor de Sasuke y miembro de los Akatsuki. Mata a toda su familia para salvarla de la guerra y carga con ese peso hasta el final.'],

  ['Rock Lee', '', 'main', 'ロック・リー', 'Youichi Masukawa',
    'El alumno de Guy que no sabe ninjutsu ni genjutsu y solo tiene el taijutsu. Su fuerza viene de no rendirse nunca, y de abrir puertas que no deberían abrirse.'],

  ['Guy Might', '', 'supporting', 'マイト・ガイ', 'Masashi Ebara',
    'El maestro de Lee, que se entrena con las ocho puertas y que se ríe siempre en voz muy alta. Su lema es el trabajo duro, con o sin técnica.'],

  ['Shikamaru Nara', '', 'main', '奈良シカマル', 'Nobutoshi Kanna',
    'El estratega que resuelve cualquier cosa con diez segundos de análisis y que se queja de todo. Aporta el sentido común que le falta al equipo.'],

  ['Chouji Akimichi', '', 'supporting', '秋道チョウジ', 'Kentarou Itou',
    'El del equipo 10, corpulento y con buen corazón, que come de más porque su técnica de tamaño lo necesita.'],

  ['Ino Yamanaka', '', 'supporting', '山中いの', 'Ryouka Yuzuki',
    'La amiga de Sakura del equipo 10, que usa la transferencia de mente. Rival declarada de Sakura desde la academia y, con los años, aliada.'],

  ['Gaara', '', 'main', '我愛羅', 'Akira Ishida',
    'El hijo del Cuarto Kazekage y el Shukaku alojado en su cuerpo. Empieza como un monstruo y termina siendo el Kazekage que reconstruye Suna.'],

  ['Neji Hyuuga', '', 'main', '日向ネジ', 'Kouichi Toochika',
    'El heredero de los Hyuga y el rival de Naruto en las eliminatorias. Su orgullo lo hace cruel y su derrota lo hace humano.'],

  ['Hinata Hyuuga', '', 'main', '日向ヒナタ', 'Nana Mizuki',
    'La chica que admira a Naruto en silencio desde la academia y que lucha contra la costumbre de su familia. Su fuerza aparece cuando ya no puede esconderse más.'],

  ['Jiraiya', '', 'main', '自来也', 'Houchuu Ootsuka',
    'El maestro de Naruto, escritor de novelas eróticas y eterno trotamundo. Es un bromista y un perdido, y su muerte es el punto de inflexión de toda la serie.'],

  ['Orochimaru', '', 'antagonist', '大蛇丸', 'Kujira',
    'El legendario sapo de Konoha que recorre el mundo en busca de la piedra filosofal. Enseña a Sasuke y arrastra a toda la aldea a la guerra.'],

  ['Zabuza Momochi', '1', 'antagonist', '桃地再不斬', 'Unshou Ishizuka',
    'El ninja de la niebla de la Tierra de las Olas, con una espada tan grande como una puerta. Su técnica de agua le da la fama de demonio de la niebla.'],

  ['Haku', '1', 'supporting', '白', 'Mayumi Asano',
    'El chico de la máscara que lleva su secreto solo desde que le dispararon a Momo, y que le pide a Naruto que lo mate.'],

  ['Kabuto Yakushi', '1', 'antagonist', '薬師カブト', 'Nobutoshi Kanna',
    'El espía del Sonido que se hace pasar por un chūnin de Konoha y que copia técnicas. Su obsesión por Sasuke lo lleva a traicionar a los dos bandos.'],

  ['Tenten', '', 'supporting', 'テンテン', 'Yukari Tamura',
    'La del equipo 8 y la especialista en armas, que llega a manejar cien a la vez. Vuelve a la guerra con el resto del equipo.'],

  ['Kiba Inuzuka', '', 'supporting', '犬塚キバ', 'Kousuke Toriumi',
    'El del equipo 8 y el que tiene a Akamaru, un perro que habla. Su compañera de equipo es Tenten.'],

  ['Shino Aburame', '', 'supporting', '油女シノ', 'Shinji Kawada',
    'El del equipo 8 y el que usa los insectos. Es silencioso, leal y el primero en irse hasta el final.'],

  ['Konohamaru', '', 'supporting', '猿飛木ノ葉丸', 'Ikue Ootani',
    'El nieto del Tercer Hokage y el primer alumno de Naruto. Quiere ser Hokage como su abuelo y su rival.'],

  ['Ebisu', '', 'supporting', 'エビス', 'Nobuo Tobita',
    'El sensei de Konohamaru que se pone las gafas de sol y que siempre tiene una excusa.'],

  ['Iruka Umino', '', 'supporting', 'うみのイルカ', 'Toshihiko Seki',
    'El sensei de Naruto en la academia y el primero que lo trató como persona y no como el crío rechazado que era.'],

  ['Asuma Sarutobi', '', 'supporting', '猿飛アスマ', 'Juurouta Kosugi',
    'El sensei del equipo 10 y el que se casa con Kurenai. Muere en la guerra, dejando a Shikamaru la carga de seguir.'],

  ['Kurenai Yuhi', '', 'supporting', '夕日紅', 'Rumi Ochiai',
    'La kunoichi que dirige a su equipo de genjutsu y que se casa con Shikamaru en el final de la serie.'],

  ['Shizune', '', 'supporting', 'シズネ', 'Keiko Nemoto',
    'La ayudante de Tsunade y la que se preocupa por ella.'],

  ['Tsunade', '', 'supporting', '綱手', 'Masako Katsuki',
    'La quinta Hokage y la nieta de los Senju, que se lleva a Naruto hasta el borde de la muerte para salvarlo.'],

  ['Temari', '', 'supporting', 'テマリ', 'Romi Park',
    'La hermana de Gaara y la kunoichi que lo protege. Es seria, práctica y lleva el abanico de tres hojas que corta el viento.'],

  ['Kankuro', '', 'supporting', 'カンクロウ', 'Yasuyuki Kase',
    'El hermano de Gaara y el que usa las marionetas con hilo.'],

  ['Baki', '', 'supporting', 'バキ', 'Jouji Nakata',
    'El jōnin de Suna que entrena a los genin del desierto.'],

  ['Hiruzen Sarutobi', '', 'supporting', '猿飛ヒルゼン', 'Hidekatsu Shibata',
    'El Tercer Hokage, la maestra de los tres que protegieron a Naruto.'],

  ['Danzo Shimura', '', 'antagonist', '志村ダンゾウ', 'Hiroshi Ito',
    'El candidato a Hokage que lleva el Sharingan de los Uchiha cosido a la espalda y que dirige a Root, el grupo de sombras.'],

  ['Mizuki', '1', 'antagonist', 'ミズキ', 'Shinichirou Miki',
    'El sensei que engaña a Naruto al principio para robar el pergamino prohibido.'],

  ['Hayate Gekko', '1', 'supporting', '月光ハヤテ', 'Nozomu Sasaki',
    'El ninja que muere en el examen chūnin y que da la pista del complot.'],

  ['Genma Shiranui', '', 'supporting', '不知火ゲンマ', 'Hiroaki Hirata',
    'El jōnin que lleva el senbon en la boca y que supervisa el examen.'],

  ['Ibiki Morino', '', 'supporting', '森乃イビキ', 'Taiten Kusunoki',
    'El jōnin que dirige la primera prueba del examen chūnin.'],

  ['Shikaku Nara', '', 'supporting', '奈良シカク', 'Hiroshi Yanaka',
    'El padre de Shikamaru y el general de la Nube.'],

  ['Inoichi Yamanaka', '', 'supporting', '山中いのいち', 'Daiki Nakamura',
    'El padre de Ino y el que lee la mente.'],

  ['Chouza Akimichi', '', 'supporting', '秋道チョウザ', 'Nobuaki Fukuda',
    'El padre de Chouji y el jōnin de la Akimichi.'],

  ['Fugaku Uchiha', '', 'supporting', 'うちはフガク', 'Kenji Hamada',
    'El jefe del clan Uchiha y el padre de Sasuke e Itachi.'],

  ['Mikoto Uchiha', '', 'supporting', 'うちはミコト', 'Emi Sagara',
    'La madre de Sasuke e Itachi, que muere la noche de la masacre del clan Uchiha.'],

  ['Minato Namikaze', '', 'supporting', '波風ミナト', 'Toshiyuki Morikawa',
    'El Cuarto Hokage y el maestro de Kakashi, el hombre más rápido de su época.'],

  ['Kushina Uzumaki', '', 'supporting', 'うずまきクシナ', 'Emi Shinohara',
    'La madre de Naruto, que muere la noche del ataque del zorro de nueve colas.'],

  ['Hiashi Hyuuga', '', 'supporting', '日向ヒアシ', 'Eizou Tsuda',
    'El padre de Hinata y el jefe del clan Hyuga.'],

  ['Anko Mitarashi', '', 'supporting', 'みたらしアンコ', 'Takako Honda',
    'La jōnin que entrena a los genin y que tiene la marca maldita de Orochimaru.'],

  ['Dosu Kinuta', '1', 'antagonist', 'ドス・キヌタ', 'Daisuke Sakaguchi',
    'El genin del Sonido que pelea en el examen chūnin.'],

  ['Kin Tsuchi', '1', 'antagonist', 'キン・ツチ', 'Yumi Toma',
    'La genin del Sonido que usa los cascabeles.'],

  ['Zaku Abumi', '1', 'antagonist', 'ザク・アブミ', 'Keijin Okuda',
    'El genin del Sonido que usa el soplido.'],

  ['Sakumo Hatake', '', 'supporting', 'はたけサクモ', 'Daichi Endo',
    'El padre de Kakashi, el Colmillo Blanco.'],

  ['Homura Mitokado', '', 'supporting', '水戸門ホムラ', 'Hikaru Miyata',
    'El consejero de la aldea y el que vota en contra de Naruto.'],

  ['Koharu Utatane', '', 'supporting', 'うたたねコハル', 'Junko Midori',
    'La consejera de la aldea y la que vota en contra de Naruto.'],
];
