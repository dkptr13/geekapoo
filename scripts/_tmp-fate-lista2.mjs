const nombres = [
  'Fate/Grand Order Absolute Demonic Front Babylonia',
  'Fate/Grand Order Camelot Wandering Agateram',
  'Fate/Grand Order Camelot Paladin Agateram',
  'Fate/Grand Order Solomon',
  'Fate/kaleid liner Prisma Illya 2wei Herz',
  'Fate/kaleid liner Prisma Illya Oath Under Snow',
  'Fate/kaleid liner Prisma Illya Licht',
  'Emiya-san Chi no Kyou no Gohan',
  'Lord El-Melloi II Case Files Rail Zeppelin',
  'Carnival Phantasm',
  'Fate/Grand Order Fujimaru Ritsuka wa Wakaranai',
  'Fate/Grand Order Moonlight Lostroom',
];
for (const n of nombres) {
  const Q = `query($s:String){Page(perPage:3){media(search:$s,type:ANIME,sort:POPULARITY_DESC){id title{romaji} format episodes seasonYear}}}`;
  const r = await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:Q,variables:{s:n}})});
  const d = await r.json();
  const m = d.data?.Page?.media?.[0];
  console.log(n.padEnd(58), '->', m ? `${m.id} | ${m.format} | ${m.episodes ?? '-'} | ${m.seasonYear} | ${m.title.romaji}` : 'sin resultado');
  await new Promise(r=>setTimeout(r,700));
}
