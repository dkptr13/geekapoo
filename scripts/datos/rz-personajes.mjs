// PERSONAJES - Re:Zero
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las cuatro temporadas y se deja vacio, que es como lo
// lee la wiki (lista vacia = compartido). '1,2' o '2,3,4' = solo en esas.
//
// Nombres, japones y voces vienen de AniList (21355 para T1-T2,
// 163134 para T3, 189046 para T4) y se comprobaron contra TVDB 305089.
// Las descripciones son propias, en castellano, sin copiar de la licencia.

export const PERSONAJES = [
  ["Subaru Natsuki", "", "main", "ナツキ・スバル", "Yuusuke Kobayashi",
   "Chico sacado de una tienda a otro mundo sin aviso. Al morir vuelve atras y guarda lo vivido, y usa ese don para salvar a Emilia y a los suyos aunque cada vuelta le rompa un poco por dentro."],

  ["Emilia", "", "main", "エミリア", "Rie Takahashi",
   "Media elfa de pelo plateado que aspira al trono y busca una insignia robada. Criada en un bosque helado, quiere ayudar a todos aunque el reino la mire mal por su parecido con la bruja."],

  ["Rem", "", "main", "レム", "Inori Minase",
   "Gemela menor de Ram, sirvienta en la mansion de Roswaal. Tras dudar de Subaru por su olor, decide vivir por el futuro y lo ama sin pedir nada a cambio, hasta caer dormida por la gula."],

  ["Ram", "", "main", "ラム", "Rie Murakawa",
   "Gemela mayor de Rem, sirvienta de lengua afilada y cuerno cortado. Quiere a Roswaal y lo reta para curarlo de su obsesion, y en la torre sostiene a los suyos aunque el cuerpo no le responda."],

  ["Beatrice", "", "main", "ベアトリス", "Satomi Arai",
   "Guardiana de la biblioteca prohibida, atada cuatro siglos a esperar a esa persona. Toma la mano de Subaru, hace contrato con el y encierra al conejo en otra dimension."],

  ["Roswaal L Mathers", "", "supporting", "ロズワール・Ｌ・メイザース", "Takehito Koyasu",
   "Margrave payaso que rige la mansion y patrocina a Emilia. Paso su alma de cuerpo en cuerpo por Echidna y moldea a Subaru con su tomo, hasta que el grupo lo perdona y le exige pedir perdon."],

  ["Puck", "1,2", "supporting", "パック", "Yumi Uchiyama",
   "Gran espiritu con forma de gato que cuida de Emilia como padre. Rompe su pacto cuando ella ya no lo necesita y vuelve para ganar tiempo ante Roswaal en el santuario."],

  ["Otto Suwen", "", "supporting", "オットー・スーウェン", "Kouhei Amasaki",
   "Mercader que oye a las bestias y al que todos dejaron solo de niño. Libera a Subaru por amistad, arma el plan para salvar santuario y mansion y frena a Garfiel con trampas de animales."],

  ["Garfiel Tinsel", "2,3,4", "supporting", "ガーフィール・ティンゼル", "Nobuhiko Okamoto",
   "Guardian del santuario con colmillos y escudo en los brazos. Odia abrir la barrera por la muerte de su madre, supera la prueba y vuelve con armadura a salvar a su hermana."],

  ["Frederica Baumann", "2,3,4", "supporting", "フレデリカ・バウマン", "Kaori Nazuka",
   "Antigua sirvienta de la mansion, medio bestia y hermana de Garfiel. Guarda silencio por juramento, se vuelve bestia para frenar a Elsa y cuida de Petra y de los aldeanos."],

  ["Petra Leyte", "1,2,3,4", "supporting", "ペトラ・レイテ", "Marika Kouno",
   "Niña de la aldea que entra de aprendiz en la mansion. Alegre y lista, huye con Otto y Rem cuando arde la casa y crece hasta ser quien sostiene el dia a dia del grupo."],

  ["Julius Euclius", "1,2,3,4", "supporting", "ユリウス・ユークリウス", "Takuya Eguchi",
   "Caballero refinado que vence a Subaru en duelo y luego pelea a su lado. Presta sus ojos para ver las manos ocultas y en la torre pierde su nombre y queda roto ante sus amigos."],

  ["Reinhard van Astrea", "1,2,3", "supporting", "ラインハルト・ヴァン・アストレア", "Yuuichi Nakamura",
   "Santo de la espada, el mas fuerte del reino y protector de Felt. Corta a Elsa, pide paz a Julius y cruza su espada con la leyenda mas vieja en Pristella."],

  ["Felt", "1,2", "supporting", "フェルト", "Chinatsu Akasaki",
   "Ladrona que robo la insignia de Emilia y resulta quinta candidata al trono. Se niega a entrar en la seleccion y choca con las demas candidatas sin perder su orgullo."],

  ["Crusch Karsten", "1,2,3", "supporting", "クルシュ・カルステン", "Yuka Iguchi",
   "Candidata al trono, seria y de palabra. Acoge a Subaru herido, pierde la memoria por la gula y renueva su alianza con el entre lagrimas."],

  ["Anastasia Hoshin", "1,2,3,4", "supporting", "アナスタシア・ホーシン", "Kana Ueda",
   "Candidata mercader que todo lo mide en beneficio. Niega ayuda al principio, presta tropas contra la ballena y propone ir a la torre cuando Pristella ya respira."],

  ["Priscilla Barielle", "1,2,3", "supporting", "プリシラ・バーリエル", "Yukari Tamura",
   "Candidata altiva que se cree el centro del mundo. Lleva a Subaru en carroza, recoge al hundido en Pristella y se planta ante la ira sin ceder."],

  ["Wilhelm van Astrea", "1,2,3", "supporting", "ヴィルヘルム・ヴァン・アストレア", "Kenyuu Horiuchi",
   "Antiguo espadachin al servicio de Crusch. Perdió a su esposa ante la ballena, la venga derribando el arbol sobre la bestia y despide a Theresia como guerrero y esposo."],

  ["Theresia van Astrea", "3", "supporting", "テレシア・ヴァン・アストレア", "Minami Takahashi",
   "Esposa de Wilhelm y santa de la espada anterior. Vuelve movida por manos ajenas y se reencuentra con el en un duelo a muerte lleno de dolor y de cariño."],

  ["Elsa Granhiert", "1,2", "antagonist", "エルザ・グランヒルテ", "Mamiko Noto",
   "Asesina que caza tripas con cuchillos y no muere a la primera. Mata en la casa de cambio y en la mansion, y Garfiel la aplasta bajo un cadaver de bestia pese a ser vampira."],

  ["Petelgeuse Romanee-Conti", "1,2", "antagonist", "ペテルギウス・ロマネコンティ", "Yoshitsugu Matsuoka",
   "Arzobispo del pecado de la pereza, con manos ocultas y dedos como cuerpos. Ata la aldea y la mansion, entra en Subaru y es negado cuando Subaru llama a la bruja."],

  ["Echidna", "2", "supporting", "エキドナ", "Maaya Sakamoto",
   "Bruja de la codicia que invita a Subaru a su fiesta del te en su espacio mental. Quiere su don para no morir del todo, invento a esa persona y ofrece un contrato para hablar siempre."],

  ["Regulus Corneas", "3", "antagonist", "レグルス・コルニアス", "Akira Ishida",
   "Arzobispo de la codicia que se cree intocable y toma esposas a la fuerza. Su don esconde un truco cruel con sus novias y cae cuando Subaru halla la grieta y Emilia le planta cara."],

  ["Shaula", "4", "supporting", "シャウラ", "Fairouz Ai",
   "Guardiana de la torre con forma de escorpion enorme que llama maestro a Subaru. Sola durante siglos, muestra lealtad total y recibe el nombre de heroina ante todos."],

  ["Meili Portroute", "2,3,4", "supporting", "メィリィ・ポートルート", "Eri Suzuki",
   "Niña que manda bestias y sirvio al culto con Elsa. Ve el daño que ayudo a causar, llora y cambia de lado hasta ser quien guia al grupo entre bestias en la torre."],
];
