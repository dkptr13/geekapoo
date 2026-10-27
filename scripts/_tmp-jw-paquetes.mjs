const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const Q = `query Paquetes {
  packages(country: ES, platform: WEB) {
    clearName
    technicalName
  }
}`;

const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q }) });
const d = await r.json();
console.log('HTTP', r.status, d.errors ? JSON.stringify(d.errors).slice(0, 300) : '');
if (d.data?.packages) {
  const nombres = d.data.packages.map((p) => p.clearName).sort();
  console.log('total', nombres.length);
  console.log(nombres.filter((n) => /anime|selecta|filmin/i.test(n)).join(' | '));
  console.log('---todos---');
  console.log(nombres.join(' | '));
} else {
  console.log(JSON.stringify(d).slice(0, 800));
}
