import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// ======================================================
// RESTAURACIÓN DEL SCROLL AL VOLVER ATRÁS
// ======================================================
//
// React Router (BrowserRouter) no trae un ScrollRestoration para
// datos: sin esto, al volver atrás el navegador puede restaurar una
// posición antigua mientras React vuelve a montar la sección, o
// dejar la posición de la página de la que se venía.
//
// Se guarda la posición por entrada del historial (`location.key`).
// Al hacer POP se reaplica cuando las fuentes están listas y se
// vuelve a aplicar si el contenido cambia de altura antes de que el
// usuario toque nada. En cuanto la persona usa rueda, teclado, dedo
// o puntero, se deja de corregir: su posición manda.
//
// Los destinos de aviso (`?hilo=` / `?comentario=`) se excluyen:
// esos los coloca HomeFeed con `useStableScrollTarget`, esperando al
// elemento real y no a una altura vieja.

const posiciones = new Map<string, number>();

export function useScrollRestoration(disabled = false): void {
  const location = useLocation();
  const navType = useNavigationType();
  const key = location.key;

  // El navegador también intenta restaurar por su cuenta al hacer
  // POP. Si las dos restauraciones se pelean, gana la última y la
  // página acaba en una posición distinta. La nuestra conoce los
  // destinos de aviso y espera al contenido; la nativa, no.
  useEffect(() => {
    if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) {
      return;
    }
    const anterior = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = anterior;
    };
  }, []);

  // Guarda la posición de la entrada actual. Se escribe directamente:
  // un Map.set en un evento de scroll es barato, y programarlo con rAF
  // podía perder la última posición si la pestaña quedaba en segundo
  // plano (rAF se pausa).
  useEffect(() => {
    const guardar = () => posiciones.set(key, window.scrollY);

    guardar();
    window.addEventListener('scroll', guardar, { passive: true });
    // Algunos navegadores/automatizaciones no emiten `scroll` para
    // desplazamientos programáticos. Un muestreo barato mantiene la
    // posición al día sin depender solo del evento.
    const muestreo = window.setInterval(guardar, 300);

    return () => {
      window.removeEventListener('scroll', guardar);
      window.clearInterval(muestreo);
      // No se guarda aquí el scroll actual: al cambiar de entrada,
      // React puede haber desmontado la sección y llevado la ventana
      // a 0. Ese 0 pisaría la posición real que ya se había guardado.
    };
  }, [key]);

  useLayoutEffect(() => {
    if (navType !== 'POP' || disabled) return;
    const destino = posiciones.get(key);
    if (destino === undefined) return;

    let cancelado = false;
    let frame = 0;
    let respaldo = 0;
    let observador: ResizeObserver | null = null;
    let restaurado = false;

    const parar = () => {
      cancelado = true;
      observador?.disconnect();
      observador = null;
    };

    const colocar = () => {
      if (cancelado) return;
      window.scrollTo({ top: destino, behavior: 'auto' });
      restaurado = true;
    };

    const aplicar = () => {
      if (!restaurado) colocar();
    };

    // Cualquier gesto del usuario cancela las correcciones. No se
    // cancela la primera colocación si aún no ha habido gesto.
    window.addEventListener('wheel', parar, { passive: true, once: true });
    window.addEventListener('touchstart', parar, { passive: true, once: true });
    window.addEventListener('pointerdown', parar, { once: true });
    window.addEventListener('keydown', parar, { once: true });

    const iniciar = async () => {
      try {
        await Promise.race([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise<void>((resolve) => window.setTimeout(resolve, 300)),
        ]);
      } catch {
        // Sin FontFaceSet se sigue igual.
      }
      if (cancelado) return;

      // rAF puede quedar pausado en una pestaña de fondo; el
      // pequeño respaldo solo asegura que la restauración no se
      // quede esperando a un frame que nunca llega.
      respaldo = window.setTimeout(aplicar, 120);
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          window.clearTimeout(respaldo);
          aplicar();
        });
      });

      // Si la página todavía no tiene altura suficiente, el
      // navegador recorta el scroll. Cuando el contenido termina de
      // montarse, se vuelve a aplicar.
      observador = new ResizeObserver(() => {
        if (cancelado) return;
        if (!restaurado || Math.abs(window.scrollY - destino) > 2) colocar();
      });
      observador.observe(document.body);
    };

    void iniciar();

    return () => {
      cancelado = true;
      observador?.disconnect();
      observador = null;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(respaldo);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      window.removeEventListener('pointerdown', parar);
      window.removeEventListener('keydown', parar);
    };
  }, [key, navType, disabled]);
}
