import { readFile } from 'node:fs/promises';

// Busca texto corrupto en los ficheros de datos.
//    node scripts/comprobar-texto.mjs <fichero> ...
//
// ── QUE BUSCA ──────────────────────────────────────────────────────
//
// Los ficheros se escriben a traves de la consola, y a veces el terminal
// devuelve el texto con trozos de otro idioma pegados dentro. No es un
// error de codificacion: los caracteres son validos y el fichero pasa la
// comprobacion de sintaxis. Es texto que no estaba.
//
// En los ficheros de Toradora han salido:
//
//   · Ideogramas sueltos dentro de una frase: "se queda a帮她, casi a
//     solas", "sube al登山 donde se pierde Kitagawa".
//
//   · Un punto japones pegado a una palabra: "que ha。Dicho el
//     capitulo".
//
// ── POR QUE NO SE BUSCA "UNA PALABRA INGLESA PEGADA" ───────────────
//
// Es la comprobacion que mas haria falta y la que no se puede hacer. Se
// probaron cuatro reglas y las cuatro dan falsos positivos:
//
//   · Pegada a cualquier letra: salta con las palabras holandesas y el
//     portugues de Brasil que hay en el catalogo, que van juntos, y con
//     los nombres propios del generational.
//
//   · Al principio de otra palabra: salta con las espanolas que empiezan
//     como una inglesa. Hay nueve ficheros con "mejor" y "notas".
//
//   · Al final de otra palabra: igual, con "mejor".
//
//   · En mitad de otra palabra: es la que menos da, y aun asi salta con
//     "Sheele", "Shimamura" o "idiosincratas", que son nombres propios
//     y palabras griegas.
//
// Las palabras inglesas sueltas tampoco se buscan: hay cientos y todas
// son correctas. Los capitulos de Tokyo Revengers se llaman "Turn
// around" y "Run out", los de Evangelion "You Are Not", los de Saekano
// "How to Raise a Boring Girlfriend", y hay seiyuu que se llaman Run o
// Ran. Todo eso sale en treinta y seis ficheros y no es un error.
//
// ── LO QUE SI QUEDA ────────────────────────────────────────────────
//
// Los ideogramas, que es donde ha salido el texto roto de verdad, y el
// punto japones pegado a una palabra. Para el resto esta `node --check`,
// que avisa de los ficheros dejados a medias, y la revision a mano de
// los resumenes nuevos.

// En japones ni los ideogramas ni la puntuacion se separan de lo que van
// delante: "その。こう". En espanol siempre hay espacio. Un ideograma
// pegado a una palabra latina dentro de un texto largo es texto roto.
//
// El japones legitimo de los capitulos esta en el campo del titulo
// japones, que es un entrecomillado corto. Solo se mira dentro de las
// cadenas de 80 caracteres o mas, que son los resumenes.
const IDEOGRAMA_PEGADO = /[一-鿿][\s]*[A-Za-z]{3,}/g;

// Un bloque de tres ideogramas separados por huecos no es japones, ni es
// chino, ni es nada: sale asi cuando el texto se rompe.
const IDEOGRAMA_CON_HUECO = /[一-鿿](?:\s+[一-鿿]){2,}/g;

// Un punto japones justo antes de una palabra, sin espacio. En espanol
// esto no existe: despues de un punto va un espacio.
const PUNTO_JAPONES = /[。．，、？！][A-Za-z]{3,}/g;

/**
 * Los avisos de un texto.
 *
 * @param {string} texto
 * @returns {string[]}
 */
function avisosDe(texto) {
  const salida = [];
  const vistos = new Set();

  const anotar = (a) => {
    if (vistos.has(a)) return;

    vistos.add(a);

    salida.push(a);
  };

  texto.split('\n').forEach((linea, i) => {
    const n = i + 1;

    for (const f of linea.matchAll(/'([^']{80,})'/g)) {
      const largo = f[1];

      if (/[一-鿿]/.test(largo)) {
        anotar(`linea ${n}  ideograma en un texto largo: ${largo.slice(0, 70)}`);
      }

      for (const p of largo.matchAll(PUNTO_JAPONES)) {
        anotar(`linea ${n}  punto japones pegado: ${p[0]}`);
      }
    }

    for (const f of linea.matchAll(IDEOGRAMA_CON_HUECO)) {
      anotar(`linea ${n}  ideograma con hueco entre medias: ${f[0]}`);
    }
  });

  return salida;
}

let conAviso = 0;

for (const nombre of process.argv.slice(2)) {
  const avisos = avisosDe(await readFile(nombre, 'utf8'));

  if (!avisos.length) continue;

  conAviso++;

  console.log(`\n${nombre}`);

  for (const a of avisos) console.log(`  ${a}`);
}

console.log(conAviso ? `\n${conAviso} ficheros con texto raro` : '\nningun fichero con texto raro');

process.exit(conAviso ? 1 : 0);