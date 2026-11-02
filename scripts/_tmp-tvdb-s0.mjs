const base = "https://api4.thetvdb.com/v4";
const login = await (await fetch(base + "/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apikey: process.env.TVDB_KEY }),
})).json();
const h = { Authorization: "Bearer " + login.data.token };
let page = 0; const eps = [];
for (;;) {
  const r = await (await fetch(`${base}/series/81797/episodes/default?page=${page}&season=0`, { headers: h })).json();
  for (const e of r.data?.episodes ?? []) eps.push(e);
  if (!r.links?.next) break;
  page = r.links.next;
}
for (const e of eps) if ((e.name ?? "").includes("コラボ") || (e.name ?? "").includes("大食漢")) console.log(`${e.number}\t${e.absoluteNumber}\t${e.name}\t${e.aired}`);
console.log("total S0", eps.length);
