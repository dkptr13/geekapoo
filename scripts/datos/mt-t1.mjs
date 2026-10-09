// TEMPORADA 1 - Mushoku Tensei
//
// t: titulo oficial de Crunchyroll (via Wikipedia en)
// jp: titulo japones, para el campo de nombre japones
// f: fecha de emision broadcast
// r: nota de IMDb
// d: resumen de UNA frase, escrito para este catalogo
export const T1 = [
  [1, 'Reencarnación sin trabajo', '無職転生', '2021-01-11', 8.4,
   'Un hombre de 34 años sin rumbo muere atropellado al salvar a unos alumnos y despierta reencarnado como un bebé en un mundo de magia.'],
  [2, 'Maestro', '師匠', '2021-01-18', 8.6,
   'A los tres años Rudeus ya lanza hechizos sin recitar, y una maga de la tribu Migurd llega al pueblo para enseñarle.'],
  [3, 'Una amistad', '友達', '2021-01-25', 8.1,
   'Rudeus salva a una niña de pelo verde que unos críos están pegando y le enseña magia; es Sylphiette.'],
  [4, 'Reunión familiar de urgencia', '緊急家族会議', '2021-02-01', 8.1,
   'Zenith anuncia que está embarazada, pero Lilia revela que también lo está y que el padre es Paul.'],
  [5, 'Una señorita y la violencia', 'お嬢様と暴力', '2021-02-08', 8.5,
   'Rudeus llega a Roa como tutor y descubre que su alumna, Eris, golpea a todo el que se le acerca.'],
  [6, 'Un día libre en Roa', 'ロアの休日', '2021-02-15', 7.2,
   'Un día sin clientes Rudeus recorre la ciudad y se cruza con una espadachina de su edad que va borracha.'],
  [7, 'Lo que hay detrás del esfuerzo', '努力の先にあるもの', '2021-02-22', 7.7,
   'Paul vuelve a casa y le enseña a su hijo los tres estilos de espada.'],
  [8, 'Punto de inflexión 1', 'ターニングポイント１', '2021-03-01', 8.6,
   'Sylphiette le revela a Rudeus que es una elfa, y esa verdad reorganiza por completo su vida.'],
  [9, 'Un encuentro casual', '邂逅', '2021-03-08', 7.9,
   'La familia parte al continente mágico en busca de la legendaria maga Roxy.'],
  [10, 'El valor de una vida y el primer trabajo', '人の命と初仕事', '2021-03-15', 7.7,
   'Rudeus busca su primer empleo de verdad y su talento con la tierra le trae un cliente inesperado.'],
  [11, 'Niños y guerreros', '子供と戦士', '2021-03-22', 8.5,
   'Un mercenario propone que Rudeus pelee a muerte por dinero, y el chico descubre que ganar es lo fácil.'],
  [12, 'La mujer de los ojos demoníacos', '魔眼を持つ女', '2021-10-04', 7.7,
   'En Millishion, Rudeus acepta trabajar como ayudante de Elinalise, una elfa que abre puertas a otros mundos.'],
  [13, 'Encuentros fallidos', 'すれ違い', '2021-10-11', 7.4,
   'Roxy aparece en Millishion y el reencuentro con la maestra domina el capítulo.'],
  [14, 'No hay nada gratis', '只より高いものはない', '2021-10-18', 8.2,
   'Geese, Tallhand y Elinalise llevan a Rudeus a las regiones fronterizas donde se reclaman palabras.'],
  [15, 'La vida tranquila en la aldea de Doldia', 'ドルディア村のスローライフ', '2021-10-25', 7.1,
   'Un mes sin que ocurra nada le demuestra a Rudeus que una vida aburrida le pesa más de lo que imaginaba.'],
// La OVA va con numero FRACCIONARIO, y no es un capricho del
  // formato: ocurre entre el 15 y el 16, asi que no hay ningun
  // entero que le corresponda. Renumerar la T1 para meterla entre
  // los dos habria roto los enlaces de la wiki y todas las
  // referencias externas. Ver `numeroDeEpisodioValido`.
  //
  // Se salta el capitulo 16, que es el que emite el 1 de noviembre:
  // es la referencia que da la propia serie (es lo que dice la nota
  // de la OVA en la lista de capitulos de Wikipedia) y ademas
  // encaja con la historia: la pelea entre Rudeus y Paul que
  // divertia a Eris pasa ahi.
  //
  // Sin nota de IMDb: no esta en la lista de episodios de IMDb,
  // porque alli solo cuenta lo que se emitio por television. Se
  // deja en 0, que es como el panel marca "sin nota".
  [15.5, 'Eris la cazadora de goblins', 'エリスのゴブリン討伐', '2022-03-16', 0,
   'La historia vista desde Eris: acepta el encargo de cazar goblins y acaba salvando a Cliff Grimoire, un mago joven que no deja de presumir. Al separarse, ella le pide que proteja en secreto a una niña de la aldea de unos asesinos. Vuelve a casa y encuentra a Rudeus.'],
  [16, 'Riña en la familia', '親子げんか', '2021-11-01', 8.7,
   'Paul, bebido, vuelve a provocar una pelea en casa y se marcha; años después Rudeus entenderá que se equivocó con él.'],
  [17, 'Reencuentro', '再会', '2021-11-08', 9.0,
   'Rudeus se encuentra por fin con Roxy, Zenith y Norn en el camino de Ranoa.'],
  [18, 'Viajes separados', 'それぞれの旅', '2021-11-15', 7.9,
   'La familia se dispersa: Paul se marcha solo y Rudeus entra en la Universidad de Magia de Ranoa.'],
  [19, 'Elegir ruta', 'ルート選択', '2021-11-22', 7.6,
   'Rudeus elige su camino en la universidad y se cruza con un chico que va a ser muy importante para él.'],
  [20, 'El día en que nació mi hermana, la criada', '妹侍女の生まれた日', '2021-11-29', 8.1,
   'Nace Aisha, hija de Lilia y Paul, que entra en la casa como criada.'],
  [21, 'Punto de inflexión 2', 'ターニングポイント２', '2021-12-06', 9.4,
   'Rudeus pide matrimonio a Eris, que se niega a casarse y se marcha al otro lado del continente.'],
  [22, 'Sueños y realidad', '現実（ユメ）', '2021-12-13', 8.6,
   'El capítulo cuenta lo que hizo Eris durante los años en que estuvo fuera, lejos de Rudeus.'],
  [23, 'Despierta y da un paso', '目覚め、一歩、', '2021-12-20', 8.6,
   'Rudeus y Paul se hablan de verdad tras veinte años, y en casa Sylphiette reclama el sitio que hasta ahora era de amiga.'],
];
