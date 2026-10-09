// Comprueba que Leaflet NO se carga al entrar en la web.
//    node scripts/comprobar-carga-mapa.mjs
//
// El mapa se importa con `import()` dentro del efecto que lo crea, con
// lo que Vite lo mete en un trozo aparte y solo se descarga cuando
// alguien abre el selector de ubicación. Eso son 43 KB comprimidos que
// el 99% de las visitas no necesita.
//
// Esto lo mira en lo construido, y no en el código fuente, porque lo
// que importa es lo que descarga el navegador: un `import()` escrito en
// un fichero que otro importa estáticamente sigue siendo carga
// diferida, pero un `import()` normal dentro del mismo fichero puede
// acabar en el trozo principal si las condiciones del empaquetador no
// se cumplen.
//
 // La diferencia entre las dos cosas es 43 KB en cada visita que no
 // comparte el mapa, y no se ve leyendo el código.

import { readdir, readFile } from 'node:fs/promises';

const DISTE = new URL('../dist/assets/', import.meta.url);

const ficheros = await readdir(DISTE);

const leaflet = ficheros.filter((f) => f.startsWith('leaflet-src') && f.endsWith('.js'));
const principales = ficheros.filter((f) => f.startsWith('index-') && f.endsWith('.js'));

if (leaflet.length === 0) {
  console.error('  no hay ningun trozo de leaflet en dist: el mapa no se esta empaquetando');

  process.exit(1);
}

if (principales.length === 0) {
  console.error('  no encuentro el trozo principal de la web');

  process.exit(1);
}

//   ESTATICA   import { x } from "./trozo.js"    -> se baja siempre
//   DINAMICA   await import("./trozo.js")        -> se baja al pedirlo
//
// La diferencia es un parentesis, y por eso hay que mirar el
// empaquetado y no el fuente: si alguien cambia el `import()` por un
// `import` normal para "simplificar", el mapa pasa a estar siempre en el
// bundle principal, 43 KB en cada visita de la web, y no falla nada ni
// se nota.
//
// Esto es lo que se comprueba con lo construido:

let estatico = false;
let dinamico = false;
const citados = [];

// Las dos formas de citar un trozo en JavaScript:
//
//   ESTATICA   import { x } from "./trozo.js"    -> se baja siempre
//   DINAMICA   await import("./trozo.js")        -> se baja al pedirlo
//
// La diferencia es un parentesis, y por eso hay que mirar el
// empaquetado y no el fuente: si alguien cambia el `import()` por un
// `import` normal para "simplificar", el mapa pasa a estar siempre en el
// bundle principal, 43 KB en cada visita de la web, y no falla nada ni
// se nota.
for (const f of principales) {
  const texto = await readFile(new URL(f, DISTE), 'utf8');

  for (const trozo of leaflet) {
    if (!texto.includes(trozo)) continue;

    citados.push(trozo);

    // El nombre del trozo puede ir entre comillas simples, dobles o
    // comillas invertidas: Vite lo escribe con estas ultimas cuando lo
    // envuelve en su ayudante de precarga.
    const nombre = trozo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cita = ['`', '"', "'"].map((c) => `[${c}]\\.?/?${nombre}[${c}]`).join('|');

    if (new RegExp(`\\bfrom\\s*(?:${cita})`).test(texto)) estatico = true;

    if (new RegExp(`\\bimport\\s*\\(\\s*(?:${cita})`).test(texto)) dinamico = true;
  }
}

console.log(`  trozo del mapa: ${leaflet.join(', ')}`);
console.log(`  citado por el principal: ${citados.length > 0 ? citados.join(', ') : 'nada'}`);

if (estatico) {
  console.error('  el mapa se carga SIEMPRE: hay un import estatico desde el trozo principal');

  process.exit(1);
}

if (!dinamico) {
  console.error('  el mapa no se cita de ninguna manera: puede que no se este usando');

  process.exit(1);
}

console.log('  el mapa se carga solo al abrir el selector: OK');
