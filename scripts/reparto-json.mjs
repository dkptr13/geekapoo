// Saca el reparto de AniList a un JSON, con los nombres japoneses
// intactos y el rol y la voz.
//   node scripts/reparto-json.mjs <id-anilist> [<id-anilist> ...]
//
// Se consulta la API desde aqui y no se lee la salida de otro
// script: al pasar por la consola de Windows los nombres
// japoneses salian con doble codificacion.
import { writeFileSync } from 'node:fs';

const Q = `query ($id: Int, $pagina: Int) {
  Media(id: $id, type: ANIME) {
    characters(page: $pagina, perPage: 50, sort: [ROLE, ID]) {
      pageInfo { hasNextPage }
      edges {
        role
        voiceActors(language: JAPANESE) { name { full } }
        node {
          id
          name { full native }
          image { large }
        }
      }
    }
  }
}`;

async function pedir(id, pagina) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: Q, variables: { id, pagina } }),
  });
  const d = await r.json();
  if (d.errors) throw new Error(JSON.stringify(d.errors).slice(0, 200));
  return d.data?.Media;
}

const salida = {};

for (const id of process.argv.slice(2)) {
  const lista = [];
  let pagina = 1;
  for (;;) {
    const m = await pedir(Number(id), pagina);
    if (!m) break;
    for (const e of m.characters.edges) {
      if (!e.node.image?.large) continue;
      if (e.role === 'BACKGROUND') continue;
      lista.push({
        id: e.node.id,
        rol: e.role.toLowerCase(),
        nombre: e.node.name.full,
        ja: e.node.name.native ?? '',
        voz: e.voiceActors?.[0]?.name?.full ?? '',
        img: e.node.image.large,
      });
    }
    if (!m.characters.pageInfo.hasNextPage) break;
    pagina++;
  }
  salida[id] = lista;
}

const destino = 'scripts/entradas/reparto.json';
writeFileSync(destino, JSON.stringify(salida, null, 2) + '\n', 'utf8');
for (const [id, l] of Object.entries(salida)) console.log(`  ${id}: ${l.length} personajes`);