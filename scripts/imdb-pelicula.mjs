// La nota de una pelicula en IMDb, que `imdb-capitulos.mjs` no saca
// porque solo lee series.
//    node scripts/imdb-pelicula.mjs <tt...>
//
// Hace falta para la pelicula del arco Reze: en IMDb es una pelicula
// (tt30472557) y no una temporada, asi que no aparece en la lista de
// capitulos.

const id = process.argv[2];

if (!id) {
  console.error('  uso: node scripts/imdb-pelicula.mjs <tt...>');

  process.exit(1);
}

const CONSULTA = `query ($id: ID!) {
  title(id: $id) {
    id
    titleText { text }
    releaseYear { year }
    releaseDate { day month year }
    runtime { seconds }
    ratingsSummary { aggregateRating voteCount }
    genres { genres { text } }
    plot { plotText { plainText } }
  }
}`;

// Las MISMAS cabeceras que usa `imdb-capitulos.mjs`, que es el script que
// ya consigue que IMDb conteste. IMDb devuelve 403 con cabeceras parecidas
// pero no iguales: pide tambien `Referer` y un `Accept` concreto, y con las
// cabeceras de siempre la respuesta es un HTML de Forbidden en lugar de un
// error de GraphQL, que no dice nada de por que.
const CABECERAS = {
  'Content-Type': 'application/json',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

const r = await fetch('https://api.graphql.imdb.com/', {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ query: CONSULTA, variables: { id } }),
});

const texto = await r.text();

if (!texto.trim().startsWith('{')) {
  console.error(`  IMDb contesta ${r.status} y no es JSON`);
  console.error(`  ${texto.slice(0, 200)}`);

  process.exit(1);
}

const json = JSON.parse(texto);

if (json.errors) {
  console.error('  IMDb:', JSON.stringify(json.errors).slice(0, 300));

  process.exit(1);
}

const t = json.data.title;

if (!t) {
  console.error(`  no hay nada con ${id}`);

  process.exit(1);
}

console.log(`  ${t.titleText.text}  (${t.releaseYear?.year})`);
console.log(`  ${id}  ${t.releaseDate?.day}/${t.releaseDate?.month}/${t.releaseDate?.year}`);
console.log(`  duracion: ${t.runtime?.seconds} s`);
console.log(`  nota:     ${t.ratingsSummary?.aggregateRating}  con ${t.ratingsSummary?.voteCount} votos`);
console.log(`  generos:  ${t.genres?.genres?.map((g) => g.text).join(', ')}`);
console.log(`  resumen:  ${(t.plot?.plotText?.plainText ?? '(sin resumen)').slice(0, 400)}`);
