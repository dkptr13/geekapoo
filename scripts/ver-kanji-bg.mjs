// Kanji de Ikumi y Sara. Uso unico.
const q = 'query($b:String){Character(search:$b){name{full native}}}';

for (const b of ['Ikumi Akagi', 'Sara Himeji']) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { b } }),
  });
  const c = (await r.json()).data.Character;

  console.log(b + ' => ' + (c ? c.name.full + ' | ' + c.name.native : 'SIN RESULTADO'));
}
