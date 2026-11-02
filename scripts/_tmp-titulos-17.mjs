import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync(process.env.TEMP + "/op-1617.json", "utf8"));
for (const e of d.filter((x) => x.n >= 629)) console.log(`${e.n}\t${e.tituloEn || e.titulo}`);
