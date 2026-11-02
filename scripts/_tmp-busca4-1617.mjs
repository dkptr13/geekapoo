import { readFileSync } from "node:fs";
const chars = JSON.parse(readFileSync(process.env.TEMP + "/op-anilist-chars.json", "utf8"));
for (const b of ["ヴァイオレット", "エリザベロー", "ラオ", "ブラウン", "ブリード", "ギャッツ", "ガンチョ", "ウィッカ", "ホーミング", "ウーシー", "ダガマ", "タンク", "ブー"]) {
  const hits = chars.filter((c) => (c.native ?? "").includes(b));
  for (const h of hits) console.log(`${b} -> ${h.full} | ${h.native} | ${h.voz}`);
}
