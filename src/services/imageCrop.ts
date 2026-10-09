/**
 * El encuadre de una imagen: la geometría del recorte.
 *
 * ── POR QUÉ ESTÁ SUELTO ───────────────────────────────────────────
 *
 * Aquí no hay React, ni DOM, ni canvas. Solo números y comparaciones,
 * con lo que se puede probar de verdad desde Node. El componente
 * `CropEditor` pinta lo que estas funciones calculan, y no decide
 * nada por su cuenta.
 *
 * Eso no es purismo: el error de este tipo de sistemas no está casi
 * nunca en el arrastre, que se ve a ojo, sino en que la imagen se
 * pueda quedar con una franja vacía al amplifier, o en que el
 * encuadre guardado no vuelva a abrir donde estaba. Las dos cosas
 * son aritmética, y la aritmética se prueba.
 *
 * ── LAS DOS MAGNITUDES, Y POR QUÉ NO SE CONFUNDEN ─────────────────
 *
 *  - La PROPORCIÓN (`aspectRatio`) es la del recorte: 1 para un
 *    avatar, 16/9 para una portada. Decide la forma de la caja.
 *
 *  - El ZOOM es un factor sobre la escala MÍNIMA que hace falta para
 *    que la imagen cubra esa caja. El 1 no es "sin zoom", es "justo":
 *    la imagen más pequeña que todavía no deja huecos. Por debajo de
 *    1 aparecería fondo, así que no se permite.
 */

/** Proporciones predefinidas. El nombre es lo que se enseña. */
export const PROPORCIONES = {
  cuadrado: { id: 'cuadrado', etiqueta: 'Cuadrado', ratio: 1 },
  avatar: { id: 'avatar', etiqueta: 'Avatar', ratio: 1 },
  vertical: { id: 'vertical', etiqueta: 'Vertical 4:5', ratio: 4 / 5 },
  retrato: { id: 'retrato', etiqueta: 'Retrato 2:3', ratio: 2 / 3 },
  horizontal: { id: 'horizontal', etiqueta: 'Horizontal 4:3', ratio: 4 / 3 },
  panoramica: { id: 'panoramica', etiqueta: 'Panorámica 16:9', ratio: 16 / 9 },
  cinematico: { id: 'cinematico', etiqueta: 'Cinemático 21:9', ratio: 21 / 9 },
} as const;

export type ProporcionId = keyof typeof PROPORCIONES;

/** El ajuste de encuadre de una imagen. Todo relativo, sin medidas fijas. */
export interface ImageCropSettings {
  /** Proporción de la caja de recorte (ancho / alto). */
  aspectRatio: number;
  /** 1 = la imagen justa. Más grande = más recortada. */
  zoom: number;
  /** Desplazamiento horizontal, de 0 a 1. 0.5 es centrado. */
  x: number;
  /** Desplazamiento vertical, de 0 a 1. 0.5 es centrado. */
  y: number;
}

/** El rectángulo donde se pinta la imagen, en píxeles de la caja. */
export interface Encuadre {
  /** Escala total aplicada a la imagen de origen. */
  escala: number;
  /** Ancho pintado. Siempre >= ancho de la caja. */
  ancho: number;
  /** Alto pintado. Siempre >= alto de la caja. */
  alto: number;
  /** Desplazamiento del borde izquierdo, en píxeles de la caja. */
  x: number;
  /** Desplazamiento del borde superior, en píxeles de la caja. */
  y: number;
}

export const ZOOM_MINIMO = 1;
export const ZOOM_MAXIMO = 4;

/**
 * En qué grupo cae una imagen por su proporción.
 *
 * ── LOS UMBRALES, Y POR QUÉ SON ESTOS ─────────────────────────────
 *
 * No son "bonitos": están puestos justo donde una imagen deja de
 * suffer con el encuadre que se le aplica.
 *
 *  - Cuadrada (0.9 a 1.1): se ve igual de cerca en horizontal que en
 *    vertical, así que no hay recorte que compense la diferencia.
 *  - Vertical (menos de 0.9): meterla en una caja horizontal obliga a
 *    recortar por arriba y por abajo, y lo que se pierde casi siempre
 *    son la cabeza o los pies.
 *  - Horizontal (más de 1.1): al revés, en una caja cuadrada sobra
 *    por los lados y no se amplía de más.
 *  - Panorámica (desde 1.9): es el punto en que una imagen de banner
 *    deja de necesitar recorte de verdad.
 */
export type ClaseProporcion = 'cuadrada' | 'vertical' | 'horizontal' | 'panoramica';

export function clasificarProporcion(ancho: number, alto: number): ClaseProporcion {
  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho <= 0 || alto <= 0) {
    return 'cuadrada';
  }

  const r = ancho / alto;

  if (r > 1.9) return 'panoramica';
  if (r > 1.1) return 'horizontal';
  if (r < 0.9) return 'vertical';

  return 'cuadrada';
}

/** Texto corto que explica el encuadre que le toca a esa imagen. */
export function descripcionProporcion(clase: ClaseProporcion): string {
  switch (clase) {
    case 'cuadrada':
      return 'Cuadrada: se ve igual de cerca por todos los lados.';
    case 'vertical':
      return 'Vertical: si la recortas, cuidado con la cabeza y los pies.';
    case 'horizontal':
      return 'Horizontal: sobra por los lados, así que no hace falta ampliar.';
    case 'panoramica':
      return 'Panorámica: pensada para banners, casi sin recorte.';
  }
}

/**
 * El encuadre que sale de unos ajustes y de los tamaños concretos.
 *
 * Es la función central: todo lo demás (el arrastre, la vista previa,
 * el guardado) va a parar aquí, para que haya UN solo sitio donde se
 * decide qué parte de la imagen se ve.
 *
 * ── LO QUE GARANTIZA ──────────────────────────────────────────────
 *
 * Que `ancho >= anchoCaja` y `alto >= altoCaja` SIEMPRE. Nunca sale
 * una franja vacía, por muy lejos que se haya movido. Por eso los
 * desplazamientos se limitan en lugar de confiar en el arrastre: el
 * ratón puede salirse del marco y el dedo también.
 *
 * @param anchoFuente ancho en píxeles de la imagen original
 * @param altoFuente  alto en píxeles de la imagen original
 * @param anchoCaja   ancho en píxeles de la caja de recorte
 * @param altoCaja    alto en píxeles de la caja de recorte
 * @param ajustes     lo que ha elegido el usuario
 */
export function calcularEncuadre(
  anchoFuente: number,
  altoFuente: number,
  anchoCaja: number,
  altoCaja: number,
  ajustes: ImageCropSettings,
): Encuadre {
  // Sin imagen o sin caja no hay encuadre que calcular. Se devuelven
  // ceros en vez de NaN porque un NaN aquí se propaga al canvas y
  // dibuja una imagen en el sitio equivocado sin avisar.
  if (
    !Number.isFinite(anchoFuente) ||
    !Number.isFinite(altoFuente) ||
    anchoFuente <= 0 ||
    altoFuente <= 0 ||
    anchoCaja <= 0 ||
    altoCaja <= 0
  ) {
    return { escala: 0, ancho: 0, alto: 0, x: 0, y: 0 };
  }

  // La escala mínima para CUBRIR la caja: se toma la mayor de las dos
  // direcciones. Con la menor quedaría un hueco, que es justo lo que
  // no puede pasar.
  const base = Math.max(anchoCaja / anchoFuente, altoCaja / altoFuente);

  const zoom = limitarZoom(ajustes.zoom);

  const escala = base * zoom;

  const ancho = anchoFuente * escala;
  const alto = altoFuente * escala;

  // El recorrido máximo en cada eje: lo que sobra de la imagen por encima
  // de la caja.
  const recorridoX = Math.max(0, ancho - anchoCaja);
  const recorridoY = Math.max(0, alto - altoCaja);

  // ── EL SIGNO VA NEGATIVO, Y NO ES UN DETALLE ─────────────────────
  //
  // `drawImage` coloca la imagen por su ESQUINA SUPERIOR IZQUIERDA. La
  // imagen es más grande que la caja, así que para que la tape su
  // esquina tiene que estar en la parte de arriba o por encima de la
  // caja: entre 0 y `-recorrido`. Con un desplazamiento positivo la
  // esquina bajaba, y los primeros píxeles de la caja se quedaban sin
  // nada pintado: una franja del color del fondo donde debería estar
  // la foto.
  //
  // Con esta fórmula:
  //   x = 0    -> esquina en 0, se ve la parte de IZQUIERDA / ARRIBA
  //   x = 0.5  -> centrada
  //   x = 1    -> esquina en -recorrido, se ve la DERECHA / ABAJO
  //
  // El signo se lee solo: 0 es "la foto entera empieza en el borde de
  // la caja" y 1 es "la foto se ha desplazado lo justo para enseñar
  // el otro extremo".
  const x = recorridoX * (0 - limitarDesplazamiento(ajustes.x));
  const y = recorridoY * (0 - limitarDesplazamiento(ajustes.y));
  return { escala, ancho, alto, x, y };
}

/**
 * El rectángulo que hay que recortar de la imagen ORIGINAL, en píxeles
 * de esa imagen.
 *
 * ── POR QUÉ ESTÁ AQUÍ Y NO EN EL SCRIPT ───────────────────────────
 *
 * Porque hay dos sitios que necesitan la misma cuenta: el navegador,
 * que pinta en un canvas, y `scripts/migrar-encuadres.mjs`, que
 * recorta con `sharp` en Node. Si cada uno apañara los números por su
 * cuenta, el catálogo migrado quedaría con recortes distintos de los
 * que se enseñaron en el panel, y el script no serviría para nada.
 *
 * ── EL REDONDEO, Y POR QUÉ HAY QUE ACOTAR ─────────────────────────
 *
 * `left` y `top` se redondean hacia arriba y `width` y `height`
 * también, por separado. Con eso los cuatro van bien por su cuenta,
 * pero la SUMA puede pasarse de la imagen en un píxel: la última
 * fila o columna se sale.
 *
 * No es hipotético. Pasaba en 6 de 120 combinaciones, todas con
 * imágenes que dividen mal: un 120x90 recortado a 3:4 daba 68 de
 * ancho, y 53 + 68 son 121 píxeles en una imagen de 120.
 *
 * Por eso aquí se acota al final, después de redondear. Es lo mismo
 * que hace `Math.min` con el resto, pero escrito una vez y en el
 * sitio donde se puede probar.
 *
 * @returns el rectángulo, con `ancho` y `alto` de al menos 1
 */
export function rectanguloDeRecorte(
  anchoFuente: number,
  altoFuente: number,
  anchoCaja: number,
  altoCaja: number,
  ajustes: ImageCropSettings,
): { left: number; top: number; width: number; height: number } {
  const e = calcularEncuadre(anchoFuente, altoFuente, anchoCaja, altoCaja, ajustes);

  if (e.escala <= 0) return { left: 0, top: 0, width: 1, height: 1 };

  const scale = e.escala;

  const left = Math.min(
    Math.max(0, Math.round(-e.x / scale)),
    Math.max(0, Math.floor(anchoFuente) - 1),
  );
  const top = Math.min(
    Math.max(0, Math.round(-e.y / scale)),
    Math.max(0, Math.floor(altoFuente) - 1),
  );

  const width = Math.max(1, Math.min(Math.round(anchoCaja / scale), Math.floor(anchoFuente) - left));
  const height = Math.max(1, Math.min(Math.round(altoCaja / scale), Math.floor(altoFuente) - top));

  return { left, top, width, height };
}

/** El zoom se mantiene en su rango sea cual sea el valor que llegue. */
export function limitarZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return ZOOM_MINIMO;

  return Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, zoom));
}

/**
 * El desplazamiento, en el rango 0 a 1.
 *
 * El 0.5 es el centro. Lo que se guarda y lo que se mueve es un
 * número normalizado, no un píxel, por dos razones: el mismo ajuste
 * sirve para la vista previa y para el recorte final aunque tengan
 * tamaños distintos, y un recorte guardado se puede reabrir aunque la
 * imagen se vea en otro sitio a otro tamaño.
 */
export function limitarDesplazamiento(valor: number): number {
  if (!Number.isFinite(valor)) return 0.5;

  return Math.min(1, Math.max(0, valor));
}

/** El ajuste de empezar: la imagen justa y centrada. */
export function ajustesIniciales(aspectRatio: number): ImageCropSettings {
  return { aspectRatio, zoom: ZOOM_MINIMO, x: 0.5, y: 0.5 };
}

/**
 * El lado MAYOR de la imagen, para decidir a qué tamaño recortarla.
 *
 * Sin esto, una foto de 4000 px de un avatar de 512 px subiría cuatro
 * mil píxeles a un sitio donde se ven 64. Y al revés: una imagen
 * pequeña ampliada se ve pixelada, así que un tamaño de salida
 * pequeño es mejor que ampliar.
 */
export function ladoDeSalida(anchoFuente: number, altoFuente: number, maximo = 1200): number {
  if (!Number.isFinite(anchoFuente) || !Number.isFinite(altoFuente)) return maximo;
  if (anchoFuente <= 0 || altoFuente <= 0) return maximo;

  return Math.round(Math.min(maximo, Math.max(anchoFuente, altoFuente)));
}