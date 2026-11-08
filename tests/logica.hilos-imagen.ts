// La imagen del hilo se enseña ENTERA, sin recortes.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// La imagen del hilo llevaba `w-full max-h-96 object-cover`: altura
// capada a 24rem y recorte `cover`. Una foto vertical se convertía en
// una franja horizontal mostrando solo el centro.
//
// Como el CSS no se puede probar con unassert de lógica, este test
// lee el componente y fija el contrato: la imagen del hilo no puede
// llevar altura fija, ni `max-h`, ni `object-cover`, ni
// `aspect-ratio`. Si alguien lo vuelve a poner, esto cae.
//
// ── LO QUE SE COMPRUEBA ───────────────────────────────────────────
//
//   · La imagen del hilo: `h-auto`, sin tope de altura, `contain`.
//   · La del comentario: intacta, entera y con su tope.
//   · Ningún `object-cover` en imágenes de hilos o comentarios.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = readFileSync(join(raiz, 'src', 'components', 'home', 'HomeFeed.tsx'), 'utf8');

/** El `className` del `<img>` con ese `alt`. */
function clasesDe(alt: string): string {
  const re = new RegExp(
    `<(?:img|StableImage)[\\s\\S]*?alt="${alt}"[\\s\\S]*?className="([^"]+)"`,
  );
  const m = fuente.match(re);

  assert.ok(m, `no se encontró la imagen con alt="${alt}" en HomeFeed`);

  return m![1];
}

// ═══════════════════════════════════════════════════════════
// LA IMAGEN DEL HILO: ENTERA Y CON SU PROPORCIÓN
// ═══════════════════════════════════════════════════════════

{
  const clases = clasesDe('Imagen adjunta al hilo');

  assert.ok(
    !clases.includes('object-cover'),
    `la imagen del hilo no puede recortar (cover): ${clases}`,
  );
  assert.ok(
    !/max-h-\S+/.test(clases),
    `la imagen del hilo no puede llevar tope de altura: ${clases}`,
  );
  assert.ok(
    !/aspect-/.test(clases) && !clases.includes('aspectRatio'),
    `la imagen del hilo no puede forzar proporción: ${clases}`,
  );
  assert.ok(
    !/(?:^|\s)h-\d+/.test(clases.replace('h-auto', '')),
    `la imagen del hilo no puede llevar altura fija: ${clases}`,
  );
  assert.ok(clases.includes('h-auto'), 'la altura sale de la proporción real');
  assert.ok(
    clases.includes('max-w-full'),
    'sin desbordar en móvil y sin estirar las pequeñas',
  );
  assert.ok(clases.includes('object-contain'), 'se enseña completa');
}

// ═══════════════════════════════════════════════════════════
// LA DEL COMENTARIO: COMO ESTABA
// ═══════════════════════════════════════════════════════════

{
  const clases = clasesDe('Imagen adjunta al comentario');

  assert.ok(clases.includes('object-contain'), 'la del comentario sigue entera');
  assert.ok(clases.includes('max-h-72'), 'y con su tope de siempre');
  assert.ok(!clases.includes('object-cover'), 'sin recorte tampoco');
}

console.log('  imagen del hilo completa: OK');
