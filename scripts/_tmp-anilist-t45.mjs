const nombres = ['Bentham', 'Zala', 'Babe', 'Koza', 'Kohza', 'Lapanui', 'Ian', 'Puppu', 'Mr. 2', 'Mr. 4', 'Miss Doublefinger', 'Mr. 1'];
const q = `query ($s: String) { Character(search: $s) { name { full native } media(perPage: 50) { edges { voiceActors(language: JAPANESE) { name { full } } node { id } } } } }`;
for (const s of nombres) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { s } }),
  });
  const j = await r.json();
  if (!j.data?.Character) { console.log(s, '->', JSON.stringify(j).slice(0, 120)); continue; }
  const c = j.data.Character;
  const edge = c.media.edges.find(e => e.node.id === 21);
  console.log(`${s} -> ${c.name.full} | ${c.name.native} | ${edge?.voiceActors?.[0]?.name?.full ?? '??'}`);
}
