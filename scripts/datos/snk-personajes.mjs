// PERSONAJES - Saekano: How to Raise a Boring Girlfriend
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Trece, que son los que AniList lista para alguna de las tres obras y
// la wiki en japones da con voz.
//
// ── LOS SEIYUU ────────────────────────────────────────────────────
//
// De la seccion de personajes de la wiki en japones, que los da en
// prosa con el nombre en su linea y el seiyuu en la siguiente.
//
// Esa pagina escribe el nombre del personaje con el apellido y el
// nombre de pila separados por un espacio ("安芸 倫也") y el extractor
// que se usaba antes no lo aceptaba, de modo que se quedaba fuera medio
// reparto sin decir nada. Ahora se quitan los espacios antes de
// comparar.
//
// Dos cosas que cambian el resultado:
//
//   · Los dos hermanos Hashima y el resto de personajes con espacio
//     salen ahora que ya no se les rechaza el espacio.
//
//   · 澤村・スペンサー・英梨々 tiene trece caracteres y con el limite
//     que tenia el extractor se caia. El limite son diez.
//
// ── LAS TEMPORADAS ────────────────────────────────────────────────
//
// De la lista de personajes de cada uno de los tres titulos de AniList.
// Nueve de los trece salen en las tres obras.
//
// Keiichi Kato es de la primera temporada y nada mas: no aparece ni en
// la segunda ni en la pelicula, y no es un descuido sino que el
// personaje no tiene nada que hacer despues de la graduacion.
//
// Akane Kousaka llega en la segunda y sigue en la pelicula.
//
// ── EL NOMBRE JAPONES ─────────────────────────────────────────────
//
// Va el de AniList y no el de la wiki, porque el emparejador de imagenes
// compara contra AniList. Solo se diferencian en Michiru Hyoudou, que
// AniList escribe con un espacio en medio, 氷堂 美智留, y la wiki sin
// él.
//
// ── LOS QUE NO ESTAN Y POR QUE ────────────────────────────────────
//
// La wiki da quince con voz. Faltan:
//
//   · 上郷喜彦, el mismo Tomoya pero con dieciocho años y la voz de
//     otro actor. Es un chiste de una pagina y sale una vez.
//   · 澤村小百合, la madre de Eriri.
//
// Los dos se quedan fuera porque AniList no los lista en ninguna de las
// tres obras, y sin AniList no hay ni imagen ni temporadas con las que
// saber en cual salian. Meterlos con la temporada a ojo seria inventar
// el dato.

export const PERSONAJES = [
  ['Tomoya Aki', '', 'main', '安芸倫也', 'Yoshitsugu Matsuoka',
    'El prota. Hace el computer bien y no sabe hacer nada mas, y el problema no es que no sepa hablar con las chicas sino que no tiene de que hablar. Es el delegado de su clase y representa a una. Lo que no sabe nadie es que tambien dibuja, en un tipo de material que nunca reconoceria como suyo porque no le permitiria tocarse.'],
  ['Megumi Katou', '', 'main', '加藤恵', 'Kino Aya',
    'La que deberia ser la protagonista y no llega a serlo nunca. Guapa de una manera que se le pasa por alto, y es justo por eso que Tomoya no sabe decir quien es cuando la ve. Es la unica de las cinco que no compite y la unica que de verdad no se da cuenta de que compite, y por eso es la unica con la que tiene una relacion llana.'],
  ['Eriri Sawamura', '', 'main', '澤村・スペンサー・英梨々', 'Saori Ōnishi',
    'Hija de un ingles y una japonesa, compañera de toda la vida y la mejor dibujante de la clase por fuera. Por dentro es una ilustradora que trabaja con el nombre de otra persona y que nunca habia dicho que vendia de mas porque si. Es la que mas frio esta y la que peor lo lleva.'],
  ['Utaha Kasumigaoka', '', 'main', '霞ヶ丘詩羽', 'Ai Kayano',
    'La que mas cosas dice de si misma y la que mas se equivoca. Es la que escribe el guion del proyecto del otro y la que usa ese mismo proyecto como arma sin darse cuenta de que lo esta haciendo. Es la unica de las cinco que se va de casa, y lo hace en el ultimo capitulo de la primera temporada.'],
  ['Izumi Hashima', '', 'main', '波島出海', 'Chika Akasaki',
    'Del trio de la infancia y la que menos misterio tiene de las tres. Dice lo que piensa en el momento en que lo piensa, que es justo lo contrario de lo que hacen las otras, y por eso es la que mas veces le dice a Tomoya la verdad.'],
  ['Michiru Hyoudou', '', 'main', '氷堂 美智留', 'Sayuri Yagishita',
    'La rival de fuera del instituto: misma edad, otra escuela, y un grupo de musica al que pertenece. Es la unica de las candidatas que llega con vida hecha, y el capitulo suyo es el que explica por que el grupo del prota no es solo el grupo del prota.'],
  ['Iori Hashima', '', 'supporting', '波島伊織', 'Tetsuya Kakihara',
    'Del trio de la infancia y el que dirige el circulo de los que quieren a Eriri. Es el que se le planta enfrente sin ninguna mala idea, y es el que hace que la escena en la que Eriri elige no se note como lo que es.'],
  ['Akane Kousaka', '2,3', 'supporting', '紅坂朱音', 'Hitomi Nabatame',
    'No sale hasta la segunda temporada y es la unica de las que llega con un nombre profesional detras. Se fundo un circulo en la universidad y ahora firma libros que se adaptan a anime, y su funcion en la historia es la de poner a Tomoya delante de alguien que de verdad sabe lo que hace.'],
  ['Keiichi Kato', '1', 'supporting', '加藤圭一', 'Sōma Saitō',
    'El primo de Megumi y el unico pariente que sale en pantalla. Es de ultimo de carrera y representa justo lo contrario de Tomoya: tiene los pasos contados y no se muere de ganas de ninguna de las cosas de las que el prota se muere. Solo sale en la primera temporada.'],
  ['Sonoko Machida', '', 'supporting', '町田苑子', 'Noriko Nanōjō',
    'La editora de la novela que hay detras de todo esto. No sale en las escenas del instituto sino en las del mundo que el instituto no sabe que existe, y es la unica que sabe las dos cosas a la vez.'],
  ['Tokino Himekawa', '', 'supporting', '姫川時乃', 'Eri Suzuki',
    'Guitarra de un grupo de musica que se monta a mitad de la serie. Es la que mas pequena se queda de las que entran tarde y la primera que dice en voz alta algo que las demas piensan.'],
  ['Echika Mizuhara', '', 'supporting', '水原叡智佳', 'Rui Tanabe',
    'Bajo en el mismo grupo. Es la que lleva la conversacion cuando hay que hablar con alguien nuevo, y la que mas veces se equivoca hablando.'],
  ['Ranko Morioka', '', 'supporting', '森丘藍子', 'Yō Aoki',
    'Bateria del mismo grupo y la unica que no habla mucho. Es la que aparece cuando hace falta alguien que mire la escena desde fuera, y por eso esta en mas capitulos de los que parece.'],
];