import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync(process.env.TEMP + "/op-1617.json", "utf8"));
for (const n of [589, 590, 591, 628, 629]) {
  const e = d.find((x) => x.n === n);
  console.log("=== " + n + " | " + e.titulo + " | " + e.nativo + " | " + e.fecha + " | " + e.nota);
  console.log(e.sum);
}
