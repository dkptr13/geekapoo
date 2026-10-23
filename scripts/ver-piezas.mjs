// Las piezas de una franquicia en AniList, con fecha, formato y
// capitulos.
//   node scripts/ver-piezas.mjs <id-anilist> [...]
import { arbol } from './anilist.mjs';

const Q = `query ($id: Int) {
  Media(id: $id) {
    id
    title { romaji native english }
    format
    episodes
    duration
    status
    seasonYear
    season
    startDate { year month day }
    endDate { year month day }
    studios { nodes { name isAnimationStudio } }
    source
  }
}`;

const base = Number(process.argv[2]);
const { todos } = await arbol(base);

const ids = [...todos.keys()].sort((a, b) => a - b);
const out = [];

for (const id of ids) {
  const r = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: Q, variables: { id } }),
  });
  const d = await r.json();
  const m = d.data?.Media;
  if (!m) continue;
  const fecha = m.startDate?.year
    ? `${m.startDate.year}-${String(m.startDate.month ?? 1).padStart(2, '0')}-${String(m.startDate.day ?? 1).padStart(2, '0')}`
    : '';
  out.push({ ...m, fecha });
}

out.sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));

for (const m of out) {
  console.log(
    `  ${String(m.id).padEnd(7)} ${(m.fecha || '?').padEnd(11)} ${String(m.format ?? '').padEnd(8)}` +
      ` ${String(m.episodes ?? '?').padStart(3)} caps  ${m.title.romaji}`,
  );
}