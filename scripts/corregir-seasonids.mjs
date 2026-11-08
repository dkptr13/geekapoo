// Arregla los seasonIds que no apuntan a ninguna temporada real.
//
//    node scripts/corregir-seasonids.mjs --anime <id>[,<id>...] [--dry-run]
//    node scripts/corregir-seasonids.mjs --full [--dry-run]
//
// ── QUE PASA ───────────────────────────────────────────────────────
//
// `cargar-anime.mjs` construye el id de temporada como
// `${ANIME_ID}-s${numero}`. Si en el fichero de datos el campo de
// temporadas trae algo que no es un numero, el id sale mal formado: en
// Cyberpunk cinco personajes tienen `seasonIds: ["...-s"]`, sin numero
// detras, que no existe.
//
// Que no exista el id no es un error visible: el personaje simplemente
// no aparece en ninguna temporada de la wiki, porque
// `seasonIdsDe` no encuentra la temporada que buscar. En Cyberpunk eso
// dejaba la unica temporada con 10 de 15 personajes.
//
// ── EL ARREGLO ─────────────────────────────────────────────────────
//
// Se vacia el array, que es lo que significa "sale en todas las
// temporadas" (ver `seasonIdsDe` en `utils/seasonData.ts`). Para los
// animes de una sola temporada, vacio y "todas" son lo mismo.

import { coleccion, escribir, str, arrayDe } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const full = args.includes('--full');
const soloAnimes = args
  .flatMap((arg, i) => (arg === '--anime' ? (args[i + 1] ?? '').split(',') : []))
  .map((id) => id.trim())
  .filter(Boolean);

if (!full && !soloAnimes.length) {
  console.error('  uso: corregir-seasonids.mjs --anime <id>[,<id>] | --full');
  process.exit(1);
}
if (full && soloAnimes.length) {
  console.error('  --full no se puede combinar con --anime.');
  process.exit(1);
}

const seasons = full
  ? await coleccion('seasons')
  : await leerPorCampo({
      coleccion: 'seasons',
      campo: 'animeId',
      valor: soloAnimes,
      campos: ['animeId'],
    });
const chars = full
  ? await coleccion('characters')
  : await leerPorCampo({
      coleccion: 'characters',
      campo: 'animeId',
      valor: soloAnimes,
      campos: ['animeId', 'name', 'seasonIds'],
    });

const validos = new Set(seasons.map((x) => x.id));

const malos = chars.filter((c) => {
  const ids = (c.f.seasonIds?.arrayValue?.values ?? []).map((v) => v.stringValue);

  return ids.length > 0 && ids.some((id) => !validos.has(id));
});

console.log(`${malos.length} personajes con seasonIds que no existen\n`);

if (!malos.length) {
  console.log('nada que arreglar');
  process.exit(0);
}

for (const c of malos) {
  const ids = (c.f.seasonIds?.arrayValue?.values ?? []).map((v) => v.stringValue);

  console.log(`  ${str(c.f, 'animeId')} / ${str(c.f, 'name')}`);
  console.log(`    mal: ${ids.join(', ')}`);
  console.log(`    -> vacio (= todas las temporadas)`);

  if (!dryRun) {
    await escribir('characters', c.id, { seasonIds: arrayDe([]) }, ['seasonIds']);
  }
}

console.log(
  dryRun
    ? '\nMODO PRUEBA: no se ha escrito nada'
    : `\nArreglados ${malos.length} personajes`,
);