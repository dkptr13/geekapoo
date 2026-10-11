// Ficha AniList de Bunny Girl y Re:Zero. Uso unico.
const q = 'query($s:String){Media(search:$s,type:ANIME){id title{romaji english} genres averageScore seasonYear status format episodes studios{nodes{name}} bannerImage coverImage{large}}}';

for (const s of ['Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai', 'Re:Zero kara Hajimeru Isekai Seikatsu']) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { s } }),
  });
  const m = (await r.json()).data.Media;

  console.log('=== ' + m.id + ' ' + m.title.romaji + ' ===');
  console.log('en: ' + m.title.english);
  console.log('genres: ' + m.genres.join(', '));
  console.log('score: ' + m.averageScore + ' year: ' + m.seasonYear + ' status: ' + m.status + ' format: ' + m.format + ' eps: ' + m.episodes);
  console.log('studios: ' + m.studios.nodes.map((x) => x.name).join(', '));
  console.log('banner: ' + (m.bannerImage || '(vacio)'));
}
