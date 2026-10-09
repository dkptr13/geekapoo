// Saca el reparto de una pagina de wikipedia en japones, en el formato
// que usa una tabla en vez de prosa.
//    node scripts ver-reparto-tabla.mjs <pagina> [<marcador>]
//
// `ver-reparto-ja.mjs` saca el reparto de la prosa con "Nombre（よみ）
// 声 - Seiyuu". Hay paginas que no lo tienen asi
// con esas hay que buscar otra via. Este es esa otra via: imprime todas
// las filas que tienen un nombre japones y un nombre de persona al lado.

const pagina = process.argv[2];
const marcador = process.argv[3] ?? '声';

if (!pagina) {
  console.error('  uso: node scripts ver-reparto-tabla.mjs <pagina> [<marcador>]');
  process.exit(1);
}

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
    .replace(/<br\s*\/?>/g, ' / ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ── 1. Filas de tabla ─────────────────────────────────────────────

const filas = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);

let encontradas = 0;

for (const fila of filas) {
  const celdas = [...fila.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) =>
    limpio(m[1]),
  );

  if (celdas.length < 2) continue;

  const linea = celdas.join('\t');

  // Nombre japones (kanji o kana) junto a un nombre de persona y, si
  // puede ser, el marcador de voz.
  if (!/[\u3040-\u30ff\u4e00-\u9fff]{2,}/.test(linea)) continue;
  if (!marcador || !linea.includes(marcador)) continue;

  console.log('T\t' + linea.slice(0, 200));
  encontradas++;
}

// ── 2. Listas de definicion, por si

const plano = limpio(html);

for (const bloque of plano.split(/\s(?=[一-鿿぀-ヿ]{2,}([（(]|$))/)) {
  if (bloque.includes(marcador) && bloque.length < 220) {
    console.log('L\t' + bloque);
    encontradas++;
  }
}

console.log(`\n${encontradas} lineas`);