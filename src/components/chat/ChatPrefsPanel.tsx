import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Check, Loader2, Palette, Star, X } from 'lucide-react';

import {
  CHAT_PREFS_MUTE,
  CHAT_PREFS_NOTIFY,
} from '../../data/chatPrefs';
import { getChatPrefs, saveChatPrefs } from '../../services/chatPrefs';
import type { ChatPrefs } from '../../types';

// ======================================================
// PANEL DE PREFERENCIAS POR CONVERSACIÓN
// ======================================================
// Apodo, avisos y favorito para UNA conversación.
// Cada participante guarda las suyas: nada de esto se
// comparte con el otro.
//
// Guarda con `saveChatPrefs` (merge en
// `chats/{chatId}/prefs/{uid}`).
// ======================================================

export interface ChatPrefsPanelProps {
  chatId: string;
  uid: string;
  onClose: () => void;
  onGuardado?: (chatId: string, prefs: ChatPrefs) => void;
}

const Seccion: React.FC<{ titulo: string; children: React.ReactNode }> = ({
  titulo,
  children,
}) => (
  <section className="space-y-2.5">
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{titulo}</h3>
    {children}
  </section>
);

export const ChatPrefsPanel: React.FC<ChatPrefsPanelProps> = ({
  chatId,
  uid,
  onClose,
  onGuardado,
}) => {
  const [borrador, setBorrador] = useState<ChatPrefs>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseRef = useRef<ChatPrefs>({});

  useEffect(() => {
    let alive = true;
    void getChatPrefs(uid, chatId).then((p) => {
      if (!alive) return;
      baseRef.current = p;
      setBorrador(p);
    });
    return () => {
      alive = false;
    };
  }, [uid, chatId]);

  const pon = (parcial: Partial<ChatPrefs>) => setBorrador((b) => ({ ...b, ...parcial }));

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveChatPrefs(uid, chatId, borrador);
      onGuardado?.(chatId, borrador);
      onClose();
    } catch (e) {
      console.error('[Chats] No se pudo guardar la preferencia:', e);
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const silenciado = borrador.notify === 'muted';

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Personalizar conversación"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0c0c14] shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <Palette size={15} className="text-violet-300" />
            Personalizar conversación
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-black text-white shadow-md"
              aria-hidden="true"
            >
              Aa
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {borrador.nickname || 'Nombre original'}
              </p>
              <p className="text-[10px] text-zinc-600">
                Vista previa · así lo ves tú
              </p>
            </div>
            {borrador.favorite && (
              <Star size={16} className="ml-auto flex-shrink-0 fill-amber-400 text-amber-400" />
            )}
          </div>

          <Seccion titulo="Apodo local">
            <input
              type="text"
              value={borrador.nickname ?? ''}
              onChange={(e) => pon({ nickname: e.target.value })}
              placeholder="Cómo quieres ver a esta persona"
              maxLength={60}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
            />
            <p className="text-[10px] leading-relaxed text-zinc-600">
              Solo lo ves tú. No cambia el nombre real del perfil.
            </p>
          </Seccion>

          <Seccion titulo="Avisos">
            <div className="grid grid-cols-3 gap-1.5">
              {CHAT_PREFS_NOTIFY.map((n) => {
                const activo = (borrador.notify ?? 'all') === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => pon({ notify: n.id })}
                    aria-pressed={activo}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${
                      activo
                        ? 'border-violet-500 bg-violet-950/40 text-violet-200'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {n.id === 'muted' ? <BellOff size={13} /> : <Bell size={13} />}
                    <span className="text-[10px] font-bold">{n.nombre}</span>
                  </button>
                );
              })}
            </div>

            {silenciado && (
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] text-zinc-500">Durante cuánto</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {CHAT_PREFS_MUTE.map((m) => {
                    const activo = borrador.muteUntil === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => pon({ muteUntil: m.id })}
                        aria-pressed={activo}
                        className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold transition-colors ${
                          activo
                            ? 'border-violet-500 bg-violet-950/40 text-violet-200'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-white'
                        }`}
                      >
                        {m.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Seccion>

          <button
            type="button"
            onClick={() => pon({ favorite: !borrador.favorite })}
            aria-pressed={!!borrador.favorite}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              borrador.favorite
                ? 'border-amber-400/30 bg-amber-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
          >
            <Star
              size={16}
              className={
                borrador.favorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'
              }
            />
            <span>
              <span className="block text-xs font-bold text-white">
                {borrador.favorite ? 'En favoritos' : 'Añadir a favoritos'}
              </span>
              <span className="block text-[10px] text-zinc-500">
                La conversación aparece arriba del resto.
              </span>
            </span>
          </button>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3">
          <button
            type="button"
            onClick={() => setBorrador({})}
            disabled={saving}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 disabled:opacity-50"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
