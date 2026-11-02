import { readFileSync } from "node:fs";
const chars = JSON.parse(readFileSync(process.env.TEMP + "/op-anilist-chars.json", "utf8"));
for (const b of ["Chadros", "ハドロス", "ヒゲリーゲス", "ブラウンビアード", "チャドロス"]) {
  const hits = chars.filter((c) => (c.native ?? "").includes(b) || (c.full ?? "").toLowerCase().includes(b.toLowerCase()));
  for (const h of hits) console.log(`${b} -> ${h.full} | ${h.native} | ${h.voz}`);
}
