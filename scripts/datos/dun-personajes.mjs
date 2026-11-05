// PERSONAJES - Delicious in Dungeon
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Nombres, kanji y voces vienen de AniList (ficha 153518). Los resumenes
// son propios, en castellano, a partir de las descripciones de AniList y
// de la serie. Se incluyen los cuatro protagonistas, los secundarios con
// peso en la trama y el antagonista principal; se dejan fuera los papeles
// de fondo sin nombre propio.

export const PERSONAJES = [
  ['Laios Thorden', '1', 'main', 'ライオス・トーデン', 'Kentarou Kumagai',
   'Laios es el líder del grupo y el hermano mayor de Falin. Es un humano del continente norte, alto y fuerte, y un fanático de los monstruos. Su conocimiento y su pasión por las criaturas de la mazmorra lo convierten en un explorador excelente, aunque sus habilidades sociales dejan mucho que desear.'],

  ['Marcille Donato', '1', 'main', 'マルシル・ドナトー', 'Sayaka Senbongi',
   'Marcille es la maga del grupo de Laios. Es una elfa del continente norte, aunque en realidad es mitad elfa y mitad humana. Es estudiosa, orgullosa y muy protectora con sus compañeros. Su magia curativa y sus hechizos de ataque son esenciales para el grupo, y domina también la magia negra antigua.'],

  ['Senshi', '1', 'main', 'センシ', 'Hiroshi Naka',
   'Senshi es el cocinero del grupo. Es un enano del continente oriental que ha pasado diez años viviendo en la mazmorra y estudiando la cocina de monstruos. Es práctico, gruñón y muy protector con sus compañeros. Su conocimiento de los ingredientes y de las criaturas salva al grupo más de una vez.'],

  ['Chilchuck Tims', '1', 'main', 'チルチャック・ティムズ', 'Asuna Tomari',
   'Chilchuck es el ladrón del grupo. Es un pies ligeros del continente oriental, astuto, práctico y de lengua afilada. No acepta un trabajo si no le pagan por adelantado. Es especialista en abrir cerraduras y en detectar trampas, y su experiencia es clave para sobrevivir en los pisos más peligrosos.'],

  ['Falin Thorden', '1', 'supporting', 'ファリン・トーデン', 'Saori Hayami',
   'Falin es la hermana menor de Laios y una maga especializada en hechizos de apoyo. Es humana, amable y muy considerada, y no quiere hacer daño a nadie. Su desaparición a manos del dragón rojo es el motivo por el que el grupo vuelve a la mazmorra.'],

  ['Toshirou Nakamoto', '1', 'supporting', '半本俊朗', 'Shinji Kawada',
   'Toshirou Nakamoto, conocido como Shuro, fue miembro del grupo de los hermanos Thorden y ahora lidera a sus propios sirvientes. Es un humano del este, serio y reservado, y está enamorado de Falin. Su habilidad con la espada y su sentido del deber lo convierten en un aliado valioso.'],

  ['Izutsumi', '1', 'supporting', 'イヅツミ', 'Mitsuho Kambe',
   'Izutsumi es una humana-bestia del archipiélago oriental que se une al grupo de Laios. Antes servía a Shuro y tiene un carácter egoísta y arisco, aunque poco a poco aprende a valorar el trabajo en equipo. Su agilidad y sus reflejos la hacen muy útil en el combate.'],

  ['Kabru', '1', 'supporting', 'カブルー', 'Wataru Katou',
   'Kabru es el líder de un grupo de aventureros que también intenta conquistar la mazmorra. Es un humano carismático, observador y muy buen estratega. Desconfía de Laios y de su obsesión por los monstruos, pero acaba reconociendo su valor y su conocimiento de la mazmorra.'],

  ['Thistle', '1', 'antagonist', 'シスル', 'Yuu Kobayashi',
   'Thistle es el mago que creó la mazmorra de la isla y el bufón de la corte del rey Delgal durante la Edad Dorada. Es el principal antagonista de la historia: el Mago Lunático que controla el laberinto y secuestra a Falin para encontrar a su antiguo rey.'],

  ['Rinsha', '1', 'supporting', 'リンシャ', 'Rie Takahashi',
   'Rinsha es una joven maga del este y miembro del grupo de Kabru. Es celosa y protectora con Kabru, y no duda en mostrarlo. Su magia y su conocimiento de los hechizos la convierten en una integrante importante del equipo.'],

  ['Namari', '1', 'supporting', 'ナマリ', 'Akira Miki',
   'Namari es una enana del continente oriental y antigua miembro del grupo de Laios. Ahora trabaja con el grupo de Tansu. Conoce muy bien las armas y la herrería, y su experiencia en la mazmorra la hace una guerrera formidable.'],

  ['Mithrun', '1', 'supporting', 'ミスルン', 'Kouki Uchiyama',
   'Mithrun es el capitán de los Canarios, el grupo élfico enviado a investigar la mazmorra. Es un elfo de pelo claro y orejas cortadas, marcado por la magia negra. A pesar de su aspecto tranquilo, es un combatiente peligroso y un líder frío.'],

  ['Inutade', '1', 'supporting', 'イヌタデ', 'Yoshino Furuya',
   'Inutade es una ogra del archipiélago oriental que sirve a Shuro como criada y guardaespaldas. Es despreocupada, amistosa y muy simple, y siempre tiene hambre. Su fuerza bruta la convierte en una aliada temible.'],

  ['Maizuru', '1', 'supporting', 'マイヅル', 'Youko Hikasa',
   'Maizuru es una humana del archipiélago oriental que sirve a Shuro desde que era niño. Es una maga poderosa y una maestra sobreprotectora. Su lealtad a Shuro es absoluta y no duda en enfrentarse a quien amenace a su señor.'],

  ['Pattadol', '1', 'supporting', 'パッタドル', 'Mariya Ise',
   'Pattadol es miembro de los Canarios y pertenece a la casa noble Vari. Es una elfa de pelo largo que lucha con un familiar hada. Aunque intenta cumplir las normas, su carácter nervioso la pone en apuros más de una vez.'],

  ['Otta', '1', 'supporting', 'オッタ', 'Kokoro Kikuchi',
   'Otta es la miembro más pequeña del escuadrón del capitán Mithrun. Su magia le permite manipular la tierra y la piedra para crear plataformas y muros dentro de la mazmorra. Es una aliada discreta pero muy útil.'],

  ['Cithis', '1', 'supporting', 'シスヒス', 'Hana Takeda',
   'Cithis es miembro de los Canarios y parece ser la segunda al mando de Mithrun. Su especialidad mágica no está clara, pero es capaz de quemar a sus enemigos con una herramienta con forma de rama de lirio. Fue condenada por usar magia negra.'],

  ['Tansu Floke', '1', 'supporting', 'タンスさん', 'Kazuhiko Inoue',
   'Tansu Floke es un gnomo mago enviado por los poderes de Kahka Brud para investigar la mazmorra. Es reflexivo y sabio, y actúa como consejero del gobernador. Su grupo incluye a su esposa Yarn, a Namari y a los gemelos Kiki y Kaka.'],

  ['Holm Kranom', '1', 'supporting', 'ホルム', 'Yuuya Hirose',
   'Holm Kranom es un investigador de magia elemental antigua que pertenece al grupo de Kabru. Utiliza cuatro espíritus diferentes y su conocimiento de los elementos le permite cubrir las necesidades del equipo en la mazmorra.'],

  ['Kuro', '1', 'supporting', 'クロ', 'Tooru Nara',
   'Kuro es un kobold que se unió al grupo de Kabru junto a Mickbell. Es leal y nunca se separa de su amo. Su olfato y su instinto animal lo convierten en un buen rastreador.'],

  ['Kiki Floke', '1', 'supporting', 'キキ', 'Ikumi Hasegawa',
   'Kiki es una humana del grupo de Tansu y hermana gemela de Kaka. Fue adoptada por los Floke después de que su clan la abandonara de niña. Es alegre, impulsiva y muy hábil con las armas.'],

  ['Benichidori', '1', 'supporting', 'ベニチドリ', 'Akari Kitou',
   'Benichidori es una humana del archipiélago oriental que sirve a Shuro como ninja. Su verdadero nombre es Matsu. Es callada, observadora y prudente, y una combatiente muy competente.'],

  ['Mickbell Tomas', '1', 'supporting', 'ミックベル', 'Miyu Tomita',
   'Mickbell Tomas es un pies ligeros del grupo de Kabru. Es tacaño y siempre va acompañado de su kobold Kuro. A pesar de su tamaño, su astucia y su habilidad para moverse en espacios estrechos lo hacen muy útil.'],

  ['Diamond of Sadena', '1', 'supporting', 'サデナのダイアモンド', 'Kei Kawamura',
   'Diamond of Sadena es una enana del grupo de Kabru. Es una guerrera poderosa que usa un hacha para segar monstruos. Su carácter directo y su fuerza la convierten en una aliada temible.'],

  ['Kaka Floke', '1', 'supporting', 'カカ', 'Ryousuke Takahashi',
   'Kaka es un humano del grupo de Tansu y hermano gemelo de Kiki. Fue adoptado por los Floke junto a su hermana. Es tranquilo, leal y un buen espadachín.'],

  ['Yarn Floke', '1', 'supporting', 'ヤーン・フロッカ', 'Hitomi Shogawa',
   'Yarn Floke es una gnoma maga del grupo de Tansu. Al igual que su marido, fue enviada por los poderes de Kahka Brud para investigar la mazmorra. Es sabia y prudente, y sirve como consejera del gobernador.'],

  ['Hien', '1', 'supporting', 'ヒエン', 'Arisa Shida',
   'Hien es una humana del archipiélago oriental que sirve a Shuro como ninja. Su verdadero nombre es Naka. Es una combatiente muy capaz y algo impulsiva, y no duda en proteger a sus compañeros.'],

  ['Fleki', '1', 'supporting', 'フレキ', 'Yuu Sasahara',
   'Fleki es una elfa de los Canarios con el pelo ondulado y las orejas marcadas por la magia negra. Es una maga hábil y bastante excéntrica. Le gusta todo lo picante y odia las zanahorias.'],

  ['Lycion', '1', 'supporting', 'リシオン', 'Daisuke Kishio',
   'Lycion es un elfo de los Canarios, tranquilo y despreocupado. Como muchos de sus compañeros, tiene las orejas cortadas por haber usado magia negra. Su habilidad le permite transformarse en una bestia canina.'],

  ['Doni', '1', 'supporting', 'ドニ', 'Shou Nogami',
   'Doni es un aventurero novato que explora la mazmorra junto a Fionil. Es un humano del continente norte, hijo de granjeros, que dejó su casa para ver mundo. Es valiente pero inexperto.'],

  ['Fionil', '1', 'supporting', 'フィオニル', 'Suzuka Morita',
   'Fionil es una aventurera novata que explora la mazmorra junto a Doni. Es mitad elfa y fue contratada por los elfos del oeste para informar de los cambios de la isla, pero acabó uniéndose a Doni por su historia.'],

  ['Zon', '1', 'supporting', 'ゾン', 'Kousuke Gotou',
   'Zon es el jefe de los orcos que viven en la mazmorra de la isla. Es un líder orgulloso y desconfiado al principio, pero acaba colaborando con Laios y su grupo cuando el dragón rojo invade su territorio.'],

  ['Delgal', '1', 'supporting', 'デルガル', 'Tomoyuki Shimura',
   'Delgal fue el rey del País Dorado y el padre de Freinag. Desapareció cuando la mazmorra fue descubierta, y su recuerdo obsesiona al Mago Lunático. Su historia está ligada a la maldición de inmortalidad que pesa sobre su pueblo.'],

  ['Freinag', '1', 'supporting', 'フライナーグ', 'Houchuu Ootsuka',
   'Freinag fue el rey del País Dorado y el padre de Delgal. Su reinado terminó cuando la mazmorra y la maldición del Mago Lunático cayeron sobre su reino.'],

  ['Leed', '1', 'supporting', 'リド', 'Michiyo Murase',
   'Leed es la hermana menor del jefe orco Zon. Es la líder de un grupo de orcos que captura a Laios y a sus compañeros, y aunque desconfía de los humanos, acaba escuchando sus razones.'],

  ['Yaad', '1', 'supporting', 'ヤアド', 'Ayumu Murase',
   'Yaad es el nieto de Delgal y el jefe de la aldea del Castillo Dorado. Vive con su pueblo bajo la maldición de la inmortalidad y les explica a Laios y a los suyos la historia del reino y del león alado.'],

  ['Toushu', '1', 'supporting', '島主', 'Nobuo Tobita',
   'Toushu es el señor de la isla, un humano que gobierna los asuntos de la mazmorra. Es un advenedizo rico al que le interesa sobre todo el dinero que produce el laberinto y que deja las negociaciones en manos de su consejero, el señor Tansu. Cuando los elfos reclaman la mazmorra, se ve desbordado por la presión.'],
];
