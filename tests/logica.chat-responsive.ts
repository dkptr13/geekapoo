// Contratos responsive del chat: lo que la adaptación promete
// en el marcado, sin navegador. Igual que
// `logica.chat-burbuja.ts`, lee el componente y fija lo que no
// se puede romper sin romper móvil.
//
//   npx tsx tests/logica.chat-responsive.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = readFileSync(join(raiz, 'src', 'components', 'chat', 'ChatView.tsx'), 'utf8');
const fuenteTextarea = readFileSync(
  join(raiz, 'src', 'components', 'common', 'AutoGrowTextarea.tsx'),
  'utf8',
);

const tiene = (marca: string, porQue: string) => {
  assert.ok(fuente.includes(marca), `no se encontró: ${porQue} (${marca})`);
};

const tieneTextarea = (marca: string, porQue: string) => {
  assert.ok(
    fuenteTextarea.includes(marca),
    `no se encontró: ${porQue} (${marca})`,
  );
};

// El campo de escritura crece con el texto en vez de
// desbordar: es un textarea autoajustable con tope, no un input.
tiene('<AutoGrowTextarea', 'el compositor usa textarea autoajustable');
tiene('maxHeight={128}', 'el textarea tiene tope de altura');
tiene("onKeyDown", 'Enter envía sin Mayús');
tieneTextarea('overflow-x-hidden', 'el textarea nunca hace scroll horizontal');
tieneTextarea('whitespace-pre-wrap', 'los saltos de línea se conservan');
tieneTextarea(
  "el.style.overflowY = contenido > maxHeight ? 'auto' : 'hidden'",
  'al llegar al tope se pasa al scroll vertical',
);

// Las herramientas caben en móvil tras un "+": sin él, 6
// botones + campo no entran a 360px.
tiene('showHerramientas', 'el "+" agrupa herramientas en móvil');
tiene('Más herramientas', 'el "+" se anuncia');
tiene('env(safe-area-inset-bottom)', 'respeto a la zona segura');

// Las burbujas y citas largas no rompen el ancho ni el modal.
tiene('break-words', 'las burbujas cortan palabras largas');

// La fila de conversación no es un <button> con otro dentro
// (rompe la hidratación y el lector de pantalla): es un div
// con rol de botón y teclado.
tiene('role="button"', 'la fila es div con rol');
tiene('onKeyDown', 'la fila se abre con teclado');

// Iconos sin texto en móvil llevan nombre accesible.
tiene('aria-label="Nuevo contacto por ID"', 'contactos con nombre');
tiene('aria-label="Descubrir clubes"', 'descubrir con nombre');
tiene('aria-label="Personalizar el chat"', 'apariencia con nombre');

// Los modales de la vista no se salen en pantallas bajas.
tiene('max-h-[90dvh]', 'los modales dejan sitio al viewport');

console.log('  chat responsive: OK');
