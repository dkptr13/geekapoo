// Temporal: junta los datos de la T16 y la T17 (579-746) en un JSON.
import { writeFileSync } from "node:fs";

async function raw(lang, t) {
  const r = await fetch(`https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(t)}&action=raw`);
  return await r.text();
}
const get = (b, k) => {
  const m = b.match(new RegExp("\\|\\s*" + k + "\\s*=\\s*([^\\n]*)"));
  return m ? m[1].trim() : "";
};
const clean = (s) =>
  s
    .replace(/<ref[^>]*>.*?<\/ref>/g, "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/'''?/g, "")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();

function parseEs(w) {
  const out = [];
  for (const b of w.split("{{Lista de episodios").slice(1)) {
    const n = Number(get(b, "EpisodioNúmero"));
    if (!n) continue;
    const f = get(b, "FechadeEmisiónorig").match(/\{\{[^|]*\|(\d+)\|(\d+)\|(\d+)/);
    out.push({
      n,
      titulo: get(b, "Título"),
      nativo: get(b, "TítuloNativo"),
      fecha: f ? `${f[3]}-${f[2].padStart(2, "0")}-${f[1].padStart(2, "0")}` : "",
    });
  }
  return out;
}
function parseEn(w) {
  const out = new Map();
  for (const b of w.split("Episode list|sublist").slice(1)) {
    const n = Number(get(b, "EpisodeNumber"));
    if (!n) continue;
    out.set(n, {
      nativo: get(b, "NativeTitle"),
      sum: clean(get(b, "ShortSummary")),
      titulo: clean(get(b, "Title")),
    });
  }
  return out;
}

const es16 = parseEs(await raw("es", "Anexo:Decimosexta temporada de One Piece")).filter((e) => e.n >= 579 && e.n <= 628);
const es17 = parseEs(await raw("es", "Anexo:Decimoséptima temporada de One Piece")).filter((e) => e.n >= 629 && e.n <= 746);
const en16 = parseEn(await raw("en", "One Piece season 16"));
const en17 = parseEn(await raw("en", "One Piece season 17"));

const CABECERAS = {
  "Content-Type": "application/json",
  Origin: "https://www.imdb.com",
  Referer: "https://www.imdb.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};
const Q = `query ($id: ID!, $after: ID) {
  title(id: $id) { episodes { episodes(first: 250, after: $after) {
    pageInfo { hasNextPage endCursor }
    edges { node { ratingsSummary { aggregateRating } series { episodeNumber { episodeNumber } } } }
  } } } }`;
let after = null;
const notas = new Map();
do {
  const r = await fetch("https://api.graphql.imdb.com/", {
    method: "POST",
    headers: CABECERAS,
    body: JSON.stringify({ query: Q, variables: { id: "tt0388629", after } }),
  });
  const d = await r.json();
  const c = d.data?.title?.episodes?.episodes;
  if (!c) { console.log(JSON.stringify(d).slice(0, 300)); break; }
  for (const e of c.edges) {
    const n = e.node.series?.episodeNumber?.episodeNumber;
    if (n) notas.set(n, e.node.ratingsSummary?.aggregateRating ?? null);
  }
  after = c.pageInfo?.hasNextPage ? c.pageInfo.endCursor : null;
} while (after);

const salida = [...es16, ...es17].map((e) => {
  const en = en16.get(e.n) ?? en17.get(e.n) ?? {};
  return { ...e, nativoEn: en.nativo ?? "", tituloEn: en.titulo ?? "", nota: notas.get(e.n) ?? null, sum: en.sum ?? "" };
});

writeFileSync(process.env.TEMP + "/op-1617.json", JSON.stringify(salida, null, 1));
console.log("filas", salida.length, "sin resumen", salida.filter((e) => !e.sum).length, "sin nota", salida.filter((e) => e.nota == null).length, "sin fecha", salida.filter((e) => !e.fecha).length, "sin nativoEn", salida.filter((e) => !e.nativoEn).length);
