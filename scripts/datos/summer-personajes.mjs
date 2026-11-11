// PERSONAJES - Summer Wars
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. Los nombres, el
// japonés y las voces vienen de AniList (5681) y se comprobaron contra
// la ficha de la película. Las descripciones son propias, en castellano.
//
// Love Machine no tiene nombre japonés en AniList; se usa el katakana
// habitual del programa para que el enlazador tenga una referencia.

const TODAS = '';

export const PERSONAJES = [
  ['Kenji Koiso', TODAS, 'main', '小磯健二', 'Ryuunosuke Kamiki',
   'Un estudiante de diecisiete años brillante en matemáticas y tímido con la gente. Acompaña a Natsuki a Nagano y acaba siendo la pieza clave para detener el ataque a OZ.'],

  ['Natsuki Shinohara', TODAS, 'main', '篠原夏希', 'Nanami Sakuraba',
   'Una estudiante alegre y decidida que invita a Kenji a la casa de su familia. Su relación con los Jinnouchi y con Wabisuke mueve buena parte de la historia.'],

  ['Sakae Jinnouchi', TODAS, 'main', '陣内栄', 'Sumiko Fuji',
   'La matriarca del clan Jinnouchi. A sus noventa años mantiene unida a toda la familia y su autoridad es la que permite organizar la defensa contra el ataque a OZ.'],

  ['Kazuma Ikezawa', TODAS, 'main', '池沢佳主馬', 'Mitsuki Tanimura',
   'El primo pequeño de Natsuki y campeón de artes marciales en OZ bajo el nombre de King Kazma. Es callado, hábil con los ordenadores y uno de los mejores luchadores del mundo virtual.'],

  ['Wabisuke Jinnouchi', TODAS, 'main', '陣内侘助', 'Ayumu Saitou',
   'Un experto en informática y antiguo amor de Natsuki. Su pasado con la familia y su relación con el programa que ataca OZ lo convierten en una figura ambigua.'],

  ['Shingo Jinnouchi', TODAS, 'supporting', '陣内真悟', 'Yuuki Imai',
   'El hijo pequeño de Yorihiko y Noriko. Su curiosidad y sus travesuras aportan el tono más familiar a la reunión de los Jinnouchi.'],

  ['Yumi Jinnouchi', TODAS, 'supporting', '陣内由美', 'Riisa Naka',
   'La esposa de Katsuhiko y una de las muchas mujeres que sostienen la casa durante la crisis. Su sentido práctico ayuda a organizar a la familia.'],

  ['Katsuhiko Jinnouchi', TODAS, 'supporting', '陣内克彦', 'Mitsutaka Itakura',
   'El hijo menor de Mansaku y bombero de Ueda. Su experiencia en rescates resulta útil cuando la situación se complica en la ciudad.'],

  ['Love Machine', TODAS, 'antagonist', 'ラブマシーン', 'Sin acreditar',
   'Un programa de inteligencia artificial que escapa del control de sus creadores y empieza a absorber cuentas de OZ. Su hambre de datos pone en peligro la red y a la familia Jinnouchi.'],

  ['Takashi Sakuma', TODAS, 'supporting', '佐久間敬', 'Takahiro Yokokawa',
   'El mejor amigo de Kenji y moderador de OZ. Su conocimiento del mundo virtual ayuda a Kenji a moverse dentro del sistema y a contactar con otros usuarios.'],

  ['Mariko Jinnouchi', TODAS, 'supporting', '陣内万理子', 'Mieko Nobusawa',
   'La hija mayor de Sakae y madre de Riichi y Rika. Es una de las voces que mantienen el orden en la casa y la memoria de la familia.'],

  ['Mansuke Jinnouchi', TODAS, 'supporting', '陣内万助', 'Ichirou Nagai',
   'El hijo mediano de Sakae y dueño de una pescadería. Su carácter práctico y su red de contactos locales ayudan a la familia durante la emergencia.'],

  ['Tasuke Jinnouchi', TODAS, 'supporting', '陣内太助', 'Takashi Kobayashi',
   'El hijo de Mansuke y dueño de una tienda de electrónica. Su conocimiento de los aparatos y las cámaras resulta útil para seguir el ataque a OZ.'],

  ['Naomi Miwa', TODAS, 'supporting', '三輪直美', 'Kaori Yamagata',
   'La hija mayor de Mansuke y una de las mujeres más decididas de la familia. Su experiencia como madre y su sentido común ayudan a calmar los ánimos.'],

  ['Kiyomi Ikezawa', TODAS, 'supporting', '池沢聖美', 'Tagame Tamura',
   'La madre de Kazuma y trabajadora social en Nagoya. Su embarazo y su preocupación por su hijo muestran el lado más cotidiano de la familia.'],
  ['Kana Jinnouchi', '', 'supporting', '陣内加奈', 'Hinano Minagawa',
   'La hija pequeña de Kunihiko y Nana. Su presencia aporta el lado más doméstico de la reunión familiar.'],
  ['Nana Jinnouchi', '', 'supporting', '陣内奈々', 'Chigusa Takaku',
   'La esposa de Kunihiko y madre de Kana. Participa en la organización de la casa durante la crisis.'],
  ['Riichi Jinnouchi', '', 'supporting', '陣内理一', 'Takuya Kirimoto',
   'El hijo de Mariko y miembro de las Fuerzas de Autodefensa. Su experiencia militar ayuda a la familia a responder al ataque.'],
  ['Rika Jinnouchi', '', 'supporting', '陣内理香', 'Sakiko Tamagawa',
   'La hija de Mariko y funcionaria del ayuntamiento. Su conocimiento de la administración local resulta útil en la emergencia.'],
  ['Shouta Jinnouchi', '', 'supporting', '陣内翔太', 'Yutaka Shimizu',
   'El hijo de Tasuke y policía. Su sentido del deber lo lleva a colaborar en la defensa de la ciudad.'],
  ['Yorihiko Jinnouchi', '', 'supporting', '陣内頼彦', 'Youji Tanaka',
   'El hijo de Sakae y padre de Shingo. Su familia representa una de las ramas de los Jinnouchi.'],
  ['Kunihiko Jinnouchi', '', 'supporting', '陣内邦彦', 'Hashiya Nakamura',
   'El esposo de Nana y padre de Kana. Su presencia completa el retrato de la familia extensa.'],
  ['Noriko Jinnouchi', '', 'supporting', '陣内典子', 'Eiko Kanazawa',
   'La esposa de Yorihiko y madre de Shingo. Su calma ayuda a mantener el orden en la casa.'],
  ['Ryohei Jinnouchi', '', 'supporting', '陣内了平', 'Naoto Adachi',
   'Uno de los miembros mayores del clan Jinnouchi. Su experiencia y su humor acompañan la reunión familiar.'],
  ['Mao Jinnouchi', '', 'supporting', '陣内真緒', 'Sumire Morohoshi',
   'Una de las niñas de la familia. Su curiosidad y sus juegos aportan el tono más ligero de la película.'],
];
