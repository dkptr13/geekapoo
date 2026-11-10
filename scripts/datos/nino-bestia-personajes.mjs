// PERSONAJES - El niño y la bestia
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (20981): Kumatetsu, Ren y Kaede son MAIN; el
// resto va como SUPPORTING. AniList lista a Chiko como BACKGROUND,
// pero es un personaje con voz y presencia constante, así que se
// incluye como supporting.
//
// Correcciones documentadas:
// - AniList da a Kumatetsu la voz de Kouji Hashimoto, pero la
//   Wikipedia japonesa y los créditos de la película asignan el papel
//   a Kouji Yakusho. Se sigue la fuente japonesa.
// - Ren, Ichirouhiko y Jiroumaru tienen una voz de niño y otra de
//   adulto. Se unifican en una ficha por personaje, con las dos voces
//   indicadas en el campo de voz, para no duplicar la misma persona.
// - El padre y la madre de Ren no están en AniList. Se añaden con los
//   datos de la Wikipedia japonesa porque cierran la trama familiar. Se
//   etiquetan como padres de Kyuuta (el nombre que le pone Kumatetsu)
//   para que el enlazador no les asigne por error la imagen de Ren.
// Las descripciones son propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Kumatetsu', TODAS, 'main', '熊徹', 'Kouji Yakusho',
   'Un guerrero con cabeza de oso que aspira a ser el próximo Gran Maestro de Shibuten. Es brusco, orgulloso y no sabe explicar lo que sabe hacer, pero acepta a Ren como aprendiz y termina tratándolo como un hijo.'],

  ['Ren', TODAS, 'main', '蓮', 'Aoi Miyazaki (niño) / Shouta Sometani (adulto)',
   'El hijo de una madre soltera que muere en un accidente cuando él tiene nueve años. Huye de sus parientes, llega a Shibuten y se convierte en el aprendiz de Kumatetsu, que lo llama Kyuuta. Con los años regresa a Shibuya y debe elegir entre el mundo humano y el de los monstruos.'],

  ['Kaede', TODAS, 'main', '楓', 'Suzu Hirose',
   'Una estudiante de instituto que conoce a Ren en la biblioteca de Shibuya. Es independiente y estudiosa, y se convierte en su apoyo cuando él intenta recuperar una vida humana. Su relación con Ren lo ayuda a entender que puede pertenecer a los dos mundos.'],

  ['Tatara', TODAS, 'supporting', '多々良', 'You Oizumi',
   'Un monstruo con cara de mono y el mejor amigo de Kumatetsu. Es cínico y sarcástico, pero se preocupa por su amigo y por Ren. Le aconseja a Kumatetsu cómo ser un buen maestro.'],

  ['Hyakushuubou', TODAS, 'supporting', '百秋坊', 'Lily Franky',
   'Un monstruo con cara de cerdo y monje budista. Es el otro amigo de Kumatetsu y el más paciente del grupo. Enseña a Ren las tareas de la casa y le da consejos cuando su relación con el maestro se rompe.'],

  ['Soushi', TODAS, 'supporting', '宗師', 'Masahiko Tsugawa',
   'El Gran Maestro de Shibuten. Es un anciano con cara de conejo que lleva siglos gobernando a los monstruos. Busca un sucesor digno entre Kumatetsu e Iouzan antes de convertirse en dios.'],

  ['Iouzan', TODAS, 'supporting', '猪王山', 'Kazuhiro Yamaji',
   'Un monstruo con cara de jabalí y el rival de Kumatetsu por el título de Gran Maestro. Es poderoso, respetado y tiene dos hijos, Ichirouhiko y Jiroumaru. Su disciplina contrasta con el carácter impulsivo de Kumatetsu.'],

  ['Ichirouhiko', TODAS, 'supporting', '一郎彦', 'Haru Kuroki (niño) / Mamoru Miyano (adulto)',
   'El hijo mayor de Iouzan. Es un estudiante brillante y el orgullo de su padre, pero esconde un secreto sobre su origen. Su complejo y su miedo a no ser suficiente alimentan la oscuridad que amenaza a los dos mundos.'],

  ['Jiroumaru', TODAS, 'supporting', '二郎丸', 'Momoka Oono (niño) / Kappei Yamaguchi (adulto)',
   'El hijo menor de Iouzan y hermano de Ichirouhiko. Es alegre, comilón y muy directo. Al principio desprecia a Ren por ser humano, pero acaba siendo su mejor amigo entre los monstruos.'],

  ['Chiko', TODAS, 'supporting', 'チコ', 'Sumire Morohoshi',
   'Una pequeña criatura que Ren encuentra en un callejón de Shibuya. Lo acompaña como una mascota y un apoyo silencioso. Su presencia recuerda a Ren que también hay un lugar para él en el mundo humano.'],

  ['Padre de Kyuuta', TODAS, 'supporting', '九太の父', 'Keishi Nagatsuka',
   'El padre de Ren, al que en Shibuten llaman Kyuuta. Se divorció de su madre por presión de la familia de ella y no pudo criarlo ni acudir al funeral. Lleva años buscándolo y, cuando lo reencuentra, le ofrece el hogar que perdió.'],

  ['Madre de Kyuuta', TODAS, 'supporting', '九太の母', 'Kumiko Aso',
   'La madre de Ren. Crio a su hijo sola y murió en un accidente cuando él era pequeño. Aparece en los recuerdos y en momentos de duda, como una voz que lo ayuda a seguir adelante.'],
];
