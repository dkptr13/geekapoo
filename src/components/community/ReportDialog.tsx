import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  MOTIVOS,
  reportContent,
  type MotivoReporte,
  type ReportableTarget,
} from '../../services/reports';

// ======================================================
// DENUNCIAR UN COMENTARIO O UN HILO
// ======================================================
//
// Ventana modal con los motivos y un texto libre. Se usa desde el
// botón "Reportar" de un comentario y de un hilo, así que el
// diálogo no sabe nada de dónde se ha abierto: solo recibe qué
// se está denunciando.
//
// Va como modal y no como panel anclado al botón por el mismo
// motivo que el resto de ventanas nuevas (el selector de GIFs, el
// de reacciones): la barra lateral tiene scroll propio y una
// ventana `absolute` se recortaba contra él.
//
// Los motivos están cerrados (`MOTIVOS`) a propósito: el equipo
// necesita poder filtrar la cola por "insultos" o por "spoilers",
// y con un texto libre eso no se puede.

interface ReportDialogProps {
  /** Qué se está denunciando. */
  targetType: ReportableTarget;
  targetId: string;
  /** "este comentario" / "este hilo". */
  que: string;
  onCerrar: () => void;
  /** Avisa al padre para que enseñe un aviso o actualice la lista. */
  onReportado?: (estado: 'guardado' | 'ya-reportado') => void;
}

/**
 * Traduce el error del SDK a algo que sirva para arreglarlo.
 *
 * Antes salía siempre "No se pudo enviar el reporte", que no
 * decía nada: el fallo real era que el SDK rechazaba un campo a
 * `undefined` y ese mensaje no apuntaba a ninguna parte. Aquí
 * cada caso dice qué ha pasado y, cuando es cosa de las reglas,
 * recuerda el comando que lo arregla.
 */
function mensajeDeError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const texto = (e as { message?: string })?.message ?? '';

  if (code.includes('invalid-argument') && texto.includes('undefined')) {
    return 'El reporte llevaba un campo vacío que no se puede enviar. Es un fallo de la web, no tuyo: cuéntaselo.';
  }
  if (code.includes('permission-denied')) {
    return 'Las reglas de Firebase aún no permiten los reportes. Hay que ejecutar: firebase deploy --only firestore:rules';
  }
  if (code.includes('unavailable')) {
    return 'Sin conexión con el servidor. El reporte se enviará cuando vuelvas a tener línea.';
  }
  if (code.includes('unauthenticated')) {
    return 'Tu sesión ha caducado. Vuelve a iniciar sesión y mándalo otra vez.';
  }
  return 'No se pudo enviar el reporte. Inténtalo de nuevo.';
}

export const ReportDialog: FC<ReportDialogProps> = ({
  targetType,
  targetId,
  que,
  onCerrar,
  onReportado,
}) => {
  const { currentUser, requireAuth } = useAuth();

  const [motivo, setMotivo] = useState<MotivoReporte>('spam');
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const primerBoton = useRef<HTMLButtonElement>(null);

  // Sin esto el diálogo se abre sin foco en ninguna parte y con
  // el teclado hay que tabular desde el principio de la página.
  useEffect(() => {
    primerBoton.current?.focus();
  }, []);

  // Escape cierra, y el scroll de detrás se bloquea (en móvil,
  // si no, se mueve el foro entero al arrastrar sobre la ventana).
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', escape);

    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', escape);
      document.body.style.overflow = antes;
    };
  }, [onCerrar]);

  const enviar = async () => {
    setError('');

    if (!currentUser) {
      requireAuth('reportar este contenido');
      return;
    }

    setEnviando(true);
    try {
      const res = await reportContent(
        currentUser.uid,
        currentUser.displayName || currentUser.username,
        targetType,
        targetId,
        motivo,
        detalle,
      );
      onReportado?.(res);
      onCerrar();
    } catch (e) {
      console.error('[Reportes] No se pudo enviar:', e);
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reportar contenido"
        className="geo-pop-in w-full max-w-md overflow-hidden rounded-t-3xl border border-rose-500/30 bg-zinc-900 shadow-2xl shadow-rose-950/50 sm:rounded-3xl"
      >
        {/* ── Cabecera ─────────────────────────────── */}
        <div className="flex items-start justify-between gap-2 border-b border-zinc-800 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <AlertTriangle size={15} className="text-rose-400" />
              Reportar {que}
            </h3>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Lo verá el equipo de moderación. No es anónimo: sale tu nombre.
            </p>
          </div>
          <button
            ref={primerBoton}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Motivos ──────────────────────────────── */}
        <ul className="space-y-1.5 px-4 py-3">
          {MOTIVOS.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setMotivo(m.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                  motivo === m.id
                    ? 'border-rose-400/60 bg-rose-500/15 text-white'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span className="flex-1 font-semibold">{m.label}</span>
                {motivo === m.id && <span className="text-rose-300">✓</span>}
              </button>
            </li>
          ))}
        </ul>

        {/* ── Explicación ───────────────────────────── */}
        <div className="px-4">
          <label
            htmlFor="report-detalle"
            className="mb-1 block text-[11px] font-semibold text-zinc-400"
          >
            ¿Qué pasa? (opcional)
          </label>
          <textarea
            id="report-detalle"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Cuéntanos un poco más para que podamos revisarlo antes."
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-rose-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="mx-4 mt-3 flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
            <AlertTriangle size={12} className="flex-shrink-0" />
            {error}
          </p>
        )}

        {/* ── Pie ──────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
          >
            {enviando && <Loader2 size={12} className="animate-spin" />}
            Enviar reporte
          </button>
        </div>
      </div>
    </div>
  );
};
