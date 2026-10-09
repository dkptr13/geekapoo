// Prueba la API de TVDB.
//    $env:TVDB_KEY='...'
//    node scripts/tvdb-probar.mjs [<nombre-anime>]
//
// TVDB usa la API v4, que es un OAuth simplificado: se canjea la clave
// por un token que dura 24 horas con un POST a /v4/login, y ese token es
// el que va en `Authorization: Bearer`.
//
// La clave NO se escribe en ningun fichero: se lee de la variable de
// entorno TVDB_KEY. El nombre no lleva la palabra TOKEN a proposito, porque
// hay entornos que filtran las variables con ese nombre en el nombre y el
// valor llega como indefinido sin avisar.
//
// Esto solo hace un canje y una busqueda: sirve para ver si la clave vale
// y si TVDB tiene capitulos con imagen de un anime concreto.

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

console.log(`clave recibida: ${clave.length} caracteres, formato ${clave.includes('-') ? 'con guiones' : 'sin guiones'}`);

const CABECERAS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'geekapoo-script/1.0',
};

// ── 1. Canjear la clave por un token ───────────────────────────────

const login = await fetch('https://api4.thetvdb.com/v4/login', {
  method: 'POST',
  headers: CABECERAS,
  body: JSON.stringify({ apikey: clave }),
});

const cuerpoLogin = await login.json();

if (!login.ok || !cuerpoLogin?.data?.token) {
  console.log(`\nlogin -> ${login.status}  ${JSON.stringify(cuerpoLogin).slice(0, 220)}`);
  process.exit(1);
}

const token = cuerpoLogin.data.token;

console.log(`login -> ${login.status}  token de ${token.length} caracteres`);

// ── 2. Buscar un anime ─────────────────────────────────────────────

const nombre = process.argv[2] ?? 'Grand Blue';

const conToken = {
  ...CABECERAS,
  Authorization: `Bearer ${token}`,
};

const r = await fetch(
  `https://api4.thetvdb.com/v4/search?query=${encodeURIComponent(nombre)}&type=series&limit=5`,
  { headers: conToken },
);

const d = await r.json();

console.log(`\nbuscar "${nombre}" -> ${r.status}`);

for (const s of d?.data ?? []) {
  console.log(`  ${String(s.tvdb_id).padEnd(9)} ${s.type.padEnd(8)} ${s.name}`);
  console.log(`            year: ${s.year ?? '?'}  status: ${s.status ?? '?'}  country: ${s.country ?? '?'}`);
}

// ── 3. Ver si hay capitulos con imagen ─────────────────────────────

const primero = d?.data?.[0];

if (!primero) {
  console.log('\nninguna serie encontrada');
  process.exit(0);
}

const r2 = await fetch(
  `https://api4.thetvdb.com/v4/series/${primero.tvdb_id}/episodes/default?page=0`,
  { headers: conToken },
);

const e = await r2.json();

const lista = e?.data?.episodes ?? [];

console.log(`\nepisodios de "${primero.name}": ${e?.data?.count ?? '?'}`);

let conImagen = 0;

for (const ep of lista.slice(0, 40)) {
  const tiene = ep.thumbnail ? 'thumb' : ep.image ? 'image' : '     ';

  if (ep.thumbnail || ep.image) conImagen++;

  console.log(
    `  S${String(ep.seasonNumber).padStart(2)}E${String(ep.number).padStart(3)}  ` +
      `${tiene}  ${String(ep.name ?? '').slice(0, 44).padEnd(46)}${String(ep.thumbnail ?? ep.image ?? '').slice(0, 70)}`,
  );
}

console.log(`\n${conImagen} de ${Math.min(40, lista.length)} con imagen`);