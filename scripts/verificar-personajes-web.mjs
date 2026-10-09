import { tokenDeAcceso } from './token-firebase.mjs';
// Comprueba, sobre la web de verdad, que cada personaje sale en las
// temporadas en las que debe salir.
//
//   node scripts/verificar-personajes-web.mjs [mt|aot|ysa|tg|agk]
//
// Por que hace falta esto y no basta con mirar Firestore: en el
// documento el dato esta bien (eso lo comprueba
// `verificar-anime.mjs`), pero lo que importa es lo que pinta la
// wiki. Si un personaje lleva un `seasonIds` equivocado, en Firestore
// se ve perfecto y en la pagina aparece en capitulos donde no sale.
//
// Y hay una trampa concreta: `seasonIds` VACIO significa "sale en
// todas". Un personaje de la primera temporada con el array vacio se
// muestra en la tercera, y no hay ningun error en consola: la web
// hace exactamente lo que le piden los datos.
//
// No usa navegador: lee la misma consulta que hace la wiki
// (personajeEnTemporada) contra los documentos reales, que es lo que
// decide que se pinta.
//
// ── POR QUE EL ANIME ENTRA POR ARGUMENTO ──────────────────
//
// Estaba con Mushoku Tensei pegado en tres sitios: el id de Firestore,
// la lista de temporadas y el import de los datos. Anadir un anime mas
// sin tocar nada de eso era imposible, asi que el prefijo se lee de la
// linea de ordenes como en `comprobar-datos.mjs`. Sin argumento sigue
// mirando Mushoku Tensei, que es como se usaba antes.

import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const prefijo = process.argv[2] ?? 'mt';

const { ANIME_ID, TEMPORADAS: TEMPORADAS_META } = await import(
  new URL(`./datos/${prefijo}-meta.mjs`, import.meta.url)
);

const ruta = join(
  process.env.USERPROFILE || homedir(),
  '.config',
  'configstore',
  'firebase-tools.json',
);
const token = await tokenDeAcceso();
const headers = { Authorization: `Bearer ${token}` };

async function todos(col) {
  const fuera = [];
  let pagina = '';
  do {
    const r = await fetch(`${BASE}/${col}?pageSize=300${pagina}`, { headers });
    const j = await r.json();
    if (j.error) throw new Error(`${col}: ${JSON.stringify(j.error)}`);
    fuera.push(...(j.documents ?? []));
    pagina = j.nextPageToken ? `&pageToken=${encodeURIComponent(j.nextPageToken)}` : '';
  } while (pagina);
  return fuera;
}

const personajes = (await todos('characters')).filter(
  (d) => d.fields.animeId?.stringValue === ANIME_ID,
);

const TEMPORADAS = TEMPORADAS_META.map((t) => t.numero);
const idT = (n) => `${ANIME_ID}-s${n}`;

// ──────────────────────────────────────────────────────────
// EL MISMO CRITERIO QUE USA LA WIKI
// ──────────────────────────────────────────────────────────
//
// Copiado de `personajeEnTemporada` en `utils/seasonData.ts`, que es
// el que decide si un personaje se pinta en una ficha. Si aqui se
// escribiera otra cosa, esta comprobacion comprobaria una regla
// distinta de la que se aplica y no serviria de nada.

const idsDe = (doc) => {
  const v = doc.fields.seasonIds?.arrayValue?.values;
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.map((x) => x.stringValue).filter((s) => s !== '')));
};

const enTemporada = (doc, sid) => {
  const ids = idsDe(doc);
  return ids.length === 0 || ids.includes(sid);
};

// ──────────────────────────────────────────────────────────
// LA ESPERADA, EN EL FICHERO DE DATOS
// ──────────────────────────────────────────────────────────

const { PERSONAJES } = await import(new URL(`./datos/${prefijo}-personajes.mjs`, import.meta.url));

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const fallos = [];
let comprobados = 0;

for (const [nombre, temporada] of PERSONAJES) {
  const doc = personajes.find(
    (d) => d.fields.name?.stringValue === nombre,
  );

  if (!doc) {
    fallos.push(`falta el personaje ${nombre} en Firestore`);
    continue;
  }

  const comprobarEn = TEMPORADAS.map((n) => {
    const esperado = temporada === '' || temporada.split(',').includes(String(n));
    const real = enTemporada(doc, idT(n));
    comprobados++;
    if (esperado !== real) {
      fallos.push(
        `${nombre}: en la T${n} la wiki ${real ? 'lo enseña' : 'no lo enseña'} y ` +
          `el dato dice que ${esperado ? 'debería' : 'no debería'}`,
      );
    }
    return { n, esperado, real };
  });

  const donde = comprobarEn.filter((c) => c.real).map((c) => 'T' + c.n).join('+');
  const todas = TEMPORADAS.map((n) => 'T' + n).join('+');
  const debe = temporada === '' ? todas : temporada.split(',').map((n) => 'T' + n).join('+');

  if (donde !== debe) {
    fallos.push(`${nombre}: se enseña en ${donde} y el dato dice ${debe}`);
  }

  // El slug del personaje es la URL de su ficha. Si no coincide con
  // el que construye el panel, el enlace que comparta alguien no
  // lleva a la ficha.
  const slug = doc.fields.slug?.stringValue ?? '';
  if (slug !== slugify(nombre)) {
    fallos.push(`${nombre}: el slug guardado es "${slug}" y debería ser "${slugify(nombre)}"`);
  }
}

console.log(`  ${ANIME_ID}`);
console.log(`  Comprobaciones temporada/personaje: ${comprobados}`);
console.log(`  Personajes: ${PERSONAJES.length}`);
console.log('');

if (fallos.length === 0) {
  console.log('  Cada personaje se enseña exactamente en las temporadas que debe.');
} else {
  console.log(`  ${fallos.length} FALLOS:`);
  for (const f of fallos.slice(0, 20)) console.log(`    - ${f}`);
  process.exitCode = 1;
}