// Prueba de la API pública de JustWatch usada por su propia web.
const URL_GQL = 'https://apis.justwatch.com/graphql';

const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const Q = `query Ofertas($id: ID!) {
  node(id: $id) {
    ... on MovieOrShow {
      content(country: ES, language: es) { title originalReleaseYear fullPath }
      es: offers(country: ES, platform: WEB) { monetizationType standardWebURL package { clearName } }
      mx: offers(country: MX, platform: WEB) { monetizationType standardWebURL package { clearName } }
      ar: offers(country: AR, platform: WEB) { monetizationType standardWebURL package { clearName } }
      us: offers(country: US, platform: WEB) { monetizationType standardWebURL package { clearName } }
      jp: offers(country: JP, platform: WEB) { monetizationType standardWebURL package { clearName } }
    }
  }
}`;

const r = await fetch(URL_GQL, {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ query: Q, variables: { id: 'ts20066' } }),
});
console.log('HTTP', r.status);
const d = await r.json();
if (d.errors) console.log('errores:', JSON.stringify(d.errors).slice(0, 800));
console.log(JSON.stringify(d.data, null, 1).slice(0, 3000));
