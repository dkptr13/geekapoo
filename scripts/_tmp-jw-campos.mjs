const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const probar = async (campos, id = 'ts20066') => {
  const Q = `query { node(id: "${id}") { ... on MovieOrShow { objectId ${campos} } } }`;
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query: Q }) });
  const d = await r.json();
  if (d.errors) { console.log(`### ${campos}\n   ERR`, d.errors.map((e) => e.message).join(' | ').slice(0, 200)); return; }
  console.log(`### ${campos}\n`, JSON.stringify(d.data, null, 1).slice(0, 1000));
};

await probar('content(country: US, language: en) { title originalTitle fullPath }');
await probar('content(country: ES, language: es) { title originalTitle }');
await probar('content(country: US, language: en) { title originalReleaseYear }');
await probar('imdbId');
await probar('externalIds { imdbId }');
await probar('scoring');
