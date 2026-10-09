// Pone `episodesCount` y `rating` de los animes que tienen fichero de datos.
//
//   node scripts/actualizar-contadores.mjs
//
// ── POR QUE ──────────────────────────────────────────────────────
//
// `verificar-anime.mjs` comprueba que `episodesCount` del anime coincida con
// el total de capitulos de los ficheros. El campo se escribe al final de
// `cargar-anime.mjs`, pero en los animes antiguos se quedo con el numero de
// la primera temporada: AOT decia 33 (que es lo que tiene el manga) y
// Oshi no Ko decia 11.
//
// No se relanza `cargar-anime --actualizar` para arreglarlo porque ese
// script hace un PATCH de TODOS los campos de cada personaje, incluido
// `imageUrl`, que los personajes subidos por el panel si tienen. Aqui solo
// se tocan los dos campos del anime, con su mascara.

import { tokenDeAcceso } from './token-firebase.mjs';

const PREFIJOS = ['mt', 'aot', 'ysa', 'tg', 'agk', 'onk', 'wha'];

const token = await tokenDeAcceso();
const BASE = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}/databases/(default)/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

for (const prefijo of PREFIJOS) {
  const base = new URL('./datos/', import.meta.url);

  const meta = await import(new URL(`${prefijo}-meta.mjs`, base));

  // El total no es la suma de las temporadas: hay capitulos "extra" (el
  // 0.5 de Mushoku, el 15.5) y `EPISODIOS_TOTAL` ya los cuenta.
  const total = meta.EPISODIOS_TOTAL;
  const nota = meta.RATING_SERIE;

  const r = await fetch(
    `${BASE}/animes/${meta.ANIME_ID}?updateMask.fieldPaths=episodesCount&updateMask.fieldPaths=rating`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: {
          episodesCount: { integerValue: String(total) },
          rating: { doubleValue: nota },
        },
      }),
    },
  );

  console.log(`  ${r.ok ? 'ok' : `ERROR ${r.status}`}  ${meta.ANIME_ID}: ${total} capitulos, nota ${nota}`);
}