// PERSONAJES - Chihayafuru
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Una sola temporada: todos van con la temporada vacía. Los nombres,
// el japonés y las voces vienen de AniList (10800) y se comprobaron
// contra la ficha de la serie. Las descripciones son propias, en
// castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Chihaya Ayase', TODAS, 'main', '綾瀬千早', 'Asami Seto',
   'Una estudiante con un oído excepcional y una energía que no cabe en el aula. Descubre el karuta gracias a Arata y dedica su juventud a formar un equipo y llegar a la final nacional.'],

  ['Taichi Mashima', TODAS, 'main', '真島太一', 'Mamoru Miyano',
   'El amigo de la infancia de Chihaya y su rival más constante. Viene de una familia acomodada, es brillante en los estudios y lucha por demostrar que también puede ser el mejor en el karuta.'],

  ['Arata Wataya', TODAS, 'supporting', '綿谷新', 'Yoshimasa Hosoya',
   'El chico que enseñó a Chihaya y a Taichi a jugar al karuta. Se marcha a Fukui para cuidar de su abuelo y durante un tiempo abandona el deporte, pero vuelve cuando más lo necesitan.'],

  ['Kanade Ooe', TODAS, 'supporting', '大江奏', 'Ai Kayano',
   'La hija de una tienda de kimonos y amante de la poesía clásica. Entra en el club por los poemas y descubre que el karuta competitivo también tiene belleza.'],

  ['Yuusei Nishida', TODAS, 'supporting', '西田優征', 'Tooru Nara',
   'Un compañero de la infancia de Chihaya que dejó el karuta por el tenis. Vuelve al club con más experiencia y se convierte en uno de sus miembros más constantes.'],

  ['Tsutomu Komano', TODAS, 'supporting', '駒野勉', 'Tsubasa Yonaga',
   'El segundo mejor alumno de la clase y el miembro más metódico del club. Al principio cree que el karuta es un juego, pero acaba estudiando cada carta como si fuera un examen.'],

  ['Hiro Kinashi', TODAS, 'supporting', '木梨浩', 'Kazuya Nakai',
   'Un miembro excéntrico del club de karuta de Hokuou. Es hablador, competitivo y uno de los primeros rivales que pone a prueba el nivel del club de Mizusawa.'],

  ['Hideo Harada', TODAS, 'supporting', '原田秀雄', 'Unshou Ishizuka',
   'El responsable de la sociedad de karuta de Shiranami. Enseña a Chihaya que cada carta puede ser un amigo y la ayuda a entender que la fuerza también está en la cabeza.'],

  ['Chitose Ayase', TODAS, 'supporting', '綾瀬千歳', 'Aya Endou',
   'La hermana mayor de Chihaya. Es modelo, sociable y completamente distinta a Chihaya; su éxito y su forma de vivir hacen que la protagonista se pregunte qué quiere para sí misma.'],

  ['Shinobu Wakamiya', TODAS, 'supporting', '若宮詩暢', 'Mihoko Nakamichi',
   'La reina del karuta. Es una jugadora prodigiosa, solitaria y obsesionada con la velocidad; su talento parece imposible de alcanzar hasta que Chihaya la desafía.'],

  ['Akito Sudou', TODAS, 'supporting', '須藤暁人', 'Takashi Oohara',
   'Un jugador de clase A del club de Hokuou. Es arrogante y provocador, y su duelos con Chihaya y Taichi sirven para medir la distancia entre ambos equipos.'],

  ['Hisashi Suou', TODAS, 'supporting', '周防久志', 'Hiroki Touchi',
   'El maestro del karuta. Su dominio de las cartas de una sílaba y su estilo frío impresionan a Chihaya y le muestran hasta dónde puede llegar un jugador.'],

  ['Taeko Miyauchi', TODAS, 'supporting', '宮内妙子', 'Toshiko Fujita',
   'La profesora que acepta ser asesora del club de karuta. Al principio desconfía del deporte, pero acaba apoyando a Chihaya y a sus compañeros en cada torneo.'],

  ['Reiko Mashima', TODAS, 'supporting', '真島麗子', 'Yuu Shimamura',
   'La madre de Taichi. Es exigente con los estudios de su hijo y desconfía del karuta, aunque su preocupación por el futuro de Taichi es sincera.'],

  ['Kenji Ayase', TODAS, 'supporting', '綾瀬健二', 'Kenji Hamada',
   'El padre de Chihaya. Es tranquilo y cariñoso, y guarda recortes de sus hijas en un álbum; su apoyo silencioso ayuda a Chihaya a seguir jugando.'],

  ['Chieko Ayase', TODAS, 'supporting', '綾瀬千恵子', 'Satsuki Yukino',
   'La madre de Chihaya. Le preocupa que su hija deje los estudios por el karuta, pero también reconoce la pasión y la disciplina que la niña ha encontrado en el deporte.'],

  ['Mari Wataya', TODAS, 'supporting', '綿谷麻里', 'Houko Kuwashima',
   'La madre de Arata. Acompaña a su hijo en los torneos y vive con preocupación el abandono del karuta tras la muerte del abuelo.'],

  ['Hajime Wataya', TODAS, 'supporting', '綿谷始', 'Kinryuu Arimoto',
   'El abuelo de Arata y maestro de karuta. Es quien le enseña a jugar y quien deja en el chico la promesa de seguir mejorando.'],

  ['Sumire Hanano', '2', 'supporting', '花野菫', 'Megumi Han',
   'Una novata que se une al club para estar cerca de Taichi. Al principio solo piensa en el amor, pero el karuta y sus compañeros le enseñan a esforzarse por algo propio.'],

  ['Akihiro Tsukuba', '2', 'supporting', '筑波秋博', 'Miyu Irino',
   'Un novato experto en karuta de segunda versión. Su talento y su pasado familiar lo convierten en un refuerzo inesperado para el equipo.'],

  ['Rion Yamashiro', '2', 'supporting', '山城理音', 'Ayahi Takagaki',
   'La nieta de una lectora profesional y rival de Chihaya en la final nacional. Su técnica y su sangre la convierten en una oponente temible.'],

  ['Midori Sakurazawa', '2', 'supporting', '桜沢翠', 'Megumi Hayashibara',
   'La entrenadora de Fujisaki y una de las personas que mejor entiende el karuta competitivo. Su método exigente forma a algunas de las mejores jugadoras del país.'],

  ['Midori Tamaru', '3', 'supporting', '田丸翠', 'Inori Minase',
   'Una jugadora de clase A que se incorpora al club de Mizusawa. Su talento y su carácter travieso traen aire nuevo al equipo.'],

  ['Haruka Inokuma', '3', 'supporting', '猪熊遥', 'Maaya Sakamoto',
   'Una exreina del karuta que vuelve a competir. Su experiencia y su estilo pausado la convierten en una rival difícil para Shinobu.'],
];
