// Compara los titulos japoneses de un anime entre TVDB y los ficheros de
// datos.
//    $env:TVDB_KEY='...'
//    node scripts/dif-titulos-tvdb.mjs <prefijo> <termino-busqueda>
//
// La comprobacion habitual es al reves: se busca la imagen por el titulo
// japones guardado. Si el titulo guardado esta mal, no se encuentra nada
// y el motivo parece "TVDB no tiene esa imagen", que es una conclusion
// falsa.
//
// Esto es lo que paso con Toradora: los titulos japoneses del fichero de
// datos estabanEndian escritos a ojo a partir del romaji de IMDb, y no
// cuadraban con los de TVDB. Parecia que TVDB no tenia those capitulos.
//
//   node scripts/dif-titulos-tvdb.mjs tor とらドラ！

import { readdir } from 'node:fs/promises';

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const prefijo = process.argv[2];
const termino = process.argv[3];

if (!prefijo || !termino) {
  console.error('  uso: node scripts/dif-titulos-tvdb.mjs <prefijo> <termino>');
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

const limpiar = (s) => (s ?? '').replace(/\s+/g, '').replace(/／/g, '/').trim();

// ── Los del catalogo ───────────────────────────────────────────────

const datosUrl = new URL('./datos/', import.meta.url);
const ficheros = await readdir(datosUrl);

const nuestros = [];

for (const f of ficheros.filter((x) => x.startsWith(`${prefijo}-t`) && x.endsWith('.mjs') && !x.endsWith('-tags.mjs'))) {
  const temporada = Number(f.slice(prefijo.length + 2, -4));

  const mod = await import(new URL(f, datosUrl));

  for (const filas of Object.values(mod)) {
    if (!Array.isArray(filas)) continue;

    for (const fila of filas) {
      if (Array.isArray(fila) && fila.length >= 3) {
        nuestros.push({ temporada, numero: fila[0], espanol: fila[1], japones: fila[2] });
      }
    }
  }
}

// ── Los de TVDB ────────────────────────────────────────────────────

const candidatas = await pedir(
  `/search?query=${encodeURIComponent(termino)}&type=series&limit=10`,
);

let mejor = 0;
let elegido = null;

for (const s of candidatas) {
  const salida = [];

  for (let pagina = 0; pagina < 20; pagina++) {
    const d = await pedir(`/series/${s.tvdb_id}/episodes/default?page=${pagina}`);
    const lista = d?.episodes ?? [];

    if (!lista.length) break;

    salida.push(...lista);
  }

  const deTvdb = new Set(salida.map((e) => limpiar(e.name)));
  const comunes = nuestros.filter((n) => deTvdb.has(limpiar(n.japones))).length;

  if (comunes > mejor) {
    mejor = comunes;
    elegido = { serie: s, capitulos: salida };
  }
}

if (!elegido) {
  console.log('ninguna serie de TVDB');
  process.exit(0);
}

console.log(
  `\n${prefijo}: ${nuestros.length} capitulos en el catalogo, ${mejor} con el mismo titulo en TVDB ${elegido.serie.tvdb_id} "${elegido.serie.name}"\n`,
);

const porClave = new Map();

for (const e of elegido.capitulos) {
  const k = limpiar(e.name);

  if (k && !porClave.has(k)) porClave.set(k, e);
}

for (const n of nuestros.sort((a, b) => a.temporada - b.temporada || a.numero - b.numero)) {
  const k = limpiar(n.japones);
  const ep = porClave.get(k);

  const estado = ep ? (ep.image || ep.thumbnail ? 'OK  ' : 'sin ' ) : 'DIF ';

  console.log(
    `T${n.temporada} ${String(n.numero).padStart(3)}  ${estado}` +
      `${n.japones.padEnd(30)}| ${ep ? limpiar(ep.name).slice(0, 40) : ''}`,
  );
}