// Qué medallas y subidas ya se han celebrado, para no repetirlas.
//
// ── POR QUÉ PERSISTE ─────────────────────────────────────────────
//
// La primera versión decidía "es nuevo" comparando FECHAS en memoria:
// si la fecha guardada era distinta a la que traía el documento, la
// medalla se celebraba. Y la "primera vez" era un `ref` que vivía lo
// que el componente montado.
//
// Eso aguantaba la sesión, pero no el inicio de sesión: basta con que
// la primera lectura traiga el documento vacío (caché, reintento) y la
// segunda lo traiga lleno para que TODAS las medallas parezcan nuevas.
// Y cada remontaje volvía a empezar de cero.
//
// La regla ahora es por ID y persistente: una medalla celebrada (o
// vista) no se vuelve a celebrar nunca en este navegador, pase lo que
// pase con fechas, cachés o remontajes.
//
// ── LO QUE NO CUBRE ──────────────────────────────────────────────
//
// Otro dispositivo no sabe lo que celebró este: allí saldrá una vez.
// Para "una vez en todos los sitios" haría falta guardarlo en
// Firestore, con regla y escritura propias. Se deja así a propósito:
// un aviso repetido en otro aparato es molesto una vez; tocar las
// reglas por esto es riesgo siempre.

/** Lo mínimo que se necesita para guardar: `localStorage` vale. */
export interface GuardadoCelebraciones {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function claveDe(uid: string): string {
  return `geekapoo_celebrado_${uid}`;
}

/** Lee los ids celebrados. Si algo falla, devuelve vacío: sin avisos. */
export function leerCelebradas(
  guardar: Pick<GuardadoCelebraciones, 'getItem'> | null | undefined,
  uid: string,
): Set<string> {
  try {
    const crudo = guardar?.getItem(claveDe(uid));

    if (!crudo) return new Set();

    const lista: unknown = JSON.parse(crudo);

    if (!Array.isArray(lista)) return new Set();

    return new Set(lista.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

/**
 * Apunta ids como celebrados.
 *
 * Devuelve el conjunto resultante. Si no se puede guardar (privado,
 * lleno, roto), se devuelve igual: el aviso de esta sesión ya no
 * sale, solo se pierde la persistencia.
 */
export function apuntarCelebradas(
  guardar: GuardadoCelebraciones | null | undefined,
  uid: string,
  conocidas: Set<string>,
  nuevas: string[],
): Set<string> {
  const todas = new Set(conocidas);

  nuevas.forEach((id) => todas.add(id));

  try {
    guardar?.setItem(claveDe(uid), JSON.stringify([...todas]));
  } catch {
    // Sin persistencia no hay error que enseñar: el aviso ya se
    // decidió con `todas`, que vive en memoria igualmente.
  }

  return todas;
}

/** El guardado del navegador, o `null` si no hay. */
export function guardadoNavegador(): GuardadoCelebraciones | null {
  try {
    const g = globalThis.localStorage;

    if (!g || typeof g.getItem !== 'function') return null;

    return g;
  } catch {
    return null;
  }
}
