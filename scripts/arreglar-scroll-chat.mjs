// Deja el nombre del estado del scroll como una sola palabra.
//
// El nombreSerializer de este entorno cambia `arriba` por `arrriba`
// al escribir, y como el fichero ya tenía `arriba` en un comentario
// de otra cosa, el renombrado a ciegas lo alcanzó too.
//
//   node scripts/arreglar-scroll-chat.mjs

import { readFile, writeFile } from 'node:fs/promises';

const FICHERO = 'src/components/chat/ChatView.tsx';

let texto = await readFile(FICHERO, 'utf8');
const lineas = texto.split('\n');

const antes = lineas.slice();

// 1. Los comentarios que el renombrado a ciegas tocaron y no eran
//    sobre el scroll. Se dejan como estaban.
const REGLAS = [
  [' * Si el usuario está leyendo hacia lejosDelFinal.', ' * Si el usuario está leyendo hacia arriba.'],
  [
    ' * "estoy lejosDelFinal" y dejaría de pegar los mensajes nuevos, que es',
    ' * "estoy arriba" y dejaría de pegar los mensajes nuevos, que es',
  ],
  ['    // se leía como "lejosDelFinal" sin serlo.', '    // se leía como "arriba" sin serlo.'],
  ['Espejo del de lejosDelFinal: en el móvil se esconde mientras', 'Espejo del de arriba: en el móvil se esconde mientras'],
  [
    '`max-h`, y el `<a>` de lejosDelFinal la abre a tamaño',
    '`max-h`, y el `<a>` de arriba la abre a tamaño',
  ],
];

for (let i = 0; i < lineas.length; i += 1) {
  for (const [malo, bueno] of REGLAS) {
    if (lineas[i].includes(malo)) lineas[i] = lineas[i].replace(malo, bueno);
  }
}

// 2. `setArriba` se quedó a medias del renombrado. Vuelve a ser
//    `setLejosDelFinal`, que es lo que pide el estado de al lado.
for (let i = 0; i < lineas.length; i += 1) {
  if (/\bsetArriba\b/.test(lineas[i])) {
    lineas[i] = lineas[i].replace(/\bsetArriba\b/g, 'setLejosDelFinal');
  }
}

texto = lineas.join('\n');
await writeFile(FICHERO, texto, 'utf8');

const despues = texto.split('\n');
const cambios = antes.filter((l, i) => l !== despues[i]).length;

console.log(`${cambios} lineas corregidas`);

const sueltas = despues.filter((l) => /lejosDelFinal/.test(l) && /espejo|<a>|móvil|leía como/.test(l));

if (sueltas.length) {
  console.log('QUEDAN comentarios tocados:');
  sueltas.forEach((l) => console.log(`  ${l.trim()}`));
  process.exit(1);
}

console.log('sin comentarios ajenos tocados');
