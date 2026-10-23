// Los capitulos de una serie en TVDB, con su titulo japones.
//   node scripts/tvdb-capitulos.mjs <tvdb_id> [temporada]
const clave = process.env.TVDB_KEY;
if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const serie = process.argv[2];
const temporada = Number(process.argv[3] ?? 1);

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

const capitulos = [];
for (let pagina = 0; pagina < 20; pagina++) {
  const d = await pedir(`/series/${serie}/episodes/default?page=${pagina}`);
  const lista = d?.episodes ?? [];
  if (!lista.length) break;
  capitulos.push(...lista);
}

for (const c of capitulos) {
  const num = c.seasonNumber ?? 0;
  if (num !== temporada) continue;
  console.log(
    `T${num} E${String(c.number ?? 0).padStart(2, '0')}  ${c.name ?? ''}  |  ${c.image ?? '(sin imagen)'}`,
  );
}