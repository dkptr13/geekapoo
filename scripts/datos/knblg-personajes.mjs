// PERSONAJES - Kuroko no Basket: Partido final
// 
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
// 
// Película única: todos los personajes van con la temporada vacía.

const TODAS = '';

export const PERSONAJES = [
  ['Tetsuya Kuroko', TODAS, 'main', '黒子テツヤ', 'Kenshou Ono',
   'El sexto hombre fantasma de la Generación de los Milagros. Casi nadie repara en él, y esa invisibilidad le permite mover el balón y dar pases que el rival no ve venir. Juega como la sombra de Kagami.'],

  ['Taiga Kagami', TODAS, 'main', '火神大我', 'Yuuki Ono',
   'Alero criado en Estados Unidos que vuelve a Japón con un salto y una fuerza fuera de lo normal. Quiere superar a la Generación de los Milagros y convertirse en el mejor jugador del país.'],

  ['Ryouta Kise', TODAS, 'supporting', '黄瀬涼太', 'Ryouhei Kimura',
   'El novato de la Generación de los Milagros y la estrella de Kaijou. Puede copiar los movimientos de cualquier jugador que haya visto, aunque el esfuerzo le pasa factura.'],

  ['Shintarou Midorima', TODAS, 'supporting', '緑間真太郎', 'Daisuke Ono',
   'Tirador de Shuutoku capaz de encestar desde cualquier punto de la cancha. Cree en la astrología, lleva siempre un objeto de la suerte y no se separa de sus vendas.'],

  ['Daiki Aomine', TODAS, 'supporting', '青峰大輝', 'Junichi Suwabe',
   'El as de Touou y el jugador más rápido de la Generación. Juega a su aire porque casi nadie le obliga a esforzarse, y fue la primera luz de Kuroko.'],

  ['Atsushi Murasakibara', TODAS, 'supporting', '紫原敦', 'Kenichi Suzumura',
   'Pívot gigante de Yousen que prefiere comer chucherías antes que entrenar. Cuando se pone serio, su altura y su fuerza lo convierten en un muro casi imposible de superar.'],

  ['Seijuurou Akashi', TODAS, 'supporting', '赤司征十郎', 'Hiroshi Kamiya',
   'Capitán de Rakuzan y líder de la Generación de los Milagros. Su Ojo del Emperador le permite leer el futuro inmediato del rival, y su confianza en la victoria roza la obsesión.'],

  ['Riko Aida', TODAS, 'supporting', '相田リコ', 'Chiwa Saitou',
   'Entrenadora de Seirin e hija de un exjugador de la selección. Su ojo para medir el potencial de un jugador es casi sobrenatural, aunque su cocina es un peligro.'],

  ['Junpei Hyuuga', TODAS, 'supporting', '日向順平', 'Yoshimasa Hosoya',
   'Capitán de Seirin y especialista en triples. Mantiene la calma en los momentos difíciles y es el encargado de meter los tiros que deciden los partidos.'],

  ['Satsuki Momoi', TODAS, 'supporting', '桃井さつき', 'Fumiko Orikasa',
   'Mánager de Touou y exmánager de Teikou. Analiza a los rivales con una precisión de espía y sigue enamorada de Kuroko desde la escuela secundaria.'],

  ['Tatsuya Himuro', TODAS, 'supporting', '氷室辰也', 'Kishou Taniyama',
   'Escolta de Yousen y hermano mayor de Kagami en Estados Unidos. Frío y elegante, juega con una precisión que lo sitúa al nivel de la Generación.'],

  ['Yukio Kasamatsu', TODAS, 'supporting', '笠松幸男', 'Souichirou Hoshi',
   'Capitán de Kaijou y base de nivel nacional. Se toma muy en serio al equipo, pierde la paciencia con Kise y descarga su frustración a puñetazos.'],

  ['Kazunari Takao', TODAS, 'supporting', '高尾和成', 'Tatsuhisa Suzuki',
   'Base de Shuutoku con el Ojo de Halcón, superior al de Izuki. Es el único pasador que no se deja engañar por la invisibilidad de Kuroko.'],

  ['Teppei Kiyoshi', TODAS, 'supporting', '木吉鉄平', 'Kenji Hamada',
   'Pívot de Seirin y uno de los fundadores del equipo. Vuelve de una lesión de rodilla con la misma sonrisa y la misma capacidad para leer el juego.'],

  ['Nash Gold Jr.', TODAS, 'supporting', 'ナッシュ・ゴールド・Jr', 'Hikaru Midorikawa',
   'Base y capitán de Jabberwock, el equipo callejero estadounidense que desafía a Japón. Su talento y su arrogancia lo convierten en el rival principal de la película.'],

  ['Jason Silver', TODAS, 'supporting', 'ジェイソンシルバー', 'Tetsu Inada',
   'Pívot de Jabberwock, más alto y fuerte que cualquier miembro de la Generación. Juega con su talento natural y desprecia el entrenamiento.'],

  // Seirin
  ['Shun Izuki', TODAS, 'supporting', '伊月俊', 'Hirofumi Nojima',
   'Base de Seirin con el Ojo de Águila, una habilidad que le permite ver todo lo que ocurre en su zona sin mirar. También es el rey de los chistes malos.'],

  ['Shinji Koganei', TODAS, 'supporting', '小金井慎二', 'Takuya Eguchi',
   'Alero polivalente de Seirin, bueno en todo sin destacar en nada. Es capaz de leer a Mitobe sin que este diga una palabra.'],

  ['Kouki Furihata', TODAS, 'supporting', '降旗光樹', 'Naoki Mizutani',
   'Base suplente de Seirin, tímido y nervioso, pero con un sentido del juego que le permite cumplir cuando Riko lo necesita.'],

  ['Satoshi Tsuchida', TODAS, 'supporting', '土田聡史', 'Gou Inoue',
   'Ala-pívot de Seirin que aporta rebotes y trabajo sucio. No es una estrella, pero su esfuerzo mantiene al equipo en los partidos.'],

  ['Kouichi Kawahara', TODAS, 'supporting', '河原浩一', 'Yasuhiro Yoshimoto',
   'Novato de Seirin que anima desde el banquillo con la misma intensidad con la que jugaría. Su compromiso con el equipo no depende de los minutos que reciba.'],

  ['Hiroshi Fukuda', TODAS, 'supporting', '福田寛', 'Hiroo Sasaki',
   'Jugador de Seirin que aporta energía y defensa desde el banquillo. Su papel es mantener el ritmo del equipo cuando los titulares descansan.'],

  // Touou
  ['Shouichi Imayoshi', TODAS, 'supporting', '今吉翔一', 'Kazuya Nakai',
   'Capitán de Touou y base cerebral. Habla con educación mientras clava pequeñas pullas y dirige al equipo con una inteligencia que no perdona errores.'],

  ['Ryou Sakurai', TODAS, 'supporting', '桜井良', 'Nobunaga Shimazaki',
   'Escolta de Touou con un lanzamiento rapidísimo. Es amable hasta el extremo y pide perdón por todo, incluso cuando no ha hecho nada malo.'],

  ['Kousuke Wakamatsu', TODAS, 'supporting', '若松孝輔', 'Kousuke Toriumi',
   'Pívot de Touou, ruidoso y fácil de irritar. No soporta la actitud de Aomine, pero su rebote y su defensa sostienen al equipo.'],

  // Kaijou y Shuutoku
  ['Mitsuhiro Hayakawa', TODAS, 'supporting', '早川充洋', 'Kazunori Nomata',
   'Ala-pívot de Kaijou, pura energía. Su rebote ofensivo y su voz estruendosa animan al equipo, aunque cuando habla se come sílabas y nadie sabe muy bien qué dice.'],

  ['Kiyoshi Miyaji', TODAS, 'supporting', '宮地清志', 'Masayuki Shouji',
   'Titular de Shuutoku que no soporta el aire de superioridad de Midorima. Le responde con amenazas y una sonrisa inquietante cada vez que el tirador se pasa de la raya.'],

  // Yousen
  ['Wei Liu', TODAS, 'supporting', '劉偉 (リュウウェイ)', 'Shigeyuki Susaki',
   'Alero de Yousen de más de dos metros. Su altura le permite defender y anotar por encima de los rivales, y forma con Murasakibara y Okamura una de las pinturas más grandes del torneo.'],

  ['Kensuke Fukui', TODAS, 'supporting', '福井健介', 'Kaito Ishikawa',
   'Base suplente de Yousen y vicecapitán. Dice lo que piensa con humor, pero en la cancha mantiene la calma y organiza el ataque.'],

  ['Kenichi Okamura', TODAS, 'supporting', '岡村建一', 'Kouji Takeda',
   'Ala-pívot de Yousen. Aporta fuerza y rebote y forma junto a Murasakibara una pareja interior difícil de mover.'],

  // Rakuzan
  ['Kotarou Hayama', TODAS, 'supporting', '葉山小太郎', 'Toshiki Masuda',
   'Alero de Rakuzan y Rey sin Corona. Es energético e infantil, pero su regate relámpago y su ambición lo hacen peligroso.'],

  ['Reo Mibuchi', TODAS, 'supporting', '実渕玲央', 'Wataru Hatano',
   'Escolta de Rakuzan y uno de los Reyes sin Corona. Sus tres formas de tiro, Cielo, Tierra y Olvido, lo convierten en un anotador letal.'],

  ['Eikichi Nebuya', TODAS, 'supporting', '根武谷永吉', 'Takahiro Fujiwara',
   'Pívot de Rakuzan y Rey sin Corona. Come sin parar porque cree que la carne le da fuerza, y su físico le permite dominar la pintura.'],

  ['Chihiro Mayuzumi', TODAS, 'supporting', '黛千尋', 'Ryouta Oosaka',
   'Alero de Rakuzan que comparte con Kuroko la capacidad de pasar desapercibido. Es callado, arrogante y su técnica de distracción sorprende a Seirin.'],

  // Banquillos y mentores
  ['Alexandra Garcia', TODAS, 'supporting', 'アレクサンドラ=ガルシア', 'Yuki Kaida',
   'Exjugadora de la WNBA que tuvo que retirarse por una enfermedad ocular. Entrenó a Kagami y a Himuro en Estados Unidos y sigue siendo una referencia para ambos.'],

  ['Kagetora Aida', TODAS, 'supporting', '相田景虎', 'Shinichirou Miki',
   'Padre de Riko y entrenador deportivo. Fue jugador de la selección japonesa y protege a su hija con un entusiasmo que asusta a los rivales.'],

  // Jabberwock
  ['Nick', TODAS, 'supporting', 'ニック', 'Shuuhei Sakaguchi',
   'Escolta de Jabberwock y número 6. Su tiro exterior y su resistencia le permiten jugar todo el partido sin descanso; forma parte del equipo que humilla a Japón antes de la revancha.'],

  ['Zack', TODAS, 'supporting', 'ザック', 'Shuuhei Matsuda',
   'Ala-pívot de Jabberwock y número 12. Su físico y su capacidad para correr la cancha completan el quinteto callejero que se mide a los Vorpal Swords.'],

  ['Allen', TODAS, 'supporting', 'アレン', 'Tooru Sakurai',
   'Alero de Jabberwock y número 7. Su paso atrás es una de las armas más difíciles de defender del equipo, y Kagetora lo señala como un genio además de Nash y Silver.'],
];
