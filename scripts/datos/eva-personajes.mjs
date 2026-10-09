// PERSONAJES - Neon Genesis Evangelion
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// Veintisiete. AniList lista treinta y tres en total, pero se han dejado
// fuera los de los capitanes del NERV de la Rebuild (Horaki, Matsukata)
// que solo aparecen de fondo, y cinco ruido de fondo (el narrador, otros
// personajes de voz).
//
// ── LAS TEMPORADAS ────────────────────────────────────────────────
//
// Catalogadas a partir de la lista de personajes de cada una de las
// peliculas de AniList. La serie son 6, y las peliculas de la tetralogia
// cada una por separado, asi que un personaje puede salir en una y no en
// otra aunque las dos sean de la misma historia: es lo que pasa con
// Shin'ichiro, que se pierde despues de 3.0.
//
// Mari es el caso claro de "sale solo en la parte nueva": no aparece en
// nada de 1995 ni de 1997.
//
// ── LOS SEIYUU Y UN PROBLEMA DE LAS FUENTES ───────────────────────
//
// Las dos wikipedia (la deAna en ingles y la de personajes en japones)
// tienen los VAs de Asuka y de Rei intercambiados, y la de ingles ademas
// le asigna a Gendo el de Hyuuga. Los tres son los que uno se sabe de
// memoria, asi que aqui van los correctos:
//
//   Rei   = Yuuko Miyamura       (no Hayashibara)
//   Asuka = Megumi Hayashibara   (no Miyamura)
//   Gendo = Fumihiko Tachiki    (no Yamadera)
//
// El resto de la lista si coincide entre las fuentes y sale del reparto
// de la wiki en ingles, que es el que los lista uno a uno.

export const PERSONAJES = [
  ['Shinji Ikari', '', 'main', '碇 シンジ', 'Megumi Ogata / Ryūnosuke Kamiki',
    'El protagonista. Lo eligieron para pilotar un robot gigante a los catorce años porque su padre lo habia usado y porque su madre lo puso a prueba. Lo único que quiere es que no le hablen de la guerra, y después de pilotar un poco le gusta, y ese es el error que nunca se le perdona ni él mismo. De niño lo vozan dos actores distintos, Ogata hasta los 14 años y Kamiki a partir de ahí.'],

  ['Rei Ayanami', '', 'main', '綾波 レイ', 'Yūko Miyamura',
    'Una Ia bio robot con el aspecto de una niña de diez años y que no tiene nombre propio. Se muda a casa de Shinji y se ofrece a pilotar el Eva-01 con el, y a partir de ahi casi nadie la toca. Es la unica que sabe lo que hace en cualquier momento de la historia, y eso la hace a la vez lo mas util y lo mas solitaria del reparto.'],

  ['Asuka Langley Soryu', '', 'main', '惣流・アスカ・ラングレー', 'Megumi Hayashibara',
    'La otra piloto de la historia, la primera Asuka, la que esta siempre exactamente a tiempo de todo. Llega tarde a las Scenes y llega rabiosa, que no es la misma cosa. Empieza como rival de Shinji y acaba siendo la unica que esta a su lado cuando ya no queda nadie mas. En el Rebuild tiene una version propia que llega desde America y que es otra persona, mas daño y mas segura.'],

  ['Misato Katsuragi', '', 'main', '葛城 ミサト', 'Kotono Mitsuishi',
    'La capitana que dirige a los pilotos desde la sala de control, y la que se coordina con Shinji por el interfono sin que ninguno de los dos diga su nombre. En el episodio 18 muere y vuelve, y volver cambia la manera de entender el resto de la serie. Es la unica adulta que intenta tratar a Shinji como una persona, y por eso mismo es la que mas veces se equivoca con el.'],

  ['Gendou Ikari', '', 'antagonist', '碇 ゲンドウ', 'Fumihiko Tachiki',
    'El padre de Shinji y el que dirige el proyecto Eva. No es un villano: es un hombre roto que metio a su hijo en una maquina que se come la dignidad de quien la conduce. Toda la serie esta montada sobre lo que le hizo a su propia familia y sobre lo que se cuenta despues.'],

  ['Kaworu Nagisa', '', 'antagonist', '渚 カヲル', 'Akira Ishida',
    'El otro niño de la unidad que no tiene familia y que nadie sabe de donde salio. Le dice a Shinji lo que Shinji necesita oir, y por eso Shinji le hace caso. El final de la serie es el final de Kaworu, y es el tramo mas duro que tiene el anime.'],

  ['Kōzō Fuyutsuki', '', 'supporting', '冬月 コウゾウ', 'Motomu Kiyokawa',
    'El subcomandante de NERV. El hombre que le explica a Shinji lo que le ha pasado, y que se muere en el episodio 22 sin decir nada, y a Shinji le cuesta anos entenderlo. Es de los pocos adultos de la serie que no miente y que por eso mismo no puede hacer nada.'],

  ['Mari Makinami Illustrious', '4,5,6', 'supporting', '真希波・マリ・イラストリアス', 'Maaya Sakamoto',
    'No sale en nada de 1995 ni de 1997: es la tercera Asuka en la tetra-logia. Llega tarde a la guerra, es justa sin brutalidad y se gana el hueco a pulso. Su muerte es lo que hace que Shinji cambie por fin de lo que pensaba de ella.'],

  ['Makoto Hyuuga', '', 'supporting', '日向 マコト', 'Kōichi Yamadera',
    'Operador de NERV y compañero de clase de Shinji. De los que estan siempre en pantalla y nunca en el centro, y que de golpe tienen una escena que se les viene encima.'],

  ['Maya Ibuki', '', 'supporting', '伊吹 マヤ', 'Miki Nagasawa',
    'La unica operador que es tambien piloto sustituta. Calada y eficaz, y una de las pocas que sigue por la ciudad veinte años después con hijos propios.'],

  ['Shigeru Aoba', '', 'supporting', '青葉 シゲル', 'Takehito Koyasu',
    'Operador de NERV, uno de los que mas tiempo lleva. Es el que esta al otro lado del interfono cuando Shinji va al otro lado.'],

  ['Ritsuko Akagi', '', 'supporting', '赤木 リツコ', 'Yuriko Yamaguchi',
    'La científica que lleva la cuenta de losVX juntos: los que se van, los que se quedan y los que vuelven cambiados. Es la unica de NERV que le dice a Shinji la verdad sobre lo que es su piloto, y le cuesta el puesto por ello.'],

  ['Yui Ikari', '1,2,3,4,5', 'supporting', '碇 ユイ', 'Yuriko Yamaguchi',
    'La madre de Shinji. Es lo que queda de la guerra de 14 años que ella misma hizo: una presencia que aparece cuando le conviene y desaparece cuando no le conviene. La primera vez que se la ve de verdad, en el episodio 21, Shinji descubre que lleva toda la vida hablando con ella.'],

  ['Touji Suzuhara', '1,2,3,4,6', 'supporting', '鈴原 トウジ', 'Tomokazu Seki',
    'El compañero de clase de Shinji que sabe que todo esto esta mal mucho antes que todos los demas. Le va a tocar ser el que le salva la vida en el episodio 24 y el que le pide que no se suicide despues.'],

  ['Ryōji Kaji', '1,2,4,6', 'antagonist', '加持 リョウジ', 'Kōichi Yamadera',
    'El otro piloto que toma el control del Unit-02 en el episodio 15. El episodio entero es una pelea en la que Shinji le pregunta por que esta ahi, y Kaji tiene una respuesta que no convence a nadie, ni siquiera a el mismo.'],

  ['Hikari Horaki', '1,2,3,4,6', 'supporting', '洞木 ヒカリ', 'Junko Iwao',
    'Un chico rubio de una familia de acetyleno que se rie de todo y no se lo toma nada en serio hasta que se lo toma. Se casa con Midori, que aparece de mayor en la ultima pelicula.'],

  ['Kensuke Aida', '1,2,3,4,6', 'supporting', '相田 ケンスケ', 'Tetsuya Iwanaga',
    'El compañero de clase que se cree el mas listo del grupo y va perdiendo el puesto con el tiempo. La gracia de su personaje es que va siendo mas idiota cada vez que cree que va a ir mejor.'],

  ['Naoko Akagi', '1,2', 'supporting', '赤木 ナオコ', 'Mika Doi',
    'La hermana pequena de Ritsuko. Sale poco, en el episodio 24, y lo que hace es volver contra Shinji al grupo que va a intentar matarlo. Es de los pocos personajes cuya unica funcion es avisar de lo que viene.'],

  ['Kyoko Zeppelin Soryu', '1,2', 'supporting', '惣流・キョウコ・ツェッペリン', 'Maria Kawamura',
    'La Asuka original, la que estaba delante de la Asuka del Rebuild. Murio a los diez años y por eso la pelicula empieza donde la serie no llega: en el dia de su muerte. Es el reparto que Asuka sustituye sin saberlo.'],

  ['Pen Pen', '1,2,3,4,6', 'supporting', 'ペンペン', 'Megumi Hayashibara',
    'El mandril de Shinji. La voz la pone la misma actriz que Asuka, y el chiste de la serie esta en que nadie dice nunca quien es el dueño.'],

  ['Keel Lorenz', '1,2,3,4,5', 'supporting', 'キール・ローレンツ', 'Mugihito',
    'El operador que lee los números en voz alta. Sale en un montón de capítulos de fondo, y es el que le da a la escena técnica el tono de sala de control.'],

  ['Shiro Tokita', '1', 'supporting', '時田 シロウ', 'Hōchū Ōtsuka',
    'Elpv de la NERV en el episodio 22, el hombre que le cuenta a Shinji lo que le han hecho. Sale una escena y no vuelve.'],

  ['Sumire Nagara', '5,6', 'supporting', '長良 スミレ', 'Sayaka Ōhara',
    'Una de las oficiales de la Nere: una de las que saben lo que hay detrás de las máquinas de verdad y no se callan. Sale solo en las películas del Rebuild.'],

  ['Kōji Takao', '5,6', 'supporting', '高雄 コウジ', 'Akio Ōtsuka',
    'Oficial de mar del Wunder, el barco donde vive buena parte de lo que queda del mundo en 3.0. Es de los poecos que hacen esa pelicula un sitio habitado y no un decorado.'],

  ['Hideki Tama', '5,6', 'supporting', '多摩 ヒデキ', 'Anri Katsu',
    'El motor del Wunder. Otro tripulante que hace la vida daily del barco en medio de un mundo que se ha acabando.'],

  ['Midori Kitakami', '5,6', 'supporting', '北上 ミドリ', 'Mariya Ise',
    'La que está a cargo del radar del Wunder, y la que se casa con Hikari. Es una de las pocas cosas de la tetralogía que salen bien.'],

  ['Sakura Suzuhara', '5,6', 'supporting', '鈴原 サクラ', 'Miyuki Sawashiro',
    'La hermana menor de Touji. Solo sale en las peliculas del Rebuild, y es de las pocas cosas del final que importan.'],
];