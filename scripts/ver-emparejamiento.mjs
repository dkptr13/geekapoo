// Comprueba que las imagenes de AniList esten bien emparejadas.
//
//    node scripts/ver-emparejamiento.mjs <animeId>
//    node scripts/ver-emparejamiento.mjs --full
//
// ── POR QUE BASTA CON BUSCAR URL REPETIDAS ────────────────────────
//
// Cada personaje de AniList tiene su propia URL, con su identificador
// unico dentro. Si dos personajes de nuestro catalogo apuntan a la
// misma, es que uno se ha quedado con la imagen del otro.
//
// Es el mismo fallo que se coló la primera vez, con Aqua y Ruby
// Hoshino, y no saltaba ningun error: se escribia la URL equivocada y
// todo parecian correcto. Esto lo pilla solo.
//
// ── LA SEGUNDA COMPROBACION ────────────────────────────────────────
//
// Que la URL responda. Una URL de AniList puede desaparecer si borran
// la ficha, y entonces la imagen sale rota sin avisar.

import { coleccion, str } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const args = process.argv.slice(2);
const full = args.includes('--full');
const filtro = args.find((arg) => !arg.startsWith('--'));

if (!filtro && !full) {
  console.error('  uso: node scripts/ver-emparejamiento.mjs <animeId> | --full');
  process.exit(1);
}

const chars = filtro
  ? await leerPorCampo({
      coleccion: 'characters',
      campo: 'animeId',
      valor: filtro,
      campos: ['animeId', 'name', 'imageUrl'],
    })
  : await coleccion('characters');

const conImagen = chars.filter((c) => str(c.f, 'animeId') && str(c.f, 'imageUrl'));

console.log(
  `${conImagen.length} personajes con imagen` + (filtro ? ` (filtro: ${filtro})` : ''),
);

// ── URL repetidas ──────────────────────────────────────────────────

const porUrl = new Map();

for (const c of conImagen) {
  if (filtro && str(c.f, 'animeId') !== filtro) continue;

  const u = str(c.f, 'imageUrl');

  porUrl.set(u, [...(porUrl.get(u) ?? []), c]);
}

const repetidas = [...porUrl].filter(([, cs]) => cs.length > 1);

if (!repetidas.length) {
  console.log('\nninguna URL repetida');
} else {
  console.log(`\n${repetidas.length} URLS REPETIDAS:`);

  for (const [u, cs] of repetidas) {
    console.log(`\n  ...${u.slice(-42)}`);

    for (const c of cs) {
      console.log(`    ${str(c.f, 'animeId')} / ${str(c.f, 'name')}`);
    }
  }
}

// ── URLs que no responden ──────────────────────────────────────────

console.log('\ncomprobando que las URLs respondan...');

const estado = new Map();

for (const [u, cs] of porUrl) {
  try {
    const r = await fetch(u, { method: 'HEAD' });
    estado.set(u, r.ok ? null : r.status);
  } catch {
    estado.set(u, 'no contesta');
  }
}

let malas = 0;

for (const [u, error] of estado) {
  if (!error) continue;

  malas++;
  console.log(`  ${error}: ${porUrl.get(u).map((c) => str(c.f, 'name')).join(', ')}`);
}

console.log(malas ? `${malas} URLs rotas` : 'todas las URLs responden');