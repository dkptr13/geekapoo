// ======================================================
// SUSTITUIR LA DISPONIBILIDAD POR LA AUDITADA
// ======================================================
//
//   node scripts/_tmp-jw-escribir.mjs --simular   (solo cuenta)
//   node scripts/_tmp-jw-escribir.mjs             (escribe)
//
// Borra todas las filas de `streamingAvailability` y escribe las que
// salen de `_tmp-jw-auditoria.json` (oferta real por pais).

import { readFile } from 'node:fs/promises';
import { cliente, coleccion, s, momento } from './firestore-rest.mjs';

const simular = process.argv.includes('--simular');

const obras = JSON.parse(await readFile('scripts/_tmp-jw-auditoria.json', 'utf8')).obras;

const { BASE, cabeceras } = await cliente();
const DOCS = BASE.replace(/^https:\/\/firestore\.googleapis\.com\/v1\//, '');

const existentes = await coleccion('streamingAvailability');
console.log(`Filas actuales: ${existentes.length}`);

const writes = existentes.map((doc) => ({
  delete: `${DOCS}/streamingAvailability/${doc.id}`,
}));

const HOY = '2026-10-27';
const ahora = new Date().toISOString();
const vistos = new Set();
let disponibles = 0;
let noDisponibles = 0;

for (const obra of obras) {
  for (const fila of obra.filas ?? []) {
    const docId = `${obra.id}__${fila.platformId}__${fila.region}`;
    if (vistos.has(docId)) throw new Error(`Documento repetido: ${docId}`);
    vistos.add(docId);

    const campos = {
      animeId: s(obra.id),
      platformId: s(fila.platformId),
      region: s(fila.region),
      status: s(fila.status),
      accessType: s(fila.accessType),
      verifiedAt: s(HOY),
      updatedAt: momento(ahora),
    };

    if (fila.status === 'available' && fila.url) campos.url = s(fila.url);

    if (fila.status === 'available') disponibles++;
    else noDisponibles++;

    writes.push({
      update: { name: `${DOCS}/streamingAvailability/${docId}`, fields: campos },
    });
  }
}

const obrasConFilas = obras.filter((o) => (o.filas?.length ?? 0) > 0).length;
console.log(`Obras con disponibilidad: ${obrasConFilas}/${obras.length}`);
console.log(`Filas nuevas: ${vistos.size} (${disponibles} disponibles / ${noDisponibles} no disponibles)`);
console.log(`Escrituras totales: ${writes.length} (${existentes.length} borrados + ${vistos.size} filas)`);

if (simular) {
  console.log('\nSimulación: no se ha escrito nada.');
  process.exit(0);
}

const LOTE = 450;
let enviadas = 0;

for (let i = 0; i < writes.length; i += LOTE) {
  const lote = writes.slice(i, i + LOTE);
  const r = await fetch(`${BASE}:commit`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ writes: lote }),
  });

  if (!r.ok) {
    console.error(`NO SE PUDO ESCRIBIR (${r.status})`);
    console.error(await r.text());
    process.exit(1);
  }

  enviadas += lote.length;
  console.log(`  ${enviadas}/${writes.length}`);
}

console.log(`\nEscritas ${enviadas} operaciones.`);
