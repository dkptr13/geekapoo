// Campos de un tipo del esquema de AniList.
//    node scripts ver-tipo-anilist.mjs <NombreDelTipo>
//
// Para responder preguntas sobre lo que AniList tiene y lo que no tiene,
// mirando el esquema en vez de fiarse de la memoria. Se usa asi:
//
//     node scripts/ver-tipo-anilist.mjs Episode
//     error: el tipo "Episode" no existe
//
// Que es la respuesta que intereso cuando se Haf问道 si AniList tiene
// imagenes por capitulo.

const nombre = process.argv[2];

if (!nombre) {
  console.error('  uso: node scripts/ver-tipo-anilist.mjs <Tipo>');
  process.exit(1);
}

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query ($nombre: String!) { __type(name: $nombre) { name description fields { name description type { name kind ofType { name } } } } }',
    variables: { nombre },
  }),
});

const d = await r.json();
const t = d.data?.__type;

if (!t) {
  console.log(`el tipo "${nombre}" no existe en el esquema de AniList`);

  // SeLeveragen los nombres parecidos, que es lo que hace falta para
  // saber que hay cerca.
  const r2 = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ __schema { types { name } } }' }),
  });

  const tipos = (await r2.json()).data.__schema.types.map((x) => x.name);

  console.log(`\nlo mas parecido a "${nombre}":`);
  console.log('  ' + (tipos.filter((n) => n.toLowerCase().includes(nombre.toLowerCase())).join(', ') || '(nada)'));

  process.exit(0);
}

console.log(`${t.name}${t.description ? `:\n  ${t.description}` : ''}`);
console.log('\ncampos:');

for (const f of t.fields ?? []) {
  const tipo = f.type.name ?? f.type.ofType?.name ?? f.type.kind;

  console.log(`  ${String(f.type.kind).padEnd(10)} ${tipo.padEnd(28)} ${f.name}`);

  if (f.description) console.log(`  ${' '.repeat(11)}${f.description.split('\n')[0].slice(0, 100)}`);
}