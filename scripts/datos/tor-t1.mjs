// TEMPORADA 1 - Toradora! (2008)
//
// Formato: [numero, titulo, titulo japones, fecha, nota IMDb, resumen]
//
// Veinticinco capitulos, del 2 de octubre de 2008 al 26 de marzo de 2009, en
// J.C.Staff, con direccion de Tatsuyuki Nagai.
//
// ── LOS TRES FUENTES, Y POR QUE LOS TITULOS JAPONESES SALEN DE LA WIKI ─
//
// Los capitulos tienen tres fuentes posibles y aqui se usa una para cada
// cosa:
//
//   · Titulo japones: la wiki en japones, apartado 各話リスト.
//   · Fecha: deducida del dia de emision, no copiada.
//   · Nota: IMDb.
//
// De los titulos, ademas, se han leido los resumenes de TVDB, que estan
// en japones y sirven para escribir el texto en espanol de este
// catalogo.
//
// ── POR QUE HACE FALTA COMPROBAR CON TRES ───────────────────────────
//
// Se podria pensar que da igual porque los tres coinciden. No coincidian.
//
// Una version anterior de este fichero tenia veinte de los veinticinco
// titulos japoneses mal escritos, y se vio al intentar emparejar las
// miniaturas de capitulo con TVDB. Estaban puestos a ojo a partir del
// romaji de IMDb, y a ojo es facil:
//
//   IMDb dice "Tora to Ryû" y se escribio ドラゴンと竜, que es "Dragon y
//   dragon". El titulo real es 虎と竜: "Tigre y dragon". El simbolo se lee
//   mal por el camino.
//
//   IMDb dice "Pûru biraki" y se escribio プール開き. El real es
//   プールびらき, con hiragana al final.
//
//   IMDb dice "Kimi no iru keshiki" y se escribio 君がいる顔, que es otra
//   frase distinta: "la cara en la que estas".
//
// Que los tres lean lo mismo no es casualidad: es lo que hace que un
// error se vea. Con una sola fuente, un titulo mal escrito parece que la
// fuente esta incompleta. Con tres, se ve enseguida que el error es mio.
//
// ── LAS FECHAS ─────────────────────────────────────────────────────
//
// La ficha de la serie dice que en Kanto se emitio del 2 de octubre de
// 2008 al 26 de marzo de 2009, los jueves a la 1:20, que es la madrugada
// del miercoles anterior. Veinticinco jueves seguidos darian veintiseis
// capitulos, con lo que uno sobra: el 1 de enero de 2009 no habia cadena.
// Quitandolo salen veinticinco, y el ultimo cae el 26 de marzo, que es lo
// que dice la ficha.
//
// Ni IMDb ni TVDB sirven aqui, y por motivos distintos:
//
//   · IMDb fecha el capitulo 1 el 30 de septiembre de 2008. Cuenta el
//     previo por la tarde en Estados Unidos, que va antes que la emision
//     en Japon.
//
//   · TVDB fecha los capitulos en dia habil. A la 1:20 de un jueves se
//     esta todavia en la madrugada del miercoles, y TVDB fecha la
//     madrugada.
//
// Las dos estan "cerca" y las dos estan mal para este catalogo, que
// guarda la fecha de emision en Japon.
//
// ── LAS NOTAS ─────────────────────────────────────────────────────
//
// IMDb, capitulo a capitulo, de la serie tt1279024. La media de los 25 da
// 8,0.
//
// ── QUE ES ESTA SERIE ──────────────────────────────────────────────
//
// Dos adolescentes que se odian. Ryuuji le ha roto la cara al hermano
// menor de Taiga, y Taiga le contesta rompiendole a el una. A partir de
// ahi los dos se apoyan el uno al otro sin que ninguno lo reconozca, y
// ese es el mecanismo de la serie entera: todo lo que hacen por el otro lo
// hacen diciendo que no lo hacen por el otro.
//
// Taiga es la Tiger, el lado malo de una casa a la que va al colegio
// porque le sale mas barato que hacerlo aposta. Ryuuji es el presidente del
// estudiantil, el chico que lo tiene todo bien y que no sabe enjoyedlo.
//
// Los dos mintieron en el capitulo 9. Todo lo que viene despues son las
// consecuencias de haber liedido.

export const T1 = [
  [1, 'Tigre y dragon', '虎と竜', '2008-10-02', 7.2,
'Ryuuji ve a Minori en el curro y se queda con las ganas de volver. Al dia siguiente Taiga le lleva a verla y de paso se encuentra con ella trabajando. Se queda a ayudarle, casi a solas, y se pasan el rato en un sitio cerrado. Minori, que es la chica mas alegre del mundo, no parece dartele ninguna cuenta de lo que pasa por ahi.'],

  [2, 'Ryuuji y Taiga', '竜児と大河', '2008-10-09', 7.7,
   'Taiga ha empezado a desayunar en casa de Ryuuji con su madre, y eso ya es una costumbre. Kitagawa le pide a Ryuuji que haga de puente entre ella y Taiga. Ryuuji monta un plan y Taiga no lo sigue ni a la primera. Lo que sale de ahi es un rumor que no queria: que los dos estan juntos, y ese rumor es justo lo que hace que se malinterpreten entre ellos.'],

  [3, 'Tu canción', '君の歌', '2008-10-16', 7.3,
   'Ryuuji ve a Minori trabajando en el curro y se queda con las ganas de volver. Al dia siguiente Taiga le lleva a verla y de paso le ayuda en el trabajo. Se quedan casi a solas en el almacen y se les va la hora sin querer. Minori, que es la chica mas alegre del mundo, no parece darse cuenta de nada. Ryuuji, si.'],

  [4, 'La cara de entonces', 'あのときの顔', '2008-10-23', 7.6,
   'El album de Taiga esta lleno de fotos de Kitagawa y en todas se ve el mismo borron. Ryuuji se ofrece a hacerla las fotos, pero entonces la ve con otras chicas de clase y se pone insoportable. Le arrebata la camara, dispara ella sola, y entonces Ryuuji entiende por que todas sus fotos salen movidas: no es que el las sacase mal.'],

  [5, 'Ami Kawashima', 'かわしまあみ', '2008-10-30', 7.8,
   'Ryuuji va al restaurante a ver a Minori y no esta. Ahi se encuentra con Ami, una modelo que no es tan tonta como parece y se hace la buena con todo el mundo. Se queda a solas con Taiga y cambia de cara: sale el otro lado, el que tiene mala leche. Al dia siguiente Ami se presenta en la clase. El capitulo lleva su nombre porque es el que la mete en el grupo.'],

  [6, 'El yo de verdad', 'ほんとの自分', '2008-11-06', 8.0,
'Ami llega corriendo a pedir ayuda: la estan siguiendo y no tiene donde meterse. Taiga la esconde en su piso. Y ahi esta la frase que explica el capitulo entero: Ami dice que no tiene ninguna intencion de enseñar quien es de verdad. Taiga, en vez de echarla, se hace su amiga, porque se lo acaba de pedir Kitagawa. Esa amistad falsa esta debajo de todo lo que pasa despues.'],

  [7, 'Apertura de la piscina', 'プールびらき', '2008-11-13', 7.6,
   'Empieza el verano y con el la piscina del instituto. Taiga no se atreve a meterse al agua delante de Kitagawa, y el motivo es una cosa que el resto del grupo no sabe. Ryuuji le resuelve el problema y a ella le parece un mundo. Lo que no estaba en el plan es lo que hace Ami en cuanto la ve aparecer.'],

  [8, 'Por quien', 'だれのため', '2008-11-20', 8.1,
   'Antes de vacaciones Ami quiere llevarse a Ryuuji a su casa de campo. Taiga no lo permite, y encima Minori propone un reto, que es el sport que mejor se le da a Ami. Taiga se entrena hasta la extenuacion, y lo esta haciendo por Ryuuji. El problema es que nadie le ha dicho que sea por el.'],

  [9, 'Vamos al mar contigo', '海にいこうと君は', '2008-11-27', 8.1,
   'El reto de natacion acaba en humillacion y la casa de campo es para cuatro. Ryuuji gana la apuesta y monta un plan ridiculo: asustar a Minori para lucirse y que le este agradecida. Taiga, que es quien lo ha propuesto, lo ejecuta entero. Y es el capitulo en el que los dos empiezan a mentir el uno por el otro.'],

  [10, 'Fuegos artificiales', '花火', '2008-12-04', 7.9,
   'En la casa de campo el plan se tuerce: lo que iba a asustar a Minori acaba asustando a todos, y cuando por fin parece que va a salir bien aparece algo que no ha preparado nadie. Ryuuji aguanta el tipo. El capitulo se cierra con el mar de fondo y los dos entendiendo que lo de ellos ya no es un juego.'],

  [11, 'Festival cultural, primera parte', '大橋高校文化祭【前編】', '2008-12-11', 7.7,
   'Se acerca el festival del instituto y la clase organiza la peor cosa posible para la reputacion de todos. Ami, que esta en la organizacion, elige a Taiga para el concurso. Y en el peor momento posible aparece el padre de Taiga, que dice querer vivir con ellos. El capitulo se cierra con la noticia y con Taiga sin saber que hacer.'],

  [12, 'Festival cultural, segunda parte', '大橋高校文化祭【中編】', '2008-12-18', 7.7,
   'Taiga intenta por las buenas que su padre entre en casa. El problema es que Minori se entera y monta un taco, porque para ella ese hombre no es el padre de Taiga. Ryuuji se enfada de verdad con ella y los dos acaban discutiendo a gritos. Dos dias antes del festival, con el grupo entero mirando.'],

  [13, 'Festival cultural, ultima parte', '大橋高校文化祭【後編】', '2008-12-25', 8.3,
   'El padre va a ver el espectaculo y Taiga le pide a Ami que la deje hacer de protagonista una sola vez. Al final no hace falta, porque llega un correo a la otra parte. Lo que se resuelve aqui no es lo que Taiga quiere, sino lo que Ryuuji puede aguantar. Es el mejor capitulo del tramo.'],

  [14, 'El tigre de la felicidad', 'しあわせの手乗りタイガー', '2009-01-08', 7.8,
   'Vuelta a la rutina tras el festival, y por el instituto corre un rumor: si tocas a Taiga, te Sale bien. El rumor no dice nada del padre, nada de la madre y nada de la casa. Solo dice lo que a la gente le interesa oir, y Taiga se convierte en un amuleto con piernas.'],

  [15, 'Las estrellas estan lejos', '星は、遠く', '2009-01-15', 7.5,
   'Elecciones de la asociacion de estudiantes. En la clase todos dan por hecho que se presentara Kitagawa, y Kitagawa no se quiere presentar, siendo la unica que puede ganar. Al dia siguiente aparece con el pelo rubio y el despacho del profesor lleno de gente preguntandole. Para empujarla, Taiga se ofrece como candidata, y sale de candidata la que no deberia.'],

  [16, 'Un paso adelante', '踏みだす一歩', '2009-01-22', 8.6,
   'Taiga aguanta el papel de candidata solo para que Kitagawa tenga algo contra lo que luchar. Ryuuji sube a la nieve a buscarla donde se ha quedado sola, y lo que encuentra es un problema peor que el que queria resolver: que Kitagawa se esta deshaciendo por dentro y no es por lo que parece. Uno de los mejores capitulos de la serie.'],

  [17, 'En Navidad Mercurio retrocede', 'クリスマスに水星は逆行する', '2009-01-29', 7.5,
   'Kitagawa se recupera, gana las elecciones y organiza la fiesta de Navidad. Taiga se ofrece a hacer de cupido, porque ha decidido que esas semanas va a portarse bien. El problema es el otro: Minori no esta. Y lo raro no es que no venga, sino que parece haber decidido no volver a hablar con Ryuuji.'],

  [18, 'Bajo el arbol de cedro', 'もみの木の下で', '2009-02-05', 7.8,
   'Preparativos de la fiesta y una pregunta que Taiga lanza sin querer: donde estaba Minori. Ryuuji no lo sabe, y se da cuenta de que lleva semanas sin fijarse. Todo lo que la serie ha dicho de los dos por encima se cuenta aqui entero, y en un capitulo de preparativos de una fiesta de navidad.'],

  [19, 'La fiesta de la noche', '聖夜祭', '2009-02-12', 8.9,
   'Taiga baja a por Minori, que no ha venido, y le explica a Ryuuji lo que lleva semanas viendo y no queria ver: que Minori no esta caprichada ni un poco. Es el capitulo con mejor nota de la temporada y con motivo. Lo que cuenta va de lo que prometen en el instituto y del precio de cumplirlo. Pocas veces Taigu esta tan bien escrita como aqui.'],

  [20, 'Siempre, tal cual', 'ずっと、このまま', '2009-02-19', 7.8,
   'Minori rechaza a Ryuuji. Taiga, que cree que ha sido por su culpa, empieza a apartarse, que es justo lo contrario de lo que deberia hacer. El capitulo va de esa tonteria por debajo y del viaje, y Ryuuji termina decidiendo algo: si el otro no va a decirlo, lo dice el otro.'],

  [21, 'Dijiste lo que quisiste', 'どうしたって', '2009-02-26', 8.8,
   'Viaje de estudios a la nieve, con el grupo haciendo lo de siempre: Taiga pegada a Kitagawa y el resto tomando nota. Todo revienta cuando Minori se marcha sola al monte y desaparece. Uno de los picos de la serie. Lo que Taiga le dice a Ryuuji es la primera vez que los dos hablan de verdad, y lo que pasa despues no lo espera ni el que lo escribe.'],

  [22, 'El paisaje donde estas', '君のいる景色', '2009-03-05', 8.0,
   'Taiga sale del monte herida y se pasa unos dias en casa de su madre de verdad, que es justo el sitio al que no queria volver. Ryuuji va a buscarla, y del otro lado lo que pasa es que su madre se ha puesto a trabajar de mas para pagarle los estudios. El paisaje del titulo es el del telefono: los dos viendo lo mismo desde orillas opuestas.'],

  [23, 'El camino que hay que recorrer', '進むべき道', '2009-03-12', 8.6,
   'Taiga vuelve al instituto y lo primero que se entera es que la madre de Ryuuji esta en el hospital por trabajar de mas. El capitulo va de ahi: dos crios llevandose la culpa de decisiones que han tomado los adultos, sin saber todavia que eran suyas. Y se cierra el dia de San Valentin, que es el peor dia posible para tener esa conversacion.'],

  [24, 'Confesion', '告白', '2009-03-19', 8.8,
   'Taiga se marcha sin decir nada y luego se da cuenta de que eso es peor que decirlo. Le pide a Ryuuji que no la deje huir. Lo que viene despues es la confesion: el capitulo que mucha gente ve por lo que es y que luego resulta ser la escena mas pequena y mas prudente de toda la serie. Y encima, en el momento menosoportuno, aparecen las dos madres.'],

  [25, '¡Toradora!', 'とらドラ！', '2009-03-26', 8.7,
   'El final de la primera temporada. Lo que habia pasado en la playa vuelve a pasar aqui pero con todos delante, y por eso termina de otra forma. La serie no acaba: deja abierta la pregunta mas grande y se va.'],
];