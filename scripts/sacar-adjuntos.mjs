// Saca del registro de opencode los adjuntos de imagen de esta sesion.
//
//   node scripts/sacar-adjuntos.mjs <salida>
//
// ── PARA QUE ESTA ─────────────────────────────────────────────────
//
// Cuando se pega una imagen en el chat, opencode no la deja como fichero
// suelto: la guarda dentro de su base de datos (`opencode.db`), dentro de
// un JSON, en base64. Para usarla en la web hay que sacarla de ahi.
//
// ── DONDE ESTA ────────────────────────────────────────────────────
//
// No hay columnas BLOB. Las imagenes van en la columna `data` de
// `session_message`, que es TEXT con un JSON, y dentro del JSON vienen
// como cadenas `data:image/png;base64,...`.
//
// Se recorren todas las tablas con una columna de texto, por si el
// almacenamiento cambia: lo que se busca no es una tabla en concreto, es
// el patron `data:image/...;base64,`.
//
// ── POR QUE LA FIRMA Y NO EL NOMBRE ──────────────────────────────
//
// Un adjunto puede llamarse `captura.png` y ser un JPEG de verdad. Si se
// guided por el nombre, el navegador recibe un `.png` que no es PNG y no lo
// pinta, sin decir por que.
//
// ── NO ESCRIBE NADA EN LA BASE ────────────────────────────────────
//
// Se abre en solo lectura. Esto unicamente lee.

import { DatabaseSync } from 'node:sqlite';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const RUTA_DB = join(homedir(), '.local', 'share', 'opencode', 'opencode.db');
const salida = process.argv[2] ?? 'adjuntos';

const db = new DatabaseSync(RUTA_DB, { readOnly: true });

// ── De que es cada imagen, mirando los bytes ─────────────────────
//
// Se decide por la firma, no por lo que diga el `data:` del URI.
function extensionDe(buf) {
  const pn = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const jpg = [0xff, 0xd8, 0xff];
  const gif = [0x47, 0x49, 0x46, 0x38];

  const empiezaCon = (n) => n.every((b, i) => buf[i] === b);

  if (empiezaCon(pn)) return 'png';
  if (empiezaCon(jpg)) return 'jpg';
  if (empiezaCon(gif)) return 'gif';

  // WebP: "RIFF" + 4 bytes de tamano + "WEBP" en el byte 8.
  if (
    Buffer.from('RIFF').equals(buf.subarray(0, 4)) &&
    Buffer.from('WEBP').equals(buf.subarray(8, 12))
  ) {
    return 'webp';
  }

  return null;
}

const tablas = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
  .all()
  .map((r) => r.name);

await mkdir(salida, { recursive: true });

const vistos = new Set();
let guardados = 0;

for (const tabla of tablas) {
  let columnas;

  try {
    columnas = db.prepare(`PRAGMA table_info("${tabla}")`).all();
  } catch {
    continue;
  }

  for (const col of columnas) {
    const tipo = String(col.type ?? '').toUpperCase();

    if (!tipo.includes('TEXT')) continue;

    let filas;

    try {
      filas = db
        .prepare(`SELECT rowid AS rid, "${col.name}" AS dato FROM "${tabla}"`)
        .all();
    } catch {
      continue;
    }

    for (const fila of filas) {
      const texto = fila.dato;

      if (typeof texto !== 'string' || !texto.includes('base64,')) continue;

      // Puede haber mas de una imagen en la misma celda.
      const patron = /data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;
      let m;

      while ((m = patron.exec(texto)) !== null) {
        const buf = Buffer.from(m[2], 'base64');

        if (buf.length < 512) continue;

        const clave = `${buf.length}-${buf.subarray(0, 48).toString('hex')}`;

        if (vistos.has(clave)) continue;
        vistos.add(clave);

        const ext = extensionDe(buf) ?? m[1].toLowerCase();
        const nombre = `${tabla}-${String(fila.rid).padStart(5, '0')}-${buf.length}.${ext}`;

        await writeFile(join(salida, nombre), buf);

        const px = `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;

        console.log(`  ${nombre.padEnd(46)} ${Math.round(buf.length / 1024)} KB  ${px}`);
        guardados++;
      }
    }
  }
}

console.log(`\n${guardados} imagenes escritas en ${salida}/`);

if (!guardados) {
  console.log('No ha salido ninguna. Puede que los adjuntos no esten en la base.');
}