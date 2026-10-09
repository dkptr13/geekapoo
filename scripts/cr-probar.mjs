// Prueba si el token de Crunchyroll sirve y que endpoint responde.
//    $env:CR_SESSION='erp-rt=...'
//    node scripts/cr-probar.mjs
//
// El token NO se escribe en ningun fichero: se lee de una variable de
// entorno y se queda en memoria. Por eso este script no imprime nunca su
// valor, ni entero ni en parte.
//
// El nombre de la variable es `CR_SESSION` y no `CRUNCHYROLL_TOKEN` a
// proposito: hay entornos que filtran las variables cuyo nombre lleva la
// palabra TOKEN, y hace que el valor llegue como indefinido sin avisar.
//
// Lo que se averigua aqui:
//   1. Si el token se cambia por un token de acceso.
//   2. Que URL de la API responde y con que cabeceras.
//
// El flujo de Crunchyroll es un OAuth de refresh token: el `erp_rt` de la
// cookie se canjea por un token de acceso de corta duracion haciendo un
// POST a /auth/v1/token con el grant type de cookie.
// El flujo de Crunchyroll es un OAuth de refresh token: el `erp_rt` de la
// cookie se canjea por un token de acceso de corta duracion haciendo un
// POST a /auth/v1/token con el grant type de cookie.

const token = process.env.CR_SESSION ?? process.env.CRUNCHYROLL_TOKEN;
if (!token) {
  console.error('  falta CRUNCHYROLL_TOKEN');
  process.exit(1);
}

// El usuario puede pegar el cookie entero (`erp_rt=xxx`) o solo el valor.
const valor = token.includes('=') ? token.slice(token.indexOf('=') + 1) : token;

console.log(`token recibido: ${valor.length} caracteres (no se imprime ningun trozo)`);

const CABECERAS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Origin: 'https://www.crunchyroll.com',
  Referer: 'https://www.crunchyroll.com/',
  Cookie: `otp=; policy={"consent":{"timestamp":${Date.now() / 1000},"consent_version":"1"},"lo":opt_out,"l":en,"oldest":{}}; erp_rt=${valor}`,
};

async function canjear() {
  const r = await fetch('https://www.crunchyroll.com/auth/v1/token', {
    method: 'POST',
    headers: CABECERAS,
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:erp_cookie',
    }),
  });

  const texto = await r.text();

  console.log(`\nPOST /auth/v1/token  ->  ${r.status}`);

  let d;

  try {
    d = JSON.parse(texto);
  } catch {
    console.log('  respuesta no JSON: ' + texto.slice(0, 200));
    return null;
  }

  if (d.token) {
    console.log(`  access token: ${String(d.token.token_type ?? '')} ${d.token.access_token?.slice(0, 12)}...`);
    console.log(`  caduca en: ${d.token.expires_in} s`);
    return d.token.access_token;
  }

  console.log('  ' + JSON.stringify(d).slice(0, 300));

  return null;
}

const acceso = await canjear();

if (!acceso) {
  console.log('\nEl token no se ha canjeado.');
  process.exit(0);
}

// Con el token de acceso, a ver que se puede leer.
const CON_ACCESO = {
  ...CABECERAS,
  Authorization: `Bearer ${acceso}`,
  'Content-Type': 'application/json',
};

console.log('\nProbando la API con el token de acceso:');

const pruebas = [
  ['https://api.crunchyroll.com/countries', 'paises'],
  ['https://www.crunchyroll.com/content/v2/discover/query?type=anime_series&limit=1', 'descubrir'],
  ['https://api.crunchyroll.com/titles/GRSERIES-12345/episodes', 'episodios'],
];

for (const [url, nombre] of pruebas) {
  try {
    const r = await fetch(url, { headers: CON_ACCESO });

    const texto = await r.text();

    console.log(`  ${nombre.padEnd(12)} ${r.status}  ${texto.slice(0, 150).replace(/\n/g, ' ')}`);
  } catch (e) {
    console.log(`  ${nombre.padEnd(12)} ERROR  ${e.message}`);
  }
}