const Q = `query { Page(page:1, perPage:50) { media(search:"Fate", type:ANIME, sort:POPULARITY_DESC) { id title { romaji english } format episodes seasonYear status popularity } } }`;
const r = await fetch('https://graphql.anilist.co', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:Q})});
const d = await r.json();
for (const m of d.data.Page.media) console.log(String(m.id).padEnd(7), (m.format||'').padEnd(8), String(m.episodes ?? '-').padEnd(4), m.seasonYear ?? '----', String(m.popularity).padEnd(7), m.title.romaji);
