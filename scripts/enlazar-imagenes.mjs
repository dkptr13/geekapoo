// Enlaza imagenes de AniList en el catalogo.
//
//    node scripts/enlazar-imagenes.mjs [opciones]
//
//    --solo <que>      personajes | temporadas | animes  (por defecto: las tres)
//    --anime <id>      solo este anime, se puede repetir
//    --forzar          pisa imagenes que ya existem
//    --dry-run         enseña lo que haria y no escribe nada
//
// ── QUE HACE Y QUE NO HACE ─────────────────────────────────────────
//
// NO descarga ni sube ninguna imagen. Consulta la API de AniList y
// guarda solo la URL, en el campo que corresponda. El archivo se sigue
// sirviendo desde el CDN de AniList y nunca pasa por el servidor.
//
// Eso es enlazar, no copiar, y es la diferencia entre "apunto a donde
// esta" y "redistribuyo el trabajo del estudio". Aun asi, las
// condiciones de AniList hablan de uso personal y sin animo de lucro:
// quien use esto deberia haberlas leido, no confiar en el script.
//
// ── POR QUE HAY UN `--dry-run` ─────────────────────────────────────
//
// Porque la primera version de este script le puso la cara de Ruby
// Hoshino a Aqua Hoshino. Dos personajes del mismo anime, mismo
// apellido, y el emparejador se los comio porque solo miraba el
// apellido. No fallo con error: escribio una URL equivocada y
// seguimos como si nada. Con `--dry-run` se ve lo que va a poner
// ANTES de que lo escriba.
//
// ── A QUE CAMPOS ESCRIBE ──────────────────────────────────────────
//
//   personajes   imageUrl
//   temporadas   posterUrl  (portada vertical)
//                bannerUrl  (banner horizontal, opcional)
//   animes       coverUrl
//                bannerUrl
//
// Ni toca `imageFocus`, ni los likes, ni las fechas: el PATCH va con
// la mascara de un solo campo cada vez.
//
// ── LO QUE NO PUEDE HACER ─────────────────────────────────────────
//
//Imagenes de episodios. AniList y MyAnimeList no guardan una imagen
// por episodio: el `thumbnailUrl` de un capitulo no tiene fuente
// publica. No es un fallo del script, es que el dato no existe.
import { coleccion, escribir, str, num } from './firestore-rest.mjs';
import * as anilist from './anilist.mjs';
import { elegirTemporadas, normalizar } from './temporadas-anilist.mjs';
import { elegirPersonaje, similitud } from './personajes-anilist.mjs';
// ── Opciones ───────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const valor = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : null;
};
const dryRun = flag('--dry-run');
const forzar = flag('--forzar');
const solo = valor('--solo');
const pide = (que) => !solo || solo === que;
if (solo && !['personajes', 'temporadas', 'animes'].includes(solo)) {
  console.error(`  --solo debe ser: personajes, temporadas o animes`);
  process.exit(1);
}
// Animes que ya son. El id del documento es el slug, pero el nombre que
// se busca en AniList es el del campo `title`.
//
// OJO: los animes NO guardan el nombre en `name`, lo guardan en `title`.
const ANIMES = [
  { id: 'akame-ga-kill', buscar: 'Akame ga Kill!' },
  { id: 'ataque-a-los-titanes', buscar: 'Attack on Titan' },
  { id: 'chainsaw-man', buscar: 'Chainsaw Man' },
  { id: 'takopi-s-original-sin', buscar: 'Takopi' },
  { id: 'cyberpunk-edgerunners-2', buscar: 'Cyberpunk: Edgerunners' },
  { id: 'frieren-beyond-journeys-end', buscar: 'Frieren: Beyond Journey\'s End' },
  { id: 'jujutsu-kaisen', buscar: 'Jujutsu Kaisen' },
  { id: 'kaguya-sama-love-is-war', buscar: 'Kaguya-sama: Love Is War' },
  { id: 'mushoku-tensei-reencarnacion-desde-cero', buscar: 'Mushoku Tensei' },
  { id: 'oshi-no-ko', buscar: 'Oshi no Ko' },
  { id: 'tokyo-ghoul', buscar: 'Tokyo Ghoul' },
  { id: 'tokyo-revengers', buscar: 'Tokyo Revengers' },
  { id: 'witch-hat-atelier', buscar: 'Witch Hat Atelier' },
  { id: 'your-lie-in-april', buscar: 'Your Lie in April' },
  { id: 'neon-genesis-evangelion', buscar: 'Neon Genesis Evangelion' },
  { id: 'toradora', buscar: 'Toradora!' },
  { id: 'grand-blue', buscar: 'Grand Blue' },
  { id: 'no-game-no-life', buscar: 'No Game No Life' },
  { id: 'oshi-no-ko', buscar: 'Oshi no Ko' },
  { id: 'saekano-how-to-raise-a-boring-girlfriend', buscar: 'Saenai Heroine no Sodatekata' },
  { id: 'danmachi', buscar: 'Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka' },
  { id: 'plastic-memories', buscar: 'Plastic Memories' },
  { id: 'lycoris-recoil', buscar: 'Lycoris Recoil' },
  { id: 'ragna-crimson', buscar: 'Ragna Crimson' },
  { id: 'makeine-too-many-losing-heroines', buscar: 'Makeine' },
  { id: 'teasing-master-takagi-san', buscar: 'Karakai Jouzu no Takagi-san' },
  { id: 're-zero-comenzando-la-vida-en-otro-mundo', buscar: 'Re:Zero kara Hajimeru Isekai Seikatsu' },
  { id: 'seishun-buta-yaro-wa-bunny-girl-senpai-no-yume-wo-minai', buscar: 'Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai' },
  { id: 'las-quintillizas', buscar: 'Go-toubun no Hanayome' },
  { id: '86-eighty-six', buscar: '86: Eighty Six' },
  { id: 'konosuba', buscar: 'Kono Subarashii Sekai ni Shukufuku wo!' },
  { id: 'classroom-of-the-elite', buscar: 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e' },
  { id: 'my-dress-up-darling', buscar: 'Sono Bisque Doll wa Koi wo Suru' },
  { id: 'armed-girls-machiavellism', buscar: 'Busou Shoujo Machiavellianism' },
  { id: 'gachiakuta', buscar: 'Gachiakuta' },
  { id: 'kakegurui', buscar: 'Kakegurui' },
  { id: 'darwin-s-game', buscar: "Darwin's Game" },
  { id: 'golden-time', buscar: 'ゴールデンタイム' },
  { id: 'kubo-san-wa-mob-wo-yurusanai', buscar: 'Kubo-san wa Mob wo Yurusanai' },
  { id: 'guilty-crown', buscar: 'Guilty Crown' },
  { id: 'solo-leveling', buscar: 'Ore dake Level Up na Ken' },
  { id: 'kaiju-no-8', buscar: 'Kaijuu 8-gou' },
  { id: 'burn-the-witch', buscar: 'BURN THE WITCH' },
  { id: 'kampfer', buscar: 'Kampfer' },
  { id: 'masamune-kun-no-revenge', buscar: 'Masamune-kun no Revenge' },
  { id: 'kimetsu-no-yaiba', buscar: 'Kimetsu no Yaiba' },
  { id: 'zom-100-bucket-list-of-the-dead', buscar: 'Zom 100' },
  { id: 'viral-hit', buscar: 'Kenka Dokugaku' },
  { id: 'bocchi-the-rock', buscar: 'Bocchi the Rock!' },
  { id: 'girls-band-cry', buscar: 'GIRLS BAND CRY' },
  { id: 'yahari-ore-no-seishun-love-come-wa-machigatteiru', buscar: 'Yahari Ore no Seishun Love Come wa Machigatteiru' },
  { id: 'nisekoi', buscar: 'Nisekoi' },
  { id: 'k-on', buscar: 'K-ON!' },
  { id: 'kage-no-jitsuryokusha-ni-naritakute', buscar: 'Kage no Jitsuryokusha ni Naritakute' },
  { id: 'kimi-no-na-wa', buscar: 'Kimi no Na wa.' },
  { id: 'tenki-no-ko', buscar: 'Tenki no Ko' },
  { id: 'hello-world', buscar: 'HELLO WORLD' },
  { id: 'suzume-no-tojimari', buscar: 'Suzume no Tojimari' },
  { id: 'call-of-the-night', buscar: 'Yofukashi no Uta' },
  { id: 'goblin-slayer', buscar: 'Goblin Slayer' },
  { id: 'mirai-nikki', buscar: 'Mirai Nikki' },
  { id: 'sentenced-to-be-a-hero', buscar: 'Yuusha Kei ni Shosu' },
  { id: 'maboroshi', buscar: 'Alice to Therese no Maboroshi Koujou' },
  { id: 'kabaneri-of-the-iron-fortress', buscar: 'Koutetsujou no Kabaneri' },
  { id: 'kaoru-hana-wa-rin-to-saku', buscar: 'Kaoru Hana wa Rin to Saku' },
  { id: 'spy-family', buscar: 'SPY×FAMILY' },
  { id: 'date-a-live', buscar: 'Date A Live' },
  { id: 'high-school-of-the-dead', buscar: 'Highschool of the Dead' },
  { id: 'shimoneta', buscar: 'Shimoneta' },
  { id: 'smoking-behind-the-supermarket-with-you', buscar: 'Super no Ura de Yani Suu Futari' },
  { id: 'more-than-a-married-couple-but-not-lovers', buscar: 'Fuufu Ijou, Koibito Miman.' },
  { id: 'redo-of-healer', buscar: 'Kaifuku Jutsushi no Yarinaoshi' },
  { id: 'to-love-ru', buscar: 'To LOVE-Ru' },
  { id: 'rent-a-girlfriend', buscar: 'Kanojo, Okarishimasu' },
  { id: 'psycho-pass', buscar: 'Psycho-Pass' },
  { id: 'to-your-eternity', buscar: 'To Your Eternity' },
  { id: 'don-t-toy-with-me-miss-nagatoro', buscar: 'Ijiranaide, Nagatoro-san' },
  { id: 'the-shiunji-family-children', buscar: 'Shiunji-ke no Kodomotachi' },
  { id: 'dragon-raja', buscar: 'Long Zu' },
  { id: 'made-in-abyss', buscar: 'Made in Abyss' },
  { id: 'puella-magi-madoka-magica', buscar: 'Mahou Shoujo Madoka Magica' },
  { id: 'charlotte', buscar: 'Charlotte' },
  { id: 'death-note', buscar: 'Death Note' },
  { id: 'steins-gate', buscar: 'Steins;Gate' },
  { id: 'erased', buscar: 'Boku dake ga Inai Machi' },
  { id: 'koe-no-katachi', buscar: 'Koe no Katachi' },
  { id: 'blue-box', buscar: 'Blue Box' },
  { id: 'fire-force', buscar: 'Fire Force' },
  { id: 'overlord', buscar: 'Overlord' },
  { id: 'sword-art-online', buscar: 'Sword Art Online' },
  { id: 'the-promised-neverland', buscar: 'The Promised Neverland' },
  { id: 'one-punch-man', buscar: 'One Punch Man' },
  { id: 'mob-psycho-100', buscar: 'Mob Psycho 100' },
  { id: 'vinland-saga', buscar: 'Vinland Saga' },
  { id: 'hunter-x-hunter', buscar: 'Hunter x Hunter (2011)' },
  { id: 'tensei-shitara-slime-datta-ken', buscar: '転生したらスライムだった件' },
  { id: 'i-parry-everything', buscar: '俺は全てを【パリイ】する' },
  { id: 'marriagetoxin', buscar: 'Marriagetoxin' },
  { id: 'shinmai-maou-no-testament', buscar: '新妹魔王の契約者' },
  { id: 'blue-lock', buscar: 'Blue Lock' },
  { id: 'haikyuu', buscar: 'Haikyuu!!' },
  { id: 'the-tunnel-to-summer-the-exit-of-goodbyes', buscar: 'The Tunnel to Summer, the Exit of Goodbyes' },
  { id: 'bang-dream-ave-mujica', buscar: 'BanG Dream! Ave Mujica' },
  { id: 'love-chunibyo-and-other-delusions', buscar: 'Chuunibyou demo Koi ga Shitai!' },
  { id: 'dandadan', buscar: 'Dandadan' },
  { id: 'fullmetal-alchemist-brotherhood', buscar: 'Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST' },
  { id: 'the-rising-of-the-shield-hero', buscar: 'Tate no Yuusha no Nariagari' },
  { id: 'naruto', buscar: 'NARUTO' },
  { id: 'tsukimichi-moonlit-fantasy', buscar: 'Tsuki ga Michibiku Isekai Douchuu' },
  { id: 'violet-evergarden', buscar: 'Violet Evergarden' },
  { id: 'naruto-shippuden', buscar: 'NARUTO: Shippuuden' },
  { id: 'hell-s-paradise', buscar: 'Jigokuraku' },
  { id: 'kimi-ni-todoke-from-me-to-you', buscar: 'Kimi ni Todoke' },
  { id: 'sakamoto-days', buscar: 'SAKAMOTO DAYS' },
  { id: 'cosmic-princess-kaguya', buscar: 'Chou Kaguya-hime!' },
  { id: 'cyberpunk-edgerunners-season-2', buscar: 'Cyberpunk: Edgerunners 2' },
  { id: 'my-hero-academia', buscar: 'Boku no Hero Academia' },
  { id: 'another', buscar: 'Another' },
  { id: 'kill-la-kill', buscar: 'Kill la Kill' },
  { id: 'assassination-classroom', buscar: 'Ansatsu Kyoushitsu' },
  { id: 'code-geass-lelouch-of-the-rebellion', buscar: 'Code Geass: Lelouch of the Rebellion' },
  { id: 'code-geass-lelouch-of-the-rebellion-i-initiation', buscar: 'Code Geass: Lelouch of the Rebellion I - Initiation' },
  { id: 'code-geass-lelouch-of-the-rebellion-ii-transgression', buscar: 'Code Geass: Lelouch of the Rebellion II - Transgression' },
  { id: 'code-geass-lelouch-of-the-rebellion-iii-glorification', buscar: 'Code Geass: Lelouch of the Rebellion III - Glorification' },
  { id: 'code-geass-lelouch-of-the-re-surrection', buscar: 'Code Geass: Lelouch of the Re;surrection' },
  { id: 'arifureta-from-commonplace-to-world-s-strongest', buscar: 'Arifureta Shokugyou de Sekai Saikyou' },
  { id: 'gintama', buscar: 'Gintama' },
  { id: 'dr-stone', buscar: 'Dr. Stone' },
  { id: 'gleipnir', buscar: 'Gleipnir' },
  { id: 'king-s-game', buscar: "King's Game" },
  { id: 'mushi-shi', buscar: 'Mushishi' },
  { id: 'blood', buscar: 'Blood+' },
  { id: 'parasyte-the-maxim', buscar: 'Parasyte: The Maxim' },
  { id: 'berserk', buscar: 'Berserk' },
  { id: 'terror-in-resonance', buscar: 'Terror in Resonance' },
  { id: 'summer-time-render', buscar: 'Summer Time Render' },
  { id: 'jojo-s-bizarre-adventure', buscar: "JoJo's Bizarre Adventure" },
  { id: 'flcl', buscar: 'FLCL' },
  { id: 'samurai-champloo', buscar: 'Samurai Champloo' },
  { id: 'cowboy-bebop', buscar: 'Cowboy Bebop' },
  { id: 'serial-experiments-lain', buscar: 'Serial Experiments Lain' },
  { id: 'ranma-1-2', buscar: 'Ranma 1/2' },
  { id: 'monster', buscar: 'Monster' },
  { id: 'miss-kobayashi-s-dragon-maid', buscar: "Miss Kobayashi's Dragon Maid" },
  { id: 'mieruko-chan', buscar: 'Mieruko-chan' },
  { id: 'danganronpa-the-animation', buscar: 'Danganronpa: The Animation' },
  { id: 'angels-of-death', buscar: 'Angels of Death' },
  { id: 'el-diario-de-la-boticaria', buscar: 'The Apothecary Diaries' },

  // ── Fate ────────────────────────────────────────────────────────
  // La franquicia necesita el id de AniList: buscar "Fate/stay night"
  // devuelve una entrega cualquiera de las seis que se llaman parecido,
  // y la portada acaba en la ficha equivocada. Con `anilist` se salta la
  // busqueda y se va directo al media que corresponde.
  { id: 'fate-prototype', buscar: 'Fate/Prototype', anilist: 12565 },
  { id: 'fate-stay-night', buscar: 'Fate/stay night', anilist: 356 },
  { id: 'fate-zero', buscar: 'Fate/Zero', anilist: 10087 },
  {
    id: 'fate-stay-night-unlimited-blade-works',
    buscar: 'Fate/stay night: Unlimited Blade Works',
    anilist: 19603,
  },
  { id: 'fate-stay-night-heaven-s-feel-i-presage-flower', buscar: "Fate/stay night [Heaven's Feel] I. presage flower", anilist: 20791 },
  { id: 'fate-stay-night-heaven-s-feel-ii-lost-butterfly', buscar: "Fate/stay night [Heaven's Feel] II. lost butterfly", anilist: 21718 },
  { id: 'fate-stay-night-heaven-s-feel-iii-spring-song', buscar: "Fate/stay night [Heaven's Feel] III. spring song", anilist: 21719 },
  { id: 'fate-apocrypha', buscar: 'Fate/Apocrypha', anilist: 98035 },
  { id: 'fate-kaleid-liner-prisma-illya', buscar: 'Fate/kaleid liner Prisma☆Illya', anilist: 14829 },
  { id: 'fate-kaleid-liner-prisma-illya-2wei', buscar: 'Fate/kaleid liner Prisma☆Illya 2wei!', anilist: 20467 },
  { id: 'fate-kaleid-liner-prisma-illya-2wei-herz', buscar: 'Fate/kaleid liner Prisma☆Illya 2wei Herz!', anilist: 20845 },
  { id: 'fate-kaleid-liner-prisma-illya-3rei', buscar: 'Fate/kaleid liner Prisma☆Illya 3rei!!', anilist: 21379 },
  { id: 'fate-kaleid-liner-prisma-illya-sekka-no-chikai', buscar: 'Fate/kaleid liner Prisma☆Illya: Sekka no Chikai', anilist: 97757 },
  { id: 'fate-kaleid-liner-prisma-illya-licht-namae-no-nai-shoujo', buscar: 'Fate/kaleid liner Prisma☆Illya: Licht - Namae no Nai Shoujo', anilist: 118743 },
  { id: 'fate-extra-last-encore', buscar: 'Fate/EXTRA Last Encore', anilist: 21717 },
  { id: 'fate-grand-order-first-order', buscar: 'Fate/Grand Order: First Order', anilist: 97815 },
  { id: 'fate-grand-order-absolute-demonic-front-babylonia', buscar: 'Fate/Grand Order: Zettai Majuu Sensen Babylonia', anilist: 103275 },
  { id: 'fate-grand-order-camelot-wandering-agateram', buscar: 'Fate/Grand Order: Shinsei Entaku Ryouiki Camelot - Wandering; Agateram', anilist: 103276 },
  { id: 'fate-grand-order-camelot-paladin-agateram', buscar: 'Fate/Grand Order: Shinsei Entaku Ryouiki Camelot - Paladin; Agateram', anilist: 103277 },
  { id: 'fate-grand-order-solomon', buscar: 'Fate/Grand Order: Shuukyoku Tokuiten - Kani Jikan Shinden Solomon', anilist: 116756 },
  { id: 'emiya-san-chi-no-kyou-no-gohan', buscar: 'Emiya-san Chi no Kyou no Gohan', anilist: 100855 },
  { id: 'lord-el-melloi-ii-sei-no-jikenbo-rail-zeppelin-grace-note', buscar: 'Lord El-Melloi II-sei no Jikenbo: "Rail Zeppelin" Grace note', anilist: 106918 },
  { id: 'carnival-phantasm', buscar: 'Carnival Phantasm', anilist: 10012 },
  { id: 'fate-strange-fake', buscar: 'Fate/strange Fake', anilist: 166617 },
];
const soloAnimes = argv.reduce((acc, a, k) => (a === '--anime' ? [...acc, argv[k + 1]] : acc), []);

// El titulo con el que se busca en AniList no siempre es el que se
// guarda en el catalogo. La T3 de Hunter x Hunter va en castellano
// ("La última misión") y en AniList se llama "The Last Mission": sin
// esta traduccion el emparejador no la encuentra y la pelicula se
// queda sin portada.
//
//   anime -> { numero de temporada: titulo en AniList }
const TITULOS_EN_ANILIST = {
  'hunter-x-hunter': { 3: 'The Last Mission' },
  // El Slime: en AniList las pelis y los capitulos en DVD se llaman por
  // su titulo japones, y el emparejador los busca por el nuestro, que
  // esta en castellano. Con el titulo de AniList, cada temporada cae en
  // la suya: sin esto, la peli de 2026 se lleva la portada de la cuarta
  // temporada, que tambien es de 2026.
  'tensei-shitara-slime-datta-ken': {
    2: 'Tensei Shitara Slime Datta Ken OVA',
    4: 'Tensei Shitara Slime Datta Ken: Guren no Kizuna-hen',
    7: 'Tensei Shitara Slime Datta Ken: Soukai no Namida-hen',
    8: 'Tensei Shitara Slime Datta Ken 4th Season Part 1 & 2',
  },
  // Fate/Zero y Unlimited Blade Works tienen la segunda temporada como
  // media aparte en AniList, pero en el catalogo la temporada no lleva
  // titulo: sin el titulo de AniList, el emparejador solo tiene el año y
  // puede coger cualquier otra entrega de la franquicia del mismo año.
  'fate-zero': { 2: 'Fate/Zero 2nd Season' },
  'fate-stay-night-unlimited-blade-works': {
    2: 'Fate/stay night: Unlimited Blade Works 2nd Season',
  },
  // Illustrias es un media que AniList no separa: sus tres episodios van
  // dentro de la ficha de Last Encore. Se le da la portada de la serie.
  'fate-extra-last-encore': { 2: 'Fate/EXTRA Last Encore' },
};

/**
 * El media de AniList de un anime del catálogo.
 *
 * Con `anilist` se pide por id y no hay duda posible. Sin él, se busca
 * por título, que es lo que vale para el resto del catálogo.
 *
 * @returns {Promise<null|{base:object, todos:Map<number,object>}>}
 */
async function mediaDe(anime) {
  const semilla = anime.anilist ?? (await anilist.buscarAnime(anime.buscar))?.id;

  if (!semilla) return null;

  const { base, todos } = await anilist.arbol(semilla);

  return base ? { base, todos } : null;
}

// ── Estado ─────────────────────────────────────────────────────────
const cambios = [];
const omitidos = [];
let escritas = 0;
/**
 * Anota un campo a rellenar y lo escribe, salvo que ya tenga algo.
 *
 * No pisa lo que ya hay salvo que se pase `--forzar`: en un catalogo
 * con imagenes subidas a mano desde el panel, un `enlazar-imagenes` sin
 * ese flag se llevaria por delante el trabajo de quien las subio.
 */
async function poner(col, id, campo, valor, contexto, yaTiene) {
  if (!valor) {
    omitidos.push(`${contexto}: AniList no tiene ${campo}`);
    return;
  }
  if (yaTiene && yaTiene !== valor && !forzar) {
    omitidos.push(`${contexto}: ya tiene ${campo}, se deja (usa --forzar para pisar)`);
    return;
  }
  cambios.push({ col, id, campo, valor, contexto });
  if (dryRun) return;
  await escribir(col, id, { [campo]: { stringValue: valor } }, [campo]);
  escritas++;
}
// ── Arranque ───────────────────────────────────────────────────────
console.log(
  dryRun
    ? 'MODO PRUEBA: se enseña lo que se haria, no se escribe nada'
    : 'Escribiendo de verdad. Para mirar antes: --dry-run',
);
// ── 1. Personajes ──────────────────────────────────────────────────
if (pide('personajes')) {
  console.log('\n=== PERSONAJES');
  const chars = await coleccion('characters');
  for (const anime of ANIMES) {
    if (soloAnimes.length && !soloAnimes.includes(anime.id)) continue;
    const delAnime = chars.filter((c) => str(c.f, 'animeId') === anime.id);
    if (!delAnime.length) continue;
    const media = await mediaDe(anime);
    if (!media) {
      console.log(`\n${anime.id}: AniList no encuentra "${anime.buscar}"`);
      omitidos.push(`${anime.id}: AniList no encuentra "${anime.buscar}"`);
      continue;
    }
    const medio = media.base;
    const { todos } = media;

    // Los candidatos se sacan de TODAS las temporadas de la
    // franquicia, no solo de la primera. La lista de la T1 de Ataque a
    // los Titanes no tiene a Zeke (no sale hasta la T2) ni a Eren
    // Kruger, y a Historia la llama "Krista Lenz": buscar solo en la
    // base deja sin imagen justo a los personajes mas conocidos.
    const catalogo = await anilist.personajesDeFranquicia(todos);
    const sinImagen = delAnime.filter((c) => !str(c.f, 'imageUrl'));

    console.log(
      `\n${anime.id} -> AniList ${medio.id} (${medio.titulo}): ` +
        `${delAnime.length} personajes, ${delAnime.length - sinImagen.length} con imagen, ` +
        `${catalogo.length} candidatos de ${todos.size} temporadas`,
    );
    const sinPareja = [];
    // Los que ya tienen imagen solo se miran si se ha pedido pisarlos.
    const aMirar = forzar ? delAnime : sinImagen;
    // 1ª pasada: los que salen en la lista de personajes del anime.
    const quedan = [];
    for (const c of aMirar) {
      const { elegido, como } = elegirPersonaje(catalogo, str(c.f, 'name'), str(c.f, 'japaneseName'));
      if (!elegido) {
        // Se guarda el motivo del rechazo: sin el, el informe final
        // solo dice "no encontrada" y no se sabe si AniList no lo tiene
        // o si el emparejador no lo ha encontrado.
        quedan.push({ ...c, motivo: como });
        continue;
      }
      const marca = forzar && str(c.f, 'imageUrl') ? ' [pisa la anterior]' : '';
      console.log(`  ${str(c.f, 'name').padEnd(26)} <- ${elegido.nombre}   [${como}]${marca}`);
      await poner(
        'characters',
        c.id,
        'imageUrl',
        elegido.imagen,
        `${anime.id} / ${str(c.f, 'name')}`,
        str(c.f, 'imageUrl'),
      );
    }
    // 2ª pasada: los que no salen en la lista pueden estar en la ficha
    // propia del personaje en AniList. Solo se aceptan si el nombre
    // coincide de verdad Y el personaje sale en ESTE anime: sin los dos
    // filtros, "Miyu" acaba con la cara de una de Kaguya-sama.
    for (const c of quedan) {
      const nombre = str(c.f, 'name');
      const motivo = c.motivo;
      const hallados = await anilist.buscarPersonaje(nombre);
      const { elegido: porNombre } = elegirPersonaje(
        hallados ? [hallados] : [],
        nombre,
        '',
      );
      const saleEnEsteAnime = hallados?.animes.some((a) => todos.has(a.id));

      if (porNombre && hallados.imagen && saleEnEsteAnime) {
        console.log(
          `  ${nombre.padEnd(26)} <- ${hallados.nombre}   [ficha propia, sale en el anime]`,
        );

        await poner(
          'characters',
          c.id,
          'imageUrl',
          hallados.imagen,
          `${anime.id} / ${nombre}`,
          str(c.f, 'imageUrl'),
        );

        continue;
      }

      const porQue = !saleEnEsteAnime
        ? 'AniList lo tiene pero no sale en este anime'
        : 'no esta en AniList';

      sinPareja.push(`${nombre} (${motivo}; ${porQue})`);
    }

    if (sinPareja.length) {
      console.log(`  sin pareja (${sinPareja.length}):`);

      for (const x of sinPareja) console.log(`    - ${x}`);

      omitidos.push(...sinPareja.map((x) => `${anime.id}: ${x} sin pareja en AniList`));
    }
  }
}
// ── 2. Temporadas ──────────────────────────────────────────────────
if (pide('temporadas')) {
  console.log('\n=== TEMPORADAS');
  const seasons = await coleccion('seasons');
  for (const anime of ANIMES) {
    if (soloAnimes.length && !soloAnimes.includes(anime.id)) continue;
    const suyas = seasons.filter((s) => str(s.f, 'animeId') === anime.id);
    if (!suyas.length) continue;
    const media = await mediaDe(anime);
    if (!media) continue;
    const { base, todos } = media;
    console.log(
      `\n${anime.id} -> AniList ${base.id} (${base.titulo}): ` +
        `${suyas.length} temporadas, ${todos.size} medias relacionados`,
    );
    const laBase = base ?? [...todos.values()][0];
    const titulosEnAnilist = TITULOS_EN_ANILIST[anime.id] ?? {};
    const conNumeroYAnio = suyas.map((s) => ({
      numero: num(s, 'number') ?? 0,
      anio: num(s, 'year'),
      titulo: titulosEnAnilist[num(s, 'number') ?? 0] ?? str(s.f, 'title'),
    }));
    const decisiones = elegirTemporadas(conNumeroYAnio, todos, laBase);
    for (const [i, s] of suyas.entries()) {
      const { elegido, explicacion, empateCon } = decisiones[i];
      const n = num(s, 'number') ?? 0;
      const etiqueta = `${anime.id} T${n}`;
      if (!elegido) {
        console.log(`  T${n}: ${explicacion} (se deja como estaba)`);
        omitidos.push(`${etiqueta}: ${explicacion}`);
        continue;
      }
      console.log(
        `  T${n} -> ${elegido.titulo} (${elegido.anio ?? 'año ?'})   [${explicacion}]` +
          (empateCon ? `   EMPATE con "${empateCon}"` : ''),
      );
      await poner('seasons', s.id, 'posterUrl', elegido.portada, etiqueta, str(s.f, 'posterUrl'));
      await poner('seasons', s.id, 'bannerUrl', elegido.banner, etiqueta, str(s.f, 'bannerUrl'));
    }
  }
}
// ── 3. Animes ──────────────────────────────────────────────────────
if (pide('animes')) {
  console.log('\n=== ANIMES');
  const animes = await coleccion('animes');
  for (const a of ANIMES) {
    if (soloAnimes.length && !soloAnimes.includes(a.id)) continue;
    const doc = animes.find((x) => x.id === a.id);
    if (!doc) {
      omitidos.push(`${a.id}: no esta en Firestore`);
      continue;
    }
    const media = await mediaDe(a);
    if (!media) {
      omitidos.push(`${a.id}: AniList no encuentra "${a.buscar}"`);
      continue;
    }
    const medio = media.base;
    console.log(`  ${a.id} -> ${medio.titulo}`);
    await poner('animes', doc.id, 'coverUrl', medio.portada, a.id, str(doc.f, 'coverUrl'));
    await poner('animes', doc.id, 'bannerUrl', medio.banner, a.id, str(doc.f, 'bannerUrl'));
  }
}
// ── Final ──────────────────────────────────────────────────────────
console.log(
  `\n${dryRun ? 'SE PONDRIA ' : 'PUESTAS '}${cambios.length} URLs` +
    (dryRun ? ' (no se ha escrito nada)' : ` en ${escritas} documentos`),
);
if (omitidos.length) {
  console.log(`\n${omitidos.length} sin tocar:`);
  // Agrupados, que si no salen 300 lineas de lo mismo.
  const cuenta = new Map();
  for (const o of omitidos) {
    const motivo = o.includes('se deja') ? 'ya tenia imagen' : o.split(': ').slice(1).join(': ');
    cuenta.set(motivo, (cuenta.get(motivo) ?? 0) + 1);
  }
  for (const [motivo, n] of [...cuenta].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${motivo}`);
  }
}
if (dryRun && cambios.length) {
  console.log('\nPara hacerlo de verdad, quita el --dry-run.');
}
