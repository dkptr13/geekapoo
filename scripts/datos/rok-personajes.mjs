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
];
