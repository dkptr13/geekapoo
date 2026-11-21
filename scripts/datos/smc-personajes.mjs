// PERSONAJES - smc
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
// '' = sale en todas las temporadas.

export const PERSONAJES = [
  ['Usagi Tsukino', '', 'main', '月野うさぎ', 'Kotono Mitsuishi',
   'La protagonista. Una estudiante alegre, perezosa y llorona que se transforma en Sailor Moon, la guerrera del amor y la justicia. Con el tiempo se convierte en la líder de las Sailor Guardians y en la reencarnación de la Princesa Serenity.'],

  ['Ami Mizuno', '', 'main', '水野亜美', 'Hisako Kanemoto',
   'La Sailor Mercury, una estudiante brillante y tímida apasionada por la ciencia. Sus gafas y su ordenador le permiten analizar al enemigo, y su ataque de burbujas la convierte en el cerebro del equipo.'],

  ['Rei Hino', '', 'main', '火野レイ', 'Rina Satou',
   'La Sailor Mars, una sacerdotisa del templo Hikawa de carácter fuerte y directo. Sus poderes del fuego y sus premoniciones la convierten en una de las guerreras más decididas del grupo.'],

  ['Makoto Kino', '', 'main', '木野まこと', 'Ami Koshimizu',
   'La Sailor Jupiter, una chica alta y fuerte con fama de delincuente que en realidad es dulce y romántica. Maneja el rayo y las plantas, y es la mejor cocinera del equipo.'],

  ['Minako Aino', '', 'main', '愛野美奈子', 'Shizuka Itou',
   'La Sailor Venus, una soñadora que aspira a ser idol y que ya luchó como Sailor V antes de unirse al grupo. Su cadena y su corazón de cristal la hacen una guerrera muy experimentada.'],

  ['Mamoru Chiba', '', 'main', '地場衛', 'Kenji Nojima',
   'El misterioso Tuxedo Mask, un estudiante universitario que ayuda a las Sailor Guardians desde las sombras. Es la reencarnación del príncipe Endymion y el gran amor de Usagi.'],

  ['Chibiusa', '', 'main', 'ちびうさ', 'Misato Fukuen',
   'La hija de Usagi y Mamoru que llega del futuro como una niña pequeña. Se transforma en Sailor Chibi Moon y con el tiempo se convierte en Sailor Moon del siglo XXX.'],

  ['Luna', '', 'main', 'ルナ', 'Ryou Hirohashi',
   'La gata negra que despierta a Usagi como Sailor Moon. Guía al grupo, les entrega los objetos mágicos y oculta un pasado ligado al Reino de la Luna.'],

  ['Artemis', '', 'main', 'アルテミス', 'Youhei Obayashi',
   'El gato blanco compañero de Minako y asesor de las Sailor Guardians. Es más relajado que Luna, pero igual de protector con el equipo.'],

  ['Haruka Tenou', '2', 'main', '天王はるか', 'Junko Minagawa',
   'La Sailor Uranus, una piloto y corredora de aspecto andrógino. Protege la Tierra desde el exterior junto a Michiru y no duda en tomar decisiones duras para detener a los enemigos.'],

  ['Michiru Kaiou', '2', 'main', '海王みちる', 'Sayaka Oohara',
   'La Sailor Neptune, una violinista elegante y serena. Forma pareja con Haruka y comparte su visión pragmática de la lucha contra las amenazas que ponen en peligro el planeta.'],

  ['Setsuna Meiou', '', 'main', '冥王せつな', 'Ai Maeda',
   'La Sailor Pluto, guardiana de la Puerta del Tiempo. Su deber es proteger el flujo temporal, aunque su cariño por Chibiusa la lleva a intervenir más de lo que le permiten sus normas.'],

  ['Hotaru Tomoe', '2', 'main', '土萠ほたる', 'Yukiyo Fujii',
   'La hija enfermiza del profesor Tomoe que se convierte en Sailor Saturn, la guerrera de la destrucción. Su poder puede reiniciar el mundo, pero su salud y su soledad la hacen vulnerable.'],

  ['Souichi Tomoe', '2', 'antagonist', '土萠創一', 'Takuya Kirimoto',
   'Un científico brillante y desequilibrado que dirige el laboratorio de la Mugen Academy. Tras el accidente que marcó a Hotaru, se alía con los Death Busters y se convierte en su líder.'],

  ['Queen Beryl', '1', 'antagonist', 'クイン・ベリル', 'Misa Watanabe',
   'La reina del Reino Oscuro que sirve a Metalia. Envía a los Cuatro Reyes Celestiales a robar energía y busca el Cristal de Plata para despertar a su señora.'],

  ['Queen Metalia', '1', 'antagonist', 'クイン・メタリア', 'Youko Matsuoka',
   'La entidad maligna que corrompió el Reino de la Luna. Se alimenta de energía humana y es la verdadera fuerza detrás de la Reina Beryl.'],

  ['Jadeite', '1', 'antagonist', 'ジェダイト', 'Daisuke Kishio',
   'El primero de los Cuatro Reyes Celestiales del Reino Oscuro. Dirige a los youma que roban energía y desprecia a los humanos, hasta que sus fracasos lo condenan.'],

  ['Nephrite', '1', 'antagonist', 'ネフライト', 'Kousuke Toriumi',
   'El segundo de los Cuatro Reyes Celestiales. Abandona la recolección de energía para buscar el Cristal de Plata y acaba enamorado de Naru, lo que provoca su caída.'],

  ['Zoisite', '1', 'antagonist', 'ゾイサイト', 'Masaya Matsukaze',
   'El tercero de los Cuatro Reyes Celestiales, elegante y cruel. Busca los Cristales del Arcoíris y se enfrenta a Kunzite, con quien mantiene una relación muy cercana.'],

  ['Kunzite', '1', 'antagonist', 'クンツァイト', 'Eiji Takemoto',
   'El líder de los Cuatro Reyes Celestiales. Un guerrero frío y poderoso que sirve a Beryl y que guarda un vínculo especial con Zoisite.'],

  ['Prince Dimande', '1', 'antagonist', 'プリンス・デマンド', 'Mamoru Miyano',
   'El príncipe del planeta Némesis y líder del Clan de la Luna Negra. Quiere cambiar el pasado para salvar a su pueblo y se obsesiona con la Princesa Serenity.'],

  ['Saphir', '1', 'antagonist', '蒼のサフィール', 'Tsubasa Yonaga',
   'El hermano menor de Dimande y científico del Clan de la Luna Negra. Su lealtad y sus dudas sobre Wiseman lo convierten en una figura trágica.'],

  ['Crimson Rubeus', '1', 'antagonist', '紅のルベウス', 'Hiroki Takahashi',
   'Un miembro del Clan de la Luna Negra que comanda a las Hermanas de la Muerte. Es arrogante y utiliza a Black Lady para atacar a las Sailor Guardians.'],

  ['Esmeraude', '1', 'antagonist', '翠のエスメロード', 'Houko Kuwashima',
   'Una oficial del Clan de la Luna Negra que busca el Cristal de Plata y sueña con casarse con Dimande. Su risa y su ambición la hacen peligrosa.'],

  ['Wiseman', '1', 'antagonist', 'ワイズマン', 'Hiroshi Iwasaki',
   'El anciano encapuchado que manipula al Clan de la Luna Negra. En realidad es el Death Phantom, una entidad unida al planeta Némesis.'],

  ['Black Lady', '1', 'antagonist', 'ブラック・レディ', 'Misato Fukuen',
   'La forma adulta y malvada de Chibiusa, corrompida por Wiseman. Sirve al Clan de la Luna Negra y ataca a sus propios padres.'],

  ['Cooan', '1', 'antagonist', 'コーアン', 'Satsuki Yukino',
   'La mayor de las Hermanas de la Muerte, con poderes de fuego. Trabaja para Rubeus y se enfrenta a Sailor Mars.'],

  ['Berthier', '1', 'antagonist', 'ベルチェ', 'Rumi Kasahara',
   'La segunda de las Hermanas de la Muerte, especialista en el hielo. Es fría y calculadora, y subestima a Sailor Mercury.'],

  ['Petz', '1', 'antagonist', 'ペッツ', 'Wasabi Mizuta',
   'La tercera de las Hermanas de la Muerte, con poderes eléctricos. Es la más impulsiva de las cuatro y busca vengarse de las Sailor Guardians.'],

  ['Calaveras', '1', 'antagonist', 'カラベラス', 'Tomoe Hanba',
   'La menor de las Hermanas de la Muerte, experta en ilusiones y en el látigo. Su arrogancia la lleva a subestimar a sus enemigas.'],

  ['Kaolinite', '2', 'antagonist', 'カオリナイト', 'Hikari Yono',
   'La primera comandante de los Death Busters y profesora de la Mugen Academy. Busca los corazones puros que contienen los talismanes.'],

  ['Eudial', '2', 'antagonist', 'ユージアル', 'Chiaki Takahashi',
   'La primera de las Brujas 5, especialista en tecnología y en extraer corazones puros. Su actitud competitiva la enfrenta a sus propias aliadas.'],

  ['Mimete', '2', 'antagonist', 'ミメット', 'Yuki Nagaku',
   'La segunda de las Brujas 5, obsesionada con el espectáculo y los famosos. Usa su encanto para atraer a sus víctimas.'],

  ['Tellu', '2', 'antagonist', 'テルル', 'Naomi Oozora',
   'La tercera de las Brujas 5, experta en plantas y venenos. Utiliza flores monstruosas para robar corazones puros.'],

  ['Viluy', '2', 'antagonist', 'ビリユイ', 'Rina Honizumi',
   'La cuarta de las Brujas 5, una científica que controla la tecnología y los datos. Su frialdad la convierte en una rival temible.'],

  ['Cyprine', '2', 'antagonist', 'シプリン', 'Umeka Shouji',
   'Una de las dos Brujas 5 que comparten cuerpo con Ptilol. Controla el fuego y las ilusiones, y ataca en pareja.'],

  ['Ptilol', '2', 'antagonist', 'プチロル', 'Umeka Shouji',
   'La otra mitad de Cyprine, especializada en el agua y el hielo. Solo puede ser derrotada si se separa de su hermana.'],

  ['Mistress 9', '2', 'antagonist', 'ミストレス９', 'Yukiyo Fujii',
   'La entidad que posee el cuerpo de Hotaru Tomoe y que sirve al profesor Tomoe. Quiere abrir la puerta a Pharaoh 90 y destruir la Tierra.'],

  ['Pharaoh 90', '2', 'antagonist', '師・ファラオ90', 'Takaya Hashi',
   'La entidad del espacio profundo que los Death Busters intentan invocar. Su llegada amenaza con destruir la Tierra.'],

  ['Naru Oosaka', '', 'supporting', '大阪なる', 'Satomi Satou',
   'La mejor amiga de Usagi en la escuela. Es dulce y romántica, y sufre las consecuencias de los ataques del Reino Oscuro y del Clan de la Luna Negra.'],

  ['Gurio Umino', '', 'supporting', '海野ぐりお', 'Daiki Yamashita',
   'El compañero de clase de Usagi, un empollón con gafas y datos curiosos. Está enamorado de Naru y ayuda a las protagonistas sin saber la verdad.'],

  ['Ikuko Tsukino', '', 'supporting', '月野育子', 'Yuuko Mizutani',
   'La madre de Usagi. Es cariñosa y algo estricta, y siempre se preocupa por las notas y el comportamiento de su hija.'],

  ['Shingo Tsukino', '1', 'supporting', '月野進悟', 'Seira Ryuu',
   'El hermano pequeño de Usagi. Es travieso y se burla de ella, pero en el fondo la quiere.'],

  ['Kenji Tsukino', '', 'supporting', '月野謙之', 'Mitsuaki Madono',
   'El padre de Usagi, un periodista que trabaja mucho. Aparece en casa en contadas ocasiones y apoya a su familia.'],

  ['Haruna Sakurada', '1', 'supporting', '桜田春菜', 'Akemi Kanda',
   'La profesora de Usagi en la escuela. Es despistada y romántica, y suele convertirse en víctima de los enemigos.'],

  ['Motoki Furuhata', '', 'supporting', '古幡元基', 'Hiroshi Okamoto',
   'El dependiente del salón de videojuegos Crown. Es amable y popular, y Mamoru y Usagi lo conocen bien.'],

  ['Diana', '', 'supporting', 'ダイアナ', 'Shouko Nakagawa',
   'La hija de Luna y Artemis que llega del futuro. Es una gatita juguetona y muy unida a Chibiusa.'],

  ['Queen Serenity', '1', 'supporting', 'クイン・セレニティ', 'Mami Koyama',
   'La antigua reina del Reino de la Luna y madre de la Princesa Serenity. Su sacrificio selló a Metalia y protegió la Tierra.'],

  ['Reika Nishimura', '', 'supporting', '西村レイカ', 'Mai Nakahara',
   'Una estudiante universitaria amiga de Mamoru. Es inteligente y amable, y su relación con Mamoru despierta los celos de Usagi.'],

  ['Ittou Asanuma', '', 'supporting', '浅沼一等', 'Daisuke Sakaguchi',
   'Un compañero de clase de Usagi que admira a las Sailor Guardians. Es leal y algo impulsivo, y ayuda a proteger el secreto de Usagi.'],
];
