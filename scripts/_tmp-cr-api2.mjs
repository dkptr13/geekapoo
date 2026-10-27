const CLIENT_ID = 'noaihdevm_6iyg0a8l0q';
const BASIC = Buffer.from(`${CLIENT_ID}:`).toString('base64');

const r = await fetch('https://beta-api.crunchyroll.com/auth/v1/auth/v1/token'.replace('/auth/v1/auth/v1/token', '/auth/v1/token'), {
  method: 'POST',
  headers: { Authorization: `Basic ${BASIC}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=client_id',
});
const d = await r.json();
const cab = { Authorization: `Bearer ${d.access_token}` };

const u = `https://beta-api.crunchyroll.com/content/v2/discover/search?q=${encodeURIComponent('naruto')}&n=5&type=series&locale=es-ES`;
const rr = await fetch(u, { headers: cab });
const dd = await rr.json();
console.log(JSON.stringify(dd, null, 1).slice(0, 2500));
