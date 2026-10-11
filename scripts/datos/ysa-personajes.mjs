// PERSONAJES - Your Lie in April
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// `temporada`:
//
//   ''  = COMPARTIDO. Sale en todas las temporadas y el array se
//         deja vacio, que es como lo lee la wiki (`seasonIdsDe`):
//         lista vacia significa "esta en todas".
//   1,7 = solo en esas.
//
// Aqui TODOS van con la temporada vacia, y hay que entender por que
// antes de leerlo como un descuido. El anime tiene una sola
// temporada, de modo que "sale en todas" y "sale en la primera" son
// la misma cosa. Poner el 1 explicitamente tambien seria correcto,
// pero el array vacio es lo que significan las demas fichas del
// catalogo cuando no hay nada que matizar, y deja la puerta abierta
// a una hipotetica segunda temporada sin tener que tocar doce filas.
//
// Que un personaje no salga en una parte es lo que hace que la ficha
// no lo muestre en capitulos donde no aparece, asi que la lista
// importa: un array vacio puesto por descuido lo enseña en todas.
//
// `voz` es el seiyuu japones. El campo del proyecto es `voiceActor`
// y no lleva pais, asi que se deja el nombre japones tal cual.
//
// ── EL REPARTO ────────────────────────────────────────────
//
// ── POR QUE NO ESTA KOHARU ──────────────────────────────
//
// La hija pequeña de Hiroko salio de la ficha en octubre de 2026:
// en AniList figura como BACKGROUND, una sola escena, y el criterio
// del catalogo es MAIN + SUPPORTING. Era la unica BACKGROUND con
// voz de la lista (Inori Minase).
//
// Los once de la lista de Wikipedia, que da el seiyuu japones de
// cada uno. Es el reparto completo: no falta nadie con nombre y voz.
//
// Los tres con los que empieza todo van como `main`: Kousei, Kaori y
// Tsubaki. Los otros nueve como `supporting`, incluido Saki, que es
// la madre muerta, presente en toda la serie sin salir nunca en
// escena. Ponerla de `antagonist` seria un error: no se opone a
// nadie, solo organizo la vida de su hijo de punta a punta.
// opone a nadie, simplemente organizo toda la vida de su hijo.

const TODAS = '';

export const PERSONAJES = [
   ['Kōsei Arima', TODAS, 'main', '有馬 公生', 'Natsuki Hanae',
   'El protagonista. Fue prodigio del piano hasta que su madre murio en mitad de un recital y se quedo sin poder oir el piano. Empieza acompanando a otros y acaba siendo el que sostiene la musica entera, sin llegar a tocar nunca con quien de verdad queria.'],
   ['Kaori Miyazono', TODAS, 'main', '宮園 かをり', 'Risa Taneda',
   'La violinista. Llega tarde a todo y toca sin mirar la partitura. Esta enferma desde antes del primer capitulo y lo esconde de todos, y esa es la cuenta atras que arrastra la serie entera: el reloj corre por ella, no por el de nadie mas.'],
  ['Tsubaki Sawabe', TODAS, 'main', '澤部 椿', 'Ayane Sakura',
   'La jugadora de sóftbol. Cree que el mundo es de colores mientras está enamorada y de gris cuando no. Lleva toda la serie queriendo darse a entender con Kaori en el sitio equivocado, y su final es el único cierre feliz que tiene la historia.'],
   ['Ryōta Watari', TODAS, 'supporting', '渡 亮太', 'Ryōta Ōsaka',
   'El futbolista. Amigo de la infancia de Kousei y pareja de Kaori. Es el que va a por Kaori sin saberlo, el que arrastra a Kousei al hospital cuando hace falta y el primero que se da cuenta de que su amigo esta enamorado de la novia de su mejor amigo.'],
   ['Takeshi Aiza', TODAS, 'supporting', '相座 武士', 'Yūki Kaji',
   'El rival del piano. Empezo a tocar porque queria un robot de juguete y acabo siendo el mejor interprete de su generacion. Pasa de rival a casi hermano al final, y su estudio del invierno es de lo mejor que suena en toda la serie.'],
   ['Emi Igawa', TODAS, 'supporting', '井川 絵見', 'Saori Hayami',
   'La otra rival. Lloro oyendo a Kousei tocar de nina y lo tiro todo para poder ser algo, y lleva media serie tocando para el. Su mejor momento es cuando suelta en la musica toda la rabia que le tenia guardada.'],
  ['Nagi Aiza', TODAS, 'supporting', '相座 凪', 'Ai Kayano',
   'La hermana pequeña de Takeshi. Llega de la nada a mitad de serie y de golpe es la única persona con la que Kōsei puede tocar a cuatro manos. Buenísimo como actriz (su sola escena del hospital da más que muchas temporadas enteras de otros animes), pero se le nota el frío al principio.'],
  ['Saki Arima', TODAS, 'supporting', '有馬 早希', 'Mamiko Noto',
   'La madre de Kōsei, que aparece muerta desde el minuto uno. Todo lo que hace la serie con ella es indirecto: una sombra, una carta sin enviar, un modo de tocar. Es la única protagonista que nunca habla y la que más pesa.'],
   ['Hiroko Seto', TODAS, 'supporting', '瀬戸 紘子', 'Mie Sonozaki',
   'La pianista famosa. Amiga de Saki y de la familia de Kaori, y la que le ensena a Kousei a tocar sin el miedo de equivocarse. Tambien acaba siendo profesora de Nagi.'],
   ['Saitō', TODAS, 'supporting', '斎藤', 'Kazuyuki Okitsu',
   'El capitan de antes del softbol, al que Tsubaki admiraba de pequena. Vuelve cuando Tsubaki esta peor y le hace el papel de novio hasta que la deja sin decir nada.'],
  ['Nao Kashiwagi', TODAS, 'supporting', '柏木 奈緒', 'Shizuka Ishigami',
   'La amiga de Tsubaki. La única que ve lo que todos los demás esquivan: que Tsubaki está enamorada de Kōsei y que Kaori está muriendo. No hace nada heroico, pero es la que empuja a los otros a hablar.'],
];
