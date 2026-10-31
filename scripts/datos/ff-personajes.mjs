// PERSONAJES - Fire Force
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Nombres, nombres japoneses y voces salen de AniList (105310, 114236,
// 149118 y 179062). Los resumenes son propios, en castellano. La
// columna de temporada dice en que fichas aparece cada uno: T1 es la
// serie de 2019, T2 la de 2020 y T3 la temporada final de 2025-2026.
//
// "Akitaru Oubi" es el nombre que usa AniList y el que hace que el
// enlazador encuentre su imagen. En la serie se le llama Obi.
//
// Shou Kusakabe aparece en la T1 y vuelve en la T3; en la T2 no sale.
// Dragon, Sumire e Inca se incorporan mas tarde, y Rekka solo esta en
// la primera temporada.

export const PERSONAJES = [
  ["Shinra Kusakabe", "1,2,3", "main", "日下部森羅", "Gakuto Kajiwara",
   "Bombero de tercera generación conocido como Huellas del Diablo por las llamas que le salen de los pies. Sonríe cuando está nervioso y quiere ser un héroe, aunque la muerte de su familia y la desaparición de su hermano le pesan más de lo que admite."],

  ["Arthur Boyle", "1,2,3", "main", "アーサー・ボイル", "Yuusuke Kobayashi",
   "Compañero de Shinra en la Compañía 8 y autoproclamado Rey Caballero. Está convencido de que su espada es Excalibur y de que un rey no necesita explicaciones. Debajo de la pose hay un espadachín excepcional que corta el plasma con una precisión absurda."],

  ["Maki Oze", "1,2,3", "main", "尾瀬茉希", "Saeko Kamijou",
   "Oficial de segunda generación que controla el fuego con la mente. Antes fue militar y sigue entrenando como si cada día fuera un examen. Es la voz sensata de la Compañía 8, la que organiza al grupo y la que mejor pelea cuando la situación se complica."],

  ["Takehisa Hinawa", "1,2,3", "main", "武久火縄", "Kenichi Suzumura",
   "Teniente de la Compañía 8 y mano derecha de Oubi. Habla poco, dispara mejor y no tolera que nadie se salte el protocolo. Su piroquinesis le permite controlar la trayectoria de las balas, así que cada tiro suyo es una sentencia."],

  ["Akitaru Oubi", "1,2,3", "main", "秋樽桜備", "Kazuya Nakai",
   "Capitán de la Compañía 8. No tiene poderes, pero dirige a un grupo de pirocinéticos con una mezcla de autoridad y paternalismo que funciona. Antes fue bombero normal y conoce el precio de llegar tarde, así que no piensa perder a nadie de los suyos."],

  ["Iris", "1,2,3", "main", "アイリス", "Mao Ichimichi",
   "Hermana de la Iglesia del Sol Sagrado destinada en la Compañía 8. Reza por los Infernales antes de que los destruyan y trata de mantener la calma cuando todo arde. Su fe es real, pero también es una de las claves del pasado que la Compañía 8 termina destapando."],

  ["Tamaki Kotatsu", "1,2,3", "main", "環古達", "Aoi Yuuki",
   "Bombera novata de tercera generación con una habilidad felina que le cambia el pelo y le da cola. Se avergüenza con facilidad, sobre todo cuando su poder la deja en posturas comprometidas, pero aguanta más de lo que parece y se niega a abandonar a los niños que fueron usados como cobayas."],

  ["Benimaru Shinmon", "1,2,3", "supporting", "紅丸新門", "Mamoru Miyano",
   "Capitán de la Compañía 7 y jefe de los Hikeshi de Asakusa. Es el pirocinético más fuerte de la serie y lo sabe. No le gustan las órdenes del Imperio ni la gente que habla sin haber peleado, pero se toma en serio proteger a su barrio y a Konro."],

  ["Konro Sagamiya", "1,2,3", "supporting", "相模屋紺炉", "Tomoaki Maeno",
   "Teniente de la Compañía 7 y amigo de la infancia de Benimaru. Una enfermedad le impide usar el fuego sin destruirse por dentro, así que compensa con experiencia y estrategia. Es el freno y la memoria de Asakusa, y el único que puede discutir con Benimaru."],

  ["Princess Hibana", "1,2,3", "supporting", "プリンセス火華", "Lynn",
   "Capitana de la Compañía 5 y antigua hermana de la Iglesia. Empezó como rival de la Compañía 8 y acabó siendo una aliada incómoda. Controla las flores de fuego con una precisión quirúrgica y tiene una relación con Iris que va mucho más allá de lo que admite."],

  ["Leonard Burns", "1,2,3", "supporting", "レオナルド・バーンズ", "Taiten Kusunoki",
   "Capitán de la Compañía 1, el hombre más fuerte del Imperio antes de que aparezca la nueva generación. Cree en la disciplina y en el sacrificio, y durante años ha protegido una verdad que preferiría no conocer. Su enfrentamiento con Shinra es también una pelea contra su propia fe."],

  ["Viktor Licht", "1,2,3", "supporting", "ヴィクトル・リヒト", "Daisuke Sakaguchi",
   "Científico forense y uno de los cerebros más raros de la Compañía 8. Analiza las cenizas, los insectos y las leyes del Adolla como si fueran un experimento. Trabaja para Haijima, pero eso no significa que obedezca: tiene su propia idea de quién debe ganar."],

  ["Vulcan Joseph", "1,2,3", "supporting", "ヴァルカンジョゼフ", "Taku Yashiro",
   "Ingeniero y herrero que vive en un taller apartado con Lisa y sus mascotas. Desprecia a Haijima y a cualquiera que use la tecnología para controlar a la gente. Su habilidad para construir armas y máquinas es la razón por la que medio Imperio lo busca."],

  ["Lisa Isaribi", "1,2,3", "supporting", "リサ漁辺", "Ayaka Asai",
   "Amiga de la infancia de Vulcan y miembro de los Vestidos de Blanco. Le enseñaron a matar y a usar el fuego, pero nunca a olvidar el taller donde creció. Su lealtad oscila entre la familia que le dio el Evangelista y la que Vulcan le ofrece."],

  ["Joker", "1,2,3", "antagonist", "ジョーカー", "Kenjirou Tsuda",
   "Vigilante enmascarado que investiga por su cuenta los incendios del Imperio. Tiene poderes de fuego y una lista de nombres propia. No es un héroe ni un villano, pero su camino se cruza con el de la Compañía 8 cada vez que alguien intenta enterrar la verdad."],

  ["Shou Kusakabe", "1,3", "antagonist", "象日下部", "Maaya Sakamoto",
   "Hermano pequeño de Shinra y comandante de los Caballeros de la Llama de Ceniza. Desapareció el día del incendio y volvió convertido en soldado del Evangelista. Comparte con Shinra la Ráfaga de Adolla, pero ha decidido que el mundo solo puede salvarse si lo destruye primero."],

  ["Haumea", "1,2,3", "antagonist", "ハウメア", "Rie Kugimiya",
   "Líder de los Caballeros de la Llama de Ceniza y una de las cuatro personas con Ráfaga de Adolla. Controla la electricidad y juega con la gente como si fuera un experimento. Su sonrisa no oculta el odio que siente hacia un mundo que la trató como una herramienta."],

  ["Charon", "1,2,3", "antagonist", "カロン", "Hiroki Yasumoto",
   "Guardaespaldas de Haumea y uno de los combatientes más peligrosos del Evangelista. Absorbe el fuego y lo convierte en fuerza bruta. A diferencia de otros villanos, tiene un código: protege a Haumea y respeta a los rivales que se lo ganan."],

  ["Dragon", "3", "antagonist", "ドラゴン", "Masaki Aizawa",
   "Comandante de los Destructores y el Vestido de Blanco más fuerte de la temporada final. Puede levantar volcanes y convertir el suelo en lava. Busca una pelea digna, no una masacre, y su enfrentamiento con Arthur es el choque de dos hombres que quieren ser reyes."],

  ["Dr. Giovanni", "1,2,3", "antagonist", "Dr.ジョヴァンニ", "Yutaka Aoyama",
   "Científico del Evangelista especializado en insectos que convierten a las personas en Infernales. No tiene escrúpulos y trata los cuerpos humanos como material de laboratorio. Es el primer enemigo que muestra a Shinra hasta dónde está dispuesta a llegar la conspiración."],

  ["Rekka Hoshimiya", "1", "antagonist", "烈火星宮", "Tomokazu Seki",
   "Teniente de la Compañía 1 y, en secreto, agente del Evangelista. Usa a los niños del orfanato para experimentar con insectos infernales. Su muerte llega pronto, pero deja claro que la corrupción no está solo en los callejones, sino dentro de la propia Iglesia."],

  ["Arrow", "1,2,3", "supporting", "アロー", "Yumi Uchiyama",
   "Francotiradora del Evangelista y guardaespaldas de Shou. Dispara flechas de fuego con una puntería imposible. Su lealtad a Shou es absoluta, aunque eso la obligue a luchar contra los mismos a los que debería proteger."],

  ["Sumire", "3", "supporting", "スミレ", "Hitomi Shogawa",
   "Hermana mayor de la Iglesia y una de las pocas personas que conoce el secreto de Amaterasu. Ha pasado media vida cuidando la llama sagrada y a las niñas que crecieron a su sombra. En la temporada final tiene que decidir entre la fe y la verdad."],

  ["Inca Kasugatani", "2,3", "supporting", "春日谷因果", "Miyuri Shimabukuro",
   "Estudiante con un olfato prodigioso que detecta el fuego antes de que empiece. El Evangelista la recluta por su capacidad pirocinética y ella acepta porque necesita sentirse especial. Su arco es el de una chica que confunde la libertad con quemarlo todo."],

  ["Huo Yan Li", "", "supporting", "フォイエン・リィ", "Satoshi Hino",
   "El capitán de la segunda compañía de los caballeros del fuego, que pelea con el mismo estilo que Shinra."],

  ["Karim Flam", "", "supporting", "カリム・フラム", "Kazuyuki Okitsu",
   "El teniente de la segunda compañía, que maneja el hielo y que se une al equipo de Shinra."],

  ["Hikage", "", "supporting", "ヒカゲ", "Hikaru Akao",
   "La compañera de la segunda compañía que pelea junto a Hinata."],

  ["Tooru Kishiri", "", "supporting", "トオル岸里", "Kengo Kawanishi",
   "El compañero de la segunda compañía que pelea con el mismo estilo que Shinra."],

  ["Hinata", "", "supporting", "ヒナタ", "Hikaru Akao",
   "La compañera de la segunda compañía que pelea junto a Hikage."],

  ["Conehead", "", "supporting", "コーンヘッド", "Ryou Sugisaki",
   "El compañero de la segunda compañía que pelea con el mismo estilo que Shinra."],

  ["Takeru Noto", "", "supporting", "武能登", "Katsuyuki Konishi",
   "El compañero de la segunda compañía que pelea con el mismo estilo que Shinra."],

  ["Yuu", "", "supporting", "ユウ", "Shouya Chiba",
   "El compañero de la segunda compañía que pelea con el mismo estilo que Shinra."],
];
