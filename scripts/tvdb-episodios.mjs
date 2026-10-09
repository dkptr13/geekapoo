// Vuelca los capitulos de una serie de TVDB con su resumen.
//    $env:TVDB_KEY='...'
//    node scripts/tvdb-episodios.mjs <tvdb_id>
//
// Esto es lo que sirve para rehacer un fichero de datos cuando los
// titulos guardados estan mal. TVDB devuelve por cada capitulo el
// nombre, la fecha, la imagen y un resumen en ingles; el resumen es la
// base para escribir el texto en espanol, no una fuente de la que copiar
// sin mas.
//
// Se imprime en bloques para poder leerlo de una sentada.

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const serie = process.argv[2];

if (!serie) {
  console.error('  uso: node scripts/tvdb-episodios.mjs <tvdb_id>');
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

const capitulos = [];

for (let pagina = 0; pagina < 20; pagina++) {
  const d = await pedir(`/series/${serie}/episodes/default?page=${pagina}`);

  const lista = d?.episodes ?? [];

  if (!lista.length) break;

  capitulos.push(...lista);
}

const resumen = await pedir(`/series/${serie}`);

console.log(
  `\n${serie} "${resumen.name}" ${resumen.year ?? ''} ` +
    `- ${capitulos.length} capitulos\n`,
);

for (const e of capitulos) {
  console.log(
    `S${String(e.seasonNumber).padStart(2)}E${String(e.number).padStart(4)}  ` +
      `${e.aired ?? '????-??-??'}  ${e.name ?? '(sin titulo)'}`,
  );

  if (e.overview) console.log(`         ${e.overview.replace(/\s+/g, ' ')}`);

  if (e.image) console.log(`         ${e.image}`);
}