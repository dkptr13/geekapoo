const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const Q = (pais) => `query P { packages(country: ${pais}, platform: WEB) { clearName } }`;

for (const pais of ['JP', 'US', 'MX', 'DE', 'GB', 'FR', 'AR', 'CO', 'CL']) {
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q(pais) }) });
  const d = await r.json();
  const nombres = (d.data?.packages ?? []).map((p) => p.clearName);
  const interes = nombres.filter((n) =>
    /netflix|crunchyroll|amazon|prime|disney|max|hbo|hulu|apple|youtube|filmin|movistar|atres|rtve|hidive|u-next|unext|abema|dmm|anime/i.test(n),
  );
  console.log(`${pais} (${nombres.length}): ${interes.sort().join(' | ')}`);
}
