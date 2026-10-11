// PERSONAJES - Mushoku Tensei
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// `temporada`:
//
//   ''  = COMPARTIDO. Sale en las tres temporadas y el array se
//         deja vacio, que es como lo lee la wiki (`seasonIdsDe`):
//         lista vacia significa "esta en todas".
//   1, 2, 3 o combinaciones tipo '1,3' = solo en esas.
//
// El reparto sale de la lista de personajes de Wikipedia y de las
// fichas de reparto de Crunchyroll. Donde un personaje no llega a
// las tres temporadas se le pone la lista exacta, que es lo que
// hace que la ficha no lo muestre en capitulos donde no aparece.
//
// `voz` es el seiyuu japones. El project's campo es `voiceActor`
// y no lleva pais, asi que se deja el nombre japones tal cual.

const TODAS = '';

// ── Compartidos: salen en las tres temporadas ──────────────
const COMPARTIDOS = [
  ['Rudeus Greyrat', '', 'main', 'ルーデウス・グレイラット', 'Tomokazu Sugita',
   'El protagonista. Un hombre de 34 años que muere y renace como bebé conservando sus recuerdos, decidido a no malgastar esta segunda vida. Mago de nivel dios con una capacidad de maná descomunal.'],
  ['Roxy Migurdia', '', 'main', 'ロキシー・ミグルディア', 'Konomi Kohara',
   'Maga de la tribu Migurd, de aspecto juvenil y vida larga, que se hizo tutora itinerante. Fue la maestra de Rudeus y acaba siendo su segunda esposa.'],
  ['Sylphiette', '', 'main', 'シルフィエット', 'Ai Kayano',
   'Elfa que de pequeña era víctima de violencia y a la que Rudeus salvó, enseñándole magia. Amiga de la infancia, primera esposa y madre de sus dos primeros hijos.'],
  ['Eris Boreas Greyrat', '1,3', 'main', 'エリス・ボレアス・グレイラット', 'Ai Kakuma',
   'Aristocrática del norte, prima lejana de Rudeus. De pequeña le pegaba a los juguetes; de adulta es una espadachina obsesionada con superar al Dios Dragón Orsted.'],
  ['Zenith Greyrat', '', 'supporting', 'ゼニス・グレイラット', 'Hisako Kanemoto',
   'Primera esposa de Paul y madre de Rudeus. Renunció a su casa de nobles para ser aventurera, y se formó como curandera.'],
  ['Norn Greyrat', '', 'supporting', 'ノルン・グレイラット', 'Saya Aizawa',
   'Hija de Zenith y hermana menor de Rudeus. Estuvo con Paul durante la teletransportación y el reencuentro con Rudeus le cambia la forma de verlo.'],
  ['Aisha Greyrat', '', 'supporting', 'アイシャ・グレイラット', 'Yuki Takada',
   'Hija de Lilia y medio hermana de Rudeus. Dotada para la magia, dedica su talento a mantener la casa en orden.'],
  ['Ghislaine Dedoldia', '', 'supporting', 'ギレーヌ・デドルディア', 'Megumi Toyoguchi',
   'Espadachina de la raza bestia, la Espada Rey, tía de Linia. Guardiana de Eris y, más adelante, quien lleva a Eris a entrenar con el Espada Dios.'],
  ['Zanoba Shirone', '', 'supporting', 'ザノバ・シーローン', 'Satoshi Tsuruoka',
   'Humano con una capacidad que le da fuerza sobrehumana. Alumno prodigioso de Ranoa, obsesionado con fabricar muñecas que se mueven solas.'],
  ['Orsted', '', 'antagonist', 'オルステッド', 'Kenjiro Tsuda',
   'Del linaje de los Dioses Dragón, el más fuerte de los que existen, y el hombre más peligroso del mundo. Ir a su lado inspira un miedo que solo muy pocos resisten.'],
];

// ── Solo la primera temporada ───────────────────────────────
const SOLO_T1 = [
  ['Paul Greyrat', '1,2,3', 'supporting', 'パウロ・グレイラット', 'Toshiyuki Morikawa',
   'Padre de Rudeus. Renunció a su casa de nobles, dominó los tres estilos de espada y pasó veinte años bebiendo tras la teletransportación.'],
  ['Lilia Greyrat', '1,2', 'supporting', 'リーリャ・グレイラット', 'Lynn',
   'Sirvienta de Paul y Zenith y madre de Aisha. Una lesión le impidió seguir como guardiana, y acabó siendo la segunda esposa de Paul.'],
  ['Sauros Boreas Greyrat', '1', 'supporting', 'サウロス・ボレアス・グレイラット', 'Binbin Takaoka',
   'El señor de Fittoa y abuelo de Eris. Severo y brutal, es la razón de que la niña sea tan dura.'],
  ['Hilda Boreas Greyrat', '1', 'supporting', 'ヒルダ・ボレアス・グレイラット', 'Ryoka Yuzuki',
   'Madre de Eris y esposa de Philip. Es la que de verdad marca la infancia de su hija.'],
  ['Philip Boreas Greyrat', '1', 'supporting', 'フィリップ・ボレアス・グレイラット', 'Daisuke Ono',
   'Padre de Eris. El miembro más relajado de la familia Boreas.'],
  ['Gustav Dedoldia', '1', 'supporting', 'ギュスターヴ・デドルディア', 'Shinpachi Tsuji',
   'Jefe de la tribu bestia y padre de Ghislaine.'],
  ['Minitona Dedoldia', '1', 'supporting', 'ミニトーナ・デドルディア', 'Shiori Izawa',
   'La pequeña hermana alegre de Linia.'],
  ['Rowin Migurdia', '1', 'supporting', 'ロイン・ミグルディア', 'Yusuke Kobayashi',
   'Padre de Roxy. Solo habla por telepatía.'],
  ['Rokari Migurdia', '1', 'supporting', 'ロカリー・ミグルディア', 'Satomi Sato',
   'Madre de Roxy. Solo habla por telepatía.'],
];

// ── Primera y segunda ──────────────────────────────────────
const T1_Y_T2 = [
  ['Elinalise Dragonroad', '1,2,3', 'supporting', 'エリナリーゼ・ドラゴンロード', 'Rie Tanaka',
   'Elfa de la primera generación, capaz de abrir puertas a otros mundos. Compañera de Paul, participa en la búsqueda de Rudeus y termina siendo la abuela de Sylphiette.'],
  ['Geese Nukadia', '1,2,3', 'supporting', 'ギース・ヌーカディア', 'Yoji Ueda',
   'Miembro de la tribu demoníaca y aventurero de rango S. Ladrón de un grupo pequeño.'],
  ['Tallhand', '1,2,3', 'supporting', 'タルハンド', 'Hochu Otsuka',
   'El mago enano del grupo. Tiene afinidad con el agua y el viento, y es el trigésimo séptimo de cincuenta y un hermanos.'],
  ['Ruijerd Superd', '1,2', 'supporting', 'ルイジェルド・スペルディア', 'Daisuke Namikawa',
   'Guerrero de la raza supard, marcado con el estigma de monstruo asesino. Viaja por el mundo para deshacerlo.'],
  ['Gyes Dedoldia', '1,2', 'supporting', 'ギュエス・デドルディア', 'Daiki Hamano',
   'Hermano impulsivo de Ghislaine y padre de Linia y Minitona.'],
  ['Cliff Grimoire', '1,2,3', 'supporting', 'クリフ・グリモル', 'Ryota Osaka',
   'Nieto del Pontífice de Milis y alumno especial de la Universidad de Ranoa. Presume de su abolengo más de lo que su talento justifica.'],
];

// ── Segunda y tercera ──────────────────────────────────────
const T2_Y_T3 = [
  ['Kishirika Kishirisu', '1,3', 'supporting', 'キシリカ・キシリス', 'Yuka Iguchi',
   'Emperatriz de la tribu demoníaca, con poder para otorgar fuerza a otros. Está prometida con Badigadi.'],
  ['Lucy Greyrat', '2,3', 'supporting', 'ルーシー・グレイラット', 'Miyu Tomita',
   'Hija de Rudeus y Sylphiette. Empieza a entrenar magia a los tres años, empujada por querer parecerse a su padre.'],
  ['Lara Greyrat', '2', 'supporting', 'ララ・グレイラット', 'Nene Hieda',
   'Hija de Rudeus y Roxy. Heredó de su madre la telepatía de los Migurd.'],
  ['Ars Greyrat', '2', 'supporting', 'アルス・グレイラット', 'Kensuke Ushio',
   'Hijo de Rudeus y Eris. Salió con el pelo del mismo color que su abuelo, Paul, y no para de meterse en líos.'],
  ['Sieghart Greyrat', '2', 'supporting', 'ジークハルト・サラディン・グレイラット', 'Wakana Kuramoto',
   'Hijo de Sylphiette. Nació con el pelo color esmeralda y su padre tardó en aceptar que eso no lo convertía en nadie concreto.'],
  ['Lily Greyrat', '2', 'supporting', 'リリ・グレイラット', 'Tomori Kusunoki',
   'Hija de Roxy. Quería ser investigadora aunque su magia y su esgrima no dieran para tanto.'],
  ['Christina Greyrat', '2', 'supporting', 'クリスティーナ・グレイラット', 'Rena Hasegawa',
   'La más pequeña de Rudeus. De todos sus hijos es la que más mimada está, y la que más pegada va a su padre.'],
];

// ── Solo la segunda ────────────────────────────────────────
const SOLO_T2 = [
  ['Badigadi', '2,3', 'supporting', 'バーディガーディ', 'Taiten Kusunoki',
   'Demonio ruidoso de la Universidad de Ranoa y prometido de Kishirika. Termina siendo quien pelea contra los alumnos bestia.'],
  ['Atoferatofe Rybak', '3', 'supporting', 'アトーフェラトーフェ・ライバック', 'Nanako Mori',
   'Demonio que reparte fuerza. Hermana mayor de Badigadi.'],
  ['Moore', '3', 'supporting', 'ムーア', 'Yasuhiro Mamiya',
   'General demoníaco, severo e inteligente, al servicio de Atoferatofe.'],
  ['Linia Dedoldia', '2,3', 'supporting', 'リニア・デドルディア', 'Fairouz Ai',
   'Candidata a líder de su aldea de la raza bestia. Sobrina de Ghislaine.'],
  ['Pursena Adoldia', '2,3', 'supporting', 'プルセナ・アドルディア', 'Minami Tanaka',
   'La otra candidata al liderazgo de la aldea, con rasgos de perro.'],
  ['Shizuka Nanahoshi', '1,2,3', 'supporting', 'ナナホシ・シズカ', 'Shion Wakayama',
   'Alumna especial de Ranoa, genio indiscutible, que casi nunca aparece a clase porque está investigar.'],
  ['Ariel Anemoi Asura', '2,3', 'supporting', 'アリエル・アネモイ・アスラ', 'Reina Ueda',
   'Princesa del reino Asura que compite con su hermano por el trono. Vierte su estrés en actos sádicos.'],
  ['Luke Notos Greyrat', '2,3', 'supporting', 'ルーク・ノトス・グレイラット', 'Kazuyuki Okitsu',
   'Primo de Rudeus y caballero personal de la princesa Ariel dentro de Ranoa.'],
  ['Juliette', '2,3', 'supporting', 'ジュリエット', 'Sumire Morohoshi',
   'Niña enana que Zanoba compró para enseñarle a fabricar muñecas.'],
  ['Jinas Halfas', '2,3', 'supporting', 'ジーナス・ハルファス', 'Yutaka Aoyama',
   'Vicedirectora de la Universidad de Magia de Ranoa y maestra de Roxy.'],
  ['Suzanne', '2,3', 'supporting', 'スザンヌ', 'Yu Kobayashi',
   'Vice líder del grupo de aventuras Counter Arrow, el que rescata a Rudeus cuando sale de la universidad.'],
  ['Sara', '2,3', 'supporting', 'サラ', 'Haruka Shiraishi',
   'Miembro impulsiva de Counter Arrow. Se interessa por Rudeus.'],
  ['Timothy', '2,3', 'supporting', 'ティモシー', 'Wataru Hatano',
   'Mago veterano de Counter Arrow, especializado en fuego y tierra.'],
  ['Mimir', '2', 'supporting', 'ミミル', 'Chiharu Sawashiro',
   'El curandero del grupo, que se ocupa de los que vuelven heridos de las misiones.'], 
  ['Patris', '2', 'supporting', 'パトリス', 'Itaru Yamamoto',
   'Mago guerrero y primera línea de combate de Counter Arrow.'],
  ['Soldat Heckler', '2', 'antagonist', 'ゾルダート・ヘッケラー', 'Kohsuke Toriumi',
   'Aventurero de rango S y líder del grupo Stepped Leader, que se lleva a Rudeus cuando sale de Counter Arrow.'],
];

// ── Solo la tercera ────────────────────────────────────────
const SOLO_T3 = [
  ['Gal Farion', '3', 'supporting', 'ガル・ファリオン', 'Tetsu Inada',
   'Maestro del Templo de la Espada y Espada Dios, uno de los Siete Grandes Poderes. Toma a Eris como alumno personal.'],
  ['Nina Farion', '2,3', 'supporting', 'ニナ・ファリオン', 'Haruka Tomatsu',
   'Hija de Gal Farion y alumna de elite. Empieza siendo rival de Eris y termina siendo su amiga.'],
  ['Gino Britz', '3', 'supporting', 'ジノ・ブリッツ', 'Reiji Kawashima',
   'Alumno del Templo de la Espada, ingenuo al principio, que llega a ser practicante fuerte del estilo del Espada Dios.'],
  ['Auber Corvette', '3', 'antagonist', 'オーベール・コルベット', 'Katsuyuki Konishi',
   'Emperador del Norte. Maestro de estilo práctico e intuitivo que se enfrenta a Eris en un duelo.'],
  ['Reida Lia', '3', 'supporting', 'レイダ・リィア', 'Mari Yokoo',
   'Anciana y perceptiva, es el Agua Dios y la abuela de Isolte Cruel.'],
  ['Isolte Cruel', '3', 'antagonist', 'イゾルテ・クルーエル', 'Yoko Hikasa',
   'Aprendiz de su abuela, el Agua Dios, y Rey del Agua. Manipuladora y muy consciente de su propio poder.'],
  ['Perugius Dola', '1,3', 'antagonist', 'ペルギウス・ドラ', 'Rikiya Koyama',
   'El Rey Dragón Acorazado. Vive en una fortaleza flotante y lleva veinte años esperando que Laplace regrese para matarlo otra vez.'],
];

// ── Añadidos en octubre de 2026 ─────────────────────────────
// Faltaban en la auditoria contra AniList: el dios hombre, el
// principe de Shirone, la guardia de Zanoba, el primogenito de
// Asura y la cabeza de los Notos.
const NUEVOS = [
  ['Hitogami', '', 'antagonist', 'ヒトガミ', 'Kujira',
   'Dios hombre de cara en blanco que ve el futuro y ayuda a Rudeus en momentos clave. Enemigo jurado de Orsted y, al final, el antagonista de fondo de todo.'],
  ['Pax Shirone', '1', 'supporting', 'パックス・シーローン', 'Jun Fukushima',
   'Principe del reino de Shirone. Sale en la primera temporada.'],
  ['Ginger York', '1,2', 'supporting', 'ジンジャー・ヨーク', 'Tomo Muranaka',
   'Subordinada leal de Zanoba y antigua guardia imperial. Sale en la primera y la segunda.'],
  ['Grabell Zafin Asura', '1,2', 'supporting', 'グラーヴェル・ザフィン・アスラ', 'Masaaki Mizunaka',
   'Primer principe de Asura y medio hermano de Ariel. Sale en la primera y la segunda.'],
  ['Pilemon Notos Greyrat', '2', 'supporting', 'ピレモン・ノトス・グレイラット', 'Masaki Terasoma',
   'Cabeza de los Notos, hermano de Paul y padre de Luke. Sale en la segunda.'],
];

export const PERSONAJES = [
  ...COMPARTIDOS,
  ...SOLO_T1,
  ...T1_Y_T2,
  ...T2_Y_T3,
  ...SOLO_T2,
  ...SOLO_T3,
  ...NUEVOS,
];
