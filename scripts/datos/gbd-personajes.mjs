// PERSONAJES - Grand Blue
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Diecisiete. El reparto de la wiki en japones da veintiocho nombres con
// voz, y la lista de AniList da treinta y seis en total contando los que
// solo salen de fondo. Aqui va la parte con voz comprobada, sin el relleno
// 
//
// ── LOS SEIYUU ────────────────────────────────────────────────────
//
// De la seccion de reparto de la wiki en japones. La pagina viene con
// dos voces por personaje, porque Grand Blue tiene pelicula en vivo:
// la primera es la del anime y la segunda, la que va detras de "演 -",
// es la del actor. Aqui va solo la primera.
//
// La lista de reparto de Anime News Network para la segunda temporada
// confirma las principales: Yuma Uchida, Ryōhei Kimura, Chika Anzai,
// Hiroki Yasumoto, Katsuyuki Konishi, Maaya Uchida, Toa Yukinari,
// Kana Asumi, Takuya Eguchi, Junya Enoki, Natsuki Hanae, Robert Waterman,
// Jun Fukuyama, Shinji Kawada y Nana Mizuki.
//
// ── LAS TEMPORADAS ────────────────────────────────────────────────
//
// De la lista de personajes de cada uno de los tres titulos de AniList.
// Ojo con el reparto: las temporadas 1, 2 y 3 del catalogo son la de
// 2018, la de 2025 y la de 2026, pero AniList tiene una cuarta entrada
// mas, "Season 4", sin fecha y sin un solo capitulo emitido. Alguien que
// lea la lista de AniList tiene que descontar esa cuarta antes de
// contar.
//
// Los personajes con temporada vacia salen en las tres. El resto, en las
// que hace falta:
//
//   · Sakurako, Shiori y Naomi son nuevos de la segunda temporada. Lo
//     confirma el anuncio de produccion de febrero de 2025, que los
//     presenta como reparto nuevo.
//   · Rie sale en la primera y en la tercera, pero no en la segunda.
//   · Iida, Suzuki y Kamio solo salen en la primera, y son las tres
//     compañeras de Aina en la universidad femenina.
//   · Sayaka e Ikegoshi son de la tercera, que es el viaje.
//
// ── EL NOMBRE JAPONES ─────────────────────────────────────────────
//
// Va el de AniList y no el de la wiki cuando los dos no coinciden, porque
// el emparejador de imagenes compara contra AniList. Las diferencias son
// de grafia: el wiki pone 古手川華 donde AniList pone 古手川奈々華, y 山本
// 真一郎 donde la wikipedia inglesa pone 山本信一郎.

export const PERSONAJES = [
  ['Iori Kitahara', '', 'main', '北原伊織', 'Yuma Uchida',
    'El protagonista. Va a Izu a hacer la universidad y se instala en la tienda de buceo de su tio, que es tambien la casa de sus dos primas. Lo que queria era una vida tranquila y lo que encontro es el club de buceo. Es el unico del grupo que se despierta con cargo de conciencia y sigue yendo igual, y ese es el conflicto que dura las tres temporadas.'],

  ['Chisa Kotegawa', '', 'main', '古手川千紗', 'Chika Anzai',
    'La prima de Iori y su compañera de clase en la universidad de Izu. Es la que mas se controla de todo el grupo y la que esta mas entregada al buceo: lleva desde el primero el carnet que Iori consigue en el capitulo diez de la primera temporada. Tambien es la que mas aguanta el equilibriumo imposible de esta casa.'],

  ['Nanaka Kotegawa', '', 'main', '古手川奈々華', 'Maaya Uchida',
    'La hermana mayor de Chisa y la instructora de buceo del club. Aparece poco y casi nunca habla, pero se le ve la fuerza fisica cuando perceives que alguien amenaza lo que tiene que ver con Chisa, y eso basta para que el capitulo cambie de tono.'],

  ['Aina Yoshiwara', '', 'main', '吉原愛菜', 'Kana Asumi',
    'Estudiante de primero en la Universidad femenina de Oumi y la razon por la que el grupo de Iori se junta. Antes de la serie la estaban molestando en su club de tenis; se meta en el club de buceo despues de que Iori y Kohei la defendieran. Es la unica que llega a los treinta y seis capitulos sin hacer un solo chiste, y por eso funciona el resto.'],

  ['Kōhei Imamura', '', 'main', '今村耕平', 'Ryōhei Kimura',
    'El compañero de clase de Iori y el otro que entro al grupo con el. Es el que aporta lo unico que le hacia falta a la pandilla: alguien que aun no este metido en todo. Cuando Iori hace una de las suyas, casi siempre es Kohei el que tiene que arreglarlo.'],

  ['Azusa Hamaoka', '', 'supporting', '浜岡梓', 'Toa Yukinari',
    'Compañera de clase en Izu y del grupo desde el principio. Es de las pocas que tienen un nombre de una sola pieza en el catalogo, y tambien de las pocas que no participate en los comandos de Iori mas que para decirles que no.'],

  ['Shinji Tokita', '', 'supporting', '時田信治', 'Hiroki Yasumoto',
    'El de mas edad del grupo, el que convenció a Iori de que se apuntara al club. Explica su propia asistencia a clase en uno de los mejores capitulos de la primera temporada, y es el tipo de momento que esta serie suelta sin avisar y luego no vuelve a tocar.'],

  ['Ryūjirō Kotobuki', '', 'supporting', '寿竜次郎', 'Katsuyuki Konishi',
    'El otro de los mayores del club, del mismo departamento que Iori. Es el que mas se parece a como sera Iori dentro de diez años y por eso su linea es la que mas se juega en la ultima temporada.'],

  ['Toshio Kotegawa', '2,3', 'supporting', '古手川登志夫', 'Shinji Kawada',
    'El tio de Iori y el dueño de la tienda Grand Blue. Padre de Chisa y Nanaka. Es el que sostiene la casa de tres maneras: pagando las facturas, manteniéndolo abierto de noche y no diciendo nunca lo que ocurre.'],

  ['Captain Kudō', '2,3', 'antagonist', '工藤会長', 'Jun Fukuyama',
    'Capitan del club de tenis   y el guapo de manual de la universidad. Iori y Kohei le humillan en publico por como trata a Aina, y ese episodio es el que cambia la relacion entre los dos grupos de la serie.'],

  ['Kaya Mizuki', '2,3', 'supporting', '水樹カヤ', 'Nana Mizuki',
    'La que lleva el nombre de la cantante que la voices. Es uno de los detalles de los que esta serie presume sin decir que los presume. Aparece en la segunda y la tercera temporada y tiene la funcion de testigo: cuenta lo que ve y no lo juzga.'],

  ['Hajime Nojima', '2,3', 'supporting', '野島元', 'Takuya Eguchi',
    'Compañero de clase en Izu y el que se las da de seductor sin que nadie se lo crea. Se le ve en el capitulo en el que Iori lo visteversa y lo arruina como parte del festival de la universidad femenina.'],

  ['Shinichirō Yamamoto', '2,3', 'supporting', '山本真一郎', 'Junya Enoki',
    'El otro que lo dice todo sin filtro, y por eso sus compańeros le ven como el candidato eterno a soltero. Su nombre sale en el titulo de un capitulo de la tercera temporada, en el que la serie le pone una situacion de la que solo se salva con paciencia.'],

  ['Yū Mitarai', '2,3', 'supporting', '御手洗優', 'Natsuki Hanae',
    'El unico del grupo que tiene pareja, y le va peor por eso: sus amigos se pasan dos capitulos intentando romperlos. Lo que se ve es a Rie pegándole, y a el aceptandolo con una reserva que no explica en ningun momento.'],

  ['Kenta Fujiwara', '2,3', 'supporting', '藤原健太', 'Robert Waterman',
    'El mas corpulento y el mas sensato del grupo, y tambien el que la serie borroja a proposito: cuando la trama tiene que mirar a otro sitio, Kenta desaparece de la escena sin decir nada.'],

  ['Sakurako Busujima', '2,3', 'supporting', '毒島桜子', 'Aya Yamane',
    'Estudiante de la Universidad femenina de Oumi, nueva en la segunda temporada. Esta pendiente del aspecto, tanto el suyo como el de los demas, y es la rival de Aina sin que ninguna de las dos llegue a decirlo. Es el personaje que mas gente recuerda de las ultimas temporadas.'],

  ['Shiori Kitahara', '2,3', 'supporting', '北原栞', 'Sumire Morohoshi',
    'La hermana menor de Iori, de tercero de secundaria y con mania por el kimono. Finge querer a su hermano mientras trabaja por debajo para que se haga cargo del ryokan de la familia y ella pueda librarse de las exigencias de sus padres. Es la razon de que la temporada dos empiece con una carta.'],
  ['Rie Oohashi', '1,3', 'supporting', '大橋りえ', 'Saki Yamakita',
   'Novia de Mitarai, a la que se ve pegandole cuando los amigos intentan romperlos. Tranquila entre tanto grito. Sale en la primera y la tercera.'],

  ['Kanako Iida', '1', 'supporting', '飯田かなこ', 'Yuuko Gibu',
   'Amiga de Aina de la universidad femenina. Sale solo en la primera, con el grupo de las chicas.'],

  ['Keiko Suzuki', '1', 'supporting', '鈴木恵子', 'Ai Kayano',
   'Amiga de Aina de la universidad femenina. Sale solo en la primera, con el grupo de las chicas.'],

  ['Kiyoko Kamio', '1', 'supporting', '神尾清子', 'Yuka Iguchi',
   'Amiga de Aina de la universidad femenina. Sale solo en la primera, con el grupo de las chicas.'],

  ['Kitahara Chichi', '3', 'supporting', '北原父', 'Naoya Uchida',
   'Padre de Iori y Shiori. Aparece en la tercera cuando la familia entra en escena.'],

  ['Kitahara Haha', '3', 'supporting', '北原母', 'Maaya Uchida',
   'Madre de Iori y Shiori. Aparece en la tercera cuando la familia entra en escena.'],

  ['Naomi Otoya', '2,3', 'supporting', '乙矢尚海', 'Yoshino Aoyama',
   'Estudiante de instituto al que le encanta el buceo. Capitan del club de su centro y compañero de faenas de Iori y Sakurako. Sale en la segunda y la tercera.'],

  ['Ushironomiya', '2,3', 'supporting', '右代宮', 'Takehito Koyasu',
   'Profesor asociado de la universidad de Izu. Sale en la segunda y la tercera, del lado de los adultos.'],

  ['Yuuichi Ikegoshi', '3', 'supporting', '池越雄一', 'Ryouhei Kimura',
   'Idol del grupo SIPS y presentador del programa de la tele en Palaos. Se parece tanto a Kohei que este lo sustituye cuando se lesiona. Sale solo en la tercera.'],
];