// PERSONAJES - DanMachi
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Nombres, kanji y voces de AniList (ids 20920 y busquedas por
// personaje), comprobados uno por uno. La voz de Lili es Maaya
// Uchida (no Risa Taneda, que es Riveria); la de Syr es Shizuka
// Ishigami (verificado en BTVA, MAL y la wiki de DanMachi).
//
// Temporadas: el nucleo sale en las cinco; Haruhime y Aisha entran
// en la segunda; Wiene es solo de la tercera; Kasandra y Dafne, de
// la segunda y la cuarta.

export const PERSONAJES = [
  ['Bell Cranel', '1,2,3,4,5', 'main', 'ベル・クラネル', 'Yoshitsugu Matsuoka',
   'Chico de campo de catorce anos que llega a Orario buscando fortuna y acaba en la familia recien creada de Hestia. Admira a Ais hasta la obsesion y su habilidad crece a un ritmo imposible cada vez que siente algo con fuerza. Es el conejo blanco al que media ciudad quiere cazar o proteger.'],

  ['Hestia', '1,2,3,4,5', 'main', 'ヘスティア', 'Inori Minase',
   'Diosa del hogar recien bajada del cielo, sin templo, sin dinero y sin seguidores. Acoge a Bell como primer miembro de su familia y lo defiende con unas y dientes contra dioses mucho mas grandes. Celosa, gritona y la primera en creer en el.'],

  ['Ais Wallenstein', '1,2,3,4,5', 'supporting', 'アイズ・ヴァレンシュタイン', 'Saori Oonishi',
   'La princesa de la espada de la familia Loki, la aventurera mas famosa de Orario. Salva a Bell de un minotauro sin darle importancia y se convierte en su meta. Detras de la frialdad esconde su propia caza contra los monstruos que odia.'],

  ['Liliruca Arde', '1,2,3,4,5', 'main', 'リリルカ・アーデ', 'Maaya Uchida',
   'Apoyo hobbit que empieza robando a Bell para la familia Soma y acaba siendo su mano derecha. Conoce cada callejon de Orario y cada truco del oficio. Su lealtad, una vez ganada, no se mueve.'],

  ['Welf Crozzo', '1,2,3,4,5', 'main', 'ヴェルフ・クロッゾ', 'Yoshimasa Hosoya',
   'Herrero de sangre Crozzo que reniega de las espadas magicas de su familia y quiere forjar armas de verdad. Su orgullo le cuesta caro mas de una vez, pero sus hojas salvan al grupo cuando importa. El mejor amigo de Bell en la forja y fuera.'],

  ['Eina Tulle', '1,2,3,4,5', 'supporting', 'エイナ・チュール', 'Haruka Tomatsu',
   'Recepcionista semielfa del Gremio y guia obligada de Bell. Le explica la mazmorra, le rine cuando se pasa de valiente y se preocupa por el mas de lo que admite su puesto. La voz sensata que Bell casi nunca escucha.'],

  ['Syr Flova', '1,2,3,4,5', 'supporting', 'シル・フローヴァ', 'Shizuka Ishigami',
   'Camarera risuena de la taberna que invita a Bell a una cita y parece la chica mas normal de Orario. Detras hay un secreto que lo cambia todo en la quinta temporada. Lo que quiere de Bell no lo quiere nadie mas.'],

  ['Ryuu Lion', '1,2,3,4,5', 'supporting', 'リュー・リオン', 'Saori Hayami',
   'Elfa camarera de la taberna, ex aventurera de la familia Astrea con un pasado de sangre. Fria y letal cuando toca, y la primera en tender la mano cuando Bell se hunde. Su historia con su maestra Alise es el corazon de la cuarta temporada.'],

  ['Tiona Hiryute', '1,2,3,4,5', 'supporting', 'ティオナ・ヒリュテ', 'Rie Murakawa',
   'Guerrera amazona de la familia Loki, gemela de Tione y energia desatada con dos espadas enormes. Adora a Ais y trata a Bell como al hermano pequeno que nunca tuvo. Donde hay lio, ella ya esta dentro.'],

  ['Tione Hiryute', '1,2,3,4,5', 'supporting', 'ティオネ・ヒリュテ', 'Minami Takahashi',
   'La otra gemela amazona: mas seria que Tiona y colada hasta las trancas por Finn, su capitan. En combate es de las mas fiables de Orario. Su mal genio con Bete es legendario en la familia.'],

  ['Bete Loga', '1,2,3,4,5', 'supporting', 'ベート・ローガ', 'Nobuhiko Okamoto',
   'Hombre lobo de la familia Loki con la lengua mas afilada de la ciudad. Desprecia a Bell por debil y se lo dice a la cara, aunque en el fondo respeta a quien no se rinde. Corre mas que piensa.'],

  ['Finn Deimne', '1,2,3,4,5', 'supporting', 'フィン・ディムネ', 'Mutsumi Tamura',
   'Pallum capitan de la familia Loki y el mejor lider de Orario. Pequeno de cuerpo y gigante de cabeza: sus planes ganan batallas antes de pelearlas. Su ambicion es rehacer la nacion de su pueblo.'],

  ['Riveria Ljos Alf', '1,2,3,4,5', 'supporting', 'リヴェリア・リヨス・アールヴ', 'Risa Taneda',
   'Alta elfa y la maga mas poderosa de la ciudad, segunda de la familia Loki. Seria y maternal con los suyos, implacable con los enemigos. Su magia decide asedios enteros.'],

  ['Gareth Landrock', '1,2,3,4,5', 'supporting', 'ガレス・ランドロック', 'Kenji Nomura',
   'Enano veterano de la familia Loki, muro con patas y voz de trueno. Entrena a los novatos a base de gritos y carino mal disimulado. Si el aguanta la linea, la linea aguanta.'],

  ['Loki', '1,2,3,4,5', 'supporting', 'ロキ', 'Yurika Kubo',
   'Diosa tramposa jefa de la familia mas fuerte de Orario. Se aburre, bebe, juega con sus hijos como piezas y aun asi los quiere a su manera retorcida. Su rivalidad con Freya mueve media ciudad.'],

  ['Lefiya Viridis', '1,2,3,4,5', 'supporting', 'レフィーヤ・ウィリディス', 'Juri Kimura',
   'Joven elfa maga de la familia Loki que idolatra a Ais hasta el sonrojo. Torpe fuera del combate y prodigio dentro: su magia de canto largo cambia peleas. Crece a la sombra de su idolo buscando su propia luz.'],

  ['Hermes', '1,2,3,4,5', 'supporting', 'ヘルメス', 'Souma Saitou',
   'Dios mensajero que aparece donde no lo llaman con una sonrisa y un plan. Mueve piezas entre familias y dioses por diversion, dice el, aunque siempre mira por Bell. Nadie sabe a que juega, ni el quiza.'],

  ['Freya', '1,2,3,4,5', 'supporting', 'フレイヤ', 'Youko Hikasa',
   'Diosa de la belleza duena de la familia mas temida, con Ottar y sus ejecutivos a sus ordenes. Colecciona lo que brilla y ha puesto los ojos en Bell. Su capricho es el motor de la quinta temporada.'],

  ['Mikoto Yamato', '1,2,3,4,5', 'supporting', 'ヤマト・命', 'Chinatsu Akasaki',
   'Espadachina del Lejano Oriente de la familia Takemikazuchi, amiga de Bell desde los inicios. Seria y honorable hasta el extremo, sufre cada vez que tiene que mentir o esconderse. Su fidelidad no tiene fisuras.'],

  ['Haruhime Sanjouno', '2,3,4,5', 'supporting', 'サンジョウノ・春姫', 'Haruka Chisuga',
   'Chica zorro renard criada como ofrenda en el distrito del placer de Ishtar. Bell y los suyos la rescatan y entra en la familia Hestia, donde su magia de subida de nivel resulta decisiva. Dulce hasta doler.'],

  ['Aisha Belka', '2,3,4,5', 'supporting', 'アイシャ・ベルカ', 'Akeno Watanabe',
   'Amazona de Ishtar que cambia de bando en mitad de la fiesta y acaba en la familia Hestia. Directa, sensual y letal con la lanza. Cuida de Haruhime como de una hermana pequena.'],

  ['Wiene', '3', 'supporting', 'ウィーネ', 'Rina Hidaka',
   'Nina dragon vouivre que habla y piensa como una nina: una Xenos, un monstruo con razon. Bell la esconde y la defiende contra media ciudad, incluida la familia Loki. Su existencia pregunta que es un monstruo.'],

  ['Cassandra Ilion', '2,4', 'supporting', 'カサンドラ・イリオン', 'Ayumi Mano',
   'Chica de profecias que suena desgracias que nadie cree hasta que pasan. Sus malos presagios guian a la expedicion en la cuarta temporada. Vive asustada de su propio don y aun asi avisa.'],

  ['Daphne Lauros', '2,4', 'supporting', 'ダフネ・ラウロス', 'Wakana Kowaka',
   'Amiga inseparable de Kasandra y la sensata del duo. Sostiene a los que flaquean cuando la expedicion se rompe. Su amistad con Kasandra es de lo poco solido cuando todo se hunde.'],

  ['Artemis', '6', 'supporting', 'アルテミス', 'Maaya Sakamoto',
   'Diosa que encarga a Bell recuperar la lanza de Orion en la pelicula. Detras del encargo festivo hay algo mucho mas viejo y mas peligroso. Solo sale aqui: es un personaje de la pelicula.'],
];
