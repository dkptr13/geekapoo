import { T16 } from "./datos/op-t16.mjs";
import { T17 } from "./datos/op-t17.mjs";
import { limpiar } from "./normalizar-titulo.mjs";
import { capituloEnTvdb, tituloEnTvdb } from "./temporadas-tvdb.mjs";

const base = "https://api4.thetvdb.com/v4";
const login = await (await fetch(base + "/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apikey: process.env.TVDB_KEY }),
})).json();
const h = { Authorization: "Bearer " + login.data.token };
const porTemporada = {};
for (const season of [0, 16, 17]) {
  let page = 0; const eps = [];
  for (;;) {
    const r = await (await fetch(`${base}/series/81797/episodes/default?page=${page}&season=${season}`, { headers: h })).json();
    for (const e of r.data?.episodes ?? []) eps.push(e);
    if (!r.links?.next) break;
    page = r.links.next;
  }
  porTemporada[season] = eps;
}
const filas = [
  ...T16.map((f) => ({ temporada: 16, numero: f[0], japones: f[2] })),
  ...T17.map((f) => ({ temporada: 17, numero: f[0], japones: f[2] })),
];
for (const f of filas) {
  const destino = capituloEnTvdb("one-piece", f.temporada, f.numero);
  const ep = porTemporada[destino.temporada]?.find((e) => Number(e.number) === destino.numero);
  const t = ep?.name ?? "";
  const alias = tituloEnTvdb("one-piece", f.japones);
  const ok = limpiar(f.japones) === limpiar(t) || (alias && limpiar(alias) === limpiar(t));
  if (!ok) console.log(`    '${f.japones}': '${t}',`);
}
