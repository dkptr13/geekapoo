/**
 * Apariencia del chat: catálogo, valores y resolución.
 *
 * Todo lo que un usuario puede ponerse en el chat vive aquí.
 * Se guarda en `users/{uid}.chatApariencia` y solo afecta a SU
 * conversación: cada uno ve el chat con sus colores, nunca con
 * los del otro.
 *
 * ── POR QUÉ UN MAPA Y NO CAMPOS SUELTOS ─────────────────────
 *
 * Igual que `profileBackground`: un solo campo versiona la
 * función entera. Si mañana hay más opciones, las cuentas
 * antiguas siguen sin el campo y se ven como siempre, sin
 * migrar nada.
 *
 * Las reglas de Firestore (`firestore.rules`,
 * `personalizacionValida()`) solo comprueban FORMATOS (ids de
 * la lista, hex de la paleta, https, rangos): la lista válida
 * es esta de aquí.
 */

import type { CSSProperties } from 'react';

// ──────────────────────────────────────────────────────────
// VOCABULARIO
// ──────────────────────────────────────────────────────────

export type TemaChat = 'oscuro' | 'negro' | 'morado' | 'claro' | 'neon' | 'personalizado';
export type FormaBurbuja = 'redonda' | 'suave' | 'cuadrada';
export type EstiloBurbuja = 'moderno' | 'compacto';
export type TamanoLetraChat = 'pequena' | 'normal' | 'grande';
export type EspaciadoChat = 'compacto' | 'normal' | 'amplio';
export type AnchoBurbuja = 'estrecho' | 'normal' | 'ancho';
export type AjusteFondoChat = 'cover' | 'contain';
export type PosicionFondoChat = 'center' | 'top' | 'bottom';

export interface FondoChat {
  preset?: string;
  url?: string;
  ajuste?: AjusteFondoChat;
  position?: PosicionFondoChat;
  /** Oscurecido 0-80, para leer sobre el fondo. */
  dim?: number;
}

export interface AparienciaChat {
  tema: TemaChat;
  /** Null = el color del tema. Hex de `HEXES_CHAT`. */
  colorPropio?: string | null;
  colorRecibido?: string | null;
  textoPropio?: string | null;
  textoRecibido?: string | null;
  fondo?: FondoChat | null;
  forma?: FormaBurbuja;
  estilo?: EstiloBurbuja;
  letra?: TamanoLetraChat;
  espaciado?: EspaciadoChat;
  ancho?: AnchoBurbuja;
  reducirMovimiento?: boolean;
}

// ──────────────────────────────────────────────────────────
// PALETA CERRADA
// ──────────────────────────────────────────────────────────
// Los colores personalizados salen de aquí y no de un input
// libre. Las reglas piden texto con forma de color (`#` + 6);
// la paleta cerrada es UX del panel, y por consola solo entra
// texto que como mucho no pinta.

export interface ColorChat {
  id: string;
  nombre: string;
  hex: string;
}

export const COLORES_BURBUJA: ColorChat[] = [
  { id: 'violeta', nombre: 'Violeta', hex: '#7c3aed' },
  { id: 'morado-osc', nombre: 'Morado oscuro', hex: '#4c1d95' },
  { id: 'fucsia', nombre: 'Fucsia', hex: '#c026d3' },
  { id: 'azul', nombre: 'Azul', hex: '#2563eb' },
  { id: 'cian', nombre: 'Cian', hex: '#0891b2' },
  { id: 'esmeralda', nombre: 'Esmeralda', hex: '#059669' },
  { id: 'grafito', nombre: 'Grafito', hex: '#27272a' },
  { id: 'carbon', nombre: 'Carbón', hex: '#18181b' },
  { id: 'pizarra', nombre: 'Pizarra', hex: '#334155' },
  { id: 'vino', nombre: 'Vino', hex: '#881337' },
  { id: 'ambar', nombre: 'Ámbar', hex: '#b45309' },
  { id: 'marfil', nombre: 'Marfil', hex: '#f4f4f5' },
];

export const COLORES_TEXTO: ColorChat[] = [
  { id: 'blanco', nombre: 'Blanco', hex: '#ffffff' },
  { id: 'humo', nombre: 'Humo', hex: '#e4e4e7' },
  { id: 'tinta', nombre: 'Tinta', hex: '#18181b' },
  { id: 'grafito-tx', nombre: 'Grafito', hex: '#3f3f46' },
];

export const HEXES_CHAT: string[] = [
  ...COLORES_BURBUJA.map((c) => c.hex),
  ...COLORES_TEXTO.map((c) => c.hex),
];

// ──────────────────────────────────────────────────────────
// TEMAS
// ──────────────────────────────────────────────────────────

export interface TemaChatInfo {
  id: TemaChat;
  nombre: string;
  descripcion: string;
  /** Fondo de la lista de mensajes (CSS `background`). */
  fondoLista: string;
  /** Burbuja propia / recibida (CSS `background`). */
  propia: string;
  recibida: string;
  textoPropia: string;
  textoRecibida: string;
  /** Borde de la burbuja recibida (solo el tema oscuro lo trae). */
  bordeRecibida?: string;
  /** ¿El velo del fondo aclara (tema claro) u oscurece? */
  veloClaro: boolean;
}

export const TEMAS_CHAT: TemaChatInfo[] = [
  {
    id: 'oscuro',
    nombre: 'Oscuro Geekapoo',
    descripcion: 'El de siempre.',
    fondoLista: 'transparent',
    propia: 'linear-gradient(to right,#7c3aed,#c026d3)',
    recibida: '#27272a',
    textoPropia: '#ffffff',
    textoRecibida: '#f4f4f5',
    bordeRecibida: '1px solid #3f3f46',
    veloClaro: false,
  },
  {
    id: 'negro',
    nombre: 'Negro absoluto',
    descripcion: 'Fondo negro puro.',
    fondoLista: '#000000',
    propia: '#4c1d95',
    recibida: '#111113',
    textoPropia: '#ffffff',
    textoRecibida: '#e4e4e7',
    veloClaro: false,
  },
  {
    id: 'morado',
    nombre: 'Morado Geekapoo',
    descripcion: 'Todo en violeta.',
    fondoLista: 'linear-gradient(180deg,#1e1033,#2e1065)',
    propia: '#7c3aed',
    recibida: '#3b1470',
    textoPropia: '#ffffff',
    textoRecibida: '#ede9fe',
    veloClaro: false,
  },
  {
    id: 'claro',
    nombre: 'Modo claro',
    descripcion: 'Fondo claro y texto oscuro.',
    fondoLista: '#f4f4f5',
    propia: '#7c3aed',
    recibida: '#ffffff',
    textoPropia: '#ffffff',
    textoRecibida: '#27272a',
    veloClaro: true,
  },
  {
    id: 'neon',
    nombre: 'Azul neón',
    descripcion: 'Cian sobre negro azulado.',
    fondoLista: '#050510',
    propia: 'linear-gradient(to right,#0891b2,#22d3ee)',
    recibida: '#0a0a23',
    textoPropia: '#04121a',
    textoRecibida: '#cffafe',
    veloClaro: false,
  },
  {
    id: 'personalizado',
    nombre: 'Personalizado',
    descripcion: 'Tus colores.',
    fondoLista: 'transparent',
    propia: 'linear-gradient(to right,#7c3aed,#c026d3)',
    recibida: '#27272a',
    textoPropia: '#ffffff',
    textoRecibida: '#f4f4f5',
    veloClaro: false,
  },
];

export const TEMA_POR_DEFECTO: TemaChat = 'oscuro';

// ──────────────────────────────────────────────────────────
// GALERÍA DE FONDOS (solo CSS, cero peso)
// ──────────────────────────────────────────────────────────

export interface FondoPresetChat {
  id: string;
  nombre: string;
  /** CSS `background` sin el velo (lo pone `dim`). */
  css: string;
}

export const FONDOS_CHAT: FondoPresetChat[] = [
  { id: 'ninguno', nombre: 'Sin fondo', css: '' },
  { id: 'tinta', nombre: 'Tinta sólida', css: '#18181b' },
  { id: 'vino', nombre: 'Vino sólido', css: '#3f1d2e' },
  { id: 'bosque', nombre: 'Bosque sólido', css: '#14231c' },
  { id: 'ocaso-kyoto', nombre: 'Ocaso en Kioto', css: 'linear-gradient(160deg,#7c2d12,#c2410c 45%,#431407)' },
  { id: 'ola', nombre: 'Gran ola', css: 'linear-gradient(160deg,#0c4a6e,#0369a1 50%,#082f49)' },
  { id: 'bambu', nombre: 'Bambú', css: 'linear-gradient(160deg,#14532d,#16a34a 55%,#052e16)' },
  { id: 'sakura', nombre: 'Sakura de noche', css: 'linear-gradient(160deg,#500f28,#be185d 55%,#1c0a14)' },
  { id: 'neon-nocturno', nombre: 'Neón nocturno', css: 'linear-gradient(160deg,#164e63,#7c3aed 60%,#0a0a23)' },
  { id: 'pixel', nombre: 'Pixel', css: 'linear-gradient(135deg,#312e81,#6d28d9 50%,#0ea5e9)' },
  { id: 'medianoche', nombre: 'Medianoche', css: 'radial-gradient(90%_70%_at_50%_0%,#1e1b4b,#020617 75%)' },
];

export const FONDO_PREDETERMINADO_ID = 'ninguno';

/** Oscurecido 0-80, como en el perfil. */
export const DIM_MAXIMO_CHAT = 80;

// ──────────────────────────────────────────────────────────
// VALORES Y RESOLUCIÓN
// ──────────────────────────────────────────────────────────

export const APARIENCIA_POR_DEFECTO: AparienciaChat = {
  tema: TEMA_POR_DEFECTO,
  colorPropio: null,
  colorRecibido: null,
  textoPropio: null,
  textoRecibido: null,
  fondo: null,
  forma: 'redonda',
  estilo: 'moderno',
  letra: 'normal',
  espaciado: 'normal',
  ancho: 'normal',
  reducirMovimiento: false,
};

const enLista = <T extends string>(v: unknown, lista: readonly T[], defecto: T): T =>
  typeof v === 'string' && (lista as readonly string[]).includes(v) ? (v as T) : defecto;

const hexValido = (v: unknown): string | null =>
  typeof v === 'string' && HEXES_CHAT.includes(v.toLowerCase()) ? v.toLowerCase() : null;

/**
 * Deja una apariencia a salvo: lo desconocido (cuentas
 * antiguas, datos tocados a mano) cae a los valores de la
 * casa. Nunca se pinta nada roto.
 */
export function sujetarApariencia(valor: unknown): AparienciaChat {
  const v = (valor ?? {}) as Partial<AparienciaChat>;
  const fondo = (v.fondo ?? {}) as FondoChat;
  const tieneFondo =
    typeof fondo === 'object' &&
    fondo !== null &&
    (typeof fondo.preset === 'string' || typeof fondo.url === 'string');
  return {
    tema: enLista(v.tema, TEMAS_CHAT.map((t) => t.id), TEMA_POR_DEFECTO),
    colorPropio: hexValido(v.colorPropio),
    colorRecibido: hexValido(v.colorRecibido),
    textoPropio: hexValido(v.textoPropio),
    textoRecibido: hexValido(v.textoRecibido),
    fondo: tieneFondo
      ? {
          ...(typeof fondo.preset === 'string' ? { preset: fondo.preset } : {}),
          ...(typeof fondo.url === 'string' ? { url: fondo.url } : {}),
          ajuste: fondo.ajuste === 'contain' ? 'contain' : 'cover',
          position: fondo.position === 'top' || fondo.position === 'bottom' ? fondo.position : 'center',
          dim:
            typeof fondo.dim === 'number' && Number.isFinite(fondo.dim)
              ? Math.min(DIM_MAXIMO_CHAT, Math.max(0, Math.round(fondo.dim)))
              : 0,
        }
      : null,
    forma: enLista(v.forma, ['redonda', 'suave', 'cuadrada'] as const, 'redonda'),
    estilo: enLista(v.estilo, ['moderno', 'compacto'] as const, 'moderno'),
    letra: enLista(v.letra, ['pequena', 'normal', 'grande'] as const, 'normal'),
    espaciado: enLista(v.espaciado, ['compacto', 'normal', 'amplio'] as const, 'normal'),
    ancho: enLista(v.ancho, ['estrecho', 'normal', 'ancho'] as const, 'normal'),
    reducirMovimiento: v.reducirMovimiento === true,
  };
}

/**
 * Arma el mapa tal cual se guarda en Firestore.
 *
 * Sin claves `undefined`: Firestore las rechaza dentro de un
 * mapa, así que solo viaja lo definido (igual que
 * `fondoAGuardar` del perfil).
 */
export function aparienciaAGuardar(v: AparienciaChat): AparienciaChat {
  const s = sujetarApariencia(v);
  const salida: AparienciaChat = { tema: s.tema };
  if (s.colorPropio) salida.colorPropio = s.colorPropio;
  if (s.colorRecibido) salida.colorRecibido = s.colorRecibido;
  if (s.textoPropio) salida.textoPropio = s.textoPropio;
  if (s.textoRecibido) salida.textoRecibido = s.textoRecibido;
  if (s.fondo) salida.fondo = s.fondo;
  if (s.forma && s.forma !== 'redonda') salida.forma = s.forma;
  if (s.estilo && s.estilo !== 'moderno') salida.estilo = s.estilo;
  if (s.letra && s.letra !== 'normal') salida.letra = s.letra;
  if (s.espaciado && s.espaciado !== 'normal') salida.espaciado = s.espaciado;
  if (s.ancho && s.ancho !== 'normal') salida.ancho = s.ancho;
  if (s.reducirMovimiento) salida.reducirMovimiento = true;
  return salida;
}

export interface EstiloChatResuelto {
  /** `style` de la lista de mensajes (fondo). */
  fondoLista: CSSProperties;
  burbujaPropia: CSSProperties;
  burbujaRecibida: CSSProperties;
  /** `style` común de burbuja (radio). */
  radio: CSSProperties;
  /** Recorte de la esquina del bocadillo (la "cola"). Vacío en cuadradas. */
  esquinaPropia: CSSProperties;
  esquinaRecibida: CSSProperties;
  /** Tamaño de letra del texto de la burbuja. Vacío en normal. */
  letra: CSSProperties;
  /** Clase de letra cuando es la normal (15px móvil, 14px escritorio). */
  letraClase: string;
  /** Separación entre mensajes. */
  gapLista: CSSProperties;
  /** Clases de ancho máximo (conservan el tope de lectura). */
  ancho: string;
  /** Relleno de burbuja según estilo. */
  relleno: string;
}

const RADIO_FORMA: Record<FormaBurbuja, string> = {
  redonda: '1rem',
  suave: '0.5rem',
  cuadrada: '0.125rem',
};

const LETRA_TAMANO: Record<TamanoLetraChat, string> = {
  pequena: '13px',
  normal: '',
  grande: '17px',
};

const GAP_ESPACIADO: Record<EspaciadoChat, string> = {
  compacto: '0.5rem',
  normal: '1rem',
  amplio: '1.75rem',
};

const ANCHO_CLASES: Record<AnchoBurbuja, string> = {
  estrecho: 'max-w-[70%] sm:max-w-[60%] 2xl:max-w-[38%]',
  normal: 'max-w-[78%] sm:max-w-[70%] 2xl:max-w-[45%]',
  ancho: 'max-w-[92%] sm:max-w-[85%] 2xl:max-w-[62%]',
};

/**
 * De la apariencia guardada a estilos listos para pintar. Todo
 * cae a la casa cuando falta o no vale: `sujetarApariencia`
 * ya limpió, aquí solo se traduce.
 */
export function resolverApariencia(valor: unknown): EstiloChatResuelto {
  const a = sujetarApariencia(valor);
  const tema = TEMAS_CHAT.find((t) => t.id === a.tema) ?? TEMAS_CHAT[0];

  // Fondo: imagen subida, preset de la galería o el del tema.
  // El velo (negro o blanco según tema) va siempre delante para
  // que el texto se lea.
  const velo = tema.veloClaro
    ? `rgba(255,255,255,${(a.fondo?.dim ?? 0) / 100})`
    : `rgba(0,0,0,${(a.fondo?.dim ?? 0) / 100})`;
  let fondoLista: CSSProperties;
  if (a.fondo?.url && /^https:\/\//i.test(a.fondo.url)) {
    fondoLista = {
      backgroundImage: `linear-gradient(${velo},${velo}),url("${a.fondo.url}")`,
      backgroundSize: a.fondo.ajuste === 'contain' ? 'contain' : 'cover',
      backgroundPosition: `center ${a.fondo.position ?? 'center'}`,
      backgroundRepeat: 'no-repeat',
    };
  } else if (a.fondo?.preset && a.fondo.preset !== FONDO_PREDETERMINADO_ID) {
    const preset = FONDOS_CHAT.find((f) => f.id === a.fondo?.preset);
    const base = preset && preset.css ? preset.css : 'transparent';
    fondoLista = {
      backgroundImage: `linear-gradient(${velo},${velo}),${base}`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    };
  } else {
    fondoLista = { background: tema.fondoLista };
  }

  const forma = a.forma ?? 'redonda';

  return {
    fondoLista,
    burbujaPropia: {
      background: a.colorPropio ?? tema.propia,
      color: a.textoPropio ?? tema.textoPropia,
    },
    burbujaRecibida: {
      background: a.colorRecibido ?? tema.recibida,
      color: a.textoRecibido ?? tema.textoRecibida,
      ...(tema.bordeRecibida && !a.colorRecibido ? { border: tema.bordeRecibida } : {}),
    },
    radio: { borderRadius: RADIO_FORMA[forma] },
    // La "cola" del bocadillo, como la de siempre. En cuadradas
    // no hay nada que recortar.
    esquinaPropia: forma === 'cuadrada' ? {} : { borderTopRightRadius: 0 },
    esquinaRecibida: forma === 'cuadrada' ? {} : { borderTopLeftRadius: 0 },
    // La normal conserva las clases de siempre (15px en móvil,
    // 14px en escritorio); las demás van por estilo.
    letra: LETRA_TAMANO[a.letra ?? 'normal']
      ? { fontSize: LETRA_TAMANO[a.letra ?? 'normal'] }
      : {},
    letraClase: (a.letra ?? 'normal') === 'normal' ? 'text-[15px] sm:text-sm' : '',
    gapLista: { rowGap: GAP_ESPACIADO[a.espaciado ?? 'normal'] },
    ancho: ANCHO_CLASES[a.ancho ?? 'normal'],
    relleno: a.estilo === 'compacto' ? 'px-3 py-1.5' : 'px-4 py-2.5',
  };
}
