// PERSONAJES - Earwig y la bruja
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (119321): Aya, Bella Yaga y el Mandrake son
// MAIN; Thomas, la madre de Aya, Custard y Mr. Jenkins van como
// SUPPORTING.
//
// Se dejan fuera los personajes sin voz japonesa (Cook, Assistant
// Cook, Enchou y Selma) y los BACKGROUND (Phyllis y Sally).
//
// AniList y la Wikipedia inglesa dan a Mr. Jenkins la voz de Yuuji
// Ueda, pero la tabla de voces de la Wikipedia japonesa asigna el
// papel a Hiroshi Iwasaki (岩崎ひろし). Se sigue la fuente japonesa.
// Las descripciones son propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Aya Tsuru', TODAS, 'main', 'アーヤ・ツール', 'Kokoro Hirasawa',
   'La protagonista. Es una niña de diez años que vive en el orfanato de St. Morwald y que ha aprendido a conseguir lo que quiere con simpatía y algo de manipulación. Cuando los brujos se la llevan, no se asusta: quiere aprender magia y tomar el control de su nueva casa.'],

  ['Bella Yaga', TODAS, 'main', 'ベラ・ヤーガ', 'Shinobu Terajima',
   'Una bruja que adopta a Aya para que le haga las tareas de la casa. Es exigente, poderosa y poco cariñosa, y no tiene intención de enseñarle magia. Aun así, subestima la paciencia y la astucia de la niña.'],

  ['Mandrake', TODAS, 'main', 'マンドレーク', 'Etsushi Toyokawa',
   'El compañero de Bella Yaga y dueño de la casa. Es alto, silencioso y de mal genio, y su magia sella todas las salidas. Detrás de su aire amenazante guarda un pasado musical que conecta con la madre de Aya.'],

  ['Thomas', TODAS, 'supporting', 'トーマス', 'Gaku Hamada',
   'El gato faldero de Bella Yaga. Habla, se queja de su suerte y conoce todos los secretos de la casa. Se convierte en el aliado más valioso de Aya, aunque su lealtad está dividida entre la niña y su ama.'],

  ['Madre de Aya', TODAS, 'supporting', 'アーヤの母親', 'Sherina Munaf',
   'La madre de Aya, una bruja que dejó a su hija en el orfanato cuando era un bebé. Aparece en recuerdos y canciones, y su voz conecta el misterio de la casa con el pasado de la banda de música.'],

  ['Custard', TODAS, 'supporting', 'カスタード', 'Saito Yusei',
   'El mejor amigo de Aya en el orfanato. Es tímido y miedoso, pero la sigue en sus travesuras y la ayuda a escapar de la rutina. Su amistad es lo que Aya más echa de menos cuando se va a casa de los brujos.'],

  ['Mr. Jenkins', TODAS, 'supporting', 'Mr.ジェンキンス', 'Hiroshi Iwasaki',
   'Un trabajador del orfanato de St. Morwald que se ocupa del día a día de los niños. Es uno de los adultos que Aya tiene convencidos con su encanto, y su presencia recuerda la vida sencilla que la niña deja atrás.'],

  ['Enchou', TODAS, 'supporting', '園長', 'Sin acreditar',
   'La directora del orfanato de St. Morwald. Cambia el nombre de Earwig por el de Erica Wigg y representa la vida ordenada que la niña está a punto de dejar atrás.'],

  ['Selma', TODAS, 'supporting', 'セルマ', 'Sin acreditar',
   'Una de las niñas del orfanato. Comparte con Earwig y Custard el día a día de St. Morwald antes de que la bruja Bella Yaga se lleve a Earwig.'],

  ['Phyllis', TODAS, 'supporting', 'フィリス', 'Sin acreditar',
   'Otra de las niñas del orfanato de St. Morwald. Forma parte del grupo que convive con Earwig y Custard y muestra la rutina del centro.'],

  ['Sally', TODAS, 'supporting', 'サリー', 'Sin acreditar',
   'Una niña del orfanato que aparece en las escenas de St. Morwald. Su presencia completa el retrato de la vida en el centro antes de la adopción de Earwig.'],
];
