const r = await fetch('https://kitsu.io/api/edge/anime?filter[text]=Fate%2FZero&page[limit]=3');
const d = await r.json();
for (const a of d.data) console.log(a.id, a.attributes.canonicalTitle, '|', a.attributes.startDate, '|', a.attributes.episodeCount);
const id = d.data[0].id;
const r2 = await fetch(`https://kitsu.io/api/edge/anime/${id}/episodes?page[limit]=3`);
const e = await r2.json();
for (const x of e.data) console.log(JSON.stringify(x.attributes, null, 1));
console.log('meta', JSON.stringify(e.meta));
