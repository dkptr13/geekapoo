// Comprueba el estado de los animes subidos por el panel, que no tienen
// fichero de datos y por tanto no entran en `verificar-anime.mjs`.
//
//   node scripts/verificar-panel.mjs

import { tokenDeAcceso } from './token-firebase.mjs';

const ANIMES = [
  'cyberpunk-edgerunners-2',
  'frieren-beyond-journeys-end',
  'jujutsu-kaisen',
  'kaguya-sama-love-is-war',
  'witch-hat-atelier',
];

const token = await tokenDeAcceso();
const BASE = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}/databases/(default)/documents`;
const H = { Authorization: `Bearer ${token}` };

const s = (x) => x?.stringValue ?? x?.doubleValue ?? x?.integerValue ?? '';
const arr = (x) => (x?.arrayValue?.values ?? []).map((y) => y.stringValue);
const n = (x) => Number(x?.doubleValue ?? x?.integerValue ?? 0);

/** Con paginacion: `episodes` no cabe en una pagina. */
async function todo(coleccion) {
  const salida = [];
  let pagina = null;

  do {
    const url = `${BASE}/${coleccion}?pageSize=1000${pagina ? `&pageToken=${pagina}` : ''}`;
    const r = await fetch(url, { headers: H });
    const d = await r.json();

    salida.push(
      ...(d.documents ?? []).map((x) => ({ id: x.name.split('/').pop(), f: x.fields })),
    );

    pagina = d.nextPageToken ?? null;
  } while (pagina);

  return salida;
}

const temporadas = await todo('seasons');
const capitulos = await todo('episodes');
const personajes = await todo('characters');
const animes = await todo('animes');

let problemas = 0;

for (const id of ANIMES) {
  const anime = animes.find((a) => a.id === id);
  const susTemps = temporadas
    .filter((t) => s(t.f.animeId) === id)
    .sort((a, b) => n(a.f.number) - n(b.f.number));
  const susCaps = capitulos.filter((c) => s(c.f.animeId) === id);
  const susPers = personajes.filter((c) => s(c.f.animeId) === id);

  const p = [];

  for (const [campo, etiqueta] of [
    ['title', 'titulo'], ['japaneseTitle', 'titulo japones'], ['year', 'anio'],
    ['status', 'estado'], ['synopsis', 'sinopsis'],
  ]) {
    if (!s(anime?.f[campo]).trim()) p.push(`anime sin ${etiqueta}`);
  }
  if (n(anime?.f.rating) === 0) p.push('anime sin nota');
  if (!arr(anime?.f.streaming).length) p.push('anime sin plataformas');

  if (!susTemps.length) p.push('sin temporadas');

  for (const t of susTemps) {
    const caps = susCaps.filter((c) => s(c.f.seasonId) === t.id);
    const tn = `T${n(t.f.number)}`;

    if (!s(t.f.studio)) p.push(`${tn} sin estudio`);
    if (!s(t.f.synopsis)) p.push(`${tn} sin sinopsis`);
    if (n(t.f.rating) === 0) p.push(`${tn} sin nota`);
    if (!caps.length) p.push(`${tn} sin capitulos`);
    if (caps.some((c) => !s(c.f.seasonId))) p.push(`${tn}: hay capitulos sin temporada`);
  }

  for (const c of susPers) {
    const cn = s(c.f.name) || c.id;
    if (!s(c.f.japaneseName)) p.push(`"${cn}" sin nombre japones`);
    if (!s(c.f.voiceActor)) p.push(`"${cn}" sin voz`);
    if (!s(c.f.description)) p.push(`"${cn}" sin resumen`);
    if (!arr(c.f.tags).length) p.push(`"${cn}" sin etiquetas`);
    if (!s(c.f.imageUrl)) p.push(`"${cn}" sin imagen`);
  }

  console.log(`${s(anime?.f.title) || id}`);
  console.log(`  ${susTemps.length} temporadas | ${susCaps.length} capitulos | ${susPers.length} personajes`);
  console.log(`  temporadas: ${susTemps.map((t) => `T${n(t.f.number)}(${susCaps.filter((c) => s(c.f.seasonId) === t.id).length})`).join(' ') || '(ninguna)'}`);
  console.log(`  con imagen: ${susPers.filter((c) => s(c.f.imageUrl)).length} de ${susPers.length}`);

  if (!p.length) {
    console.log('  TODO PUESTO\n');
  } else {
    problemas += p.length;
    for (const x of p) console.log(`  FALLO: ${x}`);
    console.log('');
  }
}

console.log(`${problemas} problemas (los "sin imagen" son de los que subiste por el panel)`);