const r = await fetch('https://api.jikan.moe/v4/anime/22297/episodes?page=1');
console.log(r.status);
const d = await r.json();
console.log('eps', d.data?.length, 'pagination', JSON.stringify(d.pagination));
console.log(JSON.stringify(d.data?.[0], null, 1));
