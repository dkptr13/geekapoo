// ======================================================
// PREFERENCIAS LOCALES DE KAPO-CHAN
// ======================================================
//
// Nada de esto va a Firebase: son preferencias de este navegador y
// de esta persona. Si se borra el almacenamiento local, Kapo vuelve
// a su comportamiento por defecto, sin romper la cuenta.
//
// Aquí también se recuerda qué secciones se han visitado. No es una
// analítica: es una memoria corta para no recomendarle a alguien la
// wiki si ya lleva media hora en ella.

export type KapoFrecuencia = 'discreta' | 'normal' | 'parlanchina';

export interface KapoPreferencias {
  /** ¿Puede iniciar conversaciones por su cuenta? */
  espontaneos: boolean;
  /** Cuánto tarda en volver a hablar sola. */
  frecuencia: KapoFrecuencia;
  /** Última vez que el usuario cerró un diálogo. */
  ultimoCierreMs: number | null;
  /** Secciones visitadas, sin duplicados. */
  visitadas: string[];
}

export const PREFERENCIAS_POR_DEFECTO: KapoPreferencias = {
  espontaneos: true,
  frecuencia: 'normal',
  ultimoCierreMs: null,
  visitadas: [],
};

const CLAVE = 'geekapoo:kapo:prefs:v1';

const INTERVALOS: Record<KapoFrecuencia, number> = {
  discreta: 180_000,
  normal: 90_000,
  parlanchina: 50_000,
};

const PAUSAS_TRAS_CIERRE: Record<KapoFrecuencia, number> = {
  discreta: 15 * 60_000,
  normal: 8 * 60_000,
  parlanchina: 4 * 60_000,
};

/** Cada cuánto puede iniciar una conversación espontánea. */
export const intervaloEspontaneoMs = (frecuencia: KapoFrecuencia): number =>
  INTERVALOS[frecuencia] ?? INTERVALOS.normal;

/** Cuánto se calla después de que el usuario cierre el diálogo. */
export const pausaTrasCierreMs = (frecuencia: KapoFrecuencia): number =>
  PAUSAS_TRAS_CIERRE[frecuencia] ?? PAUSAS_TRAS_CIERRE.normal;

/** Etiqueta corta para el botón de ritmo. */
export const etiquetaFrecuencia = (frecuencia: KapoFrecuencia): string => {
  switch (frecuencia) {
    case 'discreta':
      return 'discreto';
    case 'parlanchina':
      return 'charlatán';
    default:
      return 'normal';
  }
};

const esFrecuencia = (valor: unknown): valor is KapoFrecuencia =>
  valor === 'discreta' || valor === 'normal' || valor === 'parlanchina';

/** Copia limpia de lo que haya en el almacenamiento. */
export function normalizarPreferencias(valor: unknown): KapoPreferencias {
  const crudo =
    valor && typeof valor === 'object'
      ? (valor as Partial<KapoPreferencias>)
      : {};

  return {
    espontaneos:
      typeof crudo.espontaneos === 'boolean'
        ? crudo.espontaneos
        : PREFERENCIAS_POR_DEFECTO.espontaneos,
    frecuencia: esFrecuencia(crudo.frecuencia)
      ? crudo.frecuencia
      : PREFERENCIAS_POR_DEFECTO.frecuencia,
    ultimoCierreMs:
      typeof crudo.ultimoCierreMs === 'number' && Number.isFinite(crudo.ultimoCierreMs)
        ? crudo.ultimoCierreMs
        : null,
    visitadas: Array.isArray(crudo.visitadas)
      ? Array.from(
          new Set(
            crudo.visitadas.filter(
              (s): s is string => typeof s === 'string' && s.length > 0,
            ),
          ),
        ).slice(-30)
      : [],
  };
}

export function leerPreferencias(): KapoPreferencias {
  if (typeof window === 'undefined') {
    return { ...PREFERENCIAS_POR_DEFECTO, visitadas: [] };
  }

  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return { ...PREFERENCIAS_POR_DEFECTO, visitadas: [] };
    return normalizarPreferencias(JSON.parse(crudo));
  } catch {
    // Modo privado, almacenamiento lleno o JSON roto: se usan los
    // valores por defecto en vez de romper la mascota.
    return { ...PREFERENCIAS_POR_DEFECTO, visitadas: [] };
  }
}

export function guardarPreferencias(preferencias: KapoPreferencias): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(preferencias));
  } catch {
    // Sin persistencia se sigue funcionando en memoria.
  }
}

/**
 * Apunta una visita. Devuelve el MISMO objeto si ya estaba, para
 * que el `setState` no provoque renders inútiles.
 */
export function registrarVisita(
  preferencias: KapoPreferencias,
  seccion: string | null | undefined,
): KapoPreferencias {
  if (!seccion || preferencias.visitadas.includes(seccion)) return preferencias;
  return {
    ...preferencias,
    visitadas: [...preferencias.visitadas, seccion].slice(-30),
  };
}

export interface KapoSeccionDescubrible {
  /** Nombre real de la pestaña (`?tab=`). */
  seccion: string;
  /** Cómo se llama en una frase. */
  etiqueta: string;
  emoji: string;
  /** Qué hay dentro, en pocas palabras. */
  frase: string;
}

/**
 * Secciones que merece la pena recomendar. No están todas: el
 * perfil y los ajustes se descubren solos, y administración no se
 * anuncia a quien no es del equipo.
 */
export const SECCIONES_DESCUBRIBLES: KapoSeccionDescubrible[] = [
  {
    seccion: 'wiki',
    etiqueta: 'la Wiki',
    emoji: '📚',
    frase: 'buscar series, personajes y episodios',
  },
  {
    seccion: 'trivia',
    etiqueta: 'la Trivia',
    emoji: '🧠',
    frase: 'tres preguntas al día y una racha que mantener',
  },
  {
    seccion: 'chats',
    etiqueta: 'Chats y clubes',
    emoji: '💬',
    frase: 'hablar en directo y entrar en clubes con canales',
  },
  {
    seccion: 'logros',
    etiqueta: 'Logros',
    emoji: '🏆',
    frase: 'ver medallas, títulos y lo que te falta',
  },
  {
    seccion: 'extras',
    etiqueta: 'Extras',
    emoji: '🧰',
    frase: 'tier lists, encuestas y herramientas adicionales',
  },
  {
    seccion: 'soporte',
    etiqueta: 'Soporte',
    emoji: '📮',
    frase: 'abrir un ticket si algo no funciona',
  },
];

/**
 * Una sección que el usuario no ha visitado, si queda alguna.
 *
 * `azar` se recibe para poder probarlo sin depender de Math.random.
 */
export function seccionPorDescubrir(
  visitadas: string[],
  candidatas: KapoSeccionDescubrible[] = SECCIONES_DESCUBRIBLES,
  azar: number = Math.random(),
): KapoSeccionDescubrible | null {
  const pendientes = candidatas.filter((c) => !visitadas.includes(c.seccion));
  if (pendientes.length === 0) return null;
  const i = Math.min(pendientes.length - 1, Math.floor(azar * pendientes.length));
  return pendientes[i];
}
