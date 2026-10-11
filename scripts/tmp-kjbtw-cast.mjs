const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const Q = `query ($id: Int, $p: Int) { Media(id: $id, type: ANIME) { title { romaji } characters(page: $p, perPage: 50, sort: [ROLE]) { pageInfo { hasNextPage } edges { role node { name { full native } } voiceActors(language: JAPANESE) { name { full } } } } } }`;
for (const id of [153288, 178754, 116673, 169362]) {
  let p = 1;
  for (;;) {
    await sleep(2500);
    const r = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: Q, variables: { id, p } }) });
    if (!r.ok) { console.log('HTTP ' + r.status + ' media ' + id); break; }
    const j = await r.json();
    const m = j.data.Media;
    if (p === 1) console.log('=== ' + id + ' ' + m.title.romaji + ' ===');
    for (const e of m.characters.edges) console.log(e.role + ' | ' + e.node.name.full + ' | ' + e.node.name.native + ' | ' + (e.voiceActors[0]?.name.full || ''));
    if (!m.characters.pageInfo.hasNextPage) break;
    p++;
  }
  console.log('');
}
console.log('FIN');
