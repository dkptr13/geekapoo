// PERSONAJES - Witch Hat Atelier
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Veintitres, que es el reparto de la primera temporada del anime. El del manga es
// bastante mas largo (la wiki de personajes lista mas de cuarenta), asi que no
// esta todo: solo lo que sale en pantalla.
//
// Nombre japones y seiyuu de la tabla de personajes de la wikipedia en ingles,
// que la saca de la pagina de casting de la propia serie y de Behind the Voice
// Actors.
//
// ── LO QUE ES ESTA SERIE ─────────────────────────────────────
//
// Una serie sobre unas reglas que se sostienen porque nadie las cuestiona. El pacto
// de la Gran Aula dice que la magia es un secreto y que quien lo sepa pierde la
// memoria, y todos los personajes, los buenos incluidos, asumen que esa es la
// forma correcta de hacer las cosas. Lo unico que acerca a alguien al saber es
// que ya no encaja en la escuela.
//
// Coco es la unica que no es bruja de nacimiento y que entra igual, y por eso
// la serie la trata de dos formas opuestas a la vez: la plantea como hija de la
// esperanza y a la vez la expulsa como intrusa, en el mismo capitulo.
//
// ── POR QUE LOS ANTAGONISTAS ─────────────────────────────────
//
// Los Sombrero de Ala y los Caballeros Magos son el antagonista de verdad de
// la historia, no la villana de turno, asi que van con rol `antagonist`. Los
// Caballeros Magos en particular: son los buenos del reparto institucional y
// son los que borran la memoria a Coco.
//
// Con una sola temporada, el campo de temporadas va vacio en todos: vacio
// significa "todas", y aqui solo hay una.

export const PERSONAJES = [
  ['Coco', '', 'main', 'ココ', 'Rena Motomura',
   'La hija de una sastresa que siempre quiso ser bruja. En su primer hechizo convierte a su madre en piedra, y Qifrey la recoge como aprendiz en vez de borrarle la memoria porque es la unica pista que tiene para encontrar a los Sombrero de Ala.'],

  ['Qifrey', '', 'main', 'キーフリー', 'Natsuki Hanae',
   'El brujo del atelier, especialista en magia de agua. Lleva un ojo tapado porque de chico lo usaron de recipiente para un arbol de plata. Va buscando a los Sombrero de Ala desde entonces y no se detiene ante nada.'],

  ['Agott Arkrome', '', 'main', 'アガット・アークロム', 'Hibiku Yamamura',
   'La aprendiz de la familia Arkrome, que desprecia a Coco por despecho. Salio de la prueba de aprendiz con el rumor de que habia plagiado su magia, y lleva toda la serie intentando demostrar que se equivocaron.'],

  ['Tetia', '', 'main', 'テティア', 'Kurumi Haruki',
   'La mas alegre del grupo, que quiere hacer hechizos que hagan feliz a la gente y ser recordada por ello. Es la que trae el hechizo de nube que calma al dragon.'],

  ['Richeh', '', 'main', 'リチェリット', 'Hika Tsukishiro',
   'La que dibuja circulos diminutos y se niega a usar magia que no sea suya. Se cerro despues de que su hermano mayor dejara de aprender con ella, y el final de la temporada le devuelve las ganas.'],

  ['Olruggio', '', 'supporting', 'オルーギオ', 'Yuichi Nakamura',
   'El vigilante del atelier y amigo de la infancia de Qifrey. Tiene ojeras de no dormir y cara de cansado, pero fabrica objetos que hacen la vida mas comoda a los demas.'],

  ['Alaira', '', 'supporting', 'アライラ', 'Kotono Mitsuishi',
   'La bruja mayor que mejor conoce a Qifrey, y la que supervisa las pruebas de la cueva. Su objeto magico es una camilla que flota, hecha con el forro de su propia capa.'],

  ['Iguin', '', 'antagonist', 'イグイーン', 'Mitsuki Saiga',
   'El de mas alto rango de los Sombrero de Ala, con mascara con forma de ojo. Es quien le vendio a Coco el libro de magia que acabo con su madre, y lleva toda la serie siguiendo su crecimiento desde cerca.'],

  ['Sasaran', '', 'antagonist', 'ササラン', 'Ryūsei Nakao',
   'Un Sombrero de Ala que probo la magia de transformacion y salio con cara de gato. Para disimularlo teledirige una capa y un sombrero vacios, y por eso le llaman la bruja de la capa vacia.'],

  ['Custas', '', 'antagonist', 'クスタス', 'Toshiki Kumagai',
   'El músico al que Coco y Agott rescataron de una piedra, y al que le destrozaron las piernas. Lleva brotes de arbol de plata en las protesis, y por eso empieza a consumir a los que le importan.'],

  ['Dagda', '', 'supporting', 'ダグダ', 'Katsuyuki Konishi',
   'El cantante trashumante que pidio ayuda para rescatar su carro. Murio una vez y le devolvieron la vida con un tatuaje del tiempo, y al final se deja morir otra vez a proposito para salvar a Custas.'],

  ['Euini', '', 'supporting', 'ユイニィ', 'Hiiro Ishibashi',
   'El aprendiz nervioso al que Kukrow tiene por inutil. Los Sombrero de Ala le graban un sigilo en la piel y lo convierten en un lobo con escamas, y Richeh se empieza a implicarse en su problema.'],

  ['Tartah', '', 'supporting', 'タータ', 'Mutsumi Tamura',
   'El nieto de Nolnoa, que trabaja en la tienda de papeleria. Ve el mundo sin color por una enfermedad llamada silverwash, y Coco le ensña un hechizo que le compensa.'],

  ['Nolnoa', '', 'supporting', 'ノルノア', 'Yoshito Yasuhara',
   'El anciano que hace las plumas y las tintas magicas. Sabe mas de lo que dice, y Qifrey le borra la memoria para que no cuente lo del dragon.'],

  ['Coco no Haha', '', 'supporting', 'ココの母', 'Mayumi Saco',
   'La sastresa que llevo sola el taller tras morir su marido. Es la primera victima del hechizo de Coco y la razon de que la protagonista entre en el mundo de la magia.'],

  ['Fudemushi', '', 'supporting', 'フデムシ', 'Misaki Kuno',
   'Una bichera blanca y peluda que se pega a Coco durante la prueba por el olor de las tintas. Vive en el atelier y se le intuye una inteligencia parecida a la de una persona.'],

  ['Easthies', '', 'antagonist', 'イースヒース', 'Junichi Suwabe',
   'El capitan de campo de los Caballeros Magos, el cuerpo de seguridad de la Gran Aula. Cree ver magia prohibida donde solo hay un accidente, y por eso acaba deteniendo a una niña.'],

  ['Luluci', '', 'antagonist', 'ルルシィ', 'Yui Ishikawa',
   'La miembro mas medida de los Caballeros Magos. Se uno por un abuso que nadie tomo en serio, y por eso es la unica que no aplica la ley sin mirar a quien tiene delante.'],

  ['Riliphin', '', 'antagonist', 'リリフィン', 'Mariya Ise',
   'El hermano mayor de Richeh y ayudante de Beldaruit. Los separaron cuando ella empezo a dibujar magia propia, y no vuelven a verse hasta la crisis del final.'],

  ['Kukrow', '', 'antagonist', 'クックロウ', 'Hiroshi Yanaka',
   'El brujo despreocupado e irresponsable que fue maestro de Euini. Le da igual lo que le pase al chico mientras no le toque trabajar a el.'],

  ['Utowin', '', 'antagonist', 'ウトウィン', 'Jun Kasama',
   'Miembro de los Caballeros Moralis a las ordenes directas de Easthies. Sale con el cuerpo cuando toca hacer cumplir las reglas de la Gran Aula.'],

  ['Galga', '', 'antagonist', 'ガルガ', 'Hiroki Yasumoto',
   'Brujo de los Caballeros Moralis, alto y de complexion fuerte. Sale con el cuerpo cuando toca perseguir a quien abusa de la magia.'],

  ['Richeh no Sensei', '', 'supporting', 'リチェの先生', 'Youji Ueda',
   'El maestro de Richeh. Hombre serio de pocas palabras al que su alumna respeta, y que aparece cuando el pasado de Richeh vuelve a escena.'],
];
