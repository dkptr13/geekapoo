// Dónde está el siguiente hueco en una trivia.
//
// Sale de `utils/triviaSaltos.ts` y no de la vista porque es lógica, no
// dibujo, y porque así se puede probar sin navegador. La prueba está en
// `tests/logica.trivia.ts`.

/**
 * El índice de la primera pregunta SIN responder que hay a partir de
 * `desde`, o `null` si ya están todas.
 *
 * PARA QUE SIRVE
 *
 * Para que "Siguiente" salte de hueco en hueco. Antes avanzaba una
 * pregunta cada vez, y como tampoco se podía volver atrás, corregir
 * una respuesta era imposible: había que llegar hasta el final,
 * enviar y rezar.
 *
 * Con esto, quien va atrasado pulsa "Siguiente" y aterriza en la
 * primera que le falta. Es lo que hacen los cuestionarios de verdad.
 *
 * POR QUE EMPIEZA EN `desde` Y NO EN CERO
 *
 * Porque volver a mirar las que ya están contestadas al pulsar
 * "Siguiente" sería un salto atrás sin avisar, que es peor que no
 * saltar. Quien quiera revisarlas tiene el botón de atrás, que va uno
 * a uno.
 *
 * @param {string[]} preguntas los ids de las preguntas, en orden
 * @param {Record<string, number>} respuestas las ya contestadas
 * @param {number} desde por donde se busca
 * @returns {number | null}
 */
export function siguienteSinResponder(
  preguntas: string[],
  respuestas: Record<string, number>,
  desde: number,
): number | null {
  for (let i = Math.max(0, desde); i < preguntas.length; i++) {
    if (respuestas[preguntas[i]] === undefined) return i;
  }

  return null;
}

/**
 * La primera pregunta sin responder de toda la trivia, o `null`.
 *
 * Es el caso al abrirla: si la trivia ya se empezó en otra pestaña y
 * quedó a medias, se abre por donde toca en lugar de por la primera.
 *
 * @param {string[]} preguntas
 * @param {Record<string, number>} respuestas
 * @returns {number | null}
 */
export function primeraSinResponder(
  preguntas: string[],
  respuestas: Record<string, number>,
): number | null {
  return siguienteSinResponder(preguntas, respuestas, 0);
}