// Estado real de las imagenes del catalogo.
//
//    node scripts/ver-imagenes.mjs
//
// Un simple recuento, pero con la paginación bien: los 300 de Firestore
// no son el total, y contarlos sin `nextPageToken` deja fuera lo que
// sobra. Por eso sale de `firestore-rest.mjs` y no de un fetch suelto.

import { coleccion, str } from './firestore-rest.mjs';

const animes = await coleccion('animes');
const seasons = await coleccion('seasons');
const chars = await coleccion('characters');
const eps = await coleccion('episodes');

console.log(
  `totales: animes=${animes.length} seasons=${seasons.length} ` +
    `characters=${chars.length} episodes=${eps.length}\n`,
);

// ── Animes ─────────────────────────────────────────────────────────

console.log('ANIME               portada  banner');
for (const a of animes.sort((x, y) => str(x.f, 'name').localeCompare(str(y.f, 'name')))) {
  console.log(
    `  ${(str(a.f, 'name') || a.id).slice(0, 22).padEnd(22)}  ` +
      `${str(a.f, 'coverUrl') ? 'SI' : '--'}         ${str(a.f, 'bannerUrl') ? 'SI' : '--'}`,
  );
}

// ── Temporadas ─────────────────────────────────────────────────────

const porAnimeS = new Map();

for (const s of seasons) {
  const k = str(s.f, 'animeId');
  const v = porAnimeS.get(k) ?? { n: 0, poster: 0, banner: 0 };

  v.n++;
  if (str(s.f, 'posterUrl')) v.poster++;
  if (str(s.f, 'bannerUrl')) v.banner++;

  porAnimeS.set(k, v);
}

console.log('\nTEMPORADA           n   portada  banner');

for (const [k, v] of [...porAnimeS].sort()) {
  console.log(
    `  ${k.slice(0, 22).padEnd(22)} ${String(v.n).padEnd(3)} ` +
      `${String(v.poster).padEnd(9)}${v.banner}`,
  );
}

// ── Personajes ─────────────────────────────────────────────────────

const porAnimeC = new Map();

for (const c of chars) {
  const k = str(c.f, 'animeId');
  const v = porAnimeC.get(k) ?? { n: 0, img: 0 };

  v.n++;
  if (str(c.f, 'imageUrl')) v.img++;

  porAnimeC.set(k, v);
}

console.log('\nPERSONAJES          n   con imagen');

for (const [k, v] of [...porAnimeC].sort()) {
  console.log(`  ${k.slice(0, 22).padEnd(22)} ${String(v.n).padEnd(4)}${v.img}`);
}

// ── Episodios ──────────────────────────────────────────────────────

const conThumb = eps.filter((e) => str(e.f, 'thumbnailUrl')).length;

console.log(`\nEPISODIOS           ${conThumb} de ${eps.length} con miniatura`);

// De donde viene cada imagen que si hay, que es lo que decide si el
// catalogo depende de un tercero o va con el contenido.
const dominio = (u) => {
  if (!u) return '(ninguna)';
  if (u.includes('firebasestorage')) return 'Storage propio';
  if (u.includes('anilist')) return 'AniList';
  if (u.includes('myanimelist')) return 'MyAnimeList';
  if (u.includes('pinimg')) return 'Pinterest';
  if (u.includes('behance')) return 'Behance';
  if (u.includes('wikimedia')) return 'Wikimedia';
  try {
    return new URL(u).hostname;
  } catch {
    return 'URL invalida';
  }
};

const cuenta = (lista, campo) => {
  const m = new Map();

  for (const x of lista) {
    const d = dominio(str(x.f, campo));
    m.set(d, (m.get(d) ?? 0) + 1);
  }

  return [...m].sort((a, b) => b[1] - a[1]);
};

console.log('\nDE DONDE VIENEN LAS IMAGENES QUE SI HAY');

console.log('  personajes:');
for (const [d, n] of cuenta(chars, 'imageUrl')) console.log(`    ${d.padEnd(16)}${n}`);

console.log('  temporadas (portada):');
for (const [d, n] of cuenta(seasons, 'posterUrl')) console.log(`    ${d.padEnd(16)}${n}`);

console.log('  episodios (miniatura):');
for (const [d, n] of cuenta(eps, 'thumbnailUrl')) console.log(`    ${d.padEnd(16)}${n}`);