// PERSONAJES - No Game No Life
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Veinte. La wiki en japones da dieciocho con voz y AniList lista
// veintinueve entre las dos obras, contando el relleno que solo aparece
// una vez. Aqui va la parte con voz comprobada y un papel que la
// historia sostenga, y se dejan fuera los cargos sin nombre y las
// apariciones de un minuto.
//
// ── LOS SEIYUU ────────────────────────────────────────────────────
//
// De la seccion de personajes de la wiki en japones, que los da en
// prosa con el nombre en su linea y el seiyuu en la siguiente. Esa
// pagina los escribe de dos maneras distintas: a veces la voz va en la
// misma linea que el nombre y a veces en la linea siguiente, y un
// extractor que solo cubre un caso devuelve la mitad del reparto sin
// avisar. Los dos casos estan cubiertos aqui.
//
// Las lecturas:
//
//   空（そら）              Sora      松岡禎丞   Yoshitsugu Matsuoka
//   白（しろ）              Shiro     茅野愛衣   Ai Kayano
//   ステファニー・ドーラ     Stephanie 日笠陽子   Yōko Hikasa
//   クラミー・ツェル         Chlammy   井口裕香   Yūka Iguchi
//   初瀬いづな               Izuna     沢城みゆき  Miyuki Sawashiro
//   初瀬いの                 Ino       麦人       Hitoshi Myōjin
//   先王                     el viejo   福島潤     Jun Fukushima
//   リク・ドーラ             Riku      松岡禎丞   Yoshitsugu Matsuoka
//   コローネ・ドーラ         Couronna  日笠陽子   Yōko Hikasa
//   シュヴィ・ドーラ        Schwi     茅野愛衣   Ai Kayano
//   ノンナ・ツェル           Nonna     井口裕香   Yūka Iguchi
//   イワン・ツェル           Ivan      大川透     Tōru Ōkawa
//   アレイ                   Arrei     興津和幸   Kazuyoshi Okitsu
//   ジブリール              Jibril    田村ゆかり  Yukari Tamura
//   アズリール              Azriel    堀江由衣   Yū Horie
//   フィール・ニルヴァレン   Fiel      能登麻美子  Mami Noto
//   シンク・ニルヴァレン     Think     能登麻美子  Mami Noto
//   アインツィヒ            Einzig    諏訪部順一  Junichi Suwabe
//   テト                    Tet       釘宮理恵   Rie Kugimiya
//   アルトシュ               Artosh    竹内良太   Ryōta Takeuchi
//
// Ojo con tres cosas:
//
//   · Fiel y Think son el mismo ser en dos formas, y por eso tienen la
//     misma voz. AniList los cuenta como dos personajes distintos y aqui
//     tambien, porque en pantalla lo son.
//
//   · Artosh sale en la wiki con un nombre escrito en katakana y en
//     AniList con otro en kanji. Es el mismo personaje con dos
//     escrituras; aqui va el de AniList, que es contra el que se
//     comparan las imagenes.
//
//   · Los dos hermanos Hatsuse estan en la lista de arriba porque la
//     pagina los escribe con un espacio entre el apellido y el nombre
//     de pila, y hay que buscarlos aparte del resto.
//
// ── LAS TEMPORADAS ────────────────────────────────────────────────
//
// De la lista de personajes de cada uno de los dos titulos de AniList.
// La T1 es la serie de 2014 y la T2 la pelicula de 2017, en el mismo
// orden que en el catalogo.
//
// Tres son solo de la serie: Chlammy, Fiel e Ino. Seis son solo de la
// pelicula: Riku, Couronna, Schwi, Nonna, Einzig e Ivan. Mahakoht es de
// la serie, aunque su historia se cuente en la pelicula. Los demas salen
// en las dos, y ese reparto es el que hace que la pelicula se pueda
// colocar despues de la serie sin que parezca suelta.
//
// Ni Riku ni Couronna salen en la serie, y eso no es un descuido: en la
// serie de 2014 los dos ya han muerto, y es la serie quien lo dice.
export const PERSONAJES = [
  ['Sora', '', 'main', '空', 'Yoshitsugu Matsuoka',
    'El que habla. De los dos protagonistas es el único que sabe tratar con la gente, y por eso mismo no sabe jugar: su trabajo es ganar a la gente que hay que ganar antes de que la partida empiece. Lleva años encerrado, no tiene oficio y no entiende por qué el mundo real es difícil si las reglas están escritas. Toda la serie va de que descubra que hay juegos que no se ganan.'],
  ['Shiro', '', 'main', '白', 'Ai Kayano',
    'La que juega. Genio del cálculo, sin ninguna duda sobre su propia capacidad y ninguna sobre cómo tratar a un ser humano. Es la que pierde a mitad de la serie y no se lo esperaba, y ese es el único punto de inflexión que tiene su línea. Al final carga con el mundo entero y paga por ello, que es lo que la convierte en el personaje más caro de la historia.'],
  ['Jibril', '', 'main', 'ジブリール', 'Yukari Tamura',
    'El dios del cielo, que en algún momento fue el primero de todo y hoy es el peor del cielo y le están retirando el cargo. Lleva ochocientos años con una deuda que no puede pagar y una especie que no puede recuperar. La serie le cuenta esa historia y la película cuenta cómo llegó hasta ahí. Es el que más humaniza a una historia que por lo demás va de.booleanos y de reglas.'],
  ['Stephanie Dola', '', 'main', 'ステファニー・ドーラ', 'Yōko Hikasa',
    'La princesa que dirige el país humano desde el final de la guerra. Empieza como una autoridad que los dos ignoran y acaba siendo la que les salva el cargo, y el problema es que paraándolo tiene que ofrecer su propia vida en la partida. Es el personaje que mejor sostiene la idea central: en este mundo no se gana, se negocia.'],
  ['Tet', '', 'antagonist', 'テト', 'Rie Kugimiya',
    'El único dios que hay, el que escribe las reglas y el que trae a los dos críos a su mundo porque le ganó al ajedrez. No es un tirano por gusto: es el que tiene que mantener el equilibrio y por eso juega contra todos, incluido quien le salvó el cargo. Juega contra Sora en la final y ese duelo es lo único que importa en el último capítulo.'],
  ['Chlammy Zell', '1', 'supporting', 'クラミー・ツェル', 'Yūka Iguchi',
    'La que se ofrece como primera esclava de los dos y que con ese gesto convierte a Sora en rey. Tiene todo el tiempo del mundo para hablar con Shiro, que es justo lo que necesita, y las dos son la prueba de que un mundo de reglas puede tener amistad en él.'],
  ['Azriel', '', 'antagonist', 'アズリール', 'Yū Horie',
    'Uno de los dos que llevan ochocientos años organizando el bando contrario. Es el que falla en su propia Estimación y el que se convierte en el problema de verdad de la segunda mitad de la serie. Lo que pasó con él es lo que explica por qué este mundo tiene las reglas que tiene.'],
  ['Fiel Nilvalen', '1', 'supporting', 'フィール・ニルヴァレン', 'Mami Noto',
    'Quinientos años de edad con el aspecto de una adolescente, y una de las pocas personas de este mundo que le habla a Shiro como si fuera una niña. Es la que le explica qué es un juego cuando se juega de verdad, y es la razón de que Shiro empiece a perder.'],
  ['Mahakoht Dola', '1', 'supporting', 'マハコート・ドーラ', 'Jun Fukushima',
    'El último rey humano antes de que la guerra terminara, y el bisabuelo de Stephanie. No sale casi nunca en la serie, porque su historia se cuenta en retrospectiva. Pero es la razón de que la familia Dola siga existiendo y de que Sora y Shiro tengan un sitio al que ir cuando llegan.'],
  ['Izuna Hatsuse', '', 'supporting', '初瀬いづな', 'Miyuki Sawashiro',
    'Uno de los dos hermanos que se hicieron cargo de todo cuando no quedó nadie. Vive en la ciudad de los que fracasaron y es de los pocos que trata a Shiro como lo que es. Aparece en las dos obras y es el único personaje cuya función es exactamente la misma en las dos.'],
  ['Ino Hatsuse', '1', 'supporting', '初瀬いの', 'Hitoshi Myōjin',
    'El hermano mayor de Izuna, el que se quedó con el cargo y el que no pudo con el cuerpo. Solo sale en la serie, y es la razón de que en la película haya un hermano que carga con todo.'],
  ['Riku Dola', '2', 'main', 'リク・ドーラ', 'Yoshitsugu Matsuoka',
    'El hermano mayor de Sora y Shiro, ochocientos años antes, y el que dirige el poblado humano mientras se le cae encima. Es el mismo reparto que tienen sus dos hermanos menores, pero al revés: él decide y juega, ellos hablan y calculan. La película acaba con la decisión que le hace pasar ochocientos años intentando acordarse de todos los que dejó atrás.'],
  ['Couronna Dola', '2', 'supporting', 'コローネ・ドーラ', 'Yōko Hikasa',
    'La hermana mayor de Riku y la que dirige el poblado después de que él ya no pueda. Se sacrifica en la partida que cierra la guerra, y ese sacrificio es lo que ochocientos años después explica por qué la familia Dola tiene a Sora y Shiro.'],
  ['Schwi Dola', '2', 'supporting', 'シュヴィ・ドーラ', 'Ai Kayano',
    'El menor de los Dola de la película. Es quien encuentra a Sora y Shiro ochocientos años antes de que lleguen al mundo, y el único que sabe lo que van a ser. Todo lo que hace la película tiene que ver con que este crío se quede atrapado entre dos guerras.'],
  ['Think Nirvalen', '2', 'supporting', 'シンク・ニルヴァレン', 'Mami Noto',
    'El dios antiguo que lía la guerra y que lleva años siendo una de las dos piezas más fuertes del tablero. La serie no enseña su cara hasta el último capítulo; en la película ya se le ve moverse. Es el mismo personaje que Fiel, en la otra forma que puede tener.'],
  ['Einzig', '2', 'supporting', 'アインツィヒ', 'Junichi Suwabe',
    'El que lleva las cuentas en el bando contrario y el que sabe desde el principio que la guerra se ha perdido. Juega con una lógica que los personajes de esta historia no tienen, y es el motivo de que la película termine como termina.'],
  ['Nonna Zell', '2', 'supporting', 'ノンナ・ツェル', 'Yūka Iguchi',
    'La que dirige a los de su bando y la primera en decir en voz alta lo que todos están pensando. Tiene la presencia que el personaje de la serie de 2014 no tiene, y es el contrapunto directo de Think.'],
  ['Ivan Zell', '2', 'supporting', 'イワン・ツェル', 'Tōru Ōkawa',
    'El más joven de los Zell y el que todavía cree que se puede ganar. Es quien arrastra a los demás a la batalla que no había que librar, y la película cuenta lo que cuesta.'],
  ['Arrei', '2', 'supporting', 'アレイ', 'Kazuyoshi Okitsu',
    'Un combatiente del bando contrario, de los muchos que aparecen en las filas y que existen para que la batalla tenga escala. Es de los pocos con nombre propio.'],
  ['Artosh', '2', 'supporting', '戦神', 'Ryōta Takeuchi',
    'El dios de la guerra de este mundo y una de las razones por las que la guerra de la película se alarga. La wiki en japones lo escribe de otra manera, con otro nombre; es el mismo personaje.'],
];