const CLIENT_ID = 'noaihdevm_6iyg0a8l0q';
const BASIC = Buffer.from(`${CLIENT_ID}:`).toString('base64');

const r = await fetch('https://beta-api.crunchyroll.com/auth/v1/token', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${BASIC}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  },
  body: 'grant_type=client_id',
});
console.log('token HTTP', r.status);
const d = await r.json();
console.log(JSON.stringify(d).slice(0, 300));
if (!d.access_token) process.exit(0);

const cab = {
  Authorization: `Bearer ${d.access_token}`,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
};

for (const q of ['akame ga kill', '86 eighty six', 'gintama', 'naruto']) {
  const u = `https://beta-api.crunchyroll.com/content/v2/discover/search?q=${encodeURIComponent(q)}&n=8&type=series&locale=es-ES`;
  const rr = await fetch(u, { headers: cab });
  const dd = await rr.json();
  console.log('\n---', q, 'HTTP', rr.status);
  const items = dd?.data ?? [];
  for (const it of items) console.log('  ', it.id, '|', it.title, '|', it.slug_title);
  if (!items.length) console.log('   (sin resultados)');
  await new Promise((ok) => setTimeout(ok, 300));
}
