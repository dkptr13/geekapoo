// JP exacto de bg/rz contra TVDB. Uso unico.
import { readFile } from 'node:fs/promises';

async function tabla(ruta) {
  const t = await readFile(ruta, 'utf8');
  const mapa = {};

  for (const l of t.split('\n')) {
    const m = l.match(/^S(\d+)E(\d+)\s+(\S+)\s+(.*)$/);

    if (m) mapa[m[1] + 'x' + m[2]] = { jp: m[4].trim(), fecha: m[3] };
  }

  return mapa;
}

let fallos = 0;

async function revisar(tablaRuta, temp, fich, exp) {
  const jps = await tabla(tablaRuta);
  const mod = await import('./datos/' + fich);
  const filas = mod[exp];

  for (const [n, , jp, fecha] of filas) {
    const c = jps[temp + 'x' + n];

    if (!c) {
      console.log(`${fich} E${n}: SIN FILA`);
      fallos++;
    } else {
      if (c.jp !== jp) {
        console.log(`${fich} E${n} JP DIFIERE`);
        fallos++;
      }

      if (c.fecha !== fecha) {
        console.log(`${fich} E${n} fecha tvdb=${c.fecha} file=${fecha}`);
        fallos++;
      }
    }
  }

  console.log(`${fich}: ${filas.length} filas`);
}

await revisar('scripts/lotes/tvdb-bunny.txt', 1, 'bg-t1.mjs', 'T1');
await revisar('scripts/lotes/tvdb-bunny.txt', 2, 'bg-t2.mjs', 'T2');
await revisar('scripts/lotes/tvdb-rezero.txt', 1, 'rz-t1.mjs', 'T1');
await revisar('scripts/lotes/tvdb-rezero.txt', 2, 'rz-t2.mjs', 'T2');
await revisar('scripts/lotes/tvdb-rezero.txt', 3, 'rz-t3.mjs', 'T3');
await revisar('scripts/lotes/tvdb-rezero.txt', 4, 'rz-t4.mjs', 'T4');
console.log(fallos ? fallos + ' PROBLEMAS' : 'TODO EXACTO');
