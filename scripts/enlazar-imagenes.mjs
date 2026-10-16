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
];
const soloAnimes = argv.reduce((acc, a, k) => (a === '--anime' ? [...acc, argv[k + 1]] : acc), []);
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
    const medio = await anilist.buscarAnime(anime.buscar);
    if (!medio) {
      console.log(`\n${anime.id}: AniList no encuentra "${anime.buscar}"`);
      omitidos.push(`${anime.id}: AniList no encuentra "${anime.buscar}"`);
      continue;
    }
    const { todos } = await anilist.arbol(medio.id);

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
    const medio = await anilist.buscarAnime(anime.buscar);
    if (!medio) continue;
    const { base, todos } = await anilist.arbol(medio.id);
    console.log(
      `\n${anime.id} -> AniList ${medio.id} (${medio.titulo}): ` +
        `${suyas.length} temporadas, ${todos.size} medias relacionados`,
    );
    const laBase = base ?? [...todos.values()][0];
    const conNumeroYAnio = suyas.map((s) => ({
      numero: num(s, 'number') ?? 0,
      anio: num(s, 'year'),
      titulo: str(s.f, 'title'),
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
    const medio = await anilist.buscarAnime(a.buscar);
    if (!medio) {
      omitidos.push(`${a.id}: AniList no encuentra "${a.buscar}"`);
      continue;
    }
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
