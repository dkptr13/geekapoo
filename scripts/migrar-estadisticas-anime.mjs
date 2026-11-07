/**
 * MIGRACIÓN: agregados de la wiki de anime.
 *
 * Inicializa a 0 los contadores nuevos de las series que todavía no
 * los tengan:
 *
 *   - viewsCount
 *   - communityRatingSum
 *   - communityRatingCount
 *   - communityRatingAvg
 *   - likesCount, si faltara
 *
 * No toca `rating`: esa es la nota externa de IMDb. Tampoco modifica
 * valores válidos ya existentes.
 *
 * Uso:
 *   node scripts/migrar-estadisticas-anime.mjs
 *   node scripts/migrar-estadisticas-anime.mjs --escribir
 */

import {
  coleccion,
  d,
  escribir,
  i,
} from './firestore-rest.mjs';

const ESCRIBIR = process.argv.includes('--escribir');

function numeroDe(doc, campo) {
  const v = doc.f?.[campo];
  if (!v) return null;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  return null;
}

function enteroNoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0;
}

console.log(
  `[stats-anime] Proyecto: geekapoo-7624d · modo: ${
    ESCRIBIR ? 'ESCRITURA' : 'SIMULACIÓN (sin escribir)'
  }`,
);

const animes = await coleccion('animes', {
  select: [
    'title',
    'likesCount',
    'viewsCount',
    'communityRatingSum',
    'communityRatingCount',
    'communityRatingAvg',
  ],
});

const plan = [];

for (const anime of animes) {
  const campos = {};
  const mascara = [];

  const likes = numeroDe(anime, 'likesCount');
  if (!enteroNoNegativo(likes)) {
    campos.likesCount = i(0);
    mascara.push('likesCount');
  }

  const views = numeroDe(anime, 'viewsCount');
  if (!enteroNoNegativo(views)) {
    campos.viewsCount = i(0);
    mascara.push('viewsCount');
  }

  const suma = numeroDe(anime, 'communityRatingSum');
  if (!enteroNoNegativo(suma)) {
    campos.communityRatingSum = i(0);
    mascara.push('communityRatingSum');
  }

  const cuenta = numeroDe(anime, 'communityRatingCount');
  if (!enteroNoNegativo(cuenta)) {
    campos.communityRatingCount = i(0);
    mascara.push('communityRatingCount');
  }

  const media = numeroDe(anime, 'communityRatingAvg');
  if (media === null || !Number.isFinite(media) || media < 0) {
    campos.communityRatingAvg = d(0);
    mascara.push('communityRatingAvg');
  }

  if (mascara.length > 0) {
    plan.push({ id: anime.id, campos, mascara, titulo: anime.f?.title?.stringValue ?? '' });
  }
}

console.log(`[stats-anime] Series leídas: ${animes.length}`);
console.log(`[stats-anime] Series que necesitan inicializar campos: ${plan.length}`);

for (const item of plan.slice(0, 15)) {
  console.log(`  · ${item.id} ${item.titulo ? `(${item.titulo})` : ''}: ${item.mascara.join(', ')}`);
}
if (plan.length > 15) {
  console.log(`  · … y ${plan.length - 15} más`);
}

if (plan.length === 0) {
  console.log('[stats-anime] Todo está ya inicializado.');
} else if (!ESCRIBIR) {
  console.log(
    '[stats-anime] Simulación terminada. Vuelve a ejecutarlo con --escribir para aplicar.',
  );
} else {
  for (const item of plan) {
    await escribir('animes', item.id, item.campos, item.mascara);
  }
  console.log('[stats-anime] Migración aplicada.');
}
