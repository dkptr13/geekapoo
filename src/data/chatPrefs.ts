import type { ChatPrefs, ChatMuteUntil, ChatNotifyMode } from '../types';

// ======================================================
// PREFERENCIAS POR CONVERSACIÓN — LÓGICA PURA
// ======================================================
// Constantes y saneo sin dependencias de Firebase, para
// que sean testeables con tsx y reutilizables desde el
// panel (`ChatPrefsPanel`) y el servicio (`chatPrefs.ts`).
// ======================================================

/** Paleta cerrada de colores para el chat (hex de 7 caracteres). */
export const CHAT_PREFS_COLORS = [
  { id: 'violeta', nombre: 'Violeta', hex: '#7c3aed' },
  { id: 'morado', nombre: 'Morado', hex: '#4c1d95' },
  { id: 'fucsia', nombre: 'Fucsia', hex: '#c026d3' },
  { id: 'azul', nombre: 'Azul', hex: '#2563eb' },
  { id: 'cian', nombre: 'Cian', hex: '#0891b2' },
  { id: 'esmeralda', nombre: 'Esmeralda', hex: '#059669' },
  { id: 'ambar', nombre: 'Ámbar', hex: '#b45309' },
  { id: 'vino', nombre: 'Vino', hex: '#881337' },
  { id: 'carbon', nombre: 'Carbón', hex: '#18181b' },
  { id: 'pizarra', nombre: 'Pizarra', hex: '#334155' },
] as const;

/** Políticas de aviso por conversación. */
export const CHAT_PREFS_NOTIFY: { id: ChatNotifyMode; nombre: string }[] = [
  { id: 'all', nombre: 'Todos' },
  { id: 'mentions', nombre: 'Solo menciones' },
  { id: 'muted', nombre: 'Silenciado' },
];

/** Duraciones del silencio (cuando notify === 'muted'). */
export const CHAT_PREFS_MUTE: { id: ChatMuteUntil; nombre: string }[] = [
  { id: '1h', nombre: '1 hora' },
  { id: '8h', nombre: '8 horas' },
  { id: '24h', nombre: '24 horas' },
  { id: 'until', nombre: 'Hasta que lo active' },
];

const enLista = <T extends string>(v: unknown, lista: readonly T[]): v is T =>
  typeof v === 'string' && (lista as readonly string[]).includes(v);

const hexValido = (v: unknown): string | undefined =>
  typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : undefined;

/** Sanea una entrada desconocida a un `ChatPrefs` guardable. */
export function sujetarPrefs(v: unknown): ChatPrefs {
  const p = (v ?? {}) as Record<string, unknown>;
  return {
    ...(hexValido(p.color) !== undefined ? { color: hexValido(p.color)! } : {}),
    ...(typeof p.nickname === 'string' && p.nickname.trim().length > 0
      ? { nickname: p.nickname.trim().slice(0, 60) }
      : {}),
    ...(enLista(p.notify, ['all', 'mentions', 'muted']) ? { notify: p.notify } : {}),
    ...(enLista(p.muteUntil, ['1h', '8h', '24h', 'until']) ? { muteUntil: p.muteUntil } : {}),
    ...(p.favorite === true ? { favorite: true } : {}),
  };
}
