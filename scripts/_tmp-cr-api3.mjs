const CLIENT_ID = 'noaihdevm_6iyg0a8l0q';
const BASIC = Buffer.from(`${CLIENT_ID}:`).toString('base64');

const r = await fetch('https://beta-api.crunchyroll.com/auth/v1/token', {
  method: 'POST',
  headers: { Authorization: `Basic ${BASIC}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=client_id',
});
const { access_token } = await r.json();
const cab = { Authorization: `Bearer ${access_token}` };

for (const q of ['akame ga kill', '86 eighty six', 'gintama', 'naruto', 'tokyo ghoul', 'solo leveling']) {
  const u = `https://beta-api.crunchyroll.com/content/v2/discover/search?q=${encodeURIComponent(q)}&n=5&type=series&locale=es-ES`;
  const rr = await fetch(u, { headers: cab });
  const dd = await rr.json();
  const items = (dd?.data ?? []).flatMap((g) => g.items ?? []);
  console.log(`\n--- ${q} (${rr.status}) ${items.length}`);
  for (const it of items) console.log(`   ${it.id} | ${it.title} | ${it.slug_title}`);
  await new Promise((ok) => setTimeout(ok, 300));
}
