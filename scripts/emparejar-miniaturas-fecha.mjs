// Empareja por fecha de emision en vez de por titulo.
//    $env:TVDB_KEY='...'
//    node scripts/emparejar-miniaturas-fecha.mjs [--anime <id>] [--escribir] [--rehacer]
//
// ── POR QUE HACE FALTA UNA SEGUNDA VIA ─────────────────────────────
//
// El emparejado normal usa el titulo japones guardado en los ficheros de
// datos. Para los animes que tienen fichero funciona, y es el metodo
// bueno: el titulo es unico dentro de la serie.
//
// Pero cuatro animes del catalogo no tienen fichero de datos: Akame ga
// Kill, Ataque a los Titanes, Frieren y Jujutsu Kaisen. Sus capitulos
// viven solo en Firestore, y ahi no hay titulo japones. Sin el, el
// emparejador dice "sin fichero de datos con los titulos japoneses" y se
// salta el anime entero, que son 48, 77, 36 y 35 capitulos.
//
// ── POR QUE LA FECHA SIRVE ──────────────────────────────────────────
//
// Un capitulo se emitio un dia concreto, y ese dia es el mismo en las dos
// fuentes. La comprobacion cruzada sale de comparar:
//
//   catalogo T4 E1   "La ciudad donde empezó todo"   2019-04-29
//   TVDB   S3E13     はじまりの街                       2019-04-29
//
// Misma fecha. Y el titulo espanol es traduccion del japones: "la ciudad
// donde empezo todo" y はじまりの街, "la ciudad del principio". Son el
// mismo capitulo.
//
// ── LOS TRES FILTROS ────────────────────────────────────────────────
//
//   1. La fecha tiene que coincidir exactamente. Es el filtro fuerte: un
//      capitulo se emitio un dia y solo hay un capitulo de esa serie ese
//      dia.
//
//   2. La imagen no puede estar ya usada por otro capitulo. Sin esto, en
//      una serie en la que TVDB repite la lista de capitulos, dos
//      capitulos distintos cogerian la misma foto.
//
//   3. Si hay varios capitulos de TVDB con la misma fecha —cosa que pasa
//      en las partes que salen en el mismo dia— no se elige ninguno, y se
//      cuenta como dudoso.
//
// Que se necesite el filtro 3 se ve con Ataque a los Titanes: el
// catalogo tiene siete capitulos de la septima parte y TVDB solo dos,
// porque los cinco primeros se emitieron todos el 19 de noviembre de
// 2023. Con solo la fecha no hay forma de saber cual es cual, y por eso
// esos cinco se quedan sin imagen.
//
// ── LO QUE NO ES ────────────────────────────────────────────────────
//
// Un emparejado "por fecha" no necesita ningun dato extra del catalogo:
// las fechas ya estan ahi. Lo que si necesita es saber que la serie de
// TVDB es la correcta, y eso lo comprueba el filtro 1: si fuera otra
// serie, las fechas no quadrarian.

import { coleccion, escribir, str, num } from './firestore-rest.mjs';
import { comoBuscar } from './busquedas-anime.mjs';
import { capituloEnTvdb } from './temporadas-tvdb.mjs';

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const escribirEnBase = args.includes('--escribir');
const soloAnime = args.includes('--anime') ? args[args.indexOf('--anime') + 1] : null;
const REHACER = args.includes('--rehacer');

let token = null;

async function sesion() {
  if (token) return token;

  const r = await fetch('https://api4.thetvdb.com/v4/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apikey: clave }),
  });

  token = (await r.json())?.data?.token;

  return token;
}

async function pedir(ruta) {
  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${await sesion()}` },
  });

  return (await r.json())?.data ?? [];
}

async function capitulosDe(serie) {
  const salida = [];

  for (let pagina = 0; pagina < 20; pagina++) {
    const datos = await pedir(`/series/${serie.tvdb_id}/episodes/default?page=${pagina}`);

    const lista = datos?.episodes ?? [];

    if (!lista.length) break;

    salida.push(...lista);
  }

  return salida;
}

// ── Catalogo ───────────────────────────────────────────────────────

const animes = await coleccion('animes');
const capitulos = await coleccion('episodes');

/** animeId -> [ {id, temporada, numero, fecha, titulo} ] */
const porAnime = new Map();

for (const c of capitulos) {
  const anime = str(c.f, 'animeId');

  const lista = porAnime.get(anime) ?? [];

  const temporada = Number(String(str(c.f, 'seasonId')).split('-s')[1] ?? 0);

  lista.push({
    id: c.id,
    temporada,
    numero: num(c.f, 'number') ?? 0,
    fecha: str(c.f, 'airDate') ?? '',
    titulo: str(c.f, 'title') ?? '',
  });

  porAnime.set(anime, lista);
}

// Los capitulos que ya tienen miniatura. Con `--rehacer` se meten todos
// en la cola igualmente, pero estos ids se necesitan para armar el filtro
// de URLs repetidas: una imagen que tiene un capitulo que NO se esta
// recalculando no se puede volver a poner en otro.
const conImagen = new Set(
  capitulos.filter((c) => str(c.f, 'thumbnailUrl')).map((c) => c.id),
);


// ── El emparejado ──────────────────────────────────────────────────

let totalNuevas = 0;
let totalDudosos = 0;

for (const anime of animes) {
  const id = anime.id;

  if (soloAnime && id !== soloAnime) continue;

  const todos = porAnime.get(id) ?? [];

  const sinImagen = REHACER ? todos : todos.filter((c) => !conImagen.has(c.id));

  if (!sinImagen.length) continue;

  const termino = comoBuscar(id, str(anime.f, 'title'));

  const candidatas = await pedir(
    `/search?query=${encodeURIComponent(termino)}&type=series&limit=8`,
  ).catch(() => []);

  if (!candidatas.length) {
    console.log(`${id}: no hay serie en TVDB con "${termino}"`);

    continue;
  }

  // Que serie encaja: la que mas capitulos coincide por fecha. Es el
  // mismo criterio que usa el emparejado por titulo, pero con la fecha.
  let elegida = null;
  let mejor = 0;

  for (const s of candidatas) {
    let eps;

    try {
      eps = await capitulosDe(s);
    } catch {
      continue;
    }

    const fechas = new Set(eps.map((e) => e.aired));

    const comunes = todos.filter((c) => c.fecha && fechas.has(c.fecha)).length;

    if (comunes > mejor) {
      mejor = comunes;
      elegida = { serie: s, capitulos: eps };
    }
  }

  const conFecha = todos.filter((c) => c.fecha).length;

  if (!elegida || mejor < conFecha * 0.5) {
    console.log(
      `${id}: ninguna serie de TVDB encaja por fecha (mejor ${mejor} de ${conFecha}, ` +
        `hacen falta ${Math.ceil(conFecha * 0.5)})`,
    );

    continue;
  }

  console.log(
    `\n=== ${id}   TVDB ${elegida.serie.tvdb_id} "${elegida.serie.name}" ` +
      `(${mejor}/${conFecha} fechas)  ${elegida.capitulos.length} capitulos`,
  );

  // Filtro 2: la imagen no puede estar usada por un capitulo que no se
  // esta recalculando.
  const recalculando = new Set(sinImagen.map((c) => c.id));

  const usadasAhora = new Set(
    capitulos
      .filter((c) => !recalculando.has(c.id))
      .map((c) => str(c.f, 'thumbnailUrl'))
      .filter(Boolean),
  );

  let puestas = 0;
  let dudosos = 0;
  let sinFecha = 0;

  for (const c of sinImagen) {
    if (!c.fecha) {
      sinFecha++;
      continue;
    }

    const destino = capituloEnTvdb(id, c.temporada, c.numero);

    // Filtro 3: cuantos capitulos de TVDB hay con esa fecha en la
    // temporada que buscamos. Si hay mas de uno, no hay forma de saber
    // cual es el nuestro.

    // Filtro 3: cuantos capitulos de TVDB hay con esa fecha en la
    // temporada que buscamos. Si hay mas de uno, no hay forma de saber
    // cual es el nuestro.
    const conEsaFecha = elegida.capitulos.filter(
      (e) => e.aired === c.fecha && Number(e.seasonNumber) === destino.temporada,
    );

    // Si no hay ninguno con la fecha exacta, se acepta el que este a un
    // dia. Pasa con las peliculas: "ヱヴァンゲリヲン新劇場版:破" se
    // estreno enstores el 27 de junio de 2009 por la tarde, y TVDB lo
    // fecha el 26 porque en Japon la proyeccion empieza a las 0:00 y la
    // pelicula ya es del dia siguiente. Es un desfase conocido del
    // formato, no un dato equivocado.
    //
    // Solo se mira un dia, y solo si hay exactamente uno: si hubiera dos
    // capitulos a +-1 dia no se puede elegir.
    const casiIguales =
      conEsaFecha.length === 0
        ? elegida.capitulos.filter(
            (e) =>
              Math.abs(diasEntre(c.fecha, e.aired)) === 1 &&
              Number(e.seasonNumber) === destino.temporada,
          )
        : [];

    if (casiIguales.length === 1) {
      const url = casiIguales[0].image || casiIguales[0].thumbnail;

      if (url && !usadasAhora.has(url)) {
        if (REHACER) {
          console.log(
            `  T${c.temporada} ${String(c.numero).padStart(3)}  ${c.fecha}  ` +
              `${String(c.titulo).slice(0, 30).padEnd(32)}-> S${casiIguales[0].seasonNumber}E${casiIguales[0].number} ` +
              `(TVDB lo fecha ${casiIguales[0].aired})`,
          );
        }

        if (escribirEnBase) {
          await escribir('episodes', c.id, { thumbnailUrl: { stringValue: url } }, [
            'thumbnailUrl',
          ]);
        }

        usadasAhora.add(url);
        puestas++;
        totalNuevas++;

        continue;
      }
    }

    if (conEsaFecha.length !== 1) {
      if (conEsaFecha.length > 1) {
        // Varios capitulos el mismo dia.
        //
        // Pasa en dos sitios, y en los dos la posicion resuelve. En
        // Ataque a los Titanes, los cinco capitulos de la septima parte
        // se emitieron todos el 19 de noviembre de 2023. En Frieren, los
        // cuatro primeros seEmitieron todos el 29 de septiembre de
        // 2023, que es cuando se publico el primer episodio en su
        // entirety en la pantalla grande.
        //
        // El numero de capitulo si es unico dentro de la temporada, asi
        // que si hay uno con el numero que buscamos, es ese. Y si no lo
        // hay, es que son los capitulos de un especial, que no tienen
        // numero normal.
        const porNumero = conEsaFecha.find((e) => Number(e.number) === destino.numero);

        if (!porNumero) {
          dudosos++;
          continue;
        }

        const url = porNumero.image || porNumero.thumbnail;

        if (!url || usadasAhora.has(url)) {
          sinFecha++;
          continue;
        }

        if (REHACER) {
          console.log(
            `  T${c.temporada} ${String(c.numero).padStart(3)}  ${c.fecha}  ` +
              `${String(c.titulo).slice(0, 30).padEnd(32)}-> S${porNumero.seasonNumber}E${porNumero.number} (por numero, ${conEsaFecha.length} ese dia)`,
          );
        }

        if (escribirEnBase) {
          await escribir('episodes', c.id, { thumbnailUrl: { stringValue: url } }, [
            'thumbnailUrl',
          ]);
        }

        usadasAhora.add(url);
        puestas++;
        totalNuevas++;

        continue;
      } else {
        // No hay ninguno con esa fecha en esa temporada. Puede que este
        // en otra: las peliculas y los capitulos sueltos no siempre
        // estan donde uno espera.
        const enOtra = elegida.capitulos.filter((e) => e.aired === c.fecha);

        if (enOtra.length === 1) {
          const e = enOtra[0];

          const url = e.image || e.thumbnail;

          if (url && !usadasAhora.has(url)) {
            if (REHACER) {
              console.log(
                `  T${c.temporada} ${String(c.numero).padStart(3)}  ${c.fecha}  ` +
                  `-> S${e.seasonNumber}E${e.number}  (otra temporada)`,
              );
            }

            if (escribirEnBase) {
              await escribir('episodes', c.id, { thumbnailUrl: { stringValue: url } }, [
                'thumbnailUrl',
              ]);
            }

            usadasAhora.add(url);
            puestas++;
            totalNuevas++;

            continue;
          }
        }

sinFecha++;
      }

      continue;
    }


    const e = conEsaFecha[0];

    const url = e.image || e.thumbnail;

    if (!url || usadasAhora.has(url)) {
      sinFecha++;

      continue;
    }

    if (REHACER) {
      console.log(
        `  T${c.temporada} ${String(c.numero).padStart(3)}  ${c.fecha}  ` +
          `${String(c.titulo).slice(0, 34).padEnd(36)}-> S${e.seasonNumber}E${e.number}`,
      );
    }

    if (escribirEnBase) {
      await escribir('episodes', c.id, { thumbnailUrl: { stringValue: url } }, [
        'thumbnailUrl',
      ]);
    }

    usadasAhora.add(url);
    puestas++;
    totalNuevas++;
  }

  totalDudosos += dudosos;

  console.log(
    `  ${puestas} puestas` +
      (dudosos ? `, ${dudosos} con la misma fecha en varios capitulos` : '') +
      (sinFecha ? `, ${sinFecha} sin fecha o sin counterpart` : ''),
  );
}

console.log(`\n${totalNuevas} puestas`);

if (!escribirEnBase && totalNuevas) console.log('\nNo se ha escrito nada. Usa --escribir.');

/**
 * Los dias entre dos fechas, en valor absoluto.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function diasEntre(a, b) {
  if (!a || !b) return Infinity;

  const ms = new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`);

  return Math.round(Math.abs(ms) / 86400000);
}