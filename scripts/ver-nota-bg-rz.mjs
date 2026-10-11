// Nota IMDb de BG y RZ. Uso unico.
const Q = 'query($id:ID!){title(id:$id){titleText{text} ratingsSummary{aggregateRating voteCount}}}';

for (const id of ['tt8993398', 'tt5607616']) {
  const r = await fetch('https://api.graphql.imdb.com/', {
    method: 'POST',
    headers: {
      Origin: 'https://www.imdb.com',
      Referer: 'https://www.imdb.com/',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: Q, variables: { id } }),
  });
  const t = (await r.json())?.data?.title;

  console.log(`${id} ${t?.titleText?.text} => ${t?.ratingsSummary?.aggregateRating} (${t?.ratingsSummary?.voteCount})`);
}
