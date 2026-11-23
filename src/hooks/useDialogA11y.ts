import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// ======================================================
// ACCESIBILIDAD DE DIÁLOGOS
// ======================================================
//
// Un modal accesible necesita cinco cosas que se olvidan con
// facilidad porque no se ven en pantalla:
//
//   1. Que el foco entre en el diálogo al abrirse.
//   2. Que Tab y Mayús+Tab no se escapen al contenido de detrás.
//   3. Que Escape lo cierre.
//   4. Que el scroll de detrás no se mueva.
//   5. Que al cerrarse el foco vuelva al control que lo abrió.
//
// Este hook las centraliza para no repetir la misma trampa de foco
// (y los mismos fallos) en cada modal. No pinta nada: cada
// componente conserva su diseño y solo tiene que poner el `ref` en
// el contenedor con `role="dialog"`.

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

interface UseDialogA11yOptions {
  /** Si el diálogo está abierto. */
  open: boolean;
  /** Se llama con Escape o con el cierre que decida el componente. */
  onClose?: () => void;
  /** Elemento que debe recibir el foco al abrir. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** `false` para paneles no modales que no deben bloquear el scroll. */
  lockScroll?: boolean;
  /** `false` si el padre ya devuelve el foco a un sitio concreto. */
  restoreFocus?: boolean;
}

export function useDialogA11y<T extends HTMLElement = HTMLDivElement>({
  open,
  onClose,
  initialFocus,
  lockScroll = true,
  restoreFocus = true,
}: UseDialogA11yOptions) {
  const dialogRef = useRef<T>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  // En desarrollo, React StrictMode monta, desmonta y vuelve a montar
  // los efectos. Sin estas dos referencias, el segundo montaje
  // guardaba como «foco anterior» el primer botón del propio
  // diálogo; al cerrarlo, ese botón ya no existía y el foco caía al
  // body. La generación evita además que la restauración diferida
  // del desmontaje falso robe el foco al diálogo recién abierto.
  const estabaAbierto = useRef(false);
  const generacion = useRef(0);
  // La función de cierre puede cambiar en cada render sin que el
  // diálogo deba desmontarse: se guarda en una ref.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) {
      estabaAbierto.current = false;
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!estabaAbierto.current) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      estabaAbierto.current = true;
    }

    const miGeneracion = ++generacion.current;

    const enfocarPrimero = () => {
      const preferido = initialFocus?.current;
      const auto = dialog.querySelector<HTMLElement>('[data-autofocus]');
      const primero = dialog.querySelector<HTMLElement>(FOCUSABLE);
      (preferido ?? auto ?? primero ?? dialog).focus({ preventScroll: true });
    };

    // El contenido ya está montado cuando corre el efecto. Se
    // enfoca de inmediato y se repite en el siguiente frame: así
    // funciona aunque el navegador tenga la ventana en segundo
    // plano y pause `requestAnimationFrame` (algo habitual al
    // cambiar de pestaña o al abrir el diálogo desde un atajo).
    enfocarPrimero();
    const frame = window.requestAnimationFrame(enfocarPrimero);

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const nodos = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => {
        if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
          return false;
        }
        // offsetParent null cubre `display:none`. No se usa
        // `getClientRects` para no confundir un elemento dentro de
        // un contenedor con scroll.
        return el.offsetParent !== null || el === document.activeElement;
      });

      if (nodos.length === 0) {
        e.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const primero = nodos[0];
      const ultimo = nodos[nodos.length - 1];
      const activo = document.activeElement;

      if (e.shiftKey && (activo === primero || activo === dialog)) {
        e.preventDefault();
        ultimo.focus({ preventScroll: true });
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', alPulsar, true);

    let overflowAnterior = '';
    if (lockScroll) {
      overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', alPulsar, true);
      if (lockScroll) document.body.style.overflow = overflowAnterior;

      if (restoreFocus) {
        const anterior = previousFocus.current;
        if (anterior && document.contains(anterior)) {
          // Se enfoca ya, sin esperar al frame: en una pestaña en
          // segundo plano el navegador pausa requestAnimationFrame y
          // el foco se quedaba en el body. El frame se mantiene como
          // refuerzo para cuando el navegador sí lo ejecuta.
          anterior.focus({ preventScroll: true });
          window.requestAnimationFrame(() => {
            if (generacion.current !== miGeneracion) return;
            anterior.focus({ preventScroll: true });
          });
        }
      }
    };
  }, [open, initialFocus, lockScroll, restoreFocus]);

  return dialogRef;
}
