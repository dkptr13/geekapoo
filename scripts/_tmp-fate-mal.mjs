const r = await fetch('https://myanimelist.net/anime/10087/episode', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
const t = await r.text();
console.log('len', t.length);
const i = t.indexOf('episode_title');
console.log(t.slice(i-200, i+1500).replace(/></g, '>\n<'));
