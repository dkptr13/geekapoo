// Anade las plataformas de streaming de un anime que ya esta creado.
//
//   node scripts/anadir-plataformas.mjs <prefijo>
//
// ── POR QUE HACE FALTA ESTE SCRIPT Y POR QUE NO ESTA EN EL DE
// CREAR ──────────────────────────────────────────────────────
//
// `crear-anime.mjs` escribe `streaming: []` porque en el momento de
// crear un anime desde consola no se sabe donde se emite, y porque las
// plataformas son de la SERIE entera y no cambian entre temporadas.
// Cuando ya semirenda ese dato, se anade con este.
//
// Se escribe SOLO el campo `streaming` y con la mascara de campos:
// sin ella el PATCH de Firestore borra del documento todo lo que no
// venga en el cuerpo, y el anime se quedaria sin sinopsis, sin
// categorias y sin nota.
//
// ── LOS DATOS ─────────────────────────────────────────────
//
// Van en `datos/<prefijo>-meta.mjs`, en `STREAMING`, y no aqui: el
// nombre del anime no aparece en ningun sitio de este fichero, que es
// lo mismo que hacen `crear-anime.mjs` y `cargar-anime.mjs`.
//
// De donde sale cada plataforma:
//   · Crunchyroll  -> la licencia mundial salvo Asia (ficha de la
//                     Wikipedia en espanol).
//   · Selecta Vision-> el doblaje al espanol (misma ficha).
//   · Netflix      -> listado en "Otras cadenas" de la ficha.

import { tokenDeAcceso } from './token-firebase.mjs';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const prefijo = process.argv[2];

if (!prefijo || prefijo.startsWith('-')) {
  console.error('Falta el prefijo del anime. Uso:');
  console.error('  node scripts/anadir-plataformas.mjs <mt|aot|ysa|tg|agk>');
  process.exit(1);
}

const { ANIME_ID, STREAMING } = await import(
  new URL(`./datos/${prefijo}-meta.mjs`, import.meta.url)
);

if (!STREAMING || STREAMING.length === 0) {
  console.error(`  ${prefijo}-meta.mjs no declara STREAMING. No se toca nada.`);
  process.exit(1);
}

const token = await tokenDeAcceso();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const v = {
  str: (s) => ({ stringValue: String(s) }),
  arr: (items) => ({ arrayValue: { values: items } }),
};

const mapa = (p) => ({
  mapValue: {
    fields: {
      name: v.str(p.name),
      url: v.str(p.url),
      badgeColor: v.str(p.badgeColor ?? ''),
      ...(p.regions ? { regions: v.arr(p.regions.map((r) => v.str(r))) } : {}),
    },
  },
});

const r = await fetch(`${BASE}/animes/${ANIME_ID}?updateMask.fieldPaths=streaming`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ fields: { streaming: v.arr(STREAMING.map(mapa)) } }),
});

if (!r.ok) {
  console.error(`\n  NO SE PUDO ESCRIBIR (${r.status})\n`);
  console.error(await r.text(), '\n');
  process.exit(1);
}

console.log(`\n  animes/${ANIME_ID}: ${STREAMING.length} plataformas`);
for (const p of STREAMING) console.log(`    ${p.name}  ${p.url}`);
console.log('');