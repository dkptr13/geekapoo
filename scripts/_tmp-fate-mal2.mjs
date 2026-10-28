const r = await fetch('https://myanimelist.net/anime/10087/episode', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
const t = await r.text();
for (const clave of ['ep_num', 'episode-list', 'js-episode', 'aired', '2011-10']) {
  console.log(clave, t.indexOf(clave));
}
const i = t.indexOf('2011-10');
console.log(t.slice(i-1200, i+800).replace(/></g, '>\n<'));
