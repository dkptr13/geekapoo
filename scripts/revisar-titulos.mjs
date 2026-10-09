// Comprueba los titulos japoneses de TODOS los animes contra TVDB.
//    $env:TVDB_KEY='...'
//    node scripts/revisar-titulos.mjs
//
// ── POR QUE HACE FALTA ────────────────────────────────────────────
//
// Al buscar las miniaturas de capitulo por el titulo japones guardado,
// un titulo mal escrito no se parece a un fallo de la fuente: parece
// que TVDB no tiene esa imagen.
//
// Y los titulos mal escritos son mas faciles de llegar de lo que parece.
// En Toradora, los del fichero de datos estaban hechos a ojo a partir
// del romaji de IMDb, y de los 25 solo 6 cuadraban. Peor: los capitulos
// 9 a 12 del IMDb de Toradora no son de Toradora, son de No Game No
// Life. Un capitulo de este se llamaba "Regla numero 10", que es el
// capitulo doce de No Game No Life, y el propio fichero de datos lo
// repetia como si fuera.
//
// Este comprueba los dos: cuantos titulos de cada anime quadran con
// TVDB, y si la serie que devuelve el emparejador tiene los capitulos
// justos.
//
// ── QUE NO ES ─────────────────────────────────────────────────────
//
// Un porcentaje bajo no siempre significa que el titulo este mal: puede
// ser que TVDB tenga los capitulos con otro idioma, o que los titulos
// originales esten escritos de otra forma (con un espacio, con un
// parentesis). Por eso se enseña la lista de los que no cuadran y no solo
// un numero.

import { readdir } from 'node:fs/promises';

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

let token = null;

async function pedir(ruta) {
  if (!token) {
    const r = await fetch('https://api4.thetvdb.com/v4/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ apikey: clave }),
    });

    token = (await r.json())?.data?.token;
  }

  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });

  return (await r.json())?.data ?? [];
}

const { limpiar, mismoTitulo } = await import(
  new URL('./normalizar-titulo.mjs', import.meta.url)
);

// ── Ficheros de datos ──────────────────────────────────────────────

const datosUrl = new URL('./datos/', import.meta.url);
const ficheros = await readdir(datosUrl);

const prefijos = new Map();

for (const f of ficheros.filter((x) => x.endsWith('-meta.mjs'))) {
  const prefijo = f.replace('-meta.mjs', '');

  try {
    const meta = await import(new URL(f, datosUrl));

    if (meta.ANIME_ID) prefijos.set(prefijo, { id: meta.ANIME_ID, buscar: null });
  } catch {
    // Un fichero roto se avisa al final.
  }
}

const deTemporada = (nombre, prefijo) =>
  nombre.startsWith(`${prefijo}-t`) &&
  nombre.endsWith('.mjs') &&
  !nombre.endsWith('-tags.mjs');

const catalogo = new Map();

for (const prefijo of prefijos.keys()) {
  const filas = [];

  for (const f of ficheros.filter((x) => deTemporada(x, prefijo))) {
    const temporada = Number(f.slice(prefijo.length + 2, -4));

    try {
      const mod = await import(new URL(f, datosUrl));

      for (const lista of Object.values(mod)) {
        if (!Array.isArray(lista)) continue;

        for (const fila of lista) {
          if (Array.isArray(fila) && fila.length >= 3) {
            filas.push({ temporada, numero: fila[0], japones: String(fila[2] ?? '') });
          }
        }
      }
    } catch {
      // Se ve luego en el recuento.
    }
  }

  catalogo.set(prefijo, filas);
}

// ── Buscar en TVDB ─────────────────────────────────────────────────

const { comoBuscar } = await import(new URL('./busquedas-anime.mjs', import.meta.url));

async function capitulosDe(serie) {
  const salida = [];

  for (let pagina = 0; pagina < 20; pagina++) {
    const d = await pedir(`/series/${serie.tvdb_id}/episodes/default?page=${pagina}`);
    const lista = d?.episodes ?? [];

    if (!lista.length) break;

    salida.push(...lista);
  }

  return salida;
}

console.log('');

for (const [prefijo, { id, buscar }] of prefijos) {
  const filas = catalogo.get(prefijo) ?? [];

  if (!filas.length) {
    console.log(`${prefijo.padEnd(6)} ${id.padEnd(42)} sin capitulos en los ficheros`);
    continue;
  }

  const termino = comoBuscar(id, buscar ?? '');

  const candidatas = await pedir(
    `/search?query=${encodeURIComponent(termino)}&type=series&limit=8`,
  );

  let elegido = null;
  let mejor = 0;

  for (const s of candidatas) {
    let eps;

    try {
      eps = await capitulosDe(s);
    } catch {
      continue;
    }

const deTvdb = eps.map((e) => e.name);

    const comunes = filas.filter((f) => deTvdb.some((t) => mismoTitulo(t, f.japones)))
      .length;



    if (comunes > mejor) {
      mejor = comunes;
      elegido = { serie: s, capitulos: eps };
    }
  }

  const pct = Math.round((mejor / filas.length) * 100);

  const marca = pct >= 90 ? 'OK  ' : pct >= 60 ? 'REVISAR ' : 'MAL  ';

  console.log(
    `${marca}${prefijo.padEnd(6)} ${id.padEnd(42)} ${String(mejor).padStart(3)}/${filas.length} (${String(pct).padStart(3)}%)` +
      (elegido ? `  TVDB ${elegido.serie.tvdb_id} "${elegido.serie.name}"` : '  (sin serie en TVDB)'),
  );

  if (elegido && pct < 100) {
const deTvdb = elegido.capitulos.map((e) => e.name);

    const malos = filas.filter((f) => !deTvdb.some((t) => mismoTitulo(t, f.japones)));

    for (const m of malos.slice(0, 6)) {
      console.log(`         T${m.temporada} ${String(m.numero).padStart(3)}  mio: ${m.japones}`);
    }

    if (malos.length > 6) console.log(`         ... y ${malos.length - 6} mas`);
  }
}