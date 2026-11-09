// PERSONAJES - Puedo escuchar el mar
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (743): Rikako, Taku y Yutaka son MAIN; los
// compañeros y la familia van como SUPPORTING.
//
// Se dejan fuera los cuatro BACKGROUND de AniList (director, dueña,
// Kawamura y aprendiz), que no forman parte del reparto acreditado.
// Nombres, kanji y seiyuus vienen de AniList. Las descripciones son
// propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Rikako Muto', TODAS, 'main', '武藤里伽子', 'Youko Sakamoto',
   'Una chica de Tokio que se muda a Kochi con su madre después de la separación de sus padres. Es guapa, orgullosa y distante, y su forma de marcar límites la hace parecer antipática. Debajo de esa coraza hay una adolescente que echa de menos su vida anterior.'],

  ['Taku Morisaki', TODAS, 'main', '杜崎拓', 'Nobuo Tobita',
   'El protagonista. Es un estudiante tranquilo que trabaja en un restaurante para pagarse el viaje de fin de curso y que discute con los profesores cuando intentan cancelarlo. Se siente atraído por Rikako, pero intenta no traicionar a su amigo Yutaka.'],

  ['Yutaka Matsuno', TODAS, 'main', '松野豊', 'Toshihiko Seki',
   'El mejor amigo de Taku y presidente de clase. Es sociable y responsable, y se enamora de Rikako desde el primer día. Su manera de quererla es más idealizada que real, y eso acaba afectando a la amistad con Taku.'],

  ['Akiko Shimizu', TODAS, 'supporting', '清水明子', 'Yuri Amano',
   'La presidenta del consejo estudiantil. Intenta que Rikako participe en las actividades del grupo y no se aisle, aunque sus buenas intenciones chocan con el carácter reservado de la nueva alumna.'],

  ['Yumi Kohama', TODAS, 'supporting', '小浜裕実', 'Kae Araki',
   'La mejor amiga de Rikako en Kochi. Viene de una familia estricta y es la persona con la que Rikako se permite hablar de chicos y de Tokio. Su lealtad se pone a prueba cuando Rikako decide marcharse sin avisar.'],

  ['Tadashi Yamao', TODAS, 'supporting', '山尾忠志', 'Hikaru Midorikawa',
   'Un compañero de Taku que está enamorado de Yumi. En la reunión de antiguos alumnos se arma de valor para confesarlo delante de todos, aunque el alcohol y los nervios le juegan una mala pasada.'],

  ['Okada', TODAS, 'supporting', '岡田', 'Junichi Kanemaru',
   'El antiguo novio de Rikako en Tokio. Cuando ella vuelve a verlo, descubre que no es la persona idealizada que recordaba y que ya sale con otra amiga suya. Su encuentro marca el final de una etapa para Rikako.'],

  ['Padre de Rikako', TODAS, 'supporting', '里伽子の父', 'Kinryuu Arimoto',
   'El padre de Rikako, que vive solo en Tokio después de separarse de su mujer. Recibe a su hija con cariño torpe y le deja claro que su vida allí ya no tiene sitio para ella como antes.'],

  ['Madre de Taku', TODAS, 'supporting', '杜崎拓の母', 'Ai Satou',
   'La madre de Taku. Aparece en las escenas familiares y conoce bien el carácter de su hijo; su presencia discreta ayuda a mostrar la vida cotidiana de la familia Morisaki.'],
];
