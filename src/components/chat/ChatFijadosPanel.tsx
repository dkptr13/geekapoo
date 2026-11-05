import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Link2, Loader2, MessageSquare, Pin, X } from 'lucide-react';

import { fechaLegible } from '../../data/clubModeracion';
import { useAuth } from '../../context/AuthContext';
import type { ChatFijado } from '../../services/chatFijados';

// ======================================================
// PANEL DE MENSAJES FIJADOS
// ======================================================
// La lista sale de UNA consulta a `chats/{chatId}/fijados`, sin
// tocar el historial del chat: por eso el panel abre al
// instante aunque la conversación tenga miles de mensajes.
//
// Cada fila lleva el texto copiado del mensaje (no se vuelve a
// leer el original), así que se ve sin esperas.
//
// Al saltar a un mensaje, el panel se cierra y quien lo llama
// (ChatView) se encarga de desplazarse y resaltarlo.
// ======================================================

export interface ChatFijadosPanelProps {
  fijados: ChatFijado[];
  cargando: boolean;
  /** Se salta al mensaje original. */
  onIrA: (messageId: string) => void;
  onClose: () => void;
  /** Si la persona puede quitar fijados, se le ofrece. */
  onQuitar?: (fijado: ChatFijado) => void;
  /** Ids de los mensajes que ya no están (borrados). */
  borrados?: Set<string>;
}

const ICONO_TIPO = (tipo: string) => {
  if (tipo === 'image') return <ImageIcon size={12} className="text-violet-300" />;
  if (tipo === 'gif') return <MessageSquare size={12} className="text-fuchsia-300" />;
  if (tipo === 'link') return <Link2 size={12} className="text-sky-300" />;
  return null;
};

export const ChatFijadosPanel: React.FC<ChatFijadosPanelProps> = ({
  fijados,
  cargando,
  onIrA,
  onClose,
  onQuitar,
  borrados,
}) => {
  const { usersList } = useAuth();
  const [salto, setSalto] = useState<string | null>(null);

  const nombreDe = (uid: string, respaldo: string): string => {
    const vivo = usersList.find((u) => u.uid === uid);
    return vivo?.displayName || vivo?.username || respaldo;
  };

  const handleDe = (uid: string): string =>
    usersList.find((u) => u.uid === uid)?.username ?? '';

  // Al saltar se marca un momento: el panel se cierra y quien
  // llama hace el scroll. El estado solo evita el doble clic.
  useEffect(() => {
    if (!salto) return;
    onIrA(salto);
    setSalto(null);
  }, [salto, onIrA]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Pin size={15} className="text-violet-300" />
          Mensajes fijados
          {fijados.length > 0 && (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-1.5 py-px text-[10px] font-bold text-zinc-400">
              {fijados.length}
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {cargando ? (
          <p className="flex items-center gap-2 px-1 py-6 text-[11px] text-zinc-500">
            <Loader2 size={13} className="animate-spin" />
            Cargando mensajes fijados…
          </p>
        ) : fijados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-10 text-center">
            <Pin size={20} className="mx-auto text-zinc-700" />
            <p className="mt-3 text-xs font-bold text-white">
              Todavía no hay mensajes fijados
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
              Abre el menú de un mensaje (los tres puntitos) y elige «Fijar mensaje» para
              tener aquí a mano lo importante de la conversación.
            </p>
          </div>
        ) : (
          fijados.map((f) => {
            const yaNoEsta = borrados?.has(f.messageId) ?? false;
            return (
              <article
                key={f.id}
                className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="flex items-start gap-2.5">
                  {f.autorAvatar ? (
                    <img
                      src={f.autorAvatar}
                      alt=""
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-black text-white">
                      {(nombreDe(f.autorId, f.autorNombre) || '?')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-white">
                      {nombreDe(f.autorId, f.autorNombre)}
                      {handleDe(f.autorId) && (
                        <span className="font-mono text-[9px] font-normal text-zinc-500">
                          @{handleDe(f.autorId)}
                        </span>
                      )}
                      <Pin size={10} className="text-amber-300" />
                      {ICONO_TIPO(f.tipo)}
                    </p>
                    <p className="mt-0.5 line-clamp-3 break-words text-[11px] leading-relaxed text-zinc-300">
                      {f.texto}
                    </p>
                    {f.imagenUrl && (
                      <img
                        src={f.imagenUrl}
                        alt=""
                        className="mt-1.5 h-16 w-auto rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>

                <dl className="space-y-0.5 pl-[42px] text-[10px] text-zinc-500">
                  <div className="flex gap-1.5">
                    <dt className="shrink-0">Original:</dt>
                    <dd className="text-zinc-400">{fechaLegible(f.mensajeCreadoEn)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0">Fijado:</dt>
                    <dd className="text-zinc-400">
                      {fechaLegible(f.fijadoEn)}
                      {f.fijadoPorNombre
                        ? ` por ${nombreDe(f.fijadoPor, f.fijadoPorNombre)}`
                        : ''}
                    </dd>
                  </div>
                </dl>

                <div className="flex items-center gap-2 pl-[42px]">
                  <button
                    type="button"
                    onClick={() => setSalto(f.messageId)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-zinc-300 transition-colors hover:border-violet-400/30 hover:text-white"
                  >
                    <MessageSquare size={11} />
                    Ir al mensaje
                  </button>
                  {yaNoEsta && (
                    <span className="text-[10px] italic text-zinc-600">
                      El mensaje original ya no está
                    </span>
                  )}
                  {onQuitar && !yaNoEsta && (
                    <button
                      type="button"
                      onClick={() => onQuitar(f)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      <X size={11} />
                      Quitar
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatFijadosPanel;
