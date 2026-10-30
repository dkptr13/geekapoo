const nombres = ['Miss Doublefinger', 'Mr. 4', 'Drophy', 'Babe'];
const q = `query ($s: String) { Page(perPage: 5) { characters(search: $s) { name { full native } media(perPage: 50) { edges { voiceActors(language: JAPANESE) { name { full } } node { id } } } } } }`;
for (const s of nombres) {
  await new Promise(r => setTimeout(r, 6000));
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { s } }),
  });
  const j = await r.json();
  const lista = j.data?.Page?.characters ?? [];
  console.log('==', s);
  for (const c of lista) {
    const edge = c.media.edges.find(e => e.node.id === 21);
    if (edge) console.log(`  ${c.name.full} | ${c.name.native} | ${edge.voiceActors?.[0]?.name?.full ?? '??'}`);
  }
  if (!lista.length) console.log('  ', JSON.stringify(j).slice(0, 140));
}
