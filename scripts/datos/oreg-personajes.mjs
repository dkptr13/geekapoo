// PERSONAJES - Oregairu
//
// Formato: [nombre, temporada, rol, nombre japones, voz, resumen]
//
// '' = sale en las seis entregas. Los numeros siguen el orden de
// emision: 1 (serie 2013), 2 (OVA 2013), 3 (Zoku 2015), 4 (OVA
// 2016), 5 (Kan 2020) y 6 (OVA 2023). Iroha es principal desde
// Zoku y va de principal.
//
// Nombres, japones y voces vienen de AniList (14813, 18753,
// 20698, 21769, 108489 y 128643) y se comprobaron contra TVDB
// 267435. Las descripciones son propias, en castellano.

export const PERSONAJES = [
  ["Hachiman Hikigaya", "", "main", "比企谷八幡", "Takuya Eguchi",
   "Solo y cinico con filosofia de perdedor podrido. El club lo obliga a pedir de verdad capitulo a capitulo."],

  ["Yukino Yukinoshita", "", "main", "雪ノ下雪乃", "Saori Hayami",
   "Hielo con cerebro que no perdona la mediocridad. Se enfrenta a su familia y a sus sentimientos sin bajar la voz."],

  ["Yui Yuigahama", "", "main", "由比ヶ浜結衣", "Nao Touyama",
   "Dulzura con caracter que dice lo que quiere por fin. Cede con elegancia y vela hasta el ultimo dia."],

  ["Iroha Isshiki", "3,4,5,6", "main", "一色いろは", "Ayane Sakura",
   "Kouhai manipuladora que mueve consejo y club a su antojo. La mejor vendehúmos desde Zoku."],

  ["Saika Totsuka", "1,2,3,5", "supporting", "戸塚彩加", "Mikako Komatsu",
   "Angel del club de tenis que confunde a Hachiman. Sale en serie, OVA1, Zoku y Kan."],

  ["Yoshiteru Zaimokuza", "1,2,3,5", "supporting", "材木座義輝", "Nobuyuki Hiyama",
   "Chuuni de katana imaginaria y novelas propias. Sale en serie, OVA1, Zoku y Kan."],

  ["Komachi Hikigaya", "1,2,3,5,6", "supporting", "比企谷小町", "Aoi Yuuki",
   "Hermana pequeña que quiere a su hermano podrido. Sale en cinco entregas."],

  ["Shizuka Hiratsuka", "1,2,3,5", "supporting", "平塚静", "Ryouka Yuzuki",
   "Profe fumadora que caso al club a la fuerza. Espejo adulto de la juventud equivocada."],

  ["Saki Kawasaki", "1,2,3,5", "supporting", "川崎沙希", "Ami Koshimizu",
   "Trabaja de noche para sacar a su familia. Sale en serie, OVA1, Zoku y Kan."],

  ["Taishi Kawasaki", "1,5", "supporting", "川崎大志", "Ayumu Murase",
   "Hermano pequeño de Saki. Sale en la serie y en Kan."],

  ["Haruno Yukinoshita", "1,3,5,6", "supporting", "雪ノ下陽乃", "Mai Nakahara",
   "Hermana mayor perfecta y cortante como un cuter. Sale en serie, Zoku, Kan y OVA3."],

  ["Hayato Hayama", "1,3,5", "supporting", "葉山隼人", "Takashi Kondou",
   "El perfecto que cumple hasta romperse. Sale en serie, Zoku y Kan."],

  ["Yumiko Miura", "1,2,3,5", "supporting", "三浦優美子", "Marina Inoue",
   "Reina de la clase con Ebina de escudera. Sale en serie, OVA1, Zoku y Kan."],

  ["Hina Ebina", "1,2,3,5", "supporting", "海老名姫菜", "Nozomi Sasaki",
   "Fujoshi que lo ve todo y lo cuenta a medias. Sale en serie, OVA1, Zoku y Kan."],

  ["Kakeru Tobe", "1,3,5", "supporting", "戸部翔", "Chado Horii",
   "Del grupo de Hayama, bocazas de buen fondo. Sale en serie, Zoku y Kan."],

  ["Yamato", "1,3", "supporting", "大和", "Yoshihisa Kawahara",
   "Del grupo de Hayama. Sale en la serie y en Zoku."],

  ["Oooka", "1,3", "supporting", "大岡", "Minoru Shiraishi",
   "Del grupo de Hayama. Sale en la serie y en Zoku."],

  ["Atsugi", "1,3", "supporting", "厚木", "Yoshihisa Kawahara",
   "Del grupo de Hayama. Sale en la serie y en Zoku."],

  ["Rumi Tsurumi", "1,3", "supporting", "鶴見留美", "Sumire Morohoshi",
   "Niña acosada del campamento que parte el club. Sale en la serie y en Zoku."],

  ["Yuka", "1", "supporting", "由香", "Ibuki Kido",
   "Compañera de clase. Sale en la serie."],

  ["Hitomi", "1", "supporting", "仁美", "Erii Yamazaki",
   "Compañera de clase. Sale en la serie."],

  ["Mori", "1", "supporting", "森", "Haruka Shiraishi",
   "Compañera de clase. Sale en la serie."],

  ["Yokko", "1", "supporting", "ヨッコ", "Megu Sakuragawa",
   "Compañera de clase. Sale en la serie."],

  ["Minami Sagami", "1", "supporting", "相模南", "Minako Kotobuki",
   "Presidenta del festival con ego fragil. Sale en la serie."],

  ["Meguri Shiromeguri", "1,3,5", "supporting", "城廻めぐり", "Azumi Asakura",
   "Presidenta del consejo que lo deja todo. Sale en serie, Zoku y Kan."],

  ["Tamanawa", "3,5", "supporting", "玉縄", "Satoshi Hino",
   "Del consejo con Iroha. Sale en Zoku y en Kan."],

  ["Kaori Orimoto", "3,5", "supporting", "折本かおり", "Haruka Tomatsu",
   "La que rechazo a Hachiman de primero. Sale en Zoku y en Kan."],

  ["Chika Nakamachi", "3", "supporting", "仲町千佳", "Saki Fujita",
   "Del consejo con Iroha. Sale en Zoku."],

  ["Keika Kawasaki", "3,5", "supporting", "川崎京華", "Azumi Asakura",
   "Hermana de Saki y Taishi. Sale en Zoku y en Kan."],

  ["Fujin Yuigahama", "3,5", "supporting", "由比ヶ浜母", "Sayaka Oohara",
   "Madre de Yui. Sale en Zoku y en Kan."],

  ["Yukino no Haha", "5,6", "supporting", "雪乃の母", "Kikuko Inoue",
   "Madre de las Yukinoshita, fria como el hielo. Sale en Kan y en el OVA3."],
];
