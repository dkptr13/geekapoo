// PERSONAJES - Belle
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. Los roles siguen
// AniList (127271): Suzu y Ryuu son MAIN; los amigos, Justin y los
// padres de Suzu van como SUPPORTING. Se dejan fuera los personajes
// sin nombre propio y los BACKGROUND.
//
// Nombres, kanji y seiyuus vienen de AniList. Las descripciones son
// propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Suzu Naitou', TODAS, 'main', '内藤鈴', 'Kaho Nakamura',
   'La protagonista. Dejó de cantar cuando su madre murió y vive en un pueblo del campo con su padre. Dentro de U se convierte en Belle, pero el valor que encuentra allí tiene que llevarlo de vuelta al mundo real.'],

  ['Ryuu', TODAS, 'main', '竜', 'Takeru Satou',
   'El dragón de U. Todo el mundo lo busca por destrozar la armonía del mundo virtual, pero debajo del avatar hay un chico que está intentando proteger a alguien.'],

  ['Shinobu Hisatake', TODAS, 'supporting', '久武忍', 'Ryou Narita',
   'El amigo de la infancia de Suzu y su protector desde el colegio. Es popular y algo distante, y la conoce desde antes de que dejara de cantar, aunque ninguno de los dos sabe decirlo sin herirse.'],

  ['Shinjirou Chikami', TODAS, 'supporting', '千頭慎次郎', 'Shouta Sometani',
   'El compañero de clase que montó solo el club de piragüismo. Es impulsivo, habla más de la cuenta y forma parte del grupo que empuja a Suzu a salir de su caparazón.'],

  ['Ruka Watanabe', TODAS, 'supporting', '渡辺瑠果', 'Tina Tamashiro',
   'La amiga de Suzu. Le confiesa que le gusta Chikami y, sin querer, ayuda a que Suzu entienda que los sentimientos no se pueden dejar sin decir para siempre.'],

  ['Hiroka Betsuyaku', TODAS, 'supporting', '別役弘香', 'Lilas Ikuta',
   'La amiga que descubre el talento de Suzu y la empuja a entrar en U. Es directa, algo cínica y la que mejor entiende que Belle es una forma de hablar por Suzu.'],

  ['Justin', TODAS, 'supporting', 'ジャスティン', 'Toshiyuki Morikawa',
   'El líder de Justice, el grupo que quiere desenmascarar al dragón. Tiene un aparato capaz de revelar la identidad real de cualquier avatar y no duda en usarlo.'],

  ['Madre de Suzu', TODAS, 'supporting', '鈴の母', 'Sumi Shimamoto',
   'La madre de Suzu. Murió ahogada salvando a otra niña y su recuerdo es el motivo por el que Suzu dejó de cantar y el nudo que la película desata.'],

  ['Padre de Suzu', TODAS, 'supporting', '鈴の父', 'Kouji Hashimoto',
   'El padre de Suzu. Se queda solo con ella después de la muerte de su mujer y la deja espacio para volver a la música sin presionarla.'],
];
