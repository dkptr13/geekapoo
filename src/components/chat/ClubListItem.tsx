import React from 'react';
import { Users, Crown, Shield, ChevronRight, Mail } from 'lucide-react';

import { CLUB_CATEGORIES } from '../../types';
import type { Club, ClubMember } from '../../types';

// ======================================================
// FILA DE CLUB EN LA LISTA LATERAL
// ======================================================
// Una fila de «Mis clubes». Se parece a una conversación
// privada pero NO es igual: el icono de personas y el badge
// de rol son lo que impiden confundir un chat grupal de
// treinta personas con una conversación de dos.
//
// Lo que muestra sale de dos sitios:
//   · El club: nombre, icono, número de miembros, categoría
//     y el rol del usuario en él.
//   · El chat asociado (`chats/`): el último mensaje y su
//     fecha, porque es el mismo documento que ya escucha la
//     lista de conversaciones privadas.
// ======================================================

interface Props {
  club: Club;
  /** Si el chat de este club está abierto ahora. */
  activo: boolean;
  /** Si hay mensajes sin leer en su chat. */
  sinLeer: boolean;
  /** Último mensaje del chat, si la lista de conversaciones lo tiene. */
  ultimoMensaje?: string;
  /** Fecha del último mensaje, en ISO. */
  ultimaFecha?: string;
  /** Rol del usuario actual en el club. */
  miRol: ClubMember | null;
  /** Solicitudes de acceso pendientes (solo se muestra a moderadores). */
  solicitudes: number;
  onAbrir: () => void;
  onVerDetalle: () => void;
}

export const ClubListItem: React.FC<Props> = ({
  club,
  activo,
  sinLeer,
  ultimoMensaje,
  ultimaFecha,
  miRol,
  solicitudes,
  onAbrir,
  onVerDetalle,
}) => {
  const categoria = CLUB_CATEGORIES.find((c) => c.id === club.category);

  const hora = ultimaFecha
    ? new Date(ultimaFecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={`chat-transicion group relative w-full rounded-xl border transition-colors ${
        activo
          ? 'border-violet-400/25 bg-gradient-to-r from-violet-600/[0.18] to-indigo-600/[0.08] shadow-[0_8px_24px_-12px_rgba(124,58,237,0.5)]'
          : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.04]'
      }`}
    >
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        {/* Icono, con el indicador de grupo debajo */}
        <div className="relative flex-shrink-0">
          {club.iconUrl ? (
            <img
              src={club.iconUrl}
              alt={club.name}
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-sky-500/20 text-lg ring-1 ring-white/10">
              {categoria?.icon ?? '✨'}
            </div>
          )}
          {/* Lo que dice "esto es un chat grupal" de un vistazo */}
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-[9px] text-white ring-2 ring-[#0b0b11]">
            <Users size={9} />
          </span>
        </div>

        <div className="min-w-0 flex-1 pr-7">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold tracking-tight text-white">{club.name}</span>

            {solicitudes > 0 && (
              <span
                className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-1.5 py-px text-[9px] font-bold text-white shadow-sm"
                title={`${solicitudes} solicitudes de acceso pendientes`}
              >
                <Mail size={8} />
                {solicitudes}
              </span>
            )}
          </div>

          <p
            className={`mt-0.5 truncate text-[13px] leading-snug ${sinLeer ? 'font-semibold text-zinc-100' : 'text-zinc-400'}`}
          >
            {ultimoMensaje || 'Todavía no hay mensajes'}
          </p>

          {/* Meta en una sola fila fluida: miembros · categoría ·
              fecha · rol. El rol va aquí dentro y no superpuesto
              en absoluto, que es lo que montaba "Propietario"
              encima de la categoría y la fecha. */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-zinc-500">
            <span className="flex items-center gap-0.5">
              <Users size={9} />
              {club.memberCount}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{categoria?.label ?? club.category}</span>
            {hora && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex-shrink-0 font-mono">{hora}</span>
              </>
            )}
            {miRol && miRol.role !== 'member' && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`flex flex-shrink-0 items-center gap-0.5 font-bold ${
                    miRol.role === 'owner' ? 'text-amber-300' : 'text-violet-300'
                  }`}
                >
                  {miRol.role === 'owner' ? <Crown size={8} /> : <Shield size={8} />}
                  {miRol.role === 'owner' ? 'Propietario' : 'Moderador'}
                </span>
              </>
            )}
          </div>
        </div>

        {sinLeer && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />}
      </button>

      {/* Botón de detalles: separado del de abrir, para no
          liarla con dos acciones en el mismo clic. */}
      <button
        type="button"
        onClick={onVerDetalle}
        aria-label={`Ver detalles de ${club.name}`}
        title="Ver detalles, miembros y normas"
        className="chat-boton absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5 text-zinc-500 transition-colors hover:border-violet-400/30 hover:text-violet-200 sm:block"
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
};
