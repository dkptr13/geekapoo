// Como buscar cada anime en AniList.
//    ver-anime.mjs busca por el titulo del catalogo, y hay animes cuyo
//    titulo guardado no es el que AniList conoce. "ataque-a-los-titanes"
//    esta guardado como "shingeki no kyoujin", en minusculas y con la
//    y distinta, y `buscarAnime` no lo encuentra.
//
// `enlazar-imagenes.mjs` ya tiene un termino de busqueda por anime, que
// es justamente para esto. aqui se copia el mismo, en vez de inventar
// otra lista, para que los dos scripts busquen lo mismo.

export const BUSQUEDAS = {
  'akame-ga-kill': 'Akame ga Kill!',
  'ataque-a-los-titanes': 'Attack on Titan',
  'chainsaw-man': 'Chainsaw Man',
  'cyberpunk-edgerunners-2': 'Cyberpunk: Edgerunners',
  'frieren-beyond-journeys-end': "Frieren: Beyond Journey's End",
  'jujutsu-kaisen': 'Jujutsu Kaisen',
  'kaguya-sama-love-is-war': 'Kaguya-sama: Love Is War',
  'mushoku-tensei-reencarnacion-desde-cero': 'Mushoku Tensei',
  'neon-genesis-evangelion': 'Neon Genesis Evangelion',
  'no-game-no-life': 'No Game No Life',
  'grand-blue': 'Grand Blue',
  'saekano-how-to-raise-a-boring-girlfriend': 'Saenai Heroine no Sodatekata',
  'takopi-s-original-sin': 'Takopi',
  'toradora': 'Toradora!',
  'tokyo-ghoul': 'Tokyo Ghoul',
  'tokyo-revengers': 'Tokyo Revengers',
  'witch-hat-atelier': 'Witch Hat Atelier',
  'your-lie-in-april': 'Your Lie in April',
  // TVDB no tiene nada con "Oshi no Ko": lo guarda con el titulo
  // japones original, con los corchetes, y con un segundo nombre para la
  // continuacion de 2024. Con "Oshi no Ko" la busqueda no devuelve nada
  // y el emparejador se salta el anime entero sin decir por que.
  //
  //   node scripts/tvdb-probar.mjs "【推しの子】"
  //
  // Salen dos series: 421069, la de 2023, y 445164, la continuacion. Con
  // este termino el emparejador se queda con la que mas capitulos
  // coincidan por titulo.
  'oshi-no-ko': '【推しの子】',
  'danmachi': 'ダンジョンに出会いを求めるのは間違っているだろうか',
  'plastic-memories': 'プラスティック・メモリーズ',
  'mk': '負けヒロインが多すぎる！',
  'tk': 'からかい上手の高木さん',
  're-zero-comenzando-la-vida-en-otro-mundo': 'Re:Zero kara Hajimeru Isekai Seikatsu',
  'seishun-buta-yaro-wa-bunny-girl-senpai-no-yume-wo-minai': '青春ブタ野郎はバニーガール先輩の夢を見ない',
  'las-quintillizas': 'Go-toubun no Hanayome',
  '86-eighty-six': '86: Eighty Six',
  'konosuba': 'Kono Subarashii Sekai ni Shukufuku wo!',
  'classroom-of-the-elite': 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e',
  'my-dress-up-darling': 'Sono Bisque Doll wa Koi wo Suru',
  'armed-girls-machiavellism': 'Busou Shoujo Machiavellianism',
  'gachiakuta': 'Gachiakuta',
  'kakegurui': 'Kakegurui',
  'darwin-s-game': "Darwin's Game",
  'golden-time': 'Golden Time',
  'kubo-san-wa-mob-wo-yurusanai': 'Kubo-san wa Mob wo Yurusanai',
  'guilty-crown': 'Guilty Crown',
  'solo-leveling': 'Ore dake Level Up na Ken',
  'kaiju-no-8': 'Kaijuu 8-gou',
  'burn-the-witch': 'BURN THE WITCH',
  'kampfer': 'けんぷファー',
  'masamune-kun-no-revenge': 'Masamune-kun no Revenge',
  'kimetsu-no-yaiba': 'Kimetsu no Yaiba',
  'zom-100-bucket-list-of-the-dead': 'ゾン100～ゾンビになるまでにしたい100のこと～',
  'viral-hit': '喧嘩独学',
  'bocchi-the-rock': 'ぼっち・ざ・ろっく！',
  'girls-band-cry': 'ガールズバンドクライ',
  'yahari-ore-no-seishun-love-come-wa-machigatteiru': 'やはり俺の青春ラブコメはまちがっている。',
  'nisekoi': 'ニセコイ',
  'k-on': 'けいおん！',
  'kage-no-jitsuryokusha-ni-naritakute': '陰の実力者になりたくて!',
  'kimi-no-na-wa': '君の名は。',
  'tenki-no-ko': '天気の子',
  'hello-world': 'HELLO WORLD',
  'suzume-no-tojimari': 'すずめの戸締まり',
  'call-of-the-night': 'よふかしのうた',
  'goblin-slayer': 'ゴブリンスレイヤー',
  'mirai-nikki': '未来日記',
  'sentenced-to-be-a-hero': '勇者刑に処す 懲罰勇者9004隊刑務記録',
  'maboroshi': 'アリスとテレスのまぼろし工場',
  'kabaneri-of-the-iron-fortress': '甲鉄城のカバネリ',
  'kaoru-hana-wa-rin-to-saku': '薫る花は凛と咲く',
  'spy-family': 'SPY×FAMILY',
  'date-a-live': 'デート・ア・ライブ',
  'high-school-of-the-dead': '学園黙示録HIGHSCHOOL OF THE DEAD',
  'shimoneta': '下ネタという概念が存在しない退屈な世界',
  'smoking-behind-the-supermarket-with-you': 'スーパーの裏でヤニ吸うふたり',
  'more-than-a-married-couple-but-not-lovers': '夫婦以上、恋人未満。',
  'redo-of-healer': '回復術士のやり直し',
  'to-love-ru': 'To LOVEる -とらぶる-',
  // El titulo japones, como en las ultimas fichas. Sin probar contra
  // TVDB todavia (la clave no estaba a mano); si el emparejador no la
  // encuentra, el plan B es "Kanojo, Okarishimasu".
  'rent-a-girlfriend': '彼女、お借りします',
  // El nombre exacto de la serie en TVDB (262090). Las búsquedas de
  // "Psycho-Pass" y de "サイコパス" la devuelven la primera.
  'psycho-pass': 'PSYCHO-PASS サイコパス',
  // El nombre exacto de la serie en TVDB (375271). Las búsquedas de
  // "To Your Eternity", "Fumetsu no Anata e" y "不滅のあなたへ" la
  // devuelven la única.
  'to-your-eternity': '不滅のあなたへ',
  // El nombre exacto de la serie en TVDB (385278).
  'don-t-toy-with-me-miss-nagatoro': 'イジらないで、長瀞さん',
  // El nombre exacto de la serie en TVDB (446141).
  'the-shiunji-family-children': '紫雲寺家の子供たち',
  // El nombre exacto de la serie en TVDB (423688, "龙族"). AniList la
  // llama igual: Long Zu.
  'dragon-raja': '龙族',
  // El nombre exacto de la serie en TVDB (326109). Con "Made in Abyss"
  // sale la primera, por delante de los cortos de Marulk.
  'made-in-abyss': 'メイドインアビス',
  // El nombre exacto de la serie en TVDB (219181).
  'puella-magi-madoka-magica': '魔法少女まどか☆マギカ',
  // El nombre exacto de la serie en TVDB (289679, "Charlotte" 2015).
  'charlotte': 'Charlotte',
  // El nombre exacto de la serie en TVDB (79481, 2006). Hay un especial
  // recortado y versiones de imagen real con nombres parecidos.
  'death-note': 'DEATH NOTE -デスノート-',
};

/**
 * Como buscar un anime, con el nombre del catalogo como reserva.
 *
 * @param {string} id      Id del anime en el catalogo.
 * @param {string} nombre  Titulo guardado en el catalogo.
 * @returns {string} Lo que se pasa a `anilist.buscarAnime`.
 */
export function comoBuscar(id, nombre) {
  return BUSQUEDAS[id] ?? nombre;
}