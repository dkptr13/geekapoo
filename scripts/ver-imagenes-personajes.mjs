// Comprueba que las imagenes de los personajes cargan.
//    node scripts/ver-imagenes-personajes.mjs
//
// `ver-miniaturas-vivas.mjs` hace lo mismo con las miniaturas de capitulo.
// Este es el equivalente para los personajes, que van a otra parte: son
// las que se ven en las fichas y en el reparto.
//
// Que la URL responda 200 no dice que la foto sea del personaje
// correcto. Eso se comprueba mirando, con `bajar-personajes.mjs`. Aqui
// solo se mira que no haya enlaces rotos, que es lo que se rompe por
// culpa propia.

import { coleccion, str } from './firestore-rest.mjs';

const personajes = await coleccion('characters');

const conImagen = personajes.filter((c) => str(c.f, 'imageUrl'));

console.log(`\n${personajes.length} personajes, ${conImagen.length} con imagen`);

if (!conImagen.length) {
  console.log('ninguno tiene imagen');

  process.exit(0);
}

// ── Comprobar ───────────────────────────────────────────────────────

const CONCURRENCIA = 12;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

let hechos = 0;
let rotas = 0;
const lentas = [];

async function comprobar(c) {
  const url = str(c.f, 'imageUrl');

  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow' });

    const t0 = Date.now();

    // No hace falta bajar la imagen entera: con los cabeceros ya se sabe
    // si responde. Con cuerpo entero serian cuatrocientas descargas por
    // cada vez que se ejecuta esto.
    await r.body?.cancel();

    const ms = Date.now() - t0;

    hechos++;

    if (!r.ok) {
      rotas++;

      console.log(`  ${r.status}  ${String(str(c.f, 'animeId')).slice(0, 30).padEnd(32)}${str(c.f, 'name')}`);
    } else if (ms > 3000) {
      lentas.push(`${ms} ms  ${str(c.f, 'animeId')} / ${str(c.f, 'name')}`);
    }
  } catch (e) {
    rotas++;

    console.log(`  ERROR  ${str(c.f, 'name')}  ${String(e.message).slice(0, 50)}`);
  }
}

const cola = [...conImagen];

await Promise.all(
  Array.from({ length: CONCURRENCIA }, async () => {
    while (cola.length) {
      const c = cola.shift();

      if (c) await comprobar(c);
    }
  }),
);

console.log(`\nresponden: ${hechos - rotas}/${hechos}`);
console.log(`rotas:     ${rotas}`);

if (lentas.length) {
  console.log(`\nLENTAS:`);

  for (const l of lentas) console.log(`  ${l}`);
}

process.exit(rotas ? 1 : 0);