// Comprueba que una imagen no esta puesta en dos capitulos.
//    node scripts/ver-miniaturas-repetidas.mjs <animeId> | --full
//
// ── POR QUE HACE FALTA ─────────────────────────────────────────────
//
// Una misma foto en dos capitulos es siempre un error: o la imagen esta
// mal puesta en uno de los dos, o el emparejador ha encontrado el mismo
// capitulo dos veces.
//
// El caso de Ataque a los Titanes lo hace facil. TVDB repite la lista de
// capitulos de la primera parte en todas las demas, con los mismos
// titulos. Un emparejador que fuera solo por titulo pondria la imagen del
// capitulo 1 de la primera parte en los capitulos 1 de todas las demas, y
// las imagenes cargarian, se verian bien y estarian en el sitio
// equivocado. Es el fallo que no se ve a simple vista.
//
// Por eso, aparte de mirar si la URL responde —que `ver-miniaturas-
// vivas.mjs` hace— se mira si la misma foto esta en mas de un capitulo.
//
// ── QUE NO COMPRUEBA ────────────────────────────────────────────────
//
// Que la imagen sea del capitulo correcto. Eso no se puede deducir de la
// URL: hay que mirarlas. Lo que si hace es acotar el trabajo, porque si
// no hay repeticiones, cada imagen esta puesta una sola vez y solo hay
// que revisar las que interesen.

import { coleccion, str, num } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const animeId = process.argv[2];
const full = process.argv.includes('--full');

if (!animeId && !full) {
  console.error('  uso: node scripts/ver-miniaturas-repetidas.mjs <animeId> | --full');
  console.error('  Sin --full no se lee la colección entera.');
  process.exit(1);
}

const mios = animeId
  ? await leerPorCampo({ coleccion: 'episodes', campo: 'animeId', valor: animeId })
  : await coleccion('episodes');

// Donde esta cada URL.
const donde = new Map();

for (const c of mios) {
  const url = str(c.f, 'thumbnailUrl');

  if (!url) continue;

  const lista = donde.get(url) ?? [];

  const temporada = (str(c.f, 'seasonId') ?? '').match(/-s(\d+)$/)?.[1] ?? '?';

  lista.push(`T${temporada} ${num(c.f, 'number')}`);

  donde.set(url, lista);
}

const repetidas = [...donde.entries()].filter(([, lista]) => lista.length > 1);

console.log(`\n${mios.length} capitulos, ${donde.size} imagenes distintas`);

if (!repetidas.length) {
  console.log('ninguna imagen esta en dos capitulos');

  process.exit(0);
}

console.log(`${repetidas.length} imagenes repetidas:\n`);

for (const [url, lista] of repetidas) {
  console.log(`  ${lista.join(', ')}\n    ${url}`);
}

process.exit(1);