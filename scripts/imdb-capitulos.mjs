// Los capitulos de una serie en IMDb, con nota, votos y fecha.
//    node scripts/imdb-capitulos.mjs <tt...>
//
// ── POR QUE HACE FALTA ──────────────────────────────────────────────
//
// Las notas de capitulo salen de IMDb, pero hay que comprobar dos cosas
// antes de fiarse de ellas:
//
// 1. Que los capitulos sean de esta serie. IMDb se equivoca al
//    agruparlos: en el catalogo de Toradora, IMDb devuelve para los
//    capitulos 9 a 12 los titulos "Sky Walk", "Blue Rose", "Killing
//    Giant" y "Rule Number 10", que son los capitulos 10 a 13 de No
//    Game No Life. El numero y la nota son de otra serie.
//
// 2. Que el numero de capitulos que devuelve sea el de la serie, que es
//    lo que dice `total`.
//
// El titulo japones de cada capitulo no sale de aqui: sale de la wiki.
// IMDb solo aporta la nota.
//
// ── EL 403 ──────────────────────────────────────────────────────────
//
// IMDb contesta con un HTML de 403Forbidden en vez de con un error de
// GraphQL cuando la peticion no le gusta. Se lee el principio de la
// respuesta para distinguirlo de un fallo de json plano, que no dice
// nada de por que.

// Las mismas cabeceras que usa el emparejador, que es el script que ya
//-consigue que IMDb conteste.
const CABECERAS = {
  'Content-Type': 'application/json',
  Origin: 'https://www.imdb.com',
  Referer: 'https://www.imdb.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

const Q_EPIS = `query ($id: ID!) {
  title(id: $id) {
    titleText { text }
    episodes {
      seasons { number }
      episodes(first: 300) {
        total
        edges {
          node {
            id
            titleText { text }
            releaseDate { day month year }
            ratingsSummary { aggregateRating voteCount }
            series { episodeNumber { seasonNumber episodeNumber } }
          }
        }
      }
    }
  }
}`;

const id = process.argv[2] ?? 'tt1279024';

const r = await fetch('https://api.graphql.imdb.com/', {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ query: Q_EPIS, variables: { id } }),
});

const crudo = await r.text();

const d = crudo.startsWith('{') ? JSON.parse(crudo) : null;

if (!d) {
  console.log(`respondio ${r.status} con algo que no es json:`);
  console.log(crudo.slice(0, 400).replace(/\s+/g, ' '));
  process.exit(1);
}

if (d.errors) {
  console.log(`error: ${JSON.stringify(d.errors).slice(0, 300)}`);
  process.exit(1);
}

const t = d.data?.title;

if (!t) {
  console.log(`IMDb no devuelve nada para ${id}`);
  process.exit(1);
}

const edges = t.episodes?.episodes?.edges ?? [];

console.log(`\n${t.titleText.text}  ${id}`);
console.log(`temporadas: ${(t.episodes?.seasons ?? []).map((s) => s.number).join(', ')}`);
console.log(`total declarado: ${t.episodes?.episodes?.total ?? '?'}\n`);

for (const e of edges) {
  const n = e.node;
  const num = n.series?.episodeNumber;
  const f = n.releaseDate;

  const fecha = f
    ? `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`
    : '????-??-??';

  const nota = n.ratingsSummary?.aggregateRating;

  console.log(
    `S${num?.seasonNumber ?? '?'}E${String(num?.episodeNumber ?? '?').padStart(3)}  ` +
      `${fecha}  ${nota ? nota.toFixed(1) : ' - '} ` +
      `(${String(n.ratingsSummary?.voteCount ?? 0).padStart(5)})  ` +
      `${n.titleText?.text ?? '(sin titulo)'}`,
  );
}