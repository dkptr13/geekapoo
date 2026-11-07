// Contratos de la wiki de estadísticas, sin navegador.
//
//   npx tsx tests/logica.wiki-stats.ts
//
// Fija lo que no puede perderse: rankings en el carril derecho de la
// wiki, módulo de puntuación en la ficha, IMDb separado, visitas con
// deduplicación y agregados protegidos en reglas.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...partes: string[]) => readFileSync(join(raiz, ...partes), 'utf8');

const catalogo = leer('src', 'components', 'wiki', 'CatalogBrowser.tsx');
const rankings = leer(
  'src',
  'components',
  'wiki',
  'WikiPopularityRankings.tsx',
);
const ficha = leer('src', 'components', 'wiki', 'AnimeWiki.tsx');
const ratingCard = leer(
  'src',
  'components',
  'wiki',
  'CommunityRatingCard.tsx',
);
const servicio = leer('src', 'services', 'animeStats.ts');
const funciones = leer('functions', 'src', 'index.ts');
const reglas = leer('firestore.rules');

assert.ok(
  catalogo.includes('aria-label="Rankings de la comunidad"') &&
    catalogo.includes('<WikiPopularityRankings') &&
    catalogo.indexOf('aria-label="Rankings de la comunidad"') <
      catalogo.indexOf('<WikiPopularityRankings'),
  'los rankings deben estar en el carril derecho del catálogo',
);
assert.ok(
  catalogo.includes('order-2') &&
    catalogo.includes('order-3') &&
    catalogo.includes('xl:grid-cols-[260px_minmax(0,1fr)_330px]'),
  'en móvil los rankings van antes del catálogo y en escritorio a la derecha',
);
assert.ok(
  rankings.includes('Series más gustadas') &&
    rankings.includes('Series más vistas') &&
    rankings.includes('Ver todos') &&
    rankings.includes('useWikiRanking(metric, 5)'),
  'deben existir los dos rankings y su enlace «Ver todos»',
);
assert.ok(
  ficha.includes('<CommunityRatingCard') &&
    ficha.includes('Puntuación de IMDb') &&
    ficha.includes('registrarVisitaAnime') &&
    ficha.includes('sessionStorage'),
  'la ficha debe tener puntuación, IMDb y visitas deduplicadas',
);
assert.ok(
  ratingCard.includes('votarAnime') &&
    ratingCard.includes('Puntuación de la comunidad') &&
    ratingCard.includes('Modificar mi voto'),
  'el módulo de puntuación debe votar y permitir cambiar el voto',
);
assert.ok(
  servicio.includes('orderBy(CAMPO_RANKING[metric]') &&
    servicio.includes('limit(limite)') &&
    servicio.includes("'registrarVisitaAnime'") &&
    servicio.includes("'votarAnime'"),
  'los rankings deben consultar agregados ordenados y limitados',
);
assert.ok(
  funciones.includes('registrarVisitaAnime') &&
    funciones.includes('votarAnime') &&
    funciones.includes('VENTANA_VISITA_MS') &&
    funciones.includes('communityRatingSum'),
  'las Cloud Functions deben mantener visitas y votos',
);
assert.ok(
  reglas.includes('sinEstadisticasWiki') &&
    reglas.includes('animeRatings/{animeId}/votes/{uid}') &&
    reglas.includes('animeViewLogs'),
  'las reglas deben proteger agregados, votos y visitas',
);

console.log('  wiki-stats: OK (rankings, IMDb, votos, visitas y reglas)');
