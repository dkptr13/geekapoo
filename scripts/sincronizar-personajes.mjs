// Sincroniza el campo `seasonIds` de los personajes con lo que dicen los
// ficheros de datos, para los animes que los tienen.
//
//   node scripts/sincronizar-personajes.mjs <prefijo>
//
//   node scripts/sincronizar-personajes.mjs sin    (todos)
//
// ── POR QUE HACE FALTA ──────────────────────────────────────
//
// Los personajes se escriben con `crearSiNoExiste`, que sin `--actualizar`
// no toca lo que ya esta. Si despues se corrige una temporada en
// `<prefijo>-personajes.mjs`, el fichero y Firestore se quedan
// desincronizados: el fichero dice una cosa y la wiki ensea otra, y el
// error no se ve hasta que alguien mira el reparto de una temporada.
//
// En Mushoku Tensei paso eso con cinco personajes.
//
// ── POR QUE SOLO `seasonIds` ──────────────────────────────────
//
// Es el unico campo que cambia al corregir repartos, y el unico que se
// puede parchear a pelo sin riesgo. Los demas (nombre, voz, descripcion)
// los escribe `cargar-anime.mjs --actualizar`, que si los toca todos.
//
// El PATCH va con mascara de un solo campo para no reescribir
// `createdAt` ni nada mas, que es lo que hacia `cargar-anime`.

import { tokenDeAcceso } from './token-firebase.mjs';

const BASE = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}/databases/(default)/documents`;

/** Los prefijos que tienen `<prefijo>-personajes.mjs` y `<prefijo>-meta.mjs`. */
const PREFIJOS = ['mt', 'aot', 'ysa', 'tg', 'agk', 'onk'];

const pedido = process.argv[2];
const prefijos = pedido && pedido !== 'sin' ? [pedido] : PREFIJOS;

const token = await tokenDeAcceso();
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const url = (p) => new URL(p, import.meta.url).href;
const idTemporada = (animeId, n) => `${animeId}-s${n}`;

let totalCorregidos = 0;

for (const prefijo of prefijos) {
  const base = url('./datos/');

  const meta = await import(new URL(`${prefijo}-meta.mjs`, base));
  const { PERSONAJES } = await import(new URL(`${prefijo}-personajes.mjs`, base));
  const animeId = meta.ANIME_ID;

  // El numero de temporadas, para poder avisar de una temporada que ya no
  // exista en el fichero.
  const numeros = new Set(meta.TEMPORADAS.map((t) => t.numero));

  console.log(`\n${prefijo} (${animeId})`);

  for (const [nombre, temporada] of PERSONAJES) {
    const temporadas = temporada === '' ? [] : temporada.split(',').map(Number);
    const esperado = temporadas.map((n) => idTemporada(animeId, n));

    const sobrante = temporadas.find((n) => !numeros.has(n));
    if (sobrante !== undefined) {
      console.log(`  AVISO: "${nombre}" apunta a la T${sobrante}, que no esta en TEMPORADAS`);
    }

    const id = `${animeId}-${nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)}`;

    const actual = await fetch(`${BASE}/characters/${id}`, { headers });

    if (!actual.ok) {
      console.log(`  NO EXISTE en Firestore: ${nombre}`);
      continue;
    }

    const guardados = ((await actual.json()).fields.seasonIds?.arrayValue?.values ?? []).map(
      (x) => x.stringValue,
    );

    const igual =
      guardados.length === esperado.length &&
      [...guardados].sort().join(',') === [...esperado].sort().join(',');

    if (igual) continue;

    const r = await fetch(
      `${BASE}/characters/${id}?updateMask.fieldPaths=seasonIds`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: { seasonIds: { arrayValue: { values: esperado.map((x) => ({ stringValue: x })) } } },
        }),
      },
    );

    totalCorregidos++;

    console.log(
      `  ${nombre}: [${guardados.join(', ') || 'vacio'}] -> [${esperado.join(', ') || 'vacio'}]` +
        `${r.ok ? '' : ` ERROR ${r.status}`}`,
    );
  }
}

console.log(`\n${totalCorregidos} personajes corregidos`);