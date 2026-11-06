import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { Smile, X } from 'lucide-react';

import { EmojiPicker } from './EmojiPicker';

// ======================================================
// BOTÓN + VENTANA DE EMOJIS
// ======================================================
//
// Reutiliza el catálogo y el buscador de `EmojiPicker`, que ya usan
// las reacciones y el chat. La ventana es un modal fijo: en móvil se
// apoya abajo y en escritorio se centra. Así no se sale de la
// pantalla ni la recorta el scroll de una tarjeta o de un modal.
//
// El botón NO inserta el emoji: entrega el emoji elegido a quien lo
// usa, que es quien conoce el `textarea` y la posición del cursor.

interface EmojiPickerButtonProps {
  onElegir: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

export const EmojiPickerButton: FC<EmojiPickerButtonProps> = ({
  onElegir,
  disabled = false,
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', escape);

    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', escape);
      document.body.style.overflow = antes;
    };
  }, [abierto]);

  const elegir = (emoji: string) => {
    onElegir(emoji);
    setAbierto(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={disabled}
        title="Insertar un emoji"
        aria-label="Insertar un emoji"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:border-violet-500/60 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        <Smile size={13} />
        Emoji
      </button>

      {abierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAbierto(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Elegir un emoji"
              className="geo-pop-in flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-violet-500/30 bg-zinc-900 shadow-2xl shadow-violet-950/60 sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <h3 className="text-sm font-bold text-white">Emojis</h3>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar el selector de emojis"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto p-3">
                <EmojiPicker onElegir={(e) => elegir(e.emoji)} alto="h-60" />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
