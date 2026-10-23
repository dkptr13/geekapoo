// Monta los lotes de personajes y de etiquetas de un anime, a partir
// del reparto de AniList y de las descripciones propias.
//   node scripts/montar-reparto.mjs <prefijo> <id-anilist>
//
// Lo que sale de AniList (nombre, japones, voz, rol, imagen) NO se
// escribe a mano: se copia de la API. Lo que si es propio son las
// descripciones y las etiquetas, que van en ficheros de texto.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');
const lotes = join(raiz, 'scripts', 'lotes');
const entradas = join(raiz, 'scripts', 'entradas');

const [, , prefijo, idAniList] = process.argv;
if (!prefijo || !idAniList) {
  console.error('  uso: node scripts/montar-reparto.mjs <prefijo> <id-anilist>');
  process.exit(1);
}

const reparto = JSON.parse(
  readFileSync(join(entradas, 'reparto.json'), 'utf8'),
);
const lista = reparto[idAniList];
if (!lista) {
  console.error(`  el reparto ${idAniList} no esta en reparto.json`);
  process.exit(1);
}

const porNombre = new Map(lista.map((c) => [c.nombre, c]));

// ── Las descripciones propias ───────────────────────────
const descripciones = new Map();
for (const linea of readFileSync(join(entradas, `${prefijo}-personajes.txt`), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)) {
  const corte = linea.indexOf('|');
  if (corte < 0) {
    console.error(`  linea sin separador: ${linea.slice(0, 40)}`);
    process.exit(1);
  }
  descripciones.set(linea.slice(0, corte), linea.slice(corte + 1));
}

// ── Las etiquetas propias ───────────────────────────────
const etiquetas = new Map();
for (const linea of readFileSync(join(entradas, `${prefijo}-tags.txt`), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)) {
  const corte = linea.indexOf('|');
  const nombre = linea.slice(0, corte);
  const listaEtiquetas = linea
    .slice(corte + 1)
    .split(';')
    .map((e) => e.trim())
    .filter(Boolean);
  if (listaEtiquetas.some((e) => e.length > 40)) {
    console.error(`  etiqueta de mas de 40 caracteres en ${nombre}`);
    process.exit(1);
  }
  etiquetas.set(nombre, listaEtiquetas);
}

// ── Se comprueba que los tres sitios cuadren ───────────
const nombres = new Set([...descripciones.keys(), ...etiquetas.keys()]);
for (const nombre of nombres) {
  if (!descripciones.has(nombre)) {
    console.error(`  ${nombre}: tiene etiquetas pero no descripcion`);
    process.exit(1);
  }
  if (!etiquetas.has(nombre)) {
    console.error(`  ${nombre}: tiene descripcion pero no etiquetas`);
    process.exit(1);
  }
  if (!porNombre.has(nombre)) {
    console.error(`  ${nombre}: no esta en el reparto de AniList`);
    process.exit(1);
  }
}

// ── El lote de personajes ───────────────────────────────
mkdirSync(join(lotes, prefijo), { recursive: true });
const filas = [];
for (const nombre of nombres) {
  const c = porNombre.get(nombre);
  const desc = descripciones.get(nombre);
  // Un `|` en la descripcion romperia el formato del lote.
  if (desc.includes('|')) {
    console.error(`  ${nombre}: la descripcion tiene un pipe`);
    process.exit(1);
  }
  filas.push([nombre, '1', c.rol, c.ja, c.voz, desc]);
}

writeFileSync(
  join(lotes, prefijo, '1.txt'),
  filas.map((f) => f.join('|')).join('\n') + '\n',
  'utf8',
);
console.log(`  lotes/${prefijo}/1.txt: ${filas.length} personajes`);

// ── El fichero de etiquetas ─────────────────────────────
//
// El formato que espera `generar-tags.mjs` es una linea por
// personaje con las etiquetas separadas por barras: cada
// etiqueta va en su propio campo, porque el generador las
// comprueba una a una.
const lineasTags = [...nombres].map(
  (n) => [n, ...etiquetas.get(n)].join('|'),
);
writeFileSync(
  join(lotes, `${prefijo}-tags.txt`),
  lineasTags.join('\n') + '\n',
  'utf8',
);
console.log(`  lotes/${prefijo}-tags.txt: ${lineasTags.length} etiquetas`);
