import { readFileSync } from "node:fs";
const chars = JSON.parse(readFileSync(process.env.TEMP + "/op-anilist-chars.json", "utf8"));
const buscar = ["ブラウン","ラオ","セニョール","ピンク","ブー","ダガマ","ギャッツ","タンク","ガンチョ","ウィッカ","ホーミング","ウーシー","アンゴ","スパルタ","アキリア","カン","ジュウロウ","イエティ","ロック","スコッチ","ブリード","フジトラ","藤虎","ボア","ハイルディン","オオロンブス"];
for (const b of buscar) {
  const hits = chars.filter((c) => (c.native ?? "").includes(b) || (c.full ?? "").toLowerCase().includes(b.toLowerCase()));
  for (const h of hits) console.log(`${b} -> ${h.full} | ${h.native} | ${h.voz}`);
}
