// Los capitulos de un anime en TVDB, con su temporada y su imagen.
//    $env:TVDB_KEY='...'
//    node scripts/tvdb-tabla.mjs <tvdb_id>
//
// `tvdb-episodios.mjs` enseña el resumen de cada capitulo, que ocupa
// mucho. Este enseña solo lo necesario para decidir un emparejado: en que
// temporada esta, que numero tiene, como se titula y que imagen tiene.
//
// Hace falta cuando hay que decidir a mano. Ataque a los Titanes esta
// partido en siete temporadas en el catalogo y en cuatro en TVDB, con
// las partes mezcladas: TVDB mete la tercera parte y la cuarta en la
// misma temporada. Para decidir el reparto hay que ver la tabla entera,
// no el resumen de un capitulo de vez en cuando.

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const serie = process.argv[2];

if (!serie) {
  console.error('  uso: node scripts/tvdb-tabla.mjs <tvdb_id>');

  process.exit(1);
}

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: clave }),
});

const token = (await login.json())?.data?.token;

async function pedir(ruta) {
  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });

  return (await r.json())?.data ?? [];
}

// La respuesta de los capitulos viene anidada: `data.episodes` es la
// lista y `data.links` lo que enlaza con la siguiente pagina. Por eso
// `pedir()` devuelve `data` entero y aqui se saca la lista de dentro; si
// se pidiera la lista directamente saldria vacio y el script diria que
// la serie no tiene capitulos.
const capitulos = [];

for (let pagina = 0; pagina < 20; pagina++) {
  const datos = await pedir(`/series/${serie}/episodes/default?page=${pagina}`);

  const lista = datos?.episodes ?? [];

  if (!lista.length) break;

  capitulos.push(...lista);
}

const meta = await pedir(`/series/${serie}`);

console.log(`\n${serie} "${meta.name}" ${meta.year ?? ''}  ${capitulos.length} capitulos`);

// agrupado por temporada, que es como hay que leerlo
const porTemporada = new Map();

for (const e of capitulos) {
  const lista = porTemporada.get(e.seasonNumber) ?? [];

  lista.push(e);

  porTemporada.set(e.seasonNumber, lista);
}

for (const [t, lista] of [...porTemporada.entries()].sort((a, b) => a[0] - b[0])) {
  lista.sort((a, b) => a.number - b.number);

  const conImagen = lista.filter((e) => e.image || e.thumbnail).length;

  console.log(`\n--- S${t}: ${lista.length} capitulos, ${conImagen} con imagen ---`);

  for (const e of lista) {
    const numero = String(e.number).padStart(4);

    console.log(
      `S${t}E${numero}  ${e.aired ?? '????-??-??'}  ` +
        `${e.name ?? '(sin titulo)'.padEnd(30)}${e.image || e.thumbnail ? '' : '   SIN IMAGEN'}`,
    );
  }
}