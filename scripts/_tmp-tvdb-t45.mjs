const clave = process.env.TVDB_KEY;
const base = 'https://api4.thetvdb.com/v4';
const j = await (await fetch(base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apikey: clave }) })).json();
const h = { Authorization: 'Bearer ' + j.data.token };
const s = await (await fetch(base + '/series/81797/extended', { headers: h })).json();
const temps = (s.data?.seasons ?? []).filter(t => t.type?.name === 'Aired Order').sort((a, b) => a.number - b.number);
for (const t of temps) {
  if (t.number < 5 || t.number > 10) continue;
  const e = await (await fetch(`${base}/series/81797/episodes/default?page=0&season=${t.number}`, { headers: h })).json();
  const lista = e.data?.episodes ?? [];
  const orden = lista.slice().sort((a, b) => a.number - b.number);
  console.log('S' + t.number, 'id', t.id, '| n', lista.length, '| primera', orden[0]?.number, orden[0]?.aired, '| ultima', orden.at(-1)?.number, orden.at(-1)?.aired, '|', (orden[0]?.name ?? '').slice(0, 30));
}
