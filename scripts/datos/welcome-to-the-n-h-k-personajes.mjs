// PERSONAJES - Welcome to the N.H.K.
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Los nombres y las voces salen de AniList (1210). La serie tiene una
// sola temporada, así que todos los personajes van con la temporada
// vacía. Se incluyen todos los roles MAIN y SUPPORTING; los BACKGROUND
// no aportan nada a la ficha. Las descripciones son propias, en
// castellano.
//
// AniList no guarda el nombre japonés de Yuu Kusano; se completa con
// 草野 優, que es el que usan la ficha de aniSearch y el resto de
// bases de datos.

const TODAS = '';

export const PERSONAJES = [
  ['Tatsuhiro Satou', TODAS, 'main', '佐藤達広', 'Yutaka Koizumi',
    'Un hikikomori de veintidós años que lleva casi cuatro sin salir de casa. Vive de la asignación de sus padres y culpa a la N.H.K. de todos sus males. Su paranoia y su imaginación convierten cada intento de cambiar en una aventura absurda.'],

  ['Misaki Nakahara', TODAS, 'main', '中原岬', 'Yui Makino',
    'Una joven misteriosa que se presenta en la puerta de Satou con un contrato para ayudarlo a salir de su encierro. Detrás de su seguridad hay una historia familiar dolorosa y la necesidad de sentirse útil para alguien.'],

  ['Kaoru Yamazaki', TODAS, 'main', '山崎薫', 'Daisuke Sakaguchi',
    'El vecino de Satou y antiguo compañero de instituto. Es un otaku que estudia para crear videojuegos y admira a Satou desde que lo defendió de unos matones. Su energía choca con la apatía del protagonista.'],

  ['Hitomi Kashiwa', TODAS, 'supporting', '柏瞳', 'Sanae Kobayashi',
    'La senpai de Satou en el instituto, ahora funcionaria. Le introdujo las teorías de la conspiración y arrastra una dependencia de los fármacos. Su desencanto la acerca a un grupo peligroso.'],

  ['Shizue Satou', TODAS, 'supporting', '佐藤シヅエ', 'Mayumi Shou',
    'La madre de Satou. Le envía dinero cada mes y se preocupa por él, aunque no sabe cómo ayudarlo. Su visita obliga a Satou y Misaki a fingir una vida que no tienen.'],

  ['Megumi Kobayashi', TODAS, 'supporting', '小林恵', 'Risa Hayamizu',
    'Una antigua compañera de clase de Satou que trabaja para mantenerse y cuidar de su hermano. Su carácter estricto se ha vuelto más manipulador con los años, y arrastra a Satou a un negocio turbio.'],

  ['Nanako Midorikawa', TODAS, 'supporting', '緑川七菜子', 'Rumi Shishido',
    'Compañera de Yamazaki en la escuela de doblaje. Yamazaki está enamorado de ella y la usa como modelo para la heroína de su juego, aunque la relación real no es lo que él imagina.'],

  ['Akira Jougasaki', TODAS, 'supporting', '城ヶ崎彰', 'Nobuo Tobita',
    'El novio de Hitomi. Cuando descubre sus planes, se une a Misaki y Kaoru para rescatarla. Su amor por ella es uno de los pocos vínculos estables de la historia.'],

  ['Yuu Kusano', TODAS, 'supporting', '草野 優', 'Miyuki Sawashiro',
    'Un estudiante que participa en la quedada del grupo de Hitomi. Se pasa el día con la consola y casi no habla con los demás. Su presencia muestra hasta dónde puede llegar la desconexión de quienes se sienten solos.'],
];
