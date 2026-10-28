const Q = `query($id:Int){Media(id:$id,type:ANIME){id idMal title{romaji english native} format episodes duration status seasonYear startDate{year month day} endDate{year month day} studios{nodes{name}} genres averageScore popularity coverImage{extraLarge} bannerImage description(asHtml:false)}}`;
const ids = [356,10087,11741,19603,20791,21718,21719,98035,14829,20467,20845,21379,97757,118743,21717,97815,103275,103276,103277,116756,100855,106918,166617,12565,10012];
const Q2 = `query($s:String){Page(perPage:5){media(search:$s,type:ANIME,sort:POPULARITY_DESC){id idMal title{romaji} format episodes seasonYear}}}`;
async function pedir(q,v){const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,variables:v})});const d=await r.json();if(d.errors)console.error(JSON.stringify(d.errors));return d.data;}
for (const s of ['Fate/stay night Unlimited Blade Works 2nd Season','Fate/Grand Order First Order','Fate/strange Fake']) {
  const d = await pedir(Q2,{s});
  console.log('BUSCAR', s, '->', d.Page.media.map(m=>`${m.id}|${m.idMal}|${m.format}|${m.episodes}|${m.seasonYear}|${m.title.romaji}`).join(' || '));
  await new Promise(r=>setTimeout(r,800));
}
const out=[];
for (const id of ids) {
  const d = await pedir(Q,{id});
  out.push(d.Media);
  console.log(d.Media.id, d.Media.idMal, d.Media.format, d.Media.episodes, d.Media.title.romaji);
  await new Promise(r=>setTimeout(r,800));
}
const fs = await import('node:fs/promises');
await fs.writeFile('scripts/_tmp-fate-anilist.json', JSON.stringify(out,null,1));
