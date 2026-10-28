const Q = `query($id:Int){Media(id:$id,type:ANIME){id idMal title{romaji english native} format episodes duration status seasonYear startDate{year month day} endDate{year month day} studios{nodes{name}} genres averageScore popularity coverImage{extraLarge} bannerImage description(asHtml:false) externalLinks{site url}}}`;
const ids = [356,10087,11741,19603,20792,20791,21718,21719,98035,14829,20467,20845,21379,97757,118743,21717,97815,103275,103276,103277,116756,100855,106918,166617,12565,10012];
async function pedir(q,v){const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,variables:v})});const d=await r.json();if(d.errors)console.error(JSON.stringify(d.errors));return d.data;}
const out=[];
for (const id of ids) {
  const d = await pedir(Q,{id});
  const m = d.Media;
  const imdb = (m.externalLinks||[]).find(l=>l.site==='IMDb')?.url;
  out.push({...m, imdb});
  console.log(String(m.id).padEnd(7), String(m.idMal).padEnd(7), (m.format||'').padEnd(6), String(m.episodes).padEnd(3), m.startDate?.year, imdb, '|', m.title.romaji);
  await new Promise(r=>setTimeout(r,700));
}
const fs = await import('node:fs/promises');
await fs.writeFile('scripts/_tmp-fate-anilist.json', JSON.stringify(out,null,1));
