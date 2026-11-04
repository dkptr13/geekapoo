import { useEffect, useRef } from 'react';

// ======================================================
// COLOCAR UN DESTINO SIN QUE SE MUEVA
// ======================================================
//
// Los avisos llegan a un hilo o a un comentario que puede no estar
// montado todavía (el feed carga por páginas, los comentarios llegan
// por un listener). En vez de esperar un número de milisegundos
// inventado, se observa el DOM hasta que el elemento existe.
//
// Después se espera a que el diseño esté estable (fuentes y dos
// frames) y se coloca UNA vez. Las imágenes que no han terminado de
// cargar ya tienen su caja reservada; por eso no se bloquea la
// navegación esperando a la red.
//
// Si después cambia la altura del artículo (una imagen antigua sin
// medidas, un comentario que llega tarde), un ResizeObserver corrige
// la posición como máximo dos veces y solo si el usuario no ha
// empezado a moverse por su cuenta.

const esperarFuentes = async (): Promise<void> => {
  try {
    await Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      // Una fuente que no llega no puede bloquear la navegación.
      // Pasado este margen se coloca el destino; si la fuente cambia
      // el alto después, el ResizeObserver corrige.
      new Promise<void>((resolve) => window.setTimeout(resolve, 300)),
    ]);
  } catch {
    // Navegadores sin FontFaceSet: se sigue igual.
  }
};

/** Espera a que el alto del artículo deje de cambiar durante dos frames. */
const esperarDisenoEstable = (el: HTMLElement): Promise<void> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      resolve();
      return;
    }

    let ultimoAlto = -1;
    let estables = 0;
    let frames = 0;
    let terminado = false;

    const terminar = () => {
      if (terminado) return;
      terminado = true;
      window.clearTimeout(respaldo);
      resolve();
    };

    const medir = () => {
      if (terminado) return;
      frames += 1;
      const alto = el.getBoundingClientRect().height;

      if (Math.abs(alto - ultimoAlto) < 0.5) {
        estables += 1;
      } else {
        estables = 0;
        ultimoAlto = alto;
      }

      // Dos frames sin cambios son suficientes. El tope de 30 frames
      // evita quedarse esperando si hay una animación continua.
      if (estables >= 2 || frames >= 30) {
        terminar();
        return;
      }
      window.requestAnimationFrame(medir);
    };

    // En una pestaña en segundo plano rAF puede quedar pausado. El
    // respaldo de 400 ms evita que la navegación se quede esperando
    // indefinidamente; no es un "esperar a que cargue todo", es solo
    // el techo de la comprobación de estabilidad.
    const respaldo = window.setTimeout(terminar, 400);
    window.requestAnimationFrame(medir);
  });

/**
 * Decodifica las imágenes que ya están descargadas, pero sin
 * convertir la decodificación en un requisito para navegar.
 *
 * La caja de la imagen ya está reservada, así que esperar a que una
 * foto enorme termine de decodificarse solo retrasaría el salto. Se
 * da un margen corto para las imágenes normales; si alguna tarda
 * más, el destino se coloca igualmente y el ResizeObserver corrige
 * después si hiciera falta.
 */
const esperarImagenesListas = async (articulo: HTMLElement): Promise<void> => {
  const imagenes = Array.from(articulo.querySelectorAll('img')).filter(
    (img) => img.complete && img.naturalWidth > 0,
  ) as HTMLImageElement[];

  const decodificadas = Promise.all(
    imagenes.map(async (img) => {
      try {
        if (typeof img.decode === 'function') await img.decode();
      } catch {
        // Una imagen rota no debe impedir llegar al destino.
      }
    }),
  );

  await Promise.race([
    decodificadas,
    new Promise<void>((resolve) => window.setTimeout(resolve, 350)),
  ]);
};

export interface StableScrollTargetOptions {
  /** Id del elemento, sin `#`. `null` desactiva el hook. */
  targetId: string | null;
  /** Cambia cuando el usuario pulsa otro aviso sobre el mismo id. */
  token: number;
  /** Se llama una vez colocado el destino. */
  onDone?: () => void;
}

export function useStableScrollTarget({
  targetId,
  token,
  onDone,
}: StableScrollTargetOptions): void {
  const doneRef = useRef<string | null>(null);
  const correccionRef = useRef<(() => void) | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // La limpieza de la corrección vive aparte del efecto principal:
  // al consumir la URL, `targetId` pasa a null pero la posición
  // todavía puede necesitar una corrección si una imagen antigua
  // termina de cargar.
  useEffect(
    () => () => {
      correccionRef.current?.();
      correccionRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!targetId) return;

    const clave = `${token}:${targetId}`;
    if (doneRef.current === clave) return;

    // Si había una corrección del destino anterior, se retira antes
    // de empezar con el nuevo.
    correccionRef.current?.();
    correccionRef.current = null;

    let cancelado = false;
    // La corrección posterior tiene su propio ciclo: sobrevive a que
    // se consuma la URL (`targetId` pasa a null) para poder reaccionar
    // a una imagen antigua que termine de cargar después.
    let correccionCancelada = true;
    let observador: MutationObserver | null = null;
    let observadorTamano: ResizeObserver | null = null;

    const limpiarCorreccion = () => {
      observadorTamano?.disconnect();
      observadorTamano = null;
      correccionRef.current?.();
      correccionRef.current = null;
    };

    const colocar = async (el: HTMLElement) => {
      if (cancelado) return;

      // El artículo es el bloque completo del hilo: si cambia su
      // altura, cambia la posición del comentario dentro de él.
      const articulo = el.closest('article') ?? el;

      await esperarFuentes();
      if (cancelado) return;
      await esperarImagenesListas(articulo);
      if (cancelado) return;
      await esperarDisenoEstable(articulo);
      if (cancelado || !el.isConnected) return;

      // Un hilo entero es más alto que la pantalla: centrarlo deja
      // su título por encima del navbar. Para los hilos se alinea
      // el principio; para un comentario corto, centrarlo da más
      // contexto.
      const bloque = el.id.startsWith('thread-') ? 'start' : 'center';

      const mover = () => {
        const sinAnimacion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        el.scrollIntoView({
          // Deslizamiento suave al llegar. Si el sistema pide menos
          // movimiento, se salta directo para no marear.
          behavior: sinAnimacion ? 'auto' : 'smooth',
          block: bloque,
          inline: 'nearest',
        });
      };

      mover();
      doneRef.current = clave;

      // Si el destino se ha movido después de colocarlo, se corrige
      // sin animación. El usuario manda: en cuanto toca la rueda, el
      // teclado o la pantalla, se deja de corregir.
      limpiarCorreccion();
      correccionCancelada = false;
      let topReferencia = el.getBoundingClientRect().top;
      let correcciones = 0;
      let programado = 0;
      let usuarioMovio = false;

      const pararPorUsuario = () => {
        usuarioMovio = true;
        limpiarCorreccion();
      };

      window.addEventListener('wheel', pararPorUsuario, { passive: true });
      window.addEventListener('touchstart', pararPorUsuario, { passive: true });
      window.addEventListener('pointerdown', pararPorUsuario);
      window.addEventListener('keydown', pararPorUsuario);

      const quitarEscuchas = () => {
        window.removeEventListener('wheel', pararPorUsuario);
        window.removeEventListener('touchstart', pararPorUsuario);
        window.removeEventListener('pointerdown', pararPorUsuario);
        window.removeEventListener('keydown', pararPorUsuario);
      };

      observadorTamano = new ResizeObserver(() => {
        if (correccionCancelada || usuarioMovio || correcciones >= 2 || programado) return;

        programado = window.requestAnimationFrame(() => {
          programado = 0;
          if (correccionCancelada || usuarioMovio || correcciones >= 2) return;
          if (!el.isConnected) {
            limpiarCorreccion();
            return;
          }

          const top = el.getBoundingClientRect().top;
          if (Math.abs(top - topReferencia) <= 4) return;

          correcciones += 1;
          el.scrollIntoView({ behavior: 'auto', block: bloque, inline: 'nearest' });
          // Se vuelve a medir en el siguiente frame para no encadenar
          // scrolls con la posición vieja.
          window.requestAnimationFrame(() => {
            topReferencia = el.getBoundingClientRect().top;
          });
        });
      });

      observadorTamano.observe(articulo);

      correccionRef.current = () => {
        correccionCancelada = true;
        if (programado) {
          cancelAnimationFrame(programado);
          programado = 0;
        }
        observadorTamano?.disconnect();
        observadorTamano = null;
        quitarEscuchas();
      };

      onDoneRef.current?.();
    };

    const intentar = () => {
      if (cancelado) return;
      const el = document.getElementById(targetId);
      if (!el) return false;
      observador?.disconnect();
      observador = null;
      void colocar(el);
      return true;
    };

    if (!intentar()) {
      observador = new MutationObserver(() => {
        intentar();
      });
      observador.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      cancelado = true;
      observador?.disconnect();
      observador = null;
      // La corrección NO se limpia aquí: ver el efecto de arriba.
    };
  }, [targetId, token]);
}
