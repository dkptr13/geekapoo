import React, { useEffect } from 'react';
import { Sparkles, Trophy } from 'lucide-react';

import type { Medal } from '../../types/gamification';
import { useProgression } from '../../context/ProgressionContext';

// ======================================================
// AVISOS DE PROGRESION
// ======================================================
//
// Dos avisos flotantes: al subir de nivel y al desbloquear una
// medalla. Los dos se montan desde `ProgressionContext`, que es
// quien sabe cuando pasa algo, y se cierran solos.
//
// Se usa `motion` para la animacion porque ya es una dependencia
// del proyecto y hay un `animate-in` definido para ella en
// `index.css`.

interface AvisoProps {
  children: React.ReactNode;
  onClose: () => void;
  /** Milisegundos antes de cerrarse solos. */
  autoOcultar?: number;
}

/**
 * Envoltorio comun de los dos avisos.
 *
 * Es `fixed` y con `z-[100]` por encima de todo: los modales de
 * la web usan `z-50`, asi que con `z-50` este aviso se quedaria
 * detras de un modal abierto.
 */
const Aviso: React.FC<AvisoProps> = ({ children, onClose, autoOcultar = 5200 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, autoOcultar);
    return () => clearTimeout(t);
  }, [onClose, autoOcultar]);

  // Escape también cierra. Sin esto, el aviso no se puede quitar
  // sin esperar, y se queda ahí tapando el contenido.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onClose]);

  return (
    <div
      className="fixed inset-x-0 top-4 z-[100] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-2xl border border-violet-500/50 bg-zinc-900/95 p-4 shadow-2xl shadow-violet-500/20 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
};

/** Aviso de subida de nivel. */
export const LevelUpToast: React.FC<{ nivel: number; onClose: () => void }> = ({
  nivel,
  onClose,
}) => (
  <Aviso onClose={onClose}>
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 shadow-lg shadow-violet-500/30">
        <Sparkles size={20} className="text-white" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-white">
          ¡Has subido al nivel {nivel}!
        </p>
        <p className="text-xs text-zinc-400">
          Sigue así para desbloquear más medallas.
        </p>
      </div>
    </div>
  </Aviso>
);

/** Aviso de medalla desbloqueada. */
export const MedalToast: React.FC<{ medal: Medal; onClose: () => void }> = ({
  medal,
  onClose,
}) => (
  <Aviso onClose={onClose}>
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-2xl">
        {medal.icono}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Medalla desbloqueada
        </p>
        <p className="flex items-center gap-1.5 text-sm font-bold text-white">
          <Trophy size={13} className="flex-shrink-0 text-amber-400" />
          <span className="truncate">{medal.nombre}</span>
        </p>
      </div>
    </div>
  </Aviso>
);

/**
 * Monta los avisos que toquen.
 *
 * Se llama una sola vez desde `App`, debajo del proveedor: así
 * los avisos se ven desde cualquier pestaña, y no hace falta
 * repetirlos en cada vista.
 */
export const ProgressionToasts: React.FC = () => {
  const { subidaPendiente, cerrarAviso, medallaPendiente, cerrarMedalla } =
    useProgression();

  return (
    <>
      {subidaPendiente && (
        <LevelUpToast nivel={subidaPendiente.nivel} onClose={cerrarAviso} />
      )}
      {medallaPendiente && (
        <MedalToast medal={medallaPendiente} onClose={cerrarMedalla} />
      )}
    </>
  );
};
