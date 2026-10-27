const URL = 'https://apis.justwatch.com/graphql';
const H = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const pedir = async (query, variables) => {
  const r = await fetch(URL, { method: 'POST', headers: H, body: JSON.stringify({ query, variables }) });
  const d = await r.json();
  if (d.errors) console.log('ERR', JSON.stringify(d.errors).slice(0, 400));
  return d.data;
};

const tipos = ['MovieOrShow', 'MovieOrShowContent', 'MovieOrShowExternalIds', 'TitleFilter', 'Offer'];
for (const t of tipos) {
  const d = await pedir(`query { __type(name: "${t}") { name kind fields { name type { name kind ofType { name kind ofType { name } } } } inputFields { name } } }`);
  const ty = d?.__type;
  if (!ty) { console.log(`\n## ${t}: no existe`); continue; }
  console.log(`\n## ${ty.name} (${ty.kind})`);
  for (const f of ty.fields ?? []) console.log('   ', f.name, '->', f.type.name ?? f.type.ofType?.name ?? f.type.ofType?.ofType?.name ?? f.type.kind);
  for (const f of ty.inputFields ?? []) console.log('  in', f.name);
}

// Prueba de campos concretos
const d = await pedir(`query { node(id: "ts20066") { ... on MovieOrShow {
  objectId
  externalIds { imdbId tmdbId }
  content(country: US, language: en) { title originalTitle fullPath }
  es: content(country: ES, language: es) { title originalTitle }
} } }`);
console.log('\nprueba:', JSON.stringify(d, null, 1).slice(0, 1200));
