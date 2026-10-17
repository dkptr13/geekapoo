import React, { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useFollows } from '../../context/FollowsContext';
import { estadoBotonSeguir, sePuedeSeguir, pedirConfirmacionAlDejarDeSeguir } from '../../utils/follows';
import type { User } from '../../types';

// ======================================================
// BOTÓN SEGUIR
// ======================================================
//
// Tres estados, y el tercero es el que se suele olvidar:
//
//   · "Seguir"       → no lo sigues. Es la acción principal.
//   · "Siguiendo"    → lo sigues. Pulsarlo deja de seguir.
//
// ── Por qué NO se pinta en tu propio perfil ────────────
//
// `sePuedeSeguir` lo devuelve en `false` y aquí se devuelve `null`
// (que es "no pintes nada"). No es solo aesthetic: un
// self-follow subiría el contador de seguidores y la Cloud Function
// pagaría XP por él. Pintar el botón deshabilitado con el texto
// "Siguiendo" sería mentir.
//
// ── Por qué el botón NO cambia de texto al pulsarlo ──────
//
// Lo natural sería "Seguir" → pulsas → "Dejar de seguir". El
// problema es que el botón cambia de ANCHO en el momento exacto
// del clic, y eso empuja todo lo que hay a su derecha en la
// cabecera del perfil (el título equipado, el botón de ajustes).
// Un botón que se ensancha al pulsarse hace que la maquetación
// salte justo cuando el usuario está mirando.
//
// Así que "Dejar de seguir" vive en el `title` (el tooltip) y en
// la confirmación, no en la etiqueta.

export const FollowButton: React.FC<{
  /** A quién. */
  userId: string;
  /** Su documento, para el caso de baneado. */
  usuario?: User;
  /** Tamaño de la etiqueta. */
  compacto?: boolean;
}> = ({ userId, usuario, compacto = false }) => {
  const { currentUser, requireAuth } = useAuth();
  const { siguiendoA, alternar, escribiendo, error, limpiarError } = useFollows();

  const [confirmando, setConfirmando] = useState(false);

  const miUid = currentUser?.uid ?? null;

  // Ni botón propio ni de baneados.
  if (!sePuedeSeguir({ miUid, suUid: userId, estaBaneado: usuario?.isBanned })) {
    return null;
  }

  const siguiendo = siguiendoA(userId);
  const boton = estadoBotonSeguir({
    siguiendo: siguiendo === true,
    cargando: siguiendo === null,
    miUid,
  });

  // Sin sesión: el botón NO desaparece (sería más limpio), pero
  // lleva al login. `requireAuth` es el helper que ya existe para
  // esto y además recuerda qué se quería hacer al volver.
  if (!miUid) {
    return (
      <button
        type="button"
        onClick={() => requireAuth('seguir a otro usuario')}
        className="flex items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-200 transition-colors hover:bg-violet-500/20"
      >
        <UserPlus size={14} />
        Inicia sesión para seguir
      </button>
    );
  }

  const alPulsar = async () => {
    limpiarError();

    // Dejar de seguir sí se pregunta. Es un clic, el efecto es
    // instantáneo, y la otra persona se queda sin saber por qué:
    // si se lleva en silencio, no hay forma de que entienda que fue
    // un error y no un roce de dedos.
    if (!confirmando) {
      const pregunta = pedirConfirmacionAlDejarDeSeguir(siguiendo === true, false);
      if (pregunta?.preguntar) {
        setConfirmando(true);
        return;
      }
    }

    await alternar(userId);
    setConfirmando(false);
  };

  const estilos: Record<typeof boton.estilo, string> = {
    primario:
      'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/40 hover:brightness-110 border border-transparent',
    siguiendo:
      'border border-white/[0.08] bg-white/[0.03] text-zinc-200 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300',
    inactivo: 'border border-zinc-800 bg-zinc-900 text-zinc-500',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={alPulsar}
        disabled={boton.deshabilitado || escribiendo(userId)}
        // El texto largo del tooltip es lo que explica qué pasa al
        // pulsar, ya que la etiqueta no cambia.
        title={
          siguiendo === true
            ? 'Dejar de seguir'
            : 'Seguir y recibir sus avisos'
        }
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors disabled:cursor-wait ${estilos[boton.estilo]} ${
          compacto ? 'px-2.5 py-1.5 text-[11px]' : ''
        }`}
      >
        {boton.deshabilitado ? (
          <Loader2 size={14} className="animate-spin" />
        ) : siguiendo === true ? (
          <UserCheck size={14} />
        ) : (
          <UserPlus size={14} />
        )}
        <span>{boton.texto}</span>
      </button>

      {/* La confirmación de "dejar de seguir" sale al lado, no como
          un modal: es una decisión de un clic y un modal para esto
          sería más peso del que aporta. */}
      {confirmando && siguiendo === true && (
        <span className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">¿Dejar de seguir?</span>
          <button
            type="button"
            onClick={alPulsar}
            disabled={escribiendo(userId)}
            className="chat-boton rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 disabled:opacity-50"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="chat-boton rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
        </span>
      )}

      {error && (
        <span className="text-[11px] font-semibold text-rose-400">{error}</span>
      )}
    </div>
  );
};