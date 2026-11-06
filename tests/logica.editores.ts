// Contratos de los editores de hilos y comentarios, sin navegador.
//
//   npx tsx tests/logica.editores.ts
//
// No comprueba el aspecto: fija lo que no se puede romper sin volver
// al problema original (input de una línea, sin emojis, sin GIF en
// los hilos). Igual que `logica.chat-responsive.ts`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { insertarTextoEnCursor } from '../src/utils/textarea';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...partes: string[]) => readFileSync(join(raiz, ...partes), 'utf8');

const home = leer('src', 'components', 'home', 'HomeFeed.tsx');
const chat = leer('src', 'components', 'chat', 'ChatView.tsx');
const wiki = leer('src', 'components', 'wiki', 'AnimeWiki.tsx');
const autoGrow = leer('src', 'components', 'common', 'AutoGrowTextarea.tsx');
const emojiButton = leer(
  'src',
  'components',
  'community',
  'EmojiPickerButton.tsx',
);

const veces = (texto: string, marca: string) =>
  texto.split(marca).length - 1;

// Hilos, comentario principal y respuesta usan textarea multilínea.
assert.ok(
  veces(home, '<AutoGrowTextarea') >= 3,
  'HomeFeed debe usar AutoGrowTextarea en hilo, comentario y respuesta',
);
assert.ok(
  veces(home, '<EmojiPickerButton') >= 3,
  'los tres editores de HomeFeed deben tener selector de emojis',
);
assert.ok(
  home.includes('threadGif') && home.includes('<CommentGif'),
  'el hilo debe guardar y pintar su GIF',
);
assert.ok(
  home.includes('GifPicker') &&
    home.includes('El GIF se publicará junto al texto'),
  'el compositor del hilo debe permitir elegir y previsualizar GIF',
);

// El chat ya usaba emoji; ahora comparte el textarea que no desborda.
assert.ok(
  chat.includes('<AutoGrowTextarea') && chat.includes('maxHeight={128}'),
  'el chat debe usar el textarea autoajustable',
);

// La wiki también tiene comentarios: no pueden quedarse en input.
assert.ok(
  veces(wiki, '<AutoGrowTextarea') >= 3,
  'los comentarios de la wiki deben ser multilínea',
);
assert.ok(
  veces(wiki, '<EmojiPickerButton') >= 3,
  'los comentarios de la wiki deben permitir emojis',
);

// El textarea compartido es quien garantiza el corte de línea.
for (const marca of [
  'overflow-x-hidden',
  'whitespace-pre-wrap',
  'break-words',
  "el.style.overflowY = contenido > maxHeight ? 'auto' : 'hidden'",
]) {
  assert.ok(
    autoGrow.includes(marca),
    `AutoGrowTextarea debe incluir ${marca}`,
  );
}
assert.ok(
  leer('src', 'utils', 'textarea.ts').includes('setSelectionRange'),
  'insertarTextoEnCursor debe devolver el cursor a su sitio',
);

// El selector de emojis reutiliza el catálogo existente y se cierra
// al elegir o al pulsar fuera.
assert.ok(
  emojiButton.includes("from './EmojiPicker'") &&
    emojiButton.includes('createPortal') &&
    emojiButton.includes('onElegir') &&
    emojiButton.includes('setAbierto(false)'),
  'EmojiPickerButton debe reutilizar EmojiPicker y cerrarse al elegir',
);

// Inserción en el cursor: no siempre al final, y el cursor vuelve
// justo detrás del emoji.
const originalWindow = (globalThis as { window?: unknown }).window;
let cursor = -1;
const falso = {
  selectionStart: 2,
  selectionEnd: 2,
  focus() {},
  setSelectionRange(inicio: number, fin: number) {
    cursor = inicio === fin ? inicio : -2;
  },
};
(globalThis as { window?: unknown }).window = {
  requestAnimationFrame: (cb: () => void) => cb(),
};
let texto = 'hola';
insertarTextoEnCursor(
  { current: falso as unknown as HTMLTextAreaElement },
  texto,
  '😀',
  (siguiente) => {
    texto = siguiente;
  },
);
assert.equal(texto, 'ho😀la', 'el emoji se inserta en el cursor, no al final');
assert.equal(cursor, 4, 'el cursor queda detrás del emoji');
(globalThis as { window?: unknown }).window = originalWindow;

console.log('  editores: OK (textarea, emojis y GIF en hilos/comentarios/chat)');
