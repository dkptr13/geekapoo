// Pone la miniatura de los capitulos que el emparejador por titulo
// no pudo encontrar, emparejando por NUMERO de capitulo.
//   node scripts/emparejar-por-numero.mjs --anime <id> --escribir
//
// Por que hace falta: hay capitulos cuyo titulo oficial no tiene
// version japonesa (los "TOP3" y "LUCK" de Blue Lock), y el
// emparejador busca por titulo japones. Para esos, el numero es
// suficiente: la serie y la temporada ya estan elegidas y todos
// los demas capitulos han casado uno a uno por titulo, asi que
// el numero que queda libre es el suyo.
//
// Solo se pone la miniatura de los capitulos SIN imagen: si ya la
// tienen, no se toca.
import { uno, coleccion, escribir } from './firestore-rest.mjs';
import { temporadaEnTvdb } from './temporadas-tvdb.mjs';

const clave = process.env.TVDB_KEY;
if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const animeId = args[args.indexOf('--anime') + 1];
const temporada = Number(args[args.indexOf('--temporada') + 1] ?? 1);
const escribirDeVerdad = args.includes('--escribir');
if (!animeId) {
  console.error(
    '  uso: node scripts/emparejar-por-numero.mjs --anime <id> [--temporada <n>] [--escribir]',
  );
  process.exit(1);
}

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ apikey: clave }),
});
const token = (await login.json())?.data?.token;

async function pedir(ruta) {
  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  return (await r.json())?.data ?? [];
}

// ── Los capitulos de la serie en TVDB ──────────────────
// La serie de TVDB: se busca por el titulo de la ficha.
const serie = await pedir(`/search?query=${encodeURIComponent(animeId)}&type=series&limit=10`);
if (!serie.length) {
  console.error(`  TVDB no encuentra "${animeId}"`);
  process.exit(1);
}
const elegida =
  serie.find((s) => s.name === animeId) ??
  serie.find((s) => (s.name ?? '').toLowerCase().includes(animeId.split('-')[0])) ??
  serie[0];
const seasonTvdb = temporadaEnTvdb(animeId, temporada);
console.log(`  TVDB ${elegida.tvdb_id} "${elegida.name}" (temporada ${temporada} -> TVDB S${seasonTvdb})`);

const capitulos = [];
for (let pagina = 0; pagina < 20; pagina++) {
  const d = await pedir(`/series/${elegida.tvdb_id}/episodes/default?page=${pagina}`);
  const lista = d?.episodes ?? [];
  if (!lista.length) break;
  capitulos.push(...lista);
}

// ── Los capitulos del catalogo ─────────────────────────
const anime = await uno('animes', animeId);
const temporadaId = `${animeId}-s${temporada}`;
const capitulosT1 = (await coleccion('episodes')).filter(
  (c) => c.f?.seasonId?.stringValue === temporadaId,
);

const porNumero = new Map();
for (const c of capitulos) {
  if ((c.seasonNumber ?? 0) !== seasonTvdb) continue;
  porNumero.set(c.number, c.image);
}

let puestas = 0;
for (const c of capitulosT1) {
  const num = Number(c.f?.number?.integerValue);
  const imagen = porNumero.get(num);
  const yaTiene = c.f?.thumbnailUrl?.stringValue;
  if (!imagen || yaTiene) continue;
  const titulo = c.f?.title?.stringValue ?? '';
  console.log(`  T${temporada} ${num}  ${titulo}  <- ${imagen}`);
  if (escribirDeVerdad) {
    await escribir('episodes', c.id, { thumbnailUrl: { stringValue: imagen } }, [
      'thumbnailUrl',
    ]);
    puestas++;
  }
}

console.log(
  escribirDeVerdad
    ? `\n  ${puestas} miniaturas puestas`
    : '\n  (modo prueba: usa --escribir para guardar)',
);