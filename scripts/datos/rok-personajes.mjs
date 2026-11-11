// PERSONAJES - Ranking of Kings
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Una sola temporada: todos van con la temporada vacía. Los nombres,
// el japonés y las voces vienen de AniList (113717) y se comprobaron
// contra la Wikipedia japonesa. Las descripciones son propias, en
// castellano.
//
// Miranjo es la mujer que vive en el espejo mágico. AniList indexa esa
// entrada como "Mahou no Kagami" (魔法の鏡), no como Miranjo, así que
// se usa el nombre japonés del espejo para que el enlazador encuentre
// su imagen. El nombre visible es el de la serie.

const TODAS = '';

export const PERSONAJES = [
  ['Bojji', TODAS, 'main', 'ボッジ', 'Minami Hinata',
   'El príncipe heredero de Bosse. Es sordo, no puede hablar y es tan débil que apenas levanta una espada, pero tiene un corazón enorme y una valentía que sorprende a todos.'],

  ['Kage', TODAS, 'main', 'カゲ', 'Ayumu Murase',
   'El último superviviente del clan de las sombras. Roba para comer y desconfía de todo el mundo hasta que conoce a Bojji, el único humano que lo trata como a un igual.'],

  ['Daida', TODAS, 'supporting', 'ダイダ', 'Yuuki Kaji',
   'El segundo príncipe y hermano pequeño de Bojji. Está destinado a ser rey, pero carga con la presión de su padre y con la sombra de un hermano al que todos desprecian.'],

  ['Hiling', TODAS, 'supporting', 'ヒリング', 'Rina Satou',
   'La reina de Bosse y madre de Daida. Tiene fama de dura, pero protege a Bojji como si fuera su propio hijo y hará lo imposible por mantener el reino en pie.'],

  ['Bosse', TODAS, 'supporting', 'ボッス', 'Kenta Miyake',
   'El primer rey del reino de Bosse y padre de Bojji y Daida. Fue un gigante invencible que construyó un reino con sus manos, y su muerte deja un vacío que nadie sabe llenar.'],

  ['Miranjo', TODAS, 'antagonist', '魔法の鏡', 'Maaya Sakamoto / Maika Yoshida',
   'Una mujer que perdió el cuerpo y vive encerrada en un espejo mágico. Manipula a Daida desde la sombra y persigue un objetivo que mezcla el amor, la venganza y la destrucción del reino.'],

  ['Despa', TODAS, 'supporting', 'デスパー', 'Takahiro Sakurai',
   'El hermano del rey del inframundo y maestro de Bojji. Es un espadachín excéntrico, obsesionado con el dinero, que acepta entrenar al príncipe aunque no cree que pueda hacerse fuerte.'],

  ['Domas', TODAS, 'supporting', 'ドーマス', 'Takuya Eguchi',
   'El espadachín más fuerte de Bosse y maestro de Bojji. Su lealtad al reino choca con el cariño que siente por el príncipe, y esa duda lo empuja a tomar decisiones terribles.'],

  ['Hokuro', TODAS, 'supporting', 'ホクロ', 'Daiki Yamashita',
   'Un soldado que acompaña a Bojji y Domas en su primer viaje. Es torpe y miedoso, pero se queda al lado del príncipe cuando todos los demás lo abandonan.'],

  ['Ouken', TODAS, 'antagonist', 'オウケン', 'Kouji Yusa',
   'Un caballero del inframundo condenado por una maldición que lo hace inmortal. Su cuerpo se regenera una y otra vez, y su espada no distingue entre amigos y enemigos.'],

  ['Apeas', TODAS, 'supporting', 'アピス', 'Hiroki Yasumoto',
   'Uno de los cuatro grandes caballeros del reino de Bosse. Es leal al rey y a Daida, y su fuerza con el escudo lo convierte en una muralla cuando el castillo se ve acosado.'],

  ['Dorshe', TODAS, 'supporting', 'ドルーシ', 'Hinata Tadokoro',
   'El guardaespaldas personal de la reina Hiling. Es grande, silencioso y totalmente leal; su fuerza protege a la reina y a Daida incluso cuando el reino se divide.'],

  ['Bebin', TODAS, 'supporting', 'ベビン', 'Youji Ueda',
   'Uno de los cuatro grandes caballeros y el más cerebral del grupo. Entrena a Daida y conoce los secretos de Bosse, lo que lo convierte en una pieza clave en la sucesión.'],

  ['Sheena', TODAS, 'supporting', 'シーナ', 'Takako Honda',
   'La primera esposa de Bosse y madre biológica de Bojji. Su muerte marca la infancia del príncipe y su recuerdo aparece en los momentos más duros de la historia.'],

  ['Desha', TODAS, 'supporting', 'デスハー', 'Yoshimitsu Shimoyama',
   'El rey del inframundo y hermano mayor de Despa. Ocupa el segundo puesto del ranking de reyes y busca a Miranjo para ajustar cuentas con el pasado de su familia.'],

  ['Sorii', TODAS, 'supporting', 'ソリー', 'Tsuguo Mogami',
   'El anciano tutor de Daida y guardián de la biblioteca del castillo. Conoce la historia de Bosse y ayuda al joven príncipe a entender el peso de la corona.'],

  ['Gigan', TODAS, 'supporting', 'ギガン', 'Hayato Kaneko',
   'Un gigante del inframundo que se hace amigo de Bojji durante su viaje. Su tamaño impone, pero su bondad y su historia con Desha lo acercan al príncipe.'],

  ['Madre de Miranjo', TODAS, 'supporting', 'ミランジョの母', 'Ayumi Tsunematsu',
   'La madre de Miranjo. Su relación con su hija y con Bosse explica parte del rencor que empuja a Miranjo a manipular el reino desde el espejo.'],

  ['Madre de Kage', TODAS, 'supporting', 'カゲ母', 'Megumi Toyoguchi',
   'La madre de Kage. Murió protegiendo a su hijo del clan de la luz, y su recuerdo es la razón por la que Kage desconfía de los humanos y busca un lugar al que pertenecer.'],
  ['Sandeo', '1,2', 'supporting', 'サンデオ', 'Kentarou Tone',
   'Un antiguo rey del inframundo que aparece en los recuerdos de Desha y Despa. Su legado pesa sobre sus hijos.'],
  ['Red', '1', 'supporting', 'レッド', 'Hiroki Yasumoto',
   'Un guerrero del inframundo que sirve a Desha. Su fuerza y su lealtad lo convierten en uno de sus hombres de confianza.'],
  ['Kingbo', '1', 'supporting', 'キングボ', 'Daichi Endou',
   'Un guerrero del inframundo que acompaña a Desha. Su carácter y su fuerza lo hacen temible en combate.'],
  ['Black', '1', 'supporting', 'ブラック', 'Kentarou Tone',
   'Un guerrero del inframundo al servicio de Desha. Su experiencia lo convierte en una pieza clave de la corte.'],
  ['Zokku', '1', 'supporting', 'ゾック', 'Tsuguo Mogami',
   'Un habitante del reino que aparece en las historias de la primera temporada. Su presencia completa el retrato de la corte.'],
  ['Mitsumata', '1,2', 'supporting', 'ミツマタ', 'Nozomu Sasaki',
   'Un guerrero que participa en las pruebas y los conflictos del reino. Su experiencia lo convierte en un rival a tener en cuenta.'],
  ['Ann', '1,2', 'supporting', 'アン', 'Akari Higuchi',
   'Una joven del reino que se cruza con Bojji y Kage en su viaje. Su amabilidad ayuda a los protagonistas.'],
  ['Aban', '1,2', 'supporting', 'アバン', 'Hinata Tadokoro',
   'Un miembro de la corte que aparece en las historias del reino. Su lealtad a Bosse marca su papel en la sucesión.'],
  ['Renn', '1,2', 'supporting', 'レーン', 'Kentarou Tone',
   'Un guerrero que sirve al reino y participa en la defensa del castillo. Su experiencia lo convierte en un soldado fiable.'],
  ['Bonn', '1,2', 'supporting', 'ボーン', 'Shinya Takahashi',
   'Un soldado del reino que aparece en las escenas de la corte y en los combates. Su lealtad lo lleva a seguir a sus capitanes.'],
  ['Poise', '1', 'supporting', 'ポイーズ', 'Hana Satou',
   'Una joven del reino que aparece en las historias del cofre del valor. Su mirada inocente contrasta con la guerra.'],
  ['Dou', '2', 'supporting', 'ドウ', 'Takaaki Uchino',
   'Un guerrero o habitante del inframundo que aparece en la segunda temporada. Su presencia amplía el mundo de los muertos.'],
  ['Dodon', '2', 'supporting', 'ドドン', 'Masafumi Kimura',
   'Un personaje del inframundo que aparece en las historias de la segunda temporada. Su fuerza y su carácter lo hacen memorable.'],
  ['Fren', '2', 'supporting', 'フレン', 'Yuu Okano',
   'Un seguidor de Ouken que aparece en las historias del cofre del valor. Su lealtad lo lleva a desafiar las reglas del inframundo.'],
  ['Satun', '2', 'supporting', 'サトゥン', 'Jirou Saitou',
   'Un personaje del reino que aparece en la segunda temporada. Su historia completa el mosaico de la corte y el inframundo.'],
  ['Kyou', '2', 'supporting', 'キョウ', 'Hikaru Midorikawa',
   'Un guerrero que aparece en las historias de la segunda temporada. Su habilidad y su carácter lo convierten en un rival interesante.'],
];
