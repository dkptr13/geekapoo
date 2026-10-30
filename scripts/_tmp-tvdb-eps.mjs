const clave = process.env.TVDB_KEY;
const base = 'https://api4.thetvdb.com/v4';
const j = await (await fetch(base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apikey: clave }) })).json();
const h = { Authorization: 'Bearer ' + j.data.token };
for (const t of [7, 8]) {
  const e = await (await fetch(`${base}/series/81797/episodes/default?page=0&season=${t}`, { headers: h })).json();
  const lista = (e.data?.episodes ?? []).slice().sort((a, b) => a.number - b.number);
  for (const x of lista) console.log(`S${t}\t${x.number}\t${x.aired}\t${x.image ? 'IMG' : '---'}\t${x.name}`);
}
