// ======================================================
// MEDIDAS COMPARTIDAS
// ======================================================
// Estas medidas aparecen en dos sitios a la vez: en la tarjeta
// de personaje de la wiki y en el recuadro del ajuste de
// encuadre del panel.
//
// Si estuvieran escritas a mano en cada fichero, en cuanto una
// se cambiara la otra se quedaría atrás, y el admin ajustaría el
// encuadre viendo algo que luego no es como sale en la web. Se
// comprueba con un test que las dos siguen usando la misma.
// ======================================================

/**
 * Alto del recuadro de imagen de una tarjeta de personaje.
 * h-80 = 20rem = 320px.
 *
 * Todas las tarjetas usan este mismo alto: la foto se adapta
 * dentro con "object-contain", asi que da igual que el original
 * sea vertical, cuadrado u horizontal. El fondo oscuro del
 * recuadro rellena lo que sobra.
 */
export const ALTURA_CARD_PERSONAJE = 'h-80';
