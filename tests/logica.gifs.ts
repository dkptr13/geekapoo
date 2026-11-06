/**
 * Comprobaciones de la ficha de un GIF.
 *
 *   npx tsx tests/logica.gifs.ts
 *
 * El GIF se guarda como cuatro datos y las URLs las escribe el
 * cliente. La misma comprobación está en `firestore.rules`; esta es
 * la que da un error legible antes de intentar publicar.
 */
import assert from 'node:assert/strict';

import { esGifValido, esUrlDeGifValida } from '../src/utils/gifs';

const valido = {
  provider: 'giphy' as const,
  id: 'abc123',
  url: 'https://media3.giphy.com/media/abc123/giphy.gif',
  previewUrl: 'https://media3.giphy.com/media/abc123/100w.gif',
  width: 480,
  height: 270,
};

assert.equal(esGifValido(null), true, 'sin GIF no hay nada que validar');
assert.equal(esGifValido(valido), true, 'un GIF de GIPHY vale');
assert.equal(
  esGifValido({
    ...valido,
    provider: 'tenor',
    url: 'https://media.tenor.com/abc123/tenor.gif',
    previewUrl: 'https://media.tenor.com/abc123/tenor-preview.gif',
  }),
  true,
  'un GIF de Tenor vale',
);
assert.equal(
  esGifValido({ ...valido, provider: 'otro' as never }),
  false,
  'un proveedor desconocido no vale',
);
assert.equal(
  esGifValido({ ...valido, url: 'https://ejemplo-falso.test/x.gif' }),
  false,
  'una URL fuera del CDN no vale',
);
assert.equal(
  esGifValido({ ...valido, previewUrl: 'https://ejemplo-falso.test/x.gif' }),
  false,
  'la vista previa también tiene que ser del CDN',
);
assert.equal(
  esGifValido({ ...valido, id: '' }),
  false,
  'el id es obligatorio',
);
assert.equal(
  esGifValido({ ...valido, title: 'x'.repeat(201) }),
  false,
  'el título no puede ser enorme',
);
assert.equal(
  esGifValido({ ...valido, title: 'Gato gracioso' }),
  true,
  'un título normal vale',
);
assert.equal(esUrlDeGifValida(''), false);
assert.equal(esUrlDeGifValida('https://media.giphy.com/x.gif'), true);

console.log('✓ GIFs: proveedor, id y URLs del CDN correctos');
