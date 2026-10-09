import type { UserSocialStats } from '../types/follows';

// ======================================================
// LÓGICA DE SEGUIMIENTOS (sin Firestore, sin React)
// ======================================================
//
// Se separa del servicio por el mismo motivo que `reactionLogic` y
// `notificaciones`: lo que se puede decidir sin red es lo que se
// puede comprobar en cero segundos con `npm run test:logica`, y es
// justo la clase de bug que no sale en la consola.
//
// Se escribe SIN TILDES, igual que los otros dos archivos de este
// directorio, porque los comentarios técnicos se leen en cualquier
// terminal.

// ──────────────────────────────────────────────────────────
// LOS NÚMEROS
// ──────────────────────────────────────────────────────────

/**
 * Mil separadores, como en el enunciado: "1.284 seguidores".
 *
 * El separador de miles en español es el punto, no la coma, y el
 * habitual es un espacio fino que en algunos navegadores se copia
 * como un espacio normal. El punto es más fiable para lo que se lee
 * de un vistazo.
 *
 * ── Por qué a mano y no `toLocaleString` ──────────────
 *
 * `toLocaleString('es-ES')` depende de los datos de idioma que
 * tenga el runtime. En un Node compilado con ICU pequeño (que es lo
 * que pasa en muchos entornos de CI y contenedores, y también en
 * navegadores con pocos idiomas) devuelve "1284" sin separador, y
 * el test falla sin que haya ningún error visible en la web.
 *
 * Grouping de millares con un `replace` sobre la parte entera es
 * cuatro líneas y da el mismo resultado en todas partes. No es
 * falta de profesionalidad: es que el dato tiene que salir igual en
 * el móvil de un usuario y en el test que lo comprueba.
 */
export function formatearNumero(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';

  // Se trunca a entero (los contadores lo son) y se agrupan solo los
  // dígitos de la parte entera: el `\B` evita el separador al
  // principio, y el `(?!\d)` evita que se ponga en medio de un grupo
  // de más de tres.
  return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * El texto del contador del perfil: "1.284 seguidores · 347 seguidos".
 *
 * En plural simple a propósito. El plural difícil ("1 seguidor" /
 * "2 seguidores") obliga a dos cadenas y un condicional, y en una
 * cifra de tres o cuatro dígitos la "s" final es casi imperceptible.
 */
export function textoContadores(stats: UserSocialStats): string {
  return `${formatearNumero(stats.followersCount)} seguidores · ${formatearNumero(
    stats.followingCount,
  )} seguidos`;
}

/** Plural de "seguidores" o "seguidos", para las etiquetas sueltas. */
export function etiquetaLista(cuantos: number, esSeguidores: boolean): string {
  return `${formatearNumero(cuantos)} ${esSeguidores ? 'seguidores' : 'seguidos'}`;
}

// ──────────────────────────────────────────────────────────
// A QUIÉN SE PUEDE SEGUIR
// ──────────────────────────────────────────────────────────

/**
 * Si tiene sentido enseñar el botón "Seguir" entre estas dos personas.
 *
 * Tres casos, y cada uno por un motivo distinto:
 *
 *   · contigo mismo, no: la interfaz ni lo pinta. Es también una
 *     protección, porque si llegara a pulsarse habría que escribir
 *     un documento que se sigue a sí mismo y subir un contador.
 *   · sin sesión, no: no hay a quién atribuir el seguimiento. La
 *     cuenta invitada lo resuelve con `requireAuth`, que ya existe
 *     en `AuthContext`.
 *   · una cuenta baneada, no: puede seguir escribiendo en los
 *     chats, así que su actividad se filtra en el directorio.
 *     Permitir seguirla sería meter en una lista a alguien que el
 *     resto de la web no muestra.
 */
export function sePuedeSeguir(opts: {
  miUid: string | null;
  suUid: string | null;
  estaBaneado?: boolean;
}): boolean {
  const { miUid, suUid, estaBaneado } = opts;

  if (!suUid) return false;
  if (!miUid) return false; // sin sesión: lo cubre `requireAuth`.
  if (miUid === suUid) return false;
  if (estaBaneado === true) return false;

  return true;
}

// ──────────────────────────────────────────────────────────
// EL ESTADO DEL BOTÓN
// ──────────────────────────────────────────────────────────

/** Lo que pone el botón, y si está ocupado. */
export interface EstadoBotonSeguir {
  texto: string;
  /** Variante visual, para no repetir el `switch` en cada componente. */
  estilo: 'primario' | 'siguiendo' | 'inactivo';
  /** No se puede pulsar (cargando o sin sesión). */
  deshabilitado: boolean;
}

/**
 * Qué pone el botón "Seguir" y con qué aspecto.
 *
 *   · Sin seguir        → "Seguir", morado lleno. Es la acción
 *                          principal, la que se quiere ver.
 *   · Siguiendo         → "Siguiendo", con borde. Pulsarlo deja
 *                          de seguir, así que es un estado, no un
 *                          botón de "confirmar".
 *   · cargando           → "Siguiendo" pero deshabilitado, porque
 *                          el estado todavía no se sabe. Poner
 *                          "Seguir" mientras carga haría que un
 *                          clic rápido creara una relación que el
 *                          usuario ya tenía.
 *
 * El texto "Dejar de seguir" se deja para el `title` y para el
 * aviso de confirmación, no para el botón: un botón que cambia de
 * ancho al pulsarse (segunido → dejar de seguir) desplaza todo lo
 * que hay a su lado en el momento exacto del clic, que es cuando
 * menos se quiere que nada se mueva.
 */
export function estadoBotonSeguir(opts: {
  siguiendo: boolean;
  cargando: boolean;
  miUid: string | null;
}): EstadoBotonSeguir {
  const { siguiendo, cargando, miUid } = opts;

  if (!miUid) {
    return {
      texto: 'Inicia sesión para seguir',
      estilo: 'inactivo',
      deshabilitado: true,
    };
  }

  if (siguiendo) {
    return {
      texto: 'Siguiendo',
      estilo: cargando ? 'inactivo' : 'siguiendo',
      deshabilitado: cargando,
    };
  }

  return {
    texto: cargando ? 'Comprobando...' : 'Seguir',
    estilo: cargando ? 'inactivo' : 'primario',
    deshabilitado: cargando,
  };
}

/**
 * Qué pasa al pulsar un botón que ya dice "Siguiendo".
 *
 * Devuelve `null` cuando hay que preguntar antes. Preguntar no es
 * un detalle: un "dejar de seguir" a un clic por error deshace la
 * suscripción, y el usuario tiene que volver a recorrer su lista
 * para volver a pulsarlo.
 */
export function pedirConfirmacionAlDejarDeSeguir(
  siguiendo: boolean,
  yaConfirmado: boolean,
): { preguntar: boolean; motivo: string } | null {
  if (!siguiendo || yaConfirmado) return null;

  return {
    preguntar: true,
    motivo: 'Si dejas de seguir, no verás sus hilos nuevos en tu feed.',
  };
}

// ──────────────────────────────────────────────────────────
// LA LISTA, ORDENADA
// ──────────────────────────────────────────────────────────

/**
 * Quién aparece primero en el modal.
 *
 * Los seguidores se ordenan por nivel y no por fecha: a quien
 * miran los seguidores de alguien no le interesa cuándo empezó a
 * seguirle, sino quién es. Y como `usersList` ya está en memoria
 * (`AuthContext`), ordenar por nivel no cuesta ninguna lectura
 * extra: es ordenar un array que ya se tenía.
 *
 * A los que no se les encuentra (cuenta borrada, o alguien que
 * `usersList` no tiene porque está baneado) se les pone al final
 * en vez de desaparecer de la lista: la relación existe y
 * esconderla haría que el contador no cuadrase con lo que se ve.
 */
export function ordenarParaMostrar<T>(
  items: T[],
  nivelDe: (item: T) => number,
  comparador: (a: T, b: T) => number,
): T[] {
  return [...items].sort((a, b) => {
    const diferencia = nivelDe(b) - nivelDe(a);
    if (diferencia !== 0) return diferencia;
    return comparador(a, b);
  });
}