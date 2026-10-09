// Las plataformas de streaming declaradas en cada fichero de datos.
//    node scripts/listar-plataformas.mjs
//
// Saca la lista de todos animes en uno, porque lo que hay que revisar
// es la lista completa, no un anime suelto: si una de las trece dice
// Crunchyroll y otra no lo dice, hay que saber por que antes de
// corregir ninguna.

import { readdir } from 'node:fs/promises';

const BASE = new URL('./datos/', import.meta.url);

const ficheros = (await readdir(BASE))
  .filter((n) => n.endsWith('-meta.mjs'))
  .map((n) => n.replace('-meta.mjs', ''))
  .sort();

for (const prefijo of ficheros) {
  const mod = await import(new URL(`${prefijo}-meta.mjs`, BASE));
  const lista = mod.STREAMING ?? [];

  console.log(`  ${prefijo}`);

  if (lista.length === 0) {
    console.log('      (sin lista)');

    continue;
  }

  for (const p of lista) {
    console.log(`      ${String(p.name).padEnd(20)} ${p.url}   ${p.badgeColor ?? '(sin color)'}`);
  }
}