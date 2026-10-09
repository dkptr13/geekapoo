// TEMPORADA 1 - Ataque a los Titanes (2013, WIT Studio)
//
// Formato de cada fila:
//   [numero, titulo, titulo japones, fecha, nota de IMDb, resumen]
//
// ── LOS NUMEROS ───────────────────────────────────────────
//
// Es la primera de las siete temporadas del catalogo, y la unica con
// capitulos que no son 1, 2, 3... porque aqui caen los ocho extras de
// DVD. Se numeran con los valores que les da la propia Wikipedia, que
// los coloca por su posicion en la serie:
//
//   0.5 y 0.6    No Regrets 1 y 2        (All 0.5A y 0.5B)
//   0.75         En un mundo cruel
//   3.25         El visitante inesperado  (el 3.252)
//   3.5          El cuaderno de Ilse     (el 3.51)
//   3.75         La dificultad            (el 3.753)
//   16.5 y 16.6  Adiós, Muro Sina 1 y 2   (los 16.5A y 16.5B)
//
// Los tres primeros van ANTES del capitulo 1 porque su historia es
// anterior a la serie: "No Regrets" son los dos capitulos de Levi en
// el Subsuelo, y "En un mundo cruel" es la infancia de Mikasa y Eren.
// Esos tres llevan un numero puesto por el catalogo (0.6 y 0.75),
// porque Wikipedia no les da ninguno.
//
// Los de 3.25, 3.5 y 3.75 van entre el 3 y el 4 porque su historia
// ocurre durante el mismo adiestramiento del cuerpo 104. Los de 16.5
// y 16.6 van entre el 16 y el 17 porque ocurre justo antes de la
// 57.ª expedicion, que es el capitulo 17.
//
// ── LA NUMERACION DE CRUNCHYROLL ──────────────────────────
//
// Los 25 capitulos de television de aqui son E1 a E25 de Crunchyroll,
// que numera la serie entera de forma continua. La temporada 2 del
// catalogo son las E26 a E37, y asi hasta que la septima son las E88
// a E94.
//
// ── LOS TITULOS ───────────────────────────────────────────
//
// Traduccion fiel de los titulos oficiales en ingles que da
// Wikipedia. No son las cadenas literales de Crunchyroll: los suyos en
// castellano son mas cortos ("El titán bestia") y no estan publicados
// en ninguna pagina consultable de una vez.
//
// ── LAS NOTAS ─────────────────────────────────────────────
//
// De IMDb, leidas una a una. Los ocho extras van en 0 porque IMDb no
// los lista: nunca se emitieron por television. Un 0 aqui significa
// "sin nota", no "mala", y `cargar-anime.mjs` los deja fuera de la
// media de la temporada por eso.
//
// ── LAS FECHAS ────────────────────────────────────────────
//
// De Wikipedia, no de IMDb. Se emite en Japon a las 24:00, y IMDb
// fecha el dia anterior por ese convenio.

export const A1 = [
  [0.5, 'No Regrets: Parte 1', '悔いなき選択 (前編)', '2014-12-09', 0,
   'Extra de DVD. Levi, con sus dos compañeros de robos, vive en el Subsuelo y acepta un encargo que lo lleva a chocar con el cuerpo de exploración.'],
  [0.6, 'No Regrets: Parte 2', '悔いなき選択 (後編)', '2015-04-09', 0,
   'Extra de DVD. La misión resulta ser un encargo de asesinar a Erwin Smith, y la tormenta en la que Levi emboscó le deja la duda de toda su vida.'],
  [0.75, 'En un mundo cruel', '', '2018-08-09', 0,
   'Extra de DVD. Mikasa despierta en una versión de su vida en la que sus padres no mueren, y ve lo que habría sido de Eren y de ellos dos.'],
  [1, 'A ti, en 2.000 años: La caída de Shiganshina, parte 1', '二千年後の君へ ―シガンシナ陥落①―', '2013-04-07', 9.2,
   'La aldea de Shiganshina lleva cien años detrás de un muro, y el día que ese muro se abre la vida de un chico cambia para siempre.'],
  [2, 'Ese día: La caída de Shiganshina, parte 2', 'その日 ―シガンシナ陥落②―', '2013-04-14', 8.5,
   'Eren ve morir a su madre en la boca de un titán, y su padre le hace una promesa que todavía no sabe lo que cuesta.'],
  [3, 'Una luz apagada en la desesperación: El regreso de la humanidad, parte 1', '絶望の中で鈍く光る ―人類の再起①―', '2013-04-21', 8.1,
   'Cinco años después, Eren descubre que tiene un poder que no sabía que tenía, y decide que no lo va a desperdiciar.'],
  [3.25, 'El visitante inesperado: La cruel maldición de la juventud', '突然の来訪者 ―苛まれる青春の呪い―', '2014-04-09', 0,
   'Extra de DVD. Jean vuelve a su aldea y compite con Sasha en un concurso de cocina; su madre le deja una tortilla en el fiambre.'],
  [3.5, 'El cuaderno de Ilse: Memorias de un miembro del cuerpo de exploración', 'イルゼの手帳 ―ある調査兵団員の手記―', '2013-12-09', 0,
   'Extra de DVD. Encuentran dentro de un árbol el cuerpo decapitado de una soldado y su cuaderno, la primera prueba de que un titán puede hablar.'],
  [3.75, 'La dificultad', '困難', '2014-08-08', 0,
   'Extra de DVD. En el ejercicio de supervivencia del cuerpo 104 unos ladrones se llevan a Christa, y el grupo tiene que rescatarla.'],
  [4, 'La noche de la ceremonia de despedida: El regreso de la humanidad, parte 2', '解散式の夜 ―人類の再起②―', '2013-04-28', 8.6,
   'Eren dice en voz alta que quiere el cuerpo de exploración, y Shadis lo pone a prueba delante de toda la clase.'],
  [5, 'Primera batalla: La lucha por Trost, parte 1', '初陣 ―トロスト区攻防戦①―', '2013-05-05', 9.3,
   'Los titanes entran en Trost por el hueco que dejó el colosal, y la ciudad entera se convierte en un frente.'],
  [6, 'El mundo que vio la chica: La lucha por Trost, parte 2', '少女が見た世界 ―トロスト区攻防戦②―', '2013-05-12', 8.9,
   'Mikasa descubre de dónde le sale la fuerza, mientras un comerciante se niega a apartar su carro y deja a los vecinos atrapados.'],
  [7, 'La hoja más pequeña: La lucha por Trost, parte 3', '小さな刃 ―トロスト区攻防戦③―', '2013-05-19', 8.9,
   'El sargento Nico se repliega a la ciudadela, y Mikasa se encuentra de golpe con la verdad sobre Marco.'],
  [8, 'Latido de su corazón: La lucha por Trost, parte 4', '心臓の鼓動が聞こえる ―トロスト区攻防戦④―', '2013-05-26', 9.2,
   'Eren sella el hueco del muro, pero un titán se lo traga. Lo que pasa después ya no se puede deshacer.'],
  [9, 'El paradero de su brazo izquierdo: La lucha por Trost, parte 5', '左腕の行方 ―トロスト区攻防戦⑤―', '2013-06-02', 8.8,
   'Los titanes vuelven a entrar en Trost, y el cuerpo de exploración tiene que decidir a quién se lleva y a quién deja.'],
  [10, 'La respuesta: La lucha por Trost, parte 6', '応える ―トロスト区攻防戦⑥―', '2013-06-09', 8.3,
   'El frente se reorganiza, y el coste de lo que queda por hacer se mide en compañeros que no vuelven.'],
  [11, 'Ídolo: La lucha por Trost, parte 7', '偶像 ―トロスト区攻防戦⑦―', '2013-06-16', 8.3,
   'Sasha se convierte sin querer en la cara de una operación que Mikasa está haciendo por su cuenta.'],
  [12, 'Herida: La lucha por Trost, parte 8', '傷 ―トロスト区攻防戦⑧―', '2013-06-23', 8.3,
   'Eren se topa con el escuadrón perdido de Mikasa, y la decisión de atacar o retirarse deja de ser suya.'],
  [13, 'Deseo primitivo: La lucha por Trost, parte 9', '原初的欲求 ―トロスト区攻防戦⑨―', '2013-06-30', 9.0,
   'Trost se recupera y Armin se atreve por fin a decir en voz alta lo que quiere hacer con su vida.'],
  [14, 'Todavía no puedo mirar sus ojos: La víspera de la ofensiva, parte 1', 'まだ目を見れない ―反撃前夜①―', '2013-07-14', 8.5,
   'El cuerpo de exploración se reúne para el regreso, y hay que decidir quién sale a la 57.ª expedición y quién se queda.'],
  [15, 'Escuadra de operaciones especiales: La víspera de la ofensiva, parte 2', '特別作戦班 ―反撃前夜②―', '2013-07-21', 8.1,
   'Levi forma su escuadra de élite con cuatro soldados de historial difícil, entre ellos una capitana que no se quita de la cabeza.'],
  [16, 'Lo que hay que hacer ahora: La víspera de la ofensiva, parte 3', '今、何をすべきか ―反撃前夜③―', '2013-07-28', 8.2,
   'Historia se enfada con Eren por una broma sobre su familia, y deja de hablarle durante el resto de la serie.'],
  [16.5, 'Adiós, Muro Sina: Parte 1', '', '2017-12-09', 0,
   'Extra de DVD. Annie, en la policía militar, investiga la desaparición de una chica rica y encuentra un cuerpo donde no debería haberlo.'],
  [16.6, 'Adiós, Muro Sina: Parte 2', '', '2018-04-09', 0,
   'Extra de DVD. Annie tapa lo que ha encontrado y acepta el encargo de infiltrarse en la expedición que viene a por Eren.'],
  [17, 'La titán hembra: La 57.ª expedición exterior, parte 1', '女型の巨人 ―第57回壁外調査①―', '2013-08-04', 9.1,
   'La expedición 57 sale por fin, y en el bosque aparece una titán que se mueve con una velocidad que nadie había visto.'],
  [18, 'El bosque de los árboles gigantes: La 57.ª expedición exterior, parte 2', '巨大樹の森 ―第57回壁外調査②―', '2013-08-11', 8.9,
   'La escuadra de Levi se encuentra con la titán hembra en un claro, y lo que ocurre ahí está entre las escenas más oscuras de la serie.'],
  [19, 'Mordisco: La 57.ª expedición exterior, parte 3', '噛み付く ―第57回壁外調査③―', '2013-08-18', 8.9,
   'El cuerpo de exploración pierde a casi todos sus efectivos y tiene que reagruparse en el bosque antes de volver a casa.'],
  [20, 'Erwin Smith: La 57.ª expedición exterior, parte 4', 'エルヴィン・スミス ―第57回壁外調査④―', '2013-08-25', 9.1,
   'Erwin admite que sabía desde el principio que había un traidor en la expedición, y Levi le pide cuentas.'],
  [21, 'Golpe demoledor: La 57.ª expedición exterior, parte 5', '鉄槌 ―第57回壁外調査⑤―', '2013-09-01', 9.6,
   'Los supervivientes no llegan a la muralla, y la operación de rescate se convierte en una retirada.'],
  [22, 'Los vencidos: La 57.ª expedición exterior, parte 6', '敗者達 ―第57回壁外調査⑥―', '2013-09-08', 9.1,
   'Armin reconoce en la chica rubia de su clase a alguien que nunca debió ver, y lo que eso significa le cae encima entero.'],
  [23, 'Sonrisa: El asalto a Stohess, parte 1', '微笑み ―ストヘス区急襲①―', '2013-09-15', 9.0,
   'Un año después, en el distrito de Stohess, Eren y la titán hembra destrozan la ciudad en una sola noche.'],
  [24, 'Misericordia: El asalto a Stohess, parte 2', '慈悲 ―ストヘス区急襲②―', '2013-09-22', 9.2,
   'Erwin obliga a Emiline a seguir manejando a los titanes mientras la ciudad termina de caer.'],
  [25, 'Muro: El asalto a Stohess, parte 3', '壁 ―ストヘス区急襲③―', '2013-09-29', 9.4,
   'Eren consigue cerrar el muro de Trost, y la primera temporada termina con un cuerpo de exploración que ya no sabe qué está defendiendo.'],
];
