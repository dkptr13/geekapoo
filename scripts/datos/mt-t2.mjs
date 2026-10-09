// TEMPORADA 2 - Mushoku Tensei
//
// Mismo formato que mt-t1.mjs. La sinopsis de la temporada va en
// mt-meta.mjs, junto a la de la T1 y la T3.
//
// ── EL CAPITULO 0 ──────────────────────────────────────────────────
//
// La T2 tiene 25 capitulos, no 24. El primero se numera 0.5 y es "Guardian
// Fitz", el especial que se emitio el 2 de julio de 2023, un dia antes que
// el capitulo 1.
//
// Este comentario antes decia que IMDb no lo contaba y que por eso se
// seguian 24 capitulos. Es al reves: IMDb lo tiene como T2.E0 con un 7,1
// sobre unos 2.900 votos, y en Firestore ya estaba (subido por el panel,
// con su imagen). Lo que faltaba era la fila en este fichero, asi que
// cualquier recarga lo borraba o lo duplicaba.
//
// El id del documento lleva un "x" en vez del punto
// (`...-s2-e0x5`), porque Firestore lee el ultimo punto de un nombre de
// documento como separador de extension. El numero DENTRO del documento si
// es 0.5. Ver el comentario de `cargar-anime.mjs`.
//
// El titulo japones de este especial no aparece en la tabla de la
// wikipedia, asi que se deja vacio en vez de inventarlo.
export const T2 = [
  [0.5, 'Fitz el protector', '', '2023-06-03', 7.1,
   'Despues del desastre del teletransporte, Sylphiette llega al palacio del reino de Asura, rescata a la princesa Ariel y adopta la identidad del guardaespaldas mudo Fitz.'],
  [1, 'El mago desilusionado', '失意の魔術師', '2023-07-10', 7.9,
   'Rudeus vive ya como adulto en Millishion, con Sylphiette y su hija Lucy, cuando Paul reaparece en su vida siendo un borracho.'],
  [2, 'El bosque en mitad de la noche', '真夜中の森', '2023-07-17', 7.6,
   'La tensión entre Rudeus y su padre sale a la superficie en unas negociaciones que ninguno de los dos quiere.'],
  [3, 'Acercamiento súbito', '急接近', '2023-07-24', 7.6,
   'Roxy y la veo otra vez en la ciudad, y los preparativos para volver a Ranoa empiezan.'],
  [4, 'Carta de recomendación', '推薦状', '2023-07-31', 7.5,
   'Con una carta en la mano, Rudeus se presenta en la Universidad de Magia de Ranoa como profesor.'],
  [5, 'La Universidad de Magia de Ranoa', 'ラノア魔法大学', '2023-08-07', 7.6,
   'Rudeus da su primera clase y conoce a un alumno prodigio, Zanoba, que vive obsesionado con crear muñecas mágicas.'],
  [6, 'No quiero morir', '死にたくない', '2023-08-14', 7.2,
   'Zanoba muestra sus creaciones con una mezcla de orgullo y de algo que no llega a decir.'],
  [7, 'El secuestro y el encierro de las chicas bestia', '獣族令嬢拉致監禁事件', '2023-08-21', 6.9,
   'Un caso de secuestro saca a Rudeus de la universidad y lo devuelve al mundo de los tabrú, donde se encuentra con Kishirika.'],
  [8, 'El prometido de la desesperación', '絶望の婚約者', '2023-08-28', 7.2,
   'Kishirika le explica a Rudeus quién es él y le impone un compromiso que no esperaba.'],
  [9, 'La máscara blanca', '白い仮面', '2023-09-04', 8.2,
   'Un enmascarado aparece en Ranoa y pone a Rudeus en una situación que no sabe cómo resolver.'],
  [10, 'Estos sentimientos', 'この気持ち', '2023-09-11', 7.3,
   'Lo que Rudeus siente por alguien de su edad le obliga a ordenar sus prioridades.'],
  [11, 'Para ti', 'あなたへ', '2023-09-18', 7.9,
   'Una carta, una distancia y una decisión que Rudeus toma por los dos.'],
  [12, 'Quiero decírtelo', '伝えたい', '2023-09-25', 8.1,
   'Rudeus le dice a Roxy lo que llevaba tiempo guardándose.'],
  [13, 'Mi casa de sueños', '夢のマイホーム', '2024-04-08', 7.3,
   'La vida doméstica en Millishion vuelve a ser el centro: Roxy, Sylphiette y la niña pequeña.'],
  [14, 'La boda', '披露宴', '2024-04-15', 7.4,
   'Se celebra la boda entre Rudeus y Roxy, y el día se tuerce para alguien de la familia.'],
  [15, 'A lo lejos', '遥か', '2024-04-22', 7.9,
   'Alguien que llevaba mucho tiempo lejos vuelve a estar al alcance.'],
  [16, 'Norn y Aisha', 'ノルンとアイシャ', '2024-04-29', 7.6,
   'Las dos hermanas de Rudeus cruzan palabras por primera vez en años.'],
  [17, 'Los sentimientos de mi hermano mayor', '兄貴の気持ち', '2024-05-06', 8.7,
   'Rudeus habla con Paul como hermano, y esa conversación le cambia las dos casas.'],
  [18, 'Punto de inflexión 3', 'ターニングポイント3', '2024-05-13', 7.9,
   'La tensión entre Rudeus y Paul llega a un punto del que ya no se puede volver atrás.'],
  [19, 'Viaje por el desierto', '砂漠の旅', '2024-05-27', 7.7,
   'Rudeus lleva a Aisha a un lugar peligroso, y el viaje les obliga a entenderse.'],
  [20, 'Entrar en el laberinto', '迷宮入り', '2024-06-03', 8.0,
   'El viaje acaba dentro del laberinto de Ranoa, y las copias de seguridad de Aisha dejan de estar a salvo.'],
  [21, 'Los círculos mágicos del sexto estrato', '第六階層の魔法陣', '2024-06-10', 8.1,
   'En lo profundo del laberinto, Rudeus se enfrenta a algo que su magia no explica.'],
  [22, 'Padres', '親', '2024-06-17', 9.3,
   'Rudeus descubre una verdad sobre su padre que lleva toda la vida buscando y que nunca quiso oír.'],
  [23, 'Volvamos a casa', '帰ろう', '2024-06-24', 7.2,
   'Todo el mundo vuelve a Millishion, y la vida cambia para siempre.'],
  [24, 'La sucesión', '嗣ぐ', '2024-07-01', 7.8,
   'Nace un hijo de Rudeus y Eris, que ya no son solo novios: la familia Greyrat cambia de nombre.'],
];
