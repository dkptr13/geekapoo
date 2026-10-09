// Junta los lotes de capitulos en el fichero de datos.
//    node scripts/generar-capitulos.mjs <prefijo>
//
// El hermano de `generar-personajes.mjs` para el otro formato de
// lote. Los capitulos van `numero|titulo|japones|fecha|nota|desc` y los
// personajes `nombre|temporadas|rol|japones|voz|desc`, asi que los dos
// necesitan su generador.
//
// La cabecera de comento va en `lotes/cabecera-<prefijo>-t1.txt`, para
// que el porque de cada decision de dato viaje con el fichero y no se
// quede en un fichero suelto que nadie lee.
//
// ── POR QUE LOTE Y NO FICHERO ──────────────────────────────────
//
// Por lo mismo que el de los personajes: escribir cuarenta lineas de
// prosa de una vez mete basura dentro de ellas, y con seis se puede
// arreglar a mano. Un lote danado se reescribe entero, que son tres
// lineas.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';

const prefijo = process.argv[2];

if (!prefijo) {
  console.error('  uso: node scripts/generar-capitulos.mjs <prefijo>');

  process.exit(1);
}

// La carpeta de los lotes lleva `-t1` para que no choque con la del
// reparto: los dos generadores leen de `lotes/<algo>/` y este anime
// tiene las dos cosas, los capitulos y los personajes.
const CARPETA = new URL(`lotes/${prefijo}-t1/`, import.meta.url);

let cabecera;

try {
  cabecera = (
    await readFile(new URL(`lotes/cabecera-${prefijo}-t1.txt`, import.meta.url), 'utf8')
  ).replace(/\n+$/, '\n');
} catch (e) {
  console.error(`  no se lee lotes/cabecera-${prefijo}-t1.txt: ${e.message}`);

  process.exit(1);
}

const nombres = (await readdir(CARPETA)).filter((n) => n.endsWith('.txt')).sort();

if (nombres.length === 0) {
  console.error(`  lotes/${prefijo}/ esta vacia`);

  process.exit(1);
}

const filas = [];
const vistos = new Set();

for (const nombre of nombres) {
  const lineas = (await readFile(new URL(nombre, CARPETA), 'utf8')).split('\n');

  for (const [i, linea] of lineas.entries()) {
    if (linea.trim() === '') continue;

    const campos = linea.split('|');

    if (campos.length !== 6) {
      console.error(`  ${nombre} L${i + 1}: ${campos.length} campos, se esperaban 6`);
      console.error(`  ${JSON.stringify(linea.slice(0, 90))}`);

      process.exit(1);
    }

    const [numero, titulo, japones, fecha, nota, desc] = campos;
    const n = Number(numero);

    if (!Number.isFinite(n)) {
      console.error(`  ${nombre} L${i + 1}: el numero "${numero}" no es un numero`);

      process.exit(1);
    }

    if (vistos.has(n)) {
      console.error(`  ${nombre} L${i + 1}: el capitulo ${n} sale dos veces`);

      process.exit(1);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      console.error(`  ${nombre} L${i + 1}: la fecha "${fecha}" no es AAAA-MM-DD`);

      process.exit(1);
    }

    if (!/[\u3040-\u30ff\u4e00-\u9fff]/.test(japones)) {
      console.error(`  ${nombre} L${i + 1}: "${japones}" no tiene kana ni kanji`);

      process.exit(1);
    }

    vistos.add(n);
    filas.push([n, titulo, japones, fecha, Number(nota), desc]);
  }
}

filas.sort((a, b) => a[0] - b[0]);

// Que los enteros del 1 al ultimo esten todos, como pide
// `comprobar-datos.mjs`. Aqui se avisa antes de escribir nada, que es
// mas barato que fallar despues.
const enteros = filas.filter((f) => Number.isInteger(f[0])).map((f) => f[0]);
const ultimo = Math.max(...enteros);
const faltan = [];

for (let i = 1; i <= ultimo; i++) if (!enteros.includes(i)) faltan.push(i);

if (faltan.length) {
  console.error(`  faltan los capitulos: ${faltan.join(', ')}`);

  process.exit(1);
}

const cuerpo = filas
  .map(
    (f) =>
      `  [${f[0]}, ${JSON.stringify(f[1])}, ${JSON.stringify(f[2])}, ${JSON.stringify(f[3])}, ${f[4]},\n` +
      `   ${JSON.stringify(f[5])}],\n`,
  )
  .join('\n');

await mkdir(new URL('datos/', import.meta.url), { recursive: true });
await writeFile(new URL(`datos/${prefijo}-t1.mjs`, import.meta.url), `${cabecera}\nexport const T1 = [\n${cuerpo}];\n`, 'utf8');

console.log(`  ${filas.length} capitulos de ${nombres.length} lotes`);
console.log(`  escrito datos/${prefijo}-t1.mjs`);

const cortas = filas.filter((f) => f[5].length < 40);
const largas = filas.filter((f) => f[5].length > 400);
const sinNota = filas.filter((f) => !(f[4] > 0));

if (cortas.length) console.log(`  DESCRIPCION CORTA: ${cortas.map((f) => `${f[0]} (${f[5].length})`).join(', ')}`);
if (largas.length) console.log(`  DESCRIPCION LARGA: ${largas.map((f) => `${f[0]} (${f[5].length})`).join(', ')}`);
if (sinNota.length) console.log(`  SIN NOTA: ${sinNota.map((f) => f[0]).join(', ')}`);

if (!cortas.length && !largas.length && !sinNota.length) console.log('  todas con nota y descripcion de 40 a 400 caracteres');