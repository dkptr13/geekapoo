// Las series de TVDB que tienen que ver con una.
//   node scripts/tvdb-relacionadas.mjs <tvdb_id>
const clave = process.env.TVDB_KEY;
if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const serie = process.argv[2];

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: clave }),
});
const token = (await login.json())?.data?.token;

async function pedir(ruta) {
  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  return (await r.json())?.data ?? [];
}

const d = await pedir(`/series/${serie}/extended`);
console.log(`  ${d.tvdb_id}  ${d.name}  (${d.year ?? '?'})  ${d.status ?? ''}`);
console.log(`     original: ${d.originalName ?? ''}`);

const cap = await pedir(`/series/${serie}/episodes/default?page=0`);
const temporadas = [...new Set((cap.episodes ?? []).map((e) => e.seasonNumber))].sort();
console.log(`     temporadas en TVDB: ${temporadas.join(', ')}`);

for (const t of temporadas) {
  const eps = (cap.episodes ?? []).filter((e) => e.seasonNumber === t);
  const conImagen = eps.filter((e) => e.image).length;
  console.log(`       T${t}: ${eps.length} capitulos (${conImagen} con imagen)`);
}