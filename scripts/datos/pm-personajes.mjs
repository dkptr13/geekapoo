// PERSONAJES - Plastic Memories
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Con una sola temporada, todos van con la temporada vacia, que
// significa "sale en todas" (ver `seasonIdsDe` en `seasonData.ts`).
//
// Nombres, kanji y voces de AniList, comprobados con la Wikipedia
// en espanol. El orden es el ingles (nombre primero), como lo
// escribe la ficha y como lo busca quien busca.

export const PERSONAJES = [
  ['Tsukasa Mizugaki', '', 'main', '水柿ツカサ', 'Yasuaki Takumi',
   'Chico de dieciocho anos que entra al Terminal Service por enchufe de su padre, tras suspender los examenes por problemas medicos. Le toca de companera Isla y se enamora de ella sabiendo que caduca a la vez el contrato y ella. Se niega a abandonarla hasta el final.'],

  ['Isla', '', 'main', 'アイラ', 'Sora Amamiya',
   'Giftia veterana de coletas plateadas que lleva anos sirviendo tes, apartada del campo. Vuelve al trabajo con Tsukasa aunque le quedan menos de 2000 horas de vida. Torpe, cabezota y la primera en sentir que la vida se le escapa entre los dedos.'],

  ['Michiru Kinushima', '', 'supporting', '絹島ミチル', 'Chinatsu Akasaki',
   'Empleada de diecisiete anos, superior de Tsukasa por un ano y tsundere de manual. La crio una Giftia a la que intento proteger hasta convertirla en Wanderer, y desde entonces odia a la seguridad privada. Se preocupa por Tsukasa mas de lo que admite.'],

  ['Zack', '', 'supporting', 'ザック', 'Sayuri Yahagi',
   'Giftia con pinta de nino pijo y lengua viperina, tirador de Michiru. Disfruta aireando secretos ajenos y que lo traten como mayor, cosa que nadie hace. Detras del cinismo esconde a alguien que si confia.'],

  ['Kazuki Kuwanomi', '', 'supporting', '桑乃実カヅキ', 'Megumi Toyoguchi',
   'Jefa de la seccion y antigua companera de Isla, a la que protege con celo aterrador. Perdio una pierna intentando recuperar al padre de Michiru. Bebe, grita y es la mejor en lo suyo.'],

  ['Constance', '', 'supporting', 'コンスタンス', 'Satoshi Hino',
   'Giftia de trato amable y tirador actual de Kazuki. El remanso de paz de la oficina: donde los demas gritan, el calma. Su serenidad es casi un superpoder en ese sitio.'],

  ['Yasutaka Hanada', '', 'supporting', '縹ヤスタカ', 'Kenjirou Tsuda',
   'Veterano de diez anos con actitud de funcionario quemado y cero motivacion aparente. Debajo del pasotismo hay un profesional que ha visto de todo. Su tiradora Sherry lo sufre a diario.'],

  ['Sherry', '', 'supporting', 'シェリー', 'Aimi',
   'Giftia seria con pinta de ejecutiva, tiradora de Yasutaka. Le saca de quicio la desgana de su companero y cuando se enfada da tanto miedo como Kazuki. La unica que mantiene a su pareja a raya.'],

  ['Eru Miru', '', 'supporting', '海松エル', 'Sumire Uesaka',
   'Ingeniera del equipo de mantenimiento y friki declarada de los androides, con debilidad especial por Isla. Su amiga Olivia volvio como Andy con otro sistema, y Eru tiene que aprender a querer a las dos por separado.'],

  ['Takao Yamanobe', '', 'supporting', '山野辺タカオ', 'Nobuo Tobita',
   'Jefe de seccion venido de ventas, sin ni idea de campo. No sabe comunicarse ni con su hija, pero aguanta el chiringuito como puede. El mando que manda sin haber estado nunca fuera.'],

  ['Marsha', '', 'supporting', 'マーシャ', 'Mamiko Noto',
   'Giftia que crio a Souta como hermana mayor tras morir sus padres. Su secuestro y caida a Wanderer centran los capitulos intermedios. Queria tanto al nino que hasta rota lo buscaba.'],

  ['Souta Wakanae', '', 'supporting', '若苗ソウタ', 'Misato Fukuen',
   'Nino criado por Marcia que al principio la trata como trasto para no sufrir la despedida. Aprende a quererla en voz alta antes de que sea tarde. Su tarta de cumpleanos es de lo mas duro de la serie.'],

  ['Sarah', '', 'supporting', 'サラ', 'Ayahi Takagaki',
   'Giftia guardaespaldas del mafioso Antonio, que la crio como nieta. Su recuperacion es el ultimo trabajo de Tsukasa e Isla juntos. Lo que le susurra Isla al oido antes del borrado nadie lo oye.'],

  ['Andy', '', 'supporting', 'アンディ', 'Mikako Komatsu',
   'Tiradora de la oficina 3 que antes fue Olivia, amiga de Eru, con el sistema cambiado por recortes. Vive una segunda vida sin recuerdos de la primera. Obliga a Eru a decidir a quien quiere.'],

  ['Mikijirou Tetsuguro', '', 'supporting', '鉄黒ミキジロウ', 'Mitsuaki Hoshino',
   'Jefe de Eru y encargado de la sala de pruebas fisicas. Mide a las Giftias como maquinas porque es su trabajo, aunque sabe que no lo son. Secundario de fondo con bata blanca.'],

  ['Nina', '', 'supporting', 'ニーナ', 'Misaki Kuno',
   'Niña Giftia criada por Chizu como nieta. Acepta irse para no darle problemas a quien quiere, y su despedida es la primera leccion de Tsukasa.'],

  ['Chizu Shirohana', '', 'supporting', '白花チヅ', 'Reiko Suzuki',
   'Anciana severa que crio a Nina como nieta. Se niega a entregarla hasta que oye a la niña aceptar irse por ella, y entonces la deja marchar con las gracias a Tsukasa.'],

  ['Ren Kawarake', '', 'supporting', '土器レン', 'Shinnosuke Ogami',
   'Empleado del Terminal Service One al que Zack llama chupatintas. Papeleo y oficina mientras los demas salen al campo.'],

  ['Mari Iwai', '', 'supporting', '岩井マリ', 'Kiyoko Miyazawa',
   'Esposa de Hajime y dueña de Edward junto a el. Se despide del Giftia en el primer capitulo con el marido al lado.'],

  ['Hajime Iwai', '', 'supporting', '岩井ハジメ', 'Kan Tanaka',
   'Esposo de Mari y dueño de Edward junto a ella. Comparte con su mujer la despedida del Giftia en el primer capitulo.'],

  ['Edward', '', 'supporting', 'エドワード', 'Akinori Egoshi',
   'Giftia de los Iwai, recuperado en el primer capitulo. Su despedida con sus dueños es la primera muestra de en que consiste el trabajo.'],
];
