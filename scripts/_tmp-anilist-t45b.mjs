const nombres = ['Zala', 'Babe'];
const q = `query ($s: String) { Character(search: $s) { name { full native } media(perPage: 50) { edges { voiceActors(language: JAPANESE) { name { full } } node { id } } } } }`;
for (const s of nombres) {
  await new Promise(r => setTimeout(r, 6000));
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { s } }),
  });
  const j = await r.json();
  if (!j.data?.Character) { console.log(s, '->', JSON.stringify(j).slice(0, 160)); continue; }
  const c = j.data.Character;
  const edge = c.media.edges.find(e => e.node.id === 21);
  console.log(`${s} -> ${c.name.full} | ${c.name.native} | ${edge?.voiceActors?.[0]?.name?.full ?? '??'}`);
}
