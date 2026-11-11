// PERSONAJES - Susurros del corazón
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (585): Shizuku y Seiji son MAIN; la familia,
// los amigos, el Barón y el dueño de la tienda van como SUPPORTING.
// Se deja fuera Muta, que en esta película no tiene voz japonesa en
// AniList, y los BACKGROUND.
//
// Nombres, kanji y seiyuus vienen de AniList. Las descripciones son
// propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Shizuku Tsukishima', TODAS, 'main', '月島雫', 'Youko Honna',
   'La protagonista. Es una lectora voraz y una soñadora que no sabe qué hacer con su talento. La relación con Seiji y el encargo de escribir sobre el Barón la empujan a probarse a sí misma.'],

  ['Seiji Amasawa', TODAS, 'main', '天沢聖司', 'Issei Takahashi',
   'El chico que aparece en las fichas de todos los libros de Shizuku. Quiere ser lutier y se marcha a Italia a formarse, aunque eso signifique separarse de ella durante unos meses.'],

  ['Yuko Harada', TODAS, 'supporting', '原田夕子', 'Maiko Yoshiyama',
   'La mejor amiga de Shizuku. Es alegre y romántica, y su forma de hablar de los chicos ayuda a Shizuku a nombrar lo que siente.'],

  ['Seiya Tsukishima', TODAS, 'supporting', '月島靖也', 'Takashi Tachibana',
   'El padre de Shizuku. Trabaja en una biblioteca y apoya a su hija cuando decide escribir, aunque no siempre entienda el rumbo que toma.'],

  ['Asako Tsukishima', TODAS, 'supporting', '月島朝子', 'Shigeru Muroi',
   'La madre de Shizuku. Le preocupa que su hija descuide los estudios y le recuerda que los sueños también necesitan una base real.'],

  ['Shiho Tsukishima', TODAS, 'supporting', '月島汐', 'Yorie Yamashita',
   'La hermana mayor de Shizuku. Estudia y trabaja, y su relación con Shizuku muestra dos formas distintas de crecer en la misma casa.'],

  ['Humbert von Gikkingen Danshaku', TODAS, 'supporting', 'フンベルト・フォン・ジッキンゲン男爵', 'Shigeru Tsuyuguchi',
   'El Barón, la estatua de gato de la tienda de antigüedades. Su historia inspira la novela de Shizuku y más tarde protagoniza su propio relato.'],

  ['Nishi Shiro', TODAS, 'supporting', '西司朗', 'Keiju Kobayashi',
   'El dueño de la tienda de antigüedades. Es un anciano paciente que deja que Shizuku descubra el Barón por sí misma y le da el espacio para escribir su historia.'],

  ['Kousaka', TODAS, 'supporting', '高坂', 'Minami Takayama',
   'Un compañero de clase que aparece en el grupo de amigos de Shizuku. Su papel es pequeño, pero ayuda a retratar la vida escolar alrededor de la protagonista.'],

  ['Muta', TODAS, 'supporting', 'ムタ', 'Sin acreditar',
   'El gato callejero que Shizuku sigue hasta la tienda de antigüedades. Es grande, arisco y curioso, y se convierte en la chispa que la lleva a conocer al Barón y a Seiji.'],

  ['Sugimura', TODAS, 'supporting', '杉村', 'Sin acreditar',
   'Un compañero de clase de Shizuku. Yuko está enamorada de él, y su historia sirve para mostrar los primeros líos sentimentales del instituto.'],
];
