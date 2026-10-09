// El nombre y la imagen de un capitulo suelto de TVDB, por su id.
//    $env:TVDB_KEY='...'
//    node scripts/tvdb-capitulo.mjs <id-capitulo> ...
//
// ── PARA QUE HACE FALTA ───────────────────────────────────────
//
// El emparejador de miniaturas empareja por el titulo japones, y a
// veces el titulo guardado y el de TVDB no son el mismo texto aunque
// sean el mismo capitulo. En Chainsaw Man pasa dos veces:
//
//   · El capitulo 5. El fichero tiene 銃の悪神 y TVDB tiene 銃の悪魔.
//     La wikipedia en japones pone 銃の悪神, asi que el que esta mal
//     es TVDB. Con los dos ultimos caracteres cambiados no se puede
//     emparejar, asi que la miniatura se pone a mano.
//
//   · La pelicula. El fichero tiene 劇場版 チェンソーマン レゼ篇 y TVDB
//     se lo guarda como チェンソーマン レゼ篇, sin el "劇場版" de
//     delante. Es el mismo capitulo.
//
// Para esos casos hace falta poder mirar una imagen concreta de TVDB
// por su id y ver de verdad que nombre tiene, en vez de suponerlo por
// el numero de capitulo: TVDB tiene capitulos de recap y de especiales
// intercalados, asi que "el siguiente" no es el que se cree.

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');

  process.exit(1);
}

const ids = process.argv.slice(2).filter((a) => /^\d+$/.test(a));

if (ids.length === 0) {
  console.error('  uso: node scripts/tvdb-capitulo.mjs <id-capitulo> ...');

  process.exit(1);
}

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: clave }),
});

if (!login.ok) {
  console.error(`  TVDB no acepta la clave: ${login.status}`);

  process.exit(1);
}

const { data: { token } } = await login.json();

const CABECERAS = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

for (const id of ids) {
  const r = await fetch(`https://api4.thetvdb.com/v4/episodes/${id}`, { headers: CABECERAS });

  if (!r.ok) {
    console.log(`  ${id}: TVDB contesta ${r.status}`);

    continue;
  }

  const { data } = await r.json();

  console.log(`  ${id}  ${data.name}`);
  console.log(`       aired:    ${data.aired ?? '(sin fecha)'}`);
  console.log(`        imagen:   ${data.image ?? '(sin imagen)'}`);
  console.log(`        season:   ${data.seasonNumber}  numero: ${data.number ?? '(sin numero)'}`);
}