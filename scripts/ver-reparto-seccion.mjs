// Saca los pares nombre japones / seiyuu de una pagina de wikipedia.
//    node scripts ver-reparto-seccion.mjs <pagina> <encabezado>
//
// Igual que `ver-reparto-ja.mjs` pero sobre el texto plano de una
// seccion concreta. La diferencia importa porque muchas paginas japonesas
// tienen el reparto dentro de apartados (" filme" y "serie de television",
// por ejemplo) y el extractor general solo pilla el primero.
//
// El formato que se busca, en el texto plano, es:
//
//     空（そら）
//     声 - 松岡禎丞
//
// o sea, un nombre en su propia linea y el seiyuu en la siguiente. Con
// las lecturas entre parentesis, y a veces sin ellas.

const [pagina, encabezado] = process.argv.slice(2);

if (!pagina || !encabezado) {
  console.error('  uso: node scripts ver-reparto-seccion.mjs <pagina> <encabezado>');
  process.exit(1);
}

const r = await fetch(
  `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pagina)}` +
    '&prop=text&format=json&formatversion=2',
  { headers: { 'User-Agent': 'geekapoo-script/1.0' } },
);

const html = (await r.json()).parse?.text ?? '';

const plano = html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<sup[\s\S]*?<\/sup>/g, '')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&#\d+;/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .split('\n')
  .map((l) => l.replace(/[ \t]+/g, ' ').trim())
  .filter(Boolean);

const desde = plano.findIndex((l) => l.startsWith(encabezado));

if (desde < 0) {
  console.log(`no encuentro "${encabezado}"`);
  process.exit(1);
}

let hasta = plano.length;

for (let i = desde + 1; i < plano.length; i++) {
  // Los encabezados de la izquierda de la wiki empiezan por "編集" o
  // acaban en "] edit".
  if (plano[i].startsWith(encabezado.slice(0, 2)) && plano[i].length < 20) {
    hasta = i;
    break;
  }
}

const seccion = plano.slice(desde, hasta);

// Nombre: una linea que parece un nombre japones y que va seguida de una
// linea con "声 - ".
//
// El seiyuu aparece de dos maneras segun como este escrito el apartado:
// en la misma linea que la voz, o en la linea siguiente. Las dos se
// tienen que cubrir, y si solo se cubre una de las dos el reparto sale a
// medias sin que se vea ningun error: parece que faltan personajes.

const RE_VOZ_EN_LINEA = /^声\s*[-‐―]\s*(.+)$/;
const RE_VOZ_SOLA = /^声\s*[-‐―]$/;

const salida = [];

for (let i = 0; i < seccion.length; i++) {
  let voz = RE_VOZ_EN_LINEA.exec(seccion[i])?.[1]?.trim();

  if (voz === undefined && RE_VOZ_SOLA.test(seccion[i])) {
    voz = seccion[i + 1]?.trim();
  }

  if (!voz) continue;

  const nombre = seccion[i - 1] ?? '';

  // Se quitan las lecturas entre parentesis y los espacios. El espacio
  // importa: hay paginas que escriben el nombre con el apellido y el
  // nombre de pila separados ("安芸 倫也") y otras que lo escriben unido
  // ("アズリール"). Sin quitarlo, la primera mitad del reparto se queda
  // fuera sin avisar.
  const limpia = nombre
    .replace(/（.*?）/g, '')
    .replace(/[ 　\s]+/g, '')
    .trim();

  // Un nombre de personaje son de uno a dieciseis caracteres, casi todos
  // kanji o kana.
  if (!/^[　-ヿ一-鿿]{1,16}$/.test(limpia)) continue;
  if (limpia.length < 1) continue;

  salida.push({ nombre: limpia, lectura: nombre, voz });
}

console.log(`${salida.length} personajes en "${encabezado}"\n`);

for (const p of salida) {
  console.log(`${p.nombre}\t${p.voz}`);
}