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