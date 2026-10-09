// Secciones de un articulo de wikipedia.
//    node scripts/ver-secciones.mjs <pagina>
//
// Para buscar el apartado donde esta la lista de capitulos, que no
// siempre se llama igual ni esta en el mismo sitio: en la de Toradora el
// apartado se llama 放送日程 y en la de Saekano 各話リスト.

const pagina = process.argv[2];

if (!pagina) {
  console.error('  uso: node scripts/ver-secciones.mjs <pagina>');
  process.exit(1);
}

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}&prop=sections&format=json&formatversion=2`,
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const d = await r.json();

if (d.error) {
  console.log(`error: ${d.error.info}`);
  process.exit(1);
}

for (const s of d.parse?.sections ?? []) {
  if (s.line) console.log(`${s.level}  ${s.line}`);
}