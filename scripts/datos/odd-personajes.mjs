// PERSONAJES - Odd Taxi
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Nombres, kanji y voces vienen de AniList (ficha 128547). Los resumenes
// son propios, en castellano, a partir de las descripciones de la
// Wikipedia en ingles y en japones. Se incluye el reparto util completo:
// el protagonista, los secundarios con peso en la trama y los
// antagonistas claros (Dobu, Yano, Kuroda y Sakura).

export const PERSONAJES = [
  ['Hiroshi Odokawa', '1', 'main', '小戸川宏', 'Natsuki Hanae',
   'Taxista de 41 años que vive solo y apenas se relaciona con los demás. Sufre insomnio y acude a la consulta de Goriki. Sus padres murieron en un accidente cuando era niño, y desde entonces percibe a las personas como animales. Se ve envuelto en la desaparición de una estudiante por los datos de la cámara de su taxi.'],

  ['Miho Shirakawa', '1', 'supporting', '白川美保', 'Riho Iida',
   'Enfermera de 28 años en la clínica de Goriki. Es alegre y se interesa por Odokawa, a quien acompaña en sus paseos nocturnos. Practica capoeira y tiene una gran fuerza física. Vende medicamentos robados a Dobu para pagar una deuda que la ata al yakuza.'],

  ['Gouriki', '1', 'supporting', '剛力', 'Ryouhei Kimura',
   'Médico gorila de 41 años y dueño de la clínica a la que acude Odokawa. Es serio, observador y uno de sus pocos amigos. Preocupado por el insomnio y la conducta del taxista, investiga por su cuenta el pasado de Odokawa.'],

  ['Eiji Kakihana', '1', 'supporting', '柿花英二', 'Kappei Yamaguchi',
   'Empleado de limpieza de 41 años y amigo de Odokawa y Goriki. Usa una aplicación de citas con un perfil falso para aparentar éxito. Su cita con Shiho Ichimura acaba en una trampa que lo lleva a ser secuestrado y torturado por la banda de Yano.'],

  ['Dobu', '1', 'antagonist', 'ドブ', 'Kenji Hamada',
   'Gángster de 39 años y subordinado de Kuroda. Es violento y usa a Shirakawa para cobrar una deuda, además de sobornar a Kenshiro. Le propone a Odokawa un robo millonario y se convierte en el principal obstáculo del taxista.'],

  ['Rui Nikaidou', '1', 'supporting', '二階堂ルイ', 'Suzuko Mimori',
   'Cantante principal del grupo Mystery Kiss. Es una caniche de 18 años, ambiciosa y orgullosa, obsesionada con llegar a lo más alto. Encuentra el cuerpo de Yuki Mitsuya y participa en el encubrimiento para no cancelar el debut del grupo.'],

  ['Shiho Ichimura', '1', 'supporting', '市村しほ', 'Moeka Koizumi',
   'Integrante de Mystery Kiss, una gata calicó de 18 años. Creció en una familia pobre y sueña con hacerse rica. Yamamoto y Yano la obligan a participar en estafas contra hombres adinerados, y su cita con Kakihana forma parte de una de ellas.'],

  ['Yuki Mitsuya', '1', 'supporting', '三矢ユキ', 'Akari Kitou',
   'Idol de Mystery Kiss que desaparece antes del debut del grupo. Es una gata negra atlética y sincera, hija del rakugoka Donraku. Su cuerpo aparece en el río Sumida, y su muerte desencadena la investigación que apunta a varios personajes.'],

  ['Fuyuki Yamamoto', '1', 'supporting', '山本冬樹', 'Makoto Furukawa',
   'Mánager de Mystery Kiss, un zorro rojo de 34 años. Está dispuesto a todo para que el grupo debute, incluido ocultar el cadáver de Yuki. También intenta comprar los datos de la cámara de Odokawa y trata de estrangularlo cuando lo considera una amenaza.'],

  ['Daimon Ani', '1', 'supporting', '大門兄', 'Kousei Miki',
   'Policía suricata de 36 años, hermano mayor de Koshiro. Es cínico, corrupto y desprecia a los taxistas. Recibe sobornos de Dobu y le entrega la tarjeta de la cámara de Odokawa; aun así, protege a su hermano pequeño y oculta sus propios delitos.'],

  ['Daimon Otouto', '1', 'supporting', '大門弟', 'Asei Miki',
   'Policía suricata de 36 años y hermano menor de Kenshiro. Tiene un fuerte sentido de la justicia y confía ciegamente en su hermano mayor. Investiga la desaparición de la estudiante y acaba descubriendo las mentiras que sostienen su familia y su trabajo.'],

  ['Shibagaki', '1', 'supporting', '柴垣', 'Yuusuke',
   'Cómico jabalí de 34 años y mitad del dúo Homosapiens. Escribe los chistes y defiende un humor agresivo que no perdona a nadie. Trabaja en un club de cabarets para pagar las facturas mientras espera su gran oportunidad.'],

  ['Baba', '1', 'supporting', '馬場', 'Atsuhiro Tsuda',
   'Cómico caballo de 34 años y la otra mitad de Homosapiens. Es simpático y conciliador, y su fama crece cuando lo eligen para un programa de cocina. Mantiene en secreto una relación con Rui Nikaidou, lo que complica su amistad con Shibagaki.'],

  ['Taichi Kabasawa', '1', 'supporting', '樺沢太一', 'Takashi',
   'Estudiante de 22 años obsesionado con las redes sociales. Se hace una foto con Odokawa para volverse famoso y, al descubrir a Dobu en el fondo, decide grabar vídeos cada vez más peligrosos para atraparlo. Su necesidad de atención lo mete en el centro del conflicto.'],

  ['Taeko', '1', 'supporting', 'タエ子', 'Tomoko Murakami',
   'Dueña del izakaya Yamabiko, una canguro de 47 años. Es una figura maternal para Odokawa, Kakihana y Goriki, que la llaman mamá. Escucha sus problemas y observa con atención lo que ocurre en el barrio.'],

  ['Fukumoto', '1', 'supporting', '福本', 'Keisuke Takai',
   'Cómico panda de 27 años que forma el dúo Bonnou Illumination con Kondou. Representa un humor más ligero y comercial que el de Homosapiens, y su éxito relativo sirve de contraste con la pareja protagonista.'],

  ['Kondou', '1', 'supporting', '近藤', 'Phoenix',
   'Cómico leopardo de 27 años y compañero de Fukumoto en Bonnou Illumination. Ambos se hacen populares con chistes sencillos, mientras Homosapiens intenta encontrar su sitio en el mismo circuito de concursos.'],

  ['Shun Imai', '1', 'supporting', '今井旬', 'Koudai Sakai',
   'Fan acérrimo de Mystery Kiss y trabajador de un club de cabarets. Un número que le da Odokawa le hace ganar un premio enorme de lotería. Su fortuna repentina atrae a Yano y a Dobu, que planean robársela.'],

  ['Hajime Tanaka', '1', 'supporting', '田中一', 'Souma Saitou',
   'Desarrollador de videojuegos de 27 años. De niño sufrió acoso y se refugió en una colección de gomas de borrar; ya adulto, gasta una fortuna en un juego móvil para conseguir un pájaro raro. Cuando Odokawa le hace perderlo, encuentra un arma y jura vengarse.'],

  ['Donraku Shoufuutei', '1', 'supporting', '笑風亭呑楽', 'Houchuu Ootsuka',
   'Rakugoka de 58 años y estrella de la televisión. Es el padre de Yuki Mitsuya y uno de los jueces del concurso de cómicos. Su figura inspira una de las gomas de borrar que Tanaka persigue.'],

  ['Yano', '1', 'antagonist', 'ヤノ', 'METEOR',
   'Gángster puercoespín y rival de Dobu dentro del sindicato de Kuroda. Habla siempre con rimas y controla a Sekiguchi. Extorsiona a Yamamoto y a las idols, y planea quedarse con el dinero del premio de Imai.'],

  ['Sekiguchi', '1', 'supporting', '関口', 'Chado Horii',
   'Matón oso polar que trabaja como guardaespaldas de Yano. Participa en el secuestro y la tortura de Kakihana y en el encubrimiento de la muerte de Yuki. Es leal a Yano y no duda en ensuciarse las manos.'],

  ['Kuroda', '1', 'antagonist', '黒田', 'Takaya Kuroda',
   'Jefe de la banda de yakuzas, un tapir malayo de 58 años. Dirige a Dobu y Yano y mantiene contactos con la policía. Odokawa le entrega al final el dinero recuperado, y Kuroda revela que lleva años ayudando a huérfanos.'],

  ['Satoshi Nagashima', '1', 'supporting', '長嶋聡', 'Mahiro Takasugi',
   'Estudiante de 17 años y fan obsesivo de Homosapiens. Escribe cartas al programa de radio y sueña con sustituir a Baba como compañero de Shibagaki. Su entusiasmo choca con la crisis del dúo.'],

  ['Kanon', '1', 'supporting', '花音', 'Amane Shiomiya',
   'Gata atigrada que trabaja como autónoma y aspira a ser idol. Aparece en el entorno de Mystery Kiss y de los concursos, y forma parte del retrato de jóvenes que buscan abrirse camino en el mundo del espectáculo.'],

  ['Reina', '1', 'supporting', '玲奈', 'Chika Kagura',
   'Coneja que trabaja por cuenta propia y sigue a Kabasawa en las redes sociales. Se convierte en su compañera durante la huida del universitario y muestra una actitud más práctica que la de él.'],

  ['Sakura Wadagaki', '1', 'antagonist', '和田垣さくら', 'Manatsu Murakami',
   'Joven gata negra que se hace pasar por Yuki Mitsuya después de que la idol desaparezca. Fue rechazada en la audición de Mystery Kiss y guarda un rencor profundo. Es la verdadera asesina de Yuki y escapa de la policía al final de la serie.'],
];
