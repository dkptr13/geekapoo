import { useMemo } from 'react';
import type { RefObject } from 'react';

import { useAuth } from '../../context/AuthContext';
import { AvatarUsuario } from '../profile/AvatarUsuario';
import type { User } from '../../types';

// ======================================================
// SUGERENCIAS DE MENCIONES
// ======================================================
//
// Se activa al escribir "@" y busca en el directorio que
// `AuthContext` ya tiene en memoria. No hace ninguna lectura nueva.
//
// Al elegir una persona se inserta su @usuario completo, no su
// nombre visible: si hay dos "Kapo", la mención va a la cuenta
// correcta. El backend resuelve ese @ contra `usernames` y guarda el
// aviso con el UID.

interface MentionSuggestionsProps {
  value: string;
  onChange: (next: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  className?: string;
  limite?: number;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  value,
  onChange,
  inputRef,
  className = '',
  limite = 6,
}) => {
  const { currentUser, usersList } = useAuth();

  const contexto = useMemo(() => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const antes = value.slice(0, caret);
    const coincidencia = /(^|\s)@([a-zA-Z0-9_]{0,20})$/.exec(antes);
    if (!coincidencia) return null;

    const consulta = coincidencia[2].toLowerCase();
    const inicio = caret - consulta.length - 1;

    const candidatos = usersList
      .filter((user) => user.uid !== currentUser?.uid)
      .filter((user) => {
        if (!consulta) return true;
        return (
          (user.username ?? '').toLowerCase().includes(consulta) ||
          (user.displayName ?? '').toLowerCase().includes(consulta)
        );
      })
      .sort((a, b) => {
        const aExacto = (a.username ?? '').toLowerCase() === consulta ? 0 : 1;
        const bExacto = (b.username ?? '').toLowerCase() === consulta ? 0 : 1;
        if (aExacto !== bExacto) return aExacto - bExacto;
        return (a.username ?? '').localeCompare(b.username ?? '');
      })
      .slice(0, limite);

    return { consulta, inicio, caret, candidatos };
  }, [value, inputRef, usersList, currentUser?.uid, limite]);

  if (!contexto || contexto.candidatos.length === 0) return null;

  const elegir = (usuario: User) => {
    const antes = value.slice(0, contexto.inicio);
    const despues = value.slice(contexto.caret);
    const siguiente = `${antes}@${usuario.username} ${despues}`;
    onChange(siguiente);

    const posicion = contexto.inicio + usuario.username.length + 2;
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(posicion, posicion);
    });
  };

  return (
    <div
      className={`absolute bottom-full left-0 z-40 mb-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-violet-500/30 bg-[#0c0c14]/98 shadow-2xl shadow-black/60 backdrop-blur-xl ${className}`}
      role="listbox"
      aria-label="Sugerencias de menciones"
    >
      <div className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Mencionar a alguien
      </div>
      <ul className="max-h-56 overflow-y-auto p-1">
        {contexto.candidatos.map((usuario) => (
          <li key={usuario.uid}>
            <button
              type="button"
              onClick={() => elegir(usuario)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-violet-500/15"
            >
              <AvatarUsuario
                src={usuario.avatarUrl}
                fallbackSrc="/img/avatar-comunidad.webp"
                alt=""
                frame={usuario.avatarFrame}
                color={usuario.profileColor}
                sizeClass="h-7 w-7"
                shapeClass="rounded-lg"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold text-white">
                  {usuario.displayName || usuario.username}
                </span>
                <span className="block truncate font-mono text-[10px] text-violet-300">
                  @{usuario.username}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
