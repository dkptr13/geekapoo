// Reparto de Bunny Girl y Re:Zero S1. Uso unico.
const q = 'query($id:Int){Media(id:$id,type:ANIME){title{romaji} characters(sort:ROLE,perPage:30){edges{role node{name{full native} } voiceActors(language:JAPANESE,sort:FAVOURITES){name{full}} } } } }';

for (const id of [101291, 21355]) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { id } }),
  });
  const m = (await r.json()).data.Media;

  console.log('##### ' + m.title.romaji);

  for (const e of m.characters.edges) {
    const voces = e.voiceActors.map((v) => v.name.full).join(' / ');
    console.log(`[${e.role}] ${e.node.name.full} | ${e.node.name.native} | ${voces}`);
  }
}
