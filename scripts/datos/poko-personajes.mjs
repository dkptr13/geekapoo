// PERSONAJES - Pompoko
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (1030): el narrador y Shoukichi son MAIN; los
// demás tanukis y el presidente de Wonderland van como SUPPORTING.
//
// Se dejan fuera Hanako, que no tiene voz japonesa en AniList, y
// Ryuutarou, que AniList marca como BACKGROUND. Nombres, kanji y
// seiyuus vienen de AniList. Las descripciones son propias, en
// castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Narrador', TODAS, 'main', 'ナレーター', 'Shinchou Kokontei',
   'La voz que cuenta la historia. Es el propio Shoukichi ya mayor, que recuerda desde el presente la guerra de los tanukis de Tama y explica con humor cómo intentaron salvar su bosque.'],

  ['Shoukichi', TODAS, 'main', '正吉', 'Makoto Nonomura',
   'Un tanuki joven y valiente del grupo de Tama. Es uno de los que organizan la resistencia contra la urbanización y aprende las técnicas de transformación que los maestros traen desde Shikoku. Su energía choca a veces con la prudencia de los mayores.'],

  ['Tamasaburou', TODAS, 'supporting', '玉三郎', 'Akira Kamiya',
   'Un tanuki dotado para la transformación que se marcha a Shikoku en busca de los ancianos maestros. Se convierte en discípulo de Kinchou y se casa con su hija Koharu, lo que lo une para siempre al mundo de los mayores.'],

  ['Okiyo', TODAS, 'supporting', 'おキヨ', 'Yuriko Ishida',
   'La esposa de Shoukichi y una de las tanukis más decididas de Tama. Su padre murió a manos de un cazador, y esa pérdida alimenta su empeño en defender el bosque y en construir un futuro para la comunidad.'],

  ['Inugami Gyobu', TODAS, 'supporting', '隠神刑部', 'Gannosuke Ashiya',
   'Uno de los grandes líderes tanukis de Shikoku, con siglos de experiencia y un clan enorme a sus espaldas. Acude a Tama para enseñar a los jóvenes y participar en la operación de los fantasmas.'],

  ['Bunta', TODAS, 'supporting', '文太', 'Takehiro Murata',
   'Un tanuki de Tama que domina la transformación a medias y que es enviado a la isla de Sado en busca de otro maestro. Es práctico, algo escéptico y prefiere los planes que no dependan solo de la magia.'],

  ['Tsurugame Oshou', TODAS, 'supporting', '鶴亀和尚', 'Kosan Yanagiya',
   'El monje del templo Manpuku, muy querido por los tanukis de Tama. Es amable y paciente, y su templo se convierte en cuartel general de la resistencia. Incluso siente lástima por los humanos que mueren en los ataques.'],

  ['Presidente de Wonderland', TODAS, 'supporting', 'ワンダーランドの社長', 'Takehiro Murata',
   'El empresario que dirige el parque de atracciones Wonderland y que aparece rodeado de micrófonos y periodistas. Los tanukis intentan convencerlo o asustarlo para que frene la construcción que amenaza su bosque.'],

  ['Ponkichi', TODAS, 'supporting', 'ぽん吉', 'Shouzou Hayashiya IX',
   'Un tanuki de Tama que no sabe transformarse y que, en el fondo, prefiere seguir siendo un perro mapache. Es la pareja de Hanako y un amigo cercano de Shoukichi, y representa a quienes no pueden sumarse a la lucha mágica.'],

  ['Seizaemon', TODAS, 'supporting', '青左衛門', 'Norihei Miki',
   'El líder de los tanukis del bosque de Suzuga. Empieza como rival de Gonta, pero la amenaza humana los obliga a unir fuerzas. Es más razonable que su rival y suele frenar las decisiones impulsivas del grupo.'],

  ['Gonta', TODAS, 'supporting', '権太', 'Shigeru Izumiya',
   'Un tanuki pendenciero y de mal genio que prefiere la confrontación directa. Su impaciencia lo lleva a actuar por su cuenta y a poner en peligro los planes más cuidadosos del grupo, aunque su valor resulta difícil de ignorar.'],

  ['Tasaburou Hage', TODAS, 'supporting', '太三郎禿狸', 'Katsura Bunshi V',
   'Uno de los tres maestros de la transformación de Shikoku. Es un tanuki anciano y algo vanidoso que llega a Tama para ayudar en la operación de los fantasmas y demostrar que la vieja magia todavía funciona.'],

  ['Kinchou VI', TODAS, 'supporting', '六代目金長', 'Beichou Katsura',
   'El sexto de los Kinchou, un maestro de la transformación de Shikoku y padre de Koharu. Acepta a Tamasaburou como discípulo y le enseña que cambiar de forma exige disciplina y respeto por los demás.'],

  ['Oroku', TODAS, 'supporting', 'おろく婆', 'Nijiko Kiyokawa',
   'La anciana que mantiene la paz entre los tanukis de Tama. Es sensata, firme y muy respetada; todos la llaman abuela y acuden a ella cuando la comunidad se divide.'],

  ['Ryuutarou', TODAS, 'supporting', '竜太郎', 'Akira Fukuzawa',
   'Un zorro de Tama Hills que sobrevive mezclándose con los humanos. Su ejemplo muestra a los tanuki la tentación de abandonar su naturaleza y vivir como personas.'],
];
