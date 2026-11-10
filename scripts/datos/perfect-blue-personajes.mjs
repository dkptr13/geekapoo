// PERSONAJES - Perfect Blue
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (437), con dos ajustes documentados:
// Mamoru Uchida (Me-Mania) es MAIN en la Wikipedia inglesa y aquí va
// como main; Rumi también es main en la Wikipedia y no solo supporting.
// Se dejan fuera los BACKGROUND (Eri Ochiai, el director del anuncio,
// Yada y los demás), que no son necesarios para entender la película.
//
// AniList llama Takashi a Tadashi Doi; la Wikipedia inglesa y el
// kanji 土居正 dan Tadashi. Se sigue la fuente inglesa. En Uchida,
// AniList solo guarda el apellido (内田), así que el kanji se deja como
// lo tiene AniList para que el enlazador encuentre su imagen; el nombre
// completo, Mamoru Uchida, va en la ficha. Las descripciones son
// propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Mima Kirigoe', TODAS, 'main', '霧越未麻', 'Junko Iwao',
   'La protagonista. Es la cantante más popular del trío Cham y decide dejar la música para dedicarse a la actuación. La presión de sus seguidores, los papeles cada vez más duros y las apariciones de su doble la van hundiendo en una crisis de identidad.'],

  ['Rumi Hidaka', TODAS, 'main', '日高ルミ', 'Rica Matsumoto',
   'La mánager de Cham y antigua cantante. Protege a Mima como si fuera su hermana pequeña y desconfía de su cambio de carrera. Su pasado y su obsesión por la imagen de Mima la llevan a un desenlace trágico.'],

  ['Mamoru Uchida (Me-Mania)', TODAS, 'main', '内田', 'Masaaki Ookura',
   'Un seguidor obsesionado con Mima. No acepta que haya dejado de ser la cantante de Cham y se siente traicionado por su nuevo trabajo. Su presencia amenazante y su diario en internet convierten la vida de Mima en una pesadilla.'],

  ['Tejima', TODAS, 'supporting', '手嶋', 'Yousuke Akimoto',
   'Un miembro del equipo de producción de la serie que graba Mima. Participa en la selección del reparto y en las decisiones sobre las escenas más duras. Su papel muestra la frialdad de la industria ante el desgaste de la actriz.'],

  ['Takao Shibuya', TODAS, 'supporting', '渋谷貴雄', 'Yoku Shioya',
   'El productor de la serie. Defiende un drama adulto y polémico, y presiona para que Mima acepte las escenas que rompen su imagen de cantante. Representa la cara comercial de la industria.'],

  ['Kenichi Sakuragi', TODAS, 'supporting', '桜木健一', 'Hideyuki Hori',
   'El director de la serie. Quiere que Mima se entregue al papel y no mide el efecto que la ficción tiene sobre ella. Su método de trabajo alimenta la confusión entre la actriz y el personaje.'],

  ['Murano', TODAS, 'supporting', '村野', 'Masashi Ebara',
   'Un fotógrafo que trabaja con Mima y que intenta convencerla de posar desnuda. Su muerte desata una de las investigaciones y alimenta la confusión de la protagonista.'],

  ['Tadokoro', TODAS, 'supporting', '田所', 'Shinpachi Tsuji',
   'El representante de la agencia de Mima. Acepta el cambio de carrera y busca papeles que la consoliden como actriz, aunque no siempre mide las consecuencias. Su ambición choca con la fragilidad de Mima.'],

  ['Yukiko', TODAS, 'supporting', '雪子', 'Emiko Furukawa',
   'Una de las compañeras de Mima en Cham. Sigue en el grupo después de su marcha y sufre la presión de mantener el éxito sin su voz principal. Su relación con Mima se enfría con la distancia.'],

  ['Rei', TODAS, 'supporting', 'レイ', 'Shiho Niiyama',
   'Otra integrante de Cham. Acompaña a Mima en sus primeros pasos como actriz y luego ve cómo la fama y el acoso cambian a su amiga. Su mirada inocente contrasta con la dureza del entorno.'],

  ['Tadashi Doi', TODAS, 'supporting', '土居正', 'Akio Suyama',
   'Un fotógrafo que trabaja en la campaña de imagen de Mima. Capta su transformación con una mezcla de admiración y morbo. Sus imágenes alimentan la obsesión de los seguidores.'],
];
