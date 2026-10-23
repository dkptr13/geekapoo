// Saca las filas de la tabla de capitulos de la wiki para unos
// numeros concretos.
//   node scripts/ver-filas-wiki.mjs <pagina> <n1> [<n2> ...]
const pagina = process.argv[2];
const numeros = process.argv.slice(3).map(Number);

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);
const html = (await r.json()).parse?.text ?? '';

const limpio = (s) =>
  s
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
  const celdas = [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => limpio(c[1]));
  if (celdas.length < 2) continue;
  const numero =
    /^第\s*(\d+(?:\.\d+)?)\s*話$/.exec(celdas[0])?.[1] ??
    /^(\d+(?:\.\d+)?)$/.exec(celdas[0])?.[1];
  if (!numero) continue;
  if (!numeros.includes(Number(numero))) continue;
  console.log(`ep ${numero}:`);
  celdas.forEach((c, i) => console.log(`   [${i}] ${c}`));
}