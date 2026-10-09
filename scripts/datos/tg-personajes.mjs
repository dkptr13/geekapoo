// PERSONAJES - Tokyo Ghoul
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// `temporada`:
//
//   ''      = sale en TODAS las temporadas. Con cuatro temporadas en el
//             catalogo eso casi no se usa: la cuarta es el OVA, que es
//             una peli suelta, y solo salen dos personas.
//   1,2,3   = solo en esas. Un array de temporada NO es lo mismo que uno
//             vacio: ver `seasonIdsDe` en `utils/seasonData.ts`.
//
// OJO, que es la trampa de esta serie: como hay cuatro temporadas,
// poner "" en un personaje que no sale en el OVA lo hace aparecer en la
// ficha del OVA, que es donde mas se nota el error. Kaneki, que sale en
// las tres de television, es el ejemplo: si se le deja vacio se
// enseñaria tambien en Jack y en Pinto, y en ninguno de los dos sale.
//
// `voz` es el seiyuu japones. El campo del proyecto es `voiceActor` y no
// lleva pais, asi que se deja el nombre japones tal cual.
//
// ── DE DONDE VIENEN ───────────────────────────────────────
//
// Nombre japones y seiyuu: la tabla de personajes de Wikipedia en
// ingles, que los saca de la pagina de casting de Funimation y de la
// web oficial de la serie. Los que no venian ahi se han buscado en la
// ficha de personajes en japones.
//
// Los nombres van en el orden japones (apellido primero), que es como
// los escribe la fuente: 金木 研 es "Kaneki Ken". Aqui se pone
// "Ken Kaneki", que es como los escribe la ficha en ingles y como los
// busca quien busca.
//
// ── EL REPARTO ────────────────────────────────────────────
//
// Cincuenta y dos. No esta el reparto entero de la wiki de personajes
// (que se acerca al doble), sino los que tienen peso en el anime: los
// que cambian la trama y los que se verian raro que no estuvieran.
//
// Las dos primeras temporadas tienen bastante mas gente secundaria que
// :re, y eso es lo que hace que el reparto de la serie no sea ni parejo
// ni repetido: quien sale en la T1 casi nunca sale en la T3, y al reves.
//
// El reparto sale de los resumenes capitulo a capitulo de Wikipedia, no
// de la ficha de personajes del manga. Esa diferencia importa: hay
// gente que sale en el manga y no sale nunca en el anime (por ejemplo
// varios miembros de Aogiri), y meterlos haria que la wiki los
// ensenara en temporadas donde no aparecen.
//
// El nombre es el primero con el que aparece en el anime, aunque despues
// tenga otro: Nimura Furuta empieza siendo otro personaje (al principio
// es el socio de Kijima) y coge ese nombre al revelarse.

const TODAS = '';

export const PERSONAJES = [
  ['Ken Kaneki', '1,2,3', 'main', '金木 研', 'Natsuki Hanae',
   'Estudiante de primero que lee de todo y no fia de nadie. Sobrevive a que le trasplanten los organos de un goul y pasa el resto de la serie siendo las dos cosas: el unico que puede hablar con los dos bandos y el unico al que los dos quieren matar. En la tercera temporada despierta sin recuerdos con otro nombre, Haise Sasaki, y trabaja para la Comision hasta que vuelve a acordarse del suyo.'],
  ['Touka Kirishima', '1,2,3', 'main', '霧嶋 董香', 'Sora Amamiya',
   'Goul de primer año de instituto y camarera en la cafeteria donde acaba Kaneki. Aprendio a cazar de pequeña, cuando la Comision mato a su padre, y desde entonces vive con una regla: no matar a un humano delante de otra persona. Es la primera que le dice a Kaneki lo que es, y la que se niega a enseñarle como se hace.'],
  ['Hideyoshi Nagachika', '1,2,3', 'supporting', '永近 英良', 'Toshiyuki Toyonaga',
   'El mejor amigo de Kaneki y el unico humano que lo busca de verdad cuando desaparece. No puede con un goul ni de lejos y se mete igual, y por eso casi se muere en el primer asedio a la cafeteria. En la tercera temporada se le da por muerto y sale convertido en el espantapajaros de la Comision, pero esta vivo y lleva toda la serie haciendo de tapavelas.'],
  ['Rize Kamishiro', '1,2,3', 'supporting', '神代 利世', 'Kana Hanazawa',
   'La chica con la que Kaneki sale en su primera cita y la razon de que exista el. Se supone que muere aplastada por una viga; en la segunda temporada aparece viva y tendida en una mesa, y es el cuerpo que Kano usa para todos sus experimentos. En la tercera resulta que ese mismo cuerpo es el corazon de un monstruo del tamano de un edificio.'],
  ['Eto Yoshimura', '1,2,3', 'antagonist', '芳村 愛支', 'Maaya Sakamoto',
   'Hija de Yoshimura y creadora de la organizacion que secuestra a Hinami. Fuera de ella escribe novelas de terror bajo el nombre de Sen Takatsuki, que es justo los libros que le gustaban a Kaneki de chico. Al final resulta que tambien era el Buho Tuerto y que todo lo que hizo, incluido casarse con un hombre, era para llegar a el.'],
  ['Yoshimura', '1,2,3', 'supporting', '芳村', 'Takayuki Sugō',
   'Dueño de la cafeteria donde Kaneki acaba trabajando y el que le ensena a cazar sin que nadie lo note. Parece el mas sensato de todos y lleva veinte años fingiendo ser una persona corriente. Cuando la Comision entra a saco, se entrega creyendo que le van a hacer una entrevista y en realidad lo estan usando de pieza para un experimento.'],
  ['Hinami Fueguchi', '1,2,3', 'supporting', '笛口 雛実', 'Sumire Morohoshi',
   'Nina goul de trece años que llega al distrito veinte huyendo de la Comision y que no sabe leer. Kaneki le enseña a leer y de ahi le sale todo: es la razon por la que el se queda en esa ciudad y la que acaba decidiendo de que bando esta. En la tercera temporada se une a los otros y acaba siendo la razon de que media ciudad arda.'],
  ['Shu Tsukiyama', TODAS, 'supporting', '月山 習', 'Mamoru Miyano',
   'El Gourmet: un goul de una familia tan rica que los propios investigadores tienen miedo de tocarlo. Habla como un reputado, lee como un erudito y come como un refinadisimo, y esa imagen de muchacho de revista es lo unico que hay debajo de la ferocidad. Cuando Kaneki deja de hablar con el, Tsukiyama se pasa la tercera temporada intentando devolverle la vida que tuvo.'],
  ['Ayato Kirishima', '1,2,3', 'supporting', '霧嶋 絢都', 'Yūki Kaji',
   'Hermano menor de Touka y el que se fue de casa. Se une a la organizacion de Eto no por fuerza sino por despecho: no soporta que su hermana viva con los humanos y elija ellos antes que a el. En la tercera temporada monta un asalto contra la prision solo porque Hinami esta dentro, y saca a dos personas vivas de alli.'],
  ['Nishiki Nishio', '1,2,3', 'supporting', '西尾 錦', 'Shintarō Asanuma',
   'Companero de Kaneki en la universidad, artero y muy territorial. En la tercera temporada vuelve siendo el Orochi, un goul tan fuerte que caza investigadores por gusto.'],
  ['Kishō Arima', '1,2,3,4', 'antagonist', '有馬 貴将', 'Daisuke Namikawa',
   'La Guadaña de la Comision: el investigador que nunca pierde un caso. Derrota a Kaneki dos veces y luego le toca el cargo mas incomodo de todos, el de proteger a un grupo de crias con organos de goul.'],
  ['Kōtarō Amon', '1,2,3', 'supporting', '亜門 鋼太朗', 'Katsuyuki Konishi',
   'Investigador de primera clase, de los buenos de verdad: no odia a los goul, odia que le dejaran huerfano. Pelea con Kaneki en el primer capitulo y Kaneki lo deja vivir. Aparece muerto en la segunda temporada y vuelve en la tercera convertido en un monstruo con su kagune mas grande, que sigue siendo el tio de la chica que quiere proteger.'],
  ['Akira Mado', '1,2,3', 'supporting', '真戸 暁', 'Asami Seto',
   'Jefa de escuadra de la Comision y la unica mujer seria de la serie. Se forma un hierro con los recuerdos que Kaneki tiene de ella como madre, y en la tercera temporada acaba defendiendo a un enemigo al que todavia ve como un hijo.'],
  ['Kureo Mado', '1', 'supporting', '真戸 呉緒', 'Tōru Ōkawa',
   'Padre de Akira y el investigator que mas se acerca a cazar a un goul justo. Renunció a un ascenso porque habria significado pelear en primera linea y dejar a su hija sola, y no por miedo. Muere en la primera temporada precisamente por mirar a una niña goul en vez de mirar al frente.'],
  ['Akihiro Kanō', '1,2,3', 'antagonist', '嘉納 明博', 'Kenji Nomura',
   'El medico que le trasplanto los organos de Rize a Kaneki y el que lleva veinte años haciendo experimentos con gente y con gouls en un sotano. Es el que creo el monstruo del que la Comision no sospecha nada, y se suicida con una pistola en la cabeza antes de que nadie le haga una pregunta.'],
  ['Yamori', '1,2,3,4', 'antagonist', '大守 八雲', 'Rintaro Nishi',
   'El hombre de la mascara de hockey que se lleva a Kaneki a una jaula y le tiene diez dias dando vueltas a lo que le va a hacer. Torció a un policia hasta que dejo de ser persona y se paso el resto de la vida contemplando como se le podia hacer a otro lo mismo.'],
  ['Renji Yomo', '1,2,3', 'supporting', '四方 蓮示', 'Yūichi Nakamura',
   'El Cuervo. Tio de Touka y Ayato, y el que llevo veinte años cuidando a los dos sin que lo sepan porque era el hermano de su madre. Hace el mejor cafe de la ciudad y tiene el kagune negro capaz de soltar rayos. Odia a la Comision desde que le mataron a su hermana.'],
  ['Enji Koma', '1,2,3', 'supporting', '古間 円児', 'Anri Katsu',
   'El Mono, camarero de la cafeteria y el que lleva veinte años contando chistes para disimular. Antes mandaba una banda de enmascarados que arrasaba el distrito veinte. Cuando la Comision entra en la cafeteria, sale de su retiro para pelear por ella aunque le quede un brazo.'],
  ['Kaya Irimi', '1,2', 'supporting', '入見 カヤ', 'Fuyuka Oura',
   'El Perro Negro, camarera de la cafeteria y antes jefa de una banda de enmascarados. Oye a la gente a traves de las paredes y se defendio sola contra media Comision cuando irrumpieron. Murio creyendo que no, porque Yoshimura la habia convencido de que ya no hacia falta matar a nadie.'],
  ['Uta', '1,2,3', 'supporting', 'ウタ', 'Takahiro Sakurai',
   'Hace las mascaras de los gouls en su taller. Tranquilo a pesar de todo, es de los pocos que no quiere que gane nadie.'],
  ['Itori', '1,2', 'supporting', 'イトリ', 'Ayahi Takagaki',
   'Dueña de un bar del distrito catorce y la que siempre sabe quien esta donde y quien no. Juega a revolverlo todo porque se aburre, y acaba siendo de los Payasos.'],
  ['Kuki Urie', '3', 'supporting', '瓜江 久生', 'Kaito Ishikawa',
   'Jefe de la escuadra de Kaneki. Ambicioso y cruel con los suyos, solo piensa en ascender, y odia a los gouls porque su padre murio por uno.'],
  ['Ginshi Shirazu', '3', 'supporting', '不知 吟士', 'Yūma Uchida',
   'Jefe de la escuadra de Kaneki. Entra por dinero, para pagar el tratamiento de su hermana enferma, y acaba siendo el mas leal del grupo.'],
  ['Tōru Mutsuki', '3', 'supporting', '六月 透', 'Natsumi Fujiwara',
   'El miembro mas joven de la escuadra. Se hizo el goul para saber lo que se siente y descubre algo mucho peor de lo que esperaba.'],
  ['Saiko Yonebayashi', '3', 'supporting', '米林 才子', 'Ayane Sakura',
   'La mas perezosa de la escuadra, pero la que mejor maneja el kagune cuando hace falta.'],
  ['Shinsanpei Aura', '3', 'supporting', '安浦 晋三平', 'Makoto Furukawa',
   'Sobrino de Kiyoko Aura y el segundo en entrar en la escuadra. Tímido y torpe, con un talento que le sale cuando ya no puede mas.'],
  ['Seidō Takizawa', '1,2,3', 'antagonist', '滝澤 政道', 'Shinnosuke Tachibana',
   'Le converters en un goul con un solo ojo y se vuelve un monstruo que imita justo lo que Kaneki podria llegar a ser.'],
  ['Kiyoko Aura', '2,3', 'antagonist', '安浦 清子', 'Chinatsu Akasaki',
   'Primera mujer en llegar a la clase especial de la Comision. Serena y fria, muere herida por Kaneki.'],
  ['Itsuki Marude', '3,4', 'supporting', '丸手 斎', 'Yūji Ueda',
   'El que destapa que la familia que dirige la Comision son gouls. Duro con los suyos y el primero que dispara antes de preguntar.'],
  ['Take Hirako', '1,2,3', 'supporting', '平子 丈', 'Takayuki Kondō',
   'Compañero de Arima de los tiempos buenos y el unico que cumple la ultima voluntad de su jefe: soltar a Kaneki.'],
  ['Kuramoto Itō', '2,3', 'supporting', '伊東 倉元', 'Shinya Takahashi',
   'El unico del equipo que se lleva bien con los críos, y el que peor lo lleva cuando le toca mandar.'],
  ['Ayumu Hogi', '3', 'supporting', '穂木 あゆむ', 'Rui Tanabe',
   'La investigatora joven que va siempre tapandose la cara con el pelo y que resulta tener una carita de niña pecosa.'],
  ['Hairu Ihei', '3', 'supporting', '伊丙 入', 'Akira Sekine',
   'La chica de la escuadra cero que trabaja con Ui. Muere de un corte limpio al final del asedio, y casi se lo hace ella.'],
  ['Takeomi Kuroiwa', '3', 'supporting', '黒磐 武臣', 'Haruki Ishiya',
   'Hijo de un investigator de clase especial y uno de los pocos humanos que puede pelear contra un goul sin armas.'],
  ['Shiki Kijima', '3', 'antagonist', 'キジマ 式', 'Nobuo Tobita',
   'El interrogador de la Comision. Le gusta mas torturar que cazar, y graba a sus victimas.'],
  ['Jūzō Suzuya', '1,2,3', 'supporting', '鈴屋 什造', 'Rie Kugimiya',
   'El investigador joven que crece demasiado rapido. Se crio con una goul que lo torturaba y por eso habla consigo mismo.'],
  ['Taishi Fura', '3,4', 'supporting', '富良 太志', 'Ryōhei Kimura',
   'El otro protagonista del OVA de Jack, junto a Arima. Vivo, desordenado y nada meticuloso, se vuelve un buen investigador.'],
  ['Chie Hori', '3,4', 'supporting', '掘 ちえ', 'Megumi Han',
   'Fotografa y vendedora de chismes. Le grabo a Tsukiyama matando y en vez de huir le pregunto por que.'],
  ['Matsuri Washū', '3', 'antagonist', '和修 政', 'Yoshihisa Kawahara',
   'El hijo del que manda en la Comision. Trata a sus equipos como material gastable y no soporta que Kaneki le discuta.'],
  ['Naoto Hayashimura', '3', 'antagonist', '林村 直人', 'Ryunosuke Watanuki',
   'El hermano mayor de Matsuri y el que quiere matar a Kaneki por haber roto a su padre.'],
  ['Nimura Furuta', '3', 'antagonist', '旧多 二福', 'Daisuke Kishio',
   'El agente doble que nadie sabe quien es hasta que ya es demasiado tarde. Se hizo a si mismo mitad goul y acaba montando el monstruo que casi destruye Tokio.'],
  ['Big Madam', '3', 'antagonist', 'ビッグマダム', 'Kimiko Saito',
   'Dueña de las subastas de personas y crio de Suzuya, al que uso de juguete.'],
  ['Donato Porpora', '1,2,3', 'antagonist', 'ドナートポルポラ', 'Kazuhiko Inoue',
   'Sacerdote ruso de los Payasos que se comia a los ninos que tenia a su cargo. Amon lo vio hacerlo y no lo denuncio.'],
  ['Kanae von Rosewald', '3', 'antagonist', 'カナエフォンロゼヴァルト', 'Yuu Kobayashi',
   'El criado de la familia de Tsukiyama. Sabe que ese hombre es un goul y no lo dice, y lo quiere de una forma que no se sostiene.'],
  ['Tatara', '1,2,3', 'antagonist', 'タタラ', 'Koji Yusa',
   'El segundo de a bordo de la organizacion de Eto. No pelea nunca y usa el fuego como arma.'],
  ['Naki', '2,3', 'supporting', 'ナキ', 'Hiro Shimono',
   'El que hacia de mano derecha de Yamori y que no se pasa de quererlo ni despues de muerto.'],
  ['Kazuichi Banjō', '1,2,3', 'supporting', '万丈 数壱', 'Kentarō Itō',
   'Goul pacifico que dirige el distrito once y cuya arma se usa para curarse en vez de para pelear.'],
  ['Kurona Yasuhisa', '2,3', 'antagonist', '安久 黒奈', 'Aoi Yūki',
   'Hermana de Nashiro y las dos juntas son el recordatorio de que Kanō tambien experimento con humanos.'],
  ['Yoriko Kosaka', '3', 'supporting', '小坂 依子', 'Chinatsu Akasaki',
   'Mejor amiga de Touka en el instituto y la unica humana que va a visitarla a la cafeteria nueva.'],
  ['Romi', '2,3', 'antagonist', '帆糸 ロマ', 'Suzuko Mimori',
   'Camarera de la cafeteria que en realidad es una de los Payasos. Le encanta ver sufrir a Kaneki.'],
  ['Noro', '3', 'antagonist', 'ノロ', 'Kenji Hamada',
   'El que no habla y come sin parar. Shirazu lo mata y descubre que era un cadaver.'],
  ['Nico', '3', 'supporting', 'ニコ', 'Kenjirō Tsuda',
   'De los Payasos, y el unico que no sigue a Furuta. Sale poco y en el bando correcto.'],
];