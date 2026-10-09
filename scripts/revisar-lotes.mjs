// Revisa los ficheros de texto que se van a convertir en datos.
//    node scripts/revisar-lotes.mjs <carpeta> [<carpeta> ...]
//
// ── QUE COMPRUEBA ────────────────────────────────────────────
//
// Que no haya en ningun sitio caracteres de otros alfabetos, ni barras
// verticales, ni el caracter de reemplazo. Los tres aparecen cuando un
// texto se estropea al escribirlo, y los tres se ven a simple vista en
// el fichero entero pero se esconden si solo se lee lo que se ha
// escrito.
//
// ── QUE NO COMPRUEBA ──────────────────────────────────────────
//
// Que las frases signifiquen algo. Aqui no hay forma de saberlo. Un
// texto puede no tener ni un solo caracter raro y seguir diciendo
// "leRespeta lo que el答应". Eso solo lo pilla quien lo lee.

import { readdir, readFile } from 'node:fs/promises';

const carpetas = process.argv.slice(2);

if (carpetas.length === 0) {
  console.error('  uso: node scripts/revisar-lotes.mjs <carpeta> [<carpeta> ...]');

  process.exit(1);
}

/** Otros alfabetos y el caracter de reemplazo. */
const RARO = /[\u0400-\u04FF\u0370-\u03FF\uFFFD]/u;

let problemas = 0;

for (const carpeta of carpetas) {
  const base = new URL(`${carpeta}/`, import.meta.url);
  const nombres = (await readdir(base)).filter((n) => n.endsWith('.txt')).sort();

  for (const nombre of nombres) {
    const lineas = (await readFile(new URL(nombre, base), 'utf8')).split('\n');

    lineas.forEach((linea, i) => {
      if (linea.trim() === '') return;

      // El japones es legitimo, asi que solo se mira el caracter de
      // reemplazo y los alfabetos cirilico y griego, que no tienen por
      // que estar en ningun idioma.
      const raro = linea.match(RARO);

      if (raro) {
        console.log(`  ${carpeta}/${nombre} L${i + 1}: "${raro[0]}"  ->  ${linea.slice(0, 70)}`);

        problemas++;
      }

      const campos = linea.split('|');

      if (campos.length !== 6) {
        console.log(`  ${carpeta}/${nombre} L${i + 1}: ${campos.length} separadores, se esperaba 6`);
        console.log(`      ${linea.slice(0, 70)}`);

        problemas++;

        return;
      }

      // El japones solo puede estar en SU campo. Y donde esta depende
      // del formato de la linea, que son dos:
      //
      //   personaje  nombre|temporadas|rol|japones|voz|desc   -> el 3
      //   capitulo   numero|titulo|japones|fecha|nota|desc    -> el 2
      //
      // Se distinguen por el primer campo: el del capitulo es un
      // numero. Antes se miraba siempre el 3 y el revisor se quejaba
      // de que "2016年のきみたちへ" no tenia kana, porque estaba
      // mirando la fecha de la linea de al lado.
      const esCapitulo = /^\d/.test(campos[0]);
      const dondeVaElJapones = esCapitulo ? 2 : 3;
      const desde = esCapitulo ? 4 : 4;

      const fueraDeSitio = campos
        .slice(desde)
        .join('')
        .match(/[\u3040-\u30ff\u4e00-\u9fff\u3400-\u4dbf]/gu);

      if (fueraDeSitio) {
        console.log(
          `  ${carpeta}/${nombre} L${i + 1} (${campos[0]}): japones donde no toca -> "${fueraDeSitio.join('')}"`,
        );
        console.log(`      ${campos.slice(desde).join(' | ').slice(0, 70)}`);

        problemas++;
      }

      // El campo del japones tiene que llevar kana o kanji de verdad.
      // Un campo con texto latino es un dato de otra cosa, y es lo que
      // pasa cuando se copia una fila del fichero equivocado.
      const japones = campos[dondeVaElJapones];

      if (!japones || !/[\u3040-\u30ff\u4e00-\u9fff]/.test(japones)) {
        console.log(
          `  ${carpeta}/${nombre} L${i + 1} (${campos[0]}): el campo ${dondeVaElJapones} ` +
            `no tiene kana ni kanji: "${japones}"`,
        );

        problemas++;
      }
    });
  }

  console.log(`  ${carpeta}: ${nombres.length} ficheros revisados`);
}

console.log(
  problemas === 0
    ? '\\n  sin caracteres raros y con los seis separadores en cada linea'
    : `\\n  ${problemas} lineas con problemas`,
);