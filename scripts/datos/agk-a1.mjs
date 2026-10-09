// TEMPORADA 1 - Akame ga Kill! (2014)
//
// t: titulo oficial (Sentai Filmworks, en ingles, via la tabla de
//    Wikipedia)
// jp: titulo japones, tal cual lo escribe la web oficial
// f: fecha de emision en japon
// r: nota de IMDb
// d: resumen de UNA frase, escrito para este catalogo
//
// ── POR QUE LOS TITULOS VAN TRADUCIDOS ────────────────────
//
// Los originales son proposiciones en ingles ("Kill the Darkness"),
// porque todos los titulos de la serie son "cortar algo". Meterlos
// tal cual metia palabras inglesas en las fichas, que es justo lo que
// `comprobar-datos.mjs` avisa. Se traducen, igual que se hizo con
// Mushoku Tensei y con los capitulos de :re de Tokyo Ghoul.
//
// El titulo japones va aparte y sin tocar, que es donde se busca el
// nombre japones del capitulo. Los doce primeros empiezan con 斬る
// ("cortar"), y el 24 es el nombre de la serie entero, sin tilde y con
// exclamacion.

export const A1 = [
  [1, 'Cortar la oscuridad', '闇を斬る', '2014-07-07', 8.1,
   'Tatsumi llega a la capital con dos amigos, se separa de ellos en el camino, le roban la plata y acaba durmiendo en casa de una heredera. Esa noche Night Raid entra en la casa, mata a los padres y él se entera de lo que llevaban dentro.'],
  [2, 'Cortar la autoridad', '権力を斬る', '2014-07-14', 7.6,
   'Leone lo convence de unirse a Night Raid y Najenda explica para qué están ellos ahí. Su primer encargo es un capitán de policía que cobra por dejar matar a quien le pagan. Akame le pasa la mano por encima cuando vuelve, y con eso ya es de los suyos.'],
  [3, 'Cortar la Wadakami', '蟠（ワダカマリ）を斬る', '2014-07-21', 7.4,
   'Le toca entrenar con Mine, que no habla con nadie. De camino ven ejecutar a un hombre por mirar donde no debía, y esa misma noche Night Raid va a por un pariente del primer ministro que rapta mujeres. Mine lo mata desde una ventana y le explica por qué se fue de casa.'],
  [4, 'Cortar a los usuarios de Armas', '帝具使いを斬る', '2014-07-28', 7.8,
   'Najenda explica qué es un Teigu. La misión es un verdugo que ha empezado a decapitar por gusto, y que oye a sus víctimas. Akame lo mata y él le da las gracias.'],
  [5, 'Cortar el sueño', '夢物語を斬る', '2014-08-04', 7.3,
   'Entrena con Sheele, que es torpe para todo menos para matar. Prueba el Teigu del verdugo y no le sirve. En el mercado se cruza con Seryu, la policía nueva que va a matar a Night Raid entero.'],
  [6, 'Cortar la justicia absoluta', '絶対正義を斬る', '2014-08-11', 8.4,
   'Tatsumi y Leone limpian un templo de traficantes de drogas. Mine y Sheele caen en una emboscada de Seryu, que lleva un perro que se come a la gente. Sheele se sacrifica para que Mine escape.'],
  [7, 'Cortar a los tres: parte 1', '三匹を斬る - 前編 -', '2014-08-18', 7.7,
   'Esdeath vuelve del norte exigiendo un marido y manda a las Tres Bestias a matar a un rival político. Night Raid manda a Tatsumi y Bulat contra ellas en un barco de lujo, donde cada una cae de una manera distinta.'],
  [8, 'Cortar a los tres: parte 2', '三匹を斬る - 後編 -', '2014-08-25', 8.3,
   'Liver ahoga el barco entero con su Teigu y Bulat se bate contra él hasta que los dos caen muertos por el mismo veneno. Antes le deja a Tatsumi su armadura y le explica que la muerte es lo único que no se puede esquivar.'],
  [9, 'Cortar al fanático de batalla', '戦闘狂を斬る', '2014-09-01', 7.6,
   'Esdeath forma su propio grupo, los Jaeger, y monta un torneo de pelea en la capital para buscar marido. Tatsumi gana sin saber de quién se trata y Esdeath lo captura esa misma noche.'],
  [10, 'Cortar la tentación', '誘惑を斬る', '2014-09-08', 7.5,
   'Esdeath intenta convencerlo de que se case con ella y él intenta convencerla de lo contrario. Se fuga de nuevo y acaba perdido en el bosque con la armadura de Bulat. Akame aparece, lo rescata y él le cuenta a los demás lo de Esdeath.'],
  [11, 'Cortar al científico loco', 'マッドサイエンティストを斬る', '2014-09-15', 7.8,
   'Un médico con bata encuentra la base de Night Raid con sus bichos modificados. Todos caen envenenados menos Tatsumi, y el doctor se come a sus propios seguidores para convertirse en un monstruo grande. Todos lo matan.'],
  [12, 'Cortar a los recién llegados', '新入りを斬る', '2014-09-22', 7.1,
   'Llegan Chelsea y Susanoo, un Teigu con forma de persona, y Chelsea no para de molestar a Mine. Se explica por qué Chelsea odia a los de Night Raid: era el único superviviente de su equipo.'],
  [13, 'Cortar a los estorbos', '邪魔者を斬る', '2014-09-29', 7.3,
   'Aparecen los bichos mutantes que se le escaparon al Dr. Stylish y Night Raid los caza. De noche, arriba de una montaña, Tatsumi se encuentra con Esdeath.'],
  [14, 'Cortar a la bestia gigante', '巨大危険種を斬る', '2014-10-06', 7.7,
   'El hijo del primer ministro los teletransporta a una isla. Esdeath le cuenta por qué se hizo general y por qué bebe sangre de monstruo: para congelar el norte. Vuelven los dos a la capital y él se esconde antes de que ella lo vea.'],
  [15, 'Cortar a la secta', '教団を斬る', '2014-10-13', 7.5,
   'Una secta pacifista se opone al Imperio y Night Raid va a por Bolic, su segundo, que en realidad trabaja para el primer ministro y droga a los suyos para que no se rebelen.'],
  [16, 'Cortar a las marionetas', '人形を斬る', '2014-10-20', 8.1,
   'Kurome saca ocho marionetas y el combate dura una tarde entera. Leone pierde un brazo, Mine se la traga un sapo gigante y Bols acaba revoleando su lanzallamas hasta que estalla con todos dentro.'],
  [17, 'Cortar la maldición', '呪縛を斬る', '2014-10-27', 8.7,
   'Bols atiende a una niña herida en un bosque sin saber que es Chelsea, que lo apuñala por la espalda y luego la busca a ella. La aguja no le hace nada a Kurome, que le devuelve el favor decapitándola. Al día siguiente aparece su cabeza en un poste.'],
  [18, 'Cortar al demonio', '鬼を斬る', '2014-11-03', 7.7,
   'Cuatro monstruos con cuerpos que se estiran y se endurecen a voluntad defienden al que manda en la secta. Night Raid entra en la ciudad y los mata de uno en uno, y de paso se encuentra con el hombre que la dirige.'],
  [19, 'Cortar el destino', '因縁を斬る', '2014-11-10', 8.3,
   'Festival en palacio. Seryu se queda a solas con Mine y la destruye, pero no puede quitarse la bomba que lleva en la cabeza. Tatsumi la salva de la explosión y ella muere igualmente. Mientras, Akame y Lubbock matan a Bolic, que intentaba huir del palacio.'],
  [20, 'Cortar la carnicería', '修羅を斬る', '2014-11-17', 8.0,
   'En la puerta del palacio aparece el hijo del primer ministro con su unidad de élite. Lubbock lo mata, pero le deja la guardia encima y cae muerto apuñalado en un pozo. El primer ministro condena a Tatsumi a muerte y se lo da a Esdeath.'],
  [21, 'Cortar la desesperación', '絶望を斬る', '2014-11-24', 8.5,
   'Night Raid irrumpe en el coliseo para rescatarlo. Mine se queda sola contra el general más fuerte del Imperio y lo mata, pero muere haciendo venirlo todo. Le da un beso a Tatsumi antes de expirar.'],
  [22, 'Cortar a la hermana menor', '妹を斬る', '2014-12-01', 8.3,
   'Kurome le propone a Akame un duelo en una iglesia. Las dos son las únicas que saben lo que hacen y por eso mismo llevan media serie sin hablarse. Pelean hasta que aparece un monstruo gigante, lo matan juntas y Akame la atraviesa.'],
  [23, 'Cortar al emperador', '皇帝を斬る', '2014-12-08', 8.5,
   'Un niño de la nobleza saca un Teigu del tamaño de un rascacielos y arrasa la ciudad. Tatsumi le habla, no lo puede escuchar, y acaba derribándolo con la armadura de Bulat y muriéndose al hacerlo.'],
  [24, '¡Akame ga Kill!', 'アカメが斬る！', '2014-12-15', 8.7,
   'Esdeath no se rinde aunque el Imperio ya sea tierra quemada, y Akame la mata bebiéndose su propio veneno. Leone encuentra al primer ministro en un pasadizo secreto y le destroza la cara a puñetazos. Y antes de irse, Esdeath congela el cuerpo de Tatsumi y se rompe al lado.'],
];