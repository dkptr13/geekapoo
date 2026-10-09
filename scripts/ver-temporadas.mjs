// Las temporadas de cada anime, con año y título, para revisar el
// emparejamiento con AniList antes de escribir nada.
//
//    node scripts/ver-temporadas.mjs

import { coleccion, str, num } from './firestore-rest.mjs';

const seasons = await coleccion('seasons');

const animes = await coleccion('animes');
const nombreDe = new Map(animes.map((a) => [a.id, str(a.f, 'title') || a.id]));

const porAnime = new Map();

for (const s of seasons) {
  const k = str(s.f, 'animeId');
  porAnime.set(k, [...(porAnime.get(k) ?? []), s]);
}

for (const [animeId, lista] of [...porAnime].sort()) {
  console.log(`\n${animeId}  (${nombreDe.get(animeId) ?? '??'})`);

  for (const s of lista.sort((a, b) => num(a, 'number') - num(b, 'number'))) {
    const n = num(s, 'number');
    const anio = num(s, 'year');
    const titulo = str(s.f, 'title');
    const poster = str(s.f, 'posterUrl') ? 'poster SI' : 'poster --';
    const banner = str(s.f, 'bannerUrl') ? 'banner SI' : 'banner --';

    console.log(
      `  T${n}  ${anio ?? '????'}  ${(titulo || '(sin titulo)').padEnd(28)} ${poster}  ${banner}`,
    );
  }
}