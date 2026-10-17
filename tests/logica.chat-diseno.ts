// Sistema visual del chat: un solo lenguaje en toda la sección.
//
//   npx tsx tests/logica.chat-diseno.ts
//
// No abre el navegador: lee el marcado y los tokens y fija lo
// que hace que el chat se vea diseñado en conjunto y no por
// piezas (cabecera, lateral, hilo, burbujas y compositor con
// los mismos bordes, radios, alturas y estados).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMAS_CHAT, FONDOS_CHAT, resolverApariencia } from '../src/data/chatApariencia.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const vista = readFileSync(join(raiz, 'src', 'components', 'chat', 'ChatView.tsx'), 'utf8');
const lateral = readFileSync(join(raiz, 'src', 'components', 'chat', 'ClubListItem.tsx'), 'utf8');
const css = readFileSync(join(raiz, 'src', 'index.css'), 'utf8');

const tiene = (fuente: string, marca: string, porQue: string) => {
  assert.ok(fuente.includes(marca), `no se encontró: ${porQue} (${marca})`);
};

// 1. Fondo tenue: el hilo no compite con las burbujas. Ningún
// tema por defecto usa un degradado intenso a pantalla completa.
for (const t of TEMAS_CHAT) {
  assert.ok(
    !t.fondoLista.includes('#1e1033') && !t.fondoLista.includes('#2e1065'),
    `fondo intenso en tema ${t.id}`,
  );
}
// La casa es oscura y sutil, no un plano gris.
const casa = resolverApariencia({});
assert.ok(String(casa.fondoLista.background).includes('#0a0a11'), 'hilo base oscuro');
assert.ok(String(casa.fondoLista.background).includes('rgba(124,58,237,0.07)'), 'velo violeta tenue');

// 2. Burbujas contenidas: propio con violeta equilibrado (sin
// fucsia quemado) y recibida grafito con borde sutil.
assert.ok(!String(casa.burbujaPropia.background).includes('#c026d3'), 'sin fucsia intenso');
assert.equal(casa.burbujaRecibida.background, '#1b1b22');
assert.ok('border' in casa.burbujaRecibida, 'recibida con borde');

// 3. Fondos de la galería apagados (legibilidad sobre imagen).
for (const f of FONDOS_CHAT) {
  if (!f.css) continue;
  assert.ok(!f.css.includes('#c2410c') && !f.css.includes('#16a34a'), `fondo chillón: ${f.id}`);
}

// 4. Un solo sistema en el marcado: mismas alturas (h-9/h-10),
// mismo radio (rounded-xl/2xl), mismo borde tenue y mismo
// degradado primario en toda la sección.
tiene(vista, 'h-9', 'botones con altura común');
tiene(vista, 'rounded-2xl', 'radio común');
tiene(vista, 'border-white/[0.06]', 'borde tenue común');
tiene(vista, 'from-violet-600 to-indigo-600', 'primario con degradado común');
tiene(vista, 'chat-boton', 'transición común de botones');
tiene(vista, 'chat-hilo', 'hilo con textura común');
tiene(lateral, 'rounded-xl', 'clubes con el mismo radio');
tiene(lateral, 'from-violet-600/[0.18]', 'clubes con el mismo seleccionado');
tiene(css, '.chat-hilo', 'tokens del hilo en CSS');
tiene(css, '.chat-boton', 'tokens de botón en CSS');

// 5. Sin focos rotos al unificar: el teclado sigue viendo lo
// importante y el móvil sigue agrupando herramientas.
tiene(vista, 'chat-foco', 'foco visible unificado');
tiene(vista, 'showHerramientas', 'herramientas agrupadas en móvil');
tiene(vista, 'role="button"', 'filas accesibles');
tiene(vista, 'break-words', 'texto largo sin romper');

console.log('  chat diseño: OK');
