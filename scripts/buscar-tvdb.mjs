// Busca una serie en TVDB y saca su id.
//   node scripts/buscar-tvdb.mjs <texto> [--peliculas]
//
// Con `--peliculas` busca en las peliculas (`type=movie`) en vez de en
// las series. Hace falta para las fichas del catalogo que son una
// pelicula suelta: TVDB no las tiene como serie y la busqueda normal las
// ignora.
const clave = process.env.TVDB_KEY;
if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const peliculas = args.includes('--peliculas');
const texto = args.find((a) => !a.startsWith('--'));
if (!texto) {
  console.error('  uso: node scripts/buscar-tvdb.mjs <texto> [--peliculas]');
  process.exit(1);
}

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: clave }),
});
const token = (await login.json())?.data?.token;

const tipo = peliculas ? 'movie' : 'series';

const r = await fetch(
  `https://api4.thetvdb.com/v4/search?query=${encodeURIComponent(texto)}&type=${tipo}`,
  { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
);
const d = await r.json();
const lista = d?.data ?? [];
console.log(`"${texto}" [${tipo}]: ${lista.length} resultados`);
for (const s of lista.slice(0, 8)) {
  const t = s.translations?.[0] ?? {};
  console.log(
    `  ${s.tvdb_id}  ${s.name} (${s.year ?? '?'})  ${t.name ?? ''}  ${s.status ?? ''}`,
  );
}
