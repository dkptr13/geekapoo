// PERSONAJES - Psycho-Pass
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// '' = sale en las siete temporadas; el resto lleva la lista de las
// suyas: Kamui y Togane solo están en la T2, y Arata, Kei y Homura
// entran en la T5.
//
// Nombres, kanji y voces vienen de AniList (fichas 13601, 20513,
// 20514, 102649, 104382, 104990, 108307, 113917 y 153687). Makishima,
// Kamui y Azusawa van como antagonistas, que es su papel en la
// historia aunque AniList los liste como principales.
//
// Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Shinya Kougami", "", "main", "狡噛慎也", "Tomokazu Seki",
   "Ejecutor de la División 1 y antiguo inspector degradado por cazar a Makishima. Intuitivo, salvaje y leal a su manera; deja el cuerpo, se hace mercenario y vuelve cuando hace falta. La conciencia de Akane."],

  ["Akane Tsunemori", "", "main", "常守朱", "Kana Hanazawa",
   "Inspectora novata que salva a Kogami en su primer día y ya no suelta el caso. De idealista a la única que le planta cara a Sibyl sin que se le nuble el color. El centro moral de la serie."],

  ["Nobuchika Ginoza", "", "main", "宜野座伸元", "Kenji Nojima",
   "Inspector estricto, hijo de Masaoka, que desprecia a los ejecutores hasta que la muerte de su padre lo degrada a uno. Reconstruido como ejecutor serio y eficaz, la mano derecha de Akane."],

  ["Shougo Makishima", "1,3,4", "antagonist", "槙島聖護", "Takahiro Sakurai",
   "Criminal asintomático al que Sibyl no mide: lee, cita y mata por aburrimiento filosófico. Manipula asesinos para demostrar que el sistema es una jaula. El rival de Kogami."],

  ["Tomomi Masaoka", "1,4", "main", "征陸智己", "Kinryuu Arimoto",
   "Ejecutor veterano, exdetective y padre de Ginoza. El contrapeso amable de la unidad; muere parando a Makishima cuando este atenta contra su hijo."],

  ["Shuusei Kagari", "1,4", "supporting", "縢秀星", "Akira Ishida",
   "Ejecutor joven, criminal latente desde niño, bromista y valiente. Descubre la verdad de Sibyl siguiendo a un cómplice y lo eliminan por saber demasiado."],

  ["Yayoi Kunizuka", "", "supporting", "六合塚弥生", "Shizuka Itou",
   "Ejecutora serena, exmúsica marcada por un pasado terrorista. Analista de campo fiable en todas las etapas; en la tercera es periodista y documenta a la unidad nueva."],

  ["Shion Karanomori", "", "supporting", "唐之杜志恩", "Miyuki Sawashiro",
   "Analista del laboratorio, lengua afilada y mente más afilada. Sus programas y sus hologramas salvan a la unidad más de una vez; presencia constante hasta el final."],

  ["Mika Shimotsuki", "", "main", "霜月美佳", "Ayane Sakura",
   "Inspectora joven y rígida que desconfía de Akane y adora el reglamento. Crece a golpes: la trilogía la pone al frente y la tercera la deja al mando de la División."],

  ["Kirito Kamui", "2", "antagonist", "鹿矛囲桐斗", "Ryouhei Kimura",
   "Antagonista de la segunda temporada: un colectivo de siete cerebros en un cuerpo, invisible para Sibyl. Siembra el «¿de qué color?» para obligar al sistema a juzgarse a sí mismo."],

  ["Sakuya Togane", "2", "main", "東金朔夜", "Keiji Fujiwara",
   "Inspector de la División 1 en la segunda temporada, fabricado para ser el ejecutor perfecto. Su fijación con Akane esconde el plan de su madre por teñirla de negro."],

  ["Sho Hinakawa", "2,3,4,5,6,7", "supporting", "雛河翔", "Takahiro Sakurai",
   "Ejecutor tímido, genio de los hologramas y las redes. Entra en la segunda y ya no sale: su apoyo técnico sostiene a la unidad hasta Providence."],

  ["Teppei Sugou", "", "main", "須郷徹平", "Hiroki Touchi",
   "Ejecutor de pocas palabras, expiloto militar. Su pasado con el escuadrón perdido lo persigue; la trilogía cuenta cómo acabó en Seguridad Pública."],

  ["Jouji Saiga", "1,2,7", "supporting", "雑賀譲二", "Kazuhiro Yamaji",
   "Criminalista y antiguo profesor, mentor de Akane y de Kogami. Se entrega tras el caso Makishima y sigue perfilando desde dentro hasta que Providence lo mata."],

  ["Joushuu Kasei", "1,3,4,5,7", "supporting", "禾生壌宗", "Yoshiko Sakakibara",
   "Directora de Seguridad Pública: un cuerpo prestado que usa Sibyl para hablar. Fría, calculadora y siempre un paso por delante, hasta que Akane le dispara."],

  ["Arata Shindou", "5,6,7", "main", "慎導灼", "Yuuki Kaji",
   "Inspector de la tercera, con Trazo Mental para revivir lo que vieron otros. Empático hasta el peligro y asintomático para Sibyl, que lo quiere entre sus cerebros."],

  ["Kei Mikhail Ignatov", "5,6,7", "main", "炯・ミハイル・イグナトフ", "Yuuichi Nakamura",
   "Inspector de la tercera, amigo de la infancia de Arata, exmilitar de acción directa. Su sentido de la justicia choca con los métodos de Bifrost y con su propio matrimonio."],

  ["Kouichi Azusawa", "5,6", "antagonist", "梓澤廣一", "Kenyuu Horiuchi",
   "Antagonista de la tercera: congresista de Bifrost, educado y paciente. Apuesta personas como fichas y asalta la sede para abrirle una puerta a Sibyl."],

  ["Shizuka Homura", "5,6,7", "main", "法斑静火", "Mamoru Miyano",
   "Gobernador interino de Tokio y congresista de Bifrost. Juega a dos bandas con Shirogane hasta quedarse con la casa y entregársela a Sibyl para destruirla."],

  ["Frederica Hanashiro", "4,5,6,7", "supporting", "花城フレデリカ", "Takako Honda",
   "Agente de Exteriores al mando de la acción directa. Recluta a Kogami, protege refugiados y acaba coordinando con Akane contra los Peacebreakers."],
];
