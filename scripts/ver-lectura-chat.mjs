// Estado REAL de los recibos de lectura del chat.
//
//   node scripts/ver-lectura-chat.mjs --full
//
// El usuario dice que el punto de "sin leer" no se quita hasta que
// responde. Antes de cambiar código hay que ver si la marca se está
// guardando, porque son dos fallos muy distintos:
//
//   · Si `readAt` está VACÍO, la escritura está fallando.
//   · Si `readAt` está LLENO y aun así sale el punto, el fallo está
//     en el cálculo de "sin leer", no en la escritura.
//
// No escribe nada. Solo lee.

import { coleccion } from './firestore-rest.mjs';

if (!process.argv.includes('--full')) {
  console.error('  uso: ver-lectura-chat.mjs --full');
  console.error('  Recorre toda la colección de chats: requiere --full.');
  process.exit(1);
}

const docs = await coleccion('chats');

console.log(`Chats en la base: ${docs.length}`);
console.log('');

const iso = (v) => {
  if (!v) return '(sin fecha)';
  if (typeof v === 'string') return v;
  if (v.timestampValue) return v.timestampValue;
  return JSON.stringify(v).slice(0, 40);
};

const clavesDe = (v) => Object.keys(v?.mapValue?.fields ?? {});

let sinMarca = 0;
let conMarca = 0;

for (const d of docs) {
  const f = d.f ?? {};
  const readFields = f.readAt?.mapValue?.fields ?? {};
  const claves = Object.keys(readFields);

  console.log(`── ${d.name ?? d.id ?? '(sin id)'}`);
  console.log(`   tipo:          ${f.type?.stringValue ?? '?'}`);
  console.log(`   miembros:      ${(f.memberIds?.arrayValue?.values ?? []).length}`);
  console.log(`   lastMessageAt: ${iso(f.lastMessageAt)}`);
  console.log(`   emisor ultimo: ${f.lastMessageSenderId?.stringValue ?? '(vacio)'}`);
  console.log(`   preview:       ${(f.lastMessagePreview?.stringValue ?? '(vacio)').slice(0, 40)}`);
  console.log(`   readAt:        ${claves.length === 0 ? '*** VACIO ***' : ''}`);

  for (const k of claves) {
    console.log(`      ${k} -> ${iso(readFields[k])}`);
  }

  const cleared = clavesDe(f.clearedAt);
  console.log(`   clearedAt:     ${cleared.length ? cleared.join(', ') : '(vacio)'}`);
  console.log('');

  if (claves.length === 0) sinMarca += 1;
  else conMarca += 1;
}

console.log('-----------------------------------------');
console.log(`Con marca de lectura: ${conMarca}`);
console.log(`SIN marca de lectura: ${sinMarca}`);
