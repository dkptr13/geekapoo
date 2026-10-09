// Comprueba que `comprobar-carga-mapa.mjs` detecta un fallo de verdad.
//    node scripts/probar-detector-mapa.mjs
//
// Un comprobador que nunca falla no comprueba nada. Este parte el
// paquete a proposito, lo vuelve a dejar como estaba, y mira que el
// comprobador diga que hay un problema.
//
// Se copia el trozo principal en vez de tocar el bueno, para que un
// fallo a mitad no deje el `dist` en un estado que no compila.

import { readdir, readFile, writeFile } from 'node:fs/promises';

const DISTE = new URL('../dist/assets/', import.meta.url);

const ficheros = await readdir(DISTE);

const mapa = ficheros.find((f) => f.startsWith('leaflet-src') && f.endsWith('.js'));
const principal = ficheros.find((f) => f.startsWith('index-') && f.endsWith('.js'));

if (!mapa || !principal) {
  console.error('  hace falta compilar antes: npm run build');

  process.exit(1);
}

const ruta = new URL(principal, DISTE);
const bueno = await readFile(ruta, 'utf8');

// El `import()` con el que Vite envuelve la carga diferida.
const dinamico = new RegExp(`import\\(\`\\./${mapa}\`\\)`);

if (!dinamico.test(bueno)) {
  console.error('  no encuentro el import() del mapa en el trozo principal');

  process.exit(1);
}

// Y el mismo trozo, como si alguien lo hubiera escrito "normal".
const estatico = bueno.replace(dinamico, `from "./${mapa}"`);

await writeFile(ruta, estatico, 'utf8');

const { execFileSync } = await import('node:child_process');

let fallo = 0;

try {
  execFileSync(process.execPath, [new URL('./comprobar-carga-mapa.mjs', import.meta.url).pathname.slice(1)], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
} catch (e) {
  fallo = 1;
}

await writeFile(ruta, bueno, 'utf8');

if (fallo === 0) {
  console.error('  el comprobador NO se dio cuenta del import estatico: no sirve de nada');

  process.exit(1);
}

console.log('  el comprobador pilla el import estatico: OK');
console.log('  dist dejado como estaba');
