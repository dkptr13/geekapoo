// Prueba de `comprobar-texto.mjs`: se inyecta texto roto a proposito en
// una copia de un fichero de datos y se mira si lo encuentra.
//    node scripts/probar-texto-roto.mjs
//
// Sin esto, `comprobar-texto.mjs` es un script que no se ha probado nunca
// contra el fallo que dice detectar, que es el unico modo de saber si
// sirve para algo.
//
// Los casos son reales, de `tor-t1.mjs`: habia ideogramas metidos en
// mitad de los resumenes y un punto japones pegado a una palabra. El
// cuarto caso es una palabra inglesa pegada, que el script NO busca, y se
// prueba justamente para que quede escrito que no lo hace.
//
// Las frases donde se inyecta se buscan por un trozo corto que
//Intersection existe en el fichero, y se comprueba antes: si alguien
//reescribe el fichero de datos, la prueba avisa en vez de dar un FALLA que
// no significa nada.

import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const ORIGINAL = 'scripts/datos/tor-t1.mjs';

// [nombre, frase donde se inyecta, lo que se pone en su lugar, debe saltar]
const CASOS = [
  ['ideograma pegado', 'Minori en el curro', 'Minori 資產 en el curro', true],
  ['ideograma suelto', 'la casa de campo es para cuatro', 'la casa de campo 資產 es para cuatro', true],
['punto japones', 'el plan se tuerce', 'el plan se tuerce。Dicho', true],
  ['palabra pegada', 'la playa', 'la queibi playa', false],
];
const original = await readFile(ORIGINAL, 'utf8');

const AUSENTES = CASOS.filter(([, frase]) => !original.includes(frase));

if (AUSENTES.length) {
  console.log(
    `el fichero original ya no tiene estas frases: ` +
      AUSENTES.map(([, f]) => `"${f}"`).join(', '),
  );

  console.log('actualiza las frases de CASOS con las que haya ahora');

  process.exit(1);
}

const rota = 'C:/Users/Oscar/AppData/Local/Temp/opencode/texto-roto.mjs';

let fallos = 0;

for (const [nombre, frase, inyeccion, debeSaltar] of CASOS) {
  // La frase se sustituye una sola vez: con `replace` sin limite el
  // trocido sale en todos los sitios donde estaba.
  await writeFile(rota, original.replace(frase, inyeccion), 'utf8');

  let salida = '';

  try {
    salida = execFileSync('node', ['scripts/comprobar-texto.mjs', rota], {
      encoding: 'utf8',
    });
  } catch (e) {
    // El script sale con codigo 1 cuando encuentra algo, que aqui es lo
    // que se quiere que pase.
    salida = e.stdout ?? '';
  }

  const salto = /ideograma|punto japones/.test(salida);

  const bien = salto === debeSaltar;

  console.log(
    `${bien ? 'OK   ' : 'FALLA'}  ${nombre.padEnd(18)} ` +
      `${debeSaltar ? 'debe saltar' : 'no debe saltar'}`,
  );

  if (!bien) {
    console.log(`        ${salida.trim().replace(/\n/g, ' | ').slice(0, 150)}`);

    fallos++;
  }
}

await writeFile(rota, original, 'utf8');

console.log(fallos ? `\n${fallos} casos fallan` : '\ntodos los casos se comportan como deben');