// Dimensiones de imagen: lo mínimo para reservar su sitio.
//
// ── POR QUÉ EXISTE ──────────────────────────────────────────
//
// Una <img> sin medidas no ocupa nada hasta que descarga: el
// navegador no sabe cuánto hueco dejarle y el contenido de
// debajo salta cuando aparece. Con la anchura y la altura
// guardadas junto a la URL, la caja se reserva desde el primer
// renderizado (ver `StableImage`) y la pantalla no se mueve.
//
// Los originales NO se tocan: ni se recortan, ni se comprimen,
// ni se sustituyen. Solo se mide al subir y se guarda el
// número al lado de la URL.
//
// Sin tilde ni caracteres raros en los comentarios, como el
// resto de `utils/`: se leen en cualquier terminal.

/** Dimensiones en píxeles de una imagen subida. */
export interface ImageDims {
  width: number;
  height: number;
}

/** Máximo sensato: por encima, el dato viene corrupto. */
export const MAX_DIMENSION = 10000;

/**
 * Si unas dimensiones guardadas sirven para reservar espacio.
 *
 * Enteros positivos y acotados. Un 0, un negativo, un decimal
 * o un disparate de 12 cifras romperían la caja igual que no
 * tener el dato, así que se tratan como si no estuviera.
 */
export function dimsValidas(ancho: unknown, alto: unknown): boolean {
  return (
    typeof ancho === 'number' &&
    typeof alto === 'number' &&
    Number.isInteger(ancho) &&
    Number.isInteger(alto) &&
    ancho >= 1 &&
    alto >= 1 &&
    ancho <= MAX_DIMENSION &&
    alto <= MAX_DIMENSION
  );
}

/**
 * La proporción como la espera el CSS `aspect-ratio`.
 *
 * `"800 / 600"`, sin simplificar: simplificar no cambia nada
 * en pantalla y perdería la información original.
 */
export function aspectoDe(ancho: number, alto: number): string {
  return `${ancho} / ${alto}`;
}
