import { readFile } from 'node:fs/promises';

const datos = JSON.parse(await readFile('scripts/_tmp-jw-auditoria.json', 'utf8')).obras;

const norm = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const con = datos.filter((o) => o.justwatch);
const sin = datos.filter((o) => !o.justwatch);

console.log(`Emparejadas ${con.length}/${datos.length} · sin emparejar ${sin.length}`);
console.log('\n=== SIN EMPAREJAR ===');
for (const o of sin) console.log(`  ${o.id} | "${o.titulo}" (${o.anio}) alt=${o.legado.length}`);

console.log('\n=== EMPAREJADAS DUDOSAS (titulo o anio no coinciden) ===');
for (const o of con) {
  const a = norm(o.titulo);
  const b = norm(o.justwatch.titulo);
  const igual = a === b || b.startsWith(a) || a.startsWith(b);
  const anioMal = o.anio && o.justwatch.anio && Math.abs(o.anio - o.justwatch.anio) > 1;
  if (igual && !anioMal) continue;
  console.log(
    `  ${o.id.padEnd(44)} "${o.titulo}" (${o.anio}) -> "${o.justwatch.titulo}" (${o.justwatch.anio}) [${o.justwatch.tipo}]`,
  );
}

const filas = datos.flatMap((o) => o.filas);
const disp = filas.filter((f) => f.status === 'available');
const nod = filas.filter((f) => f.status === 'unavailable');
console.log(`\nFilas: ${filas.length} (${disp.length} disponibles / ${nod.length} no disponibles)`);
for (const r of ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB']) {
  console.log(`  ${r}: ${disp.filter((f) => f.region === r).length} disponibles`);
}
const porPlataforma = {};
for (const f of disp) porPlataforma[f.platformId] = (porPlataforma[f.platformId] ?? 0) + 1;
console.log('\nDisponibles por plataforma:');
for (const [p, n] of Object.entries(porPlataforma).sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(22)} ${n}`);

console.log('\n=== SIN NINGUNA DISPONIBILIDAD ===');
for (const o of con) if (!o.filas.some((f) => f.status === 'available')) console.log(`  ${o.id} ("${o.titulo}")`);
