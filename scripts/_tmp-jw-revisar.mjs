import { readFile } from 'node:fs/promises';

const datos = JSON.parse(await readFile('scripts/_tmp-jw-auditoria.json', 'utf8')).obras;

const norm = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

const con = datos.filter((o) => o.elegido);
const sin = datos.filter((o) => !o.elegido);

console.log(`Emparejadas ${con.length}/${datos.length} · sin emparejar ${sin.length}`);

const confianza = (o) => {
  const d = o.dudosos[0] ?? {};
  if (o.estado === 'fijado') return 'fijado';
  if (d.titulo >= 100 && d.anioOk && d.tipoOk) return 'alta';
  if (d.titulo >= 60 && d.anioOk && d.tipoOk) return 'media';
  if (d.anioOk && d.tipoOk && d.puntos >= 70) return 'media';
  return 'baja';
};

console.log('\n=== REVISAR (confianza baja o media) ===');
for (const o of con) {
  const c = confianza(o);
  if (c === 'alta' || c === 'fijado') continue;
  const d = o.dudosos[0] ?? {};
  console.log(
    `  [${c}] ${o.id.padEnd(44)} "${o.titulo}" (${o.anio}) -> "${d.title}" (${d.anio}) [${d.tipo}] puntos ${d.puntos} (titulo ${d.titulo})`,
  );
}

console.log('\n=== SIN EMPAREJAR ===');
for (const o of sin) console.log(`  ${o.id} | "${o.titulo}" (${o.anio}) pelicula=${o.pelicula}`);

console.log('\n=== TODAS ===');
for (const o of con) {
  const d = o.dudosos[0] ?? {};
  console.log(
    `  ${o.id.padEnd(44)} -> ${d.title} (${d.anio}) ${d.tipo} | ${confianza(o)}`,
  );
}

const filas = datos.flatMap((o) => o.filas);
const disp = filas.filter((f) => f.status === 'available');
console.log(`\nFilas: ${filas.length} (${disp.length} disponibles)`);
for (const r of ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB']) {
  console.log(`  ${r}: ${disp.filter((f) => f.region === r).length} disponibles`);
}
const porPlataforma = {};
for (const f of disp) porPlataforma[f.platformId] = (porPlataforma[f.platformId] ?? 0) + 1;
console.log('\nDisponibles por plataforma:');
for (const [p, n] of Object.entries(porPlataforma).sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(22)} ${n}`);
