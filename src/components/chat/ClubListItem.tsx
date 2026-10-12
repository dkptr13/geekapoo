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
      className={`group relative w-full transition-colors ${
        activo ? 'border-l-4 border-violet-500 bg-violet-950/40' : 'hover:bg-zinc-900/60'
      }`}
    >
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        {/* Icono, con el indicador de grupo debajo */}
        <div className="relative flex-shrink-0">
          {club.iconUrl ? (
            <img
              src={club.iconUrl}
              alt={club.name}
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-violet-500/30"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/20 text-xl ring-1 ring-violet-500/30">
              {categoria?.icon ?? '✨'}
            </div>
          )}
          {/* Lo que dice "esto es un chat grupal" de un vistazo */}
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] text-white ring-2 ring-zinc-950">
            <Users size={9} />
          </span>
        </div>

        <div className="min-w-0 flex-1 pr-7">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-bold text-white">{club.name}</span>

            {solicitudes > 0 && (
              <span
                className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-pink-500/20 px-1.5 text-[9px] font-bold text-pink-300"
                title={`${solicitudes} solicitudes de acceso pendientes`}
              >
                <Mail size={8} />
                {solicitudes}
              </span>
            )}
          </div>

          <p
            className={`mt-0.5 truncate text-xs ${sinLeer ? 'font-bold text-white' : 'text-zinc-400'}`}
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

        {sinLeer && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-pink-500" />}
      </button>

      {/* Botón de detalles: separado del de abrir, para no
          liarla con dos acciones en el mismo clic. */}
      <button
        type="button"
        onClick={onVerDetalle}
        aria-label={`Ver detalles de ${club.name}`}
        title="Ver detalles, miembros y normas"
        className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-500 transition-colors hover:border-violet-500/40 hover:text-violet-300 sm:block"
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
};
