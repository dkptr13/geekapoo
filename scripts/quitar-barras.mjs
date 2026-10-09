// Quita las barras verticales que se colaron al escribir un fichero.
//    node scripts/quitar-barras.mjs <fichero> [<fichero> ...]
//
// ── POR QUE HACE FALTA ───────────────────────────────────────
//
// Al escribir ficheros largos con la herramienta de edicion, se cuelan
// barras verticales dentro de las palabras y delante de las comillas:
// "le|sabe", "|que", "de|= del cafe". Una barra vertical no significa
// nada en un fichero de datos de JavaScript, asi que quitarlas todas es
// una operacion segura.
//
// Lo importante es lo que NO hace: quitar la barra no repara la frase.
// "le|sabe" se queda en "lesabe", que sigue sin ser una palabra. Por
// eso este script solo limpia, y despues hay que leer.
//
// El texto japones se deja intacto: las barras no se han colado ahi.

import { readFile, writeFile } from 'node:fs/promises';

const ficheros = process.argv.slice(2);

if (ficheros.length === 0) {
  console.error('  uso: node scripts/quitar-barras.mjs <fichero> [<fichero> ...]');

  process.exit(1);
}

for (const f of ficheros) {
  const ruta = new URL(f, import.meta.url);
  const antes = await readFile(ruta, 'utf8');
  const despues = antes.replace(/\|/g, '');
  const quitadas = (antes.match(/\|/g) ?? []).length;

  if (quitadas === 0) {
    console.log(`  ${f}: no habia barras`);

    continue;
  }

  await writeFile(ruta, despues, 'utf8');

  console.log(`  ${f}: quitadas ${quitadas} barras`);
}

console.log('\\n  recallatorio: hay que leer el fichero, la barra no era el fallo');