// La franquicia entera de un anime en AniList, con fecha, formato y
// capitulos, para decidir el orden cronologico de las temporadas.
//   node scripts/ver-temporadas.mjs <id-anilist>
import { arbol } from './anilist.mjs';

const id = Number(process.argv[2]);
const { base, todos } = await arbol(id);

console.log(`base: ${base.id} "${base.titulo}"`);
console.log(`piezas: ${todos.size}\n`);

const lista = [...todos.values()].sort((a, b) => {
  const fa = a.fecha ?? '9999';
  const fb = b.fecha ?? '9999';
  if (fa !== fb) return fa < fb ? -1 : 1;
  return a.id - b.id;
});

for (const m of lista) {
  console.log(
    `  ${m.id}  ${String(m.fecha ?? '?').padEnd(10)}  ${String(m.formato ?? '').padEnd(8)}` +
      ` ${String(m.capitulos ?? '?').padStart(3)} caps  ${m.titulo}`,
  );
}