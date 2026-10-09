// Rellena las miniaturas de capitulo desde TVDB.
//    $env:TVDB_KEY='...'
//    node scripts/emparejar-miniaturas-tvdb.mjs [--anime <id>] [--escribir]
//
// ── POR QUE TVDB Y NO ANILIST ──────────────────────────────────────
//
// AniList no tiene un tipo `Episode`; usa `Media.streamingEpisodes`, que
// esta contaminado: en Grand Blue devuelve cinco capitulos de Saekano ♭
// y en Ataque a los Titanes repite los veinticinco de la primera
// temporada en todas las demas. Son imagenes que cargan, se ven bien y son
// de otra serie.
//
// TVDB tiene la lista de capitulos de verdad, con su imagen. Y para
// comprobarlo no hace falta fiarse de la palabra: devuelve tambien el
// titulo japones de cada capitulo, que es exactamente el dato que hay
// guardado en `datos/<prefijo>-tN.mjs`. Aqui se empareja por ahi, no por
// el numero.
//
// Que coincidan los doce titulos de Grand Blue, con el capitulo 7 de la
// segunda temporada que lleva los dos titulos separados por una barra, es
// una comprobacion que no puede salir por casualidad.
//
// ── DE DONDE SALEN LOS TITULOS JAPONESES ───────────────────────────
//
// De los ficheros de datos, no de Firestore. Un capitulo en la base de
// datos guarda el titulo en espanol, el numero, la fecha y la nota, pero
// no el japones: el japones esta en `datos/<prefijo>-tN.mjs`, que es de
// donde sale el resto del catalogo.
//
// El prefijo se localiza leyendo el `ANIME_ID` de cada `-meta.mjs`, que
// es como se sabe que `gbd-t1.mjs` es el de `grand-blue`.
//
// ── EL CANDIDATO ───────────────────────────────────────────────────
//
// TVDB busca por titulo y devuelve resultados parecidos: al buscar
// "Grand Blue" salen Bear in the Big Blue House y The Magic of the Big
// Blue. No se usa el primero que salga.
//
// Lo que se exige es que la mayoria de los capitulos de la serie
// encontrada tengan el mismo titulo japones que los del catalogo. Si no
// llega al minimo, es otra serie y se descarta con el motivo escrito.
//
// ── LA CLAVE ───────────────────────────────────────────────────────
//
// Se lee de la variable de entorno TVDB_KEY y no se escribe en ningun
// fichero. La clave se canjea por un token de 24 horas al empezar y solo
// vive en memoria.

import { readdir } from 'node:fs/promises';
import { coleccion, escribir, str, num } from './firestore-rest.mjs';
import { comoBuscar } from './busquedas-anime.mjs';
import { capituloDe } from './emparejar-capitulo.mjs';
import { limpiar } from './normalizar-titulo.mjs';
import { temporadaEnTvdb } from './temporadas-tvdb.mjs';


const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const escribirEnBase = args.includes('--escribir');
const soloAnime = args.includes('--anime') ? args[args.indexOf('--anime') + 1] : null;

// Minimo de capitulos que tienen que coincidir por titulo japones para
// dar por buena una serie de TVDB.
const MINIMO = 0.6;

// ── Sesion ─────────────────────────────────────────────────────────

let token = null;

async function sesion() {
  if (token) return token;

  const r = await fetch('https://api4.thetvdb.com/v4/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apikey: clave }),
  });

  const d = await r.json();

  if (!r.ok || !d?.data?.token) {
    throw new Error(`login -> ${r.status} ${JSON.stringify(d).slice(0, 160)}`);
  }

  token = d.data.token;

  return token;
}

async function pedir(ruta) {
  const t = await sesion();

  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${t}` },
  });

  const d = await r.json();

  if (!r.ok) throw new Error(`${ruta} -> ${r.status} ${JSON.stringify(d).slice(0, 160)}`);

  return d;
}

// ── Titulos japoneses, desde los ficheros de datos ──────────────────

const datosUrl = new URL('./datos/', import.meta.url);

const ficheros = await readdir(datosUrl);

const prefijos = new Map();

for (const f of ficheros.filter((x) => x.endsWith('-meta.mjs'))) {
  const prefijo = f.replace('-meta.mjs', '');

  try {
    const meta = await import(new URL(f, datosUrl));

    if (meta.ANIME_ID) prefijos.set(meta.ANIME_ID, prefijo);
  } catch {
    // Un fichero de datos roto no debe parar esto: se avisa y sigue.
  }
}

/** animeId -> [ {temporada, numero, japones} ] */
const porAnime = new Map();

for (const [animeId, prefijo] of prefijos) {
  const filas = [];

// El filtro de las temporadas tiene que dejar fuera los ficheros de
  // etiquetas: `agk-tags.mjs` empieza por `agk-t` y acaba en `.mjs`, con
  // lo que se colaba como si fuera una temporada. No rompe nada, pero
  // hace que un anime sin fichero de temporadas parezca que no tiene
  // datos y se salte en silencio.
  const deTemporada = (nombre) =>
    nombre.startsWith(`${prefijo}-t`) &&
    nombre.endsWith('.mjs') &&
    !nombre.endsWith('-tags.mjs');

  for (const f of ficheros.filter(deTemporada)) {
    const temporada = Number(f.slice(prefijo.length + 2, -4));

    let modulo;

    try {
      modulo = await import(new URL(f, datosUrl));
    } catch {
      continue;
    }

    for (const [nombre, filasCap] of Object.entries(modulo)) {
      if (!Array.isArray(filasCap)) continue;

      for (const fila of filasCap) {
        if (!Array.isArray(fila) || fila.length < 3) continue;

        filas.push({
          temporada,
          numero: fila[0],
          japones: String(fila[2] ?? ''),
          espanol: String(fila[1] ?? ''),
          nombre,
        });
      }
    }
  }

  if (filas.length) porAnime.set(animeId, filas);
}

// ── Catalogo ───────────────────────────────────────────────────────
//
// Con `--rehacer` se recomputan capitulos que ya tienen imagen, y esa
// imagen esta en `usadas`. Si `usadas` se usara tal cual, el propio
// emparejador rechazaria cada capitulo por tener su URL ya puesta, y no
// pondria ninguno.
//
// Por eso, al rehacer, `usadas` se arma con las URLs de los capitulos
// que NO se estan recalculando. Asi el filtro de duplicados sigue
// impidiendo que dos capitulos distintos acaben con la misma foto, que
// es lo que hacia falta en su momento.
const REHACER = args.includes('--rehacer');

const animes = await coleccion('animes');
const capitulos = await coleccion('episodes');

// Capitulos sin miniatura, por anime. Con `--rehacer` entran tambien los
// que ya la tienen.
const sinImagen = new Map();

for (const c of capitulos) {
  if (str(c.f, 'thumbnailUrl') && !REHACER) continue;

  const anime = str(c.f, 'animeId');

  const lista = sinImagen.get(anime) ?? [];

  const temporada = (str(c.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '?';

  lista.push({
    id: c.id,
    numero: num(c.f, 'number') ?? 0,
    temporada: Number(temporada),
  });

  sinImagen.set(anime, lista);
}

// Las imagenes que ya estan puestas.
//
// Al rehacer se dejan fuera las de los capitulos que se estan
// recalculando. Si no, el emparejador rechazaria cada uno por tener su
// propia URL en el conjunto, y no pondria ninguno. Lo que se quiere es
// que siga saltando la foto cuando le toca a OTRO capitulo, que es lo que
// hacia falta cuando se relleno un catalogo entero de golpe.
// Al rehacer se excluyen TODOS los capitulos que se van a recalcular, no
// solo los de un anime. Con `--anime` son los de ese anime; sin el, son
// los de todos, que es lo que se recalcula. De lo contrario cada capitulo
// se rechazaria a si mismo por tener su propia URL en el conjunto.
const recalculando = new Set(
  REHACER
    ? [...sinImagen.values()].flat().map((f) => f.id)
    : [],
);

const usadas = new Set();

for (const c of capitulos) {
  const u = str(c.f, 'thumbnailUrl');

  if (u && !recalculando.has(c.id)) usadas.add(u);
}


// ── Utilidades ─────────────────────────────────────────────────────

// `limpiar` viene de `normalizar-titulo.mjs`. Antes estaba aqui una
// copia que solo quitaba espacios, y `emparejar-capitulo.mjs` usaba otra
// que ademas normalizaba los parentesis de ancho completo. Con dos
// copias distintas, el mismo capitulo con el parentesis escrito de otra
// forma emparejaba en un sitio y no en otro.

async function capitulosDe(serie) {
  const salida = [];
  let pagina = 0;

  for (;;) {
    const d = await pedir(`/series/${serie.tvdb_id}/episodes/default?page=${pagina}`);

    const lista = d?.data?.episodes ?? [];

    if (!lista.length) break;

    salida.push(...lista);

    pagina++;

    // Una serie larga son unas pocas paginas. El tope es una red de
    // seguridad contra bucles.
    if (pagina > 20) break;
  }

  return salida;
}

const buscar = async (nombre) =>
  (await pedir(`/search?query=${encodeURIComponent(nombre)}&type=series&limit=10`))?.data ??
  [];

// ── Paso 1: buscar y comprobar ─────────────────────────────────────

let totalNuevas = 0;
let totalSinFuente = 0;

for (const anime of animes) {
  const id = anime.id;

  if (soloAnime && id !== soloAnime) continue;

  const necesidad = sinImagen.get(id) ?? [];

  if (!necesidad.length) continue;

  const delCatalogo = porAnime.get(id);

  if (!delCatalogo?.length) {
    console.log(`${id}: sin fichero de datos con los titulos japoneses`);
    continue;
  }

  // Indice de nuestros capitulos por titulo japones.
  const nuestrosPorTitulo = new Map();

  for (const f of delCatalogo) {
    const k = limpiar(f.japones);

    if (k && !nuestrosPorTitulo.has(k)) nuestrosPorTitulo.set(k, f);
  }

  if (!nuestrosPorTitulo.size) {
    console.log(`${id}: los capitulos no tienen titulo japones`);
    continue;
  }

  const termino = comoBuscar(id, str(anime.f, 'title'));

  let candidatas;

  try {
    candidatas = await buscar(termino);
  } catch (e) {
    console.log(`${id}: la busqueda fallo (${e.message.slice(0, 70)})`);
    continue;
  }

  // Que serie de las candidatas encaja con nuestros capitulos.
  let elegida = null;
  let mejor = 0;

  for (const s of candidatas) {
    let eps;

    try {
      eps = await capitulosDe(s);
    } catch {
      continue;
    }

    const deTvdb = new Set(eps.map((e) => limpiar(e.name)));

    const comunes = [...nuestrosPorTitulo.keys()].filter((t) => deTvdb.has(t)).length;

    if (comunes > mejor) {
      mejor = comunes;
      elegida = { serie: s, capitulos: eps };
    }
  }

  const exigido = Math.ceil(nuestrosPorTitulo.size * MINIMO);

  if (!elegida || mejor < exigido) {
    console.log(
      `${id}: ninguna serie de TVDB encaja (mejor ${mejor} de ${nuestrosPorTitulo.size} titulos, ` +
        `hacen falta ${exigido})`,
    );
    totalSinFuente++;
    continue;
  }

console.log(
    `\n=== ${id}   TVDB ${elegida.serie.tvdb_id} "${elegida.serie.name}" ` +
      `(${mejor}/${nuestrosPorTitulo.size} titulos)  ${elegida.capitulos.length} capitulos`,
  );

  // El emparejado de un capitulo va en `emparejar-capitulo.mjs`, que es
  // donde esta la comprobacion de temporada y numero.
  //
  // Antes de que ese fichero existiera, el emparejado era un indice por
  // titulo: `porTitulo.set(limpiar(e.name), e)`, y se cogia el primero.
  // Con eso, una serie en la que TVDB repite la lista de capitulos de la
  // primera parte en todas las demas daba la imagen de la parte
  // anterior, porque el titulo es identico.
  let puestas = 0;
  let saltadas = 0;
  const avisos = new Map();

for (const f of necesidad) {
    const nuestro = delCatalogo.find(
      (d) => Number(d.temporada) === Number(f.temporada) && Number(d.numero) === Number(f.numero),
    );

    // Sin esto no se puede ni intentar el emparejado, y con el catalogo
    // entero lleno el aviso se repite por cada capitulo. Con un anime si
    // es util, porque dice si el problema es de los ficheros de datos.
    if (!nuestro && REHACER) {
      console.log(
        `  T${f.temporada} ${f.numero}  no esta en los ficheros de datos ` +
          `(hay ${delCatalogo.length} capitulos, de T${delCatalogo[0]?.temporada} ` +
          `${delCatalogo[0]?.numero} a T${delCatalogo.at(-1)?.temporada} ${delCatalogo.at(-1)?.numero})`,
      );

      saltadas++;
      continue;
    }

    const r = capituloDe({
      animeId: id,
      nuestro,
      capitulos: elegida.capitulos,
      usadas,
    });

    if (!r) {
      // Con `--rehacer` se enseña por que se ha rechazado cada capitulo.
      // Sin ese dato, un "0 puestas" no dice si es que los titulos no
      // cuadran, si es que estan mal las temporadas o si es que la imagen
      // ya la tenia puesta otro.
      if (REHACER) {
        const clave = limpiar(nuestro?.japones);

        const conTitulo = elegida.capitulos.filter((e) => limpiar(e.name) === clave);

        console.log(
          `  T${f.temporada} ${String(f.numero).padStart(3)}  ` +
            `${(clave || '(sin titulo)').slice(0, 34).padEnd(36)}` +
            `${conTitulo.length} con ese titulo en TVDB` +
            (conTitulo.length
              ? `, se busca S${temporadaEnTvdb(id, f.temporada)}E${f.numero}, y esta en ` +
                `en ${[...new Set(conTitulo.map((c) => `S${c.seasonNumber}E${c.number}`))].join(' ')}`
              : ''),
        );
      }

      saltadas++;
      continue;
    }

    if (r.aviso) avisos.set(r.aviso, (avisos.get(r.aviso) ?? 0) + 1);

    puestas++;
    totalNuevas++;

    console.log(
      `  T${f.temporada} ${String(f.numero).padStart(3)}  ` +
        `${limpiar(nuestro.japones).slice(0, 36).padEnd(38)}${r.url.slice(0, 82)}`,
    );

    if (escribirEnBase) {
      await escribir('episodes', f.id, { thumbnailUrl: { stringValue: r.url } }, [
        'thumbnailUrl',
      ]);
    }

    usadas.add(r.url);
  }
for (const [aviso, veces] of avisos) {
    console.log(`  aviso: ${veces} capitulos con "${aviso}"`);
  }

  console.log(
    `  ${puestas} puestas` + (saltadas ? `, ${saltadas} sin pareja en TVDB` : ''),
  );
}

console.log(`\n${totalNuevas} puestas`);

if (!escribirEnBase && totalNuevas) console.log('\nNo se ha escrito nada. Usa --escribir.');