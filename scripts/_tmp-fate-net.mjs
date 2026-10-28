async function probar(nombre, url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(nombre, r.status, (await r.text()).slice(0, 200).replace(/\s+/g,' '));
  } catch (e) { console.log(nombre, 'ERROR', e.message); }
}
await probar('kitsu', 'https://kitsu.io/api/edge/anime?filter[text]=Fate%2FZero&page[limit]=1');
await probar('mal', 'https://myanimelist.net/anime/10087/episode');
await probar('anidb', 'https://anidb.net/anime/4719');
await probar('wikipedia', 'https://en.wikipedia.org/wiki/List_of_Fate/Zero_episodes');
