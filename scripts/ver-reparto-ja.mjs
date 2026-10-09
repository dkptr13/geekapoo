// Saca el reparto de una pagina de wikipedia, por nombre y seiyuu.
//
//    node scripts ver-reparto-ja.mjs <pagina>
//
// Imprime lo que se ha encontrado, sin decidir nada: el nombre, el
// japones y la voz, en una linea por personaje. Sirve para comprobar a
// mano lo que devuelve antes de escribir el fichero de datos.
//
// ── POR QUE ESTE Y NO EL OTRO ─────────────────────────────────────
//
// Las paginas de personajes tra en dos formatos: unas con <dl> (nombre en
// <dt>, voz en el <dd> siguiente) y otras con "Main article" o <h4>.
// Este va por el formato de las japonesas, que es una prosa con
// "Nombre（よみ）声 - Seiyuu" y sale de un solo sitio.

const pagina = process.argv[2];

if (!pagina) {
  console.error('  uso: node scripts ver-reparto-ja.mjs <pagina>');
  process.exit(1);
}

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

const plano = html
  .replace(/<sup[\s\S]*?<\/sup>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#\d+;/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const RE =
  /([぀-ヿ一-鿿・ヶ]{1,6}(?:\s[぀-ヿ一-鿿・ヶ]{1,6})?)\s*[（(]([぀-ヿ]{2,}[ 　]?[぀-ヿ]+)[）)]\s*声\s*[-‐―]\s*([^、。]{1,60})/g;

const vistos = new Set();
const salida = [];

for (const [, kanji, lectura, voces] of plano.matchAll(RE)) {
  if (vistos.has(kanji.trim())) continue;

  vistos.add(kanji.trim());

  // El formato es "声 - <seiyuu> <descripcion>", asi que el primer grupo
  // de palabras es el nombre de la voz.
  salida.push({
    nombre: kanji.trim(),
    lectura: lectura.trim(),
    voces: voces
      .split(/\s*[、,]\s*/)
      .map((v) => v.trim())
      .filter(Boolean),
  });
}

console.log(`${salida.length} personajes en ${pagina}\n`);

for (const p of salida) {
  console.log(`${p.nombre}\t${p.lectura}\t${p.voces.join(' / ')}`);
}