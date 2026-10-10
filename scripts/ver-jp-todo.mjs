// Compara los JP de los ficheros de datos con TVDB exacto. Uso unico.
import { readFile } from 'node:fs/promises';

async function tabla(ruta) {
  const t = await readFile(ruta, 'utf8');
  const mapa = {};

  for (const l of t.split('\n')) {
    const m = l.match(/^S(\d+)E(\d+)\s+\S+\s+(.*)$/);

    if (m) mapa[m[1] + 'x' + m[2]] = m[3].trim();
  }

  return mapa;
}

let fallos = 0;

async function revisar(tablaRuta, temp, fich, exp) {
  const jps = await tabla(tablaRuta);
  const mod = await import('./datos/' + fich);
  const filas = mod[exp];

  for (const [n, , jp, fecha] of filas) {
    const clave = temp + 'x' + n;
    const tvdb = jps[clave];

    if (tvdb === undefined) {
      console.log(`${fich} E${n}: SIN FILA EN TVDB`);
      fallos++;
    } else if (tvdb !== jp) {
      console.log(`${fich} E${n} DIFIERE`);
      fallos++;
    }

    const f = jps[clave + 'f'];

    if (f !== undefined && f !== fecha) {
      console.log(`${fich} E${n} fecha tvdb=${f} file=${fecha}`);
      fallos++;
    }
  }

  console.log(`${fich}: ${filas.length} filas revisadas`);
}

// Las filas llevan la fecha; la tabla tambien: se compara a la vez.
async function tablaConFecha(ruta) {
  const t = await readFile(ruta, 'utf8');
  const mapa = {};

  for (const l of t.split('\n')) {
    const m = l.match(/^S(\d+)E(\d+)\s+(\S+)\s+(.*)$/);

    if (m) {
      mapa[m[1] + 'x' + m[2]] = m[4].trim();
      mapa[m[1] + 'x' + m[2] + 'f'] = m[3];
    }
  }

  return mapa;
}

async function revisar2(tablaRuta, temp, fich, exp) {
  const jps = await tablaConFecha(tablaRuta);
  const mod = await import('./datos/' + fich);
  const filas = mod[exp];

  for (const [n, , jp, fecha] of filas) {
    const clave = temp + 'x' + n;

    if (!(clave in jps)) {
      console.log(`${fich} E${n}: SIN FILA EN TVDB`);
      fallos++;
    } else if (jps[clave] !== jp) {
      console.log(`${fich} E${n} JP DIFIERE`);
      fallos++;
    }

    if (jps[clave + 'f'] !== undefined && jps[clave + 'f'] !== fecha) {
      console.log(`${fich} E${n} fecha tvdb=${jps[clave + 'f']} file=${fecha}`);
      fallos++;
    }
  }

  console.log(`${fich}: ${filas.length} filas revisadas`);
}

await revisar2('scripts/lotes/tvdb-danmachi.txt', 1, 'dm-t1.mjs', 'T1');
await revisar2('scripts/lotes/tvdb-danmachi.txt', 2, 'dm-t2.mjs', 'T2');
await revisar2('scripts/lotes/tvdb-danmachi.txt', 3, 'dm-t3.mjs', 'T3');
await revisar2('scripts/lotes/tvdb-danmachi.txt', 4, 'dm-t4.mjs', 'T4');
await revisar2('scripts/lotes/tvdb-danmachi.txt', 5, 'dm-t5.mjs', 'T5');
await revisar2('scripts/lotes/tvdb-plastic.txt', 1, 'pm-t1.mjs', 'T1');
console.log(fallos ? fallos + ' PROBLEMAS' : 'TODO EXACTO');
