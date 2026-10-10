// Vuelca la tabla de TVDB (temporada, numero, fecha, titulo JP) en UTF-8.
// Uso: TVDB_KEY=... node scripts/volcar-tabla-tvdb.mjs <tvdb_id> <salida>
import { writeFile } from 'node:fs/promises';

const clave = process.env.TVDB_KEY;
const serie = process.argv[2];
const salida = process.argv[3];

if (!clave || !serie || !salida) {
  console.error('uso: TVDB_KEY=... node scripts/volcar-tabla-tvdb.mjs <tvdb_id> <salida>');
  process.exit(1);
}

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: clave }),
});

const token = (await login.json())?.data?.token;

if (!token) {
  console.error('login fallido');
  process.exit(1);
}

async function pedir(ruta) {
  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });

  return (await r.json())?.data ?? [];
}

const lineas = [];
const porTemporada = new Map();

for (let pagina = 0; pagina < 20; pagina++) {
  const d = await pedir(`/series/${serie}/episodes/default?page=${pagina}`);
  const lista = d?.episodes ?? [];

  if (!lista.length) break;

  for (const e of lista) {
    const s = e.seasonNumber ?? 0;

    if (!porTemporada.has(s)) porTemporada.set(s, []);
    porTemporada.get(s).push(e);
  }
}

const ficha = await pedir(`/series/${serie}`);

lineas.push(`${serie} "${ficha.name ?? ''}" ${ficha.year ?? ''}`);
lineas.push(`genres: ${(ficha.genres ?? []).join(', ')}`);
lineas.push(`network: ${((ficha.networks ?? [])[0] ?? {}).name ?? ''} status: ${ficha.status?.name ?? ''}`);
lineas.push('');

for (const s of [...porTemporada.keys()].sort((a, b) => a - b)) {
  const eps = porTemporada.get(s);

  lineas.push(`--- S${s}: ${eps.length} capitulos ---`);

  for (const e of eps) {
    lineas.push(`S${s}E${e.number} ${e.aired ?? '????-??-??'} ${e.name ?? ''}`);
  }

  lineas.push('');
}

await writeFile(salida, lineas.join('\n'), 'utf8');
console.log(`escrito ${salida}: ${lineas.length} lineas`);
