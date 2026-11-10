// PERSONAJES - Tokyo Godfathers
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (759), con estos ajustes documentados:
// AniList llama Mitsuo al novio que la Wikipedia inglesa llama Arao;
// Akiko Takeguchi no es un personaje, es una actriz de voces
// adicionales; y el padre de Miyuki no se llama Ishida, es el policía
// que lleva el caso. Se añaden los vecinos y el anciano que AniList
// lista como SUPPORTING. Las descripciones son propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Gin', TODAS, 'main', 'ギン', 'Toru Emori',
   'Un hombre maduro que vive en la calle y que fue ciclista profesional. Encuentra a la niña junto a sus compañeros y se convierte en el líder improvisado del grupo. Su pasado incluye una familia a la que abandonó y una hija a la que no ha vuelto a ver.'],

  ['Hana', TODAS, 'main', 'ハナ', 'Yoshiaki Umegaki',
   'Una mujer trans que vive con Gin y Miyuki. Es la más entusiasta con la idea de cuidar a la niña y la trata como si fuera su madre. Su pasado como cantante y su deseo de formar una familia explican su entrega.'],

  ['Miyuki', TODAS, 'main', 'ミユキ', 'Aya Okamoto',
   'Una adolescente que se escapó de casa y vive en la calle con Gin y Hana. Al principio rechaza a la niña, pero termina encariñándose con ella. Su relación con su padre es una de las heridas que el viaje pone al descubierto.'],

  ['Kiyoko', TODAS, 'main', '清子', 'Satomi Koorogi',
   'La recién nacida que los tres protagonistas encuentran en la basura la Nochebuena. Su nombre viene de la noche en que fue encontrada. Apenas llora, pero su presencia cambia la vida de quienes la cuidan.'],

  ['Sachiko', TODAS, 'supporting', '幸子', 'Kyouko Terase',
   'La mujer que dice ser la madre de Kiyoko. En realidad perdió a su propio bebé y secuestró a la niña en el hospital. Su miedo y su desesperación la llevan a huir con ella y a poner en peligro a todos.'],

  ['Kiyoko, la hija de Gin', TODAS, 'supporting', 'ギンの娘', 'Mamiko Noto',
   'La hija de Gin, a la que dejó de ver tras abandonar su familia. Trabaja como enfermera y está a punto de casarse. Su reencuentro con Gin cierra una de las historias personales del grupo.'],

  ['El médico', TODAS, 'supporting', '医者', 'Akio Ootsuka',
   'El médico que atiende a Hana cuando se pone enferma durante la búsqueda. Le advierte de que su salud es frágil y la obliga a descansar. Al final se descubre que es el prometido de la hija de Gin.'],

  ['Oota', TODAS, 'supporting', '太田', 'Shouzou Iizuka',
   'Un jefe de la yakuza al que los protagonistas salvan de morir aplastado por su coche. En agradecimiento los invita a la boda de su hija, una celebración que acaba en un tiroteo. Su figura mezcla el peligro y la generosidad.'],

  ['Mamá', TODAS, 'supporting', '母さん', 'Seizou Katou',
   'La dueña del bar donde trabajaba Hana. La recibe con cariño cuando vuelve a buscarla y le recuerda que siempre tiene un lugar con ella. Su comprensión ayuda a Hana a reconciliarse con su pasado.'],

  ['Yasuo', TODAS, 'supporting', '泰男', 'Hiroya Ishimaru',
   'El marido de Sachiko. Es un hombre irresponsable y adicto al juego que abandonó a la niña en la basura. Su cobardía y su arrepentimiento cierran el retrato de la familia que rodea a la recién nacida.'],

  ['Kurumizawa', TODAS, 'supporting', '胡桃沢', 'Inuko Inuyama',
   'Un vecino de la casa donde vivían Sachiko y Yasuo. Su testimonio ayuda a los protagonistas a reconstruir la historia de la niña y a encontrar a la pareja.'],

  ['Yamanouchi', TODAS, 'supporting', '山之内', 'Kanako Yahara',
   'Una vecina del mismo edificio que Sachiko y Yasuo. Aporta información sobre la pareja y sobre la niña desaparecida.'],

  ['Neko Baba', TODAS, 'supporting', '猫ババ', 'Rie Shibata',
   'Una mujer que vive en la calle y que se dedica a recoger gatos. Conoce a Hana y a los demás y les ofrece información sobre la niña. Su apodo significa algo así como la vieja de los gatos.'],

  ['Taxista', TODAS, 'supporting', 'タクシー運転手', 'Kouichi Yamadera',
   'Un taxista que se cruza varias veces con los protagonistas. Les cobra una carrera, los mete en una persecución y acaba siendo testigo de sus desventuras. Su mala suerte es uno de los alivios cómicos de la película.'],

  ['Vagabundo anciano', TODAS, 'supporting', '老人', 'Ryuuji Saikachi',
   'Un anciano sin hogar al que Gin encuentra moribundo en la calle. Antes de morir le entrega sus escasas pertenencias, entre ellas una pista que cambiará la suerte del grupo.'],

  ['Arao', TODAS, 'supporting', '新郎', 'Rikiya Koyama',
   'El novio de la hija de Oota. Es un antiguo yakuza que en el pasado cobraba deudas a Gin. Durante la boda recibe un disparo al proteger a Oota.'],

  ['Padre de Miyuki', TODAS, 'supporting', 'ミユキの父', 'Yuusaku Yara',
   'El padre de Miyuki. Es policía y está al cargo de la investigación por la desaparición de la niña. Busca a su hija desde que ella se marchó de casa y la reencuentra en el hospital.'],
];
