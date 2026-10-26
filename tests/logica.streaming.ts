/**
 * Comprobaciones de la lógica de «Dónde verla» y de la región
 * preferida, sin navegador y sin emulador.
 *
 * Lo que se protege aquí:
 *   1. La precedencia perfil > navegador > España.
 *   2. Que una plataforma antigua no se duplique si ya tiene fila.
 *   3. Que las plataformas antiguas queden como «Sin verificar» y
 *      sin enlace.
 *   4. Que «Disponible» sea el primer estado y que una fila rota no
 *      invente región ni disponibilidad.
 *   5. Que la misma plataforma pueda estar disponible en un país,
 *      no disponible en otro y pendiente en un tercero.
 *
 *   npm run test:logica
 */
import assert from 'node:assert/strict';

import {
  normalizarCodigoRegion,
  plataformaIdDeNombre,
  REGION_POR_DEFECTO,
} from '../src/data/streaming';
import {
  construirTarjetas,
  esUrlHttp,
  formatearFechaVerificacion,
  normalizarDisponibilidad,
} from '../src/services/streamingAvailabilityLogic';
import {
  REGION_STORAGE_KEY,
  guardarRegionGuardada,
  leerRegionGuardada,
  resolverRegion,
  type StorageLike,
} from '../src/services/regionPreference';
import type { StreamingAvailability, StreamingPlatform } from '../src/types';

function memoria(): StorageLike & { datos: Map<string, string> } {
  const datos = new Map<string, string>();

  return {
    datos,
    getItem: (key) => datos.get(key) ?? null,
    setItem: (key, value) => {
      datos.set(key, value);
    },
  };
}

// ── Región preferida ──────────────────────────────────

assert.equal(normalizarCodigoRegion(' es '), 'ES');
assert.equal(normalizarCodigoRegion('mx'), 'MX');
assert.equal(normalizarCodigoRegion('LATAM'), 'LATAM');
assert.equal(normalizarCodigoRegion('E'), null);
assert.equal(normalizarCodigoRegion('ES-1'), null);
assert.equal(normalizarCodigoRegion(null), null);

assert.deepEqual(resolverRegion('MX', 'ES'), { code: 'MX', origen: 'profile' });
assert.deepEqual(resolverRegion(null, 'MX'), { code: 'MX', origen: 'local' });
assert.deepEqual(resolverRegion(null, null), {
  code: REGION_POR_DEFECTO,
  origen: 'default',
});
assert.deepEqual(resolverRegion('no válido', 'CO'), { code: 'CO', origen: 'local' });

const storage = memoria();
guardarRegionGuardada('mx', storage);
assert.equal(storage.datos.get(REGION_STORAGE_KEY), 'MX');
assert.equal(leerRegionGuardada(storage), 'MX');

// Un almacenamiento roto no puede romper la wiki.
const roto: StorageLike = {
  getItem: () => {
    throw new Error('sin acceso');
  },
  setItem: () => {
    throw new Error('sin acceso');
  },
};
assert.equal(leerRegionGuardada(roto), null);
assert.doesNotThrow(() => guardarRegionGuardada('MX', roto));

// ── Plataformas antiguas ──────────────────────────────

assert.equal(plataformaIdDeNombre('Crunchyroll'), 'crunchyroll');
assert.equal(plataformaIdDeNombre('Amazon Prime'), 'amazon-prime-video');
assert.equal(plataformaIdDeNombre('Disney+'), 'disney-plus');
assert.equal(plataformaIdDeNombre('Selecta Visión'), 'selecta-vision');
assert.equal(plataformaIdDeNombre('Plataforma Nueva'), 'plataforma-nueva');

// ── Filas de disponibilidad ───────────────────────────

const plataformas: StreamingPlatform[] = [
  { id: 'crunchyroll', name: 'Crunchyroll', badgeColor: '#f47521' },
  { id: 'netflix', name: 'Netflix', badgeColor: '#e11d48' },
  { id: 'nueva', name: 'Nueva', badgeColor: '#22c55e' },
];

const registros: StreamingAvailability[] = [
  {
    id: 'a1__crunchyroll__ES',
    animeId: 'a1',
    platformId: 'crunchyroll',
    region: 'ES',
    status: 'available',
    accessType: 'subscription',
    url: 'https://example.com/crunchyroll-es',
    verifiedAt: '2026-03-12',
  },
  {
    id: 'a1__netflix__ES',
    animeId: 'a1',
    platformId: 'netflix',
    region: 'ES',
    status: 'unavailable',
    verifiedAt: '2026-03-10',
  },
  {
    id: 'a1__nueva__ES',
    animeId: 'a1',
    platformId: 'nueva',
    region: 'ES',
    status: 'unverified',
    url: 'https://example.com/no-se-debe-pintar',
    verifiedAt: '2026-01-01',
  },
];

const tarjetas = construirTarjetas({
  registros,
  region: 'ES',
  platforms: plataformas,
  legado: [
    // Ya tiene fila regional: no debe duplicarse.
    { name: 'Crunchyroll', url: 'https://example.com/viejo' },
    // Dato antiguo sin país: se queda como Sin verificar.
    {
      name: 'Hulu',
      url: 'https://example.com/hulu',
      badgeColor: '#1ce783',
      regions: ['ES'],
    },
    // Duplicado del anterior: una sola tarjeta.
    { name: 'hulu', url: 'https://example.com/hulu-2' },
  ],
});

assert.equal(tarjetas.length, 4);
assert.deepEqual(
  tarjetas.map((card) => card.name),
  ['Crunchyroll', 'Netflix', 'Hulu', 'Nueva'],
);
assert.deepEqual(
  tarjetas.map((card) => card.status),
  ['available', 'unavailable', 'unverified', 'unverified'],
);

const [crunchyroll, netflix, hulu, nueva] = tarjetas;

assert.equal(crunchyroll.url, 'https://example.com/crunchyroll-es');
assert.equal(crunchyroll.accessType, 'subscription');
assert.equal(crunchyroll.legacy, false);

assert.equal(netflix.url, undefined);
assert.equal(hulu.legacy, true);
assert.equal(hulu.status, 'unverified');
assert.equal(hulu.url, undefined, 'las regiones antiguas no confirman el enlace');
assert.equal(nueva.url, undefined, 'una fila sin verificar no debe llevar enlace');
assert.equal(
  nueva.verifiedAt,
  undefined,
  'una fila sin verificar no debe mostrar fecha de verificación',
);
assert.equal(nueva.legacy, false);

// La misma obra y plataforma puede tener estados distintos por país.
const porPais = [
  {
    id: 'a1__netflix__ES',
    animeId: 'a1',
    platformId: 'netflix',
    region: 'ES',
    status: 'available' as const,
    url: 'https://example.com/netflix-es',
  },
  {
    id: 'a1__netflix__MX',
    animeId: 'a1',
    platformId: 'netflix',
    region: 'MX',
    status: 'unavailable' as const,
  },
];

const tarjetasES = construirTarjetas({
  registros: porPais.filter((row) => row.region === 'ES'),
  region: 'ES',
  platforms: plataformas,
  legado: [{ name: 'Netflix', url: '' }],
});
const tarjetasMX = construirTarjetas({
  registros: porPais.filter((row) => row.region === 'MX'),
  region: 'MX',
  platforms: plataformas,
  legado: [{ name: 'Netflix', url: '' }],
});
const tarjetasAR = construirTarjetas({
  registros: [],
  region: 'AR',
  platforms: plataformas,
  legado: [{ name: 'Netflix', url: '' }],
});

assert.deepEqual(
  tarjetasES.map((card) => [card.status, card.url]),
  [['available', 'https://example.com/netflix-es']],
);
assert.deepEqual(
  tarjetasMX.map((card) => [card.status, card.url]),
  [['unavailable', undefined]],
);
assert.deepEqual(
  tarjetasAR.map((card) => [card.status, card.legacy]),
  [['unverified', true]],
);

assert.equal(esUrlHttp('https://example.com'), true);
assert.equal(esUrlHttp('http://example.com'), true);
assert.equal(esUrlHttp('javascript:alert(1)'), false);
assert.equal(esUrlHttp('no es una url'), false);

assert.equal(formatearFechaVerificacion('2026-03-12').includes('2026'), true);
assert.equal(formatearFechaVerificacion(''), '');

assert.equal(
  normalizarDisponibilidad({
    animeId: 'a1',
    platformId: 'crunchyroll',
    region: 'es',
    status: 'available',
    accessType: 'subscription',
    url: 'https://example.com',
  })?.region,
  'ES',
);
assert.equal(
  normalizarDisponibilidad({
    animeId: 'a1',
    platformId: 'crunchyroll',
    region: '',
    status: 'available',
  }),
  null,
);
assert.equal(
  normalizarDisponibilidad({
    animeId: 'a1',
    platformId: 'crunchyroll',
    region: 'ES',
    status: 'inventado',
  }),
  null,
);
assert.equal(
  normalizarDisponibilidad({
    animeId: 'a1',
    platformId: 'crunchyroll',
    region: 'ES',
    status: 'available',
    url: 'javascript:alert(1)',
  })?.url,
  undefined,
);

console.log('  ✓ streaming regional: región, herencia y estados');
