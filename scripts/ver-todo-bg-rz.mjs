// Generos BG + reparto BG S1 + VAs RZ pendientes. Uso unico.
const qc = 'query($id:Int){Media(id:$id){title{romaji} genres characters(sort:ROLE,perPage:12){edges{node{name{full} } voiceActors(language:JAPANESE,sort:FAVOURITES){name{full}} } } } }';

for (const id of [101291]) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: qc, variables: { id } }),
  });
  const m = (await r.json()).data.Media;

  console.log('##### ' + m.title.romaji + ' | ' + m.genres.join(', '));

  for (const e of m.characters.edges) {
    const voces = e.voiceActors.map((v) => v.name.full).join(' / ');
    console.log(`${e.node.name.full} | ${voces}`);
  }
}

const qb = 'query($b:String){Character(search:$b){name{full native} media(perPage:1){edges{voiceActors(language:JAPANESE){name{full}}}}}}';

for (const b of ['Petra Leyte', 'Frederica Baumann', 'Julius Euclius', 'Anastasia Hoshin', 'Crusch Karsten', 'Felt', 'Felix Argyle', 'Reinhard van Astrea', 'Shaula', 'Puck', 'Petelgeuse Romanee-Conti', 'Beatrice', 'Roswaal L Mathers', 'Echidna', 'Garfiel Tinsel', 'Otto Suwen']) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: qb, variables: { b } }),
  });
  const c = (await r.json()).data.Character;

  if (!c || !c.media) {
    console.log(b + ': SIN RESULTADO');
    continue;
  }

  const v = [...new Set(c.media.edges.flatMap((e) => (e.voiceActors ?? []).map((x) => x.name.full)))];

  console.log(`${c.name.full} | ${c.name.native} | ${v.join(' / ')}`);
}
