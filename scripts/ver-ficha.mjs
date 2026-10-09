// Los datos de una ficha de AniList que `anilist.mjs` no trae.
//    node scripts/ver-ficha.mjs <id-anilist>
//
// `buscarAnime` devuelve el id, el titulo, el año, la portada y el
// banner. Faltan los generos, el formato, el numero de capitulos y los
// estudios, que son justo lo que decide como se guarda un anime: los
// generos van a la lista de la ficha y el formato dice si es una
// temporada, una pelicula o un especial.
//
// Los capitulos no estan: no hay tipo `Episode` en AniList.

const id = Number(process.argv[2]);

if (!id) {
  console.error('  uso: node scripts/ver-ficha.mjs <id-anilist>');

  process.exit(1);
}

const CONSULTA = `query ($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    synonyms
    format
    status
    episodes
    duration
    seasonYear
    season
    genres
    source
    averageScore
    popularity
    siteUrl
    synonyms
    description(asHtml: false)
    studios { nodes { name } }
    coverImage { extraLarge large }
    bannerImage
  }
}`;

const r = await fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: CONSULTA, variables: { id } }),
});

const j = await r.json();

if (j.errors) {
  console.error('  AniList:', JSON.stringify(j.errors).slice(0, 250));

  process.exit(1);
}

const m = j.data.Media;

console.log(`  id:        ${m.id}`);
console.log(`  titulo:    ${m.title.romaji}`);
console.log(`  english:   ${m.title.english ?? '(ninguno)'}`);
console.log(`  nativo:    ${m.title.native ?? '(ninguno)'}`);
console.log(`  alternativas: ${(m.synonyms ?? []).join(' / ') || '(ninguna)'}`);
console.log(`  sinonimos: ${(m.synonyms ?? []).join(' / ') || '(ninguno)'}`);
console.log(`  formato:   ${m.format}`);
console.log(`  estado:    ${m.status}`);
console.log(`  capitulos: ${m.episodes ?? '?'}  minutos: ${m.duration ?? '?'}`);
console.log(`  temporada: ${m.season ?? '?'} de ${m.seasonYear ?? '?'}`);
console.log(`  generos:   ${(m.genres ?? []).join(', ')}`);
console.log(`  origen:    ${m.source ?? '-'}`);
console.log(`  estudios:  ${m.studios?.nodes?.map((n) => n.name).join(', ')}`);
console.log(`  puntos:    ${m.averageScore}`);
console.log(`  poblacion: ${m.popularity}`);
console.log(`  url:       ${m.siteUrl}`);
console.log(`  portada:   ${m.coverImage?.extraLarge}`);
console.log(`  banner:    ${m.bannerImage}`);