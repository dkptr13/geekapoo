const base = "https://api4.thetvdb.com/v4";
const login = await (await fetch(base + "/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apikey: process.env.TVDB_KEY }),
})).json();
const h = { Authorization: "Bearer " + login.data.token };

for (const season of [15, 16, 17]) {
  let page = 0;
  const eps = [];
  for (;;) {
    const r = await (await fetch(`${base}/series/81797/episodes/default?page=${page}&season=${season}`, { headers: h })).json();
    for (const e of r.data?.episodes ?? []) eps.push(e);
    if (!r.links?.next) break;
    page = r.links.next;
  }
  eps.sort((a, b) => a.number - b.number);
  console.log("=== S" + season + " (" + eps.length + ")");
  for (const e of [...eps.slice(0, 2), ...eps.slice(-2)]) {
    console.log(`  E${e.number}\tabs=${e.absoluteNumber}\t${e.name}`);
  }
}
