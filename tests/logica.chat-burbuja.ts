// La burbuja abraza al texto, sin heredar anchos.
//
// ── EL MOTIVO ─────────────────────────────────────────────────────
//
// La burbuja era un bloque que llenaba el contenedor, y el ancho del
// contenedor lo marca la fila más ancha (hora + ticks + menú). Al
// editar un párrafo largo a un "lol", la burbuja se quedaba con el
// ancho del párrafo. Con `w-fit` encoge con el texto (y `ml-auto`
// la mantiene a la derecha en los propios).
//
// Como el CSS no se prueba con lógica, este test lee el componente
// y fija el contrato.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = readFileSync(join(raiz, 'src', 'components', 'chat', 'ChatView.tsx'), 'utf8');

function claseQueContiene(marca: string): string {
  const i = fuente.indexOf(marca);

  assert.ok(i >= 0, `no se encontró la marca: ${marca}`);

  // La clase está en el `className` que envuelve la marca hacia atrás.
  const inicio = fuente.lastIndexOf('className', i);
  const fin = fuente.indexOf('`', fuente.indexOf('>', inicio));

  return fuente.slice(inicio, fin);
}

// ═══════════════════════════════════════════════════════════
// LA BURBUJA PRINCIPAL
// ═══════════════════════════════════════════════════════════
//
// El relleno y el radio salen de la apariencia del chat
// (`aparienciaVista.relleno`): por defecto son los de siempre.
// Lo que se fija aquí es lo estructural: que abrace al texto.

{
  const clase = claseQueContiene('aparienciaVista.relleno');

  assert.ok(clase.includes('w-fit'), 'la burbuja abraza al texto (w-fit)');
  assert.ok(clase.includes('max-w-full'), 'sin desbordar el contenedor');
  assert.ok(clase.includes('ml-auto'), 'los propios siguen a la derecha');
  // Ojo: `max-w-full` contiene "w-full" como texto; se busca la
  // clase sola, no el subtexto.
  assert.ok(
    !/(?<![\w-])w-full(?![\w-])/.test(clase.replace('max-w-full', '')),
    'nada de ancho completo',
  );
}

// ═══════════════════════════════════════════════════════════
// LA CITA Y EL MARCADOR DE ELIMINADO
// ═══════════════════════════════════════════════════════════

{
  const cita = claseQueContiene('border-l-2 border-violet-500/70');

  assert.ok(cita.includes('w-fit'), 'la cita también encoge');
}

{
  const borrado = claseQueContiene('border-dashed border-zinc-700');

  assert.ok(borrado.includes('w-fit'), 'el marcador de eliminado también');
}

console.log('  burbuja que encoge: OK');
