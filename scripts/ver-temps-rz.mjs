// IDs AniList de temporadas RZ + Bunny S2, y reparto S2-S4 RZ. Uso unico.
const qm = 'query($s:String){Media(search:$s,type:ANIME){id title{romaji} seasonYear episodes coverImage{large} bannerImage}}';

const ids = {};

for (const s of [
  'Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season',
  'Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season',
  'Re:Zero kara Hajimeru Isekai Seikatsu 4th Season',
  'Seishun Buta Yarou wa Santa Claus no Yume wo Minai',
]) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: qm, variables: { s } }),
  });
  const m = (await r.json()).data.Media;

  if (!m) {
    console.log(s + ': SIN RESULTADO');
    continue;
  }

  ids[s] = m.id;
  console.log(m.id + ' ' + m.title.romaji + ' ' + m.seasonYear + ' eps=' + m.episodes);
  console.log('  cover: ' + m.coverImage.large);
  console.log('  banner: ' + (m.bannerImage || '(vacio)'));
}

const qc = 'query($id:Int){Media(id:$id){characters(sort:ROLE,perPage:20){edges{role node{name{full native} } voiceActors(language:JAPANESE,sort:FAVOURITES){name{full}} } } } }';

for (const [nombre, id] of Object.entries(ids)) {
  if (!id) continue;

  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: qc, variables: { id } }),
  });
  const edges = (await r.json()).data.Media.characters.edges;

  console.log('##### ' + nombre);

  for (const e of edges.slice(0, 14)) {
    const voces = e.voiceActors.map((v) => v.name.full).join(' / ');
    console.log(`[${e.role}] ${e.node.name.full} | ${e.node.name.native} | ${voces}`);
  }
}
