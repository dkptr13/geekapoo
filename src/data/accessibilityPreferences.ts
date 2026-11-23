// ======================================================
// PREFERENCIAS DE ACCESIBILIDAD — MODELO ÚNICO
// ======================================================
//
// Un solo objeto versionado para toda la aplicación. Se guarda:
//   · en `userPrivate/{uid}.accessibility` si hay sesión;
//   · en localStorage para invitados y como caché local.
//
// No contiene ningún dato médico ni clasifica a nadie: solo
// valores de presentación elegidos por la persona.

export type ContrastMode = 'normal' | 'enhanced' | 'high';
export type MotionMode = 'system' | 'reduced' | 'none';
export type SpacingPreset = 'normal' | 'comfortable' | 'wide' | 'wcag' | 'custom';

export interface AccessibilityPreferences {
  version: 2;
  /** 0,9 = pequeño, 1 = normal, 2 = 200 %. */
  textScale: number;
  spacingPreset: SpacingPreset;
  /** Multiplicadores de línea, letra, palabra y párrafo. */
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  paragraphSpacing: number;
  contrast: ContrastMode;
  underlineLinks: boolean;
  strongBorders: boolean;
  highlightSelection: boolean;
  reduceTransparency: boolean;
  motion: MotionMode;
  soundEnabled: boolean;
  soundInterface: boolean;
  soundNotifications: boolean;
  soundMessages: boolean;
  /** 0 a 1. */
  soundVolume: number;
  largeControls: boolean;
  simplified: boolean;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  version: 2,
  textScale: 1,
  spacingPreset: 'normal',
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  paragraphSpacing: 0,
  contrast: 'normal',
  underlineLinks: false,
  strongBorders: false,
  highlightSelection: false,
  reduceTransparency: false,
  motion: 'system',
  soundEnabled: false,
  soundInterface: true,
  soundNotifications: true,
  soundMessages: true,
  soundVolume: 0.5,
  largeControls: false,
  simplified: false,
};

export const TEXT_SIZE_PRESETS = [
  { id: 'small', label: 'Pequeño', scale: 0.9 },
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'slightly-large', label: 'Ligeramente grande', scale: 1.1 },
  { id: 'large', label: 'Grande', scale: 1.25 },
  { id: 'very-large', label: 'Muy grande', scale: 1.5 },
] as const;

export type TextSizePresetId = (typeof TEXT_SIZE_PRESETS)[number]['id'];

export const SPACING_PRESETS: Record<
  Exclude<SpacingPreset, 'custom'>,
  { label: string; description: string; lineHeight: number; letterSpacing: number; wordSpacing: number; paragraphSpacing: number }
> = {
  normal: {
    label: 'Normal',
    description: 'El espaciado original de Geekapoo.',
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    paragraphSpacing: 0,
  },
  comfortable: {
    label: 'Cómodo',
    description: 'Un poco más de aire entre líneas y párrafos.',
    lineHeight: 1.7,
    letterSpacing: 0.01,
    wordSpacing: 0.04,
    paragraphSpacing: 1,
  },
  wide: {
    label: 'Amplio',
    description: 'Lectura relajada para textos largos.',
    lineHeight: 1.9,
    letterSpacing: 0.03,
    wordSpacing: 0.08,
    paragraphSpacing: 1.5,
  },
  wcag: {
    label: 'Texto espaciado (WCAG)',
    description: 'Cumple las referencias de espaciado de WCAG 1.4.12.',
    lineHeight: 1.5,
    letterSpacing: 0.12,
    wordSpacing: 0.16,
    paragraphSpacing: 2,
  },
};

export const CONTRAST_OPTIONS: Array<{
  id: ContrastMode;
  label: string;
  description: string;
}> = [
  {
    id: 'normal',
    label: 'Normal',
    description: 'El tema oscuro y morado de siempre.',
  },
  {
    id: 'enhanced',
    label: 'Contraste mejorado',
    description: 'Textos secundarios y bordes más definidos sin perder el color.',
  },
  {
    id: 'high',
    label: 'Alto contraste',
    description: 'Máxima separación entre fondos, textos, bordes y controles.',
  },
];

export const MOTION_OPTIONS: Array<{
  id: MotionMode;
  label: string;
  description: string;
}> = [
  {
    id: 'system',
    label: 'Normal',
    description: 'Mantiene las animaciones y respeta la preferencia del sistema.',
  },
  {
    id: 'reduced',
    label: 'Animaciones reducidas',
    description: 'Acorta transiciones y elimina movimientos decorativos.',
  },
  {
    id: 'none',
    label: 'Sin animaciones decorativas',
    description: 'Desactiva los efectos no esenciales; los cambios de estado siguen visibles.',
  },
];

export const QUICK_PROFILES = [
  {
    id: 'lectura',
    label: 'Lectura cómoda',
    description: 'Texto más grande, líneas espaciadas y enlaces subrayados.',
  },
  {
    id: 'visibilidad',
    label: 'Alta visibilidad',
    description: 'Alto contraste, bordes fuertes y estados activos destacados.',
  },
  {
    id: 'movimiento',
    label: 'Menos movimiento',
    description: 'Animaciones reducidas y menos efectos decorativos.',
  },
  {
    id: 'controles',
    label: 'Controles grandes',
    description: 'Botones y campos más amplios para pulsar con comodidad.',
  },
  {
    id: 'simplificada',
    label: 'Interfaz simplificada',
    description: 'Menos adornos y transparencias, más foco en el contenido.',
  },
] as const;

export type QuickProfileId = (typeof QUICK_PROFILES)[number]['id'];

export function quickProfilePatch(id: QuickProfileId): Partial<AccessibilityPreferences> {
  switch (id) {
    case 'lectura':
      return {
        textScale: 1.25,
        spacingPreset: 'comfortable',
        lineHeight: 1.7,
        letterSpacing: 0.01,
        wordSpacing: 0.04,
        paragraphSpacing: 1,
        underlineLinks: true,
      };
    case 'visibilidad':
      return {
        contrast: 'high',
        underlineLinks: true,
        strongBorders: true,
        highlightSelection: true,
        reduceTransparency: true,
      };
    case 'movimiento':
      return {
        motion: 'reduced',
        simplified: true,
      };
    case 'controles':
      return {
        largeControls: true,
        highlightSelection: true,
      };
    case 'simplificada':
      return {
        simplified: true,
        motion: 'reduced',
        reduceTransparency: true,
      };
  }
}

function numero(valor: unknown, defecto: number, min: number, max: number): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n)) return defecto;
  return Math.min(max, Math.max(min, n));
}

function booleano(valor: unknown, defecto: boolean): boolean {
  return typeof valor === 'boolean' ? valor : defecto;
}

function opcion<T extends string>(
  valor: unknown,
  opciones: readonly T[],
  defecto: T,
): T {
  return typeof valor === 'string' && opciones.includes(valor as T)
    ? (valor as T)
    : defecto;
}

/**
 * Normaliza cualquier objeto (Firestore, localStorage o legado).
 * Nunca lanza: una preferencia corrupta no puede romper la app.
 */
export function normalizarPreferenciasAccesibilidad(
  valor: unknown,
): AccessibilityPreferences {
  const datos =
    valor && typeof valor === 'object'
      ? (valor as Record<string, unknown>)
      : {};

  // Migración de la Fase 1: solo tenía cuatro booleanos y una
  // clase de texto grande.
  const legado = datos as {
    reduceMotion?: unknown;
    highContrast?: unknown;
    underlineLinks?: unknown;
    largeText?: unknown;
  };
  const esLegado =
    datos.version === undefined &&
    ('largeText' in datos ||
      'highContrast' in datos ||
      'reduceMotion' in datos ||
      'underlineLinks' in datos);

  if (esLegado) {
    return {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      textScale: legado.largeText === true ? 1.125 : 1,
      contrast: legado.highContrast === true ? 'high' : 'normal',
      underlineLinks: legado.underlineLinks === true,
      motion: legado.reduceMotion === true ? 'reduced' : 'system',
    };
  }

  return {
    version: 2,
    textScale: numero(datos.textScale, 1, 0.9, 2),
    spacingPreset: opcion(
      datos.spacingPreset,
      ['normal', 'comfortable', 'wide', 'wcag', 'custom'] as const,
      'normal',
    ),
    lineHeight: numero(datos.lineHeight, 1.5, 1.1, 2.4),
    letterSpacing: numero(datos.letterSpacing, 0, 0, 0.3),
    wordSpacing: numero(datos.wordSpacing, 0, 0, 0.5),
    paragraphSpacing: numero(datos.paragraphSpacing, 0, 0, 3),
    contrast: opcion(datos.contrast, ['normal', 'enhanced', 'high'] as const, 'normal'),
    underlineLinks: booleano(datos.underlineLinks, false),
    strongBorders: booleano(datos.strongBorders, false),
    highlightSelection: booleano(datos.highlightSelection, false),
    reduceTransparency: booleano(datos.reduceTransparency, false),
    motion: opcion(datos.motion, ['system', 'reduced', 'none'] as const, 'system'),
    soundEnabled: booleano(datos.soundEnabled, false),
    soundInterface: booleano(datos.soundInterface, true),
    soundNotifications: booleano(datos.soundNotifications, true),
    soundMessages: booleano(datos.soundMessages, true),
    soundVolume: numero(datos.soundVolume, 0.5, 0, 1),
    largeControls: booleano(datos.largeControls, false),
    simplified: booleano(datos.simplified, false),
  };
}

/** Firma estable para comparar y no reescribir Firestore sin cambios. */
export function firmaPreferencias(prefs: AccessibilityPreferences): string {
  return JSON.stringify({
    version: 2,
    textScale: prefs.textScale,
    spacingPreset: prefs.spacingPreset,
    lineHeight: prefs.lineHeight,
    letterSpacing: prefs.letterSpacing,
    wordSpacing: prefs.wordSpacing,
    paragraphSpacing: prefs.paragraphSpacing,
    contrast: prefs.contrast,
    underlineLinks: prefs.underlineLinks,
    strongBorders: prefs.strongBorders,
    highlightSelection: prefs.highlightSelection,
    reduceTransparency: prefs.reduceTransparency,
    motion: prefs.motion,
    soundEnabled: prefs.soundEnabled,
    soundInterface: prefs.soundInterface,
    soundNotifications: prefs.soundNotifications,
    soundMessages: prefs.soundMessages,
    soundVolume: prefs.soundVolume,
    largeControls: prefs.largeControls,
    simplified: prefs.simplified,
  });
}

const FIRMA_DEFECTOS = firmaPreferencias(DEFAULT_ACCESSIBILITY_PREFERENCES);

export type OrigenPreferencias = 'remoto' | 'cache' | 'invitado' | 'defectos';

export interface DecisionPreferenciasIniciales {
  prefs: AccessibilityPreferences;
  origen: OrigenPreferencias;
  /** `true` si hay que subir estas preferencias al perfil. */
  subir: boolean;
}

/**
 * Decide qué preferencias aplicar al entrar en una cuenta.
 *
 * Orden:
 *   1. Lo guardado en el perfil manda (sincronización entre
 *      dispositivos).
 *   2. Si el perfil no tiene nada, la copia local de ese usuario.
 *   3. Si tampoco hay copia, lo que el invitado hubiera ajustado.
 *   4. Si todo son valores por defecto, no se escribe nada.
 *
 * Nunca sustituye una configuración guardada por los valores por
 * defecto: los defectos solo se usan cuando no hay nada que aplicar.
 */
export function elegirPreferenciasIniciales(
  remoto: AccessibilityPreferences | null,
  cache: AccessibilityPreferences | null,
  invitado: AccessibilityPreferences,
): DecisionPreferenciasIniciales {
  if (remoto) {
    return { prefs: remoto, origen: 'remoto', subir: false };
  }

  if (cache && firmaPreferencias(cache) !== FIRMA_DEFECTOS) {
    return { prefs: cache, origen: 'cache', subir: true };
  }

  if (firmaPreferencias(invitado) !== FIRMA_DEFECTOS) {
    return { prefs: invitado, origen: 'invitado', subir: true };
  }

  return {
    prefs: { ...DEFAULT_ACCESSIBILITY_PREFERENCES },
    origen: 'defectos',
    subir: false,
  };
}

/** Aplica clases, atributos y variables en <html>. */
export function aplicarPreferenciasAlDocumento(
  prefs: AccessibilityPreferences,
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.dataset.contrast = prefs.contrast;
  root.dataset.motion = prefs.motion;
  root.dataset.controls = prefs.largeControls ? 'large' : 'normal';
  root.dataset.simplified = prefs.simplified ? 'true' : 'false';
  root.dataset.spacing = prefs.spacingPreset;
  root.dataset.borders = prefs.strongBorders ? 'strong' : 'normal';
  root.dataset.selection = prefs.highlightSelection ? 'strong' : 'normal';
  root.dataset.transparency = prefs.reduceTransparency ? 'reduced' : 'normal';
  root.dataset.underline = prefs.underlineLinks ? 'true' : 'false';

  if (prefs.textScale !== 1) {
    root.dataset.textSize = 'custom';
  } else {
    delete root.dataset.textSize;
  }

  root.style.setProperty('--a11y-text-scale', String(prefs.textScale));
  root.style.setProperty('--a11y-line-height', String(prefs.lineHeight));
  root.style.setProperty('--a11y-letter-spacing', `${prefs.letterSpacing}em`);
  root.style.setProperty('--a11y-word-spacing', `${prefs.wordSpacing}em`);
  root.style.setProperty('--a11y-paragraph-spacing', `${prefs.paragraphSpacing}em`);
}
