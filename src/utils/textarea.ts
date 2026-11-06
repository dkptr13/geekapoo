import type { RefObject } from 'react';

/**
 * Inserta texto en la posición del cursor (o reemplaza la selección)
 * y deja el cursor justo detrás de lo insertado.
 *
 * El foco vuelve al campo en el siguiente frame porque el botón del
 * selector de emojis se lleva el foco al pulsarlo. Sin el
 * `requestAnimationFrame`, algunos navegadores mueven el cursor al
 * final al recuperar el foco.
 */
export function insertarTextoEnCursor(
  ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  valor: string,
  texto: string,
  setValor: (siguiente: string) => void,
): void {
  const el = ref.current;
  const inicio = el?.selectionStart ?? valor.length;
  const fin = el?.selectionEnd ?? inicio;
  const siguiente = valor.slice(0, inicio) + texto + valor.slice(fin);
  const cursor = inicio + texto.length;

  setValor(siguiente);

  window.requestAnimationFrame(() => {
    const actual = ref.current;
    if (!actual) return;
    actual.focus();
    actual.setSelectionRange(cursor, cursor);
  });
}
