/**
 * Comprobaciones de la personalizacion del perfil, sin navegador
 * y sin emulador.
 *
 * Lo que se comprueba aqui es la resolucion (valor guardado ->
 * lo que se pinta) y los desbloqueos por nivel. Si un color
 * bloqueado se pintara, o un banner de otro nivel se colara, no
 * daria ningun error: la pagina se veria igual, solo que
 * mintiendo sobre lo desbloqueado.
 *
 *   npm run test:logica
 *
 * Se escribe SIN TILDES, como los otros modulos de logica.
 */
import assert from 'node:assert/strict';

import {
  BANNERS_PERFIL,
  BANNER_PREDETERMINADO_ID,
  BANNER_PROPIO_NIVEL,
  COLORES_PERFIL,
  COLOR_POR_DEFECTO,
  MARCOS_AVATAR,
  PREFIJO_BANNER,
  VITRINAS,
  VITRINAS_POR_DEFECTO,
  bannerDePerfil,
  colorDePerfil,
  desbloqueadoPorNivel,
  fondoAGuardar,
  fondoDePerfil,
  marcoDeAvatar,
  sujetarDecoracion,
} from '../src/data/profileCustomization';

// ──────────────────────────────────────────────────────────
// 1. LOS COLORES
// ──────────────────────────────────────────────────────────

assert.equal(colorDePerfil(undefined, 1), COLOR_POR_DEFECTO, 'sin color sale el de la casa');
assert.equal(colorDePerfil('#8b5cf6', 1), '#8b5cf6', 'el violeta vale en nivel 1');
assert.equal(
  colorDePerfil('#ffffff', 60),
  COLOR_POR_DEFECTO,
  'un hex inventado cae al defecto aunque seas nivel 60',
);
assert.equal(
  colorDePerfil('#eab308', 9),
  COLOR_POR_DEFECTO,
  'el dorado (nivel 10) no se pinta en nivel 9',
);
assert.equal(colorDePerfil('#eab308', 10), '#eab308', 'el dorado se pinta en nivel 10');
assert.equal(colorDePerfil('#8B5CF6', 1), '#8b5cf6', 'el hex vale en mayusculas');

// Cada color desbloqueado para su nivel minimo exacto.
for (const c of COLORES_PERFIL) {
  assert.equal(
    colorDePerfil(c.hex, c.nivelMinimo),
    c.hex,
    `${c.id} se pinta en su nivel minimo (${c.nivelMinimo})`,
  );
  if (c.nivelMinimo > 1) {
    assert.equal(
      colorDePerfil(c.hex, c.nivelMinimo - 1),
      COLOR_POR_DEFECTO,
      `${c.id} no se pinta un nivel antes`,
    );
  }
}

// ──────────────────────────────────────────────────────────
// 2. LOS BANNERS
// ──────────────────────────────────────────────────────────

const defecto = BANNERS_PERFIL[0].css;

const sinBanner = bannerDePerfil(undefined, 1);
assert.equal(sinBanner.tipo, 'preset', 'sin banner sale un preset');
assert.equal(
  (sinBanner as { tipo: 'preset'; css: string }).css,
  defecto,
  'y es el de la casa',
);

const presetOk = bannerDePerfil(`${PREFIJO_BANNER}ocaso`, 1);
assert.equal(presetOk.tipo, 'preset', 'un preset libre sale');
assert.ok(
  (presetOk as { tipo: 'preset'; css: string }).css !== defecto,
  'y no es el de la casa',
);

assert.equal(
  bannerDePerfil(`${PREFIJO_BANNER}abismo`, 2).tipo,
  'preset',
  'un preset bloqueado sigue siendo preset',
);
assert.equal(
  (bannerDePerfil(`${PREFIJO_BANNER}abismo`, 2) as { tipo: 'preset'; css: string }).css,
  defecto,
  'pero cae al de la casa',
);
assert.ok(
  (bannerDePerfil(`${PREFIJO_BANNER}abismo`, 3) as { tipo: 'preset'; css: string }).css !==
    defecto,
  'y se pinta al llegar al nivel',
);

assert.equal(
  bannerDePerfil(`${PREFIJO_BANNER}inventado`, 60).tipo,
  'preset',
  'un preset inventado no rompe',
);
assert.equal(
  (bannerDePerfil(`${PREFIJO_BANNER}inventado`, 60) as { tipo: 'preset'; css: string }).css,
  defecto,
  'y cae al de la casa',
);

// El banner propio (URL) pide nivel, y http sin s no vale.
assert.equal(
  bannerDePerfil('https://x/y.jpg', BANNER_PROPIO_NIVEL).tipo,
  'url',
  'la URL propia sale con nivel suficiente',
);
assert.equal(
  (bannerDePerfil('https://x/y.jpg', BANNER_PROPIO_NIVEL) as { tipo: 'url'; url: string }).url,
  'https://x/y.jpg',
  'y es la misma URL',
);
assert.equal(
  bannerDePerfil('https://x/y.jpg', BANNER_PROPIO_NIVEL - 1).tipo,
  'preset',
  'sin nivel la URL no sale',
);
assert.equal(
  bannerDePerfil('http://x/y.jpg', 60).tipo,
  'preset',
  'http sin s no sale ni en nivel 60',
);
assert.equal(
  bannerDePerfil(BANNER_PREDETERMINADO_ID, 1).tipo,
  'preset',
  'el id suelto sin prefijo no se confunde con una URL',
);

// ──────────────────────────────────────────────────────────
// 3. LOS MARCOS
// ──────────────────────────────────────────────────────────

const base = MARCOS_AVATAR[0].clase;
assert.equal(marcoDeAvatar(null, 1), base, 'sin marco sale el base');
assert.equal(marcoDeAvatar(undefined, 1), base, 'marco ausente sale el base');
assert.equal(marcoDeAvatar('inventado', 60), base, 'un marco inventado cae al base');
assert.equal(marcoDeAvatar('dorado', 9), base, 'el dorado no sale en nivel 9');
assert.equal(
  marcoDeAvatar('dorado', 10),
  MARCOS_AVATAR.find((m) => m.id === 'dorado')!.clase,
  'el dorado sale en nivel 10',
);

// ──────────────────────────────────────────────────────────
// 4. EL CANDADO
// ──────────────────────────────────────────────────────────

assert.ok(desbloqueadoPorNivel(1, 1), 'nivel 1 abre lo de nivel 1');
assert.ok(!desbloqueadoPorNivel(3, 2), 'nivel 2 no abre lo de nivel 3');
assert.ok(desbloqueadoPorNivel(3, 3), 'nivel 3 abre lo de nivel 3');

// ──────────────────────────────────────────────────────────
// 5. EL FONDO DE PÁGINA
// ──────────────────────────────────────────────────────────
//
// Sin fondo no cambia nada (cuentas antiguas). El preset cae al
// de la casa si esta bloqueado, y la URL pide nivel 3.

assert.deepEqual(fondoDePerfil(undefined, 1), { tipo: 'ninguno' }, 'sin fondo no hay fondo');
assert.deepEqual(fondoDePerfil(null, 60), { tipo: 'ninguno' }, 'fondo nulo no hay fondo');

const fondoPreset = fondoDePerfil({ preset: 'ocaso' }, 1);
assert.equal(fondoPreset.tipo, 'preset', 'un preset libre sale');
assert.ok(
  (fondoPreset as { tipo: 'preset'; css: string }).css.length > 0,
  'y trae su css',
);

const fondoBloqueado = fondoDePerfil({ preset: 'leyenda' }, 9);
assert.equal(fondoBloqueado.tipo, 'ninguno', 'un preset de nivel 10 no sale en nivel 9');
assert.deepEqual(
  fondoDePerfil({ preset: 'leyenda' }, 10).tipo,
  'preset',
  'y sale en nivel 10',
);
assert.deepEqual(
  fondoDePerfil({ preset: 'inventado' }, 60).tipo,
  'ninguno',
  'un preset inventado no sale ni en nivel 60',
);

const fondoUrl = fondoDePerfil(
  { url: 'https://x/y.gif', position: 'top', dim: 30 },
  3,
);
assert.equal(fondoUrl.tipo, 'url', 'la URL propia sale con nivel 3');
assert.deepEqual(
  fondoUrl,
  { tipo: 'url', url: 'https://x/y.gif', position: 'top', dim: 30 },
  'con su posicion y su oscurecido',
);
assert.deepEqual(
  fondoDePerfil({ url: 'https://x/y.gif' }, 2).tipo,
  'ninguno',
  'sin nivel la URL no sale',
);
assert.deepEqual(
  fondoDePerfil({ url: 'https://x/y.gif', dim: 999 }, 3),
  { tipo: 'url', url: 'https://x/y.gif', position: 'center', dim: 80 },
  'el oscurecido se recorta al tope y la posicion cae al centro',
);

// ──────────────────────────────────────────────────────────
// 6. LAS DECORACIONES
// ──────────────────────────────────────────────────────────
//
// Las coordenadas se sujetan al lienzo (0-100) y el tamano
// desconocido cae a 'm'. Lo que salga de aqui no tapa nada
// fuera del lienzo.

assert.deepEqual(
  sujetarDecoracion({ id: 'a', kind: 'sticker', ref: 'mando', x: 10, y: 20, size: 'm' }),
  { id: 'a', kind: 'sticker', ref: 'mando', x: 10, y: 20, size: 'm' },
  'una decoracion bien puesta no cambia',
);
assert.deepEqual(
  sujetarDecoracion({ id: 'a', kind: 'sticker', ref: 'mando', x: 140, y: -5, size: 'l' }),
  { id: 'a', kind: 'sticker', ref: 'mando', x: 100, y: 0, size: 'l' },
  'fuera del lienzo se recorta dentro',
);
assert.equal(
  sujetarDecoracion({ id: 'a', kind: 'sticker', ref: 'mando', x: 5, y: 5, size: 'xl' as never }).size,
  'm',
  'un tamano inventado cae a m',
);

// ──────────────────────────────────────────────────────────
// 7. LAS VITRINAS
// ──────────────────────────────────────────────────────────
//
// Sin vitrinas guardadas salen logros + destacadas, como
// siempre: actualizar no le cambia el perfil a nadie.

assert.deepEqual(
  VITRINAS_POR_DEFECTO,
  ['logros', 'destacadas'],
  'el orden de siempre son logros y destacadas',
);
assert.ok(
  VITRINAS.every((v) => typeof v.nivelMinimo === 'number' && v.nivelMinimo >= 1),
  'todas las vitrinas tienen su nivel minimo',
);
assert.equal(
  new Set(VITRINAS.map((v) => v.id)).size,
  VITRINAS.length,
  'ninguna vitrina repetida',
);

// ──────────────────────────────────────────────────────────
// 8. LO QUE SE GUARDA NO LLEVA UNDEFINED
// ──────────────────────────────────────────────────────────
//
// Firestore rechaza `undefined` dentro de un mapa
// ("Unsupported field value: undefined"). `fondoAGuardar` arma
// el fondo solo con claves definidas: sin preset ni URL es
// null, y la clave que falte no se escribe.

assert.equal(fondoAGuardar('', '', 'center', 50), null, 'sin preset ni URL es null');

const soloPreset = fondoAGuardar('ocaso', '', 'center', 50);
assert.deepEqual(
  soloPreset,
  { preset: 'ocaso', position: 'center', dim: 50 },
  'con preset no hay clave url',
);
assert.ok(
  soloPreset && Object.values(soloPreset).every((v) => v !== undefined),
  'ningun valor undefined con solo preset',
);

const soloUrl = fondoAGuardar('', 'https://x/y.jpg', 'top', 30);
assert.deepEqual(
  soloUrl,
  { url: 'https://x/y.jpg', position: 'top', dim: 30 },
  'con URL no hay clave preset',
);
assert.ok(
  soloUrl && Object.values(soloUrl).every((v) => v !== undefined),
  'ningun valor undefined con solo URL',
);

console.log('logica.perfil-custom: OK');
