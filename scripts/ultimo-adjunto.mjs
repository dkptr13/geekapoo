// Saca los ficheros adjuntos del ultimo mensaje del usuario.
//
//   node scripts/ultimo-adjunto.mjs <salida>
//
// ── DONDE ESTAN DE VERDAD ─────────────────────────────────────────
//
// En `session_message.data`, que es un JSON con esta forma:
//
//     { "text": "lo que escribio",
//       "files": [ { "mime": "image/png", "data": "BASE64 CRUDO" } ] }
//
// OJO con dos cosas que ya han costado un rato:
//
//   · El base64 va CRUDO. No viene con el prefijo `data:image/png;base64,`.
//     Buscando ese prefijo no se encuentra nada y parece que no hay
//     adjuntos, cuando los hay.
//
//   · La lista se llama `files`, no `parts`. Y esta en `data`, que es TEXT
//     con un JSON dentro, no en una columna BLOB.
//
// ── QUE HACE ──────────────────────────────────────────────────────
//
// 1. Se queda con el ultimo mensaje de tipo `user` que tenga ficheros.
//    Se ordena por `time_created`, que es cuando entro el mensaje; el
//    `rowid` es el orden en que se escribio la fila y no tiene nada que
//    ver.
//
// 2. Escribe cada fichero con la extension que sale de SU FIRMA, no de la
//    que diga el `mime`. Un adjunto puede llamarse `captura.png` y ser un
//    JPEG de verdad, y si se guia por el nombre el navegador recibe un
//    `.png` que no es PNG y no lo pinta, sin decir por que.
//
// ── SOLO LECTURA ──────────────────────────────────────────────────
//
// La base se abre en solo lectura. Esto no modifica nada.

import { DatabaseSync } from 'node:sqlite';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const RUTA_DB = join(homedir(), '.local', 'share', 'opencode', 'opencode.db');
const salida = process.argv[2] ?? 'adjuntos-ultimo';

/** De que es cada imagen, mirando los bytes y no el nombre. */
function extensionDe(buf) {
  const pn = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const jpg = [0xff, 0xd8, 0xff];
  const gif = [0x47, 0x49, 0x46, 0x38];
  const empiezaCon = (n) => n.every((b, i) => buf[i] === b);

  if (empiezaCon(pn)) return 'png';
  if (empiezaCon(jpg)) return 'jpg';
  if (empiezaCon(gif)) return 'gif';

  if (
    Buffer.from('RIFF').equals(buf.subarray(0, 4)) &&
    Buffer.from('WEBP').equals(buf.subarray(8, 12))
  ) {
    return 'webp';
  }

  return null;
}

/** Tamano de un PNG, que lo lleva en la cabecera. */
function tamanoPng(buf) {
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
}

const db = new DatabaseSync(RUTA_DB, { readOnly: true });

const candidatos = db
  .prepare(
    'SELECT id, time_created, data FROM session_message WHERE type = ? ORDER BY time_created DESC LIMIT 40',
  )
  .all('user');

// El primero que traiga ficheros es lo que se acaba de pegar. Se mira
// hacia atras porque puede haber mensajes sueltos ("sigue", "vale") entre
// el mensaje con las imagenes y el final.
let elegido = null;

for (const m of candidatos) {
  try {
    const d = JSON.parse(m.data);

    if (Array.isArray(d.files) && d.files.length > 0) {
      elegido = { ...d, cuando: Number(m.time_created) };
      break;
    }
  } catch {
    // Un mensaje con el JSON roto no es el que buscamos; se sigue.
  }
}

if (!elegido) {
  console.log('No hay ningun mensaje de usuario con ficheros adjuntos.');

  process.exit(1);
}

console.log(`  ${new Date(elegido.cuando).toISOString().slice(0, 19).replace('T', ' ')}`);
console.log(`  "${elegido.text}"`);
console.log(`  ${elegido.files.length} fichero(s)\n`);

await mkdir(salida, { recursive: true });

let n = 0;

for (const f of elegido.files) {
  n++;

  const buf = Buffer.from(f.data ?? '', 'base64');

  if (buf.length === 0) {
    console.log(`  ${n}: vacio`);

    continue;
  }

  const ext = extensionDe(buf) ?? String(f.mime ?? 'bin').split('/')[1] ?? 'bin';
  const px = ext === 'png' ? `  ${tamanoPng(buf)}` : '';
  const nombre = `pegado-${n}.${ext}`;

  await writeFile(join(salida, nombre), buf);

  console.log(`  ${nombre}  ${Math.round(buf.length / 1024)} KB${px}  (dice: ${f.mime})`);
}

console.log(`\nEn ${salida}/`);