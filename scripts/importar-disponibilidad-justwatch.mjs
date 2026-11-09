// Rellena la disponibilidad regional de streaming desde JustWatch.
//    node scripts/importar-disponibilidad-justwatch.mjs [--anime <id>[,<id>...]] [--escribir] [--podar]
//
// Con `--anime` solo se consultan y se tocan las filas de esos animes.
// Con varios animes se leen en bloques de hasta 30 `animeId`; una
// importación completa mantiene la lectura de toda la colección.
//
// Sin `--escribir` no toca Firestore: es el modo de simulación.
// `--podar` (junto con `--escribir`) elimina las filas obsoletas de los
// animes seleccionados. Nunca toca otros animes y protege las filas
// manuales de plataformas/regiones que este importador no conoce.
//
// ── DE DONDE SALEN LOS DATOS ────────────────────────────────────────
//
// De las ofertas que JustWatch tiene para cada obra en cada pais. No se
// deduce nada: si JustWatch no lista una plataforma en un pais, esa
// plataforma no esta disponible alli. Es la misma fuente con la que se
// rellenaron las 6.660 filas que ya hay en `streamingAvailability`, y
// por eso los datos que ya existian coinciden con los que saca esto.
//
// ── QUE SE ESCRIBE ─────────────────────────────────────────────────
//
// Una fila por obra, plataforma y pais (`animeId__platformId__region`):
//
//   · Las ocho plataformas de siempre (Netflix, Crunchyroll, Disney+,
//     Amazon Prime Video, Max, Hulu, HIDIVE y U-NEXT) llevan fila en los
//     diez paises, con `available` donde hay oferta y `unavailable`
//     donde no. Asi la ficha puede decir "confirmado que no esta" en vez
//     de dejar el hueco.
//
//   · Las plataformas que solo existen en un pais (FOD y dAnime en
//     Japon, ADN en Francia y Alemania, la tienda de Apple) solo llevan
//     fila en los paises donde se han visto ofertas. No tiene sentido
//     decir que FOD no esta disponible en Espana: alli no opera.
//
// ── COMO SE COMPRUEBA ───────────────────────────────────────────────
//
// Sin `--escribir` no toca Firestore: saca por pantalla lo que pondria.
// Con `--escribir` actualiza las filas y crea las que falten. Los ids de
// JustWatch estan comprobados a mano contra el titulo y el ano de cada
// ficha; el script los vuelve a pedir y avisa si el titulo no es el
// esperado.

import {
  borrar,
  cliente,
  coleccion,
  crear,
  escribir,
  momento,
  s,
  uno,
} from './firestore-rest.mjs';
import {
  bloquesDe,
  claveDisponibilidad,
  clasificarDisponibilidad,
  crearConsultaDisponibilidad,
  indiceExistente,
  leerPaginado,
  normalizarIds,
} from './disponibilidad-justwatch-logic.mjs';

const args = process.argv.slice(2);
const escribirEnBase = args.includes('--escribir');
const podar = args.includes('--podar');
const soloAnime = new Set(
  args
    .flatMap((a, i) => (a === '--anime' ? (args[i + 1] ?? '').split(',') : []))
    .map((a) => a.trim())
    .filter(Boolean),
);
const filtrarAnime = soloAnime.size > 0;

const metricas = {
  animesProcesados: 0,
  consultas: 0,
  documentos: 0,
  nuevas: 0,
  actualizadas: 0,
  sinCambios: 0,
  repetidas: 0,
  obsoletas: 0,
  protegidas: 0,
  eliminadas: 0,
  escritas: 0,
  sinJustwatch: 0,
  filas: 0,
};

const REGIONES = ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB'];

const HOY = new Date().toISOString().slice(0, 10);

/**
 * Las fichas del catalogo y su id de JustWatch.
 *
 * `null` es una ficha que no esta en JustWatch. Se deja escrita para que
 * no parezca un olvido: Fate/Prototype es un OVA que no aparece en el
 * catalogo de JustWatch en ningun pais, asi que no hay oferta que
 * copiar. Se queda sin filas y la web enseña el aviso de que no hay
 * informacion verificada.
 *
 * @type {Record<string, { id: string | null, titulo: string, anio?: number }>}
 */
const FICHAS = {
  bleach: { id: 'ts15151', titulo: 'Bleach', anio: 2004 },
  'bleach-la-guerra-sangrienta-de-los-mil-anos': {
    id: 'ts369296',
    titulo: 'Bleach: Thousand-Year Blood War',
    anio: 2022,
  },
  'code-geass-lelouch-of-the-rebellion-iii-glorification': {
    id: 'tm351493',
    titulo: 'Code Geass: Lelouch of the Rebellion III - Glorification',
    anio: 2018,
  },
  'el-castillo-ambulante': { id: 'tm79928', titulo: "Howl's Moving Castle", anio: 2004 },
  'el-castillo-en-el-cielo': { id: 'tm121105', titulo: 'Castle in the Sky', anio: 1986 },
  'el-chico-y-la-garza': { id: 'tm1229026', titulo: 'The Boy and the Heron', anio: 2023 },
  'el-viaje-de-chihiro': { id: 'tm48297', titulo: 'Spirited Away', anio: 2001 },
  'el-viento-se-levanta': { id: 'tm173459', titulo: 'The Wind Rises', anio: 2013 },
  'haikyuu-la-batalla-del-basurero': {
    id: 'tm1390117',
    titulo: 'Haikyu!! The Dumpster Battle',
    anio: 2024,
  },
  horimiya: { id: 'ts254486', titulo: 'Horimiya', anio: 2021 },
  'k-on': { id: 'ts23917', titulo: 'K-ON!', anio: 2009 },
  kampfer: { id: 'ts23934', titulo: 'Kämpfer', anio: 2009 },
  'kiki-la-aprendiz-de-bruja': {
    id: 'tm140029',
    titulo: "Kiki's Delivery Service",
    anio: 1989,
  },
  'kill-la-kill': { id: 'ts34950', titulo: 'Kill la Kill', anio: 2013 },
  'la-princesa-mononoke': { id: 'tm192569', titulo: 'Princess Mononoke', anio: 1997 },
  'la-tumba-de-las-luciernagas': {
    id: 'tm54176',
    titulo: 'Grave of the Fireflies',
    anio: 1988,
  },
  'love-chunibyo-and-other-delusions': {
    id: 'ts27994',
    titulo: 'Love, Chunibyo & Other Delusions!',
    anio: 2012,
  },
  'mi-vecino-totoro': { id: 'tm38744', titulo: 'My Neighbor Totoro', anio: 1988 },
  'nausicaa-del-valle-del-viento': {
    id: 'tm170523',
    titulo: 'Nausicaä of the Valley of the Wind',
    anio: 1984,
  },
  'ponyo-en-el-acantilado': { id: 'tm35255', titulo: 'Ponyo', anio: 2008 },
  // Series que faltaban en el importador y que tienen oferta en Espana.
  erased: { id: 'ts42169', titulo: 'Erased', anio: 2016 },
  'hello-world': { id: 'tm488512', titulo: 'Hello World', anio: 2019 },
  'made-in-abyss': { id: 'ts58178', titulo: 'Made in Abyss', anio: 2017 },
  'mirai-nikki': { id: 'ts22232', titulo: 'Mirai Nikki', anio: 2011 },
  overlord: { id: 'ts37899', titulo: 'Overlord', anio: 2015 },
  'puella-magi-madoka-magica': {
    id: 'ts34087',
    titulo: 'Puella Magi Madoka Magica',
    anio: 2011,
  },
  'ranma-1-2': { id: 'ts20738', titulo: 'Ranma ½', anio: 1989 },
  'samurai-champloo': { id: 'ts31799', titulo: 'Samurai Champloo', anio: 2004 },
  shimoneta: { id: 'ts36567', titulo: 'Shimoneta', anio: 2015 },
  'steins-gate': { id: 'ts22244', titulo: 'Steins;Gate', anio: 2011 },
  toradora: { id: 'ts26322', titulo: 'Toradora!', anio: 2008 },
  'your-lie-in-april': { id: 'ts20249', titulo: 'Your Lie in April', anio: 2014 },
  'carnival-phantasm': { id: 'ts8669', titulo: 'カーニバル・ファンタズム', anio: 2011 },
  'emiya-san-chi-no-kyou-no-gohan': {
    id: 'ts77697',
    titulo: "Today's Menu for the Emiya Family",
    anio: 2018,
  },
  'fate-apocrypha': { id: 'ts57811', titulo: 'Fate/Apocrypha', anio: 2017 },
  'fate-extra-last-encore': { id: 'ts77770', titulo: 'Fate/Extra Last Encore', anio: 2018 },
  'fate-grand-order-first-order': {
    id: 'tm282915',
    titulo: 'Fate/Grand Order: First Order',
    anio: 2016,
  },
  'fate-grand-order-absolute-demonic-front-babylonia': {
    id: 'ts102805',
    titulo: 'Fate/Grand Order Absolute Demonic Front: Babylonia',
    anio: 2019,
  },
  'fate-grand-order-camelot-wandering-agateram': {
    id: 'tm920552',
    titulo: 'Fate/Grand Order the Movie: Divine Realm of the Round Table: Camelot 1 Wandering; Agateram',
    anio: 2020,
  },
  'fate-grand-order-camelot-paladin-agateram': {
    id: 'tm1038182',
    titulo: 'Fate/Grand Order the Movie: Divine Realm of the Round Table: Camelot 2 Paladin; Agateram',
    anio: 2021,
  },
  'fate-grand-order-solomon': {
    id: 'tm1042709',
    titulo: 'Fate/Grand Order Final Singularity – Grand Temple of Time: Solomon',
    anio: 2021,
  },
  'fate-kaleid-liner-prisma-illya': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  // JustWatch guarda las cuatro temporadas de Prisma Illya en una sola
  // ficha (S1 a S4), así que las cuatro fichas del catálogo leen las
  // mismas ofertas. Es lo que hay: no hay ofertas por temporada.
  'fate-kaleid-liner-prisma-illya-2wei': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  'fate-kaleid-liner-prisma-illya-2wei-herz': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  'fate-kaleid-liner-prisma-illya-3rei': {
    id: 'ts36927',
    titulo: 'Fate/kaleid liner Prisma Illya',
    anio: 2013,
  },
  'fate-kaleid-liner-prisma-illya-licht-namae-no-nai-shoujo': {
    id: 'tm1082546',
    titulo: 'Fate/kaleid liner Prisma☆Illya: Licht Nameless Girl',
    anio: 2021,
  },
  'fate-kaleid-liner-prisma-illya-sekka-no-chikai': {
    id: 'tm344285',
    titulo: 'Fate/kaleid liner Prisma☆Illya: Vow in the Snow',
    anio: 2017,
  },
  'fate-prototype': { id: null, titulo: 'Fate/Prototype' },
  'fate-stay-night': { id: 'ts4594', titulo: 'Fate/stay night', anio: 2006 },
  'fate-stay-night-heaven-s-feel-i-presage-flower': {
    id: 'tm244203',
    titulo: "Fate/stay night: Heaven's Feel I. Presage Flower",
    anio: 2017,
  },
  'fate-stay-night-heaven-s-feel-ii-lost-butterfly': {
    id: 'tm370687',
    titulo: "Fate/stay night: Heaven's Feel II. Lost Butterfly",
    anio: 2019,
  },
  'fate-stay-night-heaven-s-feel-iii-spring-song': {
    id: 'tm370688',
    titulo: "Fate/stay night: Heaven's Feel III. Spring Song",
    anio: 2020,
  },
  'fate-stay-night-unlimited-blade-works': {
    id: 'ts4696',
    titulo: 'Fate/stay night: Unlimited Blade Works',
    anio: 2014,
  },
  'fate-strange-fake': { id: 'ts394931', titulo: 'Fate/strange Fake', anio: 2024 },
  'fate-zero': { id: 'ts11151', titulo: 'Fate/Zero', anio: 2011 },
  // JustWatch la tiene como la serie de 1999 (objectId 529703). La de
  // 2023 es otra ficha (255424) y no se toca.
  'one-piece': { id: 'ts529703', titulo: 'One Piece', anio: 1999 },
  'lord-el-melloi-ii-sei-no-jikenbo-rail-zeppelin-grace-note': {
    id: 'ts86890',
    titulo: "Lord El-Melloi II's Case Files {Rail Zeppelin} Grace note",
    anio: 2019,
  },
  // Fichas nuevas comprobadas en JustWatch Espana (noviembre de 2026).
  // Solo se anaden las que tienen una oferta real en Espana; las que
  // no la tienen se quedan sin filas para no inventar disponibilidad.
  akira: { id: 'tm44887', titulo: 'Akira', anio: 1988 },
  'black-clover': { id: 'ts296797', titulo: 'Black Clover', anio: 2017 },
  'black-clover-la-espada-del-rey-mago': {
    id: 'tm1263423',
    titulo: 'Black Clover: Sword of the Wizard King',
    anio: 2023,
  },
  'blue-exorcist': { id: 'ts9246', titulo: 'Blue Exorcist', anio: 2011 },
  'bungo-stray-dogs': { id: 'ts42256', titulo: 'Bungo Stray Dogs', anio: 2016 },
  'delicious-in-dungeon': { id: 'ts363407', titulo: 'Delicious in Dungeon', anio: 2024 },
  'devilman-crybaby': { id: 'ts76865', titulo: 'Devilman Crybaby', anio: 2018 },
  dorohedoro: { id: 'ts221749', titulo: 'Dorohedoro', anio: 2020 },
  'fairy-tail': { id: 'ts20513', titulo: 'Fairy Tail', anio: 2009 },
  'fruits-basket': { id: 'ts87522', titulo: 'Fruits Basket', anio: 2019 },
  'nanatsu-no-taizai': { id: 'ts314002', titulo: 'The Seven Deadly Sins', anio: 2014 },
  noragami: { id: 'ts41161', titulo: 'Noragami', anio: 2014 },
  'ouran-high-school-host-club': {
    id: 'ts20544',
    titulo: 'Ouran High School Host Club',
    anio: 2006,
  },
  'odd-taxi': { id: 'ts271380', titulo: 'ODDTAXI', anio: 2021 },
  'undead-unluck': { id: 'ts364174', titulo: 'Undead Unluck', anio: 2023 },
  'vivy-fluorite-eye-s-song': {
    id: 'ts271378',
    titulo: 'Vivy: Fluorite Eye’s Song',
    anio: 2021,
  },
  // Fichas nuevas comprobadas en JustWatch (noviembre de 2026).
  '86-eighty-six': { id: 'ts227439', titulo: '86: Eighty-Six', anio: 2021 },
  'akame-ga-kill': { id: 'ts20066', titulo: 'Akame ga Kill!', anio: 2014 },
  'angel-beats': { id: 'ts30083', titulo: 'Angel Beats!', anio: 2010 },
  'angels-of-death': { id: 'ts396064', titulo: 'Satsuriku no Tenshi', anio: 2018 },
  'anohana-the-flower-we-saw-that-day': { id: 'ts7708', titulo: 'Anohana: The Flower We Saw That Day', anio: 2011 },
  'another': { id: 'ts28014', titulo: 'Another', anio: 2012 },
  'arifureta-from-commonplace-to-world-s-strongest': { id: 'ts87564', titulo: 'Arifureta Shokugyou de Sekai Saikyou', anio: 2019 },
  'armed-girls-machiavellism': { id: 'ts56108', titulo: 'Busou Shoujo Machiavellianism', anio: 2017 },
  'assassination-classroom': { id: 'ts21984', titulo: 'Ansatsu kyôshitsu', anio: 2015 },
  'baccano': { id: 'ts13213', titulo: 'Baccano!', anio: 2007 },
  'bang-dream-ave-mujica': { id: 'ts403267', titulo: 'BanG Dorîmu! Ave Mujica', anio: 2025 },
  'berserk': { id: 'ts345', titulo: 'Berserk', anio: 1997 },
  'black-lagoon': { id: 'ts199', titulo: 'Black Lagoon', anio: 2006 },
  'blood': { id: 'ts18020', titulo: 'Blood+', anio: 2005 },
  'blue-box': { id: 'ts361082', titulo: 'La caja azul', anio: 2024 },
  'blue-lock': { id: 'ts304470', titulo: 'BLUELOCK', anio: 2022 },
  'bocchi-the-rock': { id: 'ts273226', titulo: 'BOCCHI THE ROCK!', anio: 2022 },
  'burn-the-witch': { id: 'ts255255', titulo: 'Burn the Witch', anio: 2020 },
  'call-of-the-night': { id: 'ts317669', titulo: 'Call of the night', anio: 2022 },
  'chainsaw-man': { id: 'ts269483', titulo: 'Chainsaw Man', anio: 2022 },
  'charlotte': { id: 'ts36080', titulo: 'Charlotte', anio: 2015 },
  'clannad': { id: 'ts22019', titulo: 'Clannad', anio: 2007 },
  'classroom-of-the-elite': { id: 'ts58045', titulo: 'Classroom of the Elite', anio: 2017 },
  'code-geass-lelouch-of-the-re-surrection': { id: 'tm437427', titulo: 'Code Geass: Fukkatsu no Lelouch', anio: 2019 },
  'code-geass-lelouch-of-the-rebellion': { id: 'ts12787', titulo: 'Code Geass: La Rebelión de Lelouch', anio: 2006 },
  'code-geass-lelouch-of-the-rebellion-i-initiation': { id: 'tm351502', titulo: 'Code Geass: Lelouch of the Rebellion I — Initiation', anio: 2017 },
  'code-geass-lelouch-of-the-rebellion-ii-transgression': { id: 'tm351495', titulo: 'Code Geass: Lelouch of the Rebellion II - Transgression', anio: 2018 },
  'cosmic-princess-kaguya': { id: 'tm1909252', titulo: 'La princesa Kaguya del cosmos', anio: 2026 },
  'cowboy-bebop': { id: 'ts34435', titulo: 'Cowboy Bebop', anio: 1998 },
  'cyberpunk-edgerunners-2': { id: 'ts250831', titulo: 'Cyberpunk: Edgerunners', anio: 2022 },
  'cyberpunk-edgerunners-season-2': { id: null, titulo: 'Cyberpunk: Edgerunners Season 2', anio: 2026 },
  'dandadan': { id: 'ts413191', titulo: 'Dan Da Dan', anio: 2024 },
  'danganronpa-the-animation': { id: 'ts18865', titulo: 'Danganronpa The Animation', anio: 2013 },
  'danmachi': { id: 'ts35578', titulo: 'DanMachi: ¿Qué tiene de malo intentar ligar en una mazmorra?', anio: 2015 },
  'darwin-s-game': { id: 'ts87471', titulo: 'Darwin’s Game', anio: 2020 },
  'date-a-live': { id: 'ts33329', titulo: 'Date A Live', anio: 2013 },
  'death-note': { id: 'ts11313', titulo: 'Death Note', anio: 2006 },
  'don-t-toy-with-me-miss-nagatoro': { id: 'ts251033', titulo: 'Don\'t Toy With Me, Miss Nagatoro', anio: 2021 },
  'dr-stone': { id: 'ts87563', titulo: 'Dr. Stone', anio: 2019 },
  'dragon-raja': { id: 'ts252037', titulo: 'Dragon Raja', anio: 2022 },
  'el-diario-de-la-boticaria': { id: 'ts395707', titulo: 'Los diarios de la boticaria', anio: 2023 },
  'fire-force': { id: 'ts89550', titulo: 'Fire Force', anio: 2019 },
  'flcl': { id: 'ts724', titulo: 'FLCL', anio: 2000 },
  'frieren-beyond-journeys-end': { id: 'ts364792', titulo: 'Sōsō no Frieren', anio: 2023 },
  'fullmetal-alchemist-brotherhood': { id: 'ts21482', titulo: 'Fullmetal Alchemist: Brotherhood', anio: 2009 },
  'gachiakuta': { id: 'ts437012', titulo: 'Gachiakuta', anio: 2025 },
  'gintama': { id: 'ts29406', titulo: 'Gintama', anio: 2006 },
  'girls-band-cry': { id: 'ts415958', titulo: 'Girls Band Cry', anio: 2024 },
  'gleipnir': { id: 'ts223258', titulo: 'Gleipnir', anio: 2020 },
  'goblin-slayer': { id: 'ts84141', titulo: 'Goblin Slayer', anio: 2018 },
  'golden-time': { id: 'ts44158', titulo: 'Golden Time', anio: 2013 },
  'grand-blue': { id: 'ts80747', titulo: 'Grand Blue', anio: 2018 },
  'guilty-crown': { id: 'ts26495', titulo: 'Guilty Crown', anio: 2011 },
  'gurren-lagann': { id: 'ts35155', titulo: 'Tengen Toppa Gurren-Lagann', anio: 2007 },
  'haikyuu': { id: 'ts20112', titulo: 'Haikyuu!! Los ases del vóley', anio: 2014 },
  'hell-s-paradise': { id: 'ts271931', titulo: 'Hell\'s Paradise', anio: 2023 },
  'high-school-of-the-dead': { id: 'ts30082', titulo: 'Apocalipsis en el instituto', anio: 2010 },
  'hunter-x-hunter': { id: 'ts32835', titulo: 'Hunter × Hunter', anio: 2011 },
  'i-parry-everything': { id: 'ts410723', titulo: 'I Parry Everything!', anio: 2024 },
  'jojo-s-bizarre-adventure': { id: 'ts30637', titulo: 'JoJo\'s Bizarre Adventure', anio: 2012 },
  'jujutsu-kaisen': { id: 'ts222852', titulo: 'Jujutsu Kaisen', anio: 2020 },
  'kabaneri-of-the-iron-fortress': { id: 'ts38712', titulo: 'Kabaneri de la Fortaleza de Hierro', anio: 2016 },
  'kage-no-jitsuryokusha-ni-naritakute': { id: 'ts281904', titulo: 'The Eminence in Shadow', anio: 2022 },
  'kaguya-sama-love-is-war': { id: 'ts84657', titulo: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen', anio: 2019 },
  'kaiju-no-8': { id: 'ts365566', titulo: 'Kaiju No. 8', anio: 2024 },
  'kakegurui': { id: 'ts57814', titulo: 'Kakegurui', anio: 2017 },
  'kaoru-hana-wa-rin-to-saku': { id: 'ts450197', titulo: 'La nobleza de las flores', anio: 2025 },
  'kimetsu-no-yaiba': { id: 'ts87466', titulo: 'Guardians de la nit: Kimetsu no Yaiba', anio: 2019 },
  'kimi-ni-todoke-from-me-to-you': { id: 'ts52881', titulo: 'Kimi ni Todoke', anio: 2009 },
  'kimi-no-na-wa': { id: 'tm233386', titulo: 'Your Name.', anio: 2016 },
  'king-s-game': { id: 'ts75858', titulo: 'King\'s Game', anio: 2017 },
  'koe-no-katachi': { id: 'tm233425', titulo: 'A Silent Voice', anio: 2016 },
  'konosuba': { id: 'ts44928', titulo: 'Kono subarashii sekai ni shukufuku o!', anio: 2016 },
  'kubo-san-wa-mob-wo-yurusanai': { id: 'ts351970', titulo: 'Kubo-san wa Mob wo Yurusanai', anio: 2023 },
  'las-quintillizas': { id: 'ts86186', titulo: 'Las Quintillizas', anio: 2019 },
  'lycoris-recoil': { id: 'ts321080', titulo: 'Rikorisu rikoiru', anio: 2022 },
  'maboroshi': { id: 'tm1342508', titulo: 'maboroshi', anio: 2023 },
  'makeine-too-many-losing-heroines': { id: 'ts415175', titulo: 'Make Heroine ga Oosugiru!', anio: 2024 },
  'marriagetoxin': { id: 'ts508897', titulo: 'Marriagetoxin', anio: 2026 },
  'masamune-kun-no-revenge': { id: 'ts53365', titulo: 'Masamune-kun\'s Revenge', anio: 2017 },
  'mieruko-chan': { id: 'ts285135', titulo: 'Mieruko-chan', anio: 2021 },
  'miss-kobayashi-s-dragon-maid': { id: 'ts53369', titulo: 'La sirvienta dragón de Kobayashi-san', anio: 2017 },
  'mob-psycho-100': { id: 'ts39013', titulo: 'Mob Psycho 100', anio: 2016 },
  'monster': { id: 'ts31787', titulo: 'Monster', anio: 2004 },
  'more-than-a-married-couple-but-not-lovers': { id: 'ts326294', titulo: 'Fuufu Ijou, Koibito Miman', anio: 2022 },
  'mushi-shi': { id: 'ts26050', titulo: 'Mushi-Shi', anio: 2005 },
  'mushoku-tensei-reencarnacion-desde-cero': { id: 'ts222366', titulo: 'Mushoku Tensei Jobless Reincarnation', anio: 2021 },
  'my-dress-up-darling': { id: 'ts286543', titulo: 'Sono Bisque Doll wa Koi wo Suru', anio: 2022 },
  'my-hero-academia': { id: 'ts38725', titulo: 'My Hero Academia', anio: 2016 },
  'nana': { id: 'ts28949', titulo: 'Nana', anio: 2006 },
  'naruto': { id: 'ts20305', titulo: 'Naruto', anio: 2002 },
  'naruto-shippuden': { id: 'ts22069', titulo: 'Naruto Shippuden', anio: 2007 },
  'neon-genesis-evangelion': { id: 'ts20983', titulo: 'Neon Genesis Evangelion', anio: 1995 },
  'nisekoi': { id: 'ts35492', titulo: 'Nisekoi', anio: 2014 },
  'no-game-no-life': { id: 'ts23054', titulo: 'No Game No Life', anio: 2014 },
  'one-punch-man': { id: 'ts37539', titulo: 'One-Punch Man', anio: 2015 },
  'oshi-no-ko': { id: 'ts354570', titulo: 'Oshi no Ko', anio: 2023 },
  'parasyte-the-maxim': { id: 'ts20250', titulo: 'Parasyte: The Maxim', anio: 2014 },
  'plastic-memories': { id: 'ts35373', titulo: 'Plastic Memories', anio: 2015 },
  'psycho-pass': { id: 'ts20388', titulo: 'Psycho-Pass', anio: 2012 },
  'ragna-crimson': { id: 'ts342987', titulo: 'Ragna Crimson', anio: 2023 },
  're-zero-comenzando-la-vida-en-otro-mundo': { id: 'ts41257', titulo: 'Re: Zero - Empezar de cero en un mundo diferente', anio: 2016 },
  'redo-of-healer': { id: 'ts225124', titulo: 'La venganza del sanador', anio: 2021 },
  'rent-a-girlfriend': { id: 'ts231077', titulo: 'Rent-A-Girlfriend', anio: 2020 },
  'saekano-how-to-raise-a-boring-girlfriend': { id: 'ts55531', titulo: 'Saenai Heroine no Sodatekata', anio: 2015 },
  'sakamoto-days': { id: 'ts361081', titulo: 'Sakamoto Days', anio: 2025 },
  'seishun-buta-yaro-wa-bunny-girl-senpai-no-yume-wo-minai': { id: 'ts84280', titulo: 'Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai', anio: 2018 },
  'sentenced-to-be-a-hero': { id: 'ts435524', titulo: 'Sentenced to Be a Hero: The Prison Records of Penal Hero Unit 9004', anio: 2026 },
  'serial-experiments-lain': { id: 'ts25674', titulo: 'Serial Experiments Lain', anio: 1998 },
  'ataque-a-los-titanes': { id: 'ts20682', titulo: 'Ataque a los titanes', anio: 2013 },
  'shinmai-maou-no-testament': { id: 'ts37860', titulo: 'Shinmai Maou no Testament', anio: 2015 },
  'smoking-behind-the-supermarket-with-you': { id: 'ts488719', titulo: 'Fumando juntos detrás del súper', anio: 2026 },
  'solo-leveling': { id: 'ts359486', titulo: 'Solo Leveling', anio: 2024 },
  'soul-eater': { id: 'ts25863', titulo: 'Soul Eater', anio: 2008 },
  'spy-family': { id: 'ts283022', titulo: 'SPY x FAMILY', anio: 2022 },
  'summer-time-render': { id: 'ts272296', titulo: 'Summer Time Render', anio: 2022 },
  'suzume-no-tojimari': { id: 'tm1194463', titulo: 'Suzume', anio: 2022 },
  'sword-art-online': { id: 'ts89424', titulo: 'Sword Art Online', anio: 2012 },
  'takopi-s-original-sin': { id: 'ts471712', titulo: 'Takopi\'s Original Sin', anio: 2025 },
  'teasing-master-takagi-san': { id: 'ts77518', titulo: 'Takagi-san: Experta en bromas pesadas', anio: 2018 },
  'tenki-no-ko': { id: 'tm448004', titulo: 'El tiempo contigo', anio: 2019 },
  'tensei-shitara-slime-datta-ken': { id: 'ts84230', titulo: 'That Time I Got Reincarnated as a Slime', anio: 2018 },
  'terror-in-resonance': { id: 'ts20686', titulo: 'Terror en Tokio', anio: 2014 },
  'the-promised-neverland': { id: 'ts84633', titulo: 'Yakusoku no Neverland', anio: 2019 },
  'the-rising-of-the-shield-hero': { id: 'ts84631', titulo: 'The Rising of the Shield Hero', anio: 2019 },
  'the-shiunji-family-children': { id: 'ts458271', titulo: 'The Shiunji Family Children', anio: 2025 },
  'the-tunnel-to-summer-the-exit-of-goodbyes': { id: 'tm1169570', titulo: 'El túnel de los deseos', anio: 2022 },
  'to-love-ru': { id: 'ts20522', titulo: 'Toraburu', anio: 2008 },
  'to-your-eternity': { id: 'ts224077', titulo: 'To Your Eternity', anio: 2021 },
  'tokyo-ghoul': { id: 'ts20202', titulo: 'Tokyo Ghoul', anio: 2014 },
  'tokyo-revengers': { id: 'ts249912', titulo: 'Tokyo Revengers', anio: 2021 },
  'tsukimichi-moonlit-fantasy': { id: 'ts256059', titulo: 'Tsukimichi -Moonlit Fantasy-', anio: 2021 },
  'vinland-saga': { id: 'ts90311', titulo: 'Vinland Saga', anio: 2019 },
  'violet-evergarden': { id: 'ts76869', titulo: 'Violet Evergarden', anio: 2018 },
  'viral-hit': { id: 'ts421509', titulo: 'Viral Hit', anio: 2024 },
  'witch-hat-atelier': { id: 'ts435860', titulo: 'Witch Hat Atelier', anio: 2026 },
  'yahari-ore-no-seishun-love-come-wa-machigatteiru': { id: 'ts44387', titulo: 'Yahari Ore no Seishun Love Comedy wa Machigatteiru.', anio: 2013 },
  'zom-100-bucket-list-of-the-dead': { id: 'ts378094', titulo: 'Zom 100: Cien cosas que quiero hacer antes de convertirme en zombi', anio: 2023 },
  // Películas añadidas en la tanda de noviembre de 2026. El id está
  // comprobado contra el título y el año de JustWatch en España.
  belle: { id: 'tm998992', titulo: 'Belle', anio: 2021 },
  'guardianes-de-la-noche-tren-infinito': {
    id: 'tm842683',
    titulo: 'Guardianes de la Noche: Tren infinito',
    anio: 2020,
  },
  'jujutsu-kaisen-0': { id: 'tm1040315', titulo: 'Jujutsu Kaisen 0', anio: 2021 },
  'la-chica-que-saltaba-a-traves-del-tiempo': {
    id: 'tm32198',
    titulo: 'La chica que saltaba a través del tiempo',
    anio: 2006,
  },
  'los-ninos-lobo': { id: 'tm43008', titulo: 'Los niños lobo', anio: 2012 },
  'the-first-slam-dunk': { id: 'tm1095723', titulo: 'The First Slam Dunk', anio: 2022 },
  // Películas de Studio Ghibli añadidas en la tanda de noviembre de 2026.
  // El id está comprobado contra el título y el año de JustWatch en España.
  'el-cuento-de-la-princesa-kaguya': {
    id: 'tm172808',
    titulo: 'El cuento de la princesa Kaguya',
    anio: 2013,
  },
  'el-recuerdo-de-marnie': { id: 'tm157049', titulo: 'El recuerdo de Marnie', anio: 2014 },
  'arrietty-y-el-mundo-de-los-diminutos': {
    id: 'tm102394',
    titulo: 'Arrietty y el mundo de los diminutos',
    anio: 2010,
  },
  'la-colina-de-las-amapolas': {
    id: 'tm181563',
    titulo: 'La colina de las amapolas',
    anio: 2011,
  },
  'susurros-del-corazon': { id: 'tm13620', titulo: 'Susurros del corazón', anio: 1995 },
  'haru-en-el-reino-de-los-gatos': {
    id: 'tm116967',
    titulo: 'Haru en el reino de los gatos',
    anio: 2002,
  },
};

/**
 * De que paquete de JustWatch sale cada plataforma del catalogo.
 *
 * Los canales de Amazon de un servicio (Crunchyroll, HIDIVE, dAnime,
 * AnimeBox) se quedan con el servicio: el contenido y la suscripcion son
 * los mismos.
 * Las tiendas de compra y alquiler que no interesan aqui (Amazon Video,
 * Fandango, DVDs) no estan en la lista.
 */
const NUCLEO = {
  crunchyroll: 'crunchyroll',
  amazoncrunchyroll: 'crunchyroll',
  netflix: 'netflix',
  netflixbasicwithads: 'netflix',
  hulu: 'hulu',
  disneyplus: 'disney-plus',
  hidive: 'hidive',
  amazonhidive: 'hidive',
  unext: 'u-next',
  amazonprime: 'amazon-prime-video',
  amazonprimevideowithads: 'amazon-prime-video',
  max: 'max',
  hbomax: 'max',
};

const EXTRA = {
  fod: 'fod',
  amazondanime: 'd-anime-store',
  animedigitalnetwork: 'animation-digital-network',
  amazonanimedigital: 'animation-digital-network',
  itunes: 'apple-tv',
  animebox: 'animebox',
  amazonanimeboxchannel: 'animebox',
  movistar: 'movistar-plus',
  movistarott: 'movistar-plus',
  filmin: 'filmin',
  atres: 'atresplayer',
  rtve: 'rtve-play',
};

/** Paises donde opera cada plataforma que no es global. */
const PAISES_EXTRA = {
  fod: ['JP'],
  'd-anime-store': ['JP'],
  'animation-digital-network': ['FR', 'DE'],
  'apple-tv': REGIONES,
  animebox: ['ES'],
  'movistar-plus': ['ES'],
  filmin: ['ES'],
  atresplayer: ['ES'],
  'rtve-play': ['ES'],
};

/**
 * Plataformas que este importador puede generar. Las filas obsoletas de
 * una plataforma ajena a esta lista se consideran manuales y no se borran.
 */
const PLATAFORMAS_CONOCIDAS = [
  ...new Set([...Object.values(NUCLEO), ...Object.values(EXTRA)]),
].sort();

/** Como se llama cada plataforma nueva en Firestore. */
const PLATAFORMAS_NUEVAS = [
  { id: 'animebox', name: 'AnimeBox', badgeColor: '#e91e63', order: 200 },
  { id: 'd-anime-store', name: 'dAnime Store', badgeColor: '#f39800', order: 210 },
  { id: 'fod', name: 'FOD', badgeColor: '#00a0e9', order: 220 },
  {
    id: 'animation-digital-network',
    name: 'Animation Digital Network (ADN)',
    badgeColor: '#ca8a04',
    order: 230,
  },
  { id: 'apple-tv', name: 'Apple TV (alquiler y compra)', badgeColor: '#52525b', order: 240 },
];

const ACCESO = {
  FLATRATE: 'subscription',
  FREE: 'free_ads',
  ADS: 'free_ads',
  RENT: 'rental',
  BUY: 'purchase',
};

/** Orden de preferencia cuando una plataforma tiene varias ofertas. */
const PREFERENCIA = { subscription: 4, free_ads: 3, rental: 2, purchase: 1, unknown: 0 };

const CONSULTA = `
query Ofertas($id: ID!, $pais: Country!) {
  node(id: $id) {
    ... on MovieOrShow {
      id
      objectType
      content(country: $pais, language: en) { title originalReleaseYear }
      offers(country: $pais, platform: WEB) {
        monetizationType
        standardWebURL
        package { clearName technicalName }
      }
    }
  }
}
`;

async function pedir(id, pais) {
  let ultimoError;

  for (let intento = 0; intento < 4; intento++) {
    try {
      const r = await fetch('https://apis.justwatch.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({
          operationName: 'Ofertas',
          variables: { id, pais },
          query: CONSULTA,
        }),
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const j = await r.json();

      if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 120));

      return j.data?.node ?? null;
    } catch (e) {
      ultimoError = e;
      await new Promise((r) => setTimeout(r, 500 * (intento + 1)));
    }
  }

  throw new Error(`${id}/${pais}: ${ultimoError?.message ?? 'sin respuesta'}`);
}

/** Saca la URL directa de los enlaces de afiliado de JustWatch. */
function limpiarUrl(url) {
  try {
    const u = new URL(url);

    if (u.hostname.endsWith('pxf.io')) {
      const destino = u.searchParams.get('u');
      if (destino) return destino;
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Las filas de una ficha a partir de las ofertas de JustWatch.
 *
 * @param {Record<string, unknown[]>} ofertasPorPais
 * @returns {Array<{platformId: string, region: string, status: string, accessType: string, url?: string}>}
 */
function construirFilas(ofertasPorPais) {
  // Primero las ocho de siempre: se apunta en que paises hay oferta de
  // cada una y con que modalidad de acceso.
  const nucleo = new Map();

  for (const [pais, ofertas] of Object.entries(ofertasPorPais)) {
    for (const oferta of ofertas) {
      const plataforma = NUCLEO[oferta.package.technicalName];

      if (!plataforma) continue;

      const acceso = ACCESO[oferta.monetizationType];

      if (!acceso) continue;

      if (!nucleo.has(plataforma)) nucleo.set(plataforma, new Map());

      const previa = nucleo.get(plataforma).get(pais);

      if (!previa || PREFERENCIA[acceso] > PREFERENCIA[previa.accessType]) {
        nucleo.get(plataforma).set(pais, {
          accessType: acceso,
          url: limpiarUrl(oferta.standardWebURL),
        });
      }
    }
  }

  const filas = [];

  for (const [plataforma, porPais] of nucleo) {
    for (const region of REGIONES) {
      const oferta = porPais.get(region);

      filas.push(
        oferta
          ? {
              platformId: plataforma,
              region,
              status: 'available',
              accessType: oferta.accessType,
              url: oferta.url,
            }
          : { platformId: plataforma, region, status: 'unavailable', accessType: 'unknown' },
      );
    }
  }

  // Las plataformas que solo existen en algunos paises: solo se escribe
  // la fila donde hay oferta. Mandan las de suscripcion sobre las de
  // alquiler y compra.
  const extra = new Map();

  for (const [pais, ofertas] of Object.entries(ofertasPorPais)) {
    for (const oferta of ofertas) {
      const plataforma = EXTRA[oferta.package.technicalName];

      if (!plataforma) continue;
      if (!PAISES_EXTRA[plataforma]?.includes(pais)) continue;

      const acceso = ACCESO[oferta.monetizationType];

      if (!acceso) continue;

      const clave = `${plataforma}__${pais}`;
      const previa = extra.get(clave);

      if (!previa || PREFERENCIA[acceso] > PREFERENCIA[previa.accessType]) {
        extra.set(clave, {
          platformId: plataforma,
          region: pais,
          status: 'available',
          accessType: acceso,
          url: limpiarUrl(oferta.standardWebURL),
        });
      }
    }
  }

  filas.push(...extra.values());

  return filas;
}

async function crearPlataformas(metricasLectura) {
  for (const plataforma of PLATAFORMAS_NUEVAS) {
    metricasLectura.consultas += 1;
    metricasLectura.documentos += 1;
    const ya = await uno('streamingPlatforms', plataforma.id);

    if (ya) {
      console.log(`  ${plataforma.id}: ya existe, no se toca`);
      continue;
    }

    await crear('streamingPlatforms', plataforma.id, {
      name: s(plataforma.name),
      badgeColor: s(plataforma.badgeColor),
      order: { integerValue: String(plataforma.order) },
    });

    console.log(`  ${plataforma.id}: creada como "${plataforma.name}"`);
  }
}

function filaDesdeDocumento(documento) {
  const campos = documento.fields ?? {};

  return {
    id: documento.name?.split('/').pop() ?? '',
    animeId: campos.animeId?.stringValue ?? '',
    platformId: campos.platformId?.stringValue ?? '',
    region: campos.region?.stringValue ?? '',
    status: campos.status?.stringValue ?? '',
    accessType: campos.accessType?.stringValue ?? 'unknown',
    url: campos.url?.stringValue ?? '',
    verifiedAt: campos.verifiedAt?.stringValue ?? '',
    updatedAt: campos.updatedAt?.timestampValue ?? '',
  };
}

/** Lee solo las filas de los animes seleccionados. */
async function leerDisponibilidad(ids, metricasLectura) {
  if (!filtrarAnime) {
    const stats = { consultas: 0, documentos: 0 };
    const filas = await coleccion('streamingAvailability', { stats });

    metricasLectura.consultas += stats.consultas;
    metricasLectura.documentos += stats.documentos;

    return filas.map(filaDesdeDocumento);
  }

  const { cabeceras, BASE } = await cliente();
  const filas = [];

  for (const bloque of bloquesDe(ids)) {
    const { documentos, consultas } = await leerPaginado(async ({ startAfter }) => {
      const structuredQuery = crearConsultaDisponibilidad(bloque, startAfter);
      const respuesta = await fetch(`${BASE}:runQuery`, {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify({ structuredQuery }),
      });

      if (!respuesta.ok) {
        const detalle = (await respuesta.text()).slice(0, 300);
        throw new Error(
          `consulta streamingAvailability (${bloque.length} animes): ` +
            `${respuesta.status}: ${detalle}`,
        );
      }

      const payload = await respuesta.json();

      // `runQuery` devuelve una entrada por documento y, al final, una
      // entrada con `readTime` que no tiene `document`.
      return payload
        .filter((entrada) => entrada.document)
        .map((entrada) => entrada.document);
    });

    metricasLectura.consultas += consultas;
    metricasLectura.documentos += documentos.length;
    filas.push(...documentos.map(filaDesdeDocumento));
  }

  return filas;
}

/**
 * En modo filtrado se comprueba solo la existencia de los animes
 * seleccionados. La lectura completa de `animes` se reserva para la
 * reconstrucción completa.
 */
async function leerIdsCatalogo(ids, metricasLectura) {
  const idsDelCatalogo = new Set();

  if (!filtrarAnime) {
    const stats = { consultas: 0, documentos: 0 };
    const animes = await coleccion('animes', { stats });

    metricasLectura.consultas += stats.consultas;
    metricasLectura.documentos += stats.documentos;
    animes.forEach((anime) => idsDelCatalogo.add(anime.id));

    return idsDelCatalogo;
  }

  for (const id of ids) {
    metricasLectura.consultas += 1;
    metricasLectura.documentos += 1;

    if (await uno('animes', id)) idsDelCatalogo.add(id);
  }

  return idsDelCatalogo;
}

const idsFichas = Object.keys(FICHAS);
const idsSeleccionados = normalizarIds(
  filtrarAnime ? idsFichas.filter((id) => soloAnime.has(id)) : idsFichas,
);
const idsConFicha = idsSeleccionados.filter((id) => FICHAS[id]?.id);

console.log(
  `\nModo: ${filtrarAnime ? 'filtrado' : 'completo'} · ` +
    `${idsConFicha.length} anime(s) con ficha de JustWatch`,
);

if (idsSeleccionados.length === 0) {
  console.log('No hay animes seleccionados que estén en FICHAS.');
}

const idsDelCatalogo = await leerIdsCatalogo(idsSeleccionados, metricas);
const idsAProcesar = idsConFicha.filter((id) => idsDelCatalogo.has(id));
const yaExistentes = await leerDisponibilidad(idsAProcesar, metricas);
const indice = indiceExistente(yaExistentes);

let totalFilas = 0;
let totalDisponibles = 0;
let totalSinJustwatch = 0;

for (const [animeId, ficha] of Object.entries(FICHAS)) {
  if (filtrarAnime && !soloAnime.has(animeId)) continue;

  if (!idsDelCatalogo.has(animeId)) {
    console.log(`\n${animeId}: no esta en el catalogo, se salta`);
    continue;
  }

  if (!ficha.id) {
    console.log(`\n${animeId}: sin ficha en JustWatch, no hay ofertas que copiar`);
    metricas.sinJustwatch++;
    totalSinJustwatch++;
    continue;
  }

  const ofertasPorPais = {};
  let titulo = '';

  for (const region of REGIONES) {
    let nodo;

    try {
      nodo = await pedir(ficha.id, region);
    } catch (e) {
      // Un 403 de una sola region no debe tumbar la ficha entera:
      // se anota y se sigue con las demas. JustWatch devuelve 403
      // cuando una obra no esta licenciada en ese pais o cuando
      // limita la peticion; en ambos casos no hay oferta que copiar.
      console.log(`${animeId}: ${region} sin respuesta (${e.message}), se omite`);
      continue;
    }

    if (!nodo) {
      console.log(`${animeId}: JustWatch no devuelve ${ficha.id} para ${region}`);
      continue;
    }

    if (!titulo) titulo = nodo.content?.title ?? '';

    ofertasPorPais[region] = nodo.offers ?? [];

    await new Promise((r) => setTimeout(r, 180));
  }

  if (!Object.keys(ofertasPorPais).length) {
    console.log(`${animeId}: JustWatch no devuelve nada`);
    continue;
  }

  const filas = construirFilas(ofertasPorPais);
  const disponibles = filas.filter((f) => f.status === 'available');

  console.log(
    `\n=== ${animeId}   JustWatch ${ficha.id} "${titulo}"   ` +
      `${filas.length} filas, ${disponibles.length} disponibles`,
  );

  const porPlataforma = new Map();

  for (const fila of disponibles) {
    if (!porPlataforma.has(fila.platformId)) porPlataforma.set(fila.platformId, []);

    porPlataforma.get(fila.platformId).push(`${fila.region}:${fila.accessType}`);
  }

  for (const [plataforma, regiones] of porPlataforma) {
    console.log(`   ${plataforma.padEnd(28)} ${regiones.join(' ')}`);
  }

  const filasConAnime = filas.map((fila) => ({ ...fila, animeId }));
  const clasificacion = clasificarDisponibilidad({
    generadas: filasConAnime,
    existentes: indice,
    animeIds: new Set([animeId]),
    regionesPermitidas: REGIONES,
    plataformasConocidas: PLATAFORMAS_CONOCIDAS,
  });

  const nuevas = clasificacion.nuevas;
  const modificadas = clasificacion.modificadas;
  const sinCambios = clasificacion.sinCambios;
  const obsoletas = clasificacion.obsoletas;
  const protegidas = clasificacion.protegidas;
  const clavesProtegidas = new Set(
    protegidas.map((fila) => claveDisponibilidad(fila)),
  );

  console.log(
    `   ${nuevas.length} nuevas, ${modificadas.length} modificadas, ` +
      `${sinCambios.length} sin cambios, ${obsoletas.length} obsoletas` +
      (protegidas.length ? `, ${protegidas.length} protegidas` : '') +
      (clasificacion.repetidas.length ? `, ${clasificacion.repetidas.length} repetidas` : ''),
  );

  metricas.animesProcesados += 1;
  metricas.filas += filasConAnime.length;
  metricas.nuevas += nuevas.length;
  metricas.actualizadas += modificadas.length;
  metricas.sinCambios += sinCambios.length;
  metricas.repetidas += clasificacion.repetidas.length;
  metricas.obsoletas += obsoletas.length;
  metricas.protegidas += protegidas.length;

  totalFilas += filasConAnime.length;
  totalDisponibles += disponibles.length;

  if (escribirEnBase) {
    for (const fila of filasConAnime) {
      if (clavesProtegidas.has(claveDisponibilidad(fila))) {
        continue;
      }

      const id = `${animeId}__${fila.platformId}__${fila.region}`;
      const campos = {
        animeId: s(animeId),
        platformId: s(fila.platformId),
        region: s(fila.region),
        status: s(fila.status),
        accessType: s(fila.accessType),
        verifiedAt: s(HOY),
        updatedAt: momento(new Date()),
      };

      // `url` va siempre en la mascara: si una fila deja de estar
      // disponible, el enlace viejo se borra en vez de quedarse ahi
      // apuntando a una ficha que ya no existe.
      const mascara = [
        'animeId',
        'platformId',
        'region',
        'status',
        'accessType',
        'verifiedAt',
        'updatedAt',
        'url',
      ];

      campos.url = fila.url ? s(fila.url) : { nullValue: null };

      await escribir('streamingAvailability', id, campos, mascara);
      metricas.escritas += 1;
    }

    // La poda es opt-in y se limita a las filas de ESTE anime que se
    // acaban de clasificar. `obsoletas` ya excluye otros animes y las
    // filas protegidas (plataformas/regiones manuales o sin verificar).
    if (podar) {
      for (const fila of obsoletas) {
        await borrar('streamingAvailability', fila.id);
        metricas.eliminadas += 1;
      }
    }
  }
}

if (escribirEnBase) {
  console.log('\nPlataformas nuevas:');
  await crearPlataformas(metricas);
}

console.log(
  `\n${totalFilas} filas generadas, ${metricas.nuevas} nuevas, ` +
    `${metricas.actualizadas} con cambios, ${metricas.sinCambios} sin cambios, ` +
    `${totalDisponibles} disponibles` +
    (totalSinJustwatch ? `, ${totalSinJustwatch} fichas sin ficha en JustWatch` : '') +
    (escribirEnBase ? ' (escritas)' : ' (simulacion: usa --escribir)'),
);

console.log(
  `\nResumen de lectura y cambios:\n` +
    `  Modo: ${filtrarAnime ? 'filtrado' : 'completo'}\n` +
    `  Animes procesados: ${metricas.animesProcesados}\n` +
    `  Consultas REST: ${metricas.consultas}\n` +
    `  Documentos leidos de Firestore: ${metricas.documentos}\n` +
    `  Filas generadas: ${metricas.filas}\n` +
    `  Filas escritas: ${metricas.escritas}\n` +
    `  Nuevas: ${metricas.nuevas}\n` +
    `  Actualizadas (datos): ${metricas.actualizadas}\n` +
    `  Sin cambios: ${metricas.sinCambios}\n` +
    `  Repetidas: ${metricas.repetidas}\n` +
    `  Obsoletas detectadas: ${metricas.obsoletas}\n` +
    `  Protegidas (manuales/sin verificar): ${metricas.protegidas}\n` +
    `  Obsoletas eliminadas: ${metricas.eliminadas}` +
    (podar && !escribirEnBase
      ? '\n  Poda: simulada (no se ha borrado nada; usa --escribir)'
      : podar
        ? ''
        : '\n  Poda: desactivada (usa --podar para borrar obsoletas)') +
    `\n  Índice local reutilizado: no (Firestore es la fuente de verdad)`,
);
