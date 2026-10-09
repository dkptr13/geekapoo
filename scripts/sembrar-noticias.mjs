// Siembra noticias de verdad en el emulador de Firestore.
//    node scripts/sembrar-noticias.mjs
//
// Para mirar el widget con contenido antes de desplegar la función.
//
// ── POR QUÉ HABLA POR REST Y NO CON EL SDK ─────────────────────────
//
// El proyecto tiene `firebase-admin` dentro de `functions/`, no en la
// raíz, así que un script de `scripts/` no lo encuentra. Y meter el
// script dentro de `functions/` para que sí lo encuentre significa
// meter una herramienta de desarrollo en la carpeta que se despliega.
//
// El emulador habla el mismo REST que Firestore de verdad, así que se
// le habla por HTTP y no hace falta ningún SDK. De paso se ve que el
// script no depende de nada de la web.
//
// ── POR QUÉ ESCRIBE EN EL EMULADOR Y NO EN LA WEB ──────────────────
//
// Porque si esto escribiera en producción, el widget enseñaría
// noticias de prueba a quien visitante llegara, y limpiarlo después
// sería trabajo manual. Por eso el script se niega a arrancar si no
// tiene puesto FIRESTORE_EMULATOR_HOST, que es lo único que garantiza
// que está hablando con el emulador.
//
// ── CÓMO SE USA ─────────────────────────────────────────────────────
//
//   1. Con el emulador en marcha, en otra terminal:
//
//        npx firebase emulators:start --only firestore
//
//   2. Y luego este script:
//
//        $env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
//        node scripts/sembrar-noticias.mjs
//
//   3. Y la web, mirando el widget en http://localhost:3000

import { FUENTES_RSS, idDeNoticia, leerFeed, recortarResumen, limpiarResumen } from '../functions/src/rss.ts';

const EMULADOR = process.env.FIRESTORE_EMULATOR_HOST;

if (!EMULADOR) {
  console.error('  esto habla con el emulador, no con la web de verdad.');
  console.error('  hay que poner FIRESTORE_EMULATOR_HOST antes de llamarlo:');
  console.error('');
  console.error('    npx firebase emulators:start --only firestore');
  console.error('    $env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"');
  console.error('    node scripts/sembrar-noticias.mjs');
  console.error('');

  process.exit(1);
}

const PROYECTO = process.env.GCLOUD_PROJECT ?? 'demo-geekapoo-reglas';

const url = (ruta) => `http://${EMULADOR}/v1/projects/${PROYECTO}/databases/(default)/documents/${ruta}`;

/**
 * Escribe un documento en el emulador.
 *
 * Se usa PATCH y no POST: PATCH crea el documento si no existe y lo
 * deja como está si ya existe, que es lo que se quiere aquí. Con POST a
 * la colección, la segunda vez que se siembra daría un 409.
 *
 * @param {string} id
 * @param {object} campos
 * @returns {Promise<boolean>} si se ha escrito
 */
async function escribir(id, campos) {
  const documento = Object.fromEntries(
    Object.entries(campos).map(([clave, valor]) => [clave, { stringValue: String(valor) }]),
  );

  const res = await fetch(url(`news/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // `owner` es la palabra que el emulador entiende como "actua como
      // el administrador", y es el equivalente aqui de lo que hace la
      // Cloud Function con el Admin SDK.
      //
      // Sin esta cabecera el emulador aplica las reglas y responde 403,
      // porque las reglas de `news` no dejan escribir a nadie. Que
      // pase es lo correcto: si este script pudiera escribir sin ella,
      // seria porque las reglas dejan escribir a cualquiera.
      Authorization: 'Bearer owner',
    },
    body: JSON.stringify({ fields: documento }),
  });

  if (!res.ok) throw new Error(`no se pudo escribir ${id}: ${res.status} ${await res.text()}`);

  return true;
}

let escritas = 0;

for (const fuente of FUENTES_RSS) {
  let noticias;

  try {
    noticias = await leerFeed(fuente);
  } catch (e) {
    console.error(`  ${fuente.nombre} no se pudo leer:`, e instanceof Error ? e.message : e);

    continue;
  }

  console.log(`  ${fuente.nombre}: ${noticias.length} noticias leidas`);

  // Se siembran las primeras, que son las que el widget enseña. Con
  // cinco se ve exactamente lo mismo que con ciento treinta, y así el
  // emulador no se llena de cosas.
  for (const noticia of noticias.slice(0, 6)) {
    await escribir(idDeNoticia(fuente.nombre, noticia.enlace), {
      title: noticia.titulo,
      snippet: noticia.resumen,
      link: noticia.enlace,
      sourceName: noticia.fuente,
      pubDate: noticia.fecha,
    });

    escritas++;
  }
}

console.log('');
console.log(`  sembradas ${escritas} noticias`);

// ── LO QUE VA A VER LA GENTE ───────────────────────────────────────
//
// Se enseña como se va a enseñar de verdad, para poder detectar un
// titular que no cabe, un resumen que se corta en tres líneas o una
// fuente que sale vacía. Aquí es donde se ve que el recorte funciona:
// los caracteres de cada resumen y el final del texto.
const leidas = [];

for (const noticia of (await Promise.resolve(leerMapa()))) leidas.push(noticia);

function leerMapa() {
  // Se releen del emulador para comprobar que lo que se guardó es lo
  // que sale, no lo que se quiso guardar. Es la diferencia entre
  // sembrar y comprobar.
  return leerDelEmulador();
}

async function leerDelEmulador() {
  const res = await fetch(`${url('news')}?pageSize=50`);

  if (!res.ok) throw new Error(`no se pudo leer news: ${res.status}`);

  const json = await res.json();

  const documento = (d) =>
    Object.fromEntries(
      Object.entries(d.fields ?? {}).map(([k, v]) => [
        k,
        typeof v.stringValue === 'string' ? v.stringValue : String(v.stringValue ?? ''),
      ]),
    );

  return (json.documents ?? []).map((d) => ({ id: d.name.split('/').pop(), ...documento(d) }));
}

const guardadas = (await leerDelEmulador()).sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

console.log('');
console.log(`  hay ${guardadas.length} en el emulador`);
console.log('');
console.log('  las 5 que vera el widget, en orden:');

for (const n of guardadas.slice(0, 5)) {
  console.log('');
  console.log(`    [${n.sourceName}]  ${n.pubDate}`);
  console.log(`    ${n.title}`);
  console.log(`    ${n.title.length} caracteres de titular`);
  console.log(`    resumen: ${n.snippet}`);
  console.log(`    ${n.snippet.length} caracteres, termina en "${n.snippet.slice(-24)}"`);
}

// ── QUE NO SE CUENTE NADA QUE NO SE PUEDA ENSEÑAR ───────────────────
console.log('');

const sinTitulo = guardadas.filter((n) => n.title === '').length;
const sinResumen = guardadas.filter((n) => n.snippet === '').length;
const sinEnlace = guardadas.filter((n) => !n.link.startsWith('https://')).length;

if (sinTitulo || sinResumen || sinEnlace) {
  console.error(`  hay documentos que se verían mal: ${sinTitulo} sin titulo, ${sinResumen} sin resumen, ${sinEnlace} sin enlace`);

  process.exit(1);
}

console.log('  todas tienen titulo, resumen y enlace');
console.log('  ya puedes mirar el widget en http://localhost:3000');
