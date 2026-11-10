// PERSONAJES - Ghost in the Shell
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (43): Motoko, Batou y Togusa son MAIN; el resto
// va como SUPPORTING.
//
// Correcciones documentadas:
// - Los dos recolectores de basura que AniList atribuye a Hiroshi Naka
//   y Shigeru Chiba son, según la Wikipedia japonesa, Kazuhiro Yamaji
//   y Shigeru Chiba. Hiroshi Naka es Ishikawa. Se unifican en una sola
//   ficha porque no tienen nombre propio.
// - Mizuho Daita (Mitsuru Miyamoto) aparece en los créditos de la
//   Wikipedia japonesa, pero AniList no lo lista y no se ha podido
//   confirmar su papel; se deja fuera antes que inventarlo.
// - La Wikipedia japonesa llama 検死官 al forense; AniList lo llama
//   鑑識官 (Kanshiki-kan), con la misma voz, Hiroshi Yanaka. Se usa el
//   kanji de AniList para que el enlazador encuentre su imagen.
// Las descripciones son propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Motoko Kusanagi', TODAS, 'main', '草薙素子', 'Atsuko Tanaka (Maaya Sakamoto en su versión joven)',
   'La mayor de la Sección 9. Su cuerpo es casi completamente cibernético y su mente está conectada a la red. Es fría, eficaz y empieza a preguntarse si su conciencia sigue siendo humana.'],

  ['Batou', TODAS, 'main', 'バトー', 'Akio Ootsuka',
   'El segundo de Motoko y el miembro más humano del equipo. Tiene un cuerpo cibernético parcial y una personalidad directa y leal. Su amistad con Motoko y su desconfianza hacia los políticos lo convierten en su ancla emocional.'],

  ['Togusa', TODAS, 'main', 'トグサ', 'Kouichi Yamadera',
   'El único miembro de la Sección 9 que conserva casi todo su cuerpo original. Es un detective metódico y un padre de familia. Su mirada humana contrasta con la frialdad tecnológica de sus compañeros.'],

  ['Ishikawa', TODAS, 'supporting', 'イシカワ', 'Yutaka Nakano',
   'El especialista en informática de la Sección 9. Se encarga de rastrear las huellas digitales del Puppet Master y de proteger la red del equipo. Su experiencia es clave para descubrir la verdadera naturaleza del enemigo.'],

  ['Daisuke Aramaki', TODAS, 'supporting', '荒巻大輔', 'Tamio Ooki',
   'El jefe de la Sección 9. Es un veterano estratega que protege a su equipo de las presiones políticas. Su calma y su autoridad sostienen la unidad en los momentos más delicados.'],

  ['Puppet Master', TODAS, 'supporting', '人形使い', 'Iemasa Kayumi',
   'Una entidad creada por el Proyecto 2501 que ha adquirido conciencia propia. Habita en la red y busca un cuerpo para sobrevivir. Su existencia pone en duda la frontera entre una persona y un programa.'],

  ['Nakamura', TODAS, 'supporting', '中村部長', 'Tesshou Genda',
   'El jefe de la Sección 6, rival de Aramaki. Intenta quedarse con el control del caso y ocultar los secretos del gobierno. Su ambición política lo enfrenta directamente con la Sección 9.'],

  ['Ministro de Asuntos Exteriores', TODAS, 'supporting', '外務大臣', 'Masato Yamanouchi',
   'El responsable de la diplomacia del país. Está implicado en el encubrimiento del Proyecto 2501 y presiona para que la Sección 9 abandone la investigación. Representa la cara corrupta del poder.'],

  ['Recolectores de basura', TODAS, 'supporting', '清掃局員', 'Kazuhiro Yamaji y Shigeru Chiba',
   'Dos operarios del servicio de limpieza que encuentran el cuerpo de una mujer abandonado entre la basura. Su descubrimiento pone a la Sección 9 sobre la pista del Puppet Master. Uno de ellos es detenido y su mente es hackeada.'],

  ['Dr. Willis', TODAS, 'supporting', 'ウィリス博士', 'Masakazu Namaki',
   'Un científico que colabora con la Sección 6 en el análisis del Puppet Master. Conoce los detalles del proyecto y sufre las consecuencias de los experimentos. Su papel muestra hasta dónde llega la manipulación del gobierno.'],

  ['Forense', TODAS, 'supporting', '鑑識官', 'Hiroshi Yanaka',
   'El forense que examina los cuerpos relacionados con el caso. Aporta datos técnicos sobre la naturaleza artificial de la víctima y sobre la tecnología implicada.'],

  ['Asesino', TODAS, 'supporting', '実行犯', 'Takashi Matsuyama',
   'El ejecutor que sigue las órdenes de los responsables del proyecto. Su intervención demuestra que el conflicto no solo se libra en la red, sino también en las calles.'],

  ['Diplomático', TODAS, 'supporting', '外交官', 'Shinji Ogawa',
   'El diplomático al que la Sección 9 elimina al principio de la película para impedir una deserción. Su muerte abre la historia y muestra hasta dónde llega el trabajo sucio del gobierno.'],
];
